#!/usr/bin/env python3
"""Verify public/audio/music.wav: length, loudness, true peak, silences, event hits; render QA PNGs."""
import os
import sys
import json
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from synth import SR, SPF, true_peak_db  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
WAV = os.path.join(ROOT, 'public', 'audio', 'music.wav')
QA = os.path.join(HERE, 'qa')
os.makedirs(QA, exist_ok=True)

x, sr = sf.read(WAV, always_2d=True)
x = x.T
assert sr == 48000, sr
print('samples', x.shape[1], 'seconds', x.shape[1] / sr, 'OK' if x.shape[1] == 2880000 else 'LENGTH MISMATCH')
m = pyln.Meter(sr)
print('integrated LUFS', round(m.integrated_loudness(x.T), 2), ' true peak dBTP', round(true_peak_db(x), 2))

tl = json.load(open(os.path.join(ROOT, 'src', 'data', 'timeline.json')))
KEY = [56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 116, 178, 192, 214, 238, 262, 280, 300, 440, 456, 584,
       612, 656, 696, 804, 840, 876, 936, 992, 1040, 1060, 1150, 1176, 1224, 1240, 1328, 1384, 1428, 1436]


def rms_db(a, b):
    seg = x[:, a:b]
    return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)


print('\nsilence checks (peak abs):')
for a, b in ((1040, 1060), (1150, 1176), (1436, 1440)):
    pk = np.max(np.abs(x[:, a * SPF:b * SPF]))
    print(f'  frames {a}-{b}: peak {pk:.2e}', 'SILENT' if pk == 0 else 'NOT SILENT')

print('\nevent onsets: RMS 40 ms before vs 40 ms after, and peak-frame offset')
env = np.sqrt(np.mean(x ** 2, axis=0))
for f in KEY:
    s = f * SPF
    pre = rms_db(max(0, s - 1920), s)
    post = rms_db(s, min(x.shape[1], s + 1920))
    # where does the energy rise fastest within +-3 frames?
    w = 240
    e = np.array([np.sqrt(np.mean(env[k:k + w] ** 2)) for k in range(max(0, s - 3 * SPF), min(len(env) - w, s + 3 * SPF), w)])
    rise = np.argmax(np.diff(20 * np.log10(e + 1e-9))) if len(e) > 1 else 0
    off_ms = (max(0, s - 3 * SPF) + (rise + 1) * w - s) / sr * 1000
    print(f'  f{f:5d} {f/24:6.3f}s  pre {pre:7.1f} dB  post {post:7.1f} dB  jump {post-pre:+6.1f}  max-rise at {off_ms:+6.1f} ms')

# ---------------------------------------------------------------- full overview
fig, axes = plt.subplots(2, 1, figsize=(26, 10), sharex=True, gridspec_kw=dict(height_ratios=[1, 2]))
t = np.arange(x.shape[1]) / sr
hop = 480
e = env[: len(env) // hop * hop].reshape(-1, hop)
axes[0].fill_between(np.arange(e.shape[0]) * hop / sr, 20 * np.log10(e.max(axis=1) + 1e-9), -90, color='k', lw=0)
axes[0].set_ylim(-80, 0)
axes[0].set_ylabel('peak dBFS')
mono = x.mean(axis=0)
axes[1].specgram(mono, NFFT=2048, Fs=sr, noverlap=1536, cmap='magma', vmin=-130, vmax=-20)
axes[1].set_ylim(0, 12000)
axes[1].set_ylabel('Hz')
for ev in tl['events']:
    for ax in axes:
        ax.axvline(ev['f'] / 24, color='c', lw=0.6, alpha=0.8)
    axes[0].text(ev['f'] / 24, -2, ev['id'], rotation=90, fontsize=6, va='top', color='b')
for sh in tl['shots']:
    axes[0].axvline(sh['from'] / 24, color='r', lw=1.5)
    axes[0].text(sh['from'] / 24 + 0.1, -75, sh['id'], color='r', fontsize=11)
axes[1].set_xlabel('seconds')
axes[1].set_xlim(0, 60)
plt.tight_layout()
plt.savefig(os.path.join(QA, 'overview.png'), dpi=70)
plt.close()

# ---------------------------------------------------------------- zooms
zooms = [(40, 200, 'S1 letters/shimmer/whip'), (200, 320, 'S2 hammers/ratchet'), (430, 480, 'S2 sting -> kick-in'),
         (600, 700, 'teeter/relief/giraffe'), (820, 950, 'snap/tape-stop/limp'), (980, 1190, 'slide/cut/float/drop'),
         (1225, 1340, 'ta-da/wink'), (1370, 1440, 'title/button/end')]
fig, axes = plt.subplots(len(zooms), 1, figsize=(20, 3.0 * len(zooms)))
evf = sorted(set([ev['f'] for ev in tl['events']] + KEY))
for ax, (a, b, name) in zip(axes, zooms):
    sa, sb = a * SPF, b * SPF
    tt_ = np.arange(sa, sb) / SPF
    ax.plot(tt_, x[0, sa:sb], lw=0.3, color='k')
    ax.plot(tt_, x[1, sa:sb] - 0.0, lw=0.3, color='gray', alpha=0.5)
    for f in evf:
        if a <= f <= b:
            ax.axvline(f, color='r' if f in KEY else 'c', lw=0.8)
            ax.text(f, 0.95, str(f), fontsize=7, color='r', transform=ax.get_xaxis_transform())
    ax.set_xlim(a, b)
    ax.set_ylim(-1, 1)
    ax.set_title(name + '  (x = frames)', fontsize=10)
plt.tight_layout()
plt.savefig(os.path.join(QA, 'zooms.png'), dpi=60)
plt.close()
print('\nwrote', os.path.join(QA, 'overview.png'), os.path.join(QA, 'zooms.png'))
