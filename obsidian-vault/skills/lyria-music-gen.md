---
file_path: .claude/skills/lyria-music-gen/SKILL.md
last_updated: 2026-09-18
owner: נועה
---

# lyria-music-gen

## מה זה עושה

מעטפת ליצירת מוזיקה אינסטרומנטלית וכיסויי SFX אמביינטיים באמצעות **Google Lyria RealTime** (מודל `models/lyria-realtime-exp`, נגיש בחינם דרך Gemini API / Google AI Studio). מתחברת ב-WebSocket דרך ה-SDK `google-genai` (מותקן אוטומטית אם חסר), שולחת weighted prompts + הגדרות (bpm/scale/density/brightness/guidance), וכותבת קובץ WAV (48kHz, 16-bit PCM, סטריאו) באורך מדויק לפי שניות שהתבקשו.

## שייך ל

[[נועה-מלחינה]] — הסקיל היחיד שהיא קוראת ליצירת מוזיקה בפועל.

## שימוש

```bash
bash .claude/skills/lyria-music-gen/scripts/generate.sh "<prompt>" <duration_seconds> "<output>.wav" [--negative "..."] [--bpm N] [--scale NAME] [--density N] [--brightness N] [--guidance N]
```

## קבצים קשורים

- [[נועה-מלחינה]] — הסוכנת שמפעילה את הסקיל
- [[gpt-image-gen]] — סקיל מקביל (תמונות) באותו דפוס: script + .env + fallback

## מגבלות ידועות

- אינסטרומנטלי בלבד — אין תמיכה בשירה/מילים.
- מודל ניסיוני (`-exp`) — שם/API עשויים להשתנות ללא הודעה מוקדמת מגוגל.
- כל קריאה פותחת session חדש; אין streaming רציף בין cues נפרדים.

## מיקום

`.claude/skills/lyria-music-gen/`
