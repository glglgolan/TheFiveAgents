#!/usr/bin/env python3
"""Extract a product matte (RGBA cutout frames) from a plate so text can pass BEHIND the product.

plate: the assembled reel (mp4/mov/webm) or a still (png/jpg) for tests.
out:   folder of 000001.png … (RGBA: original pixels where the product is, transparent elsewhere) + meta.json

Runs locally (rembg / ONNX, CPU) — no API cost. On this Intel Mac expect ~0.5–1.5 s per frame at --scale 0.5.
Usage:
  extract_matte.py <plate> <out_dir> [--fps 24] [--model isnet-general-use|u2net|birefnet-general|bria-rmbg]
                   [--scale 0.5] [--smooth 0.35] [--start 0] [--end 15]
"""
import argparse
import json
import os
import sys
import time

import numpy as np
from PIL import Image


def frames_from(plate, fps, start, end):
    ext = os.path.splitext(plate)[1].lower()
    if ext in (".png", ".jpg", ".jpeg", ".webp"):
        yield np.array(Image.open(plate).convert("RGB"))
        return
    import imageio_ffmpeg
    reader = imageio_ffmpeg.read_frames(
        plate, input_params=["-ss", str(start)] if start else [],
        output_params=["-vf", f"fps={fps}"] + (["-t", str(end - start)] if end else []))
    meta = next(reader)
    w, h = meta["size"]
    for raw in reader:
        yield np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plate")
    ap.add_argument("out_dir")
    ap.add_argument("--fps", type=float, default=24)
    ap.add_argument("--model", default="isnet-general-use")
    ap.add_argument("--scale", type=float, default=0.5, help="inference scale (alpha is upscaled to full res)")
    ap.add_argument("--smooth", type=float, default=0.35, help="temporal alpha EMA 0..0.9 (reduces flicker)")
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=0)
    a = ap.parse_args()

    from rembg import new_session, remove
    session = new_session(a.model)
    os.makedirs(a.out_dir, exist_ok=True)
    prev = None
    n = 0
    t0 = time.time()
    for rgb in frames_from(a.plate, a.fps, a.start, a.end):
        h, w = rgb.shape[:2]
        small = Image.fromarray(rgb).resize((max(1, int(w * a.scale)), max(1, int(h * a.scale))), Image.LANCZOS)
        mask = remove(small, session=session, only_mask=True, post_process_mask=True)
        alpha = np.asarray(mask.resize((w, h), Image.LANCZOS), dtype=np.float32)
        if prev is not None and a.smooth > 0:
            alpha = alpha * (1 - a.smooth) + prev * a.smooth
        prev = alpha
        rgba = np.dstack([rgb, alpha.clip(0, 255).astype(np.uint8)])
        n += 1
        Image.fromarray(rgba, "RGBA").save(os.path.join(a.out_dir, f"{n:06d}.png"), compress_level=1)
        if n % 24 == 0:
            print(f"  {n} frames · {(time.time() - t0) / n:.2f}s/frame", file=sys.stderr)
    with open(os.path.join(a.out_dir, "meta.json"), "w") as f:
        json.dump({"count": n, "fps": a.fps, "model": a.model, "scale": a.scale, "source": a.plate}, f)
    print(f"[matte] {n} frame(s) → {a.out_dir}  ({time.time() - t0:.1f}s, model {a.model})")


if __name__ == "__main__":
    main()
