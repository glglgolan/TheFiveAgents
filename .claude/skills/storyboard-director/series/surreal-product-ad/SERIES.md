# סדרה: Surreal Product Ad (v2 — היפר-ריאליזם)

ריל 9:16, 15 שניות, בשפה חזותית קבועה — כל פרסומת בסדרה מרגישה כחלק מאותה סדרה. ממלאים **brief** אחד → במבי מייצר סטוריבורד, פרומפטים, widget ותוכנית הפקה.

```bash
python3 .claude/skills/storyboard-director/scripts/build_series.py bambi/input/surreal-ads/<slug>/brief.json
python3 .claude/skills/storyboard-director/scripts/render_series_index.py bambi/outputs/surreal-ads   # אינדקס הסדרה
```

## החתימה (נעולה — זהה בכל פרסומת)

| | S1 — דיגיטלי → פיזי | S2 — טרנספורמציה | S3 — הירו |
|---|---|---|---|
| זמן | 0–4s | 4–11s | 11–15s |
| מצלמה | push-in ידני איטי לעבר הלפטופ | orbit + push, מאיץ | נבלמת ונועלת פריים סימטרי |
| Hook | **בשנייה הראשונה** המוצר כבר פורץ את זכוכית המסך | האותיות הופכות פיזיות, החומר מתמיר | הטאגליין חי בתוך הסצנה |
| Keyframes | K0 (אתר רגיל) → K1 (מוצר חצי בחוץ) | K1 → K2 (שיא) | K2 → K3 (הירו) |

**קבועים:** MacBook על שולחן אלון, צילום אנכי · בסיס קרם/בז' + **צבע מבטא של המותג** · אור יום רך, עומק שדה רדוד, grain עדין · טיפוגרפיה סריפית אדיטוריאלית ענקית · **loop rhyme** — הפריים של K3 מהדהד את K0 כדי שהריל יתנגן בלופ חלק (retention).

**שרשור keyframes:** הפריים האחרון של שלב N = הפריים הראשון של שלב N+1 → 3 קליפים עם `--reference` (first) + `--end-frame` (last) → hard cuts בלי קפיצות. זה מה שהופך 3 קליפים ל"טרנספורמציה רציפה אחת".

## משתני ה-brief

`brand, product, product_short, product_he, website, hero_word (≤6 אותיות), letter_material, emergence, transformation, transformation_he, particles, accent_color, accent_hex, text_hex, hero_shot, tagline` + אופציונלי: `device_setting, environment, tagline_integration, font_family, image_route, typography_mode, mj_style_ref, mj_product_ref, text_layers`. סכמה: `brief.schema.json`.

## Look — היפר-ריאליזם (ברירת מחדל מ-v2)

`look: "hyperreal"` — הסוריאליסטי קורה, אבל **כל חומר, אור ופיזיקה נראים מצולמים באמת**: ARRI Alexa 35 + Cooke 50mm + Laowa probe macro, עומק שדה אופטי אמיתי, מיקרו-פרטים (נקבוביות, סיבים, אבק באוויר), שבירת אור וקוסטיקה בזכוכית ונוזל, subsurface scattering, grain טבעי. negatives נוספים: no CGI/3D-render look, no plastic/waxy, no AI sheen, no oversaturation. MJ: `--style raw --s 50`. בשכבת הטיפוגרפיה: grain תואם + השתקפויות/צללים באותיות תלת-ממד. `look: "editorial"` = הלוק של v1.

## אלמנטים מצוירים — `drawn_mode`

| מצב | מה קורה | איפה |
|---|---|---|
| `none` | היפר-ריאליזם טהור | — |
| `sketch-to-real` | המוצר באתר הוא **סקיצה מצוירת ביד**; הקווים מתקלפים מהמסך ומתמצקים למוצר ההיפר-ריאליסטי — ציור → מציאות הוא ה-hook של S1 | אפוי ב-K0/K1/S1 + master |
| `annotations` | אקסנטים מצוירים מונפשים מעל הפוטג' (חץ, sparkles, קו תחתון לטאגליין) — נכתבים stroke-אחר-stroke עם boil | שכבת `kinetic-typography` (לא אפוי) |
| `both` | שניהם | |

`drawn_style` (למשל "warm graphite pencil sketch") · `drawn_hex` צבע קו האקסנטים.

## שני צירי בחירה לכל פרסומת

**`image_route`** — איך נוצרים ה-keyframes:
- `gpt` (ברירת מחדל) — יובל, `gpt-image-gen`, עם עוגן המוצר + ה-K הקודם כ-`--reference`. הפקודות ב-`production.md`.
- `midjourney` — ידני. `midjourney_prompts.md` נכתב **תמיד** (בכל route) עם פרומפט לכל K + שם קובץ מדויק לשמירה; גוררים ל-`keyframes/` ולוחצים ↻ ב-widget.

**`typography_mode`** — איפה הטקסט חי:
- `baked` — כל הטקסט בתוך התמונות. הכי "פיזי", הכי פחות גמיש.
- `hybrid` (מומלץ) — ה-hero_word אפוי (פיזי, חלק מהסצנה); הטאגליין מונפש בשכבת `kinetic-typography` (איות מובטח 100%).
- `layered` — אפס טקסט בתמונות; הכל מונפש (emerge → orbit מאחורי המוצר → assemble). שליטה מקסימלית.

## מקור הטמפלייטים

`templates.json` — **מקור האמת היחיד**: visual_theme, negatives, 3 השלבים (`video_prompt` + תיאור עברי), 4 ה-keyframes (`image_prompt`), וה-master prompt. כל `{{var}}` חסר מפיל את ה-build (כדי שטעויות לא יעברו בשקט). לשינוי חתימת הסדרה — עורכים רק כאן ומריצים מחדש את כל ה-briefs.

## תוצרים לכל פרסומת — `bambi/outputs/surreal-ads/<date>-<slug>/`

| קובץ | תפקיד |
|---|---|
| `storyboard.json` / `.md` | 3 שלבים + בלוק `series` (keyframes, routes, brief) |
| `storyboard_grid.html` | widget חי: עוגן + K0–K3, כרטיס לכל שלב (first → last → video), מסלול טיפוגרפיה, סלוטי final |
| `production.md` | כל הפקודות לפי הסדר (עוגן → K0–K3 → 3 קליפים → concat → matte → typography) |
| `midjourney_prompts.md` | מסלול ידני |
| `master_prompt.txt` | גרסת one-shot (קליפ אחד של 15s) — להשוואה זולה |
| `text_layers.json` | שכבות הטיפוגרפיה (נגזר מ-`typography_mode`; ניתן לעריכה חופשית) |

## מודלי וידאו (פריים ראשון + אחרון)

נבדק מול `GET /api/v1/videos/models` ב-2026-10-08: `kwaivgi/kling-v3.0-pro` (מומלץ, 3–15s), `bytedance/seedance-2.0` (4–15s), `minimax/hailuo-3` (5–15s — S1/S3 של 4s צריכים 5s), `google/veo-3.1` (4/6/8s). נתיב חלופי (נבחר בפיילוט MELT, 2026-10-09): **Kling MCP** — `image_to_video` עם `kling-video-v3_0`, `first_image` + `tail_image` (העלאה דרך `file_upload`), משכים 3–15s, `prefer_multi_shots=false`, `enable_audio=false`; ~8 קרדיטים לשנייה ב-1080p.

**לקח מהפיילוט:** אותיות ב-keyframe השיא חייבות להיות מאויתות נכון — מודל הווידאו רק מחמיר אותן בתנועה. אם כל השכבות `front` — אין צורך ב-`extract_matte.sh`.

## הדוגמאות בסדרה

perfume (PINK, both) · coffee (GRIND, sketch-to-real) · f1 (FAST, none) · sneakers (LIGHT, annotations) · headphones (HEAR, none) · chocolate (MELT, annotations) — כולן `look: hyperreal` — `bambi/input/surreal-ads/*/brief.json`. המותגים פיקטיביים (placeholders); מחליפים ב-brief.

## לקחים מפיילוט MELT v2 (2026-10-09)

- **מסלול gpt עדיף לרמת סוכנות:** gpt-image-2 ל-K0 + עוגן מוצר (טקסט מדויק), gpt-image-1.5 edits עם `[K קודם, עוגן]` לשאר — סט אחד נעול (שולחן/מפה/קיר/חלון) לאורך כל הפריימים. MJ שבר רציפות סט ואיות.
- **אלמנטים של Remotion לא "צפים" בלי הקשר:** כל שכבה חייבת להיות מעוגנת למשהו בתמונה. אסור חצים/sparkles במיקום קבוע מעל מצלמה בתנועה. הטאגליין נכנס רק אחרי שהמצלמה נעצרת, על אזור ריק.
- **סאונד:** ElevenLabs music + SFX (MCP creative). מוזיקה לא מצייתת למבנה זמנים בפרומפט — עורכים (cut + reprise מאותו טרק). SFX מסונכרנים לתנועה מדודה (frame-diff). מיקס לשחזור: `<run>/audio/mix.sh`. fade-in של 50ms בתחילת המוזיקה (AAC overshoot).

### Sound v4 lessons (MELT, 2026-10-10)
- Never master with single-pass `loudnorm` — it behaves as an AGC and pumps the music under every SFX. Use `audio/v4/mix_v4.py` pattern: static gain → true-peak limiter.
- Hybrid sound = code score stems (composer subagent, frame-locked to CUES.md) + physically-described SFX (one prompt per on-screen action, 2 takes, pick by analysis) + air/whoosh loudness driven by optical-flow motion of the picture.
- Write `audio/v4/CUES.md` (second-by-second event map) first; both composer and mixer work from it.


## Production playbook — MELT level (from 2026-10-10, the default for every new ad)

User's verdict on MELT v4: "this is the level I'm talking about". Every new ad follows this order (all of it is in each run's `production.md`):

| # | Step | Tool | Cost |
|---|---|---|---|
| 1 | brief → `build_series.py` (4 clips 4/4/3/4 + macro, gpt route) → **approval** | Bambi | free |
| 2 | product anchor (gpt-image-2) + K0–K3 + K2b (gpt-image-1.5 edits with `[previous K, anchor]`) | Yuval | ≈ $2 |
| 3 | **continuity QA** for every K pair (bite, damage, product side, props). Fix with Nano Banana 2 via Kling | Reuven | 15 credits per fix |
| 4 | 4 clips with Kling MCP v3.0, first+tail, no audio | the-video-man | ≈ 120 credits |
| 5 | concat → code FX (`cinematic-finish/fx_edit.py`) | the-video-man | free |
| 6 | anchored typography (`kinetic-typography`) | the-video-man | free |
| 7 | hybrid sound: CUES, then the composer subagent, then realistic SFX, then the mix | the-video-man | ≈ $0.10 |

Always show the cost and wait for approval before every paid step. Full details: `.claude/skills/cinematic-finish/SKILL.md`.


## Relay + reveal cadence + exploded view (from the enkywebstudio decode, 2026-10-10 — mandatory from the next ad)
The user felt something still missing in MELT: downward continuity, moving elements, the machine opening into its parts, and a new reveal every moment. The full decode is in `.claude/skills/scroll-relay/reference/DECODE-enky-coffee.md`. For every new ad, Bambi adds:
1. **Relay chain:** the output object of stage N = the input object of stage N+1, in one direction (gravity, down). Write it at the top of storyboard.md, e.g. `bar → (breaks out) → bar falls → melts → river → letters → drip → macro → wrapper`.
2. **Exploded-view beat:** the product opens along its axis into floating parts, e.g. sleeve, foil and squares separating with gaps. It gets its own keyframe (K_exploded, a gpt edit "exploded view of the SAME product…"), and the opened product emits the next matter.
3. **Reveal cadence:** a reveal-per-second table (≤0.7s between new elements). A gap > 0.8s gets a fix (a part, a word, a particle, a prop).
4. **Type interleave:** giant editorial words between or behind the parts (kinetic-typography `plane: back` + matte, anchored, no floating).

Alternative format for the same series: **scroll-relay**, a locked laptop shot with the scrolling website on screen (skill `scroll-relay`). Choose per brief: `format: "breakout"` (MELT) | `"scroll-relay"`.
