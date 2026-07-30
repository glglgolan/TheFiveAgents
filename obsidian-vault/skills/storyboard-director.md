---
file_path: .claude/skills/storyboard-director/SKILL.md
last_updated: 2026-07-24
owner: במבי
---

# storyboard-director

## מה זה עושה
הופך חומר גלם לסטוריבורד מובנה לפי `schema.json`: `visual_theme` + `cast` + סצנות (כל סצנה עם
`shot`, `image_prompt`, `video_prompt`, `reference`, `image_output`/`video_output`). מייצר שלושה
תוצרים: `storyboard.json` (לאוטומציה), `storyboard.md` (טבלה עברית לאישור, דרך `render_md.py`),
ו-`storyboard_grid.html` (רשת חזותית חיה, דרך `render_grid.py`) — הרשת מזהה אוטומטית תמונות
שנוצרו ב-`scenes/`. stdlib בלבד.

## שייך ל
במבי (הבמאי).

## קבצים קשורים
- [[במבי-הבמאי]]
- [[gpt-image-gen]]
- [[openrouter-video-gen]]

## מיקום
`.claude/skills/storyboard-director/` (`SKILL.md` · `schema.json` · `scripts/render_md.py` · `scripts/render_grid.py`)
