#!/bin/bash
# Bundle + render the film with the fast CPU-only engine (no GPU touched).
# Usage: render.sh <project_dir> [--audio]
set -euo pipefail
DIR="${1:?project_dir required}"
cd "$DIR"
[ -d build/bundle ] && [ "$(find src -newer build/bundle -type f | head -1)" = "" ] || npx remotion bundle src/index.ts --out-dir=build/bundle
# swiftshader measured ~7x faster than swangle on this pipeline for identical pixel output — always prefer it.
npx remotion render build/bundle Film out/film.mp4 --gl=swiftshader --concurrency=6 --crf=16
echo "-> out/film.mp4"
