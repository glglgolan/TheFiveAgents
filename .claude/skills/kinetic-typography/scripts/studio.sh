#!/usr/bin/env bash
# Remotion Studio (live scrub/tweak) on a run dir. Prefer launching via .claude/launch.json ("typo-studio") so it
# opens in the browser pane. Usage: studio.sh [run_dir]  (defaults to the last rendered run)
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN="${1:-$(cat "$DIR/.last_run" 2>/dev/null || echo "$DIR/demo")}"; RUN="$(cd "$RUN" && pwd)"
PROPS=$(python3 "$DIR/scripts/_props.py" "$RUN")
echo "$RUN" > "$DIR/.last_run"
cd "$DIR/templates/remotion"
exec npx remotion studio src/index.ts --props="$PROPS" --public-dir="$RUN" --port="${PORT:-3123}" --no-open
