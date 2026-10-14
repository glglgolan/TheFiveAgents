# MiniMax H3 (Hailuo 3.0) — prompt spec

מאומת מול תיעוד ומדריכי H3, ספטמבר 2026. OpenRouter ID: `minimax/hailuo-3` · $0.13/sec.

## יכולות ומגבלות

| | |
|---|---|
| משך | 5–15 שניות לג'וב, 24fps |
| רזולוציה | עד 1440p בצלע הקצרה |
| Aspect ratios (נייטיב) | 21:9, 16:9, 4:3, 1:1, 3:4, 9:16 |
| Aspect ratios (דרך `openrouter-video-gen`) | **16:9, 9:16, 1:1 בלבד** |
| מצבים | text-to-video · first+last frame · omni-reference |
| רפרנסים (נייטיב) | עד 9 תמונות / 3 קליפים / 3 קבצי אודיו, מקסימום 12 קבצים |
| רפרנסים (דרך המעטפת שלנו) | **תמונה אחת** (first frame) |
| אודיו | סטריאו נייטיב — דיאלוג עם lip-sync, אפקטים, אמביינס, מוזיקה |
| אורך prompt | **2,000 תווים** ל-API |

⚠️ image-to-video ו-reference-to-video **הדדית בלעדיים** בנייטיב — אין לערבב first/last frame
עם reference roles באותה בקשה. המעטפת שלנו שולחת first frame בלבד, אז זה לא רלוונטי בפועל.

## תגיות מצלמה (bracketed)

15 פקודות מתועדות. **מקסימום 3 בפרומפט אחד**, ועדיף לבדוק כל אחת לחוד לפני שמשלבים.

| משפחה | תגיות | הערה לסיטקום |
|---|---|---|
| תזוזה אופקית | `[Truck left]` `[Truck right]` | נדיר. פרלקסה מסגירה "AI" |
| סיבוב אופקי | `[Pan left]` `[Pan right]` | רק למעבר דמות בין אזורי הסט |
| עומק | `[Push in]` `[Pull out]` | `[Push in]` איטי על הפאנץ' — הכלי הכי שימושי |
| תזוזה אנכית | `[Pedestal up]` `[Pedestal down]` | לא |
| סיבוב אנכי | `[Tilt up]` `[Tilt down]` | לא |
| אופטי | `[Zoom in]` `[Zoom out]` | חלופה זולה ל-push in |
| מיוחד | `[Shake]` `[Tracking shot]` `[Static shot]` | **`[Static shot]` = ברירת המחדל של multi-cam** |

## מבנה הפרומפט (six-part pass)

1. **Context** — הרכב פתיחה, סט, מי בפריים ואיפה. תואם לפריים הרפרנס.
2. **Timeline** — פעולות לפי סדר עם טווחי שניות, **כולל מצב הסיום**.
3. **Camera** — תגית + גודל שוט + מהירות, רק כשזה משנה.
4. **Sound** — הפרד: דיאלוג · סאונד פיזי · אמביינס · מוזיקה.
5. **Constraints** — מה **חייב** להישאר יציב (פנים, שיער, תלבושת, סט, מיקום מצלמה).
6. **QA** — מה תבדוק לפני קבלה (זהות, lip-sync, מיקום הצחוק).

## תחביר דיאלוג

- מזהה יציב לכל דובר (אותו שם בכל השוטים).
- **המילים המדויקות בתוך מרכאות**; אופן המסירה **מחוץ** למרכאות.
- **דובר אחד בכל פעם** — זה התנאי ל-lip-sync טוב.
- טווחי זמן משפרים תזמון: `0-4s: A speaks. 4-8s: B answers.`

```
Dialogue (one speaker at a time):
  JOEY-ARCHETYPE, warm and clueless: "How you doin'?"
  MONICA-ARCHETYPE, flat: "No."
```

## תחביר אודיו לסיטקום

```
Sound: clear close-mic dialogue; room tone of a small New York apartment;
a warm studio audience laugh beginning right after the last line; no music.
```

- הצחוק **אחרי** הרפליקה, לא מתחתיה.
- `no music` מפורש — אחרת H3 נוטה להוסיף מצע מוזיקלי שהורס את הפורמט.
- אמביינס ספציפי לסט (מכונת אספרסו, פעמון דלת, תנועה ברקע) מוסיף המון אמינות.

## פרמטרים

- `prompt_optimizer: false` כשעושים A/B מבוקר (לא נחשף במעטפת שלנו).
- reference influence ~65–75% הוא הטווח שמדווח כמיטבי בקהילה; single subject-reference
  מדווח סביב ~95% עקביות דמות.

## מקורות

- [MiniMax H3 full specs and input limits — Morphic](https://morphic.com/resources/models/minimax-h3)
- [Hailuo Video Prompt Guide: Camera Moves](https://minimax-ai.chat/guide/hailuo-video-prompts/)
- [MiniMax H3 Character Consistency — WaveSpeed](https://wavespeed.ai/blog/minimax-h3/minimax-h3-character-consistency/)
- [What Is MiniMax H3 (Hailuo 3.0)? — Hugging Face](https://huggingface.co/blog/ResterChed/minimax-h3-hailuo-3-0)
- [MiniMax H3 Prompt Guide — HackerNoon](https://hackernoon.com/minimax-h3-prompt-guide-how-to-write-better-hailuo-30-video-prompts)
