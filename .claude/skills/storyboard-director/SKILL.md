---
name: storyboard-director
description: Use when the user wants to turn raw story material into a structured storyboard for a video clip. Takes a "dirty" unordered story OR a ready-made storyboard that needs re-ordering, and produces a structured storyboard (scenes + per-scene first-image prompt + video prompt) as JSON + a Hebrew Markdown table. Defines a shared visual theme and a cast of character anchors so downstream images stay consistent. Used by the "במבי" (director) agent.
---

# Storyboard Director

הופך **חומר גלם** — סיפור "מלוכלך" ולא מסודר, או סטוריבורד מוכן שצריך רק סידור מחדש — ל**סטוריבורד מובנה** לקליפ וידאו. כל סצנה מקבלת תיאור, prompt לתמונה ראשונה (לפריים), ו-prompt לווידאו. הסקיל מגדיר **לוק ויזואלי משותף** ו-**cast של עוגני דמויות**, כך שהשלב הבא (תמונות → וידאו) נשאר עקבי.

מקור השראה למבנה הפאזות: [ai-video-storyboard-skill](https://github.com/aicontentskills/ai-video-storyboard-skill) (MIT). ההבדל אצלנו: העקביות לא נשענת רק על theme טקסטואלי — אנחנו מייצרים **תמונות-עוגן אמיתיות** לכל דמות ומזינים אותן כ-`--reference` לכל סצנה, דרך הסקילז הקיימים `gpt-image-gen` ו-`openrouter-video-gen`.

## מה הוא מייצר

`storyboard.json` (לאוטומציה — ראובן עושה עליו לולאה) + `storyboard.md` (טבלה עברית קריאה לאישור אנושי, כולל תסריט הקריינות המלא אם יש `narration`) + `storyboard_grid.html` (רשת חזותית חיה — עוקבת אחרי **תמונות וגם וידאו**, ראה שלב 6). הסכמה המלאה ב-`schema.json`.

## פאזות

1. **קליטה וזיהוי** — קרא את כל מה שב-`bambi/input/<project>/`. החלט לבד:
   - **סיפור גולמי** → פירוק מלא (theme + cast + סצנות).
   - **סטוריבורד מוכן** → נירמול בלבד: מיפוי לסכמה, השלמת שדות חסרים, סידור מחדש של סצנות.
2. **לוק ויזואלי** — הגדר `visual_theme`: `palette`, `lighting`, `film_look`, `motion`, `mood`. זה החוזה שכל סצנה מכבדת.
3. **Cast** — חלץ דמויות/אובייקטים/לוקיישנים חוזרים. לכל אחד: `id`, `name`, `description` ויזואלי יציב (אנגלית), ו-`anchor_image` = `bambi/cast/<project>/<id>.png` עם `anchor_ready:false`. את הפיקסלים מייצר **יובל** בהמשך — הסקיל רק מגדיר.
4. **פירוק לסצנות** — 6–18 סצנות. לכל סצנה:
   - `description` (עברית — מה קורה).
   - `narration` (עברית, אופציונלי) — קטע קריינות/voiceover אם יש VO מקור (script/Google Doc). כשקיים, שומר תמיד יחס 1:1 לביטים בקריינות המקורית — הקטעים לפי סדר הסצנות מרכיבים מחדש את התסריט המלא ללא שינוי (ר' "עקרונות voiceover" למטה).
   - `shot`: `type` (ECU/CU/MCU/MS/MLS/LS/EWS), `angle`, `camera_move`.
   - `image_prompt` (אנגלית) — הפריים הראשון. ספציפי, חזותי, כולל הפניה לדמות וללוק המשותף.
   - `video_prompt` (אנגלית, 40–80 מילים) — תנועה, מצלמה, קצב, אודיו אם רלוונטי.
   - `reference` — נתיב `anchor_image` של הדמות הדומיננטית בסצנה (ריק = text-to-image טהור).
   - `image_output` / `video_output` — נתיבי יעד מתוכננים.
5. **כתיבה** — שמור `storyboard.json` ב-`bambi/outputs/<project>/<YYYY-MM-DD>-<slug>/`, ואז:
   ```bash
   python3 .claude/skills/storyboard-director/scripts/render_md.py \
     "bambi/outputs/<project>/<run>/storyboard.json"
   ```
   (כותב `storyboard.md` באותה תיקייה).
6. **רשת חזותית חיה (grid)** — כתוב גם `storyboard_grid.html` — דשבורד HTML עצמאי, נפתח בדפדפן, ללא תלויות:
   ```bash
   python3 .claude/skills/storyboard-director/scripts/render_grid.py \
     "bambi/outputs/<project>/<run>/storyboard.json"
   ```
   הרשת מציגה כרטיס לכל סצנה (מספר, משך, shot, דמויות, קטע קריינות/תיאור) ומזהה אוטומטית **תמונות** שכבר נוצרו ב-`scenes/` (או `scenes_v2/` וכו', לפי שם קובץ הסטוריבורד) **וגם וידאו** שכבר נוצר בנתיב `video_output` של הסצנה. **↻ רענן** בדפדפן טוען תמונות/וידאו חדשים ברגע שנוצרים — לא צריך ליצור מחדש את ה-HTML בכל סבב. זו תוצרת קבועה של כל run, כמו `storyboard.md`, ומשמשת כ**widget למעקב אחרי כל תהליך היצירה** (תמונות → וידאו) לאורך הפרויקט — לא רק שלב אחד.
7. **דיווח לאישור** — החזר לראובן את הטבלה + קישור ל-grid. **לא** מפעילים סוכנים אחרים מכאן.

## מצב סדרה (series mode) — Surreal Product Ad

כשהמשתמש רוצה **כמה פרסומות באותה שפה חזותית** ("פרסומת סוריאליסטית", "surreal product ad", "אותה סדרה", "עוד פרסומת כמו הבושם"): לא כותבים סטוריבורד חופשי — ממלאים **brief** ומריצים את הגנרטור:

```bash
python3 .claude/skills/storyboard-director/scripts/build_series.py bambi/input/surreal-ads/<slug>/brief.json
python3 .claude/skills/storyboard-director/scripts/render_series_index.py bambi/outputs/surreal-ads
```

- חתימה נעולה: 3 שלבים (דיגיטלי→פיזי / טרנספורמציה / הירו), 15s, 9:16, שרשור keyframes K0→K3 (פריים ראשון+אחרון לכל שלב).
- `image_route`: `gpt` (יובל) או `midjourney` (ידני — `midjourney_prompts.md`). `typography_mode`: `baked` / `hybrid` / `layered` (שכבת `kinetic-typography`).
- widget: `render_series_grid.py` (לא `render_grid.py`) — first/last/video לכל שלב + מסלול טיפוגרפיה + final.
- פרטים מלאים, טבלת החתימה ומשתני ה-brief: `series/surreal-product-ad/SERIES.md`. מקור הטמפלייטים: `series/surreal-product-ad/templates.json`.
- סדרה חדשה = תיקייה חדשה תחת `series/<name>/` עם `templates.json` + `brief.schema.json`, ואז `build_series.py --series <name>`.

## עקרונות voiceover

כשהמשתמש מספק קריינות מקור (טקסט חופשי, Google Doc, script קיים):

- **אימות 1:1** — לפני הפירוק לסצנות, ודא שכל קטע קריינות ממופה לסצנה אחת, ושסכום הקטעים לפי הסדר = הקריינות המקורית **ללא שינוי** (אל תקצר/תפרפרז אלא אם המשתמש ביקש עריכה מפורשת).
- **פער משכים** — קריינות טבעית לרוב ארוכה מקליפ וידאו בודד (למשל 45–75 שניות מול 5–15 שניות מודלים). פתרון: פרק את הסצנה למספר שוטים "הירו" קצרים (5–10s) שהקריינות "רצה מעליהם" ברצף, במקום לנסות לכווץ קליפ אחד לכל אורך הקטע.
- **שמור את הטקסט בשדה `narration` של כל סצנה** — זה מה שמזין את `storyboard.md` (טבלת VO) ואת ה-grid (קטע קריינות בכרטיס).
- **תסריט מוקלט מרוכז (אופציונלי)** — אם המשתמש צריך קובץ נפרד להקלטה/TTS (כמו ElevenLabs), אפשר לשמור גם `production/voiceover_script.md` — כל קטעי ה-`narration` לפי סדר הסצנות, ברצף אחד. זה טקסט בלבד; **הפקת קובץ האודיו בפועל היא מחוץ לסקיל** (הקלטה אנושית או TTS חיצוני) — הקובץ המוגמר (`.wav`/`.mp3`) מוזן אח"כ ל-`video-editor` כ-`--voiceover`.

## כללי prompt-engineering

- **image_prompt מול video_prompt:** ה-image מתאר *פריים קפוא* (קומפוזיציה, אור, סובייקט). ה-video מתאר *תנועה* על אותו פריים (מצלמה, פעולה, קצב).
- **עקביות:** כל `image_prompt` משבץ את ה-`visual_theme` ואת ה-`description` של הדמות מה-cast.
- **רציפות:** שמור על קו 180° בין סצנות סמוכות; אל תהפוך כיווני מבט בלי כוונה.
- **shot vocabulary:** ECU (extreme close-up) … EWS (extreme wide). השתמש בהם בעקביות.

## חיבור לשלב הבא (מבוצע ע"י ראובן, לא ע"י הסקיל)

| שלב | סקיל קיים | פקודה |
|-----|-----------|--------|
| עוגן ל-cast (text-to-image) | `gpt-image-gen` | `bash .claude/skills/gpt-image-gen/scripts/generate.sh "<cast.description>" "bambi/cast/<project>/<id>.png"` |
| פריים ראשון פר סצנה (image-to-image) | `gpt-image-gen` | `... generate.sh "<image_prompt>" "<image_output>" --reference "<scene.reference>"` |
| וידאו פר סצנה (image-to-video) | `openrouter-video-gen` | `... generate-video.sh "<video_prompt>" "<video_output>" --model <id> --duration <D> --reference "<image_output>"` |

## מגבלה ידועה

`gpt-image-gen` תומך כיום ב-`--reference` חוזר (עד 3) — ראה CLAUDE.md, "one-shot מרובה-רפרנסים".

## Requirements

- `OPENAI_API_KEY` / `OPENROUTER_API_KEY` ב-`.env` — נדרשים רק לשלב התמונות/וידאו (לא לסטוריבורד עצמו).
- `python3` (stdlib בלבד) ל-`render_md.py` ול-`render_grid.py`.

## עדכון ה-grid באמצע production

אם משתמשים משנים סצנות ב-`storyboard.json` (למשל עדכון קריינות v2), או כשמצטברות תמונות חדשות ב-`scenes/`, **הרץ מחדש** את `render_grid.py` — זה בונה מחדש את הרשימה, אך פתיחת אותו `storyboard_grid.html` בדפדפן ולחיצה על **↻ רענן** כבר תציג תמונות חדשות בלי להריץ שום דבר (הרשת קוראת קבצים מהדיסק ב-runtime, לא embedaded בזמן היצירה).
