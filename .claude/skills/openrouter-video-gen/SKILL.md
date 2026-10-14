---
name: openrouter-video-gen
description: Generate videos via OpenRouter Video API (async). Supports Kling v3.0 Pro, Seedance 2.0 family (2.0 / Fast / Mini), FLUX.3 Video, and MiniMax H3. Text-to-video or image-to-video with reference image (sent via input_references). Auto-derives aspect ratio from reference. Used by the-video-man agent as the OpenRouter pathway (alongside an optional Kling-via-MCP pathway).
---

# openrouter-video-gen

מעטפת ליצירת וידאו דרך ה-Video API של OpenRouter (async). שם הסקיל לא כולל `gpt` כי המודלים כאן הם של Kuaishou ו-ByteDance, לא OpenAI.

> הערה: קיים גם נתיב חלופי ל-Kling דרך MCP server (`klingai`, לא דרך הסקיל הזה) —
> ראה `.claude/agents/the-video-man.md` לפרטים. סקיל זה נשאר ה-fallback הקבוע
> ונתיב ברירת המחדל כשה-MCP אינו מחובר.

## מודלים נתמכים

מחירים מאומתים ישירות מול openrouter.ai/models ב-2026-08-20 (לא הערכה).

| מודל | ID | מחיר |
|---|---|---:|
| Kling v3.0 Pro | `kwaivgi/kling-v3.0-pro` | ~$0.05/sec |
| Seedance 2.0 | `bytedance/seedance-2.0` | $0.06726/sec |
| Seedance 2.0 Fast | `bytedance/seedance-2.0-fast` | $0.04035/sec |
| Seedance 2.0 Mini | `bytedance/seedance-2.0-mini` | $0.01345/sec (**60% הנחה זמנית** — לבדוק שוב לפני הרצות גדולות, ההנחה עלולה לפוג) |
| FLUX.3 Video | `black-forest-labs/flux-3-video` | $0.17/sec ב-720p, עד $0.53/sec ב-1080p continuation. תומך first+last frame ואודיו מסונכרן. ⚠️ זמינות 67% ב-3 ימים אחרונים — מודל חדש/לא יציב, לצפות לכשלים |
| MiniMax H3 | `minimax/hailuo-3` | $0.13/sec. תומך first+last frame, video-to-video motion transfer. זמינות 92.7% |

**LTX Video אינו זמין ב-OpenRouter** (נבדק 2026-08-20, אין תוצאה בקטלוג).

## שימוש

```bash
# בסיסי — text-to-video, 5 שניות, 16:9
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh \
    "<prompt>" \
    "<output>.mp4" \
    --model kwaivgi/kling-v3.0-pro

# עם משך מותאם ו-aspect ratio
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh \
    "<prompt>" \
    "<output>.mp4" \
    --model bytedance/seedance-2.0 \
    --duration 10 \
    --aspect-ratio 9:16

# עם רפרנס (image-to-video) — AR ייגזר אוטומטית מהתמונה
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh \
    "<prompt>" \
    "<output>.mp4" \
    --model kwaivgi/kling-v3.0-pro \
    --reference yuval/outputs/wedding_images/scene21.png

# פריים ראשון + פריים אחרון (interpolation) — לשרשור keyframes רציף
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh \
    "<prompt>" \
    "<output>.mp4" \
    --model kwaivgi/kling-v3.0-pro \
    --reference keyframes/k0.png \
    --end-frame keyframes/k1.png
```

## פרמטרים

- `prompt` (positional, חובה) — תיאור הסצנה.
- `output` (positional, חובה) — נתיב mp4 פלט.
- `--model` (חובה) — אחד מהשלושה למעלה.
- `--duration` — שניות, ברירת מחדל `5`.
- `--aspect-ratio` — `16:9`/`9:16`/`1:1`. אם לא צוין:
  - יש `--reference` → נגזר אוטומטית מממדי התמונה.
  - אין → `16:9`.
- `--reference` — נתיב לתמונה (PNG/JPG). תקודד ל-base64 data URL ותישלח כ-`input_references: [{type: "image_url", image_url: {url: ...}}]` ב-payload (הפורמט הרשמי של OpenRouter, לפי cookbook: reference-to-video).
- `--end-frame` — נתיב לתמונת **פריים אחרון**. כשקיים, הבקשה נשלחת כ-`frame_images` (`frame_type: first_frame` מ-`--reference` + `frame_type: last_frame`) במקום `input_references`. דורש מודל שמופיע עם `"last_frame"` ב-`supported_frame_images` (`curl https://openrouter.ai/api/v1/videos/models`). נבדק 2026-10-08 — תומכים: Kling v3.0 Pro/Std, Kling O1, Seedance 2.0 / Fast / Mini / 2.5, Hailuo 3 / 3-max, FLUX.3 Video, Veo 3.1, Wan 2.7. לא תומכים: Grok Imagine, Runway Gen-4.5, Wan 3.0, HappyHorse. משמש את סדרת `surreal-product-ad` (שרשור K0→K1→K2→K3).

## Flow פנימי

1. `POST /api/v1/videos` עם prompt + פרמטרים → מקבל `job_id`.
2. `GET /api/v1/videos/<job_id>` כל 5 שניות עד `status: completed` (timeout 600s).
3. `GET <video_url>` → MP4.
4. כתיבה לדיסק.

## טיפול בכשלים

- **401** → "OPENROUTER_API_KEY פג או לא תקין. חידוש ב-https://openrouter.ai/keys".
- **Job failed** → מציג את התגובה המלאה.
- **Timeout (10 דק')** → מדפיס את ה-job_id כדי שאפשר יהיה לבדוק ידנית.
- **Polling 5xx זמני** → ממשיך לנסות, לא נופל מיד.

## תלויות

stdlib בלבד (`urllib`, `json`, `base64`, `struct`). אין `requests` ואין PIL.
קריאת ממדי PNG/JPG נעשית ידנית מ-headers.
