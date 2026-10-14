#!/usr/bin/env python3
import os, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000; N = 720000
names = ['stem_tension', 'stem_impact', 'stem_drive', 'stem_slowmo', 'stem_whip', 'stem_resolve']
ok = True
def fail(m):
    global ok; ok = False; print('FAIL', m)
def db(x): return 20*np.log10(x+1e-12)
def rms(x): return np.sqrt(np.mean(x**2)) if len(x) else 0.0
S = {}
for n in names + ['score_preview']:
    x, sr = sf.read(os.path.join(HERE, n + '.wav'), always_2d=True)
    x = x.T
    S[n] = x
    st = []
    if sr != SR: st.append('sr')
    if x.shape != (2, N): st.append(f'shape {x.shape}')
    if not np.all(np.isfinite(x)): st.append('nan')
    if np.max(np.abs(x)) >= 1.0: st.append('peak>=1')
    if st: fail(n + ' ' + ','.join(st))
    print(f'{n:14s} len={x.shape[1]} peak={db(np.max(np.abs(x))):6.1f} dBFS  rms={db(rms(x)):6.1f}')
def seg(x, a, b): return x[:, int(a*SR):int(b*SR)]
for n in names:
    for a, b in ((2.230, 2.285), (8.40, 8.70)):
        r = db(rms(seg(S[n], a, b)))
        if r >= -50: fail(f'{n} {a}-{b} rms {r:.1f} dB >= -50')
print('silence windows (2.230-2.285, 8.40-8.70) checked on all stems')
def onset(x, t, thr=0.004, w=0.15, lo=0.0):
    a = int(max(t-w, lo)*SR); b = int((t+w)*SR)
    m = np.max(np.abs(x[:, a:b]), axis=0)
    i = np.nonzero(m > thr)[0]
    return (a + i[0]) / SR if len(i) else None
for n, t in (('stem_impact', 2.290), ('stem_drive', 4.000), ('stem_impact', 5.75), ('stem_impact', 9.20), ('stem_impact', 13.40), ('score_preview', 2.290)):
    o = onset(S[n], t, lo=(2.231 if n == 'score_preview' else 0.0))
    good = o is not None and abs(o - t) <= 0.005
    print(f'onset {n} @ {t}: {o}  {"ok" if good else "FAIL"}')
    if not good: fail(f'onset {n} {t}')
# drive hard stop, whip landing, riser peak
d = S['stem_drive']
print('drive rms 7.90-8.00: %.1f dB | 8.00-8.10: %.1f | 8.10-8.40: %.1f | 8.40+: %.1f' % tuple(db(rms(seg(d, a, b))) for a, b in ((7.9, 8.0), (8.0, 8.1), (8.1, 8.4), (8.4, 8.7))))
if db(rms(seg(d, 8.4, 8.7))) >= -50: fail('drive tail')
w = S['stem_whip']
print('whip: first energy %.3f, last energy %.3f' % (np.nonzero(np.max(np.abs(w), 0) > 0.003)[0][0]/SR, np.nonzero(np.max(np.abs(w), 0) > 0.003)[0][-1]/SR))
sl = S['stem_slowmo']
print('slowmo: energy %.3f .. %.3f' % (np.nonzero(np.max(np.abs(sl), 0) > 0.003)[0][0]/SR, np.nonzero(np.max(np.abs(sl), 0) > 0.003)[0][-1]/SR))
tn = S['stem_tension']
print('tension last energy %.3f' % (np.nonzero(np.max(np.abs(tn), 0) > 0.003)[0][-1]/SR))
rs = S['stem_resolve']
print('resolve last 0.4s rms %.1f dB vs 14.0-14.6 %.1f dB; final sample %.2e' % (db(rms(seg(rs, 14.6, 15))), db(rms(seg(rs, 14.0, 14.6))), np.max(np.abs(rs[:, -1]))))
p = S['score_preview']
print('\nRMS per 0.25 s window (preview, dBFS):')
for k in range(60):
    print('%5.2f-%5.2f  %6.1f' % (k*.25, k*.25+.25, db(rms(p[:, int(k*.25*SR):int((k+1)*.25*SR)]))), end='   ' if k % 4 != 3 else '\n')
try:
    import matplotlib; matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from scipy.signal import spectrogram
    f, t, Sx = spectrogram(p.mean(0), SR, nperseg=4096, noverlap=3072)
    plt.figure(figsize=(14, 5))
    plt.pcolormesh(t, f, 10*np.log10(Sx+1e-12), vmin=-120, vmax=-30, shading='auto'); plt.yscale('symlog', linthresh=100); plt.ylim(20, 16000)
    for x_ in (2.29, 4, 5.75, 8, 9.2, 13.4): plt.axvline(x_, color='w', lw=.5)
    plt.colorbar(label='dB'); plt.xlabel('s'); plt.ylabel('Hz'); plt.tight_layout()
    plt.savefig(os.path.join(HERE, 'preview_spec.png'), dpi=100)
except Exception as e:
    print('spectrogram skipped', e)
print('\nRESULT:', 'PASS' if ok else 'FAIL')
