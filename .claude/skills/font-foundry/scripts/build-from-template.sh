#!/usr/bin/env bash
# Trace a FILLED template sheet into an installable TTF (Regular + Bold).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
python3 "$HERE/build_from_template.py" "$@"
