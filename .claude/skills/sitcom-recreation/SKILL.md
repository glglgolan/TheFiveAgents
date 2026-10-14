---
name: sitcom-recreation
description: Use when the user wants a video clip that recreates the look, format and cast of an existing TV series — a sitcom scene in the style of Friends/Seinfeld/The Office, a "lost episode", a fake promo, or any multi-shot scene that must keep the same cast, sets and visual theme across shots. Builds a series bible (theme + cast anchors + sets), renders scene first-frames, and generates per-shot clips with MiniMax H3 (native dialogue + laugh track). Used by the-video-man agent; pairs with storyboard-director and video-editor.
---

# Sitcom Recreation (MiniMax H3)

הפקת **סצנה בסגנון סדרה קיימת** — אותו לוק, אותו פורמט, אותו cast לאורך כל השוטים.
המודל המרכזי הוא **MiniMax H3** (`minimax/hailuo-3`, $0.13/sec) כי הוא היחיד בקטלוג שמייצר
**אודיו סטריאו נייטיב** — דיאלוג עם lip-sync, room tone וצחוק קהל — וזה 70% מהאפקט של סיטקום.

> **למה לא Kling/Seedance:** Kling v3.0 Pro אין לו דיאלוג. Seedance 2.0 יש לו סנכרון אודיו
> אבל בלי שליטת reference באותה רמה. לסיטקום — H3. לשוט אילם/פתיח ויזואלי — Kling זול יותר.

## עקרון-על: הלוק ניתן לחיקוי, הפרצופים לא

זה הכלל שמנווט את כל הסקיל:

| מה | מותר/עובד | איך |
|---|---|---|
| **פורמט ודקדוק** (multi-cam, laugh track, proscenium set, קצב הבדיחה) | ✅ סגנון — לא מוגן | `visual_theme` + `shot grammar` למטה |
| **לוק** (35mm, high-key, פלטה חמה, עדשות בינוניות) | ✅ | מחרוזת `look` קבועה בכל prompt |
| **דמויות ארכיטיפיות** ("החבר הנאיבי", "השכן הציני") | ✅ | `cast` עם anchor images מקוריים |
| **פרצוף/שם של שחקן אמיתי** | ⚠️ זכות פרסום + סיכוי גבוה לסירוב/דריפט של המודל | ראה "cast אמיתי" למטה |

**ברירת מחדל:** cast מקורי שנבנה מ-anchor images — או **מתמונות שהמשתמש סיפק** (הוא, חברים, שחקנים
שהוא צילם, מותג שהוא מחזיק). זה גם החוקי וגם מה שנותן תוצאה יציבה יותר, כי anchor אמיתי אחד
שולט טוב יותר מכל תיאור טקסטואלי של סלב.

**cast אמיתי:** אם המשתמש מבקש במפורש דמות/שחקן מזוהה — אמור לו בשורה אחת שהמודל עלול לסרב או
לסטות, שאלו זכויות שלו לוודא, והמשך. אל תעצור את העבודה בגלל זה: בנה את השאר במלואו.

## הזרימה (6 שלבים)

```
1. Series Bible   → series_bible.json  (theme + cast + sets)   ← הלב. בלי זה הכל נסחף
2. Cast anchors   → gpt-image-gen      → bible/cast/<id>.png
3. Set plates     → gpt-image-gen      → bible/sets/<id>.png   (+ ensemble plate פר-סט)
4. Scene frames   → gpt-image-gen --reference <anchor>  → frames/sNN.png
5. Shots          → openrouter-video-gen --model minimax/hailuo-3 --reference frames/sNN.png
6. Cut            → video-editor (מעברי cut קשיחים, laugh bed, טייטלים) → final.mp4
```

### 1. Series Bible

העתק את `templates/series_bible.json` ל-`the-video-man/outputs/<project>/<run>/series_bible.json`
ומלא. השדה החשוב ביותר הוא `look.prompt_string` — **מחרוזת אחת באנגלית שנכנסת מילה במילה
לכל image_prompt ולכל video_prompt**. אל תנסח אותה מחדש בין שוטים; ניסוח מחדש = דריפט.

פריסטים מוכנים ללוקים נפוצים (90s multi-cam, mockumentary, 80s tape look, modern single-cam):
`references/series-presets.md`.

### 2–3. Anchors — למה זה לא אופציונלי

`gpt-image-gen` מקבל **רפרנס יחיד**, ו-H3 דרך המעטפת שלנו מקבל **first frame יחיד**. הפתרון
לסצנה רב-דמותית הוא לא כמה רפרנסים — אלא **ensemble plate**: תמונה אחת שבה כל הדמויות של הסט
כבר יושבות במקומן בקומפוזיציה של הסדרה. משם והלאה כל שוט הוא image-to-image מהפלייט.

```bash
# עוגן פר-דמות: front-facing, ניטרלי, תלבושת הסדרה, רקע אחיד
bash .claude/skills/gpt-image-gen/scripts/generate.sh \
  "<LOOK>. Character reference sheet: <cast.description>, <cast.wardrobe>, neutral expression, \
front-facing, plain neutral background, full head and shoulders" \
  "the-video-man/outputs/<project>/<run>/bible/cast/<id>.png"

# ensemble plate פר-סט: כל הדמויות בפריים אחד, בבלוקינג של הסדרה
bash .claude/skills/gpt-image-gen/scripts/generate.sh \
  "<LOOK>. <set.description>. Wide master shot, the ensemble arranged on the couch facing the \
fourth wall: <cast A desc> left, <cast B desc> center, <cast C desc> right" \
  ".../bible/sets/<set>_ensemble.png" --reference ".../bible/cast/<lead>.png"
```

אם צריך דיוק פנים לאדם אמיתי שהמשתמש סיפק — הרץ `face-fidelity` על ה-anchor **פעם אחת**,
לפני שמייצרים ממנו פריימים. זה חינם ומקומי, וכל השוטים יורשים את התיקון.

### 4. פריים ראשון פר-שוט

```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh \
  "<scene.image_prompt>" ".../frames/s03.png" \
  --reference ".../bible/sets/livingroom_ensemble.png" --size 1536x1024
```

ה-`image_prompt` מתאר **פריים קפוא**: מי בפריים, איפה, גודל שוט, זווית, אור. לא תנועה.

### 5. שוטים ב-H3

בנה את הפרומפט עם הסקריפט — הוא מרכיב את המבנה שה-H3 מצפה לו ובודק את מגבלת 2,000 התווים:

```bash
python3 .claude/skills/sitcom-recreation/scripts/build_h3_prompt.py \
  ".../series_bible.json" --scene s03            # מדפיס את הפרומפט
python3 .claude/skills/sitcom-recreation/scripts/build_h3_prompt.py \
  ".../series_bible.json" --all --out ".../prompts/"   # קובץ .txt לכל שוט
```

ואז:

```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh \
  "$(cat .../prompts/s03.txt)" \
  ".../videos/s03.mp4" \
  --model minimax/hailuo-3 \
  --duration 8 \
  --reference ".../frames/s03.png"
```

### 6. עריכה

סיטקום נחתך ב-**cut קשיח**, לא ב-crossfade. ב-`edit_plan.json` השתמש ב-`"transition": "cut"`
(או `fade` באורך 0 בין שוטים, ו-`fade` אמיתי רק בכניסה/יציאה מפרסומת). טייטלים ושיר נושא —
בפוסט, לא במודל: H3 לא מרנדר טקסט אמין.

## כללי prompt ל-H3

מבנה קבוע בשש שכבות (הסקריפט מייצר אותו):

```
[Static shot] Multi-camera studio sitcom. <LOOK>.
<SET>. <who is in frame and where, matching the reference frame>.
Timeline: 0-3s <action>; 3-6s <action>; 6-8s <ending state>.
Dialogue (one speaker at a time):
  RACHEL-ARCHETYPE, dry and deadpan: "Line one."
  MONICA-ARCHETYPE, exasperated: "Line two."
Sound: clear dialogue, room tone of a small apartment, a studio audience laugh after the last line, no music.
Keep consistent: faces, hair, wardrobe and set exactly as in the reference frame; camera stays locked.
```

כללים שהוכחו:

- **דובר אחד בכל רגע.** דיבור חופף שובר lip-sync. שתי רפליקות ל-8 שניות זה המקסימום הנוח.
- **Timeline מפורש** עם טווחי שניות — H3 מגיב לזה חזק, כולל מצב הסיום.
- **תגיות מצלמה בסוגריים** מדויקות יותר מתיאור חופשי. מקסימום 3 בפרומפט. אוצר המילים המלא
  ב-`references/h3-prompt-spec.md`. **לסיטקום: `[Static shot]` ברוב השוטים**, `[Push in]` איטי
  רק על הפאנץ', ו-`[Pan]` רק כשדמות עוברת בין אזורי הסט.
- **Constraints שורה אחרונה** — מה חייב להישאר קבוע. זה מה שמונע מורפינג של פנים.
- **ניסוח זהה מילה במילה** לתכונות הדמות בין שוטים. משנים רק פעולה ו-setting.
- **מקסימום 2,000 תווים** לפרומפט API.

## דקדוק הצילום של multi-cam

זה מה שגורם לזה להיראות כמו סדרה ולא כמו קליפ AI:

| כלל | פירוט |
|---|---|
| **קיר רביעי** | הסט הוא במה. לעולם אל תצלם מהקיר החסר פנימה — כל השוטים מאותו צד. |
| **קו 180°** | נקבע פר-סט ולא נשבר. אם A משמאל בשוט המאסטר, A משמאל בכל השוטים. |
| **סולם השוטים** | master (LS) → two-shot (MS) → reaction (MCU/CU). מחזור: מאסטר בפתיחה, קלוז על הפאנץ'. |
| **מצלמה נעולה** | multi-cam כמעט לא זז. handheld = mockumentary, לא סיטקום קלאסי. |
| **אור** | high-key, שטוח, כמעט בלי צללים, מנורות פרקטיות בפריים. |
| **ביט אחד לשוט** | שוט = הקמה או פאנץ'. אל תדחוס שתי בדיחות ל-8 שניות. |
| **ריאקשן shot** | אחרי כל פאנץ' — 3–5 שניות של תגובה שקטה. זול, ומקנה קצב אמיתי. |

## תכנון runtime ותקציב

H3: **5–15 שניות** לג'וב, 24fps, $0.13/sec.

| היקף | שוטים | משך ממוצע | עלות |
|---|---:|---:|---:|
| ביט בודד / promo | 3–4 | 8s | ~$3–4 |
| סצנה מלאה | 8–12 | 8s | ~$8–12 |
| Cold open | 12–16 | 8s | ~$12–17 |

חשב את זה **לפני** ההרצה ודווח למשתמש. תמיד הרץ **שוט בדיקה אחד** לפני batch.

## QA — contact sheet לפני שממשיכים

אחרי ה-batch, בדוק דריפט זהות לפני העריכה:

```bash
python3 .claude/skills/storyboard-director/scripts/render_grid.py ".../storyboard.json"
```

עבור על השוטים זה לצד זה. שוט שבו הדמות "כמעט אותו אדם" — **צור מחדש עכשיו**, לא בעריכה.
תיקון של פריים ראשון + ג'וב אחד עולה ~$1; גילוי אחרי הרכבה עולה סבב שלם.

## מגבלות ידועות

- המעטפת `openrouter-video-gen` שולחת **רפרנס אחד** ותומכת ב-`16:9 / 9:16 / 1:1` בלבד.
  H3 נייטיב תומך גם ב-first+last frame וב-4:3 / 21:9 — לא נחשף אצלנו. **4:3 רטרו = pillarbox
  בפוסט** דרך `video-editor`.
- H3 לא מרנדר טקסט אמין — טייטלים, שלטים וכתוביות בפוסט.
- אין המשכיות מובטחת בין ג'ובים. ההמשכיות מגיעה מ-**הפריים הראשון**, לא מהמודל.

## Requirements

- `OPENROUTER_API_KEY` ו-`OPENAI_API_KEY` ב-`.env`.
- `python3` (stdlib בלבד), `ffmpeg` לשלב העריכה.
