#!/usr/bin/env python3
"""Second-by-second picture map for sound design.
Usage (from the run dir): python3 <skill>/scripts/motion_map.py [video=final_typo.mp4]
Writes _qa/snd/motion.npy (median optical-flow px/frame @270x480, one per frame) and
_qa/snd/sheet.jpg (contact sheet every 0.25s with timestamps); prints motion per 0.25s.
Use the sheet + motion peaks to write audio/v4/CUES.md (every on-screen action → a sound)."""
import sys, os, cv2, numpy as np
src = sys.argv[1] if len(sys.argv) > 1 else 'final_typo.mp4'
os.makedirs('_qa/snd', exist_ok=True)
cap = cv2.VideoCapture(src); fps = cap.get(5)
mot, frames, prev, i = [], [], None, 0
step = max(1, round(fps / 4))
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, (270, 480)), cv2.COLOR_BGR2GRAY)
    mot.append(0.0 if prev is None else float(np.median(np.linalg.norm(
        cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0), axis=2))))
    if i % step == 0: frames.append((i, cv2.resize(f, (180, 320))))
    prev = g; i += 1
np.save('_qa/snd/motion.npy', np.array(mot))
for k in range(0, len(mot), step): print(f"{k/fps:5.2f}s motion={np.mean(mot[k:k+step]):5.2f}")
rows = []
for r in range(0, len(frames), 10):
    row = []
    for idx, im in frames[r:r + 10]:
        im = im.copy(); cv2.putText(im, f"{idx/fps:.2f}", (5, 20), 0, 0.6, (0, 255, 255), 2); row.append(im)
    while len(row) < 10: row.append(np.zeros_like(frames[0][1]))
    rows.append(np.hstack(row))
cv2.imwrite('_qa/snd/sheet.jpg', np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 80])
print('[motion_map] _qa/snd/motion.npy + _qa/snd/sheet.jpg')
