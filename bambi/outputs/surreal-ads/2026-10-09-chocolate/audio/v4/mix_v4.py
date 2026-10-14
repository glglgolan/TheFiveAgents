#!/usr/bin/env python3
"""MELT v4 — hybrid mix: code score stems (audio/v4/score) + realistic ElevenLabs SFX (audio/v4/sfx)
+ organic ElevenLabs music layer.  Run from the run dir:  python3 audio/v4/mix_v4.py [--no-mux]

Rules (see CUES.md): no dynamic loudnorm / AGC.  Static gain to target LUFS, then a look-ahead
true-peak limiter.  Music only ducks under the 2.29 impact.  Air sounds (fly-by, whip, camera move)
follow the measured picture motion (_qa/snd/motion.npy).
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR, DUR, FPS = 48000, 15.0, 24
N = int(SR * DUR)
FF = str(Path(__file__).resolve().parents[6] / ".claude/skills/kinetic-typography/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1")
V4 = Path("audio/v4")
TARGET_LUFS, CEIL_DBTP = -14.0, -1.5


def db(x): return 10 ** (x / 20)


def load(path):
    """any audio -> float32 stereo (n,2) @48k"""
    raw = subprocess.run([FF, "-v", "error", "-i", str(path), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def fades(x, fin=0.003, fout=0.01):
    x = x.copy(); a, b = int(fin * SR), int(fout * SR)
    if a: x[:a] *= np.linspace(0, 1, a)[:, None]
    if b: x[-b:] *= np.linspace(1, 0, b)[:, None]
    return x


def varispeed(x, ratio):
    """ratio<1 = slower+lower (tape style)."""
    up, down = int(round(1000 / ratio)), 1000
    return resample_poly(x, up, down, axis=0).astype(np.float32)


def filt(x, kind, fc, order=2):
    return sosfilt(butter(order, fc, kind, fs=SR, output="sos"), x, axis=0).astype(np.float32)


def pan(x, p):  # p -1..1 constant power
    a = (p + 1) * np.pi / 4
    m = x.mean(1)
    return np.stack([m * np.cos(a) * 1.414 * 0.5 + x[:, 0] * 0.5, m * np.sin(a) * 1.414 * 0.5 + x[:, 1] * 0.5], 1)


def place(bus, clip, t, gain_db=0.0, env=None):
    s = int(round(t * SR))
    c = clip * db(gain_db)
    if s < 0: c, s = c[-s:], 0
    e = min(N, s + len(c))
    if e <= s: return
    seg = c[: e - s]
    if env is not None: seg = seg * env[s:e, None]
    bus[s:e] += seg


def onset(x, thr_db=-30):
    """time of first sample above thr relative to clip peak"""
    a = np.abs(x).max(1); pk = a.max()
    idx = np.argmax(a > pk * db(thr_db))
    return idx / SR


def peak_t(x, win=0.05):
    a = uniform_filter1d(np.abs(x).max(1), int(win * SR))
    return np.argmax(a) / SR


# ---- picture motion envelope (0..1) ------------------------------------------------------
mot = np.load("_qa/snd/motion.npy")
mt = np.arange(len(mot)) / FPS
motion = np.interp(np.arange(N) / SR, mt, mot).astype(np.float32)
motion = uniform_filter1d(motion, int(0.08 * SR))


def motion_env(t0, t1, floor=0.25):
    e = np.zeros(N, np.float32)
    s, k = int(t0 * SR), int(t1 * SR)
    m = motion[s:k]; m = m / (m.max() + 1e-9)
    e[s:k] = floor + (1 - floor) * m
    return e


def lufs(x):
    sf.write(V4 / "_meas.wav", x, SR, subtype="FLOAT")
    out = subprocess.run([FF, "-hide_banner", "-nostats", "-i", str(V4 / "_meas.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    tail = out[out.rfind("Summary:"):]
    I = float(tail.split("I:")[1].split("LUFS")[0]); TP = float(tail.split("Peak:")[1].split("dBFS")[0])
    return I, TP


def limiter(x, ceil_dbtp=CEIL_DBTP, look=0.0015, release=0.08):
    c = db(ceil_dbtp)
    os4 = resample_poly(x, 4, 1, axis=0)
    a = np.abs(os4).max(1).reshape(-1, 4).max(1)[: len(x)]          # true-peak estimate per sample
    g = np.minimum(1.0, c / np.maximum(a, 1e-9))
    L = int(look * SR)
    g = minimum_filter1d(g, 2 * L + 1)
    # release: per-block one-pole on the way up
    blk = 32; gb = g[: len(g) // blk * blk].reshape(-1, blk).min(1)
    r = np.exp(-blk / (release * SR)); out = np.empty_like(gb); cur = 1.0
    for i, v in enumerate(gb):
        cur = v if v < cur else v + (cur - v) * r
        out[i] = cur
    g2 = np.repeat(out, blk); g2 = np.concatenate([g2, np.full(len(g) - len(g2), g2[-1])])
    g = np.minimum(g, uniform_filter1d(g2, L + 1))
    y = x * g[:, None]                     # centred min-filter already looks ahead by L
    return np.clip(y, -c, c), g


# ---- assets -------------------------------------------------------------------------------
cfg = json.loads((V4 / "picks.json").read_text())       # {"impact": "sfx/impact_a.mp3", ...}
A = {k: load(V4 / v) for k, v in cfg.items()}

music = np.zeros((N, 2), np.float32)
sfx = np.zeros((N, 2), np.float32)

# score stems (code composer)
STEM_GAIN = {"tension": 0, "impact": 0, "drive": 0, "slowmo": 0, "whip": -2, "resolve": 0}
for name, g in STEM_GAIN.items():
    p = V4 / "score" / f"stem_{name}.wav"
    if p.exists():
        x, sr = sf.read(p, dtype="float32", always_2d=True); assert sr == SR
        x = x[:N] * db(g)
        if name == "impact":   # let the slowed braam (stem_slowmo) own the time-dilation window
            e = np.ones(N, np.float32)
            t = np.arange(N) / SR
            e[(t > 2.36) & (t < 3.30)] = db(-9)
            ramp_in = (t >= 2.30) & (t <= 2.36); e[ramp_in] = np.linspace(1, db(-9), ramp_in.sum())
            ramp_out = (t >= 3.30) & (t <= 3.45); e[ramp_out] = np.linspace(db(-9), 1, ramp_out.sum())
            x = x * e[: len(x), None]
        music[: len(x)] += x

# organic layer: ElevenLabs piano/strings, warm downbeat from music_a@7.5s lands on the 9.20 downbeat
org = load("audio/music_a.mp3")
o = fades(org[int(7.5 * SR): int(9.9 * SR)], 0.004, 0.9)
place(music, o, 9.20, -3)

# ---- SFX (event times from CUES.md) ---------------------------------------------------------
# room tone, continuous, with the suck-out before the impact
room = A["room"]; room = np.concatenate([room, room[::-1], room])[:N]   # mirrored loop = no seam click
renv = np.full(N, db(-6), np.float32)
renv[: int(2.23 * SR)] = 1.0
renv[int(2.23 * SR): int(4.0 * SR)] = 0.0
renv[int(8.0 * SR): int(8.75 * SR)] = db(-2)                           # room in the silence beat = real
renv = uniform_filter1d(renv, int(0.01 * SR))
place(sfx, room, 0, -1, renv)

# glass stress creak, rising into the impact, hard cut at 2.23 (suck-out)
cr = A["creak"]; cr = cr[: int(1.6 * SR)]
cr = cr * np.linspace(0.15, 1, len(cr))[:, None] ** 1.5
place(sfx, cr, 2.23 - len(cr) / SR, -10)

# impact: first 90 ms real-time, the rest slowed 0.5x (one octave down) + darker = slow-mo world
im = A["impact"]; o_im = onset(im); im = im[int(o_im * SR):]
head = im[: int(0.09 * SR)]
tail = filt(varispeed(im[int(0.09 * SR):], 0.5), "lowpass", 5000)
xf = int(0.01 * SR)
imp = np.concatenate([head[:-xf], head[-xf:] * np.linspace(1, 0, xf)[:, None] + tail[:xf] * np.linspace(0, 1, xf)[:, None], tail[xf:]])
imp = fades(imp, 0.0005, 0.4)
place(sfx, imp, 2.290, -4)
# a real-time copy of the transient, bright, for the "snap"
place(sfx, fades(A["impact"][int(o_im * SR): int((o_im + 0.06) * SR)], 0.0005, 0.03), 2.290, -2)

# shards land when speed returns
sh = A["shards"]; place(sfx, fades(sh, 0.002, 0.3), 3.30 - onset(sh), -5)

# bar grinding out of the glass
sc = A["scrape"]; place(sfx, fades(sc, 0.01, 0.25), 4.00 - onset(sc), -6)

# heavy fly-by: its loudest point sits on the picture's motion peak, loudness rides the motion
fb = A["flyby"]; t_pk = peak_t(fb)
mot_pk = 4.0 + np.argmax(motion[int(4.0 * SR): int(5.75 * SR)]) / SR
place(sfx, fades(fb, 0.05, 0.3), mot_pk - t_pk, -5, motion_env(3.6, 6.2, 0.35))
# sub weight under the fly-by
place(sfx, filt(fb, "lowpass", 120, 4), mot_pk - t_pk, -1, motion_env(3.6, 6.2, 0.2))

# liquid landing
sp = A["splat"]; place(sfx, fades(sp, 0.001, 0.2), 5.62 - onset(sp), -3)

# letters rising out of the molten chocolate
vi = A["viscous"]; place(sfx, fades(vi, 0.15, 0.5), 6.00, -7)
th = A["thud"]; o_th = onset(th)
for t, g, r in [(6.40, -9, 1.06), (6.70, -8, 0.97), (7.00, -7, 1.03), (7.25, -5, 0.92)]:
    place(sfx, fades(varispeed(th[int(o_th * SR):], r), 0.0005, 0.08), t, g)

# drips: one before the stop, then alone in the silence
dr = A["drip"]; o_dr = onset(dr); d = fades(dr[int(o_dr * SR):], 0.0005, 0.15)
place(sfx, pan(d, -0.3), 7.70, -12)
place(sfx, d, 8.22, -4)
place(sfx, pan(varispeed(d, 1.08), 0.25), 8.55, -9)

# whip: real air swish riding the pan motion
wh = A["whip"]; t_wpk = peak_t(wh, 0.02)
w_pk = 8.6 + np.argmax(motion[int(8.6 * SR): int(9.3 * SR)]) / SR
place(sfx, fades(wh, 0.01, 0.08), w_pk - t_wpk, 0, motion_env(8.55, 9.4, 0.3))

# macro: intimate molten detail
mo = A["molten"]; place(sfx, fades(mo, 0.2, 0.5), 9.25, -12)

# pull-back: camera air (second fly-by take, higher + softer) + foil crinkle on the reveal
cam = filt(varispeed(A["flyby_b"], 1.25), "highpass", 150)
c_pk = 11.0 + np.argmax(motion[int(11.0 * SR): int(12.6 * SR)]) / SR
place(sfx, fades(cam, 0.1, 0.4), c_pk - peak_t(cam), -14, motion_env(10.9, 12.9, 0.2))
fo = A["foil"]; place(sfx, fades(fo, 0.02, 0.3), 11.40 - onset(fo), -9)

# ---- bus processing ---------------------------------------------------------------------------
# music ducks only under the impact: -3 dB, 10 ms in, 150 ms back
duck = np.ones(N, np.float32)
s0 = int(2.285 * SR); duck[s0: s0 + int(0.02 * SR)] = db(-3)
k = int(0.15 * SR); duck[s0 + int(0.02 * SR): s0 + int(0.02 * SR) + k] = np.linspace(db(-3), 1, k)
music *= duck[:, None]

MUSIC_DB, SFX_DB = 0.0, 0.0
mix = music * db(MUSIC_DB) + sfx * db(SFX_DB)
mix[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))[:, None] ** 2

# ---- master: static gain, then true-peak limiter --------------------------------------------
I0, _ = lufs(mix)
mix *= db(TARGET_LUFS - I0)
out, g = limiter(mix)
I1, TP1 = lufs(out)
print(f"[mix] pre {I0:.1f} LUFS -> final {I1:.1f} LUFS, TP {TP1:.1f} dBTP, max GR {20*np.log10(g.min()):.1f} dB")
sf.write(V4 / "mix_v4.wav", out, SR, subtype="PCM_24")
sf.write(V4 / "stem_music.wav", music, SR, subtype="FLOAT")
sf.write(V4 / "stem_sfx.wav", sfx, SR, subtype="FLOAT")
(V4 / "_meas.wav").unlink(missing_ok=True)

if "--no-mux" not in sys.argv:
    subprocess.run([FF, "-y", "-v", "error", "-i", "final_typo.mp4", "-i", str(V4 / "mix_v4.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest", "-movflags", "+faststart", "MELT_final.mp4"], check=True)
    print("[mix] MELT_final.mp4")
