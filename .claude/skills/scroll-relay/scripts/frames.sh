#!/usr/bin/env bash
# Video → numbered frames for ScrollStory media (opaque). For cut-outs with alpha use
#   bash .claude/skills/kinetic-typography/scripts/extract_matte.sh <clip.mp4> <out_dir>
# Usage: frames.sh <clip.mp4> <out_dir> [fps=24] [ext=jpg]
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
FF="$ROOT/skills/kinetic-typography/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1"
mkdir -p "$2"
"$FF" -y -v error -i "$1" -vf "fps=${3:-24}" -q:v 2 "$2/%06d.${4:-jpg}"
n=$(ls "$2" | grep -c "\.${4:-jpg}$"); echo "{\"count\": $n}" > "$2/meta.json"; echo "[frames] $2 ($n)"
