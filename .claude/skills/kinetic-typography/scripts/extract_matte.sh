#!/usr/bin/env bash
# Usage: extract_matte.sh <plate.mp4|png> <out_dir> [extract_matte.py options]
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -x "$DIR/.venv/bin/python" ] || { echo "run setup first: bash $DIR/scripts/setup.sh" >&2; exit 1; }
exec "$DIR/.venv/bin/python" "$DIR/scripts/extract_matte.py" "$@"
