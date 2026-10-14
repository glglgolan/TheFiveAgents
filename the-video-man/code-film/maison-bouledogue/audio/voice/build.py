"""MAISON BOULEDOGUE voice + lip-sync build. 100% ML-free.

macOS `say` (classic non-neural voices) -> numpy/scipy/pedalboard DSP -> per-line WAVs,
dialogue stem, dialogue_timing.json, visemes.json (CMUdict + energy-envelope alignment).

Run:  python3 audio/voice/build.py      (from project root or anywhere)
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
import cmudict
from scipy.signal import resample_poly, fftconvolve, butter, sosfilt
from pedalboard import (Pedalboard, PitchShift, HighpassFilter, LowpassFilter, LowShelfFilter,
                        HighShelfFilter, PeakFilter, Compressor, Distortion, Limiter, Gain)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from lines import CAST, LINES, EXTRA  # noqa: E402

SR = 48000
FPS = 24
SPF = SR // FPS            # samples per frame = 2000
TOTAL = 1440
AIR = 4                    # frames of air before maxEnd
TARGET_LUFS = -16.0
RAW = os.path.join(HERE, 'raw'); os.makedirs(RAW, exist_ok=True)
OUTV = os.path.join(ROOT, 'public', 'audio', 'voice'); os.makedirs(OUTV, exist_ok=True)

TL = json.load(open(os.path.join(ROOT, 'src', 'data', 'timeline.json')))['dialogue']

# ---------------------------------------------------------------- say rendering
_cache = {}
def say(voice, rate, text, tag):
    key = (voice, rate, text)
    if key in _cache:
        return _cache[key]
    fn = os.path.join(RAW, f'{tag}.wav')
    subprocess.run(['say', '-v', voice, '--data-format=LEI16@48000', '-o', fn,
                    f'[[rate {rate}]] ' + text], check=True)
    d, r = sf.read(fn, dtype='float32')
    assert r == SR
    if d.ndim > 1:
        d = d.mean(1)
    _cache[key] = d
    return d

def spoken_text(tokens, pause_scale=1.0, upto=None):
    parts = []
    toks = tokens if upto is None else tokens[:upto]
    for i, (_, sp, pause) in enumerate(toks):
        parts.append(sp)
        if pause and (upto is None or i < upto - 1):
            parts.append(f'[[slnc {int(pause * pause_scale)}]]')
    return ' '.join(parts)

def active_bounds(x, rel=0.02):
    a = np.abs(x)
    thr = rel * a.max()
    idx = np.where(a > thr)[0]
    return (idx[0], idx[-1] + 1) if len(idx) else (0, len(x))

# ---------------------------------------------------------------- DSP chains
MOUSE_SEMI = 5.0
BULL_SEMI = -4.0
ANN_SEMI = -2.0

def mouse_resample(x):
    # tape-speed pitch shift: formants rise too -> tiny body. Shortens duration by 2^(-5/12)
    k = 2 ** (MOUSE_SEMI / 12)
    up, down = 1000, int(round(1000 * k))
    return resample_poly(x, up, down).astype(np.float32)

def chain_bulldog(x):
    x = Pedalboard([PitchShift(semitones=BULL_SEMI)])(x[None, :], SR)[0]
    # parallel growl: band-limited saturation, amplitude-modulated at ~34 Hz (vocal-fry rattle)
    band = Pedalboard([HighpassFilter(140), LowpassFilter(2600)])(x[None, :], SR)[0]
    grit = Pedalboard([Distortion(drive_db=22), LowpassFilter(3500)])(band[None, :], SR)[0]
    t = np.arange(len(x)) / SR
    grit *= (0.55 + 0.45 * np.sin(2 * np.pi * 34 * t)).astype(np.float32)
    grit *= np.abs(x).max() / (np.abs(grit).max() + 1e-9)
    x = x + 0.22 * grit
    board = Pedalboard([
        HighpassFilter(65), LowShelfFilter(cutoff_frequency_hz=190, gain_db=5.0),
        PeakFilter(cutoff_frequency_hz=420, gain_db=-2.5, q=1.0),
        PeakFilter(cutoff_frequency_hz=2800, gain_db=2.5, q=0.9),
        LowpassFilter(9000),
        Compressor(threshold_db=-22, ratio=3.5, attack_ms=4, release_ms=90),
    ])
    return board(x[None, :], SR)[0]

def chain_mouse(x):
    x = mouse_resample(x)
    board = Pedalboard([
        HighpassFilter(220), PeakFilter(cutoff_frequency_hz=900, gain_db=-2.0, q=1.2),
        HighShelfFilter(cutoff_frequency_hz=4500, gain_db=4.0),
        PeakFilter(cutoff_frequency_hz=3200, gain_db=2.0, q=1.0),
        Compressor(threshold_db=-24, ratio=4, attack_ms=2, release_ms=60),
    ])
    return board(x[None, :], SR)[0]

def hall_ir(seconds=2.4, rt60=1.9, seed=7):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = 10 ** (-3 * t / rt60)
    ir = np.zeros((2, n), np.float32)
    for ch in range(2):
        noise = rng.standard_normal(n)
        # progressively darker tail: blend of bright and low-passed noise
        sos = butter(2, 2500, 'low', fs=SR, output='sos')
        dark = sosfilt(sos, noise)
        mixw = np.clip(t / 0.8, 0, 1)
        ir[ch] = ((1 - mixw) * noise * 0.6 + mixw * dark * 1.4) * env
    pre = int(0.028 * SR)
    ir = np.concatenate([np.zeros((2, pre), np.float32), ir], 1)
    # early reflections (grand salon walls)
    for d, g, pan in [(0.011, 0.5, 0), (0.019, 0.42, 1), (0.031, 0.35, 0), (0.043, 0.3, 1), (0.061, 0.22, 0)]:
        ir[pan, int(d * SR)] += g
    ir /= np.sqrt((ir ** 2).sum(1, keepdims=True))
    return ir

IR = hall_ir()

def chain_announcer_dry(x):
    x = Pedalboard([PitchShift(semitones=ANN_SEMI)])(x[None, :], SR)[0]
    board = Pedalboard([  # vintage PA horn: band-limited, honky mids, a little horn breakup
        HighpassFilter(280), HighpassFilter(280), LowpassFilter(5200), LowpassFilter(5200),
        PeakFilter(cutoff_frequency_hz=1700, gain_db=5.0, q=1.1),
        PeakFilter(cutoff_frequency_hz=600, gain_db=2.0, q=0.8),
        Distortion(drive_db=6), Gain(-6),
        Compressor(threshold_db=-20, ratio=3, attack_ms=5, release_ms=120),
    ])
    return board(x[None, :], SR)[0]

def announcer_stereo(dry, tail_s=1.6):
    pad = np.concatenate([dry, np.zeros(int(tail_s * SR), np.float32)])
    wet = np.stack([fftconvolve(pad, IR[0])[:len(pad)], fftconvolve(pad, IR[1])[:len(pad)]])
    wet *= (np.abs(pad).max() / (np.abs(wet).max() + 1e-9)) * 0.55
    # dry slightly wide: 7 ms Haas on right at low level
    haas = int(0.007 * SR)
    dryR = np.concatenate([np.zeros(haas, np.float32), pad[:-haas]])
    L = pad * 0.85 + dryR * 0.0 + wet[0]
    R = pad * 0.70 + dryR * 0.2 + wet[1]
    out = np.stack([L, R], 1).astype(np.float32)
    fade = int(0.35 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return out

def process(ch, raw):
    if ch == 'bulldog':
        return chain_bulldog(raw)
    if ch == 'mouse':
        return chain_mouse(raw)
    return chain_announcer_dry(raw)

TIME_SCALE = {'mouse': 2 ** (-MOUSE_SEMI / 12), 'bulldog': 1.0, 'announcer': 1.0}

meter = pyln.Meter(SR)
CEIL = 10 ** (-1.5 / 20)

def peak_limit(y):
    """Feed-forward peak limiter: 2 ms lookahead, instant attack, 80 ms release. Pure numpy."""
    mono = np.abs(y).max(1) if y.ndim == 2 else np.abs(y)
    need = np.minimum(1.0, CEIL / (mono + 1e-9))
    la = int(0.002 * SR)
    need = _minfilt(need, la)
    rel = np.exp(-1 / (0.08 * SR))
    g = np.empty_like(need); cur = 1.0
    for i, v in enumerate(need):
        cur = v if v < cur else v + (cur - v) * rel
        g[i] = cur
    return (y * (g[:, None] if y.ndim == 2 else g)).astype(np.float32)

def _minfilt(x, w):
    from scipy.ndimage import minimum_filter1d
    return minimum_filter1d(x, size=2 * w + 1, mode='nearest')

def loudnorm(x):
    lufs0 = meter.integrated_loudness(x)
    y = x.astype(np.float64)
    for _ in range(3):
        y = y * (10 ** ((TARGET_LUFS - meter.integrated_loudness(y)) / 20))
        y = peak_limit(y).astype(np.float64)
    return y.astype(np.float32), lufs0

# ---------------------------------------------------------------- phonemes
CMU = cmudict.dict()
VOWELS = {'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'}

def lts(word):
    """Tiny rule-based letter-to-sound fallback (no ML)."""
    w = word.lower()
    rules = [('tion', ['SH', 'AH0', 'N']), ('ch', ['CH']), ('sh', ['SH']), ('th', ['TH']), ('ph', ['F']),
             ('ee', ['IY1']), ('oo', ['UW1']), ('ou', ['UW1']), ('ai', ['EY1']), ('ea', ['IY1']),
             ('ng', ['NG']), ('ck', ['K']), ('qu', ['K', 'W'])]
    single = {'a': 'AE1', 'e': 'EH1', 'i': 'IH1', 'o': 'AA1', 'u': 'AH1', 'y': 'IY0', 'b': 'B', 'c': 'K',
              'd': 'D', 'f': 'F', 'g': 'G', 'h': 'HH', 'j': 'JH', 'k': 'K', 'l': 'L', 'm': 'M', 'n': 'N',
              'p': 'P', 'r': 'R', 's': 'S', 't': 'T', 'v': 'V', 'w': 'W', 'x': 'K', 'z': 'Z'}
    out, i = [], 0
    while i < len(w):
        for pat, ph in rules:
            if w.startswith(pat, i):
                out += ph; i += len(pat); break
        else:
            if w[i] in single and not (w[i] == 'e' and i == len(w) - 1 and len(w) > 2):
                out.append(single[w[i]])
            i += 1
    return out

def phonemes(word):
    w = re.sub(r'[^a-z]', '', word.lower())
    if w in EXTRA:
        return EXTRA[w].split()
    if w in CMU:
        return CMU[w][0]
    return lts(w)

SHAPE = {}
for p in ['P', 'B', 'M']: SHAPE[p] = 'A'
for p in ['F', 'V']: SHAPE[p] = 'G'
SHAPE['L'] = 'H'
for p in ['UW', 'OW', 'W', 'UH', 'OY']: SHAPE[p] = 'F'
for p in ['AO', 'ER', 'R']: SHAPE[p] = 'E'
for p in ['AA', 'AY', 'AW']: SHAPE[p] = 'D'
for p in ['AH', 'EH', 'AE', 'EY']: SHAPE[p] = 'C'
for p in ['IY', 'IH', 'Y']: SHAPE[p] = 'B'
for p in ['T', 'D', 'K', 'G', 'S', 'Z', 'N', 'NG', 'TH', 'DH', 'CH', 'JH', 'SH', 'ZH', 'HH']: SHAPE[p] = 'B'

def ph_weight(p):
    base = re.sub(r'\d', '', p)
    if base in VOWELS:
        return 2.1 if p.endswith('1') else 1.5
    if base in ('P', 'B', 'T', 'D', 'K', 'G'): return 0.75
    if base in ('M', 'N', 'NG', 'L', 'R', 'W', 'Y'): return 0.9
    return 1.0

# ---------------------------------------------------------------- energy envelope
HOP = 240  # 5 ms
def env_db(x):
    n = len(x) // HOP
    fr = x[:n * HOP].reshape(n, HOP)
    rms = np.sqrt((fr ** 2).mean(1) + 1e-12)
    return 20 * np.log10(rms + 1e-9)

def snap_to_dip(e, t, radius_s=0.045):
    """Move time t (s) to the lowest-energy 5ms hop within +/-radius."""
    c = int(t * SR / HOP); r = int(radius_s * SR / HOP)
    lo, hi = max(0, c - r), min(len(e) - 1, c + r)
    if hi <= lo: return t
    seg = e[lo:hi + 1]
    # prefer the dip but penalise distance slightly
    cost = seg + 0.08 * np.abs(np.arange(lo, hi + 1) - c)
    return (lo + int(np.argmin(cost))) * HOP / SR

# ---------------------------------------------------------------- per line
def render_line(L, rate, pause_scale):
    ch = L['char']; voice = CAST[ch]['voice']; toks = LINES[L['id']]
    raw = say(voice, rate, spoken_text(toks, pause_scale), f"{L['id']}_r{rate}_p{int(pause_scale*100)}")
    a, b = active_bounds(raw)
    return raw, a, b

def build_line(L):
    ch = L['char']; voice = CAST[ch]['voice']; toks = LINES[L['id']]
    budget = (L['maxEnd'] - AIR - L['start']) / FPS  # seconds
    rate, pscale = CAST[ch]['rate'], 1.0
    soft_cap = CAST[ch].get('soft_cap', 200)
    budget -= 0.07  # processing adds ~30 ms post-roll + pitch-shift smear
    for _ in range(40):
        raw, a, b = render_line(L, rate, pscale)
        dur = (b - a) / SR * TIME_SCALE[ch]
        if dur <= budget: break
        if rate < soft_cap:
            rate = int(min(soft_cap, rate * min(1.2, max(1.03, (dur / budget) ** 1.3))))
        elif pscale > 0.62:
            pscale = round(pscale - 0.08, 2)
        else:
            rate = int(rate * 1.04)
    # word end times via prefix renders (same voice / rate / pauses -> in-context durations)
    word_ends = []
    for k in range(1, len(toks) + 1):
        if k == len(toks):
            word_ends.append((b - a) / SR); break
        pr = say(voice, rate, spoken_text(toks, pscale, upto=k), f"{L['id']}_r{rate}_p{int(pscale*100)}_k{k}")
        pa, pb = active_bounds(pr)
        word_ends.append((pb - pa) / SR)
    raw_seg = raw[max(0, a - 240): b + 2400]  # 5 ms pre-roll, 50 ms post
    proc = process(ch, raw_seg)
    ts = TIME_SCALE[ch]
    # onset/offset in processed audio
    pa, pb = active_bounds(proc, rel=0.03)
    pa = max(0, pa - 120)
    pb = min(len(proc), pb + int(0.03 * SR))
    body = proc[pa:pb].copy()
    fi = int(0.004 * SR); body[:fi] *= np.linspace(0, 1, fi)
    fo = int(0.02 * SR); body[-fo:] *= np.linspace(1, 0, fo)
    voiced_dur = len(body) / SR
    if ch == 'announcer':
        out = announcer_stereo(body)
    else:
        out = body
    out, pre_lufs = loudnorm(out)
    # timing in seconds relative to line onset (scaled for tape-speed mouse)
    word_ends = [min(voiced_dur, w * ts) for w in word_ends]
    return dict(rate=rate, pscale=pscale, audio=out, voiced=body, voiced_dur=voiced_dur,
                word_ends=word_ends, lufs_in=pre_lufs)

def enforce_min2(shapes):
    for _ in range(500):
        runs = []
        for sh in shapes:
            if runs and runs[-1][0] == sh: runs[-1][1] += 1
            else: runs.append([sh, 1])
        short = [i for i, (_, n) in enumerate(runs) if n < 2]
        if not short or len(runs) == 1: break
        ri = short[0]; sh = runs[ri][0]
        prev = runs[ri - 1][1] if ri > 0 else -1
        nxt = runs[ri + 1][1] if ri + 1 < len(runs) else -1
        if sh == 'A' and max(prev, nxt) >= 3:
            tgt = ri + 1 if nxt >= 3 else ri - 1
            runs[tgt][1] -= 1; runs[ri][1] += 1
        elif sh == 'A':
            tgt = ri - 1 if prev >= nxt else ri + 1       # absorb weak neighbour into the closure
            runs[ri][1] += runs[tgt][1]; runs[tgt][1] = 0
        else:
            tgt = ri - 1 if prev >= nxt else ri + 1       # merge into longer neighbour
            runs[tgt][1] += 1; runs[ri][1] = 0
        shapes = [s for s, n in runs for _ in range(n)]
    return shapes

def visemes_for(L, R):
    toks = LINES[L['id']]
    x = R['voiced']
    e = env_db(x)
    peak = np.percentile(e, 97)
    sil_thr = peak - 32
    # word boundaries: snap predicted ends to energy dips; starts = end of prev (or onset after silence)
    ends = [snap_to_dip(e, t) for t in R['word_ends'][:-1]] + [R['voiced_dur']]
    ends = list(np.maximum.accumulate(ends))
    words = []
    t0 = 0.0
    for i, (disp, _, pause) in enumerate(toks):
        t1 = ends[i]
        # skip leading silence inside the word window (pause gap)
        h0, h1 = int(t0 * SR / HOP), max(int(t0 * SR / HOP) + 1, int(t1 * SR / HOP))
        seg = e[h0:h1]
        loud = np.where(seg > sil_thr)[0]
        if len(loud):
            s = t0 + loud[0] * HOP / SR
            f = t0 + (loud[-1] + 1) * HOP / SR
        else:
            s, f = t0, t1
        words.append((disp, s, max(f, s + 0.05)))
        t0 = t1
    # phoneme intervals
    ph_iv = []
    for disp, s, f in words:
        phs = phonemes(disp)
        wts = np.array([ph_weight(p) for p in phs])
        cuts = s + (f - s) * np.concatenate([[0], np.cumsum(wts) / wts.sum()])
        for p, c0, c1 in zip(phs, cuts[:-1], cuts[1:]):
            ph_iv.append((re.sub(r'\d', '', p), c0, c1))
    nfr = int(np.ceil(R['voiced_dur'] * FPS))
    shapes = []
    hops_per_frame = SPF // HOP
    for fidx in range(nfr):
        a, b = fidx / FPS, (fidx + 1) / FPS
        score = {}
        for p, c0, c1 in ph_iv:
            ov = min(b, c1) - max(a, c0)
            if ov <= 0: continue
            sh = SHAPE.get(p, 'B')
            w = ov * (2.5 if sh == 'A' else 1.0)  # plosive closure must read
            score[sh] = score.get(sh, 0) + w
        sh = max(score, key=score.get) if score else 'X'
        fe = e[fidx * hops_per_frame:(fidx + 1) * hops_per_frame]
        lvl = fe.max() if len(fe) else -120
        if lvl < sil_thr:
            sh = 'S'  # silent, decided below
        elif sh in 'CD' and lvl > peak - 4:
            sh = 'D'
        elif sh == 'D' and lvl < peak - 16:
            sh = 'C'
        elif sh == 'C' and lvl < peak - 22:
            sh = 'B'
        shapes.append(sh)
    # silent runs: >=4 frames -> X (rest), shorter -> A (lips meet)
    i = 0
    while i < len(shapes):
        if shapes[i] == 'S':
            j = i
            while j < len(shapes) and shapes[j] == 'S': j += 1
            fill = 'X' if (j - i) >= 4 else 'A'
            for k in range(i, j): shapes[k] = fill
            i = j
        else:
            i += 1
    # enforce min 2 frames per shape (plosive A closures are protected: they steal a frame)
    shapes = enforce_min2(shapes)
    # keyframes, 1 frame early, end with X
    keys = []
    start = L['start'] - 1
    for fidx, sh in enumerate(shapes):
        if not keys or keys[-1][1] != sh:
            keys.append([start + fidx, sh])
    keys.append([start + len(shapes), 'X'])
    if keys[-2][1] == 'X': keys.pop()
    return keys, words

# ---------------------------------------------------------------- main
CHAIN_DESC = {
    'bulldog': f'PitchShift {BULL_SEMI:+.0f} st (RubberBand) -> parallel growl (140-2600 Hz band, Distortion 22 dB, 34 Hz AM fry, 22%) -> HPF 65 / LowShelf 190 Hz +5 / Peak 420 Hz -2.5 / Peak 2.8 kHz +2.5 / LPF 9k -> Compressor -22 dB 3.5:1 -> -16 LUFS, Limiter -1.5',
    'mouse': f'tape-speed resample +{MOUSE_SEMI:.0f} st (formants up) -> HPF 220 / Peak 900 -2 / Peak 3.2k +2 / HighShelf 4.5k +4 -> Compressor -24 dB 4:1 -> -16 LUFS, Limiter -1.5 (dry close mic)',
    'announcer': f'PitchShift {ANN_SEMI:+.0f} st -> PA horn band 280 Hz-5.2 kHz (24 dB/oct), Peak 1.7k +5, Peak 600 +2, Distortion 6 dB -> Compressor -20 3:1 -> synthetic stereo hall IR (RT60 1.9 s, 28 ms predelay, early reflections) convolution -> -16 LUFS, Limiter -1.5',
}

def main():
    timing, vis = [], {'bulldog': [], 'mouse': [], 'announcer': []}
    stem = np.zeros((TOTAL * SPF, 2), np.float32)
    report = []
    for L in TL:
        R = build_line(L)
        out = R['audio']
        fn = os.path.join(OUTV, f"{L['id']}.wav")
        sf.write(fn, out, SR, subtype='PCM_16')
        end = L['start'] + int(np.ceil(R['voiced_dur'] * FPS))
        keys, words = visemes_for(L, R)
        vis[L['char']] += keys
        # place in stem
        pos = L['start'] * SPF
        st = out if out.ndim == 2 else np.stack([out, out], 1) * np.float32(10 ** (-3 / 20))  # -3 dB pan law centre
        n = min(len(st), len(stem) - pos)
        stem[pos:pos + n] += st[:n]
        lufs = meter.integrated_loudness(out)
        peak = 20 * np.log10(np.abs(out).max() + 1e-9)
        timing.append(dict(id=L['id'], char=L['char'], start=L['start'], end=end, maxEnd=L['maxEnd'],
                           file=f"audio/voice/{L['id']}.wav", text=L['text'],
                           spoken=spoken_text(LINES[L['id']], R['pscale']),
                           voice=CAST[L['char']]['voice'], rate=R['rate'], chain=CHAIN_DESC[L['char']],
                           words=[[w, round(L['start'] + s * FPS, 2), round(L['start'] + f * FPS, 2)] for w, s, f in words]))
        report.append(f"{L['id']} {L['char']:9s} start {L['start']:4d} end {end:4d} maxEnd {L['maxEnd']:4d} air {L['maxEnd']-end:2d}  rate {R['rate']} pscale {R['pscale']:.2f}  LUFS {lufs:6.1f} peak {peak:5.1f} dBFS  file {len(out)/SR:.2f}s")
    for k in vis: vis[k].sort(key=lambda kv: kv[0])
    fo = int(0.5 * SR); stem[-fo:] *= np.linspace(1, 0, fo)[:, None]
    stem = np.clip(stem, -1, 1)
    sf.write(os.path.join(ROOT, 'public', 'audio', 'dialogue.wav'), stem, SR, subtype='PCM_16')
    json.dump(timing, open(os.path.join(ROOT, 'src', 'data', 'dialogue_timing.json'), 'w'), indent=1, ensure_ascii=False)
    with open(os.path.join(ROOT, 'src', 'data', 'visemes.json'), 'w') as f:
        f.write('{\n' + ',\n'.join(f' "{k}": ' + json.dumps(v) for k, v in vis.items()) + '\n}\n')
    print('\n'.join(report))
    print('stem', stem.shape, len(stem) / SR, 's')

if __name__ == '__main__':
    main()
