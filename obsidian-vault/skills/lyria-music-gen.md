---
file_path: .claude/skills/lyria-music-gen/SKILL.md
last_updated: 2026-10-08
owner: המלחין
---

# lyria-music-gen

## מה זה עושה

מעטפת ליצירת מוזיקה אינסטרומנטלית וכיסויי SFX אמביינטיים באמצעות **Google Lyria RealTime** (מודל `models/lyria-realtime-exp`, נגיש בחינם דרך Gemini API / Google AI Studio). מתחברת ב-WebSocket דרך ה-SDK `google-genai` (מותקן אוטומטית אם חסר), שולחת weighted prompts + הגדרות (bpm/scale/density/brightness/guidance), וכותבת קובץ WAV (48kHz, 16-bit PCM, סטריאו) באורך מדויק לפי שניות שהתבקשו.

## איך זה עובד (בקצרה)

1. **Lyria קודם** — אם יש `GEMINI_API_KEY` ב-`.env`, נוצר cue דרך Lyria RealTime (מהיר ≈ זמן אמת, מותר לשימוש מסחרי לפי תנאי Google).
2. **MusicGen כגיבוי** — אם אין מפתח או ש-Lyria נכשל, אותה פקודה נופלת אוטומטית ל-`facebook/musicgen-small` מקומי (חינם, בלי API) — גם ל-MUSIC וגם ל-SFX/אמביינס.
3. **איך יודעים מה רץ** — שורת הסיום: `OK via Lyria RealTime ...` או `OK via MusicGen (... NON-COMMERCIAL)`. ב-MusicGen נכתב גם `<stem>.NONCOMMERCIAL.txt`.
4. **⚠️ רישיון** — פלט MusicGen הוא CC-BY-NC 4.0: **לא לעבודה בתשלום/ללקוח**. לפרויקט מסחרי — לייצר מחדש דרך Lyria.
5. **מהירות** — Lyria: שניות. MusicGen על ה-Intel Mac: ~18 דקות ל-36 שניות → רק ל-cues קצרים.
6. **סביבה** — הכל רץ ב-venv פרטי (`.claude/skills/lyria-music-gen/.venv`), לא נוגע ב-Python הגלובלי. הרצה ראשונה של הגיבוי מורידה ~2GB.
7. **כפיית מנוע** — `--engine lyria` / `--engine local` (ברירת מחדל `auto`).

## שייך ל

[[המלחין]] — הסקיל היחיד שהוא קורא ליצירת מוזיקה בפועל.

## שימוש

```bash
bash .claude/skills/lyria-music-gen/scripts/generate.sh "<prompt>" <duration_seconds> "<output>.wav" [--negative "..."] [--bpm N] [--scale NAME] [--density N] [--brightness N] [--guidance N] [--seed N] [--engine auto|lyria|local] [--local-model <hf-id>]
```

## קבצים קשורים

- [[המלחין]] — הסוכן שמפעיל את הסקיל
- [[gpt-image-gen]] — סקיל מקביל (תמונות) באותו דפוס: script + .env + fallback
- `scripts/local_musicgen.py` — מנוע הגיבוי המקומי (MusicGen דרך `transformers`)

## מגבלות ידועות

- אינסטרומנטלי בלבד — אין תמיכה בשירה/מילים.
- מודל ניסיוני (`-exp`) — שם/API עשויים להשתנות ללא הודעה מוקדמת מגוגל.
- כל קריאה פותחת session חדש; אין streaming רציף בין cues נפרדים.
- MusicGen: חלון של 30 שניות, ארוך יותר נבנה בהמשכים (סביר עד ~60–90s); חלש באפקטים מילוליים (טריקת דלת, ירייה); אין `--negative`, ו-bpm/scale/density/brightness מתורגמים לטקסט.
- על Intel Mac: torch נעול ל-2.2.2 (`numpy<2`, `transformers<4.50`) — מטופל אוטומטית.

## מיקום

`.claude/skills/lyria-music-gen/`
