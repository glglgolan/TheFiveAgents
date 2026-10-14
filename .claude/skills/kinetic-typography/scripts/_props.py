#!/usr/bin/env python3
"""Build Remotion input props from <run_dir>/text_layers.json: verify plate/matte exist, count matte frames.
Usage: _props.py <run_dir> [--layers text_layers.json] [--plate <rel path>]  → prints the props file path."""
import argparse, json, os, sys
ap = argparse.ArgumentParser(); ap.add_argument("run"); ap.add_argument("--layers", default="text_layers.json")
ap.add_argument("--plate"); a = ap.parse_args()
run = os.path.abspath(a.run)
with open(os.path.join(run, a.layers), encoding="utf-8") as f:
    p = json.load(f)
if a.plate:
    p["plate"] = a.plate
if p.get("plate") and not os.path.exists(os.path.join(run, p["plate"])):
    print(f"  ⚠ plate '{p['plate']}' not found — rendering text over the background colour only", file=sys.stderr)
    p["plate"] = None
md = p.get("matte")
cnt = 0
if md and os.path.isdir(os.path.join(run, md)):
    meta = os.path.join(run, md, "meta.json")
    cnt = json.load(open(meta))["count"] if os.path.exists(meta) else len([x for x in os.listdir(os.path.join(run, md)) if x.endswith(".png")])
if not cnt:
    print("  ⚠ no matte frames — text_back layers will render behind nothing (run extract_matte.sh first)", file=sys.stderr)
p["matteCount"] = cnt
out = os.path.join(run, ".typo_props.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(p, f, ensure_ascii=False)
print(out)
