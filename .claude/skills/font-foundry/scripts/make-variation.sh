#!/usr/bin/env bash
# Thin wrapper around make_variation.py. Ensures the 3 base fonts exist
# (downloads them from Google Fonts on first run), then forwards all args.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
BASES="$HERE/../bases"
mkdir -p "$BASES"

declare -A URLS=(
  [Heebo.ttf]="https://github.com/google/fonts/raw/main/ofl/heebo/Heebo%5Bwght%5D.ttf"
  [Rubik.ttf]="https://github.com/google/fonts/raw/main/ofl/rubik/Rubik%5Bwght%5D.ttf"
  [Assistant.ttf]="https://github.com/google/fonts/raw/main/ofl/assistant/Assistant%5Bwght%5D.ttf"
)
for f in "${!URLS[@]}"; do
  if [[ ! -s "$BASES/$f" ]]; then
    echo "↓ fetching base $f ..."
    curl -sL -o "$BASES/$f" "${URLS[$f]}"
  fi
done

python3 "$HERE/make_variation.py" "$@"
