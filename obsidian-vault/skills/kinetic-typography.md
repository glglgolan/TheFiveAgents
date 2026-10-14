---
file_path: .claude/skills/kinetic-typography/SKILL.md
last_updated: 2026-10-08
owner: the-video-man
---

# kinetic-typography

## מה זה עושה
שכבת טיפוגרפיה מונפשת מעל וידאו מוגמר, ב-Remotion. נתוני האנימציה נשמרים בקובץ אחד (`text_layers.json`). אפשר להגדיר keyframes לכל אות או מילה: x/y/z, סיבוב, scale, blur, opacity, כל ease של GSAP, וגם stagger ו-scatter. יש שני מנועי רינדור: CSS-3D, ו-three.js לאותיות תלת-ממד אמיתיות (כולל עברית, ממיר TTF→typeface). מבנה השכבות: plate → text_back → product_matte → text_front. ה-matte של המוצר מחולץ מקומית עם rembg, וכך אותיות יכולות לעבור מאחורי המוצר. ffmpeg מגיע מובנה ב-venv של הסקיל (`concat.sh`, `mux_audio.sh`). יש 6 presets ודמו עובד ב-`demo/`. Studio רץ דרך `preview_start "typo-studio"`. הכל רץ מקומית, ללא עלות API.

**v2 (2026-10-08):** grain תואם-פוטג', השתקפויות סביבה + צל אמיתי ב-three.js, שכבות ציור (`type: draw`) עם draw-on + boil.

## שייך ל
the-video-man (שלב אחרי ההרכבה), בסדרת [[surreal-product-ad-series]].

## קבצים קשורים
- [[the-video-man]]
- [[surreal-product-ad-series]]
- [[storyboard-director]]
- [[openrouter-video-gen]]
- [[video-editor]]
- [[launch-json]]

## מיקום
`.claude/skills/kinetic-typography/` (`SKILL.md` · `schema/` · `presets/` · `fonts/` · `templates/remotion/` · `scripts/` · `demo/`)
