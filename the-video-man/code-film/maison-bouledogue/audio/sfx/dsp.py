"""Core DSP helpers for the Maison Bouledogue SFX stem.

Pure numpy/scipy. No samples, no ML. Everything is seeded and deterministic.
"""
import numpy as np
from scipy import signal

SR = 48000
FPS = 24
NFRAMES = 1440
N = SR * NFRAMES // FPS  # 2,880,000 samples


def fs(frame):
    """frame (float ok) -> sample index"""
    return int(round(frame * SR / FPS))


def sec(frames):
    return frames / FPS


def db(x):
    return 10.0 ** (x / 20.0)


def R(seed):
    return np.random.default_rng(seed)


# ---------------------------------------------------------------- filters
def _sos(kind, f, order, sr):
    return signal.butter(order, f, btype=kind, fs=sr, output='sos')


def lp(x, f, order=2, sr=SR):
    return signal.sosfilt(_sos('lowpass', min(f, sr * 0.49), order, sr), x, axis=-1)


def hp(x, f, order=2, sr=SR):
    return signal.sosfilt(_sos('highpass', f, order, sr), x, axis=-1)


def bp(x, lo, hi, order=2, sr=SR):
    return signal.sosfilt(_sos('bandpass', [lo, min(hi, sr * 0.49)], order, sr), x, axis=-1)


def reson(x, f, Q, sr=SR):
    b, a = signal.iirpeak(min(f, sr * 0.48), Q, fs=sr)
    return signal.lfilter(b, a, x, axis=-1)


# ---------------------------------------------------------------- envelopes
def tt(n, sr=SR):
    return np.arange(n) / sr


def expdec(n, tau, sr=SR):
    return np.exp(-np.arange(n) / (tau * sr))


def ar(n, att, tau, sr=SR):
    """linear attack (s) then exponential decay (tau s)"""
    t = tt(n, sr)
    e = np.exp(-np.maximum(t - att, 0) / tau)
    if att > 0:
        e = e * np.clip(t / att, 0, 1)
    return e


def fade(x, fin=0.002, fout=0.005, sr=SR):
    x = np.array(x, dtype=float, copy=True)
    n = x.shape[-1]
    a = min(n, int(fin * sr))
    b = min(n, int(fout * sr))
    if a > 0:
        x[..., :a] *= np.linspace(0, 1, a)
    if b > 0:
        x[..., n - b:] *= np.linspace(1, 0, b)
    return x


def curve(frames_vals, n, t0_frame=0.0, sr=SR):
    """piecewise-linear control curve given [(frame, value), ...]; n samples starting at t0_frame"""
    fr = np.array([p[0] for p in frames_vals], float)
    vv = np.array([p[1] for p in frames_vals], float)
    t = t0_frame + np.arange(n) * FPS / sr
    return np.interp(t, fr, vv)


def smooth_noise(n, rate, r, sr=SR):
    """band-limited random wander, ~unit std, changes at `rate` Hz"""
    k = max(2, int(n / sr * rate) + 3)
    pts = r.standard_normal(k)
    x = np.linspace(0, k - 1.001, n)
    i = np.floor(x).astype(int)
    fr = x - i
    fr = fr * fr * (3 - 2 * fr)  # smoothstep
    return pts[i] * (1 - fr) + pts[i + 1] * fr


# ---------------------------------------------------------------- sources
def white(n, r):
    return r.standard_normal(n)


def pink(n, r):
    X = np.fft.rfft(r.standard_normal(n))
    f = np.arange(len(X)); f[0] = 1
    y = np.fft.irfft(X / np.sqrt(f), n)
    return y / (np.std(y) + 1e-12)


def brown(n, r):
    X = np.fft.rfft(r.standard_normal(n))
    f = np.arange(len(X)); f[0] = 1
    y = np.fft.irfft(X / f, n)
    return y / (np.std(y) + 1e-12)


def sine_glide(freq, sr=SR, phase=0.0):
    """freq: per-sample array (Hz)"""
    return np.sin(phase + 2 * np.pi * np.cumsum(freq) / sr)


def modal(freqs, taus, amps, dur, r, sr=SR, att=0.0003):
    """sum of exponentially decaying sinusoids (modal synthesis)"""
    n = int(dur * sr)
    t = tt(n, sr)
    y = np.zeros(n)
    for f, tau, a in zip(freqs, taus, amps):
        if f >= sr * 0.48:
            continue
        y += a * np.exp(-t / tau) * np.sin(2 * np.pi * f * t + r.uniform(0, 2 * np.pi))
    if att > 0:
        k = max(1, int(att * sr))
        y[:k] *= np.linspace(0, 1, k)
    return y


def thump(f0, f1, tau, dur, sr=SR, drop=0.03):
    """pitch-dropping sine thump (kick-drum like body)"""
    n = int(dur * sr)
    t = tt(n, sr)
    f = f1 + (f0 - f1) * np.exp(-t / drop)
    y = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t / tau)
    k = int(0.001 * sr)
    y[:k] *= np.linspace(0, 1, k)
    return y


def click(r, dur=0.004, tau=0.0006, hpf=2500, sr=SR):
    n = int(dur * sr)
    x = r.standard_normal(n) * expdec(n, tau, sr)
    return hp(x, hpf, 2, sr)


def shaped_noise(n, r, maskfn, sr=SR, nper=1024, stereo=False):
    """noise shaped by a time-frequency magnitude mask maskfn(T, Fq)->(nf, nt).
    T is seconds (1, nt), Fq Hz (nf, 1)."""
    chans = 2 if stereo else 1
    outs = []
    for _ in range(chans):
        x = r.standard_normal(n + nper)
        f, t, Z = signal.stft(x, fs=sr, nperseg=nper, noverlap=nper * 3 // 4)
        M = maskfn(t[None, :], f[:, None])
        _, y = signal.istft(Z * M, fs=sr, nperseg=nper, noverlap=nper * 3 // 4)
        outs.append(y[:n])
    return np.vstack(outs) if stereo else outs[0]


def band_mask(T, Fq, fc, bw_oct, tilt=0.0):
    """gaussian-in-log-frequency band centred on fc (array over T allowed)"""
    lf = np.log2(np.maximum(Fq, 20) / fc)
    return np.exp(-0.5 * (lf / bw_oct) ** 2) * (np.maximum(Fq, 20) / 1000.0) ** tilt


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-12
    return x * (peak / m)


def rmsnorm(x, rms=0.1):
    return x * (rms / (np.sqrt(np.mean(x ** 2)) + 1e-12))


# ---------------------------------------------------------------- space
def pan_gains(p):
    p = np.clip(p, -1, 1)
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def make_ir(rt_low, rt_high, dur, predelay, r, sr=SR, er=8, er_span=0.06, bright=9000):
    """synthetic stereo room impulse response: freq-dependent exponential decay
    of decorrelated noise + a handful of early reflections."""
    n = int(dur * sr)
    pd = int(predelay * sr)
    ir = np.zeros((2, n))
    for ch in range(2):
        def m(T, Fq):
            lf = np.clip(np.log2(np.maximum(Fq, 100) / 200.0) / np.log2(8000 / 200.0), 0, 1.3)
            rt = rt_low * (1 - lf) + rt_high * lf
            rt = np.maximum(rt, 0.08)
            return np.exp(-6.91 * T / rt) * (1.0 / (1 + (Fq / bright) ** 2))
        tail = shaped_noise(n - pd, r, m, sr, nper=2048)
        k = int(0.012 * sr)
        tail[:k] *= np.linspace(0, 1, k)
        ir[ch, pd:] = tail * 0.6
        for _ in range(er):
            d = pd + int(r.uniform(0.003, er_span) * sr)
            if d < n:
                ir[ch, d] += r.uniform(0.25, 0.7) * r.choice([-1, 1])
        ir[ch] = lp(ir[ch], bright, 1, sr)
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True)) + 1e-12
    return ir


def convolve_stereo(x, ir):
    out = np.zeros_like(x)
    for ch in range(2):
        y = signal.oaconvolve(x[ch], ir[ch])[: x.shape[1]]
        out[ch] = y
    return out


class Bus:
    """Stereo bus with dry path + two reverb sends (hall = theatre, room = backstage)."""

    def __init__(self, name, n=N):
        self.name = name
        self.n = n
        self.dry = np.zeros((2, n))
        self.hall = np.zeros((2, n))
        self.room = np.zeros((2, n))

    def add(self, sig, start, gain_db=0.0, pan=0.0, hall=0.0, room=0.0, cut=None):
        """sig mono (n,) or stereo (2,n); start sample; pan scalar or per-sample array
        (only for mono); cut = sample index at which the sound is hard-cut (3 ms fade)."""
        sig = np.asarray(sig, float)
        g = db(gain_db)
        if sig.ndim == 1:
            gl, gr = pan_gains(pan)
            st = np.vstack([sig * gl, sig * gr]) * g
        else:
            st = sig * g
        L = st.shape[1]
        a = start
        if cut is not None and a + L > cut:
            keep = max(0, cut - a)
            st = st[:, :keep].copy()
            k = min(keep, int(0.003 * SR))
            if k > 0:
                st[:, keep - k:] *= np.linspace(1, 0, k)
            L = keep
        s0 = max(0, a)
        s1 = min(self.n, a + L)
        if s1 <= s0:
            return
        seg = st[:, s0 - a: s1 - a]
        self.dry[:, s0:s1] += seg
        if hall:
            self.hall[:, s0:s1] += seg * hall
        if room:
            self.room[:, s0:s1] += seg * room
