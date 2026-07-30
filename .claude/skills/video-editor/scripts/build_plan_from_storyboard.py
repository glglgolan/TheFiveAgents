#!/usr/bin/env python3
"""Generate a starter edit_plan.json from a storyboard.json + its rendered clips.

Lists the scenes in order, points each clip at <videos-dir>/sNN.mp4 (only those that exist),
and seeds a uniform transition + optional audio block. Edit the result before running assemble.py.

Usage:
  python3 build_plan_from_storyboard.py <storyboard.json> \
    --videos-dir <dir> --out <edit_plan.json> \
    [--transition fade] [--transition-dur 0.6] \
    [--resolution 1280x720] [--fps 24] \
    [--voiceover <path>] [--music <path>] [--fit-to-audio]
"""
import argparse
import json
import os
import sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    ap.add_argument("--videos-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--transition", default="fade")
    ap.add_argument("--transition-dur", type=float, default=0.6)
    ap.add_argument("--resolution", default="1280x720")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--voiceover", default=None)
    ap.add_argument("--music", default=None)
    ap.add_argument("--fit-to-audio", action="store_true")
    args = ap.parse_args()

    with open(args.storyboard, encoding="utf-8") as f:
        sb = json.load(f)

    clips = []
    missing = []
    for s in sb.get("scenes", []):
        nn = f"{s['scene_number']:02d}"
        path = os.path.join(args.videos_dir, f"s{nn}.mp4")
        if not os.path.exists(path):
            missing.append(f"s{nn}")
            continue
        clips.append({
            "src": path,
            "speed": 1.0,
            "trim_start": 0.0,
            "trim_end": None,
            "transition": {"type": args.transition, "duration": args.transition_dur},
        })

    if not clips:
        print(f"ERROR: no clips found in {args.videos_dir}", file=sys.stderr)
        return 2
    clips[-1]["transition"] = {"type": args.transition, "duration": 0.0}  # last: ignored

    run_dir = os.path.dirname(os.path.abspath(args.storyboard))
    plan = {
        "output": os.path.join(run_dir, "final.mp4"),
        "resolution": args.resolution,
        "fps": args.fps,
        "fit_to_audio": bool(args.fit_to_audio),
        "video_fade_in": 1.0,
        "video_fade_out": 1.5,
        "clips": clips,
    }
    if args.voiceover or args.music:
        plan["audio"] = {
            "voiceover": args.voiceover,
            "music": args.music,
            "vo_gain_db": 0,
            "music_gain_db": -16,
            "duck": True,
            "loudnorm": True,
            "audio_fade_out": 2.0,
        }
    plan["export"] = {"codec": "libx264", "crf": 18, "preset": "slow"}

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)

    print(f"[written] {args.out}")
    print(f"  clips: {len(clips)}" + (f"  | missing: {', '.join(missing)}" if missing else ""))
    if not (args.voiceover or args.music):
        print("  note: no audio block (silent). Re-run with --voiceover/--music or add it manually.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
