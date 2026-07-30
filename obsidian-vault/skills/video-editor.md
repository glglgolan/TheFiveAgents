---
file_path: .claude/skills/video-editor/SKILL.md
last_updated: 2026-07-25
owner: the-video-man
---

# video-editor

## מה זה עושה
עוטף ffmpeg להרכבת קליפים פר-סצנה לסרט מוגמר ומקצועי: מעברים חלקים (xfade — crossfade/dissolve/
wipe/slide), התאמת מהירות ל-voiceover (`fit_to_audio` מותח אחיד כך שאורך הסרט = אורך הקריינות),
מיקס קריינות + מוזיקת רקע עם **ducking** ו-`loudnorm`, נירמול רזולוציה/fps/pixfmt/SAR, fades,
כתוביות RTL בעברית, וייצוא H.264 `yuv420p +faststart`. plan-driven (`edit_plan.json` → `assemble.py`)
או recipes בודדים ב-SKILL.md. דורש `ffmpeg`+`ffprobe` ≥ 4.3.

## שייך ל
the-video-man (מפיק הווידאו) — שלב פוסט-פרודקשן אחרי יצירת קליפים.

## קבצים קשורים
- [[the-video-man]]
- [[openrouter-video-gen]]
- [[storyboard-director]]
- [[במבי-הבמאי]]

## מיקום
`.claude/skills/video-editor/` (`SKILL.md` · `scripts/assemble.py` · `scripts/build_plan_from_storyboard.py`)
