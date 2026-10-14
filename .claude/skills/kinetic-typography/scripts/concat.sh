#!/usr/bin/env bash
# Hard-cut assembly of stage clips (frames already match via chained keyframes) → one 1080x1920 24fps H.264.
# Uses the venv's bundled ffmpeg (no Homebrew needed). Usage: concat.sh <out.mp4> <clip1> <clip2> [...]
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FF=$("$DIR/.venv/bin/python" -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
OUT="${1:?out}"; shift; N=$#
IN=(); F=""
for i in $(seq 0 $((N-1))); do IN+=(-i "${@:$((i+1)):1}"); F+="[$i:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=24,setsar=1,format=yuv420p[v$i];"; done
for i in $(seq 0 $((N-1))); do F+="[v$i]"; done
F+="concat=n=$N:v=1:a=0[v]"
"$FF" -y -loglevel error "${IN[@]}" -filter_complex "$F" -map "[v]" -c:v libx264 -crf 16 -preset slow -movflags +faststart "$OUT"
echo "[concat] $OUT ($N clips)"
