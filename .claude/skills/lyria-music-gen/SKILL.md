---
name: lyria-music-gen
description: Generate instrumental music beds and SFX-style atmospheres via Google Lyria RealTime (Gemini API, free-tier accessible). Use when an agent needs a timed music/SFX cue for a movie scene. Input - prompt string + duration in seconds + output path. Output - WAV file at requested path.
---

# lyria-music-gen

מעטפת ליצירת מוזיקה אינסטרומנטלית וכיסויי SFX אמביינטיים באמצעות **Lyria RealTime** דרך ה-Gemini API.

## מודל

- **מודל:** `models/lyria-realtime-exp`
- גישה: WebSocket streaming דרך ה-SDK הרשמי `google-genai` (מותקן אוטומטית ע"י הסקריפט אם חסר).
- **נגיש בחינם** עם מפתח API של Google AI Studio (`GEMINI_API_KEY`) — לא דורש חיוב.
- ⚠️ **מודל אינסטרומנטלי בלבד** — אין תמיכה בשירה/מילים. כל בקשה לקול אנושי תתעלם או תיפגע באיכות.
- ⚠️ מודל ניסיוני (`-exp`) — שם/זמינות עשויים להשתנות. אם ה-API מחזיר שגיאת "model not found", הבעיה כנראה בגרסת ה-SDK, לא בשם המודל — אל תחליפי אותו בניחוש.

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
  [--seed <int>]
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
- הודעת הצלחה: `OK via Lyria RealTime (models/lyria-realtime-exp) -> <path>`

## עקרונות Prompting (best practices של גוגל)

1. **היי תיאורית** — ז'אנר + מצב רוח + כלים ("melancholic solo piano, sparse, rubato" ולא רק "sad music").
2. **שלבי weighted prompts** — הסקריפט שולח את ה-prompt הראשי במשקל `1.0` ואת ה-negative prompt במשקל `-1.0` (כברירת מחדל: מונע קול/עיוותים).
3. **guidance** (0.0–6.0, ברירת מחדל 4.0) — קובע כמה "חזק" המודל נצמד לפרומפט. ערך גבוה = נאמנות לפרומפט, ערך נמוך = חופש יצירתי/אורגני יותר.
4. **bpm ו-scale** דורשים איפוס הקשר (context reset) כדי להיכנס לתוקף — הסקריפט מטפל בזה כי כל קריאה פותחת session חדש.
5. **density/brightness** משפיעים על צפיפות התווים ובהירות הטונים — טובים לכיוונון עדין של אנרגיית הסצנה.
6. **עקביות מוטיבים** — כדי לשמור על שפה מוזיקלית עקבית לאורך סרט, השתמשו באותם מונחי סגנון/כלים/scale בין cues של אותה דמות/סצנה חוזרת (ראו `composer/Memory/scoring-log.md`).

## מגבלות

- אין פלט קולי/שירה.
- מודל ניסיוני — ייתכנו שינויי API ללא הודעה מוקדמת מגוגל.
- כל קריאה פותחת session חדש (אין streaming רציף בין cues נפרדים).
