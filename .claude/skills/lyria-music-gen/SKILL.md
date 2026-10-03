---
name: lyria-music-gen
description: Generate instrumental music beds and SFX-style atmospheres via Google Lyria RealTime (Gemini API, free-tier accessible), with an automatic local fallback to Meta MusicGen (no API key; CC-BY-NC — non-commercial outputs) when GEMINI_API_KEY is missing or Lyria fails. Use when an agent needs a timed music/SFX cue for a movie scene. Input - prompt string + duration in seconds + output path. Output - WAV file at requested path.
---

# lyria-music-gen

מעטפת ליצירת מוזיקה אינסטרומנטלית וכיסויי SFX אמביינטיים באמצעות **Lyria RealTime** דרך ה-Gemini API.

## מודל

- **מודל:** `models/lyria-realtime-exp`
- גישה: WebSocket streaming דרך ה-SDK הרשמי `google-genai` (מותקן אוטומטית ע"י הסקריפט אם חסר).
- **נגיש בחינם** עם מפתח API של Google AI Studio (`GEMINI_API_KEY`) — לא דורש חיוב.
- ⚠️ **מודל אינסטרומנטלי בלבד** — אין תמיכה בשירה/מילים. כל בקשה לקול אנושי תתעלם או תיפגע באיכות.
- ⚠️ מודל ניסיוני (`-exp`) — שם/זמינות עשויים להשתנות. אם ה-API מחזיר שגיאת "model not found", הבעיה כנראה בגרסת ה-SDK, לא בשם המודל — אל תחליפי אותו בניחוש.

## מנוע חלופי מקומי (fallback) — MusicGen

סדר העדיפויות (`--engine auto`, ברירת מחדל):

1. **Lyria RealTime** — אם `GEMINI_API_KEY` מוגדר ב-`.env` והקריאה הצליחה.
2. **MusicGen מקומי** (`facebook/musicgen-small` דרך `transformers`) — אם אין מפתח, או ש-Lyria נכשל מכל סיבה (רשת, quota, מודל לא זמין). השגיאה של Lyria מודפסת ל-stderr ואז `Falling back to local MusicGen...`.

אותו CLI בדיוק (prompt, duration, output + אותם flags) — `composer.md` לא צריך לדעת באיזה מנוע נעשה שימוש. ה-fallback משמש **גם ל-MUSIC וגם ל-SFX/אמביינס** (AudioGen לא נתמך ב-`transformers`, רק ב-`audiocraft` השביר — הוחלט לא להוסיף אותו). MusicGen טוב בטקסטורות ואמביינס (גשם, רוח, drone), **חלש באפקטים מילוליים** (טריקת דלת, ירייה).

### ⚠️ רישיון — NON-COMMERCIAL

משקולות MusicGen הן **CC-BY-NC 4.0**. כל קובץ שנוצר ב-fallback **אסור לשימוש מסחרי** (עבודה בתשלום / ללקוח).

- הודעת ההצלחה שונה: `OK via MusicGen (local, facebook/musicgen-small, CC-BY-NC 4.0 — NON-COMMERCIAL) -> <path>`
- נכתב קובץ `<stem>.NONCOMMERCIAL.txt` ליד ה-WAV (שם נפרד מה-`.txt` שהמלחין כותב, כדי שלא יידרס).
- **המלחין חייב לדווח לראובן** על כל cue שנוצר ב-MusicGen. לפרויקט מסחרי — לייצר מחדש דרך Lyria.

### התנהגות ומגבלות ה-fallback

- **סביבה:** `generate.sh` יוצר venv פרטי ב-`.claude/skills/lyria-music-gen/.venv` (ב-gitignore) — אף חבילה לא מותקנת ב-Python הגלובלי. בהרצה הראשונה של ה-fallback מותקנים torch/transformers/scipy (~1 GB) ומורדות משקולות המודל (~1 GB, ל-`~/.cache/huggingface`). התקנה בגלגלים בלבד (`--only-binary`).
- **Mac עם Intel:** torch תקוע ב-2.2.2 (גלגל x86_64 אחרון) → הסקריפט נועל אוטומטית `numpy<2` ו-`transformers<4.50`.
- **מהירות:** איטי מאוד. נמדד על ה-Intel i9 של הפרויקט (MPS על GPU AMD): cue של 36 שניות = **~18 דקות** (~30 שניות עבודה לכל שנייה אודיו). מתאים ל-cues קצרים/stingers, לא לפסקול מלא. ב-Apple Silicon מהיר משמעותית.
- **cues מעל 30 שניות:** MusicGen אומן על 30 שניות — הסקריפט ממשיך בחלונות, כל אחד מותנה ב-10 השניות האחרונות (continuation), כך שאין תפר קשיח.
- **פרמטרים:** `--bpm`/`--scale`/`--density`/`--brightness` מתורגמים לטקסט בפרומפט (אין להם שליטה ישירה ב-MusicGen). `--negative` לא נתמך ומתעלמים ממנו. `--guidance` ממופה ל-`guidance_scale` (×0.75). `--seed` עובד.
- פלט זהה ל-Lyria: WAV 48kHz/16-bit/סטריאו, משך מדויק (MusicGen מייצר 32kHz מונו — עובר resample ושכפול ערוצים).

## שימוש

```bash
bash .claude/skills/lyria-music-gen/scripts/generate.sh \
  "<prompt מתאר style/mood/instrumentation>" \
  <duration_seconds> \
  "<output-path>.wav" \
  [--negative "<negative prompt>"] \
  [--bpm <60-200>] \
  [--scale <SCALE_NAME>] \
  [--density <0.0-1.0>] \
  [--brightness <0.0-1.0>] \
  [--guidance <0.0-6.0>] \
  [--seed <int>] \
  [--engine auto|lyria|local] \
  [--local-model <hf-id>]   # ברירת מחדל facebook/musicgen-small; musicgen-medium איכותי יותר ואיטי פי ~3
```

דוגמה:
```bash
bash .claude/skills/lyria-music-gen/scripts/generate.sh \
  "tense minimal strings, low drone, suspenseful, slow build, cinematic underscore" \
  27 \
  "composer/outputs/2026-09-18-scene-03-tension.wav" \
  --negative "vocals, lyrics, drums, upbeat" \
  --bpm 70 \
  --density 0.3 \
  --brightness 0.25
```

## Output

- פורמט: WAV, 48kHz, 16-bit PCM, סטריאו.
- משך בפועל = הפרמטר `duration_seconds` (הסקריפט חותך/ממתין בדיוק לכמות הבתים הדרושה).
- Exit code 0 אם הצליח, 1 אם נכשל (מדפיס שגיאה ל-stderr).
- הודעת הצלחה: `OK via Lyria RealTime (models/lyria-realtime-exp) -> <path>` — או, ב-fallback, `OK via MusicGen (...NON-COMMERCIAL) -> <path>` + קובץ `<stem>.NONCOMMERCIAL.txt`.

## עקרונות Prompting (best practices של גוגל)

1. **היי תיאורית** — ז'אנר + מצב רוח + כלים ("melancholic solo piano, sparse, rubato" ולא רק "sad music").
2. **שלבי weighted prompts** — הסקריפט שולח את ה-prompt הראשי במשקל `1.0` ואת ה-negative prompt במשקל `-1.0` (כברירת מחדל: מונע קול/עיוותים).
3. **guidance** (0.0–6.0, ברירת מחדל 4.0) — קובע כמה "חזק" המודל נצמד לפרומפט. ערך גבוה = נאמנות לפרומפט, ערך נמוך = חופש יצירתי/אורגני יותר.
4. **bpm ו-scale** דורשים איפוס הקשר (context reset) כדי להיכנס לתוקף — הסקריפט מטפל בזה כי כל קריאה פותחת session חדש.
5. **density/brightness** משפיעים על צפיפות התווים ובהירות הטונים — טובים לכיוונון עדין של אנרגיית הסצנה.
6. **עקביות מוטיבים** — כדי לשמור על שפה מוזיקלית עקבית לאורך סרט, השתמשו באותם מונחי סגנון/כלים/scale בין cues של אותה דמות/סצנה חוזרת (ראו `composer/Memory/scoring-log.md`).

## מגבלות

- אין פלט קולי/שירה (בשני המנועים).
- מודל ניסיוני — ייתכנו שינויי API ללא הודעה מוקדמת מגוגל.
- כל קריאה פותחת session חדש (אין streaming רציף בין cues נפרדים).
