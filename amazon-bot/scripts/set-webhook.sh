#!/usr/bin/env bash
# מחבר את הבוט בטלגרם ל-Worker.
# שימוש: TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... bash scripts/set-webhook.sh https://amazon-israel-bot.<you>.workers.dev
set -euo pipefail
WORKER_URL="${1:?usage: set-webhook.sh <worker-url>}"
: "${TELEGRAM_BOT_TOKEN:?set TELEGRAM_BOT_TOKEN}"
: "${TELEGRAM_WEBHOOK_SECRET:?set TELEGRAM_WEBHOOK_SECRET (same value as the Worker secret)}"
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  --form-string "url=${WORKER_URL%/}/webhook" \
  --form-string "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  --form-string 'allowed_updates=["message","callback_query"]' \
  --form-string "drop_pending_updates=true"
echo
