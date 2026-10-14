# לוג סטוריבורדים — במבי

---

**2026-06-27** · פרויקט: **Raz Bar Mitzva** · סטוריבורד בר מצווה (רז פסדר)
- 24 סצנות, 7 מערכות (acts) · סכום משך: 368s (~6:08, בטווח 6–8 דק') · AR 16:9
- 8 דמויות cast: `raz_toddler` (✓ מוכן) + 7 חסרים (`raz_child`, `raz_teen`, `mom_adi`, `dad_amos`, `yair`, `tomer`, `taya`)
- לוק: איור מודרני חצי-קריקטורי, פלטה בהירה ושמחה (תכלת/מנטה/קורל)
- מוטיב ציר: "הדרך היחידה להפסיד זה לוותר"
- קבצים: `bambi/outputs/Raz Bar Mitzva/2026-06-27-bar-mitzva/storyboard.json` + `storyboard.md`

## 2026-06-27 | Raz Bar Mitzva | ingest רפרנסים אמיתיים
**מקור:** Google Drive (read-only) — 19 תמונות 2013–2026 של רז ומשפחתו
**עיבוד:** פרוקסי 768px ב-`yuval/reference/Raz/_proxy/` (2MB סה"כ), תיוג ב-EXIF (token-free) + קריאת ויז'ן אחת
**אינדקס:** `bambi/cast/Raz Bar Mitzva/reference_index.json` — מיפוי cast_id → פרוקסי
**מצב עוגנים:** raz_toddler/child/teen + mom_adi + taya = יש רפרנס טוב | dad_amos/yair/tomer = חלש (חסר סולו עדכני)
**גילויים:** טאיה = blue heeler מנומר; רז עם משקפיים ב-2026
---

**2026-06-27** · פרויקט: **Raz Bar Mitzva** · **עדכון** — הוספת מערכה 0 רב-דורית + איזון סבים
- 24 → **29 סצנות** · משך: 368s → **440s (~7:20)** · עדיין בטווח 6–8 דק'
- נוסף: 4 סצנות פתיחה (ההורים של עדי / ההורים של עמוס / חתונה / לידת רז) + סצנת ביקור סבים מאזנת (סצנה 10)
- cast: 8 → **11 דמויות** (+`grandparents_adi`, `grandparents_amos`, `adi_amos_wedding`) · 10 עוגנים חסרים
- 3 עוגנים pending sync (228 / רז בן 4-13X / חתונה) · משפט-מוטיב עבר לסצנות 19 + 29
- קבצים: אותם `storyboard.json` + `storyboard.md` (re-rendered)
---

---

## 2026-06-29 — Raz Bar Mitzva — השלמת cast anchors + תיקון תהליך רפרנס

**רקע:** התגלה שהסנכרון המקומי של Drive הביא רק ~20 תמונות מתוך 100+. נוסף audit מלא ל-`reference_index.json` (DRIVE_AUDIT).

**נמשכו מ-Drive + proxied (768px):**
- `כיסים פסדר (109)` → parents overhead selfie (mom_adi + dad_amos)
- `רז בן 4-131` → grandparents_amos (Ruti + David)
- `כיסים פסדר (228)` → grandparents_adi (Michal + Rafi)
- `_MG_8869`, `A&A (119)`, `A&A (109)` → wedding
- `11-24`, `raz & tomer-35` → taya the dog

**עוגנים שנוצרו (יובל, gpt-image-1.5 edits + --reference):**
- `grandparents_amos.png` ✓ (מ-raz4-131)
- `grandparents_adi.png` ✓ (מ-kisim-228)
- `adi_amos_wedding.png` ✓ (מ-mg-8869)
- `taya.png` ✓ (מ-11-24)

**anchor_ready=true כעת:** raz_toddler, taya, grandparents_adi, grandparents_amos, adi_amos_wedding
**עדיין pending (קיים ב-Drive, צריך משיכה+עוגן):** raz_child, raz_teen (קיים), mom_adi, dad_amos, yair
**סצנה 4a** נוצרה מחדש עם רפרנס ההורים האמיתי (kisim-109) — שיפור דרמטי.

---
**2026-06-29 — Raz Bar Mitzva: storyboard v2**
- קלט: קריינות "גרסה 2.0 מתוקנת של עדי" + סגנון חדש `v2 image style.jpg` (comic/graphic-novel, לא painterly)
- פלט: `storyboard_v2.json` + `storyboard_v2.md` + `production/elevenlabs_script_v2.md` + `production/image_prompt_library_v2.md` (ללא דריסת v1)
- 27 סצנות · 7:32 (≤8 דק') · 30 תמונות (סצנה 26 = 4 מתחלפות)
- שינויים: שלג→פתיחה · סבים בשמות (2 סצנות) · טאיה="כולם מפחדים חוץ מרז" · שחמט+לימודים משולבת · ברבר במונטאז' חלומות · סיום בגוף שני + "מנוחה היא לא ויתור" · הוסרו אופניים+סושי
- משקפיים לרז נער רק בסצנות 21/26 (רפרנס book-raz-22) · תמונות חדשות ל-scenes_v2/ · 4 ישנות מסומנות regen (3,6,13,19)

---
2026-07-04 — Raz Bar Mitzva v2 — fixed scenes 8, 9, 10, 11, 12
- Scene 8: recreated using real reference `2021-likrat-hachoref-29.jpg` (downloaded from Drive), 3-way sequential face-swap + restyle.
- Scene 9: full concept rewrite (Amos running ahead, family chasing tired, Raz close behind), face-swap Amos/Adi/Raz + restyle.
- Scene 10: split into two frames (s10a young Raz + mom, s10b teen Raz + mom) for a growth-transition video; face-swap on s10a, s10b generated directly off a near-perfect real reference.
- Scene 11: regenerated cleanly, face-swap Amos + restyle.
- Scene 12: regenerated as text-to-image (previous dog-photo reference broke the style), face-swap Raz + restyle.
- All previous versions archived (not deleted) as `sNN_*` siblings in `scenes_v2/`.

---

## 2026-07-14 — Raz Bar Mitzva (v2) — Keyframe direction (first→tail interpolation)
**משימה:** תכנון A→B keyframes ל-5 סצנות שיא רגשי/חלום, למעבר לשיטת Kling `first_image`+`tail_image` (kling-video-v3_0, 1080p, 16:9, ≤15s). תכנון בלבד — לא רונדר, לא הופעלו סוכנים.
**סצנות:** 22 (כדורגל→layup כדורסל), 24 (drop-in→carve גלישה), 25 (ברבר→פורטל ניו זילנד), 26 (chain של 4 — המלצה: 4 i2v נפרדים + dissolve בעריכה, לא keyframe), 27 (סיום 40s → 3 סגמנטים ≤15s, ה-A→B המרכזי = reveal זיכרון הפעוט).
**Frame B prompts חדשים:** נכתבו בסגנון v2 המדויק (style prefix + descriptors verbatim + "Keep the exact face..."). Frame A = שימוש חוזר בפרומפט הספרייה + tweak קטן איפה שצריך שיהיה ל-B לאן ללכת.
**חריגות משך:** 22 (16s→15s), 25 (18s→2×9s מומלץ), 27 (40s→3 סגמנטים).
**פלט:** `bambi/outputs/Raz Bar Mitzva/2026-06-27-bar-mitzva/production/keyframe_prompts_v2.md`

---

## 2026-07-24 · shuki · "אבא אדמה" — דראפט סטוריבורד
**משימה:** סרט פרישה קולנועי לשוקי (67, חקלאי נגב 36 שנה). חומר גלם: `bambi/input/shuki/` — רף storyboard גולמי (13 שוטים) + voiceover מ-Google Doc (10 סצנות קריינות, 45-75s כ"א, ~9.5 דק').
**החלטות משתמש:** 16:9 קולנועי · **≤20 שוטים** (צמצום להירו-שוטים, לא פירוק מלא ~80) · voiceover ללא שינוי · grid סטנדרטי.
**אימות voiceover:** התאמה 1:1 לביטים; הפער היחיד = משך (קריינות 45-75s מול קלינג 5-10s) → נפתר ע"י 18 הירו-שוטים 5-10s שהקריינות רצה מעליהם. narration segment נשמר פר-סצנה (סכום הקטעים = ה-VO המקורי, ללא שינוי).
**דמות:** shuki — פנים שזופות חרושות, שפם אפור-לבן עבות (סימן היכר), שיער אסוף בקוקו, לפעמים משקפי קריאה. עוגני cast: shuki, thai_workers, the_land, workshop (anchor_ready:false).
**רפרנס אמיתי:** `yuval/reference/shuki/_proxy/shuki-01..03.png` (הומרו מ-Shuki Photos). scene.reference → shuki-01.png (15/18 סצנות עם פנים).
**הומור:** מסדר תירס (8), שיעור תאילנדית (10), ניחוש ארוחת בוקר (11). **wow:** זריחה-רחפן (1), אדמה זוהרת (3), אורביט עונות (4), תודה מהאדמה (16), עץ-פסיפס בסיום (18).
**פלט:** `bambi/outputs/shuki/2026-07-24-aba-adama/` — storyboard.json (18 סצנות, valid vs schema) + storyboard.md + storyboard_grid.html. סה"כ 2:18 וידאו.
**סטטוס:** ממתין לאישור אנושי. לא הופעלו יובל / the-video-man. הערה: klingai MCP מחובר → the-video-man יקבל 2 נתיבים (OpenRouter + Kling MCP).

---

## 2026-07-25 — Raz Bar Mitzva (v2) — s01c: תמונת אינטרו נוספת (portrait סגור)

**משימה:** תמונה חדשה נוספת (לא החלפה) לרצף הפתיחה — פורטרט סגור וחם של רז הפעוט, מיד אחרי שוט הפתיחה הרחב של השלג באופרה.
**מקור:** `yuval/reference/Raz/zoomz2016 (18).jpg` — פריים אמיתי מאותה סשן צילום כמו `_proxy/2016-toddler-zoomz.jpg` (המשמש כרפרנס לסצנות 6-7), אך זווית/פריים שונה שטרם צויר.
**pipeline:** gpt-image-gen (base, --reference לתמונה האמיתית) → face-fidelity swap (מאותו רפרנס אמיתי) → restyle pass (swap השאיר seam פוטוריאליסטי בעור מול הסגנון השטוח, תוקן בהצלחה במעבר restyle נוסף).
**פלט:** `bambi/outputs/Raz Bar Mitzva/2026-06-27-bar-mitzva/scenes_v2/s01c.png` (1536×1024) + `.txt` עם 3 הפרומפטים.
**תוצאה:** דמיון גבוה מאוד לרפרנס האמיתי (שיער, גבות, עיניים, חצי-חיוך, אוזניים), ללא seam נראה, תואם לחלוטין את סגנון ה-cel-shading של הסרט.

---

## 2026-07-26 — Raz Bar Mitzva (v2) — s11b: תוספת food-styling (FOOD/TRADITIONS insert, אינסרט אוכל, ללא דמויות)

**משימה:** תמונת אינסרט חדשה לסצנה 11 (אוכל/מסורות — פנקייקים, פיצה, שניצלים) — flat-lay צילום-מלמעלה של צלחת, לא פורטרט דמות, ללא פנים, ללא face-fidelity.
**קונספט:** צ'יפס מסודר על צלחת לבנה לאיית את המילה "בתאבון" באותיות דפוס ברורות; פיסות שניצל מסודרות ליצור צורת לב; גרניש (טיפת קטשופ + פטרוזיליה).
**חסימת ביניים:** ניסיון ראשון נכשל — OpenAI `billing_hard_limit_reached` + OpenRouter fallback `401 User not found`. דווח למשתמש בלי לזייף תוצאה; המשתמש הרים את מגבלת ה-billing, ואז בוצע ניסיון חוזר.
**ניסיון יחיד (לאחר תיקון billing):** `gpt-image-2`, text-to-image (ללא רפרנס), `--size 1024x1024` (ריבוע — שיקול דעת: flat-lay של צלחת בודדת מתקומפז טוב יותר בריבוע מ-16:9). הצליח בניסיון הראשון.
**ביקורת אנושית-ידנית (זום על הטקסט):** האותיות בכיוון נכון RTL, נבדקו אחת-אחת מימין לשמאל — ב (עם רגל תחתונה) · ת (עם רגל/סריף בתחתית שמאל) · א (צורה אלכסונית מוצלבת) · ב · ו (קו אנכי עם וו עליון) · ן (קו אנכי ארוך, נון סופית) = **"בתאבון" קריא ונכון לחלוטין**, לא מראה-מגובב ולא מעוות. צורת הלב מפיסות השניצל **ברורה וסימטרית**, טיפת קטשופ + פטרוזיליה כגרניש תומך.
**פלט:** `bambi/outputs/Raz Bar Mitzva/2026-06-27-bar-mitzva/scenes_v2/s11b.png` (1024×1024, PNG, ~1.92MB) + `.txt` עם הפרומפט המדויק.
**סטטוס:** הצלחה מלאה בניסיון בודד (אחרי תיקון billing) — אין fallback, אין iterations נוספים נדרשים.

---

## 2026-07-31 — children-book-keshet — "קשת של דאגה" (ספר ילדים מאויר)
**סוג:** לא וידאו — ספר ילדים מאויר, 13 עמודים ריבועיים (1:1). עמוד 1 = שער, עמודים 2–13 = הסיפור.
**Input:** `bambi/input/Children Book/` — `קשת של דאגה.docx` (סיפור מלא בעברית) + `Slide1.jpeg` (שער מקורי = מקור הסגנון והדמות).
**פירוק:** 13 "סצנות" = 13 עמודים · 8 דמויות/עוגנים ב-cast (dedush, grandpa_avraham, aunt_ziva, aunt_shulamit, uncle_yehuda, friends, mom, garden) — כולם `anchor_ready:false`.
**Theme:** watercolor רך + קווי עיפרון, פלטה פסטלית אוורירית, רקע לבן/שמנת שנשטף בקצוות, עלווה צהוב-ליים, נגיעות קשת, אור אחר-צהריים חם, ללא קווי מתאר כבדים.
**החלטות:** (1) `video_prompt` = "N/A (still book illustration)" בכל העמודים, `duration_sec:0`, `video_output` ריק — אין הפקת וידאו. (2) כל `image_prompt` נחתם ב-"no text, no letters, no words, no writing, no numbers, no captions, no signage" — הטקסט מועלה בעימוד ליד האיור. (3) `narration` = טקסט הסיפור המקורי בעברית ששייך לעמוד, 1:1 עם ה-docx ללא פרפרזה. (4) דדוש נועל סנדלים פתוחים בעמודים 2–13 (זו הפואנטה של הסיפור) ונעלי ספורט קאמל גבוהות רק בשער — בהתאם ל-Slide1.jpeg.
**Outputs:** `bambi/outputs/children-book-keshet/2026-07-31-keshet-shel-daaga/storyboard.json` + `storyboard.md` + `storyboard_grid.html`
**שלב הבא (ראובן):** יצירת 8 עוגני cast ע"י יובל — קריטי שהעוגן `dedush.png` ייווצר מתוך `Slide1.jpeg` כרפרנס, כדי לשמור על אותו ילד ב-13 העמודים.

---

## 2026-08-19 — nirel-amnon — "סרט החתונה של בארסה" (נירמול תסריט אב → סטוריבורד)
**סוג:** סרט חתונה AI, ~9 דק', 16:9, עברית — מסופר מנקודת מבטה של בארסה החתולה.
**מצב:** **נירמול, לא פירוק.** ה-input היה תסריט אב מלא ומצוין (1988 שורות): `bambi/reference/Nirel-Amnon_ Wedding/Nirel_Amnon_Barsa_Wedding_AI_Film.md` — 56 סצנות ב-16 מערכות, Character Bible, GLOBAL VIDEO STYLE, Opening image prompt + Video prompt + Voiceover לכל סצנה, קריינות עברית רציפה ו-PRODUCTION NOTES. לא נכתב סיפור מחדש.
**היקף:** 56 סצנות · 6 עוגני cast · סה"כ 553 שניות (9:13).
**Theme:** נגזר מ-GLOBAL VIDEO STYLE (שורות 65–90) — זהב חתונה חם + נרות, קרם/לבן, ניראל=צהוב רווי, אמנון=כחול עמוק, בארסה=טאבי חום-זהוב, בטטה=בלונד-קרמל דרומי; wedding film × mockumentary × rom-com.
**תיקוני חובה שבוצעו (התסריט נכתב לפני שראו את החיות):**
1. **בארסה** — "fluffy adorable cream-colored cat" → טאבי-מקרל **חומה קצרת-שיער** לפי `ref images/barsa.png`: פרווה צפופה קצרה, בסיס זהוב-חום, פסים חדים, 'M' על המצח, גוף אוריינטלי רזה, אוזניים גדולות זקופות, עיניים שקדיות ירוק-זהוב + **פזילה קלה פנימה בעין ימין (convergent strabismus)** — שובץ בכל image_prompt שבו פניה נראות.
2. **"בטה" Golden Doodle → "בטטה"** — כלבה **פרועה בלונדינית-קרמל**, פרווה ארוכה גסה בסגנון טרייר/ויטן, שיער על העיניים, אף חום, זקן ושפם. הפרומפטים מנוסחים בחיוב (wiry-shaggy, לא curly) — `grep -ci "cream-colored\|Golden Doodle"` → **0**.
**תיקוני במאי נוספים:** מוטיב **V^** נבנה כסולם נקי — הוסר מסצנה 12 (סתר את PRODUCTION NOTES "V^ from Scene 18 onward"), ונבנה 18 (לידה) → 21 (עקבת זיקוק בשמיים) → 40 (השתקפות נרות במעבר) → 46 (טבעות) → 55 (שיא). בכל המופעים ה-V^ הוא **אור ומחווה**, לא גרפיקה/טקסט.
**רפרנסים (כולם אמיתיים, לא עוגנים מצוירים):** d16=hero לזוג · d44=ניראל+בארסה (ס'08) · d41 (ס'09) · d15 (ס'10) · d69=אירוסין בהודו (ס'19–21) · `Nirel girl.jpeg` (03–04) · `Amnon Little.jpeg` (05–06) · `barsa.png` האמיתית לכל סצנות בארסה · `batata1.jpeg` (29,31).
**סצנה 01 מאושרת** — נכללה ב-JSON עם הפרומפט שבפועל שימש (`scenes/s01.txt`), `image_output` מצביע על הקובץ הקיים, `reference` = העוגן המאושר `bambi/cast/nirel-amnon/barsa.png`.
**Outputs:** `bambi/outputs/nirel-amnon/2026-08-19-barsa/storyboard.json` + `storyboard.md` + `storyboard_grid.html` + `production/elevenlabs_script.md` (קריינות פר-סצנה, 1:1 מהמקור, `<break>` במקום `pause.`, 16 שורות מסומנות ללחישה, הנחיות קול מ-PRODUCTION NOTES שורות 1949–1957).
**שלב הבא (ראובן):** 5 עוגני cast חסרים (batata, nirel, amnon, nirel_child, amnon_child) — בארסה כבר `anchor_ready:true`. אח"כ 55 פריימים ראשונים (s02–s56).

---

## 2026-08-19 — nirel-amnon — כל 56 התמונות הושלמו (לילה שלם, ללא פיקוח)

**היקף:** סצנה 01 (מבחן סגנון) → 6 מרכזיות (05, 12, 29, 45, 51, 56) → face-swap fix על nirel_child →
סדרת מבחני סגנון על סצנה 03 (photorealistic → pixarstyle-90%-הוגזם → ריאליזם-95% → **סגנון שוקי
מדויק + face-swap + restyle = אושר**) → סצנה 04 (⚠️ נעה ל-`s04_pixarstyle.png`, לא עברה swap/restyle,
לא אושרה ידנית — לבדוק) → **49 הסצנות הנותרות (08–56) בלוט לילי אחד**, driver script ב-scratchpad,
PID רץ עצמאית ברקע (שרד ניתוק session).

**תוצאה: 56/56 תמונות קיימות.** 2 כשלים בזמן הריצה — s29 ו-s31 (שתיהן עם בטטה): קובץ
`ref images/batata1.jpeg` הוא MPO (פורמט סטריאו של iPhone), נדחה ע"י OpenAI edits
(`invalid_image_file`). תוקן בהמרה ל-JPEG רגיל (נעשה כבר פעם אחת בזמן יצירת עוגן בטטה,
נעשה שימוש חוזר בקובץ המתוקן) — שתי הסצנות הורצו מחדש בהצלחה.

**דפוס לתשומת לב עתידית:** בכל סצנות "בארסה לבד", ה-`reference` וה-cast anchor הם שניהם
`barsa.png` (שמות זהים, נתיבים שונים) → כפילות רפרנס לא מזיקה אך מבזבזת טוקנים. לא תוקן,
לא קריטי.

**Grid:** `storyboard_grid.html` עודכן ל-56/56, נרנדר מחדש.
**שלב הבא:** the-video-man הופעל על סצנות 01–07 (Kling MCP, image-to-video).
**דגל פתוח:** סצנה 04 טעונה אישור/תיקון ידני — ראה storyboard note.

---

## 2026-08-19 — nirel-amnon — 8 סצנות עודכנו (25, 26, 32, 37, 38, 46, 51, 55)

בקשות המשתמש: עוגת שחרור (במקום תעודה — כרטיס-אשראי-גודל, ID צבאי) + לבוש אופה לניראל
בסצנה 25 · גיוון לבוש לניראל/אמנון ב-26/32/37/38 (לא אותם בגדים כל פעם) · טבעות אמיתיות
מתמונת רפרנס (`ref images/rings.jpeg`) בסצנה 46 — טבעת מעוטרת לניראל, טבעת חלקה לאמנון ·
חליפות/חולצות לבנות מודרניות בסצנה 51 · מראה כלה-חתן אמיתי + שיער ניראל תואם רפרנס בסצנה 55.

**באג בסבב ראשון:** יצרתי ב-1:1 בטעות (חסר `--size`) ובלי face-swap — הפנים לא דמו לניראל.
**תוקן:** `--size 1536x1024` בכל קריאה + שלב face-swap חדש: זיהוי פנים ב-`d16.jpg` (2 פנים,
idx0=ניראל/idx1=אמנון מאומת ויזואלית), swap עם **התאמה לפי embedding similarity** ולא לפי
מיקום שמאל/ימין בתמונה (מונע את הבאג המתועד ב-`feedback_faceswap_target_index_ordering`).
תוצאה: 8/8 סצנות עם פנים תואמות היטב, נבדק ויזואלית אחת-אחת.

גרסאות: `sNN_v1.png` = הגרסה הקודמת (backup) · `sNN_v2.png` = לפני swap · `sNN_v2_swapped.png`
= הגרסה הסופית (הועתקה ל-`sNN.png`). `storyboard.json` (`image_prompt`) ו-`storyboard_grid.html`
עודכנו בהתאם.

---

## 2026-08-19 — nirel-amnon — 4 החלטות תמונה סופיות + סצנה חדשה 32.5

- **s05** → `s05_v2.png` (אמנון קטן + כדורגל/גלובוס — אושר).
- **s25** → `s25_v3.png` — **נוצר ידנית ע"י המשתמש**: כרטיס שחרור צה"לי אמיתי (עם שבב, טקסט
  עברי), משופר משמעותית מהניסיון שלי.
- **s38** → `s38_v2.png` (לפני face-swap) — המשתמש העדיף את הגרסה הזו על פני הגרסה עם swap.
- **s55** → הוחזר ל-`s55_v1.png` (המשתמש דחה את שתי גרסאות ה-swap — גם d16 וגם profile-photo).
- **סצנה חדשה 32.5** ("עוד יצירה") — נוספה אחרי סצנה 32, תמונה **נוצרה/סופקה ידנית ע"י המשתמש**
  (`s32_v3.jpeg` → הומר ל-`s32.5.png`). title/narration/video_prompt נוסחו על ידי לפי תוכן
  התמונה — **טרם אושרו במפורש**, יש לבדוק מול המשתמש.

`storyboard.json` עודכן (57 סצנות כעת, 9:19 סה"כ) · `storyboard_grid.html` נרנדר מחדש.

---

## 2026-08-19 13:12 | nirel-amnon | וידאו לסצנות 01–07 (Kling MCP, kling-video-v3_0_turbo)

**מודל:** Kling MCP — `kling-video-v3_0_turbo`, resolution 1080p, בלי audio
**נתיב הפקה:** MCP ישיר (`mcp__klingai__file_upload` + `mcp__klingai__image_to_video`), לא OpenRouter

**תוצאה: 5/7 הצליחו, 2/7 נכשלו (אזל תקציב קרדיטים באמצע ה-batch)**

| סצנה | משך | סטטוס | קרדיטים | קובץ |
|---|---|---|---|---|
| 01 המרדף — פתיחה | 15s | ✅ הושלם | 150 | `videos/s01.mp4` |
| 02 העכבר נמלט | 8s | ✅ הושלם | 80 | `videos/s02.mp4` |
| 03 ניראל הקטנה | 10s | ✅ הושלם | 100 | `videos/s03.mp4` |
| 04 ניראל על הבמה | 8s | ✅ הושלם | 80 | `videos/s04.mp4` |
| 05 אמנון הקטן | 10s | ✅ הושלם | 100 | `videos/s05.mp4` |
| 06 תקרית החומוס | 8s | ❌ נכשל | 0 | Insufficient credits |
| 07 יקומים מקבילים | 10s | ❌ נכשל | 0 | Insufficient credits |

**סה"כ קרדיטים נוצלו: 510** (150+80+100+80+100). יתרה שנותרה בחשבון: **39 קרדיטים** —
לא מספיק לסצנה 06 (עלות ~80) או 07 (עלות ~100).

**סיבת הכשל:** ה-batch הוגש במקביל לכל 7 הסצנות (לפי ההנחיה — בלי test-job בודד קודם).
הבקשות ל-s01–s05 נכנסו לתור בזמן שעדיין היה מספיק תקציב; עד שהגיע תור s06/s07 היתרה
ירדה מתחת לעלות הנדרשת ושתי הבקשות נדחו מיידית עם "Insufficient credits" (לא נכנסו
לתור כלל — לא חויבו).

**המלצה להמשך:** לטעון קרדיטים נוספים בחשבון Kling
(https://kling.ai/h5-app/membership-agent?r=agent_Claude Code) ואז להריץ שוב רק את
סצנות 06–07 (שני קבצי `first_image` כבר הועלו בסבב הזה, ה-URLs פגי-תוקף אחרי זמן קצר —
צריך להעלות מחדש עם `file_upload`).

**קבצים:** כל 5 ה-MP4 שהצליחו + sidecar `.txt` לכל אחד נשמרו ב-
`bambi/outputs/nirel-amnon/2026-08-19-barsa/videos/`. `storyboard_grid.html` יזהה אותם
אוטומטית ברענון (↻).

---

## 2026-08-19 15:30 | nirel-amnon | וידאו לסצנות 06–12 (Kling MCP, kling-video-v3_0_turbo, 720p)

**מודל:** Kling MCP — `kling-video-v3_0_turbo`, resolution **720p** (ירידה מכוונת מ-1080p לחיסכון בעלות),
בלי audio-toggle (למודל הזה אין `enable_audio` — אודיו כלול אוטומטית תמיד), בלי `tail_image`
**נתיב הפקה:** MCP ישיר (`mcp__klingai__file_upload` + `mcp__klingai__image_to_video`), לא OpenRouter

**תוצאה: 7/7 הצליחו** — כל ה-first_image הועלו מחדש (URLs קודמים פגי-תוקף), הוגשו כ-batch
מקביל, נסקרו עם `query_tasks` עד השלמה.

| סצנה | משך | סטטוס | קרדיטים | קובץ |
|---|---|---|---|---|
| 06 תקרית החומוס | 8s | ✅ הושלם | 64 | `videos/s06.mp4` |
| 07 יקומים מקבילים | 10s | ✅ הושלם | 80 | `videos/s07.mp4` |
| 08 ניראל והחתולים | 10s | ✅ הושלם | 80 | `videos/s08.mp4` |
| 09 אמנון לא אוהב חתולים | 8s | ✅ הושלם | 64 | `videos/s09.mp4` |
| 10 הכניסה הגדולה של ברסה | 10s | ✅ הושלם | 80 | `videos/s10.mp4` |
| 11 למה בארסה? | 10s | ✅ הושלם | 80 | `videos/s11.mp4` |
| 12 המפגש | 10s | ✅ הושלם | 80 | `videos/s12.mp4` |

**סה"כ קרדיטים נוצלו: 528** (64+80+80+64+80+80+80), מתוך יתרה נטענת ~7,539 — נותרו ~7,011.

**קצב 720p: 8 קרדיטים/שנייה** (64/8=8, 80/10=8) — לעומת **10 קרדיטים/שנייה שנצפו ב-1080p**
בסבב הקודם (s01–s05). ירידה של **20%** בעלות לשנייה, כצפוי מהחלטת המשתמש להוריד רזולוציה.

**כשלים:** אין. כל 7 הבקשות הצליחו בניסיון ראשון.

**קבצים:** כל 7 ה-MP4 + sidecar `.txt` (מודל, resolution, פרמטרים, prompt, קרדיטים) נשמרו ב-
`bambi/outputs/nirel-amnon/2026-08-19-barsa/videos/`. `storyboard_grid.html` יזהה אותם
אוטומטית ברענון (↻). **Scope:** רק סצנות 06–12, שאר הסצנות (01–05, 13+) לא נגעו.

---

**2026-08-19** · פרויקט: **nirel-amnon** · בריף מוזיקת רקע ל-Suno (לא סטוריבורד חדש)
- מבוסס על הסטוריבורד הקיים `2026-08-19-barsa/storyboard.json` (57 סצנות, 8 מערכות, ~9:19 דק')
- 8 cues מוגדרים (Main Theme, ילדות, התנגשות עולמות→התאהבות, הודו/זיקוקים, מבצע בארסה, הטקס/V^, ריקוד/מסיבה, פינאלה+פאנץ')
- כל cue: Suno style-tags prompt מוכן להדבקה + הערת התאמה + טבלת מיפוי cue→סצנות→משך (סה"כ 559s, תואם ל-9:19)
- קובץ: `bambi/outputs/nirel-amnon/2026-08-19-barsa/production/suno_music_brief.md`

---

**2026-08-20** · פרויקט: **nirel-amnon** · שכבת אינסרטים אקשן (Action Insert Pack)
- מקור: `2026-08-19-barsa/Action Scenes/Nirel_Amnon_ACTION_Insert_Pack_for_Claude.md` — 12 אינסרטים A1–A12 + 3 בונוס B1–B3
- 15 אינסרטים · 88 שניות סה"כ (73s עיקריים + 15s בונוס) · 13 פריימים חדשים (NEW/HYBRID) + 2 שימוש חוזר (EXISTING: s18, s48)
- `scene_number` עשרוני למיון בין 57 הסצנות הראשיות (2.1, 7.1, 13.1, 18.1, 21.1, 22.1, 24.1, 25.1/B2, 27.1, 29.1, 35.1/B3, 38.1/B1, 39.1, 43.1, 48.1) · `scene_type: "action_insert"` בכולם
- ⚠️ תיקוני עקביות: תיאורי החיות במסמך המקור היו שגויים — ברסה תוקנה מ-"fluffy cream" לטאבי-מקרל חומה קצרת-שיער עם פזילה עדינה; "Betta / Golden Doodle" תוקנה ל"בטטה" טרייר/ויטן פרועה בלונדינית-קרמל. תועד במפורש בסוף ה-MD
- הסטוריבורד הראשי, התמונות והווידאו **לא נגעו** — שכבה נפרדת לחלוטין
- קבצים: `bambi/outputs/nirel-amnon/2026-08-19-barsa/action_storyboard.json` + `action_storyboard.md`

## 2026-08-20 07:33 | nirel-amnon | 2026-08-19-barsa — batch וידאו סצנות 25–56 (33 סצנות)
**סוכן:** the-video-man | **שיטה:** Kling MCP (`image_to_video`)
**מודלים:**
- `kling-video-v3_0_turbo` @ 720p — 12 סצנות "מורכבות": 25, 26, 27, 32, 36, 39, 40, 44, 47, 48, 51, 55 (משך מדויק מהסטוריבורד, 10s/12s; אין פרמטר `enable_audio` — אודיו תמיד כלול)
- `kling-video-v2_6` @ 720p, `enable_audio=false` — 21 סצנות "פשוטות": 28, 29, 30, 31, 32.5, 33, 34, 35, 37, 38, 41, 42, 43, 45, 46, 49, 50, 52, 53, 54, 56 (עוגל ל-5s/10s — המודל תומך רק בשני הערכים האלה; 32.5 → 5s, כל השאר → 10s)
**קצב קרדיטים מאומת:**
- `kling-video-v2_6` @ 720p ללא אודיו = **3 קרדיטים/שנייה** (30 ל-10s, 15 ל-5s) — נמוך משמעותית מההנחה של 8
- `kling-video-v3_0_turbo` @ 720p = **8 קרדיטים/שנייה** (80 ל-10s, 96 ל-12s)
- להשוואה: `kling-video-v2_6` @ 1080p **עם** אודיו = 10 קר'/שנ' (סצנה 24, ריצה קודמת)
**עלות:** 1,623 קרדיטים סה"כ = 615 (v2_6) + 1,008 (v3_0_turbo). יתרה: 2,601 → 978
**תוצאה:** 33/33 הצליחו, אפס כשלונות. כל ה-MP4 + sidecar `.txt` ב-`bambi/outputs/nirel-amnon/2026-08-19-barsa/videos/`
**scope:** סצנות 01–24 לא נגעו
**לקח:** `v2_6` תומך ב-`enable_audio` רק ב-1080p. ויתור על האודיו והישארות ב-720p מוזילה פי ~3.3 (3 מול 10 קר'/שנ') — כדאי מאוד ל-batch גדול כשהאודיו ממילא מוחלף בקריינות בפוסט
---

## 2026-08-20 07:48 | nirel-amnon | Action Insert Pack — 13 פריימי-ראשון (NEW/HYBRID)

**סוכן:** יובל | **ספק:** OpenAI (`gpt-image-gen`, ברירת מחדל — אין דמויות אנושיות בשום סצנה, לכן אין face-fidelity בסבב הזה)
**מקור:** `action_storyboard.json` — 13 סצנות מתוך 15 (דילוג מכוון על A4/18.1 ו-A12/48.1, EXISTING, ללא `image_prompt`)
**גודל:** `--size 1536x1024` בכולן. 5 עם `--reference` (בארסה/בטטה): A2, A6, A9, B1, A11 — ה-8 האחרות text-to-image טהור (נופים/אובייקטים בלי דמויות).

**תוצאה: 13/13 הצליחו** (12 בניסיון ראשון, 1 בניסיון שני).

**כשל ותיקון (A9, insert 29.1, בטטה):** ניסיון ראשון נכשל בכל שני הספקים —
OpenAI `400 invalid_image_file` על `ref images/batata1.jpeg`, ואז OpenRouter fallback `404`.
סיבת שורש: `batata1.jpeg` הוא MPO (Multi Picture Object, פורמט סטריאו של iPhone) — נדחה
ע"י ה-API (תופעה מוכרת, כבר תועדה ב-jobs.md מ-19/08 על s29/s31 בסטוריבורד הראשי).
תוקן: המרה מקומית ל-JPEG רגיל (RGB, ללא MPO container) ← אותו --reference בפועל, אותו תוכן חזותי.
הרצה חוזרת הצליחה מיידית.

**עלות/טוקנים (13 קריאות):**
- 8 קריאות text-to-image (`gpt-image-2`, ~1,530–1,585 טוקן כ"א) = A1, A3, A5, A7, B2, A8, B3, A10
- 5 קריאות image-edit עם רפרנס (`gpt-image-1.5`, ~8,750–8,880 טוקן כ"א) = A2, A6, A9, B1, A11
- סה"כ משוער: **~56,800 טוקנים** (≈12,270 text-to-image + ≈44,860 edits-with-reference)

**קבצים:** 13 PNG + 13 `.txt` sidecar (provider, reference, prompt, status) ב-
`bambi/outputs/nirel-amnon/2026-08-19-barsa/action_scenes/` (a01, a02, a03, a05, a06, a07, b02, a08, a09, b03, b01, a10, a11).
**Scope:** רק 13 האינסרטים האלה. 57 הסצנות הראשיות (תמונות + וידאו) והאינסרטים A4/A12 (EXISTING) — לא נגעו.

---

## 2026-08-20 — Nirel & Amnon — סבב QA ותיקונים (וידאו + תמונות)

**קלט:** QA ידני מהמשתמש על סצנות/אינסרטים שכבר נוצרו, זיהה 3 סוגי באג נפרדים.

**1. באג שורש מזוהה — דמות חסרה מה-first-frame image:** סצנות 10, 17, 18, 21, 34, 36 —
ה-`image_prompt` (הפריים הראשון שמוזן ל-Kling) לא מזכיר את ניראל ו/או אמנון בכלל, גם כש-
`video_prompt` שם אותם במרכז. סצנה 21 כותבת במפורש "no humans in frame". Kling ללא עוגן
זהות בפריים הראשון המציא דמויות גנריות. סצנה 43 (POV של ברסה) — הזוג הסופי בקצה המסדרון
יצא כשתי נשים שגויות במקום ניראל ואמנון.

**פתרון: Kling Elements (subject binding)** — במקום לייצר מחדש את 6 התמונות (שהמשתמש
ביקש לשמר), נוצרו שני Elements אמיתיים מתמונות רפרנס אמיתיות:
- Nirel = `319175997618831` (cover: קרופ פנים מ-d16.jpg, secondary: d16.jpg המלא)
- Amnon = `319176002326089` (cover: PHOTO-2026-06-13-23-32-54.jpg פרופיל סולו, secondary: d16.jpg)
Elements נתמכים רק ב-`kling-video-v3_0` (לא turbo, לא v2_6) — אומת מול `who_am_i`.
כל סצנה נוצרה מחדש עם `first_image` המקורי ללא שינוי + `elements` array + placeholder
`<<<id>>>` בפרומפט. פיילוט על סצנה 18 (hands-only, הכי קשה לזהות ויזואלית) אומת תקין
לפני שהורצו שאר 5.
תוצאה: 6/6 תוקנו בהצלחה (אומת ויזואלית על 10, 43 + s18 composition). עלות: 60–72 קרדיט
לסצנה (720p, 10-12s, no audio) — **זול יותר** מ-v3_0_turbo (80 קרדיט ל-10s).

**2. הזיה בוידאו (לא קשור לפרומפט/תמונה):**
- **סצנה 29 (בטטה):** הווידאו הקודם הראה בטטה פוגשת כלב שגוי במקום ברסה. שורש: הפרומפט
  רמז לפרטנר תגובה על-מסך ("spots Barsa off-frame... the two look at each other") ו-Kling
  מילא זאת בכלב שני הזוי. נכתב מחדש עם איסור מפורש: "No other animal... appears anywhere
  in the shot". תוקן, אומת ויזואלית. מודל v2_6@720p no-audio (30 קרדיט).
- **סצנה 28 (אמנון "נופל לרצפה"):** נבדקו 3 פריימים מהווידאו — לא נמצא הרגע הבעייתי
  בדגימה. **הושאר ללא שינוי** לפי בקשת המשתמש (רק אם יתברר שזה מפריע בפועל).

**3. תיקוני תוכן נקודתיים:**
- **A08 (אינסרט פעולה, כדורגל):** התמונה הקודמת הראתה כדור ראגבי/פוטבול אמריקאי במקום
  כדורגל עגול. תוקן ע"י פרומפט מפורש "round soccer ball, black-and-white pentagon/hexagon
  panels". `image_prompt`+`video_prompt` ב-`action_storyboard.json` עודכנו בהתאם.
- **סצנות 47, 48 (ריקוד ראשון + התפרצות המסיבה):** ניראל ואמנון היו בלבוש קז'ואל גנרי
  ("yellow/blue accent") במקום כלה/חתן אמיתיים. תמונות נוצרו מחדש עם שמלת כלה לבנה +
  חליפה כהה פורמלית, אורחים בלבוש חגיגי צבעוני. Face-swap מ-d16.jpg הורץ (רק שני הפנים
  הגדולים ביותר, לא כל הפרצופים ברקע — תוקן טעות ראשונית שהחליפה גם אורחי רקע). וידאו
  הורץ מחדש עם אותו פרומפט (v3_0_turbo, ללא שינוי) על הפריים החדש.
- **סצנה 38 (האנגלית שלה) — עיצוב מחדש, לא רק תיקון:** המשתמש שם לב שפיה של ניראל
  זזה כאילו מדברת בלי אודיו תואם. במקום לכתוב לה טקסט, עוצב מחדש כל השוט כך שהיא לעולם
  לא "מדברת" על המסך — מחווה בטוחה בפה סגור, קפיאה, מבוכה — עקבי עם קונבנציית הסרט
  (קריינות ברסה בלבד, בלי דיאלוג אנושי sync בשום סצנה אחרת). תמונה נוצרה מחדש + face-swap.

**קבצים ישנים נשמרו** (לא נמחקו): `s38_v1_speaking.png`, `s47_v1.png`, `s48_v1.png`
(+ גרסאות `_preswap`).

**עלות כוללת הסבב (חלק ראשון):** ~714 קרדיט Kling. סצנה 17 (הכי מורכבת — שני מיקומים,
שתי דמויות) לקחה ~14 דקות לרינדור (מול 2-6 דק' לשאר) אך הושלמה בהצלחה, לא נתקעה.

**המשך — סצנה 28 (בעיית הכדורגל):** המשתמש אישר שהבעיה ("אמנון נופל לרצפה") אכן קיימת
בפועל. שורש סביר: פרומפט מעורפל ("arms up, roaring... guests join in") שנתפרש ע"י
Kling כקריסה/נפילה. נכתב מחדש עם הגבלות פיזיקה מפורשות ("both feet planted... never
falling, never collapsing") + שדרוג ממודל v2_6 ל-v3_0_turbo (פיזיקה נקייה יותר בפרויקט
הזה). 80 קרדיט.

**עלות כוללת (כולל סצנה 28):** ~794 קרדיט מתוך 978 (184 נותרו).
**נותר פתוח:** סצנה 44 (המשתמש דיווח כבעייתית, אך image_prompt תקין — כנראה סחיפת-זהות
בזמן ייצור, לא באג פרומפט; לא טופל בסבב הזה).

## 2026-08-20 | nirel-amnon | Action-insert layer (15 clips) — model comparison batch

**מטרה:** שכבת 15 קליפי-פעולה קצרים (action inserts) שישוזרו בהמשך לתוך הסטוריבורד הראשי
בן 57 הסצנות (עדיין לא שוזרו — שלב נפרד). המשתמש ביקש להשוות 4 מודלי וידאו שונים דרך
OpenRouter בלבד (לא Kling MCP): רוב הקליפים ב-Seedance 2.0 Mini (הנחת 60%, לפי הבריף),
וקליפ אחד בכל אחד מ-3 מודלים נוספים להשוואה.

**בדיקת מקדים:** מפתח OPENROUTER_API_KEY אומת עובד. **התראת מחיר:** Seedance 2.0 Mini
חזר במחיר בפועל **$0.03045/שנייה** לעומת $0.01345/שנייה צפוי (הנחה זמנית) — פי 2.26.
המשתמש (דרך ראובן) אישר להמשיך במחיר הגבוה יותר.

**תוצאה: 13/15 הצליחו, 2 נכשלו.**

| סצנה | מודל | משך | עלות בפועל | סטטוס |
|---|---|---|---:|---|
| A1 | seedance-2.0-mini | 6s | $0.1827 | OK (ניסיון ראשון בלי `--reference` הושלך, $0.1827 נוסף שהתבזבז) |
| A2 | seedance-2.0-mini | 5s | $0.1525 | OK |
| A4 | seedance-2.0-mini | 5s | $0.1525 | OK (רפרנס: s18.png מהסטוריבורד הראשי) |
| A5 | seedance-2.0-mini | 6s | $0.1827 | OK |
| A6 | seedance-2.0-mini | 6s | $0.1827 | OK |
| A7 | seedance-2.0-mini | 5s | $0.1525 | OK |
| B2 | seedance-2.0-mini | 5s | $0.1525 | OK |
| B3 | seedance-2.0-mini | 5s | $0.1525 | OK |
| B1 | seedance-2.0-mini | 5s | $0.1525 | OK |
| A10 | seedance-2.0-mini | 7s | $0.2129 | OK |
| A11 | seedance-2.0-mini | 6s | $0.1827 | OK |
| A12 | seedance-2.0-mini | 8s | — | **נכשל** — HTTP 400 `InputImageSensitiveContentDetected.PrivacyInformation` (רפרנס s48.png זוהה כתמונת אדם אמיתי) |
| A3 | flux-3-video | 8s | — | **נכשל** — HTTP 400, הספק לא תומך ב-image reference input בכלל (טקסט-לווידאו בלבד) |
| A8 | minimax/hailuo-3 | 5s | $0.6500 | OK ($0.13/sec — תואם בדיוק לצפי) |
| A9 | seedance-2.0-fast | 6s | $0.5481 | OK ($0.09135/sec בפועל מול $0.04035/sec צפוי — פי 2.26 גבוה יותר, אותו יחס כמו Mini; כנראה פקיעת הנחה רוחבית ל-Seedance ולא ספציפית ל-Mini) |

**עלות כוללת בפועל (13 הצלחות):** $2.9043
**+ קריאת בדיקה מבוזבזת (A1 ניסיון ראשון, ללא רפרנס):** $0.1827
**סה"כ מצטבר בפועל:** $3.0870

**תובנות איכות (ממטא-דאטה של jobs, לא מצפייה):**
- MiniMax Hailuo-3 ו-Seedance 2.0 Fast הרבה יותר יקרים לשנייה מ-Mini (פי 4.3 ו-3.0
  בהתאמה) — עקבי עם המיצוב שלהם כמודלים פרימיום/מהירים.
- Seedance 2.0 Mini ו-Fast חוו את אותה סטייה של פי 2.26 מהמחיר הצפוי — מרמז על פקיעת
  הנחה כללית בקטגוריית Seedance ב-OpenRouter, לא תקלה נקודתית ב-Mini בלבד. כדאי לבדוק
  שוב לפני batch עתידי גדול.
- FLUX.3 Video לא תומך כלל ב-image-to-video דרך האינטגרציה של OpenRouter כרגע (רק
  text-to-video) — חשוב לזכור לפני שמנסים שוב עם רפרנס.
- s48.png (סצנת ריקוד ראשון) נחסם ע"י מודרציה כ"תמונת אדם אמיתי" — ייתכן שיהיה רלוונטי
  גם לשלב השזירה הראשי אם ינסו שוב את אותו רפרנס במודל אחר עם בדיקת פרטיות דומה.

**קבצים:** `bambi/outputs/nirel-amnon/2026-08-19-barsa/action_videos/{a01,a02,a04,a05,a06,a07,b01,b02,b03,a10,a11,a08,a09}.mp4` (+ `.txt` sidecar לכל אחד)
**Progress log מלא (submission-by-submission, job_id-ים):** `/tmp/openrouter_video_progress_nirel_amnon.log`
**לא נגעתי:** 57 הסצנות הראשיות וסרטוני ה-Kling שלהן.

## 2026-08-20 | nirel-amnon | Action-insert retry round (A12, A3)

**A12** — retried on Seedance 2.0 full (`bytedance/seedance-2.0`, $0.06726/sec), same
first_image (`scenes/s48.png`), same prompt/duration. **Failed again** — identical
`InputImageSensitiveContentDetected.PrivacyInformation` error, confirming the block is
caused by the reference image itself (real-person likeness detected), not a Mini-specific
quirk. Per instruction, stopped after this second platform — did not try a third. **Needs
a different first-frame image for scene 48** to proceed; flagging back to the user/director
rather than guessing a substitute.

**A3** — retried on MiniMax H3 (`minimax/hailuo-3`, $0.13/sec), same first_image
(`action_scenes/a03.png`), same prompt/duration (8s). **Succeeded.** Cost $1.0400,
exactly matching the expected $0.13/sec rate. Output:
`bambi/outputs/nirel-amnon/2026-08-19-barsa/action_videos/a03.mp4` (+ `.txt` sidecar).

**Retry round cost:** $1.0400 (A3 only; A12 failed pre-charge on both attempts, no cost incurred).
**Running total for this action-insert batch (original 13 + this retry):** $2.9043 + $1.0400 = $3.9443
(plus the $0.1827 discarded test call from the original round = $4.1270 cumulative).

**Still open:** A12 / scene 48 first-frame needs replacing before a video can be generated for it.

**2026-08-20 — decision:** user chose to skip A12 for this round rather than swap the
first-frame image. **Final tally: 14/15 action-insert scenes complete, $4.1270 total spend.**
A12 remains un-generated; revisit later with a moderation-safe first-frame if/when the
action-insert layer gets finalized into the main film.

## 2026-08-27 | nirel-amnon | Full narrative reorder + new voiceover (text-only, no new assets)

User supplied `bambi/input/nirel-amnon/voiceover_script final.docx` — a full rewrite of the
narration with color-coded runs (green = new text, black = keep existing) **and** a complete
reordering of all 72 scenes (57 main incl. 32.5 + 15 action inserts), all still tracing back
to the same original scene identities (no scenes added/removed/renamed — verified 1↔1 against
`storyboard.json`/`action_storyboard.json`).

Presented the full reorder + green/black-resolved narration as an Artifact plan before touching
any file (per user's "show me the plan first"); user resolved 4 open points: (1) scene 32
("צבעים") placement stays as literally written in the docx, (2) scene 38 ("האנגלית שלה") stays
for now despite the "(לא בטוח)" note, (3) the India-proposal TODO note in scene 19 gets a real
video added later by the user — no new asset generated now, (4) `<break>`/[לחישה] tags + niqud
on invented pun-words to be authored by me, asking only where genuinely unsure (asked via
AskUserQuestion for מיאולואים/מיאושלמים/חתולונובלה/לחתוליזציה — user gave exact niqud/spelling
for all 4, applied verbatim).

**Files changed:**
- `storyboard.json` / `action_storyboard.json` — added an `"order"` field (1–72, unique) to
  every scene reflecting the new narrative sequence; `scene_number` and all asset paths
  (`image_output`/`video_output`) were **not** touched, so existing generated images/videos
  stay correctly linked. 46 of 57 main-scene `narration` fields updated to the resolved
  green/black text (2 of those — scenes 16 and 56 — because the docx's own black fallback
  text differed slightly from what was previously in `elevenlabs_script.md`; flagged to user).
- `.claude/skills/storyboard-director/scripts/render_grid.py` — now sorts by the new `"order"`
  field when every merged scene has one (falls back to the old `scene_number` sort otherwise) —
  a durable, reusable skill fix, not project-specific.
- `storyboard_grid.html` — regenerated via `render_grid.py --merge action_storyboard.json`;
  72 scenes, 10:47 total, now in the new narrative order.
- `production/elevenlabs_script.md` — fully rewritten: 57 scenes in new order, each with
  freshly-authored `<break>` pause tags and `[לחישה]` whisper markers (27 of 57 scenes
  whispered, matching the original file's density/style), niqud on the 4 invented pun-words
  per the user's answers, an inline note after any main scene immediately followed by an
  action insert (what it is + its `voiceover_relation`, since inserts have no narration of
  their own), a production note on scene 19 about the pending India-proposal footage, and an
  updated continuous backup version at the end.

**No new images/video generated** (explicit user instruction this round). A12 (scene 48
action insert) is still un-generated from the previous round.

## 2026-08-28 | nirel-amnon | elevenlabs_script.md — v3 audio tags + Batata guest cameo (doc only)

User feedback: too many `<break>` tags (felt robotic), not enough use of ElevenLabs v3's
actual tag vocabulary (https://elevenlabs.io/blog/v3-audiotags), and "ואתחה" needed niqud too.
Rewrote every scene's spoken text in `production/elevenlabs_script.md` from the old
break-heavy line-by-line format into a single flowing v3-tagged string per scene
(`[dryly]`, `[whispers]`, `[sarcastically]`, `[warmly]`, `[softly]`, `[excited]`,
`[happily]`, `[awe]`, `[rushed]`, `[laughs softly]`, `[pause]`), relying on natural
punctuation for pacing instead. Only one `<break time="1.2s"/>` remains anywhere in the
per-scene section (scene 19, the real tonal whiplash into gunfire) — the continuous
backup version at the end still uses `<break time="1.0s"/>` between scenes, which is
correct there. Model requirement updated to v3 (needed for the tags). Niqud fix:
ואתחה → וָאתְחָה everywhere it appears (scenes 18, 46, 55, backup).

**Batata guest cameo (documented only, not executed — explicit user instruction "אין צורך
לעשות את זה בעצמך, רק לעדכן את ה-md"):** found two ElevenLabs-generated recordings already
sitting in `bambi/input/nirel-amnon/` (voice preset "Potato - Earthy & Rooted"), transcribed
via OpenAI Whisper (`whisper-1`) since there's no local audio-decode/STT tool here — installed
`imageio-ffmpeg` via pip (bundles a static ffmpeg binary, works without brew/sudo) just to read
duration/run silencedetect for a suggested cut point, no brew available on this machine.
Transcripts: "היי! אני בטטא! היא לא נתנה לי שורה אחת לדבר בקריינות הזאת." (5.7s) and
"יחד. כל הדרך. פוטייטו פוטאטו." (4.0s). Documented as a 3-clip cameo plan in the script
(new "הופעת אורח של בטטה" section + a production note on scene 29) — suggested placement
right after scene 29's narration, silence-detected candidate cut point ~2.0–2.6s in the
first file. Nothing was actually cut/rendered; this is instructions for whoever edits audio.

---

## 2026-09-11 | rosh-hashana | "טיפה אחת — שנה טובה ומתוקה" — storyboard from Midjourney stills + 4 existing clips

Input: 15 Midjourney 9:16 stills (`bambi/input/rosh hashana/IMG_3208–3222.JPG`, luxury honey/pomegranate/apple
macro, hard desert sun) + 4 ready clips (honey pour MP4 15s, orchard EWS, fig, bee — 10s each).
Concept: one honey drop escapes the jar and travels (hive → bee → orchard → blossoms → the woman) until it
lands on the apple; hands dip, the woman tastes, blessing. Acts: hook/escape → renewal → DROP/abundance →
sweetness. 17 scenes, 57s, cut-rate 2–5s. No VO except two on-screen lines in `narration`
(s03 "כל שנה מתוקה מתחילה בטיפה אחת." / s17 "שנה טובה ומתוקה.").
Sources per scene (`source` field): 11 still (Kling i2v), 4 clip as-is with `use_range`, 2 `new_still`
pending approval (s15 hands dipping apple in honey, s16 the woman from IMG_3217 front CU tasting).
Cast: 5 object anchors (honey, apple, pomegranate, bee, the-woman), `anchor_ready:false`, `reference` empty
everywhere (no anchors needed — stills are the reference). Top-level `edit_notes`: music 124 BPM organic
trap / darbuka, drop at s11, on-screen Hebrew text per scene, transitions, upscale note for 480p MOVs.
Unused stills: 3214, 3218, 3220, 3221 (covered by clips / redundant).
Output: `bambi/outputs/rosh-hashana/2026-09-11-shana-tova/` — storyboard.json + storyboard.md + storyboard_grid.html.
No images/video generated.
---
## 2026-09-11 | rosh-hashana | Kling video batch (13 scenes, kling-video-v3_0 1080p 5s)
12/13 completed successfully (520→480 credits net after s16 refund, 40 credits/clip). s16 (הטעימה — CU bite, closed eyes) failed Kling content moderation as SENSITIVE_RESULT; credits auto-refunded. All other clips + 4 as-is source clips (s03,s06,s08,s12) now in videos/. Need: either resubmit s16 with a less intimate framing/prompt, or drop it from the edit (s15 extends to cover).
**Update:** s16 retry succeeded (softer prompt: eyes open, cheerful bite, no closed-eyes/lips framing) — 520 credits total consumed for 13 clips (13×40, s16's first failed attempt was refunded). All 13 scenes now have video in `videos/`. Next: video-editor assembly (transitions, speed-ramps, on-screen text, music) per edit_notes in storyboard.json. Note: 3 as-is MOVs (s06,s08,s12) are 480×854, need upscale to 1080×1920 in the edit.

## 2026-09-11 | rosh-hashana | s13 recreated
User felt the original s13 (table still-life) didn't relate to the honey-journey story. New concept:
honey jar tips and streams down a desert sandstone ledge, rock hyrax watching, tumbleweed rolling,
fox ducking out of frame in the blur — bridges orchard (s08) and pomegranate DROP (s14) better.
User generated the Midjourney image from a prompt I wrote (--sref matched to set style), imported as
scenes/s13.jpg, re-uploaded and resubmitted to kling-video-v3_0 1080p 5s (40 credits). Succeeded on
first attempt. All 13/13 video scenes now complete. Running total: 560 credits consumed
(13 original + 1 regen, one earlier s16 attempt refunded).

## 2026-09-11 | rosh-hashana | s13 re-regenerated for energy
User feedback: kinetic-looking image but the first video render felt static/non-action, not fitting
the "can't stop watching" brief. Rewrote video_prompt for the same source image (fast whip-tracking
camera chasing a surging honey torrent, tumbleweed blasted across frame, hyrax bolting, fox flash-cut)
and resubmitted kling-video-v3_0 1080p 5s (40 credits). Succeeded. Running total: 600 credits consumed.

---

## 2026-10-08 | healing-hero | "The Thread of Light" — 14s silent hero background loop (Option B)
Input: `bambi/input/healing-hero/` (brief.md, inspiration_contact_sheet.jpg — Midjourney warm slit-light portraits;
Voiceover Script.txt used for tone only, NO VO in this deliverable).
4 scenes, 14.0s (3+3+4+4), 16:9 master safe for center 9:16 crop. Golden thread travels L→R face to face:
s1 Noa arrival → s2 Daniel first twist → s3 Kenji knot at sternum, then unwinds → s4 Amara release → 0.6s dissolve
back to s1 (seamless). Cuts on 60 BPM heartbeat at 3.0/6.0/10.0; heartbeat slows to ~45 BPM in s4, seam on beat at 14.0.
Cast: 5 anchors (noa F32, daniel M45 [contact-sheet look], kenji M28, amara F62, golden-thread element),
all `anchor_ready:false` → `bambi/cast/healing-hero/<id>.png`. Kling i2v 5s per shot, trim notes per scene;
top-level kling_settings / loop_plan / edit_notes / audio_notes (ambient pad in D + heartbeat timing).
Output: `bambi/outputs/healing-hero/2026-10-08-hero-loop/` — storyboard.json + storyboard.md + storyboard_grid.html.
No images/video generated.

## 2026-10-08 | surreal-ads | series v1 — 6 ads (perfume, coffee, f1, sneakers, headphones, chocolate)
New series mode: `build_series.py` + `series/surreal-product-ad/` (templates.json = single source of truth).
Locked signature: S1 Digital→Physical 0–4s · S2 Transformation 4–11s · S3 Hero 11–15s, 9:16, chained keyframes K0→K3
(first+last frame per stage via `generate-video.sh --end-frame`). All briefs: image_route=gpt, typography_mode=hybrid.
Output: `bambi/outputs/surreal-ads/2026-10-08-<slug>/` (storyboard + grid widget + production.md + midjourney_prompts.md
+ master_prompt.txt + text_layers.json) and `bambi/outputs/surreal-ads/index.html`. Brands are fictional placeholders.
No images/video generated yet — next: perfume pilot after approval.

## 2026-10-09 | surreal-ads | chocolate → CafeKar (pilot) — series v2 hyperreal
Brand renamed Obra Cacao → CafeKar. Pilot = chocolate (not perfume). look=hyperreal · drawn_mode=annotations · typography=hybrid ·
image_route=midjourney (user generates manually from midjourney_prompts.md → keyframes/k0–k3.png + bambi/cast/surreal-ads/chocolate-product.png).
Storyboard approved. MJ prompts now dedicated & short (76–119 words). All runs rebuilt under 2026-10-09-*; 10-08 empty runs removed.

## 2026-10-09 | surreal-ads | chocolate — brand renamed CafeKar → MELT; MJ keyframes received
User delivered 4 MJ keyframes (saved as k1–k4 → renamed k0–k3; order verified visually). Realism/palette approved.
QA: K0 screen text garbled ("Cédlo" logo, "MIELT 1"), K2 letters read ~"MIEÍT", K3 missing the bar (foil + pod only).
User chose to regenerate in MJ (Vary Region) → `midjourney_fixes.md`. Originals backed up in keyframes/_v1/.
No separate brand line in hero (brand = MELT, tagline MADE TO MELT already carries it).

## 2026-10-09 | surreal-ads | chocolate (MELT) — pilot complete
4-clip structure (macro_beat) produced in Kling MCP 3.0 with first+last frames → final.mp4 → final_typo.mp4 (MADE TO MELT + hand-drawn accents + grain). Lesson: the peak keyframe's letters must be spelled correctly — the video model degrades them further in motion.

## 2026-10-09 | surreal-ads | chocolate (MELT) — v2 keyframes via OpenAI (gpt-image route)
v1 (MJ keyframes + Kling clips + finals) archived to `_v1/` (replaced the older keyframes/_v1). New product anchor (gpt-image-2 high) — old "anchor" was a garbled MJ screen, moved to `bambi/cast/surreal-ads/_v1/`.
K0 gpt-image-2 t2i · K1/K2/K2b/K3 gpt-image-1.5 edits (input_fidelity) with refs [prev K, anchor] — one locked set (oak table, linen runner, plaster wall, window left) across all frames → fixes v1 set-jump. K2: 4 clean letters MELT. K3 re-done once (try1 off-center, small). 7 calls, quality=high.

## 2026-10-09 | surreal-ads | chocolate (MELT) — v2 delivered
`MELT_final.mp4` = OpenAI keyframes → Kling 3.0 clips → tagline layer (only contextual elements) → ElevenLabs music+SFX mix. v1 archived in `_v1/`.

## 2026-10-10 | surreal-ads | chocolate (MELT) — K3 bite continuity fix via Nano Banana 2 (Kling)
Kling MCP image_to_image `gemini-3.1-flash-image`, refs [K3, K2b], 2k 9:16 → 15 Kling credits (vs ~$0.25–0.30 OpenAI high). Result: composition identical, bite on same corner as K2b, drip kept. Old K3 → `_qa/k3_gpt_nobite.png`. Pending: re-run S4 (K2b→K3).
