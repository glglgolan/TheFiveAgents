"""Procedural foley generators (48 kHz). Every function returns a mono np.ndarray
(or stereo (2,n) where noted). Physical-ish models: modal synthesis for struck
objects, stick-slip pulse trains for squeaks/creaks, STFT-shaped noise for air/fabric,
ballistic bounce schedules for pearls."""
import numpy as np
from scipy import signal
from dsp import (SR, R, db, lp, hp, bp, reson, tt, expdec, ar, modal, thump, click, shaped_noise,
                 band_mask, smooth_noise, norm, rmsnorm, fade, pink, brown)


# ---------------------------------------------------------------- ambience
def room_tone(r, n, lpf=400, hum=0.0, hum_f=60):
    """stereo air/HVAC room tone at ~unit RMS"""
    st = np.vstack([lp(pink(n, r), lpf, 2), lp(pink(n, r), lpf, 2)])
    st += 0.3 * np.vstack([bp(pink(n, r), 800, 3000), bp(pink(n, r), 800, 3000)])
    if hum:
        t = tt(n)
        h = sum((1 / k) * np.sin(2 * np.pi * hum_f * k * t + k) for k in range(1, 6))
        st += hum * h[None, :]
    return st / (np.std(st) + 1e-9)


def arc_hum(r, dur):
    """carbon-arc spotlight buzz (100 Hz harmonics + crackle), mono"""
    n = int(dur * SR)
    t = tt(n)
    y = sum((0.6 ** k) * np.sin(2 * np.pi * 100 * k * t + r.uniform(0, 6)) for k in range(1, 9))
    y *= 1 + 0.2 * smooth_noise(n, 6, r)
    crackle = (r.random(n) < 0.0008) * r.standard_normal(n)
    y += hp(crackle, 2000) * 3
    return y * 0.3


# ---------------------------------------------------------------- S1
def spotlight_clunk(r):
    y = 0.9 * thump(150, 60, 0.07, 0.4)
    y += 0.5 * modal([310, 720, 1130, 1650, 2480, 3900], [.12, .09, .06, .05, .03, .02],
                     [1, .7, .6, .4, .3, .2], 0.4, r)
    y += 0.7 * np.pad(click(r, 0.005, 0.0008, 1500), (0, int(0.4 * SR) - int(0.005 * SR)))
    # latch clack 45 ms later
    k = int(0.045 * SR)
    y2 = 0.35 * modal([1800, 2700, 4300], [.02, .015, .01], [1, .7, .5], 0.1, r)
    y[k:k + len(y2)] += y2[: len(y) - k]
    return y


def servo_creak(r, dur):
    """spotlight yoke turning: soft squeaky friction + motor"""
    n = int(dur * SR)
    t = tt(n)
    f = 45 + 15 * smooth_noise(n, 2, r)
    ph = np.cumsum(f) / SR
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.6 + 0.4 * r.random(n))
    y = reson(pulses, 1400, 12) + 0.6 * reson(pulses, 2300, 15) + 0.3 * reson(pulses, 700, 8)
    env = np.sin(np.pi * t / dur) ** 0.7
    motor = sum(np.sin(2 * np.pi * 180 * k * t) / k for k in range(1, 5)) * 0.1
    return (norm(y) * 0.5 + motor) * env


def letter_thump(r, k):
    p = 1 + 0.04 * ((k * 7) % 5 - 2)
    y = 1.0 * thump(120 * p, 52 * p, 0.12, 0.6)
    y += 0.45 * modal(np.array([185, 410, 770, 1240, 1900]) * p, [.10, .07, .05, .03, .02],
                      [1, .8, .6, .35, .2], 0.6, r)
    nb = lp(r.standard_normal(int(0.03 * SR)) * expdec(int(0.03 * SR), 0.006), 2000)
    y[: len(nb)] += 0.6 * nb
    # rattle of the sign on its hooks
    for j in range(r.integers(3, 6)):
        o = int(r.uniform(0.035, 0.12) * SR)
        cl = modal(r.uniform(1500, 3500, 2), [.012, .008], [1, .6], 0.05, r) * r.uniform(0.05, 0.14)
        y[o:o + len(cl)] += cl[: len(y) - o]
    return y


def shimmer(r, dur, density=70):
    """glittering sparkle + soft rising swish (subtitle reveal)"""
    n = int(dur * SR)
    y = np.zeros(n)
    t = tt(n)
    cnt = int(dur * density)
    for _ in range(cnt):
        s = int(r.beta(1.4, 2.2) * (n - 0.3 * SR))
        f = r.uniform(3000, 9500)
        d = int(r.uniform(0.04, 0.2) * SR)
        g = np.sin(2 * np.pi * f * tt(d) + r.uniform(0, 6)) * np.hanning(d) * r.uniform(0.2, 1)
        y[s:s + d] += g[: n - s]

    def m(T, Fq):
        fc = 1500 * (5 ** np.clip(T / (dur * 0.6), 0, 1))
        return band_mask(T, Fq, fc, 0.8) * np.sin(np.pi * np.clip(T / dur, 0, 1)) ** 1.5
    sw = shaped_noise(n, r, m)
    return 0.4 * norm(y) + 0.5 * norm(sw)


def flash(r, whine=True, big=False):
    """press camera: shutter 'ch-chk' + flashbulb pop + capacitor recharge whine (mono)"""
    dur = 1.6 if whine else 0.3
    n = int(dur * SR)
    y = np.zeros(n)
    # shutter: two mechanical clicks
    c1 = modal(r.uniform(1900, 2600) * np.array([1, 1.9, 3.1]), [.008, .006, .004], [1, .7, .5], 0.04, r)
    c1[: int(0.003 * SR)] += click(r, 0.003, 0.0005, 2000)
    y[: len(c1)] += c1 * 0.8
    o = int(r.uniform(0.03, 0.06) * SR)
    c2 = modal(r.uniform(2400, 3200) * np.array([1, 1.7, 2.9]), [.006, .005, .003], [1, .6, .4], 0.03, r)
    y[o:o + len(c2)] += c2 * 0.55
    # bulb pop (magnesium 'pfft-pop')
    po = int(0.008 * SR)
    pn = int(0.12 * SR)
    pop = r.standard_normal(pn) * ar(pn, 0.0005, 0.018 if not big else 0.03)
    pop = bp(pop, 400, 9000) + 0.5 * lp(pop, 300)
    y[po:po + pn] += pop * (1.0 if not big else 1.4)
    y[po:po + int(0.1 * SR)] += 0.3 * thump(160, 80, 0.03, 0.1)
    if whine:
        wo = int(0.12 * SR)
        wn = n - wo
        tw = tt(wn)
        f = 1600 + (r.uniform(7200, 9000) - 1600) * (1 - np.exp(-tw / 0.35))
        w = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        we = np.clip(tw / 0.05, 0, 1) * np.exp(-tw / 0.55)
        y[wo:] += w * we * 0.05
    return y


def curtain_whip(r, dur):
    """velvet curtain whipping open: swelling fabric whoosh with flutter, stereo"""
    n = int(dur * SR)

    def m(T, Fq):
        x = np.clip(T / dur, 0, 1)
        fc = 250 + 2600 * np.sin(np.pi * x * 0.9) ** 2
        env = x ** 2.2 * np.clip((1 - x) / 0.08, 0, 1) + 0.05
        return band_mask(T, Fq, fc, 1.1) * env
    st = shaped_noise(n, r, m, stereo=True)
    t = tt(n)
    fl = 1 + 0.55 * np.sin(2 * np.pi * np.cumsum(18 + 16 * t / dur) / SR * 1.0 + r.uniform(0, 6))
    st *= fl[None, :]
    # heavy velvet 'whap' near the end
    k = int((dur - 0.09) * SR)
    wh = lp(r.standard_normal(int(0.1 * SR)) * ar(int(0.1 * SR), 0.004, 0.03), 1200) + 0.6 * thump(90, 50, 0.05, 0.1)
    st[:, k:k + len(wh)] += 0.8 * norm(wh)[: n - k]
    return norm(st)


# ---------------------------------------------------------------- S2 backstage
def sewing_machine(r, dur, rate=15.0):
    """motor whine + stitch clatter with spin-up/down; mono"""
    n = int(dur * SR)
    t = tt(n)
    spd = np.clip(t / 0.18, 0, 1) * np.clip((dur - t) / 0.22, 0, 1)
    spd = spd * (1 + 0.05 * smooth_noise(n, 3, r))
    fm = 95 * (0.4 + 0.6 * spd)
    ph = np.cumsum(fm) / SR
    motor = sum(np.sin(2 * np.pi * k * ph) / k ** 1.2 for k in range(1, 14))
    motor = bp(motor, 90, 3000) * spd
    y = 0.25 * motor
    sp = np.cumsum(rate * spd) / SR
    idx = np.nonzero(np.diff(np.floor(sp), prepend=0) > 0)[0]
    kern = modal([2300, 3700, 5200], [.006, .004, .003], [1, .6, .3], 0.03, r)
    th = thump(260, 150, 0.012, 0.03)
    for i in idx:
        a = r.uniform(0.7, 1.0)
        e = min(n, i + len(kern))
        y[i:e] += (kern[: e - i] * 0.5 + th[: e - i] * 0.6) * a
        j = i + int(SR / (rate * 2.2))
        if j < n - len(kern):
            y[j:j + len(kern)] += kern * 0.2 * a
    return y


def hanger_ting(r):
    f0 = r.uniform(1500, 2300)
    return modal(f0 * np.array([1, 2.13, 3.47, 5.1]), np.array([.25, .15, .1, .06]) * r.uniform(0.6, 1.3),
                 [1, .6, .45, .25], 0.5, r)


def hanger_clatter(r, n_hits=None):
    n_hits = n_hits or int(r.integers(4, 10))
    dur = 1.2
    n = int(dur * SR)
    y = np.zeros(n)
    t = 0.0
    for _ in range(n_hits):
        t += r.exponential(0.06)
        a = int(t * SR)
        if a >= n - 100:
            break
        h = hanger_ting(r) * r.uniform(0.3, 1)
        e = min(n, a + len(h))
        y[a:e] += h[: e - a]
    # rail scrape
    sn = int(r.uniform(0.25, 0.45) * SR)
    sc = bp(r.standard_normal(sn), 2500, 7000) * np.hanning(sn) * (1 + 0.6 * smooth_noise(sn, 30, r))
    y[:sn] += 0.25 * sc
    return y


def shoe_step(r, soft=True):
    n = int(0.12 * SR)
    x = r.standard_normal(n) * ar(n, 0.002, 0.02)
    y = lp(x, 1800 if soft else 3500) + 0.5 * thump(110, 70, 0.02, 0.12)
    return y


def rustle(r, dur):
    n = int(dur * SR)
    x = bp(r.standard_normal(n), 1500, 8000)
    am = np.clip(smooth_noise(n, 25, r) + 0.3, 0, None) ** 2
    return x * am * np.hanning(n)


def hammer_hit(r, k):
    """small hammer on a metal heel cage; k raises pitch each hit"""
    s = 1 + 0.07 * k
    y = modal(np.array([1180, 1195, 2950, 4720, 6400, 8300]) * s, [.4, .38, .25, .14, .09, .06],
              [1, .7, .6, .45, .3, .2], 1.0, r)
    y[: int(0.004 * SR)] += 1.2 * click(r, 0.004, 0.0005, 1500)
    y[: int(0.05 * SR)] += 0.8 * thump(320, 180, 0.015, 0.05)
    return y


def ratchet(r, dur, clicks=18):
    """telescoping heel ratchet 'crrrk' + stick-slip creak + lock clunk at end"""
    n = int(dur * SR)
    y = np.zeros(n + int(0.4 * SR))
    ts = np.cumsum(np.linspace(1.3, 0.8, clicks))
    ts = ts / ts[-1] * (dur - 0.03)
    for i, t0 in enumerate(ts):
        p = i / clicks
        c = modal(np.array([2400, 4100, 6100]) * (1 + 0.45 * p), [.007, .005, .003], [1, .6, .3], 0.03, r)
        c[: int(0.002 * SR)] += click(r, 0.002, 0.0004, 3000) * 0.6
        a = int(t0 * SR)
        y[a:a + len(c)] += c * r.uniform(0.6, 1.0)
    t = tt(n)
    f = 70 + 90 * t / dur + 12 * smooth_noise(n, 8, r)
    ph = np.cumsum(f) / SR
    pulses = (np.diff(np.floor(ph), prepend=0) > 0) * (0.5 + 0.5 * r.random(n))
    cr = reson(pulses.astype(float), 950, 10) + 0.7 * reson(pulses.astype(float), 1750, 12)
    y[:n] += 0.5 * norm(cr) * np.clip(t / 0.05, 0, 1)
    lock = 0.9 * thump(200, 110, 0.04, 0.3) + 0.6 * modal([1300, 2900, 4400], [.12, .07, .04], [1, .6, .4], 0.3, r)
    a = n
    y[a:a + len(lock)] += lock[: len(y) - a]
    return y


def pearl_click(r, size=1.0, kind='floor'):
    """tiny glassy/ceramic sphere impact (modal)"""
    if kind == 'floor':
        f = np.array([3100, 5000, 7300, 9900]) / size * r.uniform(0.9, 1.1)
        y = modal(f, np.array([.018, .012, .008, .005]) * r.uniform(0.6, 1.3), [1, .7, .5, .3], 0.05, r)
        y[: int(0.012 * SR)] += 0.4 * modal([r.uniform(700, 1300)], [.004], [1], 0.012, r)
    else:  # pearl-pearl
        f = np.array([4600, 7400, 11200]) / size * r.uniform(0.9, 1.1)
        y = modal(f, np.array([.012, .008, .005]) * r.uniform(0.6, 1.3), [1, .6, .4], 0.035, r)
    y[: int(0.0015 * SR)] += 0.3 * click(r, 0.0015, 0.0002, 5000)
    return y


def bounce_schedule(r, t0, h, e):
    """ballistic bounce times/velocities for a ball dropped from height h (m) with restitution e"""
    g = 9.81
    v = np.sqrt(2 * g * h)
    out = [(t0, 1.0)]
    t = t0
    v0 = v
    while True:
        v *= e * r.uniform(0.93, 1.02)
        dt = 2 * v / g
        if dt < 0.006 or v / v0 < 0.04:
            break
        t += dt
        out.append((t, v / v0))
    return out


def roll(r, dur, speed=1.0, seam=0.14):
    """a rolling hard ball on boards: filtered rumble + seam ticks; mono"""
    n = int(dur * SR)
    x = bp(r.standard_normal(n), 900 * speed, 4000 * speed)
    x *= 0.4 + 0.6 * np.clip(smooth_noise(n, 40 * speed, r) + 0.5, 0, None)
    y = x * 0.15
    t = r.uniform(0, seam)
    while t < dur:
        a = int(t * SR)
        c = pearl_click(r, 1.2) * r.uniform(0.15, 0.4)
        e = min(n, a + len(c))
        y[a:e] += c[: e - a]
        t += seam / speed * r.uniform(0.7, 1.3)
    return y


def string_snap(r):
    """taut silk strand breaking: crack + downward twang"""
    n = int(0.35 * SR)
    t = tt(n)
    y = np.zeros(n)
    y[: int(0.003 * SR)] += 2.0 * click(r, 0.003, 0.0003, 1200)
    f = 260 + 1500 * np.exp(-t / 0.025)
    tw = np.sin(2 * np.pi * np.cumsum(f) / SR)
    tw += 0.4 * np.sign(tw) * np.abs(tw) ** 3
    y += 0.7 * tw * np.exp(-t / 0.05)
    y += 0.5 * hp(r.standard_normal(n), 3000) * np.exp(-t / 0.012)
    return y


def whoosh(r, dur, f_from=400, f_to=2500, peak=0.5, bw=1.0, stereo=False):
    n = int(dur * SR)

    def m(T, Fq):
        x = np.clip(T / dur, 0, 1)
        fc = f_from * (f_to / f_from) ** x
        env = np.where(x < peak, (x / peak) ** 1.8, ((1 - x) / (1 - peak + 1e-9)) ** 1.5)
        return band_mask(T, Fq, fc, bw) * env
    return shaped_noise(n, r, m, stereo=stereo)


def sunglasses_squeak(r, dur, f_start=1300, f_end=720):
    """plastic sliding on skin: stick-slip pulse train through frame resonances"""
    n = int(dur * SR)
    t = tt(n)
    f = f_start * (f_end / f_start) ** (t / dur) * (1 + 0.04 * smooth_noise(n, 9, r))
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    y = reson(saw, 2200, 4) + 0.8 * reson(saw, 3700, 5) + 0.5 * reson(saw, 1200, 3)
    am = np.clip(0.6 + 0.5 * smooth_noise(n, 14, r), 0, 1.2)
    env = np.clip(t / 0.03, 0, 1) * np.clip((dur - t) / 0.05, 0, 1)
    return norm(y * am * env)


def slide_whistle(r, dur, f0=450, f1=1700):
    n = int(dur * SR)
    t = tt(n)
    x = t / dur
    f = f0 * (f1 / f0) ** (x ** 0.8) * (1 + 0.015 * np.sin(2 * np.pi * 6 * t))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.12 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    y += 0.05 * bp(r.standard_normal(n), 1000, 5000)
    env = np.clip(t / 0.02, 0, 1) * np.clip((dur - t) / 0.06, 0, 1)
    return y * env


def skid(r, dur):
    n = int(dur * SR)
    t = tt(n)
    f = 330 * (1 + 0.1 * smooth_noise(n, 20, r)) * (1 - 0.2 * t / dur)
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    y = reson(saw, 900, 3) + 0.6 * reson(saw, 1900, 4)
    return norm(y) * np.hanning(n) ** 0.5


def rumble_slide(r, dur):
    """penguin belly-surfing over hundreds of loose pearls: low rumble + dense clicks"""
    n = int(dur * SR)
    t = tt(n)
    base = lp(brown(n, r), 500) + 0.4 * bp(r.standard_normal(n), 600, 2500)
    base *= 0.6 + 0.4 * np.clip(smooth_noise(n, 25, r) + 0.6, 0, None)
    y = norm(base) * 0.5
    cnt = int(dur * 260)
    for _ in range(cnt):
        a = int(r.uniform(0, dur - 0.05) * SR)
        c = pearl_click(r, r.uniform(0.9, 1.4), 'floor' if r.random() < 0.6 else 'pp') * r.uniform(0.05, 0.3)
        y[a:a + len(c)] += c
    env = np.clip(t / 0.15, 0, 1) * np.clip((dur - t) / 0.12, 0, 1) * (0.7 + 0.3 * t / dur)
    return y * env


def spin_whirr(r, dur, rate0=3, rate1=10):
    """spinning: AM whoosh at the rotation rate + tonal whirr. returns (mono, rot_phase)"""
    n = int(dur * SR)
    t = tt(n)
    rate = rate0 + (rate1 - rate0) * (t / dur) ** 1.3
    rot = np.cumsum(rate) / SR
    am = (0.5 + 0.5 * np.sin(2 * np.pi * rot)) ** 2
    nz = bp(r.standard_normal(n), 500, 3000) * am
    tone_f = 160 + 180 * t / dur
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * (0.4 + 0.6 * am)
    env = np.clip(t / 0.1, 0, 1) * np.clip((dur - t) / 0.08, 0, 1)
    return (norm(nz) * 0.7 + 0.3 * tone) * env, rot


def boing(r, f0=200, dur=1.1):
    """spring 'boi-oi-oing'"""
    n = int(dur * SR)
    t = tt(n)
    f = f0 * (1 + 0.35 * np.exp(-t / 0.35) * np.sin(2 * np.pi * 11 * t)) * (1 + 0.1 * np.exp(-t / 0.05))
    ph = np.cumsum(f) / SR
    y = np.sin(2 * np.pi * ph) + 0.35 * np.sin(4 * np.pi * ph) + 0.15 * np.sin(2 * np.pi * 3.01 * ph)
    return y * np.exp(-t / 0.4) * np.clip(t / 0.004, 0, 1)


def umbrella_pop(r):
    """big satisfying fabric WHUMP + rib clicks + spring boing (mono)"""
    n = int(1.4 * SR)
    y = np.zeros(n)
    y[: int(0.6 * SR)] += 1.0 * thump(95, 42, 0.14, 0.6, drop=0.04)
    fn = int(0.25 * SR)
    fab = r.standard_normal(fn) * ar(fn, 0.003, 0.045)
    fab = bp(fab, 250, 4000) + 0.6 * lp(fab, 250)
    y[:fn] += 0.9 * norm(fab)
    for i in range(8):
        a = int((0.004 + 0.006 * i + r.uniform(0, 0.004)) * SR)
        c = modal(r.uniform(2000, 3200) * np.array([1, 1.8]), [.01, .007], [1, .5], 0.03, r) * 0.25
        y[a:a + len(c)] += c
    b = boing(r, 210, 1.1)
    a = int(0.03 * SR)
    y[a:a + len(b)] += 0.45 * b[: n - a]
    return y


def wind(r, dur):
    """gentle high-air breeze with veil flutter, stereo"""
    n = int(dur * SR)

    def m(T, Fq):
        return band_mask(T, Fq, 700, 1.3) + 0.4 * band_mask(T, Fq, 2500, 0.8)
    st = shaped_noise(n, r, m, stereo=True, nper=2048)
    t = tt(n)
    for ch in range(2):
        g = 0.6 + 0.4 * np.clip(smooth_noise(n, 0.6, r) + 0.3, 0, 2)
        st[ch] *= g
    flut = bp(r.standard_normal(n), 1500, 5000) * np.clip(np.sin(2 * np.pi * np.cumsum(11 + 3 * smooth_noise(n, 1, r)) / SR), 0, 1) ** 2
    flut *= np.clip(smooth_noise(n, 0.8, r), 0, None)
    st += 0.35 * np.vstack([flut, np.roll(flut, 300)])
    return norm(st)


def confetti_cannon(r):
    n = int(0.8 * SR)
    y = np.zeros(n)
    y[: int(0.5 * SR)] += 1.0 * thump(80, 38, 0.12, 0.5, drop=0.03)
    pn = int(0.45 * SR)
    p = r.standard_normal(pn) * ar(pn, 0.002, 0.08)
    y[:pn] += 0.8 * norm(bp(p, 300, 6000) + 0.5 * lp(p, 300))
    y[: int(0.003 * SR)] += click(r, 0.003, 0.0004, 1000)
    return y


def confetti_rustle(r, dur):
    """falling paper confetti: sparse crinkly grains, stereo"""
    n = int(dur * SR)
    st = np.zeros((2, n))
    t = tt(n)
    dens = np.exp(-t / (dur * 0.45))
    cnt = int(dur * 900)
    ts = np.sort(r.random(cnt) ** 1.8 * dur)
    for tg in ts:
        a = int(tg * SR)
        gl = int(r.uniform(0.001, 0.004) * SR)
        g = hp(r.standard_normal(gl), 3000) * np.hanning(gl) * r.uniform(0.2, 1)
        e = min(n, a + gl)
        p = r.uniform(-1, 1)
        st[0, a:e] += g[: e - a] * np.cos((p + 1) * np.pi / 4)
        st[1, a:e] += g[: e - a] * np.sin((p + 1) * np.pi / 4)
    return st


def bow_creak(r, dur):
    """old-wood / old-knee comic creak: irregular stick-slip through wood resonances"""
    n = int(dur * SR)
    t = tt(n)
    rate = 55 + 35 * np.sin(np.pi * t / dur) + 15 * smooth_noise(n, 5, r)
    ph = np.cumsum(rate) / SR
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.5 + 0.5 * r.random(n))
    y = (reson(pulses, 380, 14) + 0.8 * reson(pulses, 820, 18) + 0.6 * reson(pulses, 1450, 20)
         + 0.4 * reson(pulses, 2350, 22))
    env = np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.1, 0, 1)
    return norm(y) * env


def ting(r, f0=2150):
    """wink sparkle-bell"""
    y = modal(f0 * np.array([1, 2.756, 5.404, 1.003]), [1.1, .5, .22, 1.0], [1, .45, .2, .6], 1.6, r, att=0.0005)
    for _ in range(6):
        a = int(r.uniform(0.0, 0.25) * SR)
        g = modal([r.uniform(6000, 11000)], [r.uniform(.04, .12)], [1], 0.2, r) * r.uniform(0.05, 0.15)
        y[a:a + len(g)] += g
    return y


def title_slam(r):
    n = int(1.6 * SR)
    y = np.zeros(n)
    y[: int(1.0 * SR)] += 1.0 * thump(70, 36, 0.35, 1.0, drop=0.05)
    y[: int(0.004 * SR)] += 1.2 * click(r, 0.004, 0.0006, 800)
    bn = int(0.2 * SR)
    b = r.standard_normal(bn) * ar(bn, 0.001, 0.03)
    y[:bn] += 0.7 * norm(lp(b, 2500))
    y += 0.3 * modal([112, 263, 471, 690, 1130, 1790], [.6, .45, .35, .25, .18, .1], [1, .8, .6, .5, .35, .2], 1.6, r)
    return y


def lens_clink(r):
    """pearl tapping a glass lens: bright inharmonic glass partials, beating pairs"""
    f = np.array([2350, 2362, 4120, 6730, 6745, 9480, 12100])
    y = modal(f, [.9, .85, .6, .4, .38, .25, .15], [1, .6, .6, .45, .3, .25, .15], 1.8, r, att=0.0002)
    y[: int(0.002 * SR)] += 0.8 * click(r, 0.002, 0.0002, 4000)
    return y


# ---------------------------------------------------------------- runway walkers
def stiletto(r, foot=0):
    """1-metre metal stiletto cage heel on a lacquered wooden runway"""
    y = np.zeros(int(0.5 * SR))
    y[: int(0.003 * SR)] += 1.4 * click(r, 0.003, 0.0004, 3000)
    body = modal(np.array([430, 960, 1640, 2870]) * (1 + 0.03 * foot) * r.uniform(0.97, 1.03),
                 [.045, .03, .02, .012], [1, .8, .55, .35], 0.3, r)
    y[: len(body)] += 0.7 * body
    ring = modal(r.uniform(0.97, 1.03) * np.array([3150, 5420, 7930]), [.12, .08, .05], [1, .6, .4], 0.5, r)
    y += 0.12 * ring
    y[: int(0.08 * SR)] += 0.35 * thump(130, 80, 0.03, 0.08)
    return y


def hoof_heel(r, foot=0):
    """giraffe hoof in a heel: chunky coconut 'clop' + heel tick"""
    y = np.zeros(int(0.4 * SR))
    y[: int(0.003 * SR)] += 0.9 * click(r, 0.003, 0.0005, 2500)
    f = np.array([340, 710, 1290, 2100]) * (1 + 0.05 * foot) * r.uniform(0.96, 1.04)
    body = modal(f, [.06, .04, .025, .015], [1, .7, .45, .25], 0.3, r)
    y[: len(body)] += 0.9 * body
    y[: int(0.1 * SR)] += 0.6 * thump(120, 70, 0.04, 0.1)
    return y


def penguin_pat(r, foot=0):
    """soft flat rubbery flipper-foot slap"""
    n = int(0.12 * SR)
    x = r.standard_normal(n) * ar(n, 0.001, 0.012)
    y = bp(x, 500, 2600) * 0.8 + 0.6 * thump(190 + 20 * foot, 120, 0.02, 0.12)
    return y


def crystal_ping(r, bright=1.0):
    """chandelier prism tinkle"""
    f0 = r.uniform(2800, 6500) * bright
    return modal(f0 * np.array([1, 2.32, 3.87]), np.array([.35, .2, .1]) * r.uniform(0.5, 1.4),
                 [1, .5, .3], 0.8, r, att=0.0002)
