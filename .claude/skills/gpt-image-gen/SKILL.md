---
name: gpt-image-gen
description: Generate or edit images via OpenAI gpt-image models (with OpenRouter fallback). Text-to-image via /generations (default gpt-image-2). Image-to-image with reference for character consistency via /edits (default gpt-image-1.5). Supports custom aspect ratios.
---

# gpt-image-gen

מעטפת ליצירה ועריכת תמונות ב-OpenAI Images API עם נפילה אוטומטית ל-OpenRouter.

## מודלים

- **`gpt-image-2`** (יצא 21.4.2026) — ברירת מחדל ל-text-to-image. החדיש והאיכותי ביותר.
- **`gpt-image-1.5`** — ברירת מחדל לעריכה עם רפרנס. מצטיין ב-character consistency ושימור פנים.
- `gpt-image-1`, `gpt-image-1-mini`, `gpt-image-2-2026-04-21`, `chatgpt-image-latest` — לגיבוי/דריסה עם `--model`.

> **⚠️ `gpt-image-2` לא תומך ב-`input_fidelity`.** הפרמטר הזה (`input_fidelity:high`) הוא מה שנועל את הפנים על הרפרנס במצב edits — ולכן ברירת המחדל לעריכה נשארת `gpt-image-1.5`. אם דורסים ל-`--model gpt-image-2` במצב edits, הסקריפט **מסיר אוטומטית** את `input_fidelity` (אחרת ה-API מחזיר 400) — התוצאה זולה משמעותית אבל דיוק הפנים מהרפרנס נחלש.

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

# 3b. רפרנס-מרובה — נעילת כמה פנים בקריאה אחת (עד 16; הסדר חשוב!)
#     רפרנס ראשון = עוגן סצנה/קומפוזיציה, הבאים = פנים סולו של דמויות נוספות
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png" \
  --reference "yuval/reference/Raz/_proxy/2024-teen-raz-tomer-19.jpg" \
  --reference "yuval/reference/Raz/_proxy/wedding-aa-119.jpg" \
  --reference "yuval/reference/Raz/_proxy/2026-teen-whatsapp.jpg"

# 4. רפרנס + size — auto-mapped ל-1024x1024/1536x1024/1024x1536
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png" \
  --reference "<path>.jpg" --size 1920x1080

# 5. דריסת מודל ידנית
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png" \
  --reference "<path>.jpg" --model gpt-image-2

# 6. מצב "light tokens" — רינדור זול לטיוטות (quality=low)
bash .claude/skills/gpt-image-gen/scripts/generate.sh "<prompt>" "<output>.png" --light
# שווה-ערך ל: --quality low. אפשר גם --quality medium|high|auto
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
- `--reference <path>` — נתיב לתמונת רפרנס. מפעיל את מצב `/edits` ומחליף מודל ל-`gpt-image-1.5`. **ניתן לחזור על הדגל** (עד 16): הראשון = עוגן סצנה, הבאים = פנים סולו לדמויות נוספות.
- `--model <name>` — דריסה ידנית. שימושי למשל בשביל גוון אומנותי מסוים או נפילה למודל זול.
- `--quality low|medium|high|auto` — איכות/עלות טוקנים. ברירת מחדל `medium`.
- `--light` — קיצור ל-`--quality low` (מצב "light tokens" — הרינדור הזול ביותר, טוב לטיוטות).

## עלות טוקנים (חשוב)

`--light`/`--quality low` מוזיל את טוקני ה-**פלט** (התמונה שנוצרת). אבל במצב **edits** ההוצאה הגדולה היא דווקא ב-**קלט**: `input_fidelity:high` מעבד את הרפרנס ברזולוציה גבוהה. מדידה אמיתית (1024×1024, quality=low):

| קריאה | total | input | output |
|---|---|---|---|
| `gpt-image-1.5` edits + input_fidelity:high (רפרנס 1) | ~7030 | ~6603 | ~427 |
| `gpt-image-1.5` edits + input_fidelity:high (2 רפרנסים) | ~13600 | ~13170 | ~440 |
| `gpt-image-1.5` edits + input_fidelity:high (3 רפרנסים) | ~20250 | ~19760 | ~485 |
| `gpt-image-2` edits (בלי input_fidelity) | ~913 | ~717 | ~196 |

כלומר: לדיוק פנים מרבי משלמים בטוקני קלט (input_fidelity), ו**כל רפרנס נוסף מוסיף ~6.6K input**. לטיוטות זולות — `gpt-image-2 --light` בלי רפרנס, או עם רפרנס תוך ויתור על נעילת הפנים. הסקריפט מדפיס את ה-usage בכל הרצה.

## פייפליין מומלץ לפריים סופי מדויק (רב-דמותי)

1. **One-shot מרובה-רפרנסים** @ `--quality high`: רפרנס ראשון = עוגן סצנה, ואחריו פנים סולו לכל דמות (עד 3 רפרנסים סה"כ). עלות @high: 1 רפרנס ~13.4K · 2 ~20K · 3 ~26.4K.
2. **ביקורת פנים** — אם מדויקות, סיימנו בקריאה אחת.
3. **Fallback** רק אם הפנים לא עברו: face-swap מקומי (חינם, `face-fidelity`) → restyle pass @ high (~13.3K).

נקודת איזון: עד 3 רפרנסים ה-one-shot זול/שווה לפייפליין swap+restyle (26.7K) — עם קריאה אחת פחות ובלי תפר. **מ-4 רפרנסים ומעלה עדיף ישר הפייפליין הישן** (base @ high + swap + restyle).

## פרמטרים קבועים

- `output_format`: `png`
- `input_fidelity`: `high` — **רק** במצב edits ורק במודלים שתומכים (לא `gpt-image-2`); מוסר אוטומטית אחרת.

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
