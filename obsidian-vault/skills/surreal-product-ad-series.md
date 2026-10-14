---
file_path: .claude/skills/storyboard-director/series/surreal-product-ad/SERIES.md
last_updated: 2026-10-09
owner: במבי
---

# surreal-product-ad-series

## מה זה עושה
גנרטור סדרת פרסומות 9:16 של 15 שניות בשפה חזותית אחת. השלבים: Digital → Physical (0–4s), Transformation (4–11s), Hero (11–15s). כל פרסומת מתחילה מ-brief. הגנרטור `build_series.py` מייצר ממנו storyboard, widget (`render_series_grid.py`), `production.md`, `midjourney_prompts.md`, `master_prompt.txt` ו-`text_layers.json`. ה-keyframes K0→K3 משורשרים: לכל שלב יש פריים ראשון ופריים אחרון. מסלולי התמונה: gpt (יובל) או Midjourney ידני. מצבי הטקסט: baked / hybrid / layered. מקור האמת היחיד לטמפלייטים הוא `templates.json`. נבנו 6 briefs: perfume, coffee, f1, sneakers, headphones, chocolate. האינדקס נבנה עם `render_series_index.py`.

**v2 (2026-10-08):** `look: hyperreal` כברירת מחדל + `drawn_mode` (none / sketch-to-real / annotations / both).

**פיילוט MELT (2026-10-09):** שוקולד, MJ keyframes + macro_beat (4 קליפים 4/4/3/4s) → Kling MCP 3.0 first+tail → `final.mp4` → `final_typo.mp4`. 120 קרדיטים Kling.

## שייך ל
במבי (תכנון), ראובן (הפקה), יובל, the-video-man.

## קבצים קשורים
- [[storyboard-director]]
- [[kinetic-typography]]
- [[openrouter-video-gen]]
- [[gpt-image-gen]]
- [[במבי-הבמאי]]
- [[the-video-man]]

## מיקום
`.claude/skills/storyboard-director/series/surreal-product-ad/` · `bambi/input/surreal-ads/` · `bambi/outputs/surreal-ads/`

**v2 (2026-10-09):** keyframes ב-OpenAI (gpt-image-2 + 1.5 edits) → Kling 3.0 → טאגליין מעוגן בלבד → סאונד ElevenLabs (music + SFX) → `MELT_final.mp4`. ראה [[kinetic-typography]].

- 2026-10-10: גימור (אפקטים + סאונד היברידי) → [[cinematic-finish]]; ברירת מחדל 4 קליפים + macro, מסלול gpt, QA רציפות.
