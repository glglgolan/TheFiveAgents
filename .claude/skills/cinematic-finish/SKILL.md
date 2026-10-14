---
name: cinematic-finish
description: Agency-level finishing for short product ads/reels after the clips exist — code picture FX (speed ramp, impact punch/shake/flash/chromatic, screen-carrying glass shards, whip-pan, one film grade) and the hybrid sound pass (cue sheet from picture motion → composer subagent writes frame-locked code score stems + physically-specific ElevenLabs SFX picked by analysis → static-gain/true-peak mix, no pumping). Use for "make it pro", "edit effects", "music and sfx", "sound design", "extreme experience", "agency level", the surreal-ads series final steps, or any short ad that needs MELT-level polish.
---

# cinematic-finish — the MELT playbook

Proven on **MELT** (surreal-ads chocolate, 2026-10-09/10). The user's verdict on v4: "this is the level I'm talking about".
Reference run: `bambi/outputs/surreal-ads/2026-10-09-chocolate/` (fx/, audio/v4/, `_qa/`).
Owner: **the-video-man**. Bambi plans for it, Reuven orchestrates.

All paths below run **from the ad's run dir**. ffmpeg = the kinetic-typography venv binary (no system ffmpeg); the scripts find it on their own. Use system `python3` (cv2, numpy, scipy, soundfile, matplotlib).

## Where it sits in the ad pipeline

```
brief → storyboard (Bambi) → keyframes (Yuval) → continuity QA → clips (Kling MCP, first+tail)
   → concat (final_prefx) → [A] PICTURE FX → typography (kinetic-typography) → [B] SOUND → MELT_final.mp4
```

## Upstream lessons (do these right, and the finishing pass becomes easy)

1. **Images:**
   - Use the **gpt route** for any frame with brand/screen text: gpt-image-2 for the text-to-image anchor, gpt-image-1.5 edits with `--reference` (anchor + previous K). Midjourney garbled letters ("MET").
   - Use **Nano Banana 2 via Kling** (`image_to_image`, `gemini-3.1-flash-image`, 15 credits ≈ $0.09) for fixes and for frames with no text. It costs ~3× less than gpt-image high (~$0.30).
2. **Continuity QA between consecutive keyframes before any video:**
   - Same bite/damage position, same product side, same props.
   - On MELT the bite jumped corners between K2b and K3, which forced an S4 re-run.
   - Put the two frames side by side in `_qa/kN_compare.png` and look before paying for video.
3. **Clip structure:** 4 clips with a macro beat:

   | Clip | Keyframes | Length |
   |---|---|---|
   | S1 | K0→K1 | 4s |
   | S2 | K1→K2 | 4s |
   | S3 | K2→K2b | 3s, macro |
   | S4 | K2b→K3 | 4s |

   Total 15s. Kling v3.0 via MCP: `first_image` + `tail_image`, `enable_audio=false`, 8 credits/s.
4. **Concat:** scale-to-cover then crop to 1080×1920, never stretch. 2:3 keyframes give 1176×1764 clips.
5. **Overlays:** never float them (see memory `feedback-no-floating-overlays`). The tagline goes only on a settled, empty area after camera motion stops.

## [A] Picture FX — `scripts/fx_edit.py` (code only, about 6 min render)

1. Find the break moment. The frame-diff spike in s01 gives T0; the crack centre (CX, CY) is where the motion between frames is strongest. Write `fx/fx_config.json`:
   ```json
   {"T0": 2.29, "CX": 705, "CY": 1036, "SLOW_A": 2.30, "SLOW_B": 3.30, "SLOW_SPEED": 0.40,
    "WHIP_OUT": 8.75, "WHIP_MID": 8.95, "WHIP_IN": 9.20, "S3_CLEAN": 2.25}
   ```
2. `python3 .claude/skills/cinematic-finish/scripts/fx_edit.py --stills 50 55 56 60 70 212 222 300` writes QA stills to `_qa/fx_N.jpg`. Check them before the full render.
3. `python3 .claude/skills/cinematic-finish/scripts/fx_edit.py` writes `final.mp4` and keeps the plate as `final_prefx.mp4`. Then run typography (`kinetic-typography/scripts/render.sh <run>`), which writes `final_typo.mp4`.

What it does:
- **Speed ramp:** 1:1, then 0.4× slow-mo for 1s using DIS optical-flow interpolation, then an eased ramp. Total length is preserved.
- **Impact:** punch-in, decaying shake, flash frame, chromatic aberration, radial blur.
- **Glass shards:** 34 Voronoi shards from the crack point. 60% carry the screen image, because clear-only shards disappeared. They fly toward the camera with tumble, defocus, motion blur and glints.
- **Whip-pan:** hides the AI morph in S3, then a slow drift on the clean macro.
- **One grade:** warmth, S-curve, halation, vignette, grain.

The script assumes the 4/4/3/4 layout; edit `source_for()` for another layout.

## [B] Sound — the hybrid (what made v4 "magnificent")

### B1. Map the picture → `CUES.md`
- Run `python3 .claude/skills/cinematic-finish/scripts/motion_map.py`. It writes `_qa/snd/motion.npy` and `_qa/snd/sheet.jpg`.
- Look at the sheet and the motion peaks, then write `audio/v4/CUES.md` from `templates/CUES.template.md`.
- Give every physical action a sound, and every camera or object move air.
- Lock the dramaturgy:
  - suck-out silence → impact
  - slow-motion octave-down
  - drop at S2
  - **hard stop to silence at the end of S2** (≈8.0)
  - whip into the intimate macro
  - swell on the reveal
  - final hit plus resolving chord on the tagline lock

### B2. Composer subagent (background, Sonnet)
- Start it with `templates/composer_brief.md` filled in, using `Agent` with `run_in_background: true` and `model: sonnet`.
- It writes 6 code stems in `audio/v4/score/`: tension, impact, drive, slowmo, whip, resolve.
- They are frame-locked; verify.py checks onsets to within ±5ms (MELT measured within 0.1ms).
- Free, about 8 min. Keep working on B3 while it runs.

### B3. Realistic SFX (paid, tiny: ≈ $0.10, **show the estimate and get approval**)
1. Build the prompts from `templates/sfx_prompts.md`: one physically specific prompt per action, never a generic "whoosh".
2. Use the ElevenLabs creative MCP:
   - Add one `creative_add_flow_node` per sound: `node_type: sfx`, `model_id: eleven_text_to_sound_v2`, params `duration_seconds` and `prompt_influence` 0.55–0.65. Add them all in parallel.
   - Run `creative_run_flow_nodes` with `estimate_only: true` first, ask the user, then run with `generations_count: 2`.
3. Download:
   - Call `creative_get_flow_run_status` with **≥20 session_ids**, so the huge result is saved to a file instead of flooding the context.
   - Then run `python3 .claude/skills/cinematic-finish/scripts/fetch_elevenlabs.py audio/v4/sfx map.json <saved.json>`.
   - The signed URLs expire after 2h.
4. Pick without listening: run `analyze_takes.py audio/v4/sfx/*.mp3` and write `audio/v4/picks.json`:
   - impacts: higher crest
   - heavy objects: lower spectral centroid
   - whips/whooshes: an envelope that *builds* to its peak
   - room tone: flat
5. Organic layer: a warm section of an ElevenLabs music track (`eleven_music_v2_5`, instrumental) placed on the macro downbeat. On MELT this was music_a 7.5–9.9s at 9.20.

### B4. Mix — copy `scripts/mix_template.py` → `audio/v4/mix.py`, edit the SFX section
- **Never master with single-pass `loudnorm`.** It acts like an AGC and pumped the music under every whoosh, which was the user's #1 complaint on v3. Use static gain to −14 LUFS, then the look-ahead true-peak limiter at −1.5 dBTP. Limiting should only touch the main impact.
- Air sounds (fly-by, whip, camera air) are aligned so their peak sits on the picture's motion peak, and their loudness follows `motion_env()`.
- The impact plays its first 90ms in realtime, and the tail is varispeed ½ plus a low-pass, the slow-mo world. The impact stem's normal-speed braam is pulled −9 dB in the slow-mo window so `stem_slowmo` owns it.
- Room tone runs throughout as a mirror loop: cut during the suck-out, present in the silence beat (that's what makes the silence feel real).
- The music ducks only under the impact (−3 dB / 150ms).
- `python3 audio/v4/mix.py` writes `mix_v4.wav`, the stems, and `MELT_final.mp4` (or `<AD>_final.mp4`), with `-c:v copy` and AAC 320k.
- QA:
  - Run the per-0.1s gain-reduction printout and a spectrogram (`_qa/snd/v4_spec.png`). Check that the GR is flat except at the impact.
  - Check `ebur128` on the mp4: about −14.5 LUFS, TP ≤ −1.5.
- Keep the previous final as `_v1/<name>_vN.mp4` for A/B **before** overwriting.

## Cost reference (MELT, full ad)

| Item | Cost |
|---|---|
| Keyframes, gpt route | ≈ $2 |
| K3 fix, Nano Banana 2 | 15 credits |
| Kling clips | 4 × (24–32 credits) per pass |
| ElevenLabs music, first pass | ≈ $0.24 |
| ElevenLabs v4 SFX | $0.10 |
| Composer, FX and mix | free (local) |

Always show the cost and wait for approval before any paid step.

## Files
- `scripts/fx_edit.py`: picture FX (config via `fx/fx_config.json`)
- `scripts/motion_map.py`: motion.npy plus the timed contact sheet
- `scripts/mix_template.py`: the mix engine (edit the SFX section per ad)
- `scripts/fetch_elevenlabs.py`, `scripts/analyze_takes.py`: the SFX pipeline
- `scripts/synth.py`: the pure-code DSP toolkit (from Maison Bouledogue) for the composer
- `templates/`: CUES, composer brief, SFX prompt recipe
- `examples/melt/`: the real CUES.md, picks.json, compose_melt.py and verify.py from the reference ad
