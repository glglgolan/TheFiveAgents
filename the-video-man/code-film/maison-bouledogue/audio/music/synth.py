"""
Maison Bouledogue -- pure-code synthesis toolkit (numpy / scipy only).

No samples, no soundfonts, no recorded audio, no ML: every instrument below is
an explicit DSP recipe (additive synthesis, Karplus-Strong waveguides, FM,
filtered noise, modal resonators) plus an algorithmic Freeverb-style reverb.
"""
import numpy as np
from functools import lru_cache
from scipy.signal import lfilter, butter, sosfilt, resample_poly
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
FPS = 24
SPF = SR // FPS            # 2000 samples per video frame
TOTAL_FRAMES = 1440
N_TOTAL = TOTAL_FRAMES * SPF
TWO_PI = 2.0 * np.pi


def S(frame):
    """frame (may be fractional) -> absolute sample index"""
    return int(round(frame * SPF))


def mtof(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def tt(n):
    return np.arange(n) / SR


def rng_for(*key):
    """deterministic RNG from any hashable key (FNV-1a over repr)."""
    h = 1469598103934665603
    for ch in repr(key).encode():
        h = ((h ^ ch) * 1099511628211) & 0xFFFFFFFFFFFFFFFF
    return np.random.default_rng(h)


def norm(x):
    p = np.max(np.abs(x))
    return x / p if p > 0 else x


# ----------------------------------------------------------------- filters
@lru_cache(maxsize=None)
def _sos(kind, f, order):
    f = list(f) if isinstance(f, tuple) else f
    return butter(order, f, btype=kind, fs=SR, output='sos')


def hp(x, f, order=2):
    return sosfilt(_sos('highpass', float(f), order), x, axis=-1)


def lp(x, f, order=2):
    return sosfilt(_sos('lowpass', float(f), order), x, axis=-1)


def bp(x, lo, hi, order=2):
    return sosfilt(_sos('bandpass', (float(lo), float(hi)), order), x, axis=-1)


def onepole(x, a):
    return lfilter([1 - a], [1, -a], x)


# ----------------------------------------------------------------- core oscillators
def additive(f, amp, bright, tilt=1.0, formant=None, kmax=48, seed=0, fmax=15000.0):
    """Band-limited harmonic oscillator.
    f, amp, bright: per-sample arrays.  Harmonic k gets weight k^-tilt * formant(k*f0)
    and a dynamic factor bright(t)^(k-1): brightness rises with the envelope,
    which is the classic brass / plucked 'filter-sweep' behaviour done additively."""
    ph = TWO_PI * np.cumsum(f) / SR
    fmed = float(np.median(f))
    K = max(1, min(kmax, int(fmax / max(fmed, 1.0))))
    r = np.random.default_rng(seed)
    out = np.zeros_like(f)
    bpow = np.ones_like(bright)
    nrm = 0.0
    for k in range(1, K + 1):
        w = k ** -tilt
        if formant is not None:
            w *= formant(k * fmed)
        # soft fade of the top harmonics to avoid a hard spectral edge
        if k * fmed > 0.8 * fmax:
            w *= max(0.0, (fmax - k * fmed) / (0.2 * fmax))
        out += w * bpow * np.sin(k * ph + r.uniform(0, TWO_PI))
        nrm += w * 0.7 ** (k - 1)
        bpow = bpow * bright
    return amp * out / max(nrm, 1e-9)


def ks_raw(f, n, t60=1.0, exc_lp=0.5, pick=0.12, seed=0):
    """Karplus-Strong plucked string with an allpass fractional delay (accurate tuning).
    Loop: y = x + g * z^-N * avg(1+z^-1)/2 * allpass(C)  -> one rational IIR run by lfilter."""
    P = SR / f
    N = int(P - 0.6)
    d = P - 0.5 - N
    C = (1 - d) / (1 + d)
    g = 10.0 ** (-3.0 / (f * t60))
    r = rng_for('ks', round(f, 3), seed)
    exc = r.uniform(-1, 1, N)
    if exc_lp > 0:
        exc = onepole(exc, exc_lp)
    k = max(1, int(pick * N))
    exc = exc - np.concatenate([np.zeros(k), exc[:-k]])
    exc -= exc.mean()
    x = np.zeros(n)
    m = min(N, n)
    x[:m] = exc[:m]
    a = np.zeros(N + 3)
    a[0] = 1.0
    a[1] = C
    a[N] -= g / 2 * C
    a[N + 1] -= g / 2 * (1 + C)
    a[N + 2] -= g / 2
    y = lfilter([1.0, C], a, x)
    return norm(y)


# ----------------------------------------------------------------- pitched instruments
@lru_cache(maxsize=8192)
def brass(m, dur, muted=True, bright=0.82, vib=1.0, att=0.018, rel=0.07, scoop=35.0,
          fall=0.0, seed=0):
    """Trumpet-ish additive brass. muted=True -> harmon-mute formant (1.5 kHz nasal peak).
    fall: pitch fall in cents over the second half of the note (jazz 'fall-off')."""
    f0 = mtof(m)
    n = int((dur + rel * 2 + 0.02) * SR)
    t = tt(n)
    a = 1 - np.exp(-t / att)
    body = 0.8 + 0.2 * np.exp(-t / 0.12)
    rl = np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel / 3)))
    amp = a * body * rl
    cents = -scoop * np.exp(-t / 0.03)
    vdepth = np.clip((t - 0.14) / 0.25, 0, 1) * 16 * vib
    cents = cents + vdepth * np.sin(TWO_PI * 5.4 * t + seed)
    if fall:
        cents = cents - fall * np.clip((t - dur * 0.45) / (dur * 0.55 + 1e-9), 0, 1) ** 2
    f = f0 * 2 ** (cents / 1200)
    b = bright * (0.3 + 0.7 * np.clip(amp, 0, 1) ** 1.3)
    if muted:
        form = lambda fk: 0.10 + np.exp(-((fk - 1500) / 600) ** 2) + 0.45 * np.exp(-((fk - 3300) / 900) ** 2)
    else:
        form = lambda fk: 0.55 + 0.8 * np.exp(-((fk - 1200) / 1000) ** 2)
    x = additive(f, amp, b, tilt=0.55, formant=form, seed=seed)
    r = rng_for('breath', m, seed)
    br = bp(r.standard_normal(n), 900, 4500) * np.exp(-t / 0.018) * 0.05
    return norm(x + br)


@lru_cache(maxsize=8192)
def pizz(m, dur=0.2, seed=0):
    """pizzicato string: dark KS pluck, short T60, finger-damped."""
    n = int((dur + 0.05) * SR)
    t = tt(n)
    y = ks_raw(mtof(m), n, t60=0.5, exc_lp=0.6, pick=0.2, seed=seed)
    y = lp(y, 5000)
    y *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.015))
    return norm(y)


@lru_cache(maxsize=8192)
def harpsi(m, dur=0.25, seed=0):
    """harpsichord: two bright KS strings (+-3 cents, plectrum near the nut) + quill click."""
    n = int((dur + 0.06) * SR)
    t = tt(n)
    f = mtof(m)
    t60 = float(np.clip(260.0 / f, 0.5, 3.0)) + 0.4
    y = ks_raw(f * 2 ** (3 / 1200), n, t60, 0.0, 0.07, seed) + 0.8 * ks_raw(f * 2 ** (-3 / 1200), n, t60, 0.05, 0.11, seed + 1)
    y = hp(y, 180)
    r = rng_for('quill', m, seed)
    click = hp(r.standard_normal(n), 3000) * np.exp(-t / 0.0015) * 0.35
    y = y + click
    y *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.02))
    return norm(y)


@lru_cache(maxsize=8192)
def upright(m, dur=0.45, slap=False, seed=0):
    """upright / slap bass: dark KS string + sine fundamental + finger thump."""
    n = int((dur + 0.08) * SR)
    t = tt(n)
    f = mtof(m)
    y = ks_raw(f, n, t60=1.4, exc_lp=0.8, pick=0.22, seed=seed)
    sub = np.sin(TWO_PI * f * t) * np.exp(-t / 0.45) * 0.9 + 0.3 * np.sin(2 * TWO_PI * f * t) * np.exp(-t / 0.18)
    r = rng_for('thump', m, seed)
    th = lp(r.standard_normal(n), 700) * np.exp(-t / 0.012) * 0.6
    x = 0.8 * y + sub + th
    if slap:
        x += 0.55 * ks_raw(f * 2, n, 0.25, 0.1, 0.1, seed + 7) * np.exp(-t / 0.08)
        x += hp(r.standard_normal(n), 2000) * np.exp(-t / 0.003) * 0.6
    x *= (1 - np.exp(-t / 0.002)) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.02))
    return norm(x)


@lru_cache(maxsize=8192)
def spluck(m, dur=0.25, decay=0.3, b0=0.9, b1=0.3, seed=0):
    """plucky synth (stereo, two detuned additive saws with decaying brightness)."""
    n = int((dur + 0.08) * SR)
    t = tt(n)
    f = np.full(n, mtof(m))
    amp = (1 - np.exp(-t / 0.002)) * np.exp(-t / decay) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.02))
    b = b1 + (b0 - b1) * np.exp(-t / 0.05)
    L = additive(f * 2 ** (5 / 1200), amp, b, tilt=1.0, seed=seed)
    R = additive(f * 2 ** (-5 / 1200), amp, b, tilt=1.0, seed=seed + 3)
    return norm(np.stack([L, R]))


def strings(notes, dur, att=0.3, rel=0.5, bright=0.6, trem=0.0, tremf=8.0, detune=8.0,
            glide=None, seed=0, swell=0.0):
    """ensemble string/pad: 3 detuned additive saws per note, spread L/C/R.
    glide: callable t->semitones offset. swell: extra crescendo exponent."""
    n = int((dur + rel * 3) * SR)
    t = tt(n)
    env = (1 - np.exp(-t / max(att, 1e-3))) * np.where(t < dur, 1.0, np.exp(-(t - dur) / rel))
    if swell:
        env *= np.clip(t / dur, 0, 1) ** swell
    if trem:
        env *= 1 - trem * 0.5 * (1 + np.sin(TWO_PI * tremf * t))
    gs = glide(t) if glide is not None else 0.0
    out = np.zeros((2, n))
    for i, m in enumerate(notes):
        for j, (dc, pl) in enumerate(((-detune, 0.15), (0.0, 0.5), (detune, 0.85))):
            f = mtof(m) * 2 ** ((dc + 100 * gs) / 1200) * np.ones(n)
            # slow random vibrato per voice
            f *= 2 ** (4 * np.sin(TWO_PI * (4.7 + 0.3 * j) * t + i + j) / 1200)
            v = additive(f, env, np.full(n, bright), tilt=1.0, seed=seed + 10 * i + j, kmax=30)
            out[0] += v * np.cos(pl * np.pi / 2)
            out[1] += v * np.sin(pl * np.pi / 2)
    return norm(out)


@lru_cache(maxsize=8192)
def celesta(m, dur=2.5, ratio=4.0, index=1.6, decay=1.0, seed=0):
    """FM bell/celesta: carrier f, modulator ratio*f with decaying index + a struck-bar partial."""
    f = mtof(m)
    n = int(dur * SR)
    t = tt(n)
    idx = index * (np.exp(-t / 0.05) * min(1.0, 1500.0 / f) + 0.12)
    mod = np.sin(TWO_PI * ratio * f * t)
    x = np.sin(TWO_PI * f * t + idx * mod) * np.exp(-t / decay)
    if 2.76 * f < 16000:
        x += 0.25 * np.sin(TWO_PI * 2.76 * f * t) * np.exp(-t / 0.15)
    if 5.4 * f < 16000:
        x += 0.12 * np.sin(TWO_PI * 5.4 * f * t) * np.exp(-t / 0.04)
    x *= 1 - np.exp(-t / 0.0012)
    return norm(x)


# ----------------------------------------------------------------- drums
@lru_cache(maxsize=None)
def kick(seed=0, punch=1.0):
    n = int(0.5 * SR)
    t = tt(n)
    f = 46 + (170 - 46) * np.exp(-t / 0.032)
    ph = TWO_PI * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.2) * (1 - np.exp(-t / 0.0008))
    r = rng_for('kick', seed)
    click = bp(r.standard_normal(n), 1500, 6000) * np.exp(-t / 0.003) * 0.35
    x = np.tanh(1.8 * punch * (body + click)) / np.tanh(1.8 * punch)
    return norm(x)


@lru_cache(maxsize=None)
def clap(seed=0):
    n = int(0.4 * SR)
    t = tt(n)
    r = rng_for('clap', seed)
    nz = bp(r.standard_normal(n), 900, 3000)
    env = np.zeros(n)
    for off in (0.0, 0.010, 0.021):
        env += np.where(t >= off, np.exp(-(t - off) / 0.005), 0)
    env += 0.55 * np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.09), 0)
    return norm(nz * env)


@lru_cache(maxsize=None)
def snare(seed=0, soft=False):
    n = int(0.35 * SR)
    t = tt(n)
    r = rng_for('snare', seed, soft)
    nz = bp(r.standard_normal(n), 1800, 9500) * np.exp(-t / (0.05 if soft else 0.12))
    tone = (0.6 * np.sin(TWO_PI * 185 * t) * np.exp(-t / 0.05) + 0.3 * np.sin(TWO_PI * 330 * t) * np.exp(-t / 0.03))
    x = nz + (0.25 if soft else 1.0) * tone
    x *= 1 - np.exp(-t / 0.0005)
    return norm(x)


@lru_cache(maxsize=None)
def hat(open_=False, seed=0):
    n = int((0.5 if open_ else 0.12) * SR)
    t = tt(n)
    r = rng_for('hat', seed)
    met = np.zeros(n)
    for fq in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0):
        met += np.sign(np.sin(TWO_PI * fq * t + r.uniform(0, 6.28)))
    x = hp(0.6 * met / 6 + r.standard_normal(n) * 0.7, 7000, 4)
    x *= np.exp(-t / (0.22 if open_ else 0.032)) * (1 - np.exp(-t / 0.0004))
    return norm(x)


@lru_cache(maxsize=None)
def crash(dur=2.6, seed=0):
    """stereo crash: decorrelated noise + inharmonic metallic partials, high-passed."""
    n = int(dur * SR)
    t = tt(n)
    out = []
    for ch in range(2):
        r = rng_for('crash', seed, ch)
        met = np.zeros(n)
        for fq in (342., 527., 811., 1123., 1487., 2113., 3359., 4411., 5237.):
            met += np.sin(TWO_PI * fq * r.uniform(0.97, 1.03) * t + r.uniform(0, 6.28)) * r.uniform(0.3, 1)
        x = hp(r.standard_normal(n) + 0.25 * met / 9 * np.sign(met), 3800, 2)
        env = (1 - np.exp(-t / 0.004)) * (0.55 * np.exp(-t / 0.22) + 0.45 * np.exp(-t / (dur / 2.2)))
        out.append(x * env)
    return norm(np.stack(out))


def reverse_cymbal(dur, seed=0):
    n = int(dur * SR)
    t = tt(n)
    out = []
    for ch in range(2):
        r = rng_for('rcym', seed, ch)
        x = hp(r.standard_normal(n), 4500, 2)
        out.append(x * (t / dur) ** 3)
    return norm(np.stack(out))


@lru_cache(maxsize=None)
def timp(m, dur=1.4, seed=0):
    """timpani: modal membrane (inharmonic mode ratios) + felt mallet thud."""
    f = mtof(m)
    n = int(dur * SR)
    t = tt(n)
    r = rng_for('timp', m, seed)
    ratios = (1.0, 1.504, 1.742, 2.0, 2.245, 2.494, 2.8)
    amps = (1.0, 0.55, 0.35, 0.3, 0.18, 0.12, 0.08)
    decs = (1.1, 0.7, 0.5, 0.45, 0.35, 0.3, 0.25)
    glide = 1 + 0.02 * np.exp(-t / 0.07)
    ph = TWO_PI * f * np.cumsum(glide) / SR
    x = np.zeros(n)
    for rt, a, d in zip(ratios, amps, decs):
        x += a * np.exp(-t / (d * dur / 1.4)) * np.sin(rt * ph + r.uniform(0, 6.28))
    x += lp(r.standard_normal(n), 500) * np.exp(-t / 0.015) * 1.2
    x *= 1 - np.exp(-t / 0.0015)
    return norm(x)


def sweep_noise(dur, f0, f1, bw_oct=1.0, seed=0, chunk=256, env=None):
    """band-passed noise whose centre sweeps exponentially f0->f1 (chunked, state carried)."""
    n = int(dur * SR)
    r = rng_for('sweep', seed)
    out = []
    for ch in range(2):
        x = r.standard_normal(n)
        y = np.zeros(n)
        zi = np.zeros((1, 2))
        for i in range(0, n, chunk):
            fc = f0 * (f1 / f0) ** (i / n)
            lo = fc / 2 ** (bw_oct / 2)
            hi = min(fc * 2 ** (bw_oct / 2), SR * 0.45)
            sos = butter(1, [lo, hi], btype='band', fs=SR, output='sos')
            seg, zi = sosfilt(sos, x[i:i + chunk], zi=zi)
            y[i:i + chunk] = seg / np.sqrt((hi - lo) / (SR / 2))
        out.append(y)
    y = norm(np.stack(out))
    if env is not None:
        y = y * env(tt(n))
    return y


# ----------------------------------------------------------------- tape / vinyl processing
def read_at(x, pos):
    """read stereo buffer x (2,n) at fractional positions pos (linear interpolation)."""
    pos = np.clip(pos, 0, x.shape[1] - 2)
    i = pos.astype(np.int64)
    fr = pos - i
    return x[:, i] * (1 - fr) + x[:, i + 1] * fr


def varispeed(x, rate, start=0.0):
    pos = start + np.concatenate([[0.0], np.cumsum(rate)[:-1]])
    return read_at(x, pos)


# ----------------------------------------------------------------- reverb (Freeverb topology)
def _comb(x, N, fb, damp):
    n = len(x)
    y = np.zeros(n)
    zi = np.zeros(1)
    for s in range(0, n, N):
        e = min(s + N, n)
        prev = y[s - N:e - N] if s >= N else np.zeros(e - s)
        z, zi = lfilter([1 - damp], [1, -damp], prev, zi=zi)
        y[s:e] = x[s:e] + fb * z
    return y


def _allpass(x, N, g=0.5):
    n = len(x)
    v = np.zeros(n)
    for s in range(0, n, N):
        e = min(s + N, n)
        prev = v[s - N:e - N] if s >= N else np.zeros(e - s)
        v[s:e] = x[s:e] + g * prev
    delayed = np.concatenate([np.zeros(N), v[:-N]])
    return delayed - x


@lru_cache(maxsize=None)
def freeverb_ir(room=0.84, damp=0.25, length=3.0, predelay=0.02, spread=23):
    """impulse response of a Freeverb network (8 damped combs + 4 allpasses per channel)."""
    sc = SR / 44100.0
    combs = (1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617)
    aps = (556, 441, 341, 225)
    fb = room * 0.28 + 0.7
    n = int(length * SR)
    imp = np.zeros(n)
    imp[int(predelay * SR)] = 1.0
    chans = []
    for ch in range(2):
        off = spread * ch
        acc = np.zeros(n)
        for c in combs:
            acc += _comb(imp, int((c + off) * sc), fb, damp)
        for a in aps:
            acc = _allpass(acc, int((a + off) * sc))
        chans.append(acc)
    ir = np.stack(chans)
    fade = np.ones(n)
    k = int(0.15 * n)
    fade[-k:] = np.linspace(1, 0, k) ** 2
    ir *= fade
    ir = hp(ir, 180)
    ir /= np.sqrt(np.sum(ir ** 2) / 2)
    return ir


# ----------------------------------------------------------------- dynamics
def compress(x, thr_db=-18.0, ratio=2.0, win=0.03, smooth=0.06):
    p = 0.5 * (x[0] ** 2 + x[1] ** 2)
    a = np.exp(-1 / (win * SR))
    env = np.sqrt(np.maximum(lfilter([1 - a], [1, -a], p), 1e-12))
    lvl = 20 * np.log10(env)
    gr = np.maximum(0.0, lvl - thr_db) * (1 - 1 / ratio)
    b = np.exp(-1 / (smooth * SR))
    gr = lfilter([1 - b], [1, -b], gr)
    return x * 10 ** (-gr / 20), gr


def true_peak_env(x, os=4):
    """per-sample max |x| over 4x-oversampled reconstruction (both channels)."""
    up = resample_poly(x, os, 1, axis=-1)
    m = np.max(np.abs(up), axis=0)
    m = m[: (len(m) // os) * os].reshape(-1, os).max(axis=1)
    out = np.max(np.abs(x), axis=0)
    out[: len(m)] = np.maximum(out[: len(m)], m)
    return out


def true_peak_db(x):
    return 20 * np.log10(np.max(true_peak_env(x)) + 1e-12)


def limit(x, ceiling_db=-1.8, look=0.004):
    """look-ahead brickwall limiter on true-peak; gain = moving-average of a min-filtered
    requirement, which provably never exceeds the requirement at any sample."""
    c = 10 ** (ceiling_db / 20)
    pk = true_peak_env(x)
    req = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    L = int(look * SR) | 1
    g = minimum_filter1d(req, size=2 * L + 1, mode='nearest')
    g = uniform_filter1d(g, size=L, mode='nearest')
    g = np.minimum(g, req)
    return x * g, g
