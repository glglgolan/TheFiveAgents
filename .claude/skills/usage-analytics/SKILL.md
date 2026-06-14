---
name: usage-analytics
description: Fetch OpenAI org usage/costs and OpenRouter credits, then aggregate into a Hebrew Markdown report. Used by Dana agent to answer "כמה הוצאתי?" questions.
---

# usage-analytics

סקיל שלוף נתוני שימוש מ-OpenAI ו-OpenRouter ומפיק דוח עברי מאוחד.

## שלושה סקריפטים

### 1. `get-openai-usage.py` (דורש Admin Key)
```bash
python3 scripts/get-openai-usage.py --start-date 2026-05-01 [--end-date 2026-05-18] [--out file.json]
```
- קורא ל-`/v1/organization/usage/{completions,images,embeddings}` ול-`/v1/organization/costs`
- דורש `OPENAI_ADMIN_KEY` ב-`.env` (sk-admin-...). project key רגיל לא יעבוד.
- מחזיר JSON עם buckets יומיים, פילוח לפי model.

### 2. `get-openrouter-usage.py`
```bash
python3 scripts/get-openrouter-usage.py [--out file.json]
```
- קורא ל-`/api/v1/credits`
- דורש `OPENROUTER_API_KEY`
- מחזיר JSON: `{total_credits, total_usage, balance}`

### 3. `aggregate.py`
```bash
python3 scripts/aggregate.py <openai.json> <openrouter.json> --out report.md
```
- מקבל את שני קבצי ה-JSON, מייצר Markdown בעברית
- כולל: עלות יומית, פילוח לפי model, יתרת OpenRouter, אזהרות

## Flow מומלץ (דנה)

```bash
DATE=$(date +%Y-%m-%d)
MONTH_START=$(date +%Y-%m-01)

python3 .claude/skills/usage-analytics/scripts/get-openai-usage.py \
    --start-date "$MONTH_START" --end-date "$DATE" \
    --out /tmp/oa-usage.json

python3 .claude/skills/usage-analytics/scripts/get-openrouter-usage.py \
    --out /tmp/or-usage.json

python3 .claude/skills/usage-analytics/scripts/aggregate.py \
    /tmp/oa-usage.json /tmp/or-usage.json \
    --out "dana/reports/${DATE}-mtd.md"
```

## טיפול בכשלים

- אם קובץ JSON חסר/שגוי: aggregate.py מציין ⚠️ בסעיף ולא נופל.
- אם המפתח חסר: הסקריפט מדפיס שגיאה ברורה בעברית ו-`exit 1`.
- אם המפתח לא תקין (401): מדפיס את ה-body של השגיאה מהשרת.

## תלויות

stdlib בלבד (`urllib`, `json`, `argparse`, `datetime`). אין pip install.
