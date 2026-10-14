"""Procedural crowd: formant-synthesised 'animalese' babble voices, vocal reactions,
whole-crowd gasp, hand claps, applause and whistles. No samples, no ML.

Voices are rendered at VSR (16 kHz) by additive glottal-harmonic synthesis shaped
by three parallel Lorentzian formant resonances (per-sample formant tracks), plus
aspiration noise and consonant noise bursts, then upsampled to 48 kHz.
"""
import numpy as np
from scipy import signal
from dsp import (SR, N, fs, db, R, lp, hp, bp, reson, tt, expdec, ar, smooth_noise,
                 shaped_noise, band_mask, pan_gains, rmsnorm, norm, curve, FPS)

VSR = 16000
UP = SR // VSR

# adult male formant targets (Hz); female/child scale these by ~1.12-1.25
VOW = {
    'a': (730, 1240, 2550), 'e': (480, 1850, 2550), 'i': (290, 2250, 2950),
    'o': (500, 880, 2450), 'u': (340, 780, 2300), 'ae': (660, 1700, 2450),
    'uh': (620, 1150, 2450), 'eh': (560, 1700, 2500), 'oo': (380, 850, 2350),
}
SPEECH_VOWELS = ['a', 'e', 'i', 'o', 'u', 'ae', 'uh', 'eh']


def vox(f0, F, amp, r, tilt=1.15, breath=0.06, B=(85, 110, 160), g=(1.0, 0.6, 0.32), fmax=3900):
    """additive glottal-source voice through 3 parallel formants.
    f0 (n,), F (3,n), amp (n,) all at VSR."""
    n = len(f0)
    f0 = np.maximum(f0, 50)
    theta = 2 * np.pi * np.cumsum(f0) / VSR
    H = max(1, int(fmax / f0.min()))
    hs = np.arange(1, H + 1)[:, None].astype(float)
    ph = r.uniform(0, 2 * np.pi, (H, 1))
    tiltv = hs ** (-tilt)
    out = np.empty(n)
    for a in range(0, n, 4000):
        b = min(n, a + 4000)
        fh = hs * f0[None, a:b]
        m = np.zeros_like(fh)
        for k in range(3):
            x = (fh - F[k, a:b][None, :]) / (B[k] * 0.5)
            m += g[k] / np.sqrt(1 + x * x)
        m *= tiltv
        m[fh > fmax] = 0
        out[a:b] = (m * np.sin(hs * theta[None, a:b] + ph)).sum(0)
    out /= (np.sqrt(np.mean(out ** 2)) + 1e-9)
    if breath > 0:
        nz = r.standard_normal(n)
        nz = reson(nz, float(np.mean(F[1])), 2.0, VSR) + 0.5 * reson(nz, float(np.mean(F[0])), 2.0, VSR)
        nz = bp(nz, 300, 5000, 2, VSR)
        out = out + breath * nz / (np.std(nz) + 1e-9)
    return out * amp


def _tracks_from_segments(n, segs, fscale):
    """segs: list of (t_center_s, vowel) -> F (3,n) interpolated formant tracks"""
    tc = np.array([s[0] for s in segs])
    t = np.arange(n) / VSR
    F = np.zeros((3, n))
    for k in range(3):
        v = np.array([VOW[s[1]][k] for s in segs]) * fscale
        F[k] = np.interp(t, tc, v)
    return F


def speaker(r):
    female = r.random() < 0.5
    if female:
        return dict(base=r.uniform(175, 245), fscale=r.uniform(1.12, 1.22), female=True)
    return dict(base=r.uniform(92, 140), fscale=r.uniform(0.95, 1.05), female=False)


def murmur_voice(r, dur, spk=None, talk=(0.8, 3.5), pause=(0.3, 2.0), laugh_prob=0.04):
    """one babbling 'animalese' speaker; returns mono at VSR"""
    spk = spk or speaker(r)
    n = int(dur * VSR)
    amp = np.zeros(n)
    f0 = np.full(n, spk['base'])
    cons = np.zeros(n)
    segs = [(0.0, 'uh')]
    t = r.uniform(0, 2.0)
    while t < dur:
        plen = r.uniform(*talk)
        pend = min(dur, t + plen)
        laugh = r.random() < laugh_prob
        p0 = t
        while t < pend:
            sd = r.uniform(0.08, 0.14) if laugh else r.uniform(0.09, 0.26)
            v = 'a' if laugh else SPEECH_VOWELS[r.integers(len(SPEECH_VOWELS))]
            c = t + sd / 2
            segs.append((c, v))
            a0, a1 = int(t * VSR), min(n, int((t + sd * 1.25) * VSR))
            if a1 > a0:
                w = np.hanning(a1 - a0) ** 0.8
                stress = r.uniform(0.45, 1.0)
                amp[a0:a1] = np.maximum(amp[a0:a1], w * stress)
                # intonation: declination through phrase + accent
                prog = (t - p0) / max(plen, 0.1)
                mul = (1.18 - 0.28 * prog) * (1 + 0.12 * (stress - 0.7))
                if laugh:
                    mul *= 1.35
                f0[a0:a1] = spk['base'] * mul
                if r.random() < (0.9 if laugh else 0.6):
                    cl = int(r.uniform(0.015, 0.05) * VSR)
                    b1 = min(n, a0 + cl)
                    cons[a0:b1] += r.uniform(0.15, 0.45) * (1 if laugh else r.choice([1, 0.6]))
            t += sd * (1.5 if laugh else 1.0)
        t = pend + r.uniform(*pause)
    segs.append((dur + 1, 'uh'))
    # smooth f0 then add jitter + drift
    f0 = signal.lfilter([0.02], [1, -0.98], f0 - spk['base']) + spk['base']
    f0 *= 1 + 0.012 * smooth_noise(n, 12, r, VSR) + 0.03 * smooth_noise(n, 0.7, r, VSR)
    F = _tracks_from_segments(n, segs, spk['fscale'])
    F *= 1 + 0.03 * smooth_noise(n, 3, r, VSR)[None, :]
    amp = signal.lfilter([0.08], [1, -0.92], amp)
    y = vox(f0, F, amp, r, breath=0.07)
    # consonants: hissy / bursty noise at syllable onsets
    nz = r.standard_normal(n)
    nz = hp(nz, r.uniform(2200, 3800), 2, VSR)
    cons = signal.lfilter([0.15], [1, -0.85], cons)
    y += nz * cons * 0.5
    return y


def to48(x):
    return signal.resample_poly(x, UP, 1, axis=-1)


def crowd_murmur(seed, dur, n_voices=28, near=0.0):
    """stereo 48 kHz theatre babble bed of n_voices"""
    r = R(seed)
    n = int(dur * VSR)
    st = np.zeros((2, n))
    for v in range(n_voices):
        rv = R(seed * 1000 + v)
        dist = rv.uniform(near, 1.0)
        y = murmur_voice(rv, dur)
        y = lp(y, 3600 - 2200 * dist, 2, VSR)
        g = db(-3 - 13 * dist + rv.uniform(-2, 2))
        gl, gr = pan_gains(rv.uniform(-0.95, 0.95))
        st[0] += y * g * gl
        st[1] += y * g * gr
    return to48(st)


def sung(r, dur, vowels, f0mul, spk, amp_att=0.08, amp_rel=0.25, breath=0.12, vib=0.0, sustain=1.0):
    """a sustained reaction vowel ('ooh', 'aah', 'woo'); vowels = [(frac, vowel)...];
    f0mul = fn(frac array)->multiplier on speaker base."""
    n = int(dur * VSR)
    fr = np.linspace(0, 1, n)
    segs = [(f * dur, v) for f, v in vowels]
    F = _tracks_from_segments(n, segs, spk['fscale'])
    f0 = spk['base'] * f0mul(fr)
    f0 *= 1 + 0.015 * smooth_noise(n, 10, r, VSR) + vib * np.sin(2 * np.pi * r.uniform(4.5, 6.5) * fr * dur)
    t = fr * dur
    amp = np.clip(t / amp_att, 0, 1) * np.clip((dur - t) / amp_rel, 0, 1) ** 1.3
    amp *= sustain + (1 - sustain) * (1 - fr)
    return vox(f0, F, amp, r, breath=breath)


def reaction(seed, kind, n_voices, dur_range, onset_spread, level_db=-6):
    """stereo 48 kHz crowd reaction; returns (stereo, length). Onsets from t=0."""
    r = R(seed)
    maxdur = dur_range[1] + onset_spread + 0.1
    n = int(maxdur * VSR)
    st = np.zeros((2, n))
    for v in range(n_voices):
        rv = R(seed * 7919 + v)
        spk = speaker(rv)
        d = rv.uniform(*dur_range)
        if kind == 'ooh':
            vw = [(0, 'u'), (0.5, 'oo'), (1.0, 'o')]
            pk = rv.uniform(1.2, 1.45)
            fm = lambda x, pk=pk: 1 + (pk - 1) * np.sin(np.pi * np.clip(x * 1.3, 0, 1)) ** 1.5 - 0.12 * x
            y = sung(rv, d, vw, fm, spk, amp_att=0.12, amp_rel=0.4, breath=0.15, vib=0.012)
        elif kind == 'aah':
            vw = [(0, 'a'), (0.6, 'a'), (1.0, 'uh')]
            hi = rv.uniform(1.25, 1.5)
            fm = lambda x, hi=hi: hi - (hi - 0.78) * x ** 0.8
            y = sung(rv, d, vw, fm, spk, amp_att=0.06, amp_rel=0.5, breath=0.35, sustain=0.5)
        elif kind == 'oh':  # short shocked 'oh!'
            vw = [(0, 'o'), (1.0, 'u')]
            hi = rv.uniform(1.3, 1.6)
            fm = lambda x, hi=hi: hi - 0.3 * x
            y = sung(rv, d, vw, fm, spk, amp_att=0.02, amp_rel=0.15, breath=0.2, sustain=0.3)
        elif kind == 'whoa':  # rising tension 'ooooOOH'
            vw = [(0, 'o'), (0.7, 'oo'), (1.0, 'a')]
            fm = lambda x: 1.0 + 0.55 * x ** 1.6
            y = sung(rv, d, vw, fm, spk, amp_att=0.3, amp_rel=0.08, breath=0.2, vib=0.01)
            y *= np.linspace(0.3, 1.0, len(y))
        elif kind == 'titter':  # little crowd chuckle
            y = murmur_voice(rv, d, spk, talk=(0.3, 0.9), pause=(0.2, 0.4), laugh_prob=1.0)
        else:
            raise ValueError(kind)
        if kind != 'titter':
            dist = rv.uniform(0, 1)
            y = lp(y, 3800 - 2000 * dist, 2, VSR) * db(-12 * dist)
        on = int(abs(rv.normal(0, onset_spread / 2.2)) * VSR)
        gl, gr = pan_gains(rv.uniform(-0.95, 0.95))
        e = min(n, on + len(y))
        st[0, on:e] += y[: e - on] * gl
        st[1, on:e] += y[: e - on] * gr
    st = to48(st)
    return rmsnorm(st, 1.0) * db(level_db)


def cheer_voice(rv, spk):
    kind = rv.choice(['woo', 'woo', 'yeah', 'bravo', 'hey', 'aah'])
    if kind == 'woo':
        d = rv.uniform(0.5, 1.2)
        vw = [(0, 'u'), (0.3, 'oo'), (1, 'o')]
        pk = rv.uniform(1.8, 2.5)
        fm = lambda x: 1.4 + (pk - 1.4) * np.sin(np.pi * np.clip(x * 1.5, 0, 1)) ** 0.7 - 0.4 * x
        return sung(rv, d, vw, fm, spk, amp_att=0.05, amp_rel=0.3, breath=0.25, vib=0.02)
    if kind == 'yeah':
        d = rv.uniform(0.4, 0.8)
        vw = [(0, 'i'), (0.25, 'e'), (0.6, 'ae'), (1, 'a')]
        hi = rv.uniform(1.7, 2.2)
        fm = lambda x: hi - 0.5 * x
        return sung(rv, d, vw, fm, spk, amp_att=0.03, amp_rel=0.2, breath=0.3)
    if kind == 'bravo':
        d1 = rv.uniform(0.18, 0.25); d2 = rv.uniform(0.35, 0.6)
        hi = rv.uniform(1.6, 2.0)
        a = sung(rv, d1, [(0, 'uh'), (1, 'a')], lambda x: hi + 0.1 * x, spk, amp_att=0.02, amp_rel=0.05, breath=0.2)
        b = sung(rv, d2, [(0, 'o'), (1, 'u')], lambda x: hi * 0.95 - 0.35 * x, spk, amp_att=0.03, amp_rel=0.25, breath=0.2)
        gap = np.zeros(int(0.04 * VSR))
        return np.concatenate([a, gap, b])
    if kind == 'hey':
        d = rv.uniform(0.2, 0.35)
        return sung(rv, d, [(0, 'eh'), (1, 'i')], lambda x: rv.uniform(1.8, 2.3) - 0.2 * x, spk,
                    amp_att=0.015, amp_rel=0.1, breath=0.3)
    d = rv.uniform(0.6, 1.1)
    return sung(rv, d, [(0, 'a'), (1, 'a')], lambda x: 1.6 - 0.3 * x, spk, amp_att=0.05, amp_rel=0.3, breath=0.3)


def cheering(seed, dur, density_fn, n_max=140):
    """stereo 48k cheer voices spread over dur seconds. density_fn(t)->0..1 relative."""
    r = R(seed)
    n = int(dur * VSR)
    st = np.zeros((2, n))
    tgrid = np.linspace(0, dur, 2000)
    dens = density_fn(tgrid)
    cdf = np.cumsum(dens); cdf /= cdf[-1]
    for v in range(n_max):
        rv = R(seed * 131 + v)
        t0 = np.interp(rv.random(), cdf, tgrid)
        spk = speaker(rv)
        y = cheer_voice(rv, spk)
        dist = rv.uniform(0, 1)
        y = lp(y, 4000 - 2000 * dist, 2, VSR) * db(-10 * dist + rv.uniform(-3, 2)) * density_fn(np.array([t0]))[0] ** 0.5
        a = int(t0 * VSR)
        e = min(n, a + len(y))
        gl, gr = pan_gains(rv.uniform(-0.95, 0.95))
        st[0, a:e] += y[: e - a] * gl
        st[1, a:e] += y[: e - a] * gr
    return to48(st)


def gasp_person(r, dur):
    """one unvoiced inhaled gasp at 48 kHz: breath noise through 'hh-ae' formants"""
    n = int(dur * SR)
    fsc = r.uniform(0.95, 1.25)
    att = r.uniform(0.02, 0.05)
    rel = r.uniform(0.03, 0.07)
    bright = r.uniform(0.2, 0.5)

    def m(T, Fq):
        e = np.clip(T / att, 0, 1) ** 0.7 * np.clip((dur - T) / rel, 0, 1)
        sweep = 1 + 0.15 * (T / dur)
        spec = (band_mask(T, Fq, 700 * fsc * sweep, 0.45) * 0.9 + band_mask(T, Fq, 1700 * fsc * sweep, 0.35) * 1.0
                + band_mask(T, Fq, 2700 * fsc, 0.3) * 0.6 + band_mask(T, Fq, 5000, 0.7) * bright)
        return e * spec
    return shaped_noise(n, r, m, SR, nper=512)


def crowd_gasp(seed, n_people=60):
    """whole-crowd sharp inhale, stereo 48k; onsets tightly clustered (~70 ms)"""
    r = R(seed)
    n = int(0.9 * SR)
    st = np.zeros((2, n))
    for p in range(n_people):
        rv = R(seed * 17 + p)
        d = rv.uniform(0.28, 0.5)
        y = gasp_person(rv, d)
        dist = rv.uniform(0, 1)
        y = lp(y, 9000 - 5000 * dist, 2) * db(-9 * dist)
        on = int(abs(rv.normal(0, 0.03)) * SR)
        gl, gr = pan_gains(rv.uniform(-1, 1))
        e = min(n, on + len(y))
        st[0, on:e] += y[: e - on] * gl
        st[1, on:e] += y[: e - on] * gr
    # a few voiced inhaled 'hah!' squeaks for character
    vs = np.zeros((2, int(0.9 * VSR)))
    for p in range(10):
        rv = R(seed * 31 + p)
        spk = speaker(rv)
        d = rv.uniform(0.15, 0.3)
        y = sung(rv, d, [(0, 'ae'), (1, 'a')], lambda x: 2.2 + 0.4 * x, spk, amp_att=0.02, amp_rel=0.03,
                 breath=1.2)
        on = int(abs(rv.normal(0, 0.03)) * VSR)
        gl, gr = pan_gains(rv.uniform(-1, 1))
        e = min(vs.shape[1], on + len(y))
        vs[0, on:e] += y[: e - on] * gl * 0.25
        vs[1, on:e] += y[: e - on] * gr * 0.25
    vs = to48(vs)[:, :n]
    st[:, : vs.shape[1]] += vs * (np.sqrt(np.mean(st ** 2)) / (np.sqrt(np.mean(vs ** 2)) + 1e-9)) * 0.3
    return st


# ---------------------------------------------------------------- claps
def clap_kernel(r, sr=SR):
    n = int(0.06 * sr)
    tau = r.uniform(0.003, 0.009)
    x = r.standard_normal(n) * expdec(n, tau, sr)
    k = int(0.0004 * sr)
    x[:k] *= np.linspace(0, 1, k)
    fc = r.uniform(750, 2300)
    y = reson(x, fc, r.uniform(1.1, 2.4), sr) + 0.35 * hp(x, 400, 2, sr) + 0.3 * reson(x, r.uniform(250, 500), 2.0, sr)
    # second palm contact 0.6-2 ms later
    off = int(r.uniform(0.0006, 0.002) * sr)
    y2 = np.zeros(n)
    y2[off:] = y[: n - off] * r.uniform(0.3, 0.6)
    return norm(y + y2)


def single_clap(seed):
    r = R(seed)
    return clap_kernel(r)


def applause(seed, n_clappers, ctrl, groups=24):
    """stereo full-length (N) applause. ctrl: per-sample density/level curve (N,) 0..1.
    Each clapper claps at its own rate while ctrl exceeds its personal threshold,
    loudness follows ctrl; clappers are grouped by timbre kernel for fast convolution."""
    r = R(seed)
    kernels = [clap_kernel(R(seed * 97 + g)) for g in range(groups)]
    gpan = np.linspace(-0.95, 0.95, groups)
    r.shuffle(gpan)
    imps = np.zeros((groups, N))
    active = np.nonzero(ctrl > 1e-3)[0]
    if len(active) == 0:
        return np.zeros((2, N))
    a0, a1 = active[0], active[-1]
    for c in range(n_clappers):
        g = c % groups
        rate = r.uniform(3.4, 6.8)
        th = r.uniform(0.0, 0.85) ** 1.3
        lvl = db(r.uniform(-12, 0))
        # reaction delay after the ctrl curve rises
        t = a0 + int(abs(r.normal(0, 0.12)) * SR)
        while t < a1:
            c_now = ctrl[t]
            if c_now > th:
                amp = lvl * c_now ** 0.6 * (1 + 0.25 * r.standard_normal())
                imps[g, t] += max(amp, 0)
            t += int(SR / rate * (1 + 0.07 * r.standard_normal()))
    st = np.zeros((2, N))
    for g in range(groups):
        y = signal.oaconvolve(imps[g], kernels[g])[:N]
        gl, gr = pan_gains(gpan[g])
        st[0] += y * gl
        st[1] += y * gr
    return st


def whistle(r, kind=None):
    """human whistle: wolf-whistle or sustained finger whistle, 48k mono"""
    kind = kind or r.choice(['wolf', 'finger'])
    if kind == 'wolf':
        d1, d2 = r.uniform(0.25, 0.35), r.uniform(0.45, 0.6)
        f1 = np.geomspace(r.uniform(1100, 1400), r.uniform(2600, 3000), int(d1 * SR))
        gap = np.full(int(0.08 * SR), 0.0)
        f2 = np.concatenate([np.geomspace(r.uniform(1500, 1800), r.uniform(2700, 3000), int(d2 * SR * 0.3)),
                             np.geomspace(3000, r.uniform(1000, 1300), int(d2 * SR * 0.7))])
        freq = np.concatenate([f1, np.full(len(gap), 2000.0), f2])
        env = np.concatenate([np.hanning(len(f1)) ** 0.5, gap, np.hanning(len(f2)) ** 0.4])
    else:
        d = r.uniform(0.6, 1.1)
        n = int(d * SR)
        fr = np.linspace(0, 1, n)
        freq = r.uniform(2500, 3200) * (1 + 0.08 * fr) * (1 + 0.012 * np.sin(2 * np.pi * 7 * fr * d))
        env = np.clip(fr / 0.05, 0, 1) * np.clip((1 - fr) / 0.15, 0, 1)
    y = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env
    nz = bp(r.standard_normal(len(y)), 2000, 5000) * env * 0.08
    return y + nz
