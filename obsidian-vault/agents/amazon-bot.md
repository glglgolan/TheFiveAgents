---
file_path: amazon-bot/
last_updated: 2026-11-26
owner: amazon-bot
---

# amazon-bot — בוט אמאזון משפחתי

## מה זה עושה
בוט טלגרם שרץ על Cloudflare Workers (24/7, גם כשהמחשב כבוי). מקבל בקשות בעברית בקבוצה המשפחתית, מפרש אותן עם Claude, מחפש ב-amazon.com דרך SerpApi, ומציג רק מוצרים עם משלוח חינם לישראל. כפתורים (עוד/מיון/סינון) עובדים מתוצאות שמורות ב-KV. שלב 2 מתוכנן: מעקב מחירים.

## שייך ל
ראובן (שירות פרוס, לא subagent)

## קבצים קשורים
- [[ראובן-מנכל]]
- [[CLAUDE-md]]

## מיקום
`amazon-bot/` — `src/index.ts` (webhook + ניתוב), `src/claude.ts`, `src/serpapi.ts`, `src/format.ts`, `src/quota.ts`, `src/telegram.ts`, `test/logic.test.ts`, `scripts/set-webhook.sh`, `README.md`
