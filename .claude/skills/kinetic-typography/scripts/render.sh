#!/usr/bin/env bash
# Render the typography layer over the plate → <run_dir>/final_typo.mp4 (or a still with --still <frame>).
# Usage: render.sh <run_dir> [--out final_typo.mp4] [--plate <rel>] [--layers text_layers.json] [--still <frame>] [--frames a-b]
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN="$(cd "${1:?run_dir}" && pwd)"; shift
OUT="final_typo.mp4"; PLATE=(); LAYERS=(); STILL=""; FRAMES=()
while [ $# -gt 0 ]; do case "$1" in
  --out) OUT="$2"; shift 2;; --plate) PLATE=(--plate "$2"); shift 2;; --layers) LAYERS=(--layers "$2"); shift 2;;
  --still) STILL="$2"; shift 2;; --frames) FRAMES=(--frames="$2"); shift 2;; *) echo "unknown arg $1" >&2; exit 1;; esac; done
[ -d "$DIR/templates/remotion/node_modules" ] || { echo "run setup first: bash $DIR/scripts/setup.sh" >&2; exit 1; }
PROPS=$(python3 "$DIR/scripts/_props.py" "$RUN" ${PLATE[@]+"${PLATE[@]}"} ${LAYERS[@]+"${LAYERS[@]}"})
echo "$RUN" > "$DIR/.last_run"
cd "$DIR/templates/remotion"
if [ -n "$STILL" ]; then
  npx remotion still src/index.ts Typo "$RUN/${OUT%.mp4}_f${STILL}.png" --frame="$STILL" --props="$PROPS" --public-dir="$RUN" --gl=angle --log=error
  echo "[still] $RUN/${OUT%.mp4}_f${STILL}.png"
else
  npx remotion render src/index.ts Typo "$RUN/$OUT" --props="$PROPS" --public-dir="$RUN" --gl=angle --crf=16 --log=error ${FRAMES[@]+"${FRAMES[@]}"}
  echo "[render] $RUN/$OUT"
fi
