#!/usr/bin/env bash
# Fetch a Google Font (OFL) weight and convert it to three.js typeface JSON for engine:"three" layers.
# Usage: make_3d_font.sh "<Family Name>" <weight> <key>      e.g.  make_3d_font.sh "Heebo" 800 heebo_black
# The font is then usable as  "font": { "three_font": "<key>" }  (auto-registered from fonts/*.typeface.json).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAM="${1:?family}"; W="${2:-700}"; KEY="${3:?key}"
URL=$(curl -s "https://fonts.googleapis.com/css2?family=${FAM// /+}:wght@${W}" | grep -o 'https://[^)]*\.ttf' | head -1)
[ -n "$URL" ] || { echo "font/weight not found on Google Fonts: $FAM $W" >&2; exit 1; }
TMP="$(mktemp -t font).ttf"; curl -s -o "$TMP" "$URL"
node "$DIR/scripts/ttf_to_typeface.mjs" "$TMP" "$DIR/fonts/${KEY}.typeface.json"
