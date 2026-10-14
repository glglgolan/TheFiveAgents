---
name: kinetic-typography
description: Animate text/typography over a finished video with maximum control — per-letter/word x/y/z/rotation/scale/blur/opacity keyframes with any GSAP ease, stagger and seeded scatter, real depth (CSS-3D perspective or lit three.js 3D letters), and true z-ordering BETWEEN scene elements (letters pass behind the product and come back in front) via a locally extracted product matte. Rendered with Remotion (CPU, no API cost). Use when the user wants animated/kinetic typography, a tagline or words that move with the script, text behind/around an object, 3D letters, or "add text to the video" — Hebrew: טיפוגרפיה מונפשת, טקסט שזז, אותיות תלת-ממד, טקסט מאחורי המוצר, להוסיף טקסט לסרטון. Used by the-video-man after assembly (e.g. the surreal-product-ad series).
---

# Kinetic Typography

שכבת טיפוגרפיה **נפרדת** שמורכבת מעל וידאו מוגמר — כל אות/מילה זזה חופשי לפי הסקריפט, כולל **z-index אמיתי בין אלמנטים**: אות יכולה לעבור **מאחורי** המוצר ולחזור **לפניו**.

הכל רץ מקומית: Remotion (React → MP4), matte עם rembg (ONNX/CPU), ffmpeg מובנה ב-venv. **אין עלות API.**

## מבנה השכבות

```
background → plate (final.mp4) → text_back → product_matte → text_front
```

- **plate** — הסרט המורכב (או still לבדיקות).
- **product_matte** — פריימי RGBA של המוצר בלבד (`extract_matte.sh`), מצויר מחדש מעל `text_back` → כך טקסט "נבלע" מאחורי המוצר.
- כל אות מקבלת `plane`: `back` / `front` / `auto` (`auto` = z<0 מאחור, z≥0 מלפנים) — ואפשר להחליף plane בכל keyframe.

## מנועים — פורמט נתונים אחד (`text_layers.json`), כמה renderers

| מנוע | שדה | מתי | הערות |
|---|---|---|---|
| **CSS-3D** (ברירת מחדל) | `engine: "css"` | כל Google Font, blur, צללים, glass/outline, perspective אמיתי | פונטים נטענים אוטומטית; מדידה דטרמיניסטית |
| **three.js** | `engine: "three"` | אותיות תלת-ממד אמיתיות — extrusion, bevel, תאורה | פונטים מ-`fonts/*.typeface.json`; הוספה: `scripts/make_3d_font.sh "Heebo" 800 heebo_black` (כולל עברית) |
| **GSAP** | `ease` בכל keyframe | כל ease של GSAP: `expo.out`, `back.out(2)`, `elastic.out(1,0.4)`, `bounce.out`, `steps(6)` | GSAP מחושב per-frame (seek), דטרמיניסטי |
| **ffmpeg** (venv) | `concat.sh`, `mux_audio.sh` | הרכבת קליפים (hard cuts), מוזיקה/VO | ffmpeg 7.1 מובנה ב-`imageio-ffmpeg` — **לא צריך brew** |
| **HyperFrames** (אופציונלי, חיצוני) | — | כשמעדיפים לכתוב סצנת HTML/CSS+GSAP שלמה ביד | קוד פתוח של HeyGen (Apache-2.0). לא מותקן כאן; מתקינים את ה-plugin הרשמי `hyperframes` אם רוצים. הפלט (MP4/WebM עם alpha) יכול לשמש כ-plate או overlay |

## Keyframes — שליטה מלאה

כל keyframe: `t` (שניות מ-`from` של השכבה) + כל שילוב של:

- **ברמת שכבה** (בלי stagger): `x, y` (0..1 מהפריים), `tracking` (em), `orbit` (מעלות), `ring` (0..1 מורף שורה→טבעת), `lrx/lry/lrz`, `lscale`, `lopacity`
- **ברמת אות/מילה** (עם stagger + scatter): `dx, dy, z` (px), `rx, ry, rz` (מעלות), `scale`, `opacity`, `blur`, `plane`
- `stagger: {each, from: start|end|center|edges|random, seed}` · `scatter: {at:[i], dx, dy, z, rx, ry, rz, scale, seed}` — היסטים אקראיים-זרועים לכל אות ב-keyframe מסוים
- `units: {"2": {keyframes:[...]}}` — מסלול פרטי לאות מסוימת
- `ring: {radius, tilt, arc, face}` — אותיות על טבעת תלת-ממדית סביב המוצר (עם `plane:auto` = עוברות מאחוריו)

סכמה מלאה: `schema/text_layers.schema.json`.

## ריאליזם + אלמנטים מצוירים

- **`grain`** (ברמת הקובץ): `{"amount": 0.12}` — גרעיניות פילם **רק על שכבות הטקסט/ציור** (seeded per frame), כדי שאותיות וקטוריות נקיות ישבו בתוך פוטג' לייב-אקשן היפר-ריאליסטי. ברירת מחדל בסדרה כש-`look: hyperreal`.
- **three.js:** `env` (ברירת מחדל on) — השתקפויות סביבה PBR (RoomEnvironment) + חומר Physical עם clearcoat, tone mapping ACES; `shadow_catcher: true` — צל אמיתי רך שהאותיות מטילות על מישור רקע.
- **שכבות ציור (`type: "draw"`)** — אלמנטים מצוירים ביד מעל הפוטג': `shape` מובנה (`underline, circle, arrow, sparkle, swoosh, star, scribble, bracket`) או `paths` משלך (SVG ב-viewBox 0..100). הקו "נכתב" stroke-אחר-stroke (`draw` 0..1), עם **`boil`** — רעד קו מצויר ב-12fps כמו אנימציה ידנית. גם הן על `plane` back/front — עיגול מצויר יכול להקיף את המוצר ולעבור **מאחוריו**. presets: `draw-on`, `draw-on-off`.

## Presets (`presets/*.json` — קבצי JSON רגילים, ניתנים לעריכה/הוספה)

| preset | מה עושה | שלב בסדרה |
|---|---|---|
| `emerge-from-screen` | אותיות עפות מתוך מישור המסך לכיוון המצלמה (z -900 → overshoot → מנוחה) | 1 |
| `orbit-behind-product` | המילה הופכת לטבעת ומקיפה את המוצר בתאוצה — עוברת **מאחוריו** ולפניו | 2 |
| `shatter-to-particles` | המילה מתפוצצת לאותיות מסתובבות שנעלמות | 2 (יציאה) |
| `assemble-tagline` | אותיות מפוזרות בתלת-ממד ננעלות לטאגליין עם expo settle + נשימה | 3 |
| `breathe` | fade-in עדין, scale ו-tracking נפתחים | 3 |
| `drop-with-gravity` | אותיות נופלות מלמעלה עם bounce פיזיקלי | כל שלב |

`preset_params` מחליף stagger/scatter/ring/plane; `keyframes` מפורשים מחליפים את ה-preset לגמרי.

## שימוש

```bash
# פעם אחת
bash .claude/skills/kinetic-typography/scripts/setup.sh

# 1. matte של המוצר מהסרט המורכב (מקומי, ~0.5–1.5s/פריים על ה-Intel Mac)
bash .claude/skills/kinetic-typography/scripts/extract_matte.sh "<run>/final.mp4" "<run>/matte/fg"

# 2. תצוגה מקדימה + כיוונון חי (Remotion Studio) — עדיף דרך preview_start "typo-studio" (launch.json)
bash .claude/skills/kinetic-typography/scripts/studio.sh "<run>"

# 3. still לבדיקת QA / רינדור מלא
bash .claude/skills/kinetic-typography/scripts/render.sh "<run>" --still 120
bash .claude/skills/kinetic-typography/scripts/render.sh "<run>"            # → <run>/final_typo.mp4

# עזרים
bash .claude/skills/kinetic-typography/scripts/concat.sh "<run>/final.mp4" s01.mp4 s02.mp4 s03.mp4
bash .claude/skills/kinetic-typography/scripts/mux_audio.sh "<run>/final_typo.mp4" music.mp3 "<run>/final_typo_audio.mp4"
```

`<run>` = תיקייה שמכילה `text_layers.json` (משמש כ-public dir של Remotion — `plate`/`matte` יחסיים אליה). `render.sh` בונה `<run>/.typo_props.json` (בודק שה-plate קיים וסופר פריימי matte).

**דמו עובד:** `demo/` — plate מצויר מקומית + matte + טבעת PINK שעוברת מאחורי הבקבוק, טאגליין מורכב עם קו תחתון מצויר, עיגול מצויר שמקיף את הבקבוק מאחוריו, sparkle, ROSÉ תלת-ממדי עם השתקפויות וצל, grain. `demo/contact_v2.png`.

## QA חובה לפני מסירה

1. `--still` בנקודות המפתח (כניסה, שיא ה-orbit, הטאגליין) — לבדוק איות, חיתוך בשולי הפריים (9:16 — `max_width` ≤ 0.86), ושה-matte חותך נקי.
2. matte: אם המוצר מהבהב בין פריימים — הגדל `--smooth` (0.5) או נסה `--model birefnet-general` (איטי יותר, מדויק יותר).
3. רינדור מלא → צפייה ב-grid של הסטוריבורד (סלוט `final_typo.mp4`).

## מגבלות ידועות

- three.js: אין blur פר-אות (מוחלף ב-fade); WebGL ב-headless דורש `--gl=angle` (מוגדר ב-render.sh; swiftshader נכשל על המכונה הזו).
- matte של rembg מפריד "אובייקט ראשי" — בסצנות עמוסות (שיא הטרנספורמציה) הוא עלול לכלול גם חלקיקים/אותיות אפויות. ב-stage 2 עדיף `plane:auto` רק כשהמוצר מבודד; אחרת להשאיר `front`.
- פונט CSS נטען מ-Google Fonts בזמן רינדור — דורש רשת.

## ScrollStory composition (used by `scroll-relay`)
The same Remotion project also hosts `ScrollStory`, a frame-accurate scrolling website (sections, scrubbed image sequences, words on back/front planes, shop cards, sticky nav). It is driven by `.claude/skills/scroll-relay/scripts/render_screen.sh`. Source: `templates/remotion/src/ScrollStory.tsx`.
