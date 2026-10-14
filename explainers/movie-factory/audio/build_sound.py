#!/usr/bin/env python3
"""Full soundtrack for the "movie factory" explainer — music + SFX 100% code; VO from ElevenLabs.

VO      : ElevenLabs eleven_v4, voice "Maya" — one approved take per stage (vo/maya60/s0..s5.wav)
Music   : synthesized score (plucks, bells, pad, bass, light drums), layers added per stage
SFX     : synthesized paper/thread foley locked to the transition timeline
Mix     : static gains + scripted level automation (no AGC / loudnorm), peak limiter

Outputs (audio/out/):
  timeline.json   — exact start/end of every line, gap and event (drives the Remotion build)
  vo_only.wav, music_only.wav, sfx_only.wav, full_mix.wav (+ .m4a for listening)
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
from pedalboard import Pedalboard, HighpassFilter, Compressor, PeakFilter, Reverb, Limiter

ROOT = Path(__file__).resolve().parents[1]
VO_DIR, OUT = ROOT / "vo", ROOT / "audio" / "out"
OUT.mkdir(parents=True, exist_ok=True)
SR = 44100
VO_TAKES = VO_DIR / (sys.argv[1] if len(sys.argv) > 1 else "maya60")
STAGES = ["hook", "storyboard", "images", "video", "sound", "finale"]

PRE, GAP, TAIL = 0.8, 0.9, 1.6       # intro, stage transition (tear), outro — tuned for a ~60s cut
BPM = 100
BEAT = 60 / BPM
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- VO
def render_vo():
    clips = []
    for i, stage in enumerate(STAGES):
        x, sr = sf.read(VO_TAKES / f"s{i}.wav", dtype="float32")
        assert sr == SR
        if x.ndim > 1: x = x.mean(1)
        idx = np.where(np.abs(x) > 0.01)[0]
        x = x[max(0, idx[0] - 800): idx[-1] + 3000]          # trim edge silence, keep breaths
        clips.append((f"s{i}", stage, x))
    return clips

def first_pause(x, min_gap=0.25, after=0.3):
    """End time of the first silent gap in a line (used to time the music re-entry after "הסאונד...")."""
    env = np.convolve(np.abs(x), np.ones(441) / 441, mode="same") > 0.01
    start = int(after * SR); run = 0
    for k in range(start, len(env)):
        run = run + 1 if not env[k] else 0
        if run >= min_gap * SR and k + 1 < len(env) and env[k + 1]:
            return (k + 1) / SR
    return 1.4

def polish_vo(x):
    board = Pedalboard([HighpassFilter(80)])                 # Maya is already studio-clean
    return board(x[None, :].astype(np.float32), SR)[0]

# ---------------------------------------------------------------- timeline
def build_timeline(clips):
    t, lines, events = PRE, [], []
    events.append({"type": "sew", "t": 0.25, "dur": 1.2, "stage": 0})
    for i, (lid, stage, x) in enumerate(clips):
        d = len(x) / SR
        lines.append({"id": lid, "stage": stage, "start": round(t, 3), "end": round(t + d, 3)})
        if i > 0:
            events.append({"type": "sew", "t": t + 0.05, "dur": 1.5, "stage": i})
        t += d
        if i < len(clips) - 1:
            g = t - 0.25                                    # thread pulls under the last word
            events += [{"type": "pull", "t": g, "stage": i},
                       {"type": "tear", "t": g + 0.3, "stage": i},
                       {"type": "light", "t": g + 0.4, "stage": i},
                       {"type": "whoosh", "t": g + 0.5, "stage": i},
                       {"type": "land", "t": g + 1.0, "stage": i + 1}]
            t += GAP
    events.append({"type": "final", "t": t + 0.15})
    total = t + TAIL
    return {"vo": VO_TAKES.name, "pre": PRE, "gap": GAP, "total": round(total, 3),
            "lines": lines, "events": [{**e, "t": round(e["t"], 3)} for e in events]}

# ---------------------------------------------------------------- DSP helpers
def tt(d): return np.arange(int(d * SR)) / SR
def env_ad(n, a, d):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    return e * np.exp(-np.maximum(0, np.arange(n) / SR - a) / d)
def bp(x, lo, hi, order=4): return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(4, f, "high", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(4, f, "low", fs=SR, output="sos"), x)
def add(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l * 1.414
    buf[i:i + len(x), 1] += x * gain * r * 1.414
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------- instruments
def pluck(f, d=0.9):
    t = tt(d); x = sum(np.sin(2 * np.pi * k * f * t) * np.exp(-t * (4 + 3 * k)) / k for k in range(1, 7))
    return x * env_ad(len(t), 0.002, 0.35)
def bell(f, d=2.2):
    t = tt(d)
    return (np.sin(2*np.pi*f*t)*np.exp(-t*1.6) + .5*np.sin(2*np.pi*2.76*f*t)*np.exp(-t*3)
            + .25*np.sin(2*np.pi*5.4*f*t)*np.exp(-t*6)) * env_ad(len(t), 0.001, 5)
def pad(freqs, d):
    t = tt(d); x = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            x += np.sin(2*np.pi*ff*t) + 0.3*np.sin(2*np.pi*2*ff*t) + 0.12*np.sin(2*np.pi*3*ff*t)
    a = min(0.5, d / 3); e = np.minimum(1, np.minimum(t / a, (d - t) / a))
    return lp(x * e, 2200) / (len(freqs) * 3)
def bass(f, d):
    t = tt(d); return (np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*2*f*t)) * env_ad(len(t), 0.01, 0.5)
def kick():
    t = tt(0.45); ph = 2*np.pi*np.cumsum(45 + 80*np.exp(-t*25)) / SR
    return np.sin(ph) * np.exp(-t * 9)
def shaker():
    return hp(rng.standard_normal(int(0.07*SR)), 6000) * env_ad(int(0.07*SR), 0.004, 0.02)
def clap():
    n = int(0.25*SR); x = bp(rng.standard_normal(n), 900, 4000) * env_ad(n, 0.001, 0.06)
    for k in (0.011, 0.022): x[int(k*SR):] += 0.6 * x[: n - int(k*SR)]
    return x * 0.5

# progression I–vi–IV–V in D: (root midi, chord midis)
PROG = [(50, [62, 66, 69]), (47, [59, 62, 66]), (43, [55, 59, 62]), (45, [57, 61, 64])]
MELODY = [74, 76, 78, 81, 78, 76, 74, 73]   # bell motif (D major)

def render_music(tl):
    total = tl["total"]; buf = np.zeros((int(total * SR) + SR, 2))
    lines = tl["lines"]
    stage_start = [0.0] + [l["start"] - GAP + 0.1 for l in lines[1:]]
    def stage_at(t): return max(i for i, s in enumerate(stage_start) if s <= t + 1e-6)
    s4 = lines[4]["start"]
    drop = (s4 - 0.35, s4 + tl["s4_reentry"])   # "הסאונד..." — the music holds its breath
    end_music = tl["events"][-1]["t"]
    nbeats = int(end_music / BEAT)
    for b in range(nbeats):
        t = b * BEAT
        if drop[0] <= t < drop[1]: continue
        st = stage_at(t); bar, beat = divmod(b, 4)
        root, chord = PROG[bar % 4]
        if beat == 0:
            add(buf, pad([mtof(m) for m in chord], 4 * BEAT + 0.4), t, 0.55)
        # pluck: quarters from stage 0, eighth-note arpeggio from stage 1
        add(buf, pluck(mtof(chord[beat % 3] + 12)), t, 0.22, pan=-0.3)
        if st >= 1:
            add(buf, pluck(mtof(chord[(beat + 1) % 3] + 12)), t + BEAT / 2, 0.15, pan=0.3)
        if st >= 2 and beat in (0, 2) and bar % 2 == 0:
            add(buf, bell(mtof(MELODY[(bar * 2 + beat // 2) % len(MELODY)])), t, 0.10, pan=0.15)
        if st >= 3:
            add(buf, bass(mtof(root - 12), BEAT * 0.9), t, 0.45)
            if beat in (0, 2): add(buf, kick(), t, 0.55)
            add(buf, shaker(), t + BEAT / 2, 0.12, pan=0.4)
        if st >= 4 and beat in (1, 3):
            add(buf, clap(), t, 0.35, pan=-0.1)
    # drop re-entry: a bell + kick hit exactly when the music comes back
    add(buf, bell(mtof(86), 3.0), drop[1], 0.18); add(buf, kick(), drop[1], 0.6)
    # final chord (D major, wide) on the last word
    fin = end_music
    add(buf, pad([mtof(m) for m in (50, 57, 62, 66, 69, 74)], TAIL + 0.3), fin, 0.9)
    for k, m in enumerate((74, 78, 81, 86)): add(buf, bell(mtof(m), 3.2), fin + k * 0.09, 0.12, pan=-0.3 + k * 0.2)
    add(buf, kick(), fin, 0.7)
    return buf[: int(total * SR)]

# ---------------------------------------------------------------- SFX (paper + thread foley)
def sfx_stitch():                     # needle through paper: tiny pop + fibre tick
    n = int(0.05*SR); x = hp(rng.standard_normal(n), 2500) * env_ad(n, 0.0005, 0.006)
    return x + 0.3 * bp(rng.standard_normal(n), 300, 900) * env_ad(n, 0.001, 0.01)
def sfx_pull(d=0.45):                 # thread drawn taut: rising filtered zip
    n = int(d*SR); x = rng.standard_normal(n); t = np.arange(n) / SR
    out = np.zeros(n); seg = int(0.03*SR)
    for i in range(0, n - seg, seg):
        f = 1200 + 3000 * (i / n); out[i:i+seg] = bp(x[i:i+seg], f, f * 1.6, 2)
    return out * np.sin(np.pi * t / d) ** 0.5
def sfx_tear(d=0.8):                  # paper rip: grain crackle + body, accelerating
    n = int(d*SR); t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1200, 7000)
    grains = np.zeros(n)
    k = 0.0
    while k < d:
        i = int(k*SR); g = int(rng.uniform(0.002, 0.01) * SR)
        grains[i:i+g] += rng.uniform(0.3, 1.0)
        k += rng.uniform(0.004, 0.03) * (1 - 0.6 * k / d)
    grains = lp(grains, 900)
    body = bp(rng.standard_normal(n), 150, 600) * 0.5
    e = np.minimum(1, t / 0.04) * np.exp(-np.maximum(0, t - 0.45) * 7)
    return (noise * (0.25 + grains) + body * grains) * e
def sfx_whoosh(d=0.7):
    n = int(d*SR); x = rng.standard_normal(n); out = np.zeros(n); seg = int(0.02*SR)
    for i in range(0, n - seg, seg):
        p = i / n; f = 400 + 1800 * np.sin(np.pi * p); out[i:i+seg] = bp(x[i:i+seg], f, f * 2, 2)
    return out * np.sin(np.pi * np.arange(n) / n) ** 1.5
def sfx_land():                       # sheet of paper settling on a table
    t = tt(0.35); thump = np.sin(2*np.pi*80*t) * np.exp(-t*22)
    flap = bp(rng.standard_normal(len(t)), 500, 3000) * env_ad(len(t), 0.002, 0.04)
    return thump * 0.8 + flap * 0.5
def sfx_light(d=1.6):                 # warm light swell: soft shimmer cluster
    t = tt(d); x = sum(np.sin(2*np.pi*f*t + k) for k, f in enumerate((1318.5, 1760, 2217.5, 2637)))
    return x * np.sin(np.pi * t / d) ** 2 * 0.25

def nrm(x, gain_db):                  # every SFX normalized to peak, then placed at an explicit dB level
    return x / (np.max(np.abs(x)) + 1e-12) * 10 ** (gain_db / 20)

def render_sfx(tl):
    buf = np.zeros((int(tl["total"] * SR) + SR, 2))
    for e in tl["events"]:
        t = e["t"]
        if e["type"] == "sew":
            k, i = 0.0, 0
            while k < e["dur"]:
                add(buf, nrm(sfx_stitch(), -26), t + k, 1.0, pan=-0.5 + (k / e["dur"]))   # needle travels L→R
                k += 1 / 6 + rng.uniform(-0.01, 0.01); i += 1                   # every 2 frames @12fps
        elif e["type"] == "pull":   add(buf, nrm(sfx_pull(), -24), t, 1.0)
        elif e["type"] == "tear":   add(buf, nrm(sfx_tear(), -13), t, 1.0)
        elif e["type"] == "whoosh": add(buf, nrm(sfx_whoosh(), -22), t, 1.0)
        elif e["type"] == "land":   add(buf, nrm(sfx_land(), -15), t, 1.0)
        elif e["type"] == "light":  add(buf, nrm(sfx_light(), -30), t, 1.0)
    return buf[: int(tl["total"] * SR)]

# ---------------------------------------------------------------- mix
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)

def main():
    clips = render_vo()
    tl = build_timeline(clips)
    tl["s4_reentry"] = round(first_pause(clips[4][2]), 3)
    N = int(tl["total"] * SR)
    vo = np.zeros((N, 2))
    for (lid, _, x), l in zip(clips, tl["lines"]):
        add(vo, polish_vo(x), l["start"], 1.0)
    music, sfx = render_music(tl), render_sfx(tl)

    # static gains — VO speech level ~ -20 dBFS RMS, music sits ~16 dB under it while talking
    vo_active = np.abs(vo[:, 0]) > 1e-4
    g_vo = 10 ** ((-20 - db(vo[vo_active])) / 20)
    g_mu = 10 ** ((-34 - db(music[music[:, 0] != 0])) / 20)
    vo, music = vo * g_vo, music * g_mu
    # scripted (not dynamic) music automation: up in the intro, gaps and outro, smooth 0.4s ramps
    auto = np.full(N, 1.0)
    talk = [(l["start"] - 0.15, l["end"] + 0.1) for l in tl["lines"]]
    lift = np.ones(N) * 1.9
    for a, b in talk: lift[int(a*SR): int(b*SR)] = 1.0
    k = int(0.4 * SR); lift = np.convolve(lift, np.ones(k) / k, mode="same")
    music *= (auto * lift)[:, None]

    mix = vo + music + sfx
    mix = Pedalboard([Limiter(threshold_db=-1.5, release_ms=80)])(mix.T.astype(np.float32), SR).T
    pk = np.max(np.abs(mix))
    if pk > 10 ** (-1 / 20): mix *= 10 ** (-1 / 20) / pk          # one static trim to a -1 dBFS ceiling
    peak = 20 * np.log10(np.max(np.abs(mix)) + 1e-12)

    for name, x in (("vo_only", vo), ("music_only", music), ("sfx_only", sfx), ("full_mix", mix)):
        p = OUT / f"{name}.wav"; sf.write(p, np.clip(x, -1, 1).astype(np.float32), SR, subtype="PCM_16")
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "192000", str(p), str(p.with_suffix(".m4a"))], check=True)
    tl["mix_peak_dbfs"] = round(float(peak), 2)
    (OUT / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print(f"total {tl['total']:.1f}s  peak {peak:.2f} dBFS")
    for l in tl["lines"]: print(f"  {l['id']} {l['stage']:<10} {l['start']:6.2f} → {l['end']:6.2f}  ({l['end']-l['start']:.1f}s)")

if __name__ == "__main__":
    main()
