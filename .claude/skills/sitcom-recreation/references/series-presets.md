# פריסטים של לוק — `look.prompt_string`

כל פריסט הוא **מחרוזת אחת** שנכנסת מילה במילה לכל image_prompt ולכל video_prompt בפרויקט.
בחר אחת, שנה אותה פעם אחת אם צריך, ואז **אל תיגע בה יותר**.

## 1. 90s multi-cam studio sitcom (Friends / Seinfeld / Frasier)

> Shot on 35mm film with a four-camera studio setup in front of a live audience, warm high-key
> lighting with soft fill and almost no shadows, medium focal length lenses, rich saturated palette
> of warm oranges, olive greens and browns, practical table lamps and neon signs in frame, fine
> 35mm grain, locked-off camera, proscenium apartment set with the fourth wall open to the audience.

הפניה: Friends צולמה על 35mm בפנאוויז'ן, ארבע מצלמות מול קהל חי, גריד תאורת סטודיו, עדשות
באורך מוקד בינוני, ופלטה חמה ואדמתית ב-Central Perk.

## 2. Mockumentary single-cam (The Office / Modern Family / Parks & Rec)

> Shot documentary style on a single handheld camera, slightly desaturated fluorescent office
> lighting, long lens snap-zooms and reframes as if the operator is catching the moment, shallow
> depth of field, occasional glance directly into the lens, flat digital video look, no laugh track.

**שים לב:** כאן `[Shake]` ו-`[Zoom in]` הם *הסגנון*, לא באג. אין laugh track — התחליף הוא
ה-talking-head והמבט למצלמה.

## 3. 80s tape-look sitcom (Cheers / Golden Girls)

> Shot on 1980s videotape with a three-camera studio setup, flat bright high-key lighting,
> slightly soft video texture with mild interlacing and blooming highlights, muted mauve and
> brass color palette, heavy wooden set dressing, locked camera, live studio audience.

לוק 4:3 — צור ב-16:9 ועשה pillarbox ב-`video-editor`.

## 4. Modern streaming single-cam comedy

> Shot on digital cinema cameras with a single-camera setup, naturalistic motivated lighting with
> visible practicals and window light, shallow depth of field, cool contemporary palette, subtle
> handheld drift, cinematic contrast, no laugh track, sparse indie music cues.

## 5. Animated primetime sitcom

> 2D animation in the style of a primetime animated sitcom, thick clean outlines, flat cel shading,
> saturated primary palette, simplified backgrounds with strong perspective, expressive squash-and-
> stretch character acting, locked-off "camera" with occasional whip pans.

---

## איך לגזור פריסט מסדרה שהמשתמש נקב בשמה

אל תכתוב את שם הסדרה בפרומפט. חלץ ממנה **חמישה משתנים** ונסח אותם מחדש:

1. **פורמט** — multi-cam מול single-cam מול mockumentary מול אנימציה.
2. **מדיום** — 35mm film / videotape / digital / 2D.
3. **תאורה** — high-key שטוח מול motivated נטורליסטי.
4. **פלטה** — 3–4 צבעים ספציפיים בשם.
5. **התנהגות מצלמה** — נעולה / handheld / snap-zooms.

זה מייצר לוק שנקרא כמו הסדרה בלי להישען על שמות מוגנים, ובלי שהמודל יסרב.
