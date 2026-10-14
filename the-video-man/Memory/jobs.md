# the-video-man — לוג עבודות וידאו

זיכרון מתמשך של כל הקליפים שיצרתי. לפני יצירה חדשה אני בודקת `Grep` על הקובץ הזה כדי לזהות עבודות חוזרות.

**פורמט entry:**

```markdown
## YYYY-MM-DD HH:MM | <project> | <slug>
**מודל:** <openrouter model id>
**משך:** <D>s | **AR:** <16:9/9:16/1:1> | **רפרנס:** [✓/—]
**קובץ:** [outputs/<project>/<file>.mp4](../outputs/<project>/<file>.mp4)
**prompt:** <שורה אחת ראשונה של ה-prompt>
**עלות משוערת:** $<cost>
---
```

---

## 2026-05-18 22:16 | wedding | scene11-meat-scientist-v3 (first_frame_image fix)
**מודל:** bytedance/seedance-2.0
**משך:** 5s | **AR:** 16:9 | **רפרנס:** ✓ (first_frame_image)
**קובץ:** [outputs/wedding/2026-05-18-scene11-meat-scientist-v3.mp4](../outputs/wedding/2026-05-18-scene11-meat-scientist-v3.mp4)
**prompt:** Starting from this exact frame: Hanan slowly raises the knife and slices through the brisket...
**עלות בפועל:** $0.7560
**הערה:** תיקון באג — שימוש ב-first_frame_image במקום image. job_id: W0vMSLciLV9WFUksTZGr
---

## 2026-05-18 22:09 | wedding | scene11-meat-scientist (retry with reference)
**מודל:** bytedance/seedance-2.0
**משך:** 5s | **AR:** 16:9 | **רפרנס:** ✓
**קובץ:** [outputs/wedding/2026-05-18-scene11-meat-scientist-test.mp4](../outputs/wedding/2026-05-18-scene11-meat-scientist-test.mp4)
**prompt:** Slow cinematic dolly-in toward the BBQ setup. Thick warm smoke billows upward from both smokers...
**עלות בפועל:** $0.7560
**הערה:** ניסיון חוזר עם תמונת רפרנס (reference=✓). job_id: jNONTkVQpf4ufIuDu9LL
---

## 2026-05-18 21:59 | wedding | scene11-meat-scientist
**מודל:** bytedance/seedance-2.0-fast
**משך:** 8s | **AR:** 16:9 | **רפרנס:** ✓
**קובץ:** [outputs/wedding/2026-05-18-scene11-meat-scientist.mp4](../outputs/wedding/2026-05-18-scene11-meat-scientist.mp4)
**prompt:** Slow cinematic dolly-in toward the BBQ setup. Thick warm smoke billows from both smokers...
**עלות בפועל:** $0.97
**הערה:** Seedance Fast עלה יותר מהמשוער (~$0.12/sec ולא $0.03). job_id: lSNlPm0ANXH2ATKbueKv
---

## 2026-07-14 09:49 | Raz Bar Mitzva | s01-snow-ofra
**מודל:** Kling (MCP) — kling-video-v2_5
**משך:** 5s | **AR:** 16:9 | **רפרנס:** ✓ (first frame s01.png)
**קובץ:** [outputs/Raz Bar Mitzva/2026-07-14-s01-snow-ofra.mp4](../outputs/Raz%20Bar%20Mitzva/2026-07-14-s01-snow-ofra.mp4)
**prompt:** Slow cinematic aerial drift over a snow-dusted hilltop town, snowflakes floating gently past the lens...
**generation_id:** AWfDrZIqPf4KNEHExvamihmATAiSfJ8D_6nXlSvbuuwrfYvR1I7tExMoLwztmArmM5MqJtWR
**עלות:** 25 credits (חשבון Kling, לא OpenRouter)
---

## 2026-07-14 11:17 | Raz Bar Mitzva | s22-soccer-to-basketball
**מודל:** Kling (MCP) — kling-video-v3_0 (first/tail keyframe interpolation)
**משך:** 15s | **AR:** 16:9 | **רפרנס:** ✓ (first=s22_A.png, tail=s22_B.png) | **1080p** | audio off
**קובץ:** [outputs/Raz Bar Mitzva/2026-07-14-s22-soccer-to-basketball.mp4](../outputs/Raz%20Bar%20Mitzva/2026-07-14-s22-soccer-to-basketball.mp4)
**prompt:** The teen strikes the soccer ball with power at ground level, then the motion carries him upward into a soaring basketball layup...
**generation_id:** ARpTELzVaCJ47uqE4VShawkdFB4Eu1X7W3kkDWTongajBWX-qISXw0Iadpt-Mn2PhvcTTtOb
**עלות:** 120 credits (חשבון Kling, לא OpenRouter)
---

## 2026-07-14 11:46 | Raz Bar Mitzva | s24-surf-dropin-to-carve
**מודל:** Kling (MCP) — kling-video-v3_0 (first/tail keyframe interpolation)
**משך:** 14s | **AR:** 16:9 | **רפרנס:** ✓ (first=s24_A.png, tail=s24_B.png) | **1080p** | audio off
**קובץ:** [outputs/Raz Bar Mitzva/2026-07-14-s24-surf-dropin-to-carve.mp4](../outputs/Raz%20Bar%20Mitzva/2026-07-14-s24-surf-dropin-to-carve.mp4)
**prompt:** The teen drops in at the top of the turquoise wave, then drives down and carves hard across its glassy face...
**generation_id:** Acm5TdEDttxSzFkXk_3Yqr4tV1S6YOHu8p1Bgaa_Suyx3B7FtNtPCpL6Ao5XhA3qDjcI0GmE
**עלות:** 112 credits (חשבון Kling, לא OpenRouter)
---

## 2026-07-14 12:17 | Raz Bar Mitzva | s24-surf-dropin-to-carve (re-render, swimwear v2)
**מודל:** Kling (MCP) — kling-video-v3_0 (first/tail keyframe interpolation)
**משך:** 14s | **AR:** 16:9 | **רפרנס:** ✓ (first=s24_A.png, tail=s24_B.png — swimwear + real face) | **1080p** | audio off
**קובץ:** [outputs/Raz Bar Mitzva/2026-07-14-s24-surf-dropin-to-carve.mp4](../outputs/Raz%20Bar%20Mitzva/2026-07-14-s24-surf-dropin-to-carve.mp4) (overwrote previous)
**prompt:** The teen drops in at the top of the turquoise wave, then drives down and carves hard across its glassy face...
**generation_id:** AZ9OjyTR7xJ-MvxdBOWEvc0c-2c2YN6ykOCYcCG-swiQQAQgq1PezlUmI5c8SFdyAhLP_lki (מחליף Acm5TdED...)
**עלות:** 112 credits (חשבון Kling, לא OpenRouter)
---

## 2026-07-14 12:22 | Raz Bar Mitzva | s25-portal-newzealand
**מודל:** Kling (MCP) — kling-video-v3_0_turbo (single-image image-to-video)
**משך:** 10s | **AR:** 16:9 | **רפרנס:** ✓ (first=s25_B.png) | **1080p** | audio off
**קובץ:** [outputs/Raz Bar Mitzva/2026-07-14-s25-portal-newzealand.mp4](../outputs/Raz%20Bar%20Mitzva/2026-07-14-s25-portal-newzealand.mp4)
**prompt:** Raz strides through the glowing blue portal into the New Zealand landscape, teleportation sparkles swirling...
**generation_id:** AU3ZQZMbtKqO1U8tIRyNK-9dkMU4AdytFWR6AnxMmqvEq2hg-rZdrik5-CLDlcf6NwOGJ2VV
**עלות:** 100 credits (חשבון Kling, לא OpenRouter)
---

## 2026-07-14 12:24 | Raz Bar Mitzva | s27-finale
**מודל:** Kling (MCP) — kling-video-v3_0_turbo (single-image image-to-video)
**משך:** 15s | **AR:** 16:9 | **רפרנס:** ✓ (first=s27_faceswap_raw.png) | **1080p** | audio off
**קובץ:** [outputs/Raz Bar Mitzva/2026-07-14-s27-finale.mp4](../outputs/Raz%20Bar%20Mitzva/2026-07-14-s27-finale.mp4)
**prompt:** The family gathers warmly around Raz at golden hour — gentle smiles and small natural movements...
**generation_id:** AVyn1SPEUmI7F13sGplp2bu9YfZcRndCMYdVeOfTQmnGeBq96lChRCQUyMoQmVizSMiFlbwL
**עלות:** 150 credits (חשבון Kling, לא OpenRouter)
---

---
## 2026-07-25 · shuki "אבא אדמה" — סצנות 1-5 (Kling MCP)
מודל: kling-video-v3_0 · 720p (Standard) · enable_audio=false · prefer_multi_shots=false · imageCount=1
first_image = פריימים s01-s05 שהועלו ל-Kling. אורכים מדויקים (v3 תומך 3-15s): s01=8s, s02=6s, s03=7s, s04=10s, s05=6s.
קרדיטים בפועל: 48+36+42+60+36 = **222** (≈6 קרדיט/שנייה ב-720p). יתרה לפני: 3021.
פלט: bambi/outputs/shuki/2026-07-24-aba-adama/videos/s01-05.mp4 (הורדו ללא watermark; URLs פגים תוך 24ש').
הערה: נתיב Kling MCP ישיר (לא OpenRouter). המשך: סצנות 6-18.

## 2026-07-25 · shuki "אבא אדמה" — סצנות 6-18 (Kling MCP)
kling-video-v3_0 · 720p · enable_audio=false · prefer_multi_shots=false · אורכים מדויקים 6-10s.
קרדיטים: 606 (48/42/36/48/42/48/42/48/48/54/48/42/60). סה"כ פרויקט 828.
פלט: videos/s06-s18.mp4 (ללא watermark). כל 18 הסצנות הושלמו כווידאו. משך וידאו כולל ~138ש'.

## 2026-07-25 · shuki "אבא אדמה" — הרחבות s19-s21 (Kling MCP)
נוספו 3 שוטים לכיסוי טוב יותר של הקריינות: s19+s20 = הרחבת "האדמה מדברת" (הגעה לפני זריחה עם עקבות זוהרות; שתילת זרעים+טפטוף), s21 = המשך אורביט (תירס להזנת פרות + מרבדי שקדים בפריחה).
kling-video-v3_0 · 720p · no audio · s19=8s s20=8s s21=10s. קרדיטים 156 (48/48/60). סה"כ פרויקט 984.
פלט: scenes/s19-21.png + videos/s19-21.mp4. סה"כ 21 סצנות.

## 2026-09-30 | code-film / maison-bouledogue — סרט אנימציה של דקה, 100% קוד (ללא מודלים גנרטיביים)
Remotion 4 + SVG, רינדור CPU בלבד (`--gl=swiftshader`, 16 דק' ל-1440 פריימים 1080p). קולות: macOS `say` קלאסיים; מוזיקה/SFX מסונתזים ב-numpy; ליפסינק מ-CMUdict (ללא ML).
צוות: 13 סוכנים (5 riggers, 2 set painters, voice, composer, SFX, 3 shot animators).
מקור: `code-film/maison-bouledogue/` · פלט: `outputs/code-film/2026-09-30-maison-bouledogue.mp4`

## 2026-10-09 | surreal-ads | chocolate (MELT) — 4 first+last-frame clips via Kling MCP
Method: Kling MCP `image_to_video`, model `kling-video-v3_0`, 1080p, `tail_image` = next keyframe, `prefer_multi_shots=false`, `enable_audio=false`.
Clips: s01 k0→k1 4s · s02 k1→k2 4s · s03 k2→k2b 3s · s04 k2b→k3 4s → 1076×1924 24fps. Cost: 120 Kling credits (32+32+24+32), ~2.5 min parallel.
Assembly: `concat.sh` → `final.mp4` (15s) → kinetic-typography (all layers `front`, no matte needed) → `final_typo.mp4` 1080×1920, 15s, render 1:56.
QA: chaining clean, MELT legible in S1/S3/S4. S2 peak: letters drift to "MET"/"MEIT" (inherited from k2 + fast motion).
Output: `bambi/outputs/surreal-ads/2026-10-09-chocolate/{videos/s01–s04.mp4, final.mp4, final_typo.mp4}`

## 2026-10-09 | surreal-ads | chocolate (MELT) — v2 clips (OpenAI keyframes)
Same settings as v1 (Kling MCP kling-video-v3_0, first+tail, 1080p, no audio, 4/4/3/4s), 120 credits. One locked set end-to-end; letters MELT clean in S2. Weak spot: S3 dive has a brief smeared morph (k2→k2b composition gap). Typo fixes: tagline 96px/700 single line (max_width 0.98, y 0.14), arrow moved to wall (lrz 55). v1 in `_v1/`.

## 2026-10-09 | surreal-ads | chocolate (MELT) — v2 sound design + final master
ElevenLabs (creative MCP) flow `ipMvq130IAgH05at1Fvj`: music `eleven_music_v2_5` 15s instrumental ×2 + SFX `eleven_text_to_sound_v2` ×6 (crack, whoosh, pour, drip, foil, logo hit) ×2 ≈ $0.24.
Music did NOT follow the requested 0-8 build / 8 drop / 11 resolve structure (both takes fade out after ~10s) → edited: music_a 0–8s, faint 8–11 tail (silence beat), music_a 0–4s reprise at 11s.
SFX synced to measured motion (frame-diff): crack 2.27, fly-by 5.08, pour 5.4–7.95, dive 9.4, drip ~10.5, foil ~11.9, logo hit 13.4.
Typography (user rule: no Remotion elements floating without context): removed arrow + sparkles; tagline starts 12.8 only after the camera settles, restrained scatter.
AAC overshoot gotcha: hard downbeat at t=0 → +0.4 dBTP; fixed with 50ms fade-in. Final −16.4 LUFS / −1.8 dBTP.
Output: `bambi/outputs/surreal-ads/2026-10-09-chocolate/MELT_final.mp4` (mix: `audio/mix.sh`).

## 2026-10-10 | surreal-ads | chocolate (MELT) — v3 finishing: bite fix + code FX
- K3 bite fix via Nano Banana 2 (Kling image_to_image, 15 credits) → S4 re-run (32 credits); bite stays on the left corner to the end.
- `fx/fx_edit.py` (system python3 + cv2, no generative models): DIS optical-flow speed ramp (0.4x 2.30–3.30s, ramp into S2), impact at 2.29s (punch-in, shake, flash, CA, radial blur), 34 Voronoi glass shards from the measured crack point (60% carry the screen image, 40% refract the plate; perspective, tumble, defocus, motion blur, glints), whip-pan 8.75–9.20 over the S3 morph + slow clean macro, global grade (warmth, s-curve, halation, vignette, grain). Full render ~6 min.
- Audio: synthesized sub-boom + reversed whoosh swell into the crack; whip whoosh moved to 8.95. −17.7 LUFS / −1.9 dBTP.
- Gotchas: v2 clips are 2:3 (1176×1764) because the keyframes were 2:3 → concat/fx crop to 9:16. Clear-glass shards over a similar background are invisible → shards must carry screen pixels + strong edges.
- Output `MELT_final.mp4`; previous version in `_v1/MELT_final_v2a.mp4`.

## 2026-10-10 — MELT v4 sound (hybrid score + realistic SFX)
- Fix: v3 music "dipped under every whoosh" = single-pass `loudnorm` (dynamic AGC) on the master. v4 = static gain + look-ahead true-peak limiter (`audio/v4/mix_v4.py`); limiting only on the 2.29 impact.
- Score: composer subagent (Sonnet) → `audio/v4/score/compose_melt.py`, 6 frame-locked stems (tension/impact/drive/slowmo/whip/resolve), Db major, verify.py onsets ±0.1ms.
- SFX: 13 physically-specific ElevenLabs SFX ×2 takes ($0.10), picked by transient/envelope analysis; air sounds ride picture motion (`_qa/snd/motion.npy`); impact tail varispeed 0.5x for slow-mo.
- Organic layer: music_a 7.5–9.9s on the 9.20 downbeat.
- Out: `MELT_final.mp4` −14.7 LUFS / −1.5 dBTP. v3 kept as `_v1/MELT_final_v3.mp4`.
