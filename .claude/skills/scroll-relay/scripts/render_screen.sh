#!/usr/bin/env bash
# Render the scrolling website (ScrollStory composition) → <run>/screen.mp4 (or a still).
# Usage: render_screen.sh <run_dir> [--story scroll_story.json] [--still <frame>] [--out screen.mp4]
set -euo pipefail
SK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; KT="$SK/../kinetic-typography"
RUN="$(cd "${1:?run_dir}" && pwd)"; shift
STORY=scroll_story.json; STILL=""; OUT=screen.mp4
while [ $# -gt 0 ]; do case "$1" in --story) STORY="$2"; shift 2;; --still) STILL="$2"; shift 2;; --out) OUT="$2"; shift 2;; *) echo "unknown $1" >&2; exit 1;; esac; done
PROPS=$(python3 "$SK/scripts/_story_props.py" "$RUN" "$STORY")
cd "$KT/templates/remotion"
if [ -n "$STILL" ]; then
  npx remotion still src/index.ts ScrollStory "$RUN/_qa/screen_f$STILL.png" --frame="$STILL" --props="$PROPS" --public-dir="$RUN" --log=error
  echo "[still] $RUN/_qa/screen_f$STILL.png"
else
  npx remotion render src/index.ts ScrollStory "$RUN/$OUT" --props="$PROPS" --public-dir="$RUN" --crf=14 --log=error
  echo "[render] $RUN/$OUT"
fi
