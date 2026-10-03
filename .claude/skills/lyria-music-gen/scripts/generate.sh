#!/usr/bin/env bash
# Thin wrapper around generate.py — Python handles the websocket session reliably.
# Runs inside a skill-local venv so google-genai / torch / transformers never
# touch the system Python's packages.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/../.venv"
if [ ! -x "$VENV/bin/python" ]; then
  echo "Creating skill venv at $VENV ..." >&2
  python3 -m venv "$VENV"
  "$VENV/bin/python" -m pip install -q --upgrade pip >&2
fi
exec "$VENV/bin/python" "$SCRIPT_DIR/generate.py" "$@"
