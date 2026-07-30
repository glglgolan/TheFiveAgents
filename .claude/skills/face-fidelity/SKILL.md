---
name: face-fidelity
description: Local face swap for facial accuracy. Swaps a real reference face (source photo) onto a generated/stylized image (target) while keeping the target's art style, lighting and composition. Use after gpt-image-gen when a scene needs to match a real person's face. Runs 100% locally via insightface (CPU) — no API, no tokens, no cost.
---

# face-fidelity

מעטפת ל-**החלפת פנים מקומית** (face swap) לשיפור דיוק הפנים בתמונות שנוצרו.
לוקח את הפנים מתמונת רפרנס אמיתית (source) ומשתיל אותן על תמונה שנוצרה/מסוגננת
(target), תוך שמירה על הסגנון, התאורה וההרכב של ה-target.

> **עלות: אפס.** רץ 100% מקומית על ה-CPU דרך `insightface` — ללא API, ללא טוקנים.

## למה זה קיים

`gpt-image-gen` עם `--reference` שומר *סגנון והרכב* מצוין, אבל במצב edits הטקסט
גובר על הרפרנס והפנים יוצאות לעיתים גנריות. החלפת פנים מקומית מתקנת בדיוק את זה:
יוצרים את הסצנה פעם אחת, ומדייקים את הפנים בחינם — במקום לחזור על יצירת התמונה
שוב ושוב (מה שעולה טוקנים).

## ה-pipeline המומלץ

```
1. gpt-image-gen  →  סצנה בסגנון + הרכב נכון (image_prompt + --reference פרוקסי אמיתי)
2. face-fidelity  →  swap פנים מהפרוקסי האמיתי → דיוק פנים מלא (חינם, מקומי)
3. gpt-image-gen  →  מעבר "restyle" (ראה למטה) — מתקן את הפער הסגנוני שה-swap מכניס
```

## שלב 3 — מעבר restyle (חובה בסגנונות מצוירים חזקים)

`inswapper_128` משתיל טלאי פנים **פוטוריאליסטי** (מרקם עור אמיתי) על תמונה מצוירת/סגנונית.
בסגנון fine-line/cel-shading (כמו הסגנון הקומיקסי של v2) זה יוצר "תפר" נראה לעין — הפנים
נראות פתאום "אמיתיות מדי" ביחס לשאר הציור. הפתרון: מעבר נוסף דרך `gpt-image-gen`, עם
תמונת ה-swap כ-`--reference` ופרומפט שמבקש "לצייר מחדש" באותו סגנון תוך שימור הפנים:

```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh \
  "<STYLE_PREFIX>. Redraw this exact image — same people, same faces, same pose, \
same composition, same outfits and background — fully in this illustration style \
with crisp linework and flat cel shading, removing any photorealistic skin texture \
so it matches the rest of the picture. Keep the exact facial structure and likeness, \
just restyle the rendering." \
  "<final_output>.png" \
  --size 1536x1024 \
  --reference "<swapped_image>.png" \
  --model gpt-image-1.5
```

**למה זה עובד:** gpt-image-1.5 ב-edits mode שומר על מבנה/geometry חזק מה-reference (כולל
זהות פנים) אבל "מצייר מחדש" את הטקסטורה לפי הפרומפט — בדיוק ההפך מהבעיה המקורית (טקסט
גובר על רפרנס), וכאן זה יתרון: משתמשים בזה כדי להחזיר את הטקסטורה לסגנון בלי לאבד את הזהות.

**מתי לדלג על שלב 3:** אם ה-`visual_theme` כבר קרוב לפוטוריאליסטי (למשל "vivid digital
painting" עם גוונים חמים), התפר פחות בולט וניתן להסתפק בשלב 2 בלבד. תמיד השווה את שתי
הגרסאות (עם/בלי restyle) לפני שמחליטים.

## התקנה (פעם אחת)

```bash
bash .claude/skills/face-fidelity/scripts/setup.sh
```
מתקין `insightface onnxruntime opencv-python`, מוריד את `buffalo_l` (זיהוי/recognition)
ואת `inswapper_128.onnx` (~530MB, מ-mirror ציבורי) אל `~/.insightface/models/`.

## שימוש

```bash
# בסיסי — מחליף את כל הפנים ב-target עם הפנים מה-source
bash .claude/skills/face-fidelity/scripts/swap.sh "<source_face>.jpg" "<target_scene>.png"
# → שומר ל-<target_scene>_faceswap.png

# עם נתיב פלט מפורש
bash .claude/skills/face-fidelity/scripts/swap.sh "<source>.jpg" "<target>.png" "<output>.png"

# סצנה רב-דמותית — החלף רק פנים מסוימת (לפי אינדקס, 0=ראשונה)
bash .claude/skills/face-fidelity/scripts/swap.sh "<source>.jpg" "<target>.png" --target-index 0

# בחר איזו פנים מה-source להשתמש (ברירת מחדל: הגדולה ביותר)
bash .claude/skills/face-fidelity/scripts/swap.sh "<source>.jpg" "<target>.png" --source-index 1
```

## פרמטרים

- `source` (חובה) — תמונת רפרנס אמיתית עם הפנים להשתלה (לרוב פרוקסי מ-`yuval/reference/.../_proxy/`)
- `target` (חובה) — התמונה שנוצרה, שעליה מחליפים פנים
- `output` (אופציונלי) — נתיב פלט. ברירת מחדל: `<target>_faceswap.png`
- `--source-index N` — איזו פנים בתמונת המקור (ברירת מחדל: הגדולה)
- `--target-index N` — החלף רק את הפנים ה-N ב-target (ברירת מחדל: כולן)
- `--all` — החלף את כל הפנים (זו ברירת המחדל)

## מודלים

- **`buffalo_l`** — זיהוי פנים + face embedding. יורד אוטומטית בהרצה הראשונה.
- **`inswapper_128.onnx`** — מודל ההחלפה עצמו (~530MB). יורד ע"י `setup.sh` מ-mirror ציבורי
  (`huggingface.co/ezioruan/inswapper_128.onnx`), כי ה-repo הרשמי של deepinsight חסום מאחורי אימות.

## מגבלות ידועות

- **סצנות רב-דמותיות:** ברירת המחדל מחליפה את *כל* הפנים עם אותו source. לדמויות שונות —
  הרץ פעמיים עם `--target-index` שונה ו-source שונה.
- **זווית/תאורה קיצונית:** swap עובד הכי טוב על פנים פרונטליות/3⁄4. פרופיל חד עלול להיחלש.
- **גוון עור / תפר סגנוני:** ה-swap מביא טון וטקסטורה ריאליסטיים מהפרוקסי לתוך הציור.
  בסגנונות מצוירים חזקים (קומיקס/cel-shading) זה בולט ומתוקן ע"י **שלב 3 — restyle** למעלה.

## בעלות

הסקיל הוא כלי **refinement של יובל** (מנוע הרינדור). ראובן יכול לקרוא לו בלולאת סצנות
(שלב 3.5 ב-Flow של במבי), אחרי שלב הפריים-ראשון.
