#!/usr/bin/env bash
# Thin wrapper around swap.py — local face swap for facial accuracy.
# Usage: swap.sh <source_face> <target_image> [output] [--source-index N] [--target-index N | --all]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/swap.py" "$@"
