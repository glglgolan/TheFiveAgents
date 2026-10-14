#!/usr/bin/env python3
"""Compare SFX takes without listening: length, peak, crest (transient sharpness), spectral centroid
(brightness) and a 0.1s RMS envelope.  Usage: python3 analyze_takes.py <dir>/*.mp3
Pick: impacts/snaps → higher crest; heavy objects → lower centroid; whooshes/whips → envelope that BUILDS
then peaks (not starting at max); beds/room tone → flat envelope, low crest; sustained textures → envelope
shape matching the on-screen action (rising for 'rising', decaying for 'landing')."""
import sys, subprocess, numpy as np
from pathlib import Path
_REL = ".claude/skills/kinetic-typography/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1"
FF = next(str(p / _REL) for p in [Path.cwd(), *Path.cwd().parents, *Path(__file__).resolve().parents] if (p / _REL).exists())
for f in sorted(sys.argv[1:]):
    x = np.frombuffer(subprocess.run([FF, '-v', 'error', '-i', f, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                                     capture_output=True).stdout, np.float32)
    w = 1600; r = [20 * np.log10(np.sqrt((x[i*w:(i+1)*w] ** 2).mean()) + 1e-9) for i in range(len(x) // w)]
    S = np.abs(np.fft.rfft(x)); fr = np.fft.rfftfreq(len(x), 1 / 16000)
    pk = 20 * np.log10(np.abs(x).max() + 1e-9); crest = pk - 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
    print(f"{Path(f).stem:16s} {len(x)/16000:4.2f}s pk{pk:5.1f} crest{crest:5.1f} cent{int((S*fr).sum()/S.sum()):5d} | "
          + " ".join(f"{v:4.0f}" for v in r))
