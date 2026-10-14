#!/usr/bin/env bash
# Add a music/SFX/VO track to a rendered reel (fade-out at the end). Usage: mux_audio.sh <video.mp4> <audio> <out.mp4>
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FF=$("$DIR/.venv/bin/python" -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
D=$("$DIR/.venv/bin/python" -c "import imageio_ffmpeg as i,sys;print(i.count_frames_and_secs(sys.argv[1])[1])" "$1")
"$FF" -y -loglevel error -i "$1" -i "$2" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
  -af "afade=t=out:st=$(python3 -c "print(max(0,$D-1.2))"):d=1.2" -shortest "$3"
echo "[mux] $3"
