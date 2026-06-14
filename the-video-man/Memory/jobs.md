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
