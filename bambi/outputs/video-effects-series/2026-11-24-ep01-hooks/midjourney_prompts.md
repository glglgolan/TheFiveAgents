# פרומפטים ל-Midjourney — פרק 1 ("3 סוגי hooks")

16 תמונות. סצנות 3–4 (ציר הזמן / הצגה עצמית) הן שכבת Remotion ולכן **בלי תמונה**.
שמירה: כל תמונה נשמרת בשם `scenes/sNN.png` באותה תיקייה (`/home/user/TheFiveAgents/bambi/outputs/video-effects-series/2026-11-24-ep01-hooks/scenes/`), כדי שה-widget `storyboard_grid.html` יזהה אותה אחרי ↻ רענן.

## כללים לכל הפרומפטים
- יחס: `--ar 9:16` בכל פרומפט.
- בלי טקסט בתמונה, בלי אנשים ובלי פנים (שלטי ניאון הם סמלים בלבד).
- שוליים בטוחים: 10% למעלה ו-25% למטה ריקים; הנושא באמצע.
- **לוק קבוע (visual_theme)** — כל פרומפט מסתיים ב-`{LOOK}`:

```
LOOK = deep navy and warm amber palette with cream highlights, soft key light with warm amber rim light, clean cinematic 35mm full-frame look, fine subtle grain, vertical composition, subject centered with empty space at top and bottom, no text, no letters, no people, no face
```

- **רפרנס עקביות (סגנון/אובייקט):** לבדוק בתיעוד המעודכן של Midjourney את הדגל המתאים (רפרנס סגנון/אובייקט).
  - מקום להוסיף: `REF_FLAG = [____________]`
  - עוגן עדשה: `LENS_REF = [____________]` (סצנות 1, 13, 16)
  - עוגן קופסה: `BOX_REF = [____________]` (סצנות 9, 10, 16)
  - עוגן סגנון כללי (אחרי שתבחרי תמונה ראשונה טובה): `STYLE_REF = [____________]`

## סדר יצירה מומלץ + שלושה ניסויים ראשונים
1. **ניסוי א' — זוג stitched 1+2** (עדשה ← מנהרה/גג). קודם 1, אחר כך 2 לפי הכללים בהמשך.
2. **ניסוי ב' — קופסה שחורה:** קודם עוגן `bambi/cast/video-effects-series/black_box_ep01.png` (פרומפט למטה), ואחריו סצנה 9 (עם `BOX_REF` = העוגן). אחר כך 10 ו-16.
3. **ניסוי ג' — זוג 11+12** (טבעת ← שמש).
4. אחרי שלושת הניסויים: 5, 6, 7, 8, 13, 14, 15, 17, 18.

---

## עוגני עזר (לא סצנות)

### עוגן קופסה — `bambi/cast/video-effects-series/black_box_ep01.png`
```
a small matte-black cube box with a hinged lid and a tiny keyhole glowing warm amber, no markings, standing on a dark wooden table, dark minimal room, amber light leaking from the keyhole, product photo, centered, {LOOK} --ar 9:16 BOX_REF/REF_FLAG
```
בדיקה: ☐ קובייה מט שחורה, חור מנעול ענבר ☐ בלי כיתוב ☐ 9:16 ☐ מרכזי עם שוליים

### עוגן עדשה — `bambi/cast/video-effects-series/lens_anchor_ep01.png` (אופציונלי, מומלץ)
```
a large round camera lens glass, deep black circular glass with subtle amber reflections and concentric rings, perfectly centered, dark navy background, macro, {LOOK} --ar 9:16
```
בדיקה: ☐ עיגול ממורכז ☐ בלי כיתוב ☐ 9:16

---

## הזוג stitched א': סצנות 1 ← 2 (עדשה ← מנהרה)
**חוק התאמה:** הפריים האחרון של סצנה 1 (בווידאו) הוא עיגול שחור ממורכז, והפריים הראשון של סצנה 2 הוא פתח מנהרה עגול. שניהם חייבים לחלוק עיגול באותו **מרכז (מרכז הפריים), אותו קוטר יחסי (~70% מרוחב הפריים) ואותו מבט ישר בלי הטיה**. `sNN.png` של סצנה 2 משמש כ-`end_reference` של סצנה 1.
**איך להבטיח:** ליצור את סצנה 2 קודם או בו-זמנית, לקבוע את גודל העיגול בה, ואז בסצנה 1 לבקש עדשה שהזכוכית שלה ממלאת בדיוק את אותו קוטר באותו מרכז. אם העיגול נוטה או לא ממורכז, להפיק מחדש או לחתוך/ליישר ידנית.
**בדיקה לפני אישור:** ☐ מרכז העיגול זהה בשתי התמונות (הנחה שכבות זו על זו) ☐ הקוטר זהה בקירוב ☐ שניהם ישרים מול המצלמה ☐ בלי טקסט ופנים ☐ 9:16

### סצנה 1 — `scenes/s01.png`
```
a smartphone standing on a small tripod in a dark navy studio, its round camera lens large and dead-center, a dark circular glass opening occupying about 70 percent of the frame width, perfectly frontal view, amber glint on the glass, {LOOK} --ar 9:16 LENS_REF
```
☐ נקי מטקסט/פנים ☐ 9:16 ☐ עדשה ממורכזת ~70% ☐ תואם לעיגול בסצנה 2

### סצנה 2 — `scenes/s02.png`
```
view from inside a dark round concrete tunnel looking out, a perfectly centered circle of golden-hour light about 70 percent of the frame width showing an empty rooftop and a soft city skyline at sunset, black circular frame edge, perfectly frontal and symmetrical, {LOOK} --ar 9:16
```
☐ נקי מטקסט/פנים ☐ 9:16 ☐ עיגול ממורכז ~70% ☐ תואם לעדשה בסצנה 1 ☐ גג ריק

---

## הזוג stitched ב': סצנות 11 ← 12 (טבעת ← שמש)
**חוק התאמה:** הפריים האחרון של סצנה 11 הוא דיסקית שמש עגולה ממורכזת בגודל הטבעת, והפריים הראשון של סצנה 12 הוא אותה דיסקית. **אותו מרכז, אותו קוטר, אותו גובה אופק**. `s12.png` משמש כ-`end_reference` של סצנה 11.
**איך להבטיח:** לקבוע קודם את הקוטר והמיקום של השמש בסצנה 12 (שמש ממורכזת מעל האופק), ואז בסצנה 11 לבקש טבעת שהחור הפנימי שלה בגודל זהה ובאותו מרכז, ושדרכה נראה חוף עם אותה שמש. אפשר להשתמש בתמונה 12 כרפרנס לסצנה 11 לפי הדגל שתמצאי בתיעוד.
**בדיקה לפני אישור:** ☐ מרכז הטבעת = מרכז השמש ☐ קוטר זהה בקירוב ☐ אותה זווית מצלמה ישרה ☐ בלי טקסט ופנים ☐ 9:16

### סצנה 11 — `scenes/s11.png`
```
a bright minimal cream studio, a large round ring frame standing on a base, perfectly centered and frontal, ring opening about 60 percent of the frame width, through the ring a small sunset beach with a round sun is visible, {LOOK} --ar 9:16 REF_FLAG
```
☐ נקי מטקסט/פנים ☐ 9:16 ☐ טבעת ממורכזת ☐ תואמת לשמש בסצנה 12

### סצנה 12 — `scenes/s12.png`
```
wide empty sunset beach, a large round sun disc exactly centered above the horizon at the same size as a ring opening, about 60 percent of the frame width, gentle waves, wet sand reflecting amber light, perfectly frontal, {LOOK} --ar 9:16
```
☐ נקי מטקסט/פנים ☐ 9:16 ☐ שמש ממורכזת ☐ תואמת לטבעת בסצנה 11

---

## שאר הסצנות

### סצנה 5 — `scenes/s05.png`
```
a smartphone hovering at eye level on a sunset rooftop, translucent social-feed cards frozen mid-air around it, golden hour, {LOOK} --ar 9:16
```
☐ נקי מטקסט/פנים (כרטיסים ריקים, בלי כיתוב) ☐ 9:16 ☐ שוליים

### סצנה 6 — `scenes/s06.png` (מקום ל-HOOK)
```
an empty golden-hour rooftop seen from a low angle with a soft city skyline, large open empty space in the center of the frame, nothing floating there, {LOOK} --ar 9:16
```
☐ אמצע הפריים פנוי לשכבת HOOK ☐ בלי מילים/אותיות ☐ 9:16 ☐ בלי אנשים

### סצנה 7 — `scenes/s07.png`
```
a glowing amber neon sign shaped like an open eye on a dark navy studio wall, soft bloom, symbol only, {LOOK} --ar 9:16
```
☐ סמל בלבד, בלי אותיות ☐ 9:16 ☐ ממורכז

### סצנה 8 — `scenes/s08.png`
```
an ordinary warm empty living room, a glass of water on a coffee table with a stream of water rising straight up from it to the ceiling, surreal inverted gravity, low angle, {LOOK} --ar 9:16
```
☐ זרם מים עולה למעלה ברור ☐ בלי אנשים ☐ בלי טקסט ☐ 9:16

### סצנה 9 — `scenes/s09.png`
```
dark minimal room, a small matte-black box on a wooden table with amber light leaking from its keyhole, slight dutch angle, {LOOK} --ar 9:16 BOX_REF
```
☐ אותה קופסה כמו העוגן ☐ בלי כיתוב ☐ 9:16

### סצנה 10 — `scenes/s10.png`
```
close-up of the small matte-black box with its lid cracked open a few millimeters, a thin blade of amber light slicing across the dark wooden table, {LOOK} --ar 9:16 BOX_REF
```
☐ אותה קופסה (חור מנעול, ציר) ☐ סדק דק ☐ 9:16 ☐ בלי כיתוב

### סצנה 13 — `scenes/s13.png`
```
a smartphone on a small tripod in a dark navy studio, round camera lens centered, same look as the opening shot, amber glint on the glass, {LOOK} --ar 9:16 LENS_REF
```
☐ אותו סטודיו ואותה עדשה כמו סצנה 1 ☐ בלי פנים ☐ 9:16

### סצנה 14 — `scenes/s14.png`
```
a dark symmetrical empty hall with three glowing neon archways side by side: an eye symbol, a question-mark symbol, a ring symbol, symbols only, polished floor reflections, {LOOK} --ar 9:16
```
☐ שלושה שערים, סמלים בלבד ☐ בלי מילים ☐ 9:16 ☐ סימטרי

### סצנה 15 — `scenes/s15.png`
```
three neon archways in a dark hall (eye, question mark, ring symbols, symbols only), the left archway lit bright amber and the others dim, {LOOK} --ar 9:16
```
☐ אותם שערים כמו 14 ☐ שער שמאלי דלוק ☐ בלי טקסט ☐ 9:16

### סצנה 16 — `scenes/s16.png`
```
dark room, the small matte-black box wide open on a wooden table, a glowing round camera lens floating out of it on a beam of amber light, floating dust, low angle, {LOOK} --ar 9:16 BOX_REF LENS_REF
```
☐ אותה קופסה ואותה עדשה כמו העוגנים ☐ בלי כיתוב ☐ 9:16

### סצנה 17 — `scenes/s17.png` (מקום ל-CRUMPLE)
```
a blank sheet of white paper floating upright in a dark navy studio facing camera, completely blank, nothing written, large empty space around it, {LOOK} --ar 9:16
```
☐ דף ריק לגמרי (המילה תתווסף כשכבה) ☐ בלי כתב ☐ 9:16 ☐ בלי ידיים

### סצנה 18 — `scenes/s18.png`
```
a vintage amber recording studio lamp glowing on a dark navy wall, soft bloom, no text on the lamp, {LOOK} --ar 9:16
```
☐ בלי כיתוב על המנורה ☐ 9:16 ☐ שוליים תחתונים ריקים ללוגו

---

## הערות
- ל-Midjourney קשה עם דיוק גיאומטרי. בזוגות stitched כדאי ליצור כמה וריאציות ולבחור את זו שהעיגול בה ממורכז ביותר.
- אחרי כל שמירה: ↻ רענן ב-`storyboard_grid.html` כדי לוודא שהתמונה זוהתה.
