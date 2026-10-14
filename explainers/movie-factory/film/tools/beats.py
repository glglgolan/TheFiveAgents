#!/usr/bin/env python3
"""Phrase start times from the approved VO — no models: char-proportional estimate snapped to real pauses."""
import numpy as np, soundfile as sf, json, re
from pathlib import Path
HERE = Path(__file__).resolve().parents[1]
tl = json.loads((HERE / 'src/data/timeline.json').read_text())
TEXT = json.loads((HERE / 'src/data/script.json').read_text())
out = {}
for i, l in enumerate(tl['lines']):
    x, sr = sf.read(HERE / f"../vo/{tl['vo']}/s{i}.wav"); x = x if x.ndim == 1 else x.mean(1)
    idx = np.where(np.abs(x) > 0.01)[0]; x = x[max(0, idx[0] - 800): idx[-1] + 3000]   # same trim as build_sound.py
    dur = len(x) / sr
    env = np.convolve(np.abs(x), np.ones(441) / 441, 'same') > 0.008
    glen = {}
    gaps, run = [], 0                      # end time of every silent gap >= 70ms
    for k, v in enumerate(env):
        if not v: run += 1
        else:
            if run >= int(0.07 * sr) and k - run > int(0.2 * sr): gaps.append(k / sr); glen[k / sr] = run / sr
            run = 0
    phrases = [p.strip() for p in re.split(r'(?<=[,.!?:…])\s+', TEXT[l['id']]) if p.strip()]
    lens = np.array([len(p) + (22 if p.endswith('...') else 0) for p in phrases], float)   # a spoken '...' is a long held pause
    cum =np.concatenate([[0], np.cumsum(lens)[:-1]]) / lens.sum()
    starts, used = [0.0], set()
    for j, c in enumerate(cum[1:], 1):
        if phrases[j - 1].endswith('...'):           # after a held "...": the first long pause ends it
            s = next(g for g in gaps if glen[g] >= 0.25); used.add(s); starts.append(s); continue
        est = 0.1 + c * (dur - 0.3)
        near = [g for g in gaps if abs(g - est) < 0.7 and g not in used and g > starts[-1] + 0.3]
        s = min(near, key=lambda g: abs(g - est)) if near else max(est, starts[-1] + 0.3)
        used.add(s); starts.append(s)
    out[l['id']] = [{'text': p, 't': round(l['start'] + s, 3)} for p, s in zip(phrases, starts)]
    print(l['id'], [(p[:12], round(s, 2)) for p, s in zip(phrases, starts)])
(HERE / 'src/data/beats.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
