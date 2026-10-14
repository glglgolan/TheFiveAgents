---
name: gemini-image-gen
description: Generate or edit images via the Google Gemini Interactions API (Nano Banana), with an OpenRouter fallback. Text-to-image or multi-image blending/editing with reference images for character consistency. A selectable alternative provider for יובל (Yuval) — OpenAI (gpt-image-gen) is the default. ⚠️ Currently blocked: account returns HTTP 429 free-tier quota=0 even with billing linked (likely billing on the wrong GCP project) — verify before relying on it.
---

# gemini-image-gen

מעטפת ליצירה ועריכת תמונות דרך **Gemini Interactions API** (Nano Banana) של Google, עם נפילה אוטומטית ל-OpenRouter. זהו **ספק אלטרנטיבי נבחר** של יובל (ברירת המחדל היא `gpt-image-gen`) — ר' `.claude/agents/yuval.md` § בחירת ספק.

> **⚠️ סטטוס נוכחי: לא עובד.** גם עם `GEMINI_API_KEY` מוגדר וגם עם billing מחובר, החשבון מחזיר `HTTP 429 — free_tier quota=0` (נבדק על `gemini-3.1-flash-image` וגם `gemini-2.5-flash-image` — אותה תוצאה, כלומר לא ספציפי למודל). כנראה billing מקושר לפרויקט GCP שונה מזה שאליו שייך המפתח — בדוק התאמה בין הפרויקט המוצג ב-`aistudio.google.com/apikey` לפרויקט עם ה-billing ב-`console.cloud.google.com/billing`.

## מודלים

- **`gemini-3.1-flash-image`** — ברירת מחדל. "Nano Banana 2" — מודל generalist, מחיר/מהירות טובים.
- `gemini-3.1-flash-lite-image` — הכי מהיר/זול, מוגבל ל-1K.
- `gemini-3-pro-image` — "Nano Banana Pro", האיכות הגבוהה ביותר, יקר יותר.
- `gemini-2.5-flash-image` — legacy "Nano Banana", לגיבוי אם המודלים החדשים לא זמינים בחשבון.

## שימוש

```bash
# 1. בסיסי — text-to-image 1:1
bash .claude/skills/gemini-image-gen/scripts/generate.sh "<prompt>" "<output>.png"

# 2. עם aspect ratio (ממופה לקרוב מבין 1:1/3:2/2:3/3:4/4:3/4:5/5:4/9:16/16:9/21:9)
bash .claude/skills/gemini-image-gen/scripts/generate.sh "<prompt>" "<output>.png" --size 1920x1080

# 3. עם רפרנס לעקביות דמויות / בלנד רב-תמונתי — ניתן לחזור על הדגל
bash .claude/skills/gemini-image-gen/scripts/generate.sh "<prompt>" "<output>.png" \
  --reference "yuval/reference/photo1.jpg" --reference "yuval/reference/photo2.jpg"

# 4. דריסת מודל / איכות
bash .claude/skills/gemini-image-gen/scripts/generate.sh "<prompt>" "<output>.png" --model gemini-3-pro-image
bash .claude/skills/gemini-image-gen/scripts/generate.sh "<prompt>" "<output>.png" --light   # טיוטה זולה (512px)
```

## פרמטרים

- `prompt`, `output` (positional, חובה)
- `--size WxH` — ברירת מחדל `1024x1024`. Interactions API לא מקבל פיקסלים חופשיים — הסקריפט ממפה ל-aspect_ratio הקרוב ביותר.
- `--reference <path>` — ניתן לחזור. הראשון = עוגן סצנה/קומפוזיציה, הבאים = תמונות זהות נוספות (בלנד רב-תמונתי — היכולת המובילה של Nano Banana).
- `--model <name>` — ברירת מחדל `gemini-3.1-flash-image`.
- `--quality low|medium|high|auto` — ממופה ל-`image_size`: `512px`/`1K`/`2K`. ברירת מחדל `medium` (1K).
- `--light` — קיצור ל-`--quality low` (512px, לטיוטות).

## Flow

1. טוען `.env` (`GEMINI_API_KEY` או `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`).
2. בונה בקשה ל-`POST https://generativelanguage.googleapis.com/v1beta/interactions` — `input[]` עם `{type:"text"}` + `{type:"image", mime_type, data}` לכל רפרנס (base64), ו-`response_format:{type:"image", mime_type:"image/jpeg", aspect_ratio, image_size}`. **חשוב:** ה-API מקבל **רק `image/jpeg`** ב-`response_format.mime_type` (`image/png` מחזיר 400) — הסקריפט מבקש jpeg ואז ממיר ל-PNG אמיתי (Pillow) לפני הכתיבה לדיסק, כדי שהפלט תמיד יהיה `.png` תואם לשאר ה-pipeline.
3. **Primary:** Gemini ישיר (`x-goog-api-key`). **Fallback:** OpenRouter (`google/<model>`, chat-completions עם `modalities:["image","text"]`).
4. מחלץ את התמונה מ-`output_image.data`, או מ-`steps[].content[]` (תשובה interleaved).
5. Exit 0 בהצלחה, 1 בכישלון (שני הספקים נכשלו) / 2 (קובץ רפרנס חסר).

## הבדלים מ-`gpt-image-gen`

- **אין `input_fidelity`** — נעילת פנים ב-Nano Banana נשענת על העברת תמונת הרפרנס כ-input part רגיל, לא על פרמטר ייעודי. איכות שימור הפנים לא נבדקה עדיין מול `gpt-image-1.5` בפרויקט אמיתי — **לפני החלפת bambi/face-fidelity pipeline למודל הזה, יש לבדוק ידנית**.
- **בלי בקרת רזולוציית פיקסלים חופשית** — רק aspect_ratio + tier (512px/1K/2K/4K).
- **המחיר לא ידוע לי בוודאות** בזמן הכתיבה — בדוק ב-Google AI Studio / billing console לפני ריצה בהיקף גדול.

## מגבלה ידועה

לא נבדק עדיין מול פרויקטי הסטוריבורד (Raz/shuki) — ה-pipeline של bambi (עוגני cast, פריימי סצנה) ממשיך להשתמש ב-`gpt-image-gen` כברירת מחדל, לא בסקיל הזה, עד שיוחלט אחרת.

## Sources

- [Gemini API — Image generation (Interactions API, GA)](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
