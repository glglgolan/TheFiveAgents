#!/usr/bin/env bash
# Thin wrapper around generate.py — Python handles large API responses reliably.
# Supports: generate.sh "<prompt>" "<output-path>.png" [--size WxH] [--reference <path>]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/generate.py" "$@"
