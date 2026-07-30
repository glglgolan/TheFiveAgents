# Keyframe Prompts v2 — Raz Bar Mitzva Film

## שיטה: Kling First-Frame → Last-Frame Interpolation (`tail_image`)

**Method:** `first_image` + `tail_image` · **Model:** `kling-video-v3_0` · **Res:** 1080p · **AR:** 16:9 · **Audio:** off · **Duration:** 3–15s (Kling caps at 15s).

Kling מייצר קליפ שמבצע אינטרפולציה חלקה מ-Frame A אל Frame B. לכן **A ו-B חייבים להיות אותה סצנה / דמות / setting / סגנון בדיוק** — רק ה-pose / action / framing / environment reveal משתנה. פריימים שונים מדי = morph שבור.

**עקביות פנים:** גם Frame A וגם Frame B משתמשים ב**אותו פרוקסי אמיתי** (הרפרנס המצוין בכל סצנה). כל פרומפט Frame B נכתב ב-v2 style זהה: מתחיל ב-global style prefix המדויק, שומר את תיאורי הדמויות verbatim, ומסתיים ב-"Keep the exact face, hair and appearance from the reference image."

**Global style prefix (verbatim):**
```
clean modern comic-book / graphic-novel illustration style, crisp precise linework, smooth cel shading, natural realistic proportions, warm tanned natural skin tones, detailed modern casual clothing, bright even lighting, vibrant true-to-life colors, high detail — NOT painterly, NO visible brushwork, NOT photorealistic
```

**סצנות המכוסות כאן:** 22, 24, 25, 26, 27. שאר הסצנות נשארות single-image i2v רגיל.

---

## Scene 22 — חלום — ספורטאי מקצועי (כדורגל → כדורסל)

**A→B beat:** הקליפ נפתח על רז בועט כדורגל בעוצמה בתוך אצטדיון זוהר — ומסתיים כשאותו רז מזנק באוויר לניתור סל (layup), אותו אצטדיון, אותה תאורה דרמטית. המורף = בעיטת כדורגל → זינוק כדורסל.

**Frame A (first_image):** השתמש בפרומפט הספרייה של סצנה 22 — **tweak קטן:** בגרסה הנוכחית שני המהלכים (בעיטה + הד כדורסל) כבר באותו פריים; כדי לתת ל-B לאן ללכת, מקד את Frame A ב**בעיטת הכדורגל בלבד** (הסר את "dreamlike echo of him rises for a basketball layup on the other"), כך שהמעבר לכדורסל יתרחש דרך האינטרפולציה.

**Frame B (tail_image) — NEW GPT prompt:**
```
clean modern comic-book / graphic-novel illustration style, crisp precise linework, smooth cel shading, natural realistic proportions, warm tanned natural skin tones, detailed modern casual clothing, bright even lighting, vibrant true-to-life colors, high detail — NOT painterly, NO visible brushwork, NOT photorealistic; Dream sequence in the same packed glowing stadium, same dramatic uplifting stadium lights and dreamy glow, roaring crowd as soft bokeh: Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, warm deep brown eyes, now mid-air at the peak of a powerful basketball layup — body stretched fully upward, one arm extended high releasing the ball toward an unseen hoop, triumphant focused expression; the soccer ball from before now rolling on the pitch below him, stadium lights blooming brighter around his rising silhouette. Keep the exact face, hair and appearance from the reference image.
```

**Revised transition video prompt:**
```
The teen strikes the soccer ball with power at ground level, then the motion carries him upward — his body rises and stretches into a soaring basketball layup at the peak of a jump, one arm extending high to release the ball. Stadium lights bloom brighter as he ascends, the crowd a glowing bokeh blur. One dream flowing into the next. Uplifting, cinematic, hopeful.
```

**Reference proxy:** `yuval/reference/Raz/_proxy/2026-teen-book-raz-10.jpg`
**Recommended duration:** storyboard = 16s → **חורג ב-1s מהתקרה.** קצר ל-**15s** בקליפ יחיד (המורף רציף, אין צורך לפצל). אם רוצים נשימה לכל beat — פצל ל-2 סגמנטים 8s (בעיטה, זינוק) עם פריים אמצע משותף.

---

## Scene 24 — חלום — גלישה (drop-in → carve)

**A→B beat:** הקליפ נפתח על רז עומד על הגל בתחילת הגלישה (drop-in) — ומסתיים כשהוא חורש חזק את פני הגל, זרועות פרושות, מניפת רסס ענקית מתפוצצת באור. המורף = drop-in שקט → carve נמרץ עם רסס.

**Frame A (first_image):** פרומפט הספרייה של סצנה 24 — **tweak קטן:** הגרסה הנוכחית כבר מראה אותו רוכב עם grid מלא ורסס. מקד את Frame A ב**רגע ה-drop-in** (עומד זקוף בראש הגל, הרגע קם על הבורד, מעט רסס), כדי שה-carve והרסס המלא יהיו יעד ב-B.

**Frame B (tail_image) — NEW GPT prompt:**
```
clean modern comic-book / graphic-novel illustration style, crisp precise linework, smooth cel shading, natural realistic proportions, warm tanned natural skin tones, detailed modern casual clothing, bright even lighting, vibrant true-to-life colors, high detail — NOT painterly, NO visible brushwork, NOT photorealistic; Dream sequence on the same clean bright turquoise wave in a bright sunlit sea: Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, warm deep brown eyes, now carving hard across the glassy face of the wave — surfboard angled into a deep confident bottom turn, knees bent low, both arms out for balance, a huge fan of sparkling sea spray exploding off the tail into the sunlight, thrilled open-mouthed grin, a diving mask and snorkel hanging at his neck. Keep the exact face, hair and appearance from the reference image.
```

**Revised transition video prompt:**
```
The teen drops in at the top of the turquoise wave, then drives down and carves hard across its glassy face — the board angling into a deep bottom turn, his body leaning low, arms out, a huge fan of sea spray exploding off the tail and catching the sunlight like glitter. Thrilling, clean, joyful — riding the dream with total control.
```

**Reference proxy:** `yuval/reference/Raz/_proxy/2026-teen-book-raz-10.jpg`
**Recommended duration:** **14s** (single clip, בתוך התקרה). הצלילה מתחת למים שבפרומפט הישן = setting שונה מדי לאותו morph — השאר אותה כ-i2v נפרד קצר אם רוצים, לא כ-tail של הגלישה.

---

## Scene 25 — חלומות — ברבר → פורטל ניו זילנד

**A→B beat:** הקליפ נפתח על רז מספר חבר בחדר עם קריצה בטוחה, פורטל זוהר רק מתחיל לבצבץ מאחור — ומסתיים כשהפורטל נפער לגמרי אל הרי ניו זילנד ורז כבר צועד פנימה, רגל אחת בעולם השני. המורף = חדר הספרות → צעד דרך הפורטל.

**Frame A (first_image):** פרומפט הספרייה של סצנה 25 — **tweak קטן:** הגרסה הנוכחית כבר מראה פורטל פתוח ורגל בתוכו. מקד את Frame A ב**רגע התספורת** (מספר את החבר, קריצה, cape) עם **הפורטל רק כסדק זוהר קלוש מאחור** — כדי שהפתיחה המלאה והצעד יהיו יעד ב-B.

**Frame B (tail_image) — NEW GPT prompt:**
```
clean modern comic-book / graphic-novel illustration style, crisp precise linework, smooth cel shading, natural realistic proportions, warm tanned natural skin tones, detailed modern casual clothing, bright even lighting, vibrant true-to-life colors, high detail — NOT painterly, NO visible brushwork, NOT photorealistic; Playful dream scene in the same bright room: behind Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, warm deep brown eyes, a dreamlike glowing portal is now fully torn open revealing New Zealand's green mountains and fjords in bright daylight; he is mid-step, one foot already through the portal into the New Zealand landscape, barber cape flaring behind him, clippers still in one hand, grinning back over his shoulder at the camera, teleportation sparkles swirling around the portal's edge; his freshly-cut friend watching in amazement. Keep the exact face, hair and appearance from the reference image.
```

**Revised transition video prompt:**
```
The teen finishes a confident barber flourish with a wink, and the faint glow behind him tears open into a full dreamlike portal revealing New Zealand's green fjords. He turns and steps through — one foot into the far landscape, cape flaring, teleportation sparkles swirling — grinning back over his shoulder as his amazed friend watches. Fun, imaginative, limitless.
```

**Reference proxy:** `yuval/reference/Raz/_proxy/2026-teen-book-raz-10.jpg`
**Recommended duration:** storyboard = 18s → **חורג ב-3s.** שתי אפשרויות: (א) קליפ יחיד מקוצר ל-**15s**; (ב) פיצול ל-2 סגמנטים ~9s — seg1: ברבר → פורטל נפער, seg2: פורטל → צעד דרכו לניו זילנד (הפריים האמצעי = פורטל פתוח, רז עוד בחדר). **המלצה:** פיצול 2×9s — מכבד את קצב ה-whip-pan השובב ונותן משקל לרגע ה-reveal.

---

## Scene 26 — רגעים שקטים — ספר / מוזיקה / חברים / פלייסטיישן (chain של 4)

**המצב:** 4 sub-images קיימות (s26a ספר, s26b מוזיקה, s26c חברים, s26d פלייסטיישן), 26s, cross-dissolves. אין להמציא end frames חדשים — 4 התמונות הקיימות הן ה-chain.

**המלצה: לא להשתמש ב-keyframe interpolation בין ה-4.** ארבע התמונות הן **settings שונים לגמרי** (פינת קריאה / מיטה עם אוזניות / חוץ עם חברים / ספה מול פלייסטיישן). tail-pair בין שתי סצנות שונות כאלה יפיק **morph סוריאליסטי שבור**, לא cross-dissolve נקי — זה מפר ישירות את אילוץ "אותה סצנה".

**המלצה מעשית (מועדפת):** צור **4 מיקרו-קליפים עצמאיים** של i2v (first_image בלבד, תנועת סביבה עדינה בכל אחד, ~6–7s), ובצע את ה-cross-dissolves **בעריכה (post)**. כל מיקרו-קליפ שומר על ה-setting שלו נקי; ה-dissolve בין הקטעים הוא אפקט עריכה, בדיוק כפי שה-storyboard מתאר. תנועות מוצעות לכל אחד:
- **s26a ספר:** wisps חלומיים עולים מהדפים, דף מתהפך לאט.
- **s26b מוזיקה:** גלי קול וזוהרים ותווים צפים מתנועעים סביבו, ראש נע קלות לקצב.
- **s26c חברים:** שלושתם צוחקים, כתפיים נעות, אור זהוב מרצד.
- **s26d פלייסטיישן:** זוהר ה-TV מרצד, גיבור-על מתנדנד בין הבניינים, רז נשען קדימה.

**חלופה (רק אם רוצים מורף חלומי מכוון):** נתיב `v3_0_omni` מרובה-תמונות (4 כ-`image_1..4`) — אך זהו generation יחיד מונחה ע"י 4 רפרנסים, **לא** רצף dissolve; לא מתאים למטרה כאן. **אל תשתמש ב-3 tail-pairs (a→b, b→c, c→d)** — ייצור מורפים שבורים.

**Reference proxy (לכל 4):** `yuval/reference/Raz/_proxy/2026-teen-book-raz-22.jpg` (משקפיים)
**Recommended duration:** 4×~6.5s = ~26s, ה-dissolves נבלעים בעריכה. אין tail frames בסצנה זו.

---

## Scene 27 — סיום — משפחה + reveal זיכרון הפעוט (40s, מפוצל ל-3 סגמנטים)

**משך storyboard = 40s → חורג בהרבה מ-15s.** פצל ל-**3 סגמנטים keyframe** של ~13–14s, רצף רציף (הפריים האחרון של כל סגמנט = הפריים הראשון של הבא). ה-A→B המרכזי הוא **fade-in של זיכרון הפעוט** (סגמנט 2).

**Reference proxy (לכל הסגמנטים):** `yuval/reference/Raz/_proxy/2026-teen-book-raz-10.jpg`

### סגמנט 1 (~13s) — המשפחה מתאספת
**A→B beat:** נפתח על רז עומד גאה בחולצה לבנה בזהב-ערב, המשפחה מתחילה להיכנס מהצדדים — מסתיים כשכולם מכונסים סביבו, זרועות זה סביב זה, השמיים עדיין נקיים.

**Frame A (first_image):** גרסת tweak של פרומפט הספרייה — רז עומד גאה, המשפחה **רק מתחילה להתאסף** מהצדדים, **ללא** זיכרון הפעוט (שמיים נקיים).

**Frame B (tail_image) — NEW GPT prompt:**
```
clean modern comic-book / graphic-novel illustration style, crisp precise linework, smooth cel shading, natural realistic proportions, warm tanned natural skin tones, detailed modern casual clothing, bright even lighting, vibrant true-to-life colors, high detail — NOT painterly, NO visible brushwork, NOT photorealistic; Emotional finale at golden hour, same warm celebration setting: Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, warm deep brown eyes, standing proud in a festive white shirt with his whole family now gathered warmly close around him, arms around each other — mom Adi, dark wavy hair, warm big smile, dark eyes; dad Amos, athletic build, short dark hair, big white smile, tanned skin; brothers Yair and Tomer; and Taya, an Australian Cattle Dog / blue heeler with a grey-and-white speckled mottled coat, black pointed ears, tan facial markings sitting at his feet; the warm golden sky behind them still clear and open, gentle lens flare. Keep the exact face, hair and appearance from the reference image.
```
**Video prompt:** `The family steps in from both sides and gathers warmly around the proud teen, arms sliding around each other, the dog settling at his feet — smiles growing, golden light glowing. A family closing in with love.`

### סגמנט 2 (~14s) — reveal הזיכרון (ה-A→B המרכזי)
**A→B beat:** נפתח על המשפחה מכונסת, שמיים נקיים מאחור — מסתיים כשזיכרון זוהר רך של הפעוט הישן מחבק מכונית-צעצוע נדלק אל תוך השמיים הזהובים מאחור.

**Frame A (first_image):** = Frame B של סגמנט 1 (משפחה מכונסת, שמיים נקיים).

**Frame B (tail_image) — NEW GPT prompt:**
```
clean modern comic-book / graphic-novel illustration style, crisp precise linework, smooth cel shading, natural realistic proportions, warm tanned natural skin tones, detailed modern casual clothing, bright even lighting, vibrant true-to-life colors, high detail — NOT painterly, NO visible brushwork, NOT photorealistic; Emotional finale at golden hour, same warm celebration setting: Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, warm deep brown eyes, standing proud in a festive white shirt, his family gathered warmly around him — mom Adi, dark wavy hair, warm big smile, dark eyes; dad Amos, athletic build, short dark hair, big white smile, tanned skin; brothers Yair and Tomer; and Taya, an Australian Cattle Dog / blue heeler with a grey-and-white speckled mottled coat, black pointed ears, tan facial markings at his feet; now high in the warm glowing sky behind them a soft luminous memory fades into view — a toddler with soft dark brown curly hair peacefully asleep hugging a little toy car — glowing gently like a warm dream, gentle lens flare. Keep the exact face, hair and appearance from the reference image.
```
**Video prompt:** `The family holds together at golden hour as, high in the warm sky behind them, a soft glowing memory gently fades into view — a sleeping toddler hugging a toy car, luminous and dreamlike. Still, tender, deeply emotional — the child he was, watching over the boy he has become.`

### סגמנט 3 (~13s) — crane pull-back + צחוק
**A→B beat:** נפתח על המשפחה עם הזיכרון גלוי — מסתיים ב-crane רחב אחורה, המשפחה קטנה וחמה במסגרת, הזיכרון נמס אל האור הזהוב, כולם צוחקים.

**Frame A (first_image):** = Frame B של סגמנט 2 (משפחה + זיכרון גלוי).

**Frame B (tail_image) — NEW GPT prompt:**
```
clean modern comic-book / graphic-novel illustration style, crisp precise linework, smooth cel shading, natural realistic proportions, warm tanned natural skin tones, detailed modern casual clothing, bright even lighting, vibrant true-to-life colors, high detail — NOT painterly, NO visible brushwork, NOT photorealistic; Wide pulled-back crane view of the same golden-hour celebration: the whole family small and warm in the lower frame gathered around Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, warm deep brown eyes, in a festive white shirt — mom Adi, dark wavy hair, warm big smile, dark eyes; dad Amos, athletic build, short dark hair, big white smile, tanned skin; brothers Yair and Tomer; Taya, an Australian Cattle Dog / blue heeler with a grey-and-white speckled mottled coat, black pointed ears, tan facial markings at his feet; the glowing memory of the sleeping toddler with the toy car dissolving softly into the vast warm golden sky above them, expansive lens flare, everyone caught mid-laugh. Keep the exact face, hair and appearance from the reference image.
```
**Video prompt:** `The camera cranes slowly up and back, the family growing smaller and warmer in the frame as they laugh together; above them the glowing toddler memory dissolves softly into the vast golden sky. Proud, expansive, full of love — the next chapter begins.`

**Recommended durations:** seg1 ~13s · seg2 ~14s · seg3 ~13s = 40s total, כל סגמנט ≤15s.

---

## סיכום החלטות keyframe
| סצנה | A→B | פיצול / משך |
|------|-----|-------------|
| 22 | בעיטת כדורגל → זינוק כדורסל layup | 15s single (חתוך מ-16) או 2×8s |
| 24 | drop-in → carve עם רסס | 14s single |
| 25 | ברבר → צעד דרך פורטל ניו זילנד | 2×9s (מומלץ) או 15s single |
| 26 | — (אין tail; 4 i2v נפרדים + dissolve בעריכה) | 4×~6.5s |
| 27 | reveal זיכרון הפעוט | 3 סגמנטים ~13/14/13s |
