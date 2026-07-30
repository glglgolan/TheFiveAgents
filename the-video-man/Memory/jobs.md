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
