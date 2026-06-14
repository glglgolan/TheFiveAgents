---
name: openrouter-video-gen
description: Generate videos via OpenRouter Video API (async). Supports Kling 3.0 Standard, Seedance 2.0, and Seedance 2.0 Fast. Text-to-video or image-to-video with first-frame reference. Auto-derives aspect ratio from reference. Used by the-video-man agent.
---

# openrouter-video-gen

מעטפת ליצירת וידאו דרך ה-Video API של OpenRouter (async). שם הסקיל לא כולל `gpt` כי המודלים כאן הם של Kuaishou ו-ByteDance, לא OpenAI.

## מודלים נתמכים

| מודל | ID | מחיר משוער |
|---|---|---:|
| Kling 3.0 Standard | `kwaivgi/kling-video-3.0-standard` | ~$0.03–0.05/sec |
| Seedance 2.0 | `bytedance/seedance-2.0` | ~$0.10/sec |
| Seedance 2.0 Fast | `bytedance/seedance-2.0-fast` | ~$0.03/sec |

## שימוש

```bash
# בסיסי — text-to-video, 5 שניות, 16:9
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh \
    "<prompt>" \
    "<output>.mp4" \
    --model kwaivgi/kling-video-3.0-standard

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
    --model kwaivgi/kling-video-3.0-standard \
    --reference yuval/outputs/wedding_images/scene21.png
```

## פרמטרים

- `prompt` (positional, חובה) — תיאור הסצנה.
- `output` (positional, חובה) — נתיב mp4 פלט.
- `--model` (חובה) — אחד מהשלושה למעלה.
- `--duration` — שניות, ברירת מחדל `5`.
- `--aspect-ratio` — `16:9`/`9:16`/`1:1`. אם לא צוין:
  - יש `--reference` → נגזר אוטומטית מממדי התמונה.
  - אין → `16:9`.
- `--reference` — נתיב לתמונה (PNG/JPG). תקודד ל-base64 ותישלח כ-`image` ב-payload.

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
