#!/usr/bin/env bash
# Thin wrapper around generate.py — Python handles the websocket session reliably.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/generate.py" "$@"
