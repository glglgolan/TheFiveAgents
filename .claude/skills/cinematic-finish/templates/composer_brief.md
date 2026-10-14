# Composer subagent brief (Agent tool, general-purpose, model: sonnet, run_in_background: true)

Fill <RUN>, <KEY>, the stem list from CUES.md. Proven on MELT (verify passed in 2 rounds, ~8 min).

---
You are the composer for a <DUR>-second 9:16 ad ("<BRAND>"). Write a pure-code (numpy/scipy, no samples,
no ML) frame-locked trailer-style score, rendered as separate stems so the mixer can balance them.

Working dir: <RUN>
1. Read `audio/v4/CUES.md` fully — the "Music" column is your spec; timings are exact (24fps).
2. DSP toolkit: copy `.claude/skills/cinematic-finish/scripts/synth.py` next to your script and
   `from synth import *` (additive, brass, strings, timp, kick, snare, crash, reverse_cymbal, sweep_noise,
   varispeed, freeverb_ir, compress, limit). Override its frame constants for <FRAMES> frames.
   Reference implementation: `.claude/skills/cinematic-finish/examples/melt/compose_melt.py`.
3. Write `audio/v4/score/compose.py` → 48kHz stereo float WAVs, each exactly <DUR>s, in `audio/v4/score/`:
   stem_tension / stem_impact / stem_drive / stem_slowmo / stem_whip / stem_resolve (+ score_preview.wav,
   plain sum peak −3 dBFS). Leave the macro window sparse for the organic layer. Tonality: <KEY>; the final
   chord resolves home.
4. Style: big modern trailer meets luxury ad — weighty lows, real punch, wide stereo, reverb/saturation so it
   sounds like a room; no chiptune, no harsh hiss.
5. Self-verify (≥2, ≤3 rounds) with `audio/v4/score/verify.py`: exact length, no NaN, peak<1, onsets ±5ms on
   every hit, <−50 dBFS in the suck-out and the silence beat; spectrogram PNG.
6. Touch nothing outside `audio/v4/score/`. No paid APIs.
Report: files, stem contents, verify output, compromises.
