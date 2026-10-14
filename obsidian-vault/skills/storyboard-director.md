---
file_path: .claude/skills/storyboard-director/SKILL.md
last_updated: 2026-10-08
owner: במבי
---

# storyboard-director

## מה זה עושה
הופך חומר גלם לסטוריבורד מובנה לפי `schema.json`: `visual_theme` + `cast` + סצנות (כל סצנה עם
`shot`, `image_prompt`, `video_prompt`, `reference`, `image_output`/`video_output`). מייצר שלושה
תוצרים: `storyboard.json` (לאוטומציה), `storyboard.md` (טבלה עברית לאישור, דרך `render_md.py`),
ו-`storyboard_grid.html` (רשת חזותית חיה, דרך `render_grid.py`) — הרשת מזהה אוטומטית תמונות
שנוצרו ב-`scenes/`. stdlib בלבד.

**מצב סדרה (2026-10-08):** `scripts/build_series.py` + `series/<name>/` (templates.json + brief.schema.json) → סטוריבורד נעול מ-brief; widget ייעודי `render_series_grid.py` + אינדקס `render_series_index.py`. schema: `end_reference`, `series`.

## שייך ל
במבי (הבמאי).

## קבצים קשורים
- [[kinetic-typography]]
- [[surreal-product-ad-series]]
- [[במבי-הבמאי]]
- [[gpt-image-gen]]
- [[openrouter-video-gen]]

## מיקום
`.claude/skills/storyboard-director/` (`SKILL.md` · `schema.json` · `scripts/render_md.py` · `scripts/render_grid.py`)
