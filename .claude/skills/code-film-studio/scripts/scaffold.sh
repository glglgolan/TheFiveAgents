#!/bin/bash
# Scaffold a new code-film-studio project.
# Usage: scaffold.sh <target_dir> <project_title>
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TPL="$HERE/templates"
DST="${1:?target_dir required}"
TITLE="${2:-Untitled}"
SLUG="$(basename "$DST" | tr 'A-Z ' 'a-z-')"

mkdir -p "$DST"/{src/{lib,characters,sets,shots,data},public/audio,audio/{voice,music,sfx},bible,out,qa}

cp "$TPL/package.json" "$DST/package.json"
sed -i.bak "s/__PROJECT_SLUG__/$SLUG/" "$DST/package.json" && rm "$DST/package.json.bak"
cp "$TPL/tsconfig.json" "$DST/tsconfig.json"
cp "$TPL/src/lib/"*.ts "$TPL/src/lib/"*.tsx "$DST/src/lib/"
cp "$TPL/src/index.ts" "$DST/src/index.ts"
cp "$TPL/src/Film.tsx" "$DST/src/Film.tsx"
cp "$TPL/src/Root.tsx" "$DST/src/Root.tsx"
cp "$TPL/src/Subtitles.template.tsx" "$DST/src/Subtitles.tsx"
cp "$TPL/src/data/timeline.template.json" "$DST/src/data/timeline.json"
cp "$TPL/src/data/visemes.template.json" "$DST/src/data/visemes.json"
cp "$TPL/src/data/audio_status.json" "$DST/src/data/audio_status.json"
cp "$TPL/bible/style.template.json" "$DST/bible/style.json"
sed -i.bak "s/__TITLE__/$TITLE/" "$DST/bible/style.json" && rm "$DST/bible/style.json.bak"
cp "$TPL/audio/mix.py" "$DST/audio/mix.py"
cp "$HERE/reference/BRIEF.template.md" "$DST/bible/BRIEF.md"

echo "Scaffolded $DST (slug: $SLUG)."
echo "Next: cd $DST && npm i, then fill bible/style.json + src/data/timeline.json + bible/BRIEF.md before spawning any agent."
