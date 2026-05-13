#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 \"<prompt>\" \"<output-path>.png\"" >&2
  exit 2
fi

PROMPT="$1"
OUTPUT="$2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env from project root (walk up from script dir)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env"
  set +a
fi

mkdir -p "$(dirname "$OUTPUT")"

build_payload() {
  local model="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg m "$model" --arg p "$PROMPT" \
      '{model:$m, prompt:$p, size:"1024x1024", quality:"medium", output_format:"png"}'
  else
    python3 -c "import json,sys; print(json.dumps({'model':sys.argv[1],'prompt':sys.argv[2],'size':'1024x1024','quality':'medium','output_format':'png'}))" "$model" "$PROMPT"
  fi
}

call_api() {
  local endpoint="$1" key="$2" model="$3"
  local payload
  payload="$(build_payload "$model")"
  curl -sS -X POST "$endpoint" \
    -H "Authorization: Bearer $key" \
    -H "Content-Type: application/json" \
    -d "$payload"
}

decode_response() {
  local resp="$1"
  if command -v jq >/dev/null 2>&1; then
    echo "$resp" | jq -r '.data[0].b64_json' | base64 --decode > "$OUTPUT"
  else
    echo "$resp" | python3 "$SCRIPT_DIR/decode.py" "$OUTPUT"
  fi
}

# Primary: OpenAI
if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "Trying OpenAI (gpt-image-2)..." >&2
  RESP="$(call_api "https://api.openai.com/v1/images/generations" "$OPENAI_API_KEY" "gpt-image-2" 2>&1)" || RESP=""
  if echo "$RESP" | grep -q '"b64_json"'; then
    decode_response "$RESP"
    echo "OK via OpenAI (gpt-image-2)"
    exit 0
  fi
  echo "OpenAI failed, response: $RESP" >&2
fi

# Fallback: OpenRouter
if [ -n "${OPENROUTER_API_KEY:-}" ]; then
  echo "Trying OpenRouter (openai/gpt-5.4-image-2)..." >&2
  RESP="$(call_api "https://openrouter.ai/api/v1/images/generations" "$OPENROUTER_API_KEY" "openai/gpt-5.4-image-2")"
  if echo "$RESP" | grep -q '"b64_json"'; then
    decode_response "$RESP"
    echo "OK via OpenRouter (openai/gpt-5.4-image-2)"
    exit 0
  fi
  echo "OpenRouter failed, response: $RESP" >&2
fi

echo "ERROR: image generation failed on both providers." >&2
exit 1
