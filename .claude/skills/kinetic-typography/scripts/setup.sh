#!/usr/bin/env bash
# One-time setup: Remotion deps (node) + local matte venv (rembg + bundled ffmpeg). Intel-Mac safe (binary wheels only).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
(cd "$DIR/templates/remotion" && npm install --no-audit --no-fund)
if [ ! -x "$DIR/.venv/bin/python" ]; then
  python3 -m venv "$DIR/.venv"
  "$DIR/.venv/bin/pip" install -q --upgrade pip
  "$DIR/.venv/bin/pip" install -q --only-binary=:all: "rembg[cpu]" imageio-ffmpeg pillow
fi
echo "[setup] ok — node_modules + .venv ready"
