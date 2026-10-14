"""Verification: length, loudness, true peak, silence check, waveform/spectrogram PNG with event markers.
    python audio/sfx/verify.py [out.png] [from_frame to_frame]
"""
import json, os, sys
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
x, sr = sf.read(os.path.join(ROOT, 'public', 'audio', 'sfx.wav'), always_2d=True)
x = x.T
tl = json.load(open(os.path.join(ROOT, 'src', 'data', 'timeline.json')))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'qa', 'sfx_overview.png')
f0 = float(sys.argv[2]) if len(sys.argv) > 2 else 0
f1 = float(sys.argv[3]) if len(sys.argv) > 3 else 1440

print('samples', x.shape[1], 'expected', 2880000, 'OK' if x.shape[1] == 2880000 else 'MISMATCH', 'sr', sr)
m = pyln.Meter(sr)
print('integrated LUFS %.2f' % m.integrated_loudness(x.T))
up = signal.resample_poly(x, 4, 1, axis=-1)
print('true peak %.2f dBTP' % (20 * np.log10(np.abs(up).max())))


def seg_db(a, b):
    s = x[:, int(a * sr / 24):int(b * sr / 24)]
    return 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12), 20 * np.log10(np.abs(s).max() + 1e-12)


for a, b, lab in [(1052, 1058, 'post-gasp pre-pop'), (1100, 1150, 'float (wind only)'), (1153, 1164, 'after clap 1'),
                  (1045, 1059, 'gasp tail'), (1436, 1440, 'end fade')]:
    r_, p_ = seg_db(a, b)
    print(f'{lab:22s} frames {a}-{b}: rms {r_:6.1f} dBFS  peak {p_:6.1f} dBFS')

# short-term loudness (400 ms windows, 100 ms hop) as RMS dB
mono = x.mean(0)
a, b = int(f0 * sr / 24), int(f1 * sr / 24)
seg = mono[a:b]
fig, ax = plt.subplots(3, 1, figsize=(22, 11), sharex=True, gridspec_kw=dict(height_ratios=[1.2, 2, 1]))
tf = f0 + np.arange(len(seg)) * 24 / sr
dec = max(1, len(seg) // 60000)
ax[0].plot(tf[::dec], x[0, a:b][::dec], lw=0.3, color='#c33')
ax[0].plot(tf[::dec], -x[1, a:b][::dec], lw=0.3, color='#36c')
ax[0].set_ylim(-1, 1); ax[0].set_ylabel('L (up) / R (down)')
ff, t, S = signal.spectrogram(seg, fs=sr, nperseg=2048, noverlap=1536)
ax[1].pcolormesh(f0 + t * 24, ff, 10 * np.log10(S + 1e-14), shading='auto', cmap='magma', vmin=-130, vmax=-40)
ax[1].set_yscale('symlog', linthresh=500); ax[1].set_ylim(40, 20000); ax[1].set_ylabel('Hz')
w = int(0.1 * sr)
rms = np.sqrt(np.convolve(seg ** 2, np.ones(w) / w, mode='same')[::w // 4] + 1e-14)
ax[2].plot(f0 + np.arange(len(rms)) * (w // 4) * 24 / sr, 20 * np.log10(rms), lw=0.8)
ax[2].set_ylim(-90, 0); ax[2].set_ylabel('RMS dBFS (100 ms)'); ax[2].grid(alpha=0.3)
for e in tl['events']:
    if f0 <= e['f'] <= f1:
        for k in range(3):
            ax[k].axvline(e['f'], color='lime' if k == 1 else 'g', lw=0.6, alpha=0.7)
        ax[0].text(e['f'], 0.95, e['id'], rotation=90, fontsize=7, va='top')
for s in tl['shots']:
    for k in range(3):
        ax[k].axvline(s['from'], color='k', lw=1.5)
ax[2].set_xlabel('frame (24 fps)')
ax[2].set_xlim(f0, f1)
plt.tight_layout()
os.makedirs(os.path.dirname(out), exist_ok=True)
plt.savefig(out, dpi=70)
print('wrote', out)
