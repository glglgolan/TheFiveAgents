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
