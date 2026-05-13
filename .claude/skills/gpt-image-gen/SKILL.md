---
name: gpt-image-gen
description: Generate images via OpenAI gpt-image-2 model (with OpenRouter fallback). Use when an agent needs to create an image from a text prompt. Input - prompt string + output path. Output - PNG file at requested path.
---

# gpt-image-gen

מעטפת ליצירת תמונות באמצעות OpenAI Images API עם נפילה אוטומטית ל-OpenRouter.

## מודלים

- **OpenAI ישיר:** `gpt-image-2` (יצא 21 באפריל 2026)
- **OpenRouter:** `openai/gpt-5.4-image-2` (אותו מודל, שם שונה אצל OpenRouter)

> אסור להחליף ב-`dall-e-3`, `gpt-image-1` או חלופות אחרות גם אם המודלים נראים לא מוכרים. אם API מחזיר שגיאה - הבעיה היא ב-key או ב-parameters, לא בשם המודל.

## שימוש

```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output-path>.png"
```

## פרמטרים קבועים

- `size`: `1024x1024`
- `quality`: `medium`
- `output_format`: `png`

## Flow הסקריפט

1. טוען `.env` (לוקח את `OPENAI_API_KEY` ו-`OPENROUTER_API_KEY`)
2. **Primary:** אם יש `OPENAI_API_KEY` - מנסה את `https://api.openai.com/v1/images/generations` עם המודל `gpt-image-2`
3. **Fallback:** אם נכשל או אין מפתח - מנסה את `https://openrouter.ai/api/v1/images/generations` עם `openai/gpt-5.4-image-2`
4. מפענח את `data[0].b64_json` ל-PNG (jq אם קיים, אחרת `decode.py`)
5. מדפיס למסך איזה נתיב עבד

## Output

- מחזיר exit code 0 אם הצליח, 1 אם שני ה-APIs נכשלו
- הודעה: `OK via OpenAI (gpt-image-2)` או `OK via OpenRouter (openai/gpt-5.4-image-2)`
