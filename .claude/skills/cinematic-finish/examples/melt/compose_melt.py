#!/usr/bin/env python3
"""
MELT v4 -- pure-code trailer score (numpy/scipy only, no samples, no ML).
15.000 s, 48 kHz stereo, 360 frames @ 24 fps. Tonality: Db major / Ab.
Writes separate stems + score_preview.wav into this folder.   python3 compose_melt.py
DSP toolkit: synth.py (copied unmodified from maison-bouledogue).
"""
import os, sys
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from synth import *  # noqa  (SR=48000, additive, brass, strings, timp, kick, snare, crash, ...)

N = 15 * SR                      # 720000 samples
HALL = freeverb_ir(0.88, 0.38, 3.0, 0.025)
ROOM = freeverb_ir(0.50, 0.50, 0.8, 0.008)


# ------------------------------------------------------------------ helpers
def ix(t):
    return int(round(t * SR))


class Bus:
    def __init__(self):
        self.dry = np.zeros((2, N))
        self.hall = np.zeros((2, N))
        self.room = np.zeros((2, N))

    def put(self, sig, t0, gain=1.0, pan=0.0, hall=0.0, room=0.0, tmax=None):
        sig = np.asarray(sig, float)
        if sig.ndim == 1:
            th = (pan + 1) * np.pi / 4
            sig = np.stack([sig * np.cos(th), sig * np.sin(th)]) * np.sqrt(2)
        p = ix(t0)
        e_lim = N if tmax is None else min(N, ix(tmax))
        a, e = max(0, p), min(e_lim, p + sig.shape[1])
        if e <= a:
            return
        seg = sig[:, a - p:e - p] * gain
        self.dry[:, a:e] += seg
        if hall:
            self.hall[:, a:e] += seg * hall
        if room:
            self.room[:, a:e] += seg * room

    def cut(self, t, ms=2.0):
        """hard stop at time t (short declick ramp ending exactly at t); send inputs cut too."""
        e = ix(t)
        k = int(ms * 1e-3 * SR)
        for b in (self.dry, self.hall, self.room):
            b[:, e - k:e] *= np.linspace(1, 0, k)
            b[:, e:] = 0.0

    def render(self, hall_wet=0.6, room_wet=0.5, tail_from=None, tail_len=0.4):
        def rv(x, ir):
            if not np.any(x):
                return np.zeros((2, N))
            return np.stack([fftconvolve(x[c], ir[c])[:N] for c in range(2)])
        wet = hall_wet * rv(self.hall, HALL) + room_wet * rv(self.room, ROOM)
        wet = hp(wet, 120)
        if tail_from is not None:
            wet *= fade_out_mask(tail_from, tail_from + tail_len)
        return self.dry + wet


def fade_out_mask(t0, t1):
    """1 before t0, raised-cosine to 0 at t1, 0 after."""
    t = np.arange(N) / SR
    g = np.ones(N)
    m = (t >= t0) & (t < t1)
    g[m] = 0.5 * (1 + np.cos(np.pi * (t[m] - t0) / (t1 - t0)))
    g[t >= t1] = 0.0
    return g


def gate_window(t0, t1, ramp=0.0):
    g = np.zeros(N)
    g[ix(t0):ix(t1)] = 1.0
    return g


def sat(x, d):
    return np.tanh(d * x) / np.tanh(d)


def peak_to(x, p):
    m = np.max(np.abs(x))
    return x * (p / m) if m > 0 else x


# ------------------------------------------------------------------ instruments (new, on top of synth.py)
def sub_drop(dur=1.6, f_hi=55.0, f_lo=28.0, tau=0.45, decay=0.8, drive=1.8):
    n = int((dur + 0.05) * SR)
    t = tt(n)
    f = f_lo + (f_hi - f_lo) * np.exp(-t / tau)
    ph = TWO_PI * np.cumsum(f) / SR + np.pi / 2          # cosine start: energy at sample 0
    env = (1 - np.exp(-t / 0.0007)) * np.exp(-t / decay)
    env *= np.where(t > dur - 0.2, np.clip((dur - t) / 0.2, 0, 1), 1.0)
    return sat(np.sin(ph), drive) * env


def taiko(f=80.0, dur=1.2, slap=1.0, seed=0, decay=0.3):
    n = int(dur * SR)
    t = tt(n)
    r = rng_for('taiko', f, seed)
    fr = f * (1 + 0.8 * np.exp(-t / 0.022))
    ph = TWO_PI * np.cumsum(fr) / SR
    body = (np.sin(ph) * np.exp(-t / decay) + 0.4 * np.sin(1.59 * ph) * np.exp(-t / 0.12)
            + 0.25 * np.sin(2.14 * ph) * np.exp(-t / 0.08))
    sl = lp(bp(r.standard_normal(n), 500, 3200), 3500) * np.exp(-t / 0.012) * 0.55 * slap
    x = (body + sl) * (1 - np.exp(-t / 0.0006))
    x *= np.where(t > dur - 0.1, np.clip((dur - t) / 0.1, 0, 1), 1.0)
    return norm(sat(x, 1.5))


def braam(notes, dur=2.5, att=0.05, bright0=0.93, bright1=0.62, seed=0, lpf=5500, tau=1.5):
    """low brass cluster: detuned additive saw-brass voices, saturated, spread L/C/R."""
    n = int((dur + 0.2) * SR)
    t = tt(n)
    out = np.zeros((2, n))
    amp = (1 - np.exp(-t / att)) * np.exp(-t / tau)
    amp *= np.where(t > dur - 0.4, np.clip((dur - t) / 0.4, 0, 1), 1.0)
    br = bright1 + (bright0 - bright1) * np.exp(-t / 0.5)
    form = lambda fk: 0.35 + np.exp(-((fk - 700) / 700) ** 2) + 0.4 * np.exp(-((fk - 2200) / 900) ** 2)
    for i, m in enumerate(notes):
        for j, (dc, pl) in enumerate(((-11, 0.15), (0, 0.5), (11, 0.85))):
            f = mtof(m) * 2 ** ((dc - 45 * np.exp(-t / 0.25)
                                 + 6 * np.sin(TWO_PI * (4.2 + 0.4 * j) * t + i + j)) / 1200)
            v = additive(f, amp, br, tilt=0.5, formant=form, kmax=40, seed=seed + 7 * i + j)
            out[0] += v * np.cos(pl * np.pi / 2)
            out[1] += v * np.sin(pl * np.pi / 2)
    out = lp(sat(out / (len(notes) * 1.2), 1.7), lpf)
    return norm(out)


def piano(m, dur=3.0, seed=0):
    f = mtof(m)
    n = int(dur * SR)
    t = tt(n)
    r = rng_for('pf', m, seed)
    x = np.zeros(n)
    for k in range(1, min(14, int(9000 / f)) + 1):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        d = 2.8 / (1 + 0.7 * (k - 1))
        x += k ** -0.9 * np.sin(TWO_PI * fk * t + r.uniform(0, TWO_PI)) * np.exp(-t / d)
    x *= 1 - np.exp(-t / 0.002)
    x += lp(r.standard_normal(n), 1500) * np.exp(-t / 0.01) * 0.15
    return norm(x)


def bell_hi(f, dur, seed=0, ratios=(1.0, 2.76, 5.4, 8.9)):
    n = int(dur * SR)
    t = tt(n)
    r = rng_for('bell', f, seed)
    x = np.zeros(n)
    for i, rt in enumerate(ratios):
        if f * rt < 12000:
            x += (0.6 ** i) * np.sin(TWO_PI * f * rt * t + r.uniform(0, 6.28)) * np.exp(-t / (dur / (2.0 + 1.2 * i)))
    return norm(x * (1 - np.exp(-t / 0.0015)))


def rise_tone(dur, f0, f1, power=2.0, bright=0.65, seed=0):
    n = int(dur * SR)
    t = tt(n)
    f = f0 * (f1 / f0) ** (t / dur)
    env = (t / dur) ** power
    L = additive(f * 2 ** (6 / 1200), env, np.full(n, bright), tilt=1.0, kmax=20, seed=seed)
    R = additive(f * 2 ** (-6 / 1200), env, np.full(n, bright), tilt=1.0, kmax=20, seed=seed + 5)
    return norm(lp(np.stack([L, R]), 7500))


def soft_noise_sweep(dur, f0, f1, power, seed, lpf=8000, bw=1.5):
    nz = sweep_noise(dur, f0, f1, bw_oct=bw, seed=seed)
    t = tt(nz.shape[1])
    return lp(nz, lpf) * ((t / dur) ** power)


# ================================================================== STEM: tension 0 -> 2.23
def stem_tension():
    b = Bus()
    TSTOP = 2.230
    n = ix(2.4)
    t = tt(n)
    ramp = np.clip(t / 2.23, 0, 1)
    # --- sub drone Db1 + Ab1 (+Db2 air), brightening
    amp = (0.35 + 0.65 * ramp ** 1.5) * (1 + 0.05 * np.sin(TWO_PI * 0.37 * t))
    drone = additive(np.full(n, mtof(25)), amp, 0.5 + 0.35 * ramp, tilt=1.2, kmax=24, seed=1)
    drone += 0.5 * additive(np.full(n, mtof(32)), amp * ramp, 0.5 + 0.3 * ramp, tilt=1.2, kmax=18, seed=2)
    drone += 0.35 * additive(np.full(n, mtof(37) * 1.002), amp * ramp ** 2, 0.55 + 0.3 * ramp, tilt=1.0, kmax=18, seed=3)
    drone = sat(drone / 1.4, 1.4)
    drone = lp(drone, 140) * (1 - ramp ** 2) + lp(drone, 1100) * ramp ** 2   # filter opens as tension rises
    b.put(drone, 0.0, gain=0.8, pan=0.0, hall=0.15)
    b.put(drone * 0.0, 0, 0)
    # wide low pad (Db2/Ab2) very quiet, swelling -> width
    pad = strings([37, 44, 49], 2.2, att=1.0, rel=0.1, bright=0.35, detune=10, seed=4, swell=1.5)
    b.put(lp(pad, 700), 0.0, gain=0.25, hall=0.5)
    # --- heartbeat lub-dub, 60 -> 100 bpm
    tb = 0.30
    while tb < 2.12:
        prog = tb / 2.23
        bpm = 60 + 40 * prog
        iv = 60.0 / bpm
        g = 0.30 + 0.70 * prog ** 1.2
        for off, gg, f0 in ((0.0, 1.0, 62.0), (0.15 * iv / 0.8 * 0.8 + 0.02, 0.62, 52.0)):
            m = int(0.28 * SR)
            tm = tt(m)
            fr = f0 * (1 + 0.8 * np.exp(-tm / 0.025))
            th = np.sin(TWO_PI * np.cumsum(fr) / SR + np.pi / 2) * np.exp(-tm / 0.07) * (1 - np.exp(-tm / 0.002))
            th = sat(th, 1.6)
            if tb + off < 2.15:
                b.put(th, tb + off, gain=0.9 * g * gg, hall=0.2, room=0.2)
        tb += iv
    # --- glassy shimmer creeping in from 1.2 s
    ns = ix(1.05)
    ts = tt(ns)
    env = np.clip(ts / 1.05, 0, 1) ** 2.2
    r = rng_for('shimmer')
    shim = np.zeros((2, ns))
    for k, (fq, pl) in enumerate(((1108.7, 0.15), (1661.2, 0.85), (2217.5, 0.35), (2793.0, 0.65), (3322.4, 0.5), (4186.0, 0.2))):
        for dtn, side in ((-0.004, 0), (0.004, 1)):
            am = 0.6 + 0.4 * np.sin(TWO_PI * r.uniform(2.0, 7.0) * ts + r.uniform(0, 6.28))
            shim[side] += (0.7 ** k) * np.sin(TWO_PI * fq * (1 + dtn) * ts + r.uniform(0, 6.28)) * am * env
    shim = lp(shim, 7000) * 0.09
    b.put(shim, 1.2, gain=1.0, hall=0.8)
    # sparse glass ticks
    for tk, nt in ((1.45, 97), (1.72, 100), (1.88, 104), (2.00, 97), (2.08, 109), (2.15, 101)):
        b.put(bell_hi(mtof(nt), 0.8, seed=nt), tk, gain=0.05 + 0.08 * (tk - 1.4), pan=((nt * 7) % 5 - 2) / 2.5, hall=0.8)
    # --- reverse riser (peaks just before the suck-out)
    rd = 0.75
    rz = soft_noise_sweep(rd, 400, 7000, 3.0, seed=11, lpf=7000)
    rt = rise_tone(rd, mtof(61), mtof(85), power=2.5)
    b.put(rz, TSTOP - rd, gain=0.16)
    b.put(rt, TSTOP - rd, gain=0.10, hall=0.3)
    x = b.render(hall_wet=0.5, room_wet=0.3)
    # suck-out: 15 ms fade ending exactly at 2.230 then 60 ms (to 2.290) of true silence
    x *= fade_out_mask(TSTOP - 0.015, TSTOP)
    return peak_to(x, 0.5)


# ================================================================== STEM: impact hits
def hit_big(b, t0, scale=1.0, sub=(55, 28, 1.6), brass_notes=None, brass_dur=2.5, timp_m=(37, 32), crash_g=0.22,
            hall=0.5):
    b.put(sub_drop(dur=sub[2], f_hi=sub[0], f_lo=sub[1]), t0, gain=1.0 * scale, hall=0.0)
    for m in timp_m:
        b.put(timp(m, dur=1.8), t0, gain=0.85 * scale, hall=hall * 0.6, room=0.2)
    b.put(taiko(78, dur=1.4), t0, gain=0.95 * scale, pan=-0.15, hall=hall * 0.6, room=0.2)
    b.put(taiko(58, dur=1.6, seed=2), t0, gain=0.8 * scale, pan=0.15, hall=hall * 0.6)
    if brass_notes:
        b.put(braam(brass_notes, dur=brass_dur), t0, gain=0.75 * scale, hall=hall, room=0.1)
    if crash_g:
        c = lp(crash(dur=2.4, seed=int(t0 * 10)), 11000)
        b.put(c, t0, gain=crash_g * scale, hall=0.5)


def stem_impact():
    b = Bus()
    # 2.290 trailer hit: sub drop 55->28 (1.6s) + timp/taiko + low brass cluster 2.5s
    hit_big(b, 2.290, 1.0, sub=(55, 28, 1.6),
            brass_notes=[25, 37, 44, 49, 51, 54], brass_dur=2.5, crash_g=0.20, hall=0.5)
    # chocolate-snap transient (lowpassed crack) at the hit
    r = rng_for('snap')
    tn = tt(int(0.12 * SR))
    snap = lp(bp(r.standard_normal(len(tn)), 300, 5000), 6000) * np.exp(-tn / 0.02)
    b.put(norm(snap), 2.290, gain=0.35, room=0.4)
    # 5.75 accent
    hit_big(b, 5.75, 0.55, sub=(48, 30, 1.0), brass_notes=[37, 44, 49], brass_dur=1.0, timp_m=(37,), crash_g=0.1, hall=0.45)
    # 9.20 downbeat after the whip (restrained, sparse; tail to ~11.0)
    b.put(sub_drop(dur=2.2, f_hi=46, f_lo=34.6, tau=0.35, decay=0.9, drive=1.5), 9.20, gain=0.75)
    b.put(timp(37, dur=2.2), 9.20, gain=0.75, hall=0.7, room=0.2)
    b.put(taiko(70, dur=1.4), 9.20, gain=0.7, hall=0.6)
    b.put(braam([37, 44, 49], dur=1.8, att=0.12, tau=0.9, bright0=0.7, bright1=0.5, lpf=2500), 9.20, gain=0.35, hall=0.8)
    # 13.40 final hit (octave drop Db2->Db1 = tonal)
    hit_big(b, 13.40, 0.95, sub=(69.3, 34.6, 2.0), brass_notes=None, timp_m=(37, 32), crash_g=0.18, hall=0.55)
    b.put(braam([25, 37, 44], dur=1.4, att=0.08, tau=1.0, bright0=0.75, bright1=0.5, lpf=3000), 13.40, gain=0.35, hall=0.8)
    x = b.render(hall_wet=0.6, room_wet=0.4)
    x *= np.maximum(fade_out_mask(8.0, 8.4), np.concatenate([np.zeros(ix(8.72)), np.ones(N - ix(8.72))]))
    x *= np.maximum(fade_out_mask(10.4, 11.0), np.concatenate([np.zeros(ix(12.9)), np.ones(N - ix(12.9))]))
    return peak_to(x, 0.8)


# ================================================================== STEM: slowmo 2.30 -> 4.0
def stem_slowmo():
    b = Bus()
    # source: the braam + sub of the hit, varispeed-slowed (rate .5 -> octave down, 2x long), then speed returns
    src = braam([25, 37, 44, 49, 51, 54], dur=2.5, seed=3, lpf=9000)
    src = np.concatenate([src, np.zeros((2, SR))], axis=1)
    m = ix(1.0)                                  # 2.30 -> 3.30 slowed region
    tl = np.arange(m) / SR
    rate = np.where(tl < 0.75, 0.5, 0.5 + 0.5 * np.clip((tl - 0.75) / 0.25, 0, 1) ** 1.5)   # accelerates to 1.0 by 3.30 (snap-back)
    slow = varispeed(src, rate)
    slow = lp(slow, 1300, 2)
    slow *= np.clip(tl / 0.02, 0, 1)             # 20 ms declick so stem starts clean at 2.30
    slow *= np.where(tl > 0.55, np.clip((1.0 - tl) / 0.45, 0, 1) ** 1.2, 1.0)
    b.put(slow, 2.30, gain=0.8, hall=0.7)
    # time-dilation rumble: sub drone Db1 with slow pitch sag (octave down feel)
    nr = ix(1.15)
    tr = tt(nr)
    f = 34.6 * (1 - 0.35 * (tr / 1.15) ** 1.5)
    rum = sat(np.sin(TWO_PI * np.cumsum(f) / SR) * np.exp(-tr / 0.8) * np.clip(tr / 0.03, 0, 1), 1.3)
    b.put(rum, 2.30, gain=0.7)
    # floating shards: bell strikes pitched an octave down and stretched
    for i, (tk, nt) in enumerate(((2.38, 97), (2.62, 101), (2.84, 104), (3.05, 97))):
        bell = bell_hi(mtof(nt), 1.6, seed=nt)
        bell = np.stack([bell, bell])
        bl = lp(varispeed(np.concatenate([bell, np.zeros((2, SR))], axis=1), np.full(ix(1.6), 0.5)), 2800)
        b.put(bl, tk, gain=0.22, pan=0.0, hall=1.0)
    x = b.render(hall_wet=0.8, room_wet=0.2)
    # reverse cymbal 3.30 -> 4.00, ends hard exactly at 4.000
    rc = lp(reverse_cymbal(0.7, seed=5), 9000)
    rc2 = soft_noise_sweep(0.7, 600, 9000, 3.0, seed=21, lpf=9000)
    ycym = np.zeros((2, N))
    ycym[:, ix(3.30):ix(4.00)] = rc[:, :ix(4.00) - ix(3.30)] * 0.5 + rc2[:, :ix(4.00) - ix(3.30)] * 0.18
    x = x + ycym
    x *= gate_window(2.30, 4.00)
    return peak_to(x, 0.6)


# ================================================================== STEM: drive 4.0 -> 8.0
def stem_drive():
    b = Bus()
    B = 0.5
    T0 = 4.0
    K = kick(0, 1.25)
    SN = snare(0)
    SNs = snare(1, soft=True)

    def kk(t, g=1.0):
        b.put(K, t, gain=0.9 * g, hall=0.1, room=0.2)
        b.put(sub_drop(dur=0.45, f_hi=62, f_lo=40, tau=0.07, decay=0.2, drive=1.4), t, gain=0.6 * g)

    def sn(t, g=1.0, soft=False, pan=0.0):
        b.put(SNs if soft else SN, t, gain=0.7 * g, pan=pan, hall=0.25, room=0.3)

    def tom(t, f, g=1.0, pan=0.0):
        b.put(taiko(f, dur=0.8, seed=int(f), decay=0.22), t, gain=0.8 * g, pan=pan, hall=0.4, room=0.2)

    # downbeat 4.000: kick + taiko + timp + sub + (restrained) crash
    kk(T0, 1.2)
    tom(T0, 62, 1.1, -0.1)
    b.put(timp(37, dur=1.6), T0, gain=0.8, hall=0.6)
    b.put(lp(crash(dur=1.8, seed=44), 10000), T0, gain=0.14, hall=0.5)
    # two bars, 16th grid (0.125 s)
    for bar in range(2):
        for s in range(16):
            t = T0 + bar * 2.0 + s * 0.125
            if t < T0 + 1e-6 and bar == 0 and s == 0:
                continue
            if t >= 6.0:                # roll section handled below, keep only the kick/taiko pulse
                if s in (0, 4, 8, 12):
                    kk(t, 0.9)
                if s in (0, 8):
                    tom(t, 62, 0.9)
                continue
            if s in (0, 4, 8, 12):
                kk(t, 1.0 if s % 8 == 0 else 0.85)
            if s in (0, 8):
                tom(t, 62, 1.0, -0.1)
            if s in (4, 12):
                sn(t, 1.0)
                tom(t, 82, 0.6, 0.15)
            if s in (6, 14) and bar == 0:
                tom(t, 104 if s == 6 else 92, 0.8, 0.3 if s == 6 else -0.3)
            if s == 10 and bar == 0:
                kk(t, 0.6)
            if s in (3, 11, 15):
                b.put(hat(False, s), t, gain=0.12, pan=0.3, room=0.2) if False else None
    # 5.75 snare/tom fill pickup
    sn(5.875, 0.6, soft=True)
    # snare roll 6.0 -> 7.95 : 8ths -> 16ths -> 32nds, crescendo
    times = []
    t = 6.0
    while t <= 7.95 + 1e-9:
        times.append(t)
        step = 0.25 if t < 6.75 else (0.125 if t < 7.35 else 0.0625)
        t += step
    if abs(times[-1] - 7.95) > 1e-6:
        times.append(7.95)
    for i, t in enumerate(times):
        c = (t - 6.0) / 1.95
        sn(t, 0.18 + 0.95 * c ** 1.5, soft=(c < 0.35), pan=(-0.25 if i % 2 else 0.25))
    # toms rolling down at the end
    for i, (t, f) in enumerate(((7.5, 130), (7.5625, 116), (7.625, 104), (7.6875, 92), (7.75, 82), (7.8125, 72), (7.875, 66), (7.9375, 58))):
        tom(t, f, 0.5 + 0.1 * i, pan=-0.3 + 0.08 * i)
    kk(7.95, 1.0)
    # pulsing low strings ostinato (16ths), roots I - vi - IV - V, 2 beats each
    roots = [37, 34, 30, 32]
    cache = {}
    for ci in range(8):                                   # 8 x 1.0 s
        root = roots[ci % 4]
        if root not in cache:
            cache[root] = strings([root, root + 12], 0.09, att=0.012, rel=0.04, bright=0.6, detune=7, seed=root)
        for s in range(8):
            t = T0 + ci * 1.0 + s * 0.125
            acc = (1.0, 0.5, 0.75, 0.5, 0.9, 0.5, 0.75, 0.55)[s]
            ramp = 0.75 + 0.25 * min(1.0, (t - 4.0) / 3.5)
            b.put(cache[root], t, gain=0.5 * acc * ramp, hall=0.25, room=0.25)
    # rising string + brass line 6.0 -> 7.95
    line = [68, 70, 72, 73, 75, 77, 80]
    seg = 1.95 / len(line)
    for i, m in enumerate(line):
        t = 6.0 + i * seg
        c = i / (len(line) - 1)
        st = strings([m, m - 12], seg * 1.05, att=0.06, rel=0.12, bright=0.55, detune=9, seed=m)
        b.put(st, t, gain=0.22 + 0.5 * c ** 1.3, hall=0.5)
        br = brass(m - 12, seg * 0.95, muted=False, bright=0.85, att=0.03, rel=0.05, scoop=60, seed=m)
        b.put(lp(br, 5500), t, gain=0.18 + 0.5 * c ** 1.3, hall=0.4)
    padc = strings([49, 56, 65, 73], 1.95, att=0.9, rel=0.1, bright=0.5, detune=10, seed=77, swell=1.3)
    b.put(padc, 6.0, gain=0.55, hall=0.5, tmax=8.0)
    # noise swell
    ns = soft_noise_sweep(1.95, 500, 7500, 2.5, seed=31, lpf=7500)
    b.put(ns, 6.0, gain=0.14)
    b.cut(8.0, ms=2.0)
    x = b.render(hall_wet=0.6, room_wet=0.45, tail_from=8.0, tail_len=0.35)
    x *= fade_out_mask(8.35, 8.4)
    return peak_to(x, 0.75)


# ================================================================== STEM: whip 8.75 -> 9.20
def stem_whip():
    b = Bus()
    d = 0.45
    nz = soft_noise_sweep(d, 350, 10000, 2.2, seed=41, lpf=7500, bw=1.8)
    rt = rise_tone(d, mtof(56), mtof(92), power=2.0)
    rc = lp(reverse_cymbal(d, seed=9), 8500)
    # all three land at full level on the very last sample (the downbeat takes over)
    b.put(nz, 8.75, gain=0.28)
    b.put(rt, 8.75, gain=0.18, hall=0.2)
    b.put(rc, 8.75, gain=0.30)
    x = b.render(hall_wet=0.3, room_wet=0.0)
    x *= gate_window(8.75, 9.20)
    return peak_to(x, 0.5)


# ================================================================== STEM: resolve 11.0 -> 15.0
def stem_resolve():
    b = Bus()
    # 11.00-12.60 swell: strings rising Gbmaj7 -> Ab (leading to Db) + timpani roll
    ch1 = strings([42, 46, 49, 53], 1.0, att=0.5, rel=0.25, bright=0.5, detune=9, seed=101, swell=1.0)
    ch2 = strings([44, 48, 51, 56], 1.0, att=0.3, rel=0.3, bright=0.6, detune=9, seed=102, swell=0.9)
    hi = strings([66, 70, 73, 78], 1.6, att=0.9, rel=0.2, bright=0.6, detune=10, seed=103, swell=1.6)
    b.put(ch1, 11.0, gain=0.55, hall=0.55)
    b.put(ch2, 11.8, gain=0.8, hall=0.55)
    b.put(hi, 11.0, gain=0.55, hall=0.7, tmax=12.62)
    b.cut  # (no hard cut; swell ends via tmax / natural release)
    t = 11.0
    k = 0
    while t < 12.6:
        c = (t - 11.0) / 1.6
        iv = 0.26 - 0.20 * c ** 0.8
        tp = timp(37 if k % 2 == 0 else 32, dur=0.7)
        tp = tp * np.where(tt(len(tp)) > 0.6, np.clip((0.7 - tt(len(tp))) / 0.1, 0, 1), 1.0)
        b.put(tp, t, gain=0.12 + 0.75 * c ** 1.4, pan=-0.2 if k % 2 == 0 else 0.2, hall=0.5, room=0.2)
        t += iv
        k += 1
    b.put(timp(37, dur=1.2), 12.6, gain=1.0, hall=0.6)
    b.put(sub_drop(dur=0.9, f_hi=50, f_lo=34.6, tau=0.2, decay=0.5), 12.6, gain=0.5)
    # 12.80-13.40 short riser, ends exactly at 13.400
    rd = 0.6
    rz = soft_noise_sweep(rd, 500, 9000, 2.5, seed=51, lpf=8500)
    rt = rise_tone(rd, mtof(56), mtof(92), power=2.0, bright=0.7)
    stl = strings([56, 61, 65], rd, att=0.35, rel=0.05, bright=0.55, detune=9, seed=111, swell=1.5)
    b.put(rz, 12.8, gain=0.2, tmax=13.4)
    b.put(rt, 12.8, gain=0.16, hall=0.3, tmax=13.4)
    b.put(stl, 12.8, gain=0.5, hall=0.5, tmax=13.4)
    # 13.40 resolving Db major (Ab in the bass voicing): strings + soft brass + piano-like additive
    TC = 13.40
    dur = 15.0 - TC
    chord = [44, 49, 53, 56, 61, 65, 68, 73]         # Ab2 Db3 F3 Ab3 Db4 F4 Ab4 Db5
    pad = strings(chord, dur, att=0.12, rel=0.5, bright=0.5, detune=8, seed=121, swell=0.0)
    b.put(pad, TC, gain=0.9, hall=0.55, tmax=15.0)
    pad_lo = strings([37, 44], dur, att=0.15, rel=0.5, bright=0.4, detune=6, seed=122)
    b.put(lp(pad_lo, 600), TC, gain=0.7, hall=0.3, tmax=15.0)
    for i, m in enumerate((49, 56, 65)):
        br = brass(m, dur - 0.1, muted=False, bright=0.6, att=0.14, rel=0.2, scoop=15, vib=0.7, seed=130 + i)
        b.put(lp(br, 3500), TC, gain=0.28, pan=(-0.3, 0.0, 0.3)[i], hall=0.5, tmax=15.0)
    for i, m in enumerate((37, 44, 49, 53, 56, 61)):
        b.put(piano(m, dur=3.0, seed=i), TC + 0.012 * i, gain=0.30 if m < 50 else 0.2, pan=-0.4 + 0.15 * i, hall=0.45, tmax=15.0)
    x = b.render(hall_wet=0.65, room_wet=0.25)
    x *= fade_out_mask(14.6, 15.0000001) if False else np.where(np.arange(N) / SR > 14.6,
        np.cos(0.5 * np.pi * np.clip((np.arange(N) / SR - 14.6) / 0.4, 0, 1)) ** 2, 1.0)
    return peak_to(x, 0.75)


# ================================================================== main
def finish(x):
    x, _ = limit(x, -1.5)
    return np.clip(x, -0.999, 0.999)


def main():
    stems = {
        'stem_tension': stem_tension,
        'stem_impact': stem_impact,
        'stem_drive': stem_drive,
        'stem_slowmo': stem_slowmo,
        'stem_whip': stem_whip,
        'stem_resolve': stem_resolve,
    }
    total = np.zeros((2, N))
    for name, fn in stems.items():
        x = finish(fn())
        assert x.shape == (2, N), (name, x.shape)
        sf.write(os.path.join(HERE, name + '.wav'), x.T.astype(np.float32), SR, subtype='FLOAT')
        total += x
        print(f'{name}: peak {20*np.log10(np.max(np.abs(x))+1e-12):.1f} dBFS')
    total *= 10 ** (-3 / 20) / np.max(np.abs(total))
    sf.write(os.path.join(HERE, 'score_preview.wav'), total.T.astype(np.float32), SR, subtype='FLOAT')
    print('preview written')


if __name__ == '__main__':
    main()
