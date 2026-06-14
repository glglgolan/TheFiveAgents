---
name: gpt-image-gen
description: Generate or edit images via OpenAI gpt-image models (with OpenRouter fallback). Text-to-image via /generations (default gpt-image-2). Image-to-image with reference for character consistency via /edits (default gpt-image-1.5). Supports custom aspect ratios.
---

# gpt-image-gen

מעטפת ליצירה ועריכת תמונות ב-OpenAI Images API עם נפילה אוטומטית ל-OpenRouter.

## מודלים

- **`gpt-image-2`** (יצא 21.4.2026) — ברירת מחדל ל-text-to-image. החדיש והאיכותי ביותר.
- **`gpt-image-1.5`** — ברירת מחדל לעריכה עם רפרנס. מצטיין ב-character consistency ושימור פנים.
- `gpt-image-1`, `gpt-image-1-mini` — לגיבוי, ניתן לבחור עם `--model`.

> אסור להחליף ב-`dall-e-3` או חלופות לא רלוונטיות. אם API מחזיר שגיאה — הבעיה ב-key, parameters, או endpoint.

## שני מצבי פעולה

| מצב | Endpoint | Trigger | מודל default |
|---|---|---|---|
| text-to-image | `/v1/images/generations` (JSON) | אין `--reference` | `gpt-image-2` |
| image-to-image | `/v1/images/edits` (multipart) | יש `--reference` | `gpt-image-1.5` |

## שימוש

```bash
# 1. בסיסי — text-to-image 1:1
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png"

# 2. text-to-image עם aspect ratio מותאם
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png" --size 1280x720

# 3. עם רפרנס לעקביות דמויות (image-to-image)
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png" \
  --reference "yuval/reference/PHOTO-2026-02-27-07-08-36.jpg"

# 4. רפרנס + size — auto-mapped ל-1024x1024/1536x1024/1024x1536
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png" \
  --reference "<path>.jpg" --size 1920x1080

# 5. דריסת מודל ידנית
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png" \
  --reference "<path>.jpg" --model gpt-image-2
```

## פרמטרים

- `prompt` (positional, חובה) — תיאור התמונה / העריכה
- `output` (positional, חובה) — נתיב לקובץ PNG
- `--size WxH` — ברירת מחדל `1024x1024`
  - **בלי רפרנס:** כל גודל חופשי (1280x720, 1920x1080, וכו׳)
  - **עם רפרנס:** ממופה אוטומטית לאחד מהשלושה הנתמכים:
    - יחס ~1:1 → `1024x1024`
    - landscape (כולל 16:9) → `1536x1024`
    - portrait → `1024x1536`
- `--reference <path>` — נתיב לתמונת רפרנס. מפעיל את מצב `/edits` ומחליף מודל ל-`gpt-image-1.5`.
- `--model <name>` — דריסה ידנית. שימושי למשל בשביל גוון אומנותי מסוים או נפילה למודל זול.

## פרמטרים קבועים

- `quality`: `medium`
- `output_format`: `png`
- `input_fidelity`: `high` (במצב edits — לעקביות מרבית עם הרפרנס)

## Flow

1. טוען `.env` (`OPENAI_API_KEY`, `OPENROUTER_API_KEY`).
2. אם יש `--reference`:
   - בודק שהקובץ קיים.
   - ממפה size לאחד הנתמכים ב-`/edits`.
   - בונה payload `multipart/form-data` עם `image[]`, `prompt`, `size`, וכו׳.
   - שולח ל-`/v1/images/edits`.
3. אחרת: שולח JSON ל-`/v1/images/generations`.
4. **Primary:** OpenAI. **Fallback:** OpenRouter (`openai/<model>`).
5. מפענח `data[0].b64_json` ל-PNG.
6. Exit 0 בהצלחה, 1 בכישלון. מדפיס provider שעבד.

## דוגמת שימוש מהפרויקט

ליצור את סצנה 21 (סרטון החתונה) עם עקביות דמויות:
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh \
  "Pixar 3D style: exhausted couple jogging on Tel Aviv seaside promenade at sunset, Paralympic athlete in racing wheelchair effortlessly overtaking them, deadpan comedy" \
  "yuval/outputs/wedding_images/scene21.png" \
  --reference "yuval/reference/PHOTO-2026-02-27-07-08-36.jpg" \
  --size 1920x1080
```

## Sources

- [GPT Image 2 — OpenAI docs](https://developers.openai.com/api/docs/models/gpt-image-2)
- [Create image edit — OpenAI API ref](https://developers.openai.com/api/reference/resources/images/methods/edit)
- [GPT Image 1.5 prompting guide](https://cookbook.openai.com/examples/multimodal/image-gen-1.5-prompting_guide)
