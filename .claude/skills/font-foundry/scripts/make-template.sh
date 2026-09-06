#!/usr/bin/env bash
# Generate the blank image-to-font template (PNG + spec.json).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
python3 "$HERE/make_template.py" "$@"
