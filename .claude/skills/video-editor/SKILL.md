---
name: video-editor
description: Use when the user wants to EDIT or ASSEMBLE generated clips into a finished film — join shots with smooth transitions (crossfade/dissolve/wipe), retime clips to fit a voiceover, mux narration + background music with ducking, add fades, captions (incl. Hebrew RTL), color/format normalization, and export a professional MP4. Wraps ffmpeg with a plan-driven orchestrator plus standalone recipes. Used by the "the-video-man" agent after per-scene clips exist.
---

# Video Editor (ffmpeg)

Turns a folder of per-scene clips (e.g. `bambi/outputs/<project>/<run>/videos/sNN.mp4`) into a
finished, professionally edited film: **smooth transitions**, **speed-matching to a voiceover**,
**narration + music mixing with ducking**, fades, captions, normalization, and a clean H.264 export.

Two ways to use it:
1. **Plan-driven (recommended)** — describe the whole edit in one `edit_plan.json` and run
   `assemble.py`. It normalizes every clip, applies per-clip speed, chains xfade transitions,
   builds the audio bed, and exports the final file in one shot.
2. **Standalone recipes** — copy a single ffmpeg command below for a one-off need (trim, caption,
   GIF, loudness, upscale…).

## Requirements

- **ffmpeg + ffprobe ≥ 4.3** (xfade/acrossfade/sidechaincompress/loudnorm). Check: `ffmpeg -version`.
  Install on macOS:
  ```bash
  brew install ffmpeg
  ```
- `python3` (stdlib only) for the scripts.
- For Hebrew RTL captions: a Hebrew-capable TTF (e.g. from `fonts/outputs/…` or system `Arial`).

## Quick start

```bash
# 1) Generate a starter plan from a storyboard + its rendered clips
python3 .claude/skills/video-editor/scripts/build_plan_from_storyboard.py \
  "bambi/outputs/shuki/2026-07-24-aba-adama/storyboard.json" \
  --videos-dir "bambi/outputs/shuki/2026-07-24-aba-adama/videos" \
  --out "bambi/outputs/shuki/2026-07-24-aba-adama/edit_plan.json" \
  --transition fade --transition-dur 0.6

# 2) (optional) point the plan's audio.voiceover / audio.music at real files, set fit_to_audio:true
# 3) Render the final film
python3 .claude/skills/video-editor/scripts/assemble.py \
  "bambi/outputs/shuki/2026-07-24-aba-adama/edit_plan.json"
```

## edit_plan.json schema

```jsonc
{
  "output": "…/final.mp4",           // required
  "resolution": "1280x720",           // canonical WxH all clips are scaled+padded to (720p default)
  "fps": 24,                          // canonical fps
  "fit_to_audio": false,              // true → uniformly retime clips so film length == voiceover length
  "video_fade_in": 1.0,               // seconds (0 to disable)
  "video_fade_out": 1.5,
  "clips": [
    {
      "src": "…/s01.mp4",
      "speed": 1.0,                   // 2.0 = twice as fast, 0.5 = slow-mo (video setpts + audio atempo)
      "trim_start": 0.0,              // seconds into the source
      "trim_end": null,               // seconds (null = to end)
      "transition": { "type": "fade", "duration": 0.6 }  // transition INTO the next clip
    }
    // … last clip's transition is ignored
  ],
  "audio": {                          // omit for a silent film
    "voiceover": "…/vo.wav",          // optional
    "music": "…/music.mp3",           // optional
    "vo_gain_db": 0,
    "music_gain_db": -16,
    "duck": true,                     // sidechain-compress music under the voiceover
    "loudnorm": true,                 // EBU R128 normalize the final mix (broadcast-safe)
    "audio_fade_out": 2.0
  },
  "export": { "codec": "libx264", "crf": 18, "preset": "slow" }  // crf 18≈visually lossless, 23 default
}
```

`assemble.py` stages: **normalize** each clip (scale→pad to `resolution`, set `fps`, `setsar=1`,
`format=yuv420p`, apply `trim_*` and `speed`) → **xfade-chain** with per-boundary transition/offset
math → **audio bed** (VO+music mix, optional ducking + loudnorm + fade) → **mux + final fades +
export** (`+faststart` for web). It works on silent clips (our Kling clips have no audio) by treating
the xfade output as the video and the VO+music mix as the whole soundtrack.

### `fit_to_audio`
Uniformly retimes clips so the finished film matches the voiceover exactly. With clip source
durations `Σdur`, transition overlaps `Σtrans`, and voiceover length `V`, the speed factor is
`s = Σdur / (V + Σtrans)`. Every clip is retimed by `s` (its own `speed` still multiplies on top).

## Transition types (xfade)

`fade` (crossfade, default), `fadeblack`, `fadewhite`, `dissolve`, `wipeleft`/`wiperight`/`wipeup`/
`wipedown`, `slideleft`/`slideright`/`slideup`/`slidedown`, `smoothleft`/`smoothright`,
`circleopen`/`circleclose`, `radial`, `diagtl`, `pixelize`, `hlslice`, `distance`. A short `fade`
(0.4–0.8s) is the safe cinematic default; reserve wipes/slides for deliberate energy.

---

## Standalone recipes

All assume canonical 1280x720@24. Adjust as needed.

### Normalize one clip (so concat/xfade never fail)
```bash
ffmpeg -i in.mp4 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,format=yuv420p" -c:v libx264 -crf 18 -an norm.mp4
```

### Crossfade two clips (A is `da` seconds long, 0.6s fade)
```bash
ffmpeg -i A.mp4 -i B.mp4 -filter_complex \
 "[0][1]xfade=transition=fade:duration=0.6:offset=$(python3 -c 'print(da-0.6)')" out.mp4
```

### Concatenate clips with IDENTICAL codec/params (fast, no re-encode)
```bash
printf "file '%s'\n" s01.mp4 s02.mp4 s03.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy joined.mp4
```

### Retime a clip to an EXACT target duration (fit to a narration line)
```bash
# target T seconds, source D seconds → speed = D/T
ffmpeg -i in.mp4 -filter_complex "[0:v]setpts=(PTS-STARTPTS)*T/D[v]" -map "[v]" out.mp4
# with audio too: add ;[0:a]atempo=D/T[a]  and -map "[a]"  (atempo range 0.5–2.0; chain for more)
```

### Change speed (2× faster / half speed)
```bash
ffmpeg -i in.mp4 -filter:v "setpts=PTS/2.0" -an fast.mp4      # 2× faster
ffmpeg -i in.mp4 -filter:v "setpts=PTS/0.5" -an slow.mp4      # slow motion
```

### Add voiceover + music with DUCKING (music dips under narration)
```bash
ffmpeg -i video.mp4 -i vo.wav -i music.mp3 -filter_complex \
 "[2:a]volume=-16dB[m];[1:a]asplit=2[voA][voB];\
  [m][voA]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[mduck];\
  [mduck][voB]amix=inputs=2:duration=first:dropout_transition=0[a];\
  [a]loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=OUTSTART:d=2[aout]" \
 -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest final.mp4
```

### Video fade in/out
```bash
ffmpeg -i in.mp4 -vf "fade=t=in:st=0:d=1,fade=t=out:st=$(python3 -c 'print(D-1.5)'):d=1.5" out.mp4
```

### Hebrew RTL caption / lower-third (burn-in)
Best path: write an `.srt` (players handle RTL) and burn with `subtitles`:
```bash
ffmpeg -i in.mp4 -vf "subtitles=cap.srt:force_style='FontName=Arial,Fontsize=28,Alignment=2'" out.mp4
```
Single title via drawtext (pre-shape RTL text; `text` reversed if the build lacks libfribidi):
```bash
ffmpeg -i in.mp4 -vf "drawtext=fontfile=/Library/Fonts/Arial.ttf:text='הדלק האמיתי של החקלאות':\
 fontcolor=white:fontsize=42:box=1:boxcolor=black@0.5:boxborderw=12:x=(w-tw)/2:y=h-th-60:\
 enable='between(t,1,4)'" out.mp4
```

### Broadcast loudness normalize (audio only)
```bash
ffmpeg -i in.mp4 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:v copy out.mp4
```

### Poster / thumbnail & preview GIF
```bash
ffmpeg -ss 2 -i in.mp4 -frames:v 1 poster.jpg
ffmpeg -i in.mp4 -vf "fps=12,scale=640:-1:flags=lanczos" -loop 0 preview.gif
```

### Upscale 720p → 1080p (lanczos) for a hero shot
```bash
ffmpeg -i in.mp4 -vf "scale=1920:1080:flags=lanczos,format=yuv420p" -c:v libx264 -crf 16 out.mp4
```

## Integration with the-video-man

Downstream of per-scene generation (Kling MCP / openrouter-video-gen). Typical flow:
`build_plan_from_storyboard.py` → edit the plan (transitions, `fit_to_audio`, audio paths) →
`assemble.py`. Keep the final under the run dir, e.g. `…/<run>/final.mp4`, and log it in
`the-video-man/Memory/jobs.md`.

## Gotchas
- **xfade needs matching resolution/fps/pixfmt/SAR** across inputs — always normalize first
  (`assemble.py` does this automatically).
- **xfade shortens the timeline** by each transition's duration — that's expected; the offset math
  in `assemble.py` accounts for it.
- **atempo** only covers 0.5–2.0 per instance; chain (`atempo=2.0,atempo=1.5`) for larger factors —
  `assemble.py` chains automatically.
- Always export **`format=yuv420p`** + `-movflags +faststart` for broad player/web compatibility.
