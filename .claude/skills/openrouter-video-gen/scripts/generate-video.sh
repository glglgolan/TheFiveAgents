#!/usr/bin/env bash
# Thin wrapper around generate-video.py.
# Usage: generate-video.sh "<prompt>" "<output.mp4>" --model <id> [--duration N] [--aspect-ratio AR] [--reference path] [--end-frame path]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/generate-video.py" "$@"
