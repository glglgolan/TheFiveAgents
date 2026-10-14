---
source_url: https://github.com/i-afaqrashid/claude-animation-studio
source_title: claude-animation-studio — Claude Code plugin: animated short films where every frame is drawn in code and the music is synthesized in code
fetched_at: 2026-09-29
chen_notes: Main sources are primary: GitHub repos (claude-animation-studio, ft-motion, Rhubarb Lip Sync, Remotion), official docs (Remotion license, Motion Canvas), PyPI/npm/conda-forge/GitHub release APIs checked live, plus the HeyGen Code2Video benchmark and TheoremExplainAgent paper for how agents fail. The user's machine was inspected read-only (nothing installed or rendered).
---

# Making a ~2-minute 2D animated film with Claude Opus using only code (no generative models)

## 0. Key findings and what's on this machine

What this machine has, checked read-only on 2026-09-29:

| Item | Status |
|---|---|
| CPU | Intel Core i9-9880H, 8 cores / 16 threads, 16 GB RAM, x86_64 (probably a 2019 16" MacBook Pro, which throttles under sustained load) |
| OS | macOS 26.5.2 (Darwin 25) |
| Python | 3.11.5 (miniconda) with numpy 2.4, scipy 1.17, Pillow 12.2, imageio 2.37, **imageio-ffmpeg 0.6.0 already installed. It bundles a static ffmpeg 7.1 at `~/miniconda3/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1`**, so ffmpeg is effectively available. |
| Node | v24.15.0, npm 11.12 |
| Google Chrome | Installed in /Applications |
| Xcode | Installed, so `swift` and a C compiler are available for small native helpers |
| `say` | 180 voices, and none of the English ones are "Premium/Enhanced" (neural). Available English voices: classic MacinTalk novelty and formant voices (Albert, Bad News, Bahh, Bells, Boing, Bubbles, Cellos, Fred, Good News, Jester, Junior, Organ, Ralph, Superstar, Trinoids, Whisper, Wobble, Zarvox), Eloquence rule-based voices (Eddy, Flo, Grandma, Grandpa, Reed, Rocko, Sandy, Shelley, in US and UK variants), and compact concatenative voices (Samantha, Daniel, Karen, Moira, Rishi, Tessa, Kathy). |
| Missing | Homebrew, a system ffmpeg, SoX, espeak-ng. Conda-forge covers these for osx-64: ffmpeg 9.0.2, sox 14.4.2, fluidsynth 2.6.1, pycairo 1.29.1 and librsvg 2.62.4 were all confirmed live via the anaconda.org API. espeak-ng is available as a pip wheel for Intel Mac (`espeakng-loader` 0.2.4, `macosx_10_12_x86_64`). |

Wheels confirmed for Intel Mac on PyPI:
- skia-python 144 (cp311 x86_64)
- pedalboard 0.9.25
- soundfile
- playwright 1.63

These are pure Python: mido, pretty_midi, pyloudnorm, pydub, opensimplex, cmudict, manim 0.21.

**tinysoundfont has only arm64 Mac wheels**, so on Intel it would need a source build.

Recommendation in one line: **Remotion 4 (React plus SVG and Canvas scenes written as pure functions of the frame number), rendered on the CPU with `--gl=swangle` and `--concurrency=6`. Characters are hierarchical SVG rigs. Dialogue comes from macOS `say` (non-neural voices only), post-processed in numpy and pedalboard. Mouth shapes come from phoneme timing that we author ourselves. Music is synthesized in pure numpy or Tone.js offline. Everything is mixed with ffmpeg.** Remotion ships its own ffmpeg and headless Chrome, so nothing needs Homebrew. The best fallback is a custom Canvas2D engine driven by Playwright, the design used by claude-animation-studio and ft-motion.

---

## 1. Visual pipelines compared

Speed estimates assume 1080p, 2,880 frames (120 s at 24 fps) or 3,600 frames (at 30 fps), on this 8-core i9 with no GPU. They are engineering estimates, not measurements.

| Pipeline | Character-animation quality ceiling | CPU render time for 120 s | Install friction (Intel Mac, no brew) | How well an LLM can author it | Verdict |
|---|---|---|---|---|---|
| **Remotion 4** (React to MP4; v4.0.529, released 2026-09-25) | High. Arbitrary SVG, Canvas, CSS filters, `spring()`/`interpolate()`, `<Sequence>` timeline, audio tracks. The ceiling is whatever SVG and Canvas can draw. | Simple flat vector: ~15–40 ms per frame per worker, so **3–10 min** with 6 workers. Heavy SVG filters (feTurbulence, blur, displacement): 0.3–1.5 s per frame, so **20–60 min**. | Low: `npm i`. Downloads its own Chrome Headless Shell and bundled ffmpeg. Free license for individuals and companies of up to 3 people ([license FAQ](https://www.remotion.dev/docs/license/faq)). | Excellent. React/TSX is the most common kind of code LLMs have seen, frame-deterministic by design. | **Primary** |
| **Custom HTML/Canvas2D or SVG engine plus Playwright/Puppeteer frame capture** | Same as Remotion. You write the timeline yourself. | Same range. Canvas2D is faster than SVG with filters. | Low: `pip install playwright` then `playwright install chromium`, or use the installed Chrome. | Excellent, and fully under your control. Proven by [claude-animation-studio](https://github.com/i-afaqrashid/claude-animation-studio) and [ft-motion](https://github.com/anupamme/ft-motion). | **Strong fallback** |
| **skia-python** (Canvas-like API, CPU raster) | High for vector drawing (paths, gradients, shaders, blurs). No DOM or CSS. | Very fast: ~10–40 ms per frame, parallel with `multiprocessing`, so **2–6 min**. | Low: an x86_64 wheel exists (v144). | Good. The API is less familiar, so there are more hallucinated method names. | Good pure-Python alternative |
| **pycairo** | High-quality antialiased vectors, simpler than Skia. | Fast, similar to Skia. | Medium: no Mac wheel on PyPI (Windows only). Use `conda install -c conda-forge pycairo`. | Good. The API is well known. | OK |
| **Pillow** | Low. Weak antialiasing, no bezier strokes of real quality. | Fast. | Already installed. | Easy. | Only for compositing and grain passes |
| **Motion Canvas** (v3.17.2, last release Dec 2024) | High for motion graphics, weaker for characters. Generator-based timeline. | Renders from a browser editor. Headless CLI rendering is an open request ([issue #1218](https://github.com/motion-canvas/motion-canvas/issues/1218)). | Medium. | Good, but generator-based timing is harder to coordinate across 15 agents. | Not recommended. Stale, and the headless path is awkward. |
| **Manim CE 0.21** | Low to medium for characters. Built for math explainers. | Medium (Cairo renderer). | Medium: needs pycairo/pango via conda, plus ffmpeg. | Very well known, but LLMs hallucinate the API. In the [TheoremExplainAgent](https://arxiv.org/abs/2502.19400) study, most failures were "Manim code hallucinations". | Not for this film |
| **Blender Python with Grease Pencil** | Very high in principle: real 2D/3D hybrid, onion skin, modifiers. | Workbench renders cheaply. EEVEE uses the GPU (Metal), which conflicts with the no-GPU rule. Cycles on the CPU is slow (minutes per frame with lighting). | Medium: a ~350 MB+ DMG from blender.org, no brew needed. | Poor to medium. Creating Grease Pencil strokes through `bpy` is verbose, the API changed with GPv3 in Blender 4.3+, and it is hard for an LLM to check visually. | Skip unless you want 3D-lit cutout |
| **Lottie** (lottie-web in headless Chrome) | Medium. | Fast. | Low. | Poor. Hand-writing Lottie JSON keyframes is error-prone. | Skip |
| **Synfig** (bones, .sif XML, CLI renderer) | Medium to high (bone rigs, cutout). | Medium. | Medium: Mac DMG. | Poor. It's an obscure XML format with little training data. | Skip |
| **p5.js** | Medium to high. | Same as the Canvas engine. | Low. | Very good. | Fine for particle or ornament sub-layers inside the Canvas engine |

Why Remotion is the primary choice:
- It already solves frame determinism, parallel chunked rendering, audio muxing and ffmpeg bundling.
- Each shot can be its own `<Composition>` or `<Sequence>`, which maps cleanly onto one animator agent per scene.
- To keep work off the GPU, render with `--gl=swangle` (SwiftShader/ANGLE software rendering) and `--concurrency=6` to leave thermal headroom.

Caveats:
- Don't use Remotion's Claude "Agent Skill". The user said "no skills". The framework itself is fine.
- The "Remotion + Claude" ecosystem posts are mostly about slides, data viz and motion graphics, not character animation ([growthexe](https://growthexe.substack.com/p/everything-claude-code-remotion-can) doesn't discuss character work at all).

---

## 2. Making procedural characters look good

### 2.1 Rig architecture

Each character is a pure function: `Character({pose, expression, viseme, t, style})`.

**Hierarchical transforms.** Use nested `<g transform="translate(pivot) rotate(a) translate(-pivot)">` groups:

```
root → hips → torso → neck → head → {jaw, eyes, brows, ears, hat}
             → shoulders → upperArm → foreArm → hand → prop (bag/umbrella)
             → hips → thigh → shin → foot → shoe
```

Store pivots in a rig JSON so every agent uses the same joints.

**Two-bone IK** for planted feet and hands gripping props. It's about 20 lines of law-of-cosines code, and it prevents foot sliding in walks.

**Swappable parts** (the paper-cutout technique):
- Mouths: 9 Rhubarb/Preston-Blair visemes A–H plus X.
- Eyes: open, half, closed, squint, wide.
- Brows as bezier curves with 3 control parameters (angry, sad, surprised).
- Hands: 5 pre-drawn poses.

Swapping parts looks far better than morphing a single path.

**Deformers.** Squash and stretch is `scale(1+s, 1/(1+s))` around the contact point, with volume preserved. Use bezier "rubber-hose" limbs (the limb is one cubic curve whose control points follow the IK) instead of rigid segments. This alone looks far more professional.

### 2.2 Motion principles as code

**Easing.** Use d3-ease, bezier-easing (3.1.0) for custom cubic-beziers, Remotion `spring({fps, frame, config:{damping,mass,stiffness}})`, or GSAP 3.15 easings run on a paused timeline driven by `tl.seek(frame/fps)`. GSAP is deterministic if you never let it tick by itself. anime.js 4.5 works the same way.

HeyGen's [Code2Video benchmark](https://www.heygen.com/research/introducing-code2video-benchmark) found that agent-made motion typically lacks "organic easing curves". Mandate these rules in the style bible:
- Anticipation, then action, then overshoot, then settle.
- Offset timing, where child joints lag parents by 2–4 frames.
- Holds: 6–12 frames of stillness after big poses.
- Never linear easing except for mechanical motion.

**Secondary motion.** Damped-spring followers (`x'' = -k(x-target) - c·x'`), integrated deterministically per frame, pre-simulated from frame 0 so any frame can be rendered alone. Apply them to:
- earrings, tassels, feathers, hat brims
- umbrella canopies, bag straps
- ears, tails, jowls

Chains of 3–6 spring points drawn as a Catmull-Rom curve give convincing floppy accessories. Verlet rope works for necklaces and scarves.

**Procedural walk cycle.** Parameterize by phase φ ∈ [0,1):
- hip bob `-|sin(2πφ)|·A`
- torso counter-rotation
- foot plant/lift curves with IK
- arm swing opposite the legs

Tune per character: a strutting runway walk has a wide hip sway and cross-over steps; a waddling penguin has high bob and no knee bend. Parameters: stride, bob, sway, swagger, and a "sass" head-tilt.

**Blinks and idles.** Use a seeded PRNG (mulberry32) for blinks every 2–5 s: a 2-frame close, 1-frame hold, 3-frame open. Add breathing (a 0.5–1% torso scale at ~0.25 Hz) and a slow simplex-noise drift on the head.

### 2.3 Stylization and "texture" (where code shines)

**Line boil.** Re-jitter path control points with simplex-noise (4.0.3) or opensimplex, reseeding every 2 frames ("animate on twos"). Or use rough.js 4.6.6 (`seed` changes every 2–3 frames) for a hand-drawn, wobbly look. Boiling lines are the single biggest "this was made by hand" signal.

**Animate on twos.** Hold character poses for 2 frames at 24 fps while the camera moves on ones. This looks cinematic and halves animation noise.

**Paper and grain.**
- SVG `feTurbulence` plus `feDisplacementMap` for torn edges.
- A multiply-blended paper texture generated once as a PNG with numpy fBm noise.
- A per-frame film-grain overlay from 8 pre-generated grain tiles cycled.
- A vignette.

**Lighting via gradients.**
- A radial rim-light gradient on the side facing the key light.
- A multiply "shadow shape" clipped to the character silhouette, offset opposite the light.
- Contact shadows as blurred ellipses.
- Spotlight cones on the runway as additive gradients.
- Chromatic "flashbulb" pops with 1–2 frame white overlays.

**Camera and parallax.** Use a virtual camera `{x, y, zoom, rotation, shake}` applied to 5–7 depth layers with parallax factor `1/z`. Add dolly-zooms, whip-pans (motion-blur by averaging 4–6 subframes; ft-motion averages 6 subframes across a 180° shutter), and rack focus (blur layers by depth).

**Particles.** Confetti, sequins, camera flashes, rain for the umbrella gag, feathers. Use seeded, closed-form particle positions (`p(t) = p0 + v0·t + ½g·t²`) so any frame renders independently.

**Typography.** Opening titles, name cards and a "collection" lower-third. Use fonts from Google Fonts or bundled OFL fonts.

Useful JS libraries:

| Library | npm version | Use |
|---|---|---|
| GSAP | 3.15.0 | timelines |
| anime.js | 4.5.0 | timelines |
| simplex-noise | 4.0.3 | noise |
| rough.js | 4.6.6 | hand-drawn strokes |
| paper.js | 0.12.18 | boolean path ops, offsetting outlines |
| bezier-easing | 3.1.0 | custom easing |
| d3-shape, d3-ease | — | curves and easing |
| Tone.js | 15.1.22 | audio |

`flubber` works for occasional shape morphs.

---

## 3. Audio made by code

### 3a. Dialogue without neural or cloud TTS

**macOS `say`** (best option, already installed):
- Output: `say -v Ralph -r 170 -o line.aiff "text"`, or `--data-format=LEI16@44100` for WAV-ready PCM (`--file-format=WAVE`).
- Embedded commands:
  - `[[rate 150]]`, `[[volm 0.6]]`, `[[slnc 400]]` (silence, in ms), `[[emph +]]`
  - `[[pbas 38]]` (pitch base) and `[[pmod 60]]` (pitch modulation, i.e. expressiveness)
  - `[[inpt PHON]]` to type phonemes directly, and `[[inpt TUNE]]` to give per-phoneme pitch and duration. TUNE is the classic Apple "Speech Synthesis Programming Guide" format. It allows sung lines and exact timing on MacinTalk voices.
  - `pbas`, `pmod` and TUNE work reliably only on the classic MacinTalk voices (Fred, Ralph, Junior, Albert, Kathy, Zarvox...). Treat them as unverified on Eloquence and compact voices and test first.
- Voice casting for grotesque fashion animals:
  - Ralph or Fred pitched down with formant shift for a pompous bulldog designer.
  - Junior plus pitch up for a nervous mouse assistant.
  - Grandma (Eloquence) for a dowager tortoise.
  - Zarvox or Trinoids for a robotic runway announcer.
  - Whisper for a gossip.
  - Bad News or Good News (they sing) for a critic's verdict.
  - Bubbles for a fish, Bahh for a sheep model, Cellos or Organ for musical stings.
- Stay strictly non-neural: use only the voices listed above and never "(Enhanced)", "(Premium)" or Siri voices, which are neural. On this machine none of the English voices are neural.
- Expect a robotic, retro sound. Lean into it (see section 8).

**Character post-processing (DSP, not ML)** with numpy, scipy and pedalboard:
- `PitchShift` (Rubber Band, a classical phase vocoder)
- formant-ish shaping via EQ
- vibrato (LFO-modulated delay)
- ring-modulation growl
- a comb-filter "nasal" effect
- a bitcrusher for a robot voice
- room reverb

Varying a pitch LFO per character helps hide the monotone of the synthesizer.

**espeak-ng** (formant synthesis, non-neural) via the `espeakng-loader` wheel, which bundles libespeak-ng and data for Intel Mac. Call it through `ctypes`, or use it for phoneme output (`espeak_TextToPhonemes`) for lip sync. It's the most robotic option, but gives exact phoneme streams and many languages.

**Festival and Flite.** Classical diphone and cluster-unit synthesizers. There's no easy Mac binary without brew, conda-forge doesn't list them for osx-64, and they're low value next to `say`.

**Articulatory and formant synthesis from scratch:**
- A Klatt-style cascade formant synthesizer in numpy (~200 lines), or a port of Pink Trombone (an open-source JS vocal-tract model) running in headless Chrome.
- Ideal for creature vocalizations: sniffs, harrumphs, gasps, a goose honk that "says" words.

**"Animalese" gibberish** (Animal-Crossing style):
- Render each letter or syllable once with `say`, or synthesize formant vowels.
- Pitch it up 1.5–2.5×, cut to 60–90 ms, and concatenate per the text with per-character pitch.
- It's charming, it hides robotic TTS, and it makes lip-flap trivial.
- Recommended hybrid: key narrative lines in intelligible `say`, and background chatter and audience reactions in animalese.

**Separate tier: local neural TTS.** Piper (`pip install piper-tts`, v1.8.0 has an x86_64 Mac wheel, a small ONNX model, runs on the CPU) sounds much more natural. **It is a neural model, so it violates the "no generative AI" rule as written.** Offer it only as an explicit opt-in tier. The same applies to Kokoro and similar models.

### 3b. Procedural sound effects (numpy, scipy, SoX optional)

| Effect | Recipe |
|---|---|
| Footsteps and heel clicks | Short filtered-noise burst plus a resonant bandpass "click" at 2–4 kHz; randomize per step |
| Camera shutter or flash | Two clicks 30 ms apart, plus a rising sine "whine" for the flash charge |
| Umbrella whoosh or pop | Bandpassed noise with a sweeping center frequency; pop = low sine thump plus noise tail |
| Fabric rustle | Crackle (sparse random impulses) through a highpass, with an amplitude envelope |
| Jewelry jingle | Sum of inharmonic sines (bell partials 1, 2.76, 5.4, 8.9) with fast decay; Karplus-Strong for plucks |
| Crowd gasps, applause | Many layered noise-burst "claps" with random timing; gasp = formant-filtered noise with a rising envelope |
| Cartoon boing | Sine with an exponentially decaying pitch vibrato |
| Retro game sounds | Port the sfxr/jsfxr algorithm (square/saw/noise plus pitch slide plus arpeggio). jsfxr runs in Node. |
| Reverb | pedalboard `Reverb`, or scipy convolution with a synthesized impulse response (exponentially decaying noise) |

### 3c. Music made by code

- **Pure numpy synthesis (most "honest"):**
  - Subtractive and FM voices, Karplus-Strong bass and guitar, additive organ.
  - Drums: kick = pitch-swept sine; snare = noise plus a 200 Hz tone; hi-hat = highpassed noise or square-wave clusters.
  - A sequencer driven by a score JSON (BPM, bars, sections), which also drives animation beats.
  - This is the approach of claude-animation-studio (JS DSP, eight genre packs) and ft-motion (numpy/scipy drums, pads, risers, mastered to −14 LUFS).
- **Tone.js `Tone.Offline()`** in headless Chrome renders a WAV buffer deterministically. It's rich and familiar to LLMs.
- **MIDI plus FluidSynth.** mido or pretty_midi write the score, and `conda install -c conda-forge fluidsynth` provides the synthesizer. Soundfonts (GeneralUser GS, FluidR3_GM) are *recorded samples*, not generative AI, but not "made by code" either, so treat them as a purity tier. They sound the most "real orchestra".
- **SuperCollider.** The DMG installs without brew, and `scsynth -N` renders non-realtime from an OSC score. Top quality, but LLM fluency in sclang is moderate.
- **Sonic Pi.** GUI-centric and hard to render offline headless. Skip it.
- Suggested score for this film: a "fashion house" electro-swing or tango pulse (runway walks fit ~120 BPM), a harpsichord or pizzicato motif for the snobby designer, a comic tuba for the grotesque reveal, and a big finale.

### 3d. Mixing and mastering

Assemble in numpy (sample-accurate placement from the timeline JSON) and polish with pedalboard (Compressor, Limiter, EQ, Reverb) and pyloudnorm (target −14 LUFS integrated, −1 dBTP). ffmpeg alternative:
- `adelay`, `amix`, `sidechaincompress` (ducks music under dialogue)
- `loudnorm=I=-14:TP=-1:LRA=11`

pydub is fine for quick concatenation, but numpy gives exact sample control.

---

## 4. Lip sync without machine learning

**Rhubarb Lip Sync v1.14.0** (2025-04-03, macOS zip available):
- Its default recognizer is PocketSphinx, a classical HMM/GMM speech recognizer. That is statistical machine learning, not neural or generative, and it ships a pretrained acoustic model.
- The `--recognizer phonetic` mode is language-independent and less precise ([README](https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/README.adoc)).
- Useful options: `-f json`, `--dialogFile` (supplying the script improves accuracy), and mouth shapes A–F plus optional G, H, X.
- Verdict: **not a neural model, but not "ML-free" in the strictest sense.** It is acceptable to most people. The strict alternative is below.

**Strict ML-free route (better, because we control the synthesizer):**
1. **Author the timing.** Synthesize each line word by word (or phrase by phrase with `[[slnc]]`), measure each clip's duration, and get phonemes from CMUdict (`pip install cmudict`) or espeak-ng's phoneme output. Spread phonemes across each word's duration, weighting vowels ~2× consonants. Map to visemes: `AA/AE/AH → D`, `AO/OW/UW → E/F`, `M/B/P → A`, `F/V → G`, `L → H`, `EE/IH → C`, others `B`. Snap closed-lip (`A`) frames exactly on plosives.
2. **Or use the TUNE method.** Write the line in `[[inpt TUNE]]` with explicit phoneme durations. You then know every phoneme's start time exactly, because you specified it.
3. **Or use Apple phoneme markers.** Apple's `AVSpeechSynthesizer.write(_:toBufferCallback:toMarkerCallback:)` (macOS 14+) delivers `AVSpeechSynthesisMarker` objects (word, sentence and phoneme marks with sample offsets). A ~40-line Swift script run with `swift` can dump them to JSON. I couldn't read Apple's doc page, so **verify that phoneme marks are emitted for the chosen voices**.
4. **Amplitude layer.** Compute an RMS envelope (10 ms windows) to scale jaw-open amount inside the viseme, and fall back to amplitude-only flaps (closed / half / open by thresholds) for animalese and gibberish.
5. **Smoothing.** Enforce a minimum of 2 frames per viseme, merge rapid flicker, and lead the audio by one frame (mouths reading slightly early looks right).

---

## 5. Multi-agent plan (up to 15 subagents)

### Principle: audio first, then contracts, then parallel build, then QA loops

The dialogue track sets all timing. Lock the "radio play" and animatic before any animation work starts.

### Roles

| # | Agent | Output |
|---|---|---|
| 1 | Showrunner / orchestrator (main Opus session) | Owns `bible/`, merges, resolves conflicts, final decisions |
| 2 | Screenwriter | `story/script.fountain` and `story/beats.json` (10–14 shots, gags, act structure, ~260–300 words of dialogue for 2 min) |
| 3 | Art director | `bible/style.json` (palette tokens, line weights, boil params, light direction, grain, typography), `bible/style_frames/*.png` rendered from code, and a "do/don't" sheet |
| 4–7 | Character riggers (one per main character, 4 max) | `characters/<name>/rig.tsx` plus `rig.json` (pivots, parts, viseme set, expression set, walk params), plus a turnaround or expression-sheet PNG |
| 8 | Wardrobe / props designer | `props/*.tsx`: hats, shoes, jewelry, bags, umbrellas, each with spring-chain secondary motion and attach points |
| 9 | Background and set painter | `sets/*.tsx` (runway, atelier, backstage, street in rain), parallax layers, light cones |
| 10 | Voice and dialogue | `audio/dialogue/*.wav`, `timing/dialogue.json` (word and phoneme times), `timing/visemes/<char>.json` |
| 11 | Composer | `audio/music.wav` plus `timing/beats.json` (bar and beat grid, section markers) |
| 12 | Sound designer | `audio/sfx/*.wav` and `timing/sfx_cues.json` |
| 13–14 | Scene animators (2, each owns about half the shots) | `scenes/shotNN.tsx`, which consume the rigs, sets and timing JSON |
| 15 | Editor / QA reviewer | Contact sheets, frame checks, timing checks, the final mix, the final MP4 |

### Contracts to prevent style drift

- **`bible/style.json`** is the only source of colors, stroke widths, fonts and noise seeds. Agents import tokens and never hard-code hex values. A lint script greps for `#[0-9a-f]{6}` outside the bible and fails the build.
- **`bible/shot_spec.schema.json`** defines each shot with:
  - `id`, `startFrame`, `durationFrames`, `set`, `camera` keyframes
  - `characters: [{id, enter, blocking:[{frame, x, y, pose, expression, lookAt}], dialogueRefs}]`
  - `props`, `sfxRefs`, `musicSection`, `transitionIn/Out`
- **Rig API contract:** `<Character id pose={...} expression="smug" viseme="D" facing={1} t={frame} />`. Poses are named presets plus overrides, and riggers publish a pose library.
- **A single `timeline.json`** is generated by the editor from dialogue timing plus the beat grid. Every scene reads frame numbers from it, never guesses.
- **Golden frames:** the art director renders 3 reference frames early. Every animator's QA compares against them side by side.

### Verification (Claude can see images)

- **Stills per shot:**
  - Remotion: `npx remotion still <comp> --frame=N out.png`.
  - Playwright: a screenshot at a given `t`.
  - Claude reads the PNG with the Read tool.
- **Contact sheets:** `ffmpeg -i shot.mp4 -vf "select='not(mod(n\,12))',scale=480:-1,tile=6x4" -frames:v 1 sheet.png`. One image shows 24 moments, which reveals pops, off-model frames, and props detached from hands.
- **Motion checks:** render 3 consecutive frames at key moments to catch popping, foot sliding and IK flips. A numeric check asserts that a foot's world position is constant while it's planted.
- **Audio checks:**
  - pyloudnorm LUFS and true peak.
  - A dialogue-overlap check.
  - A lip-sync check: for each plosive, verify the rendered mouth part is `A` on that frame (the renderer writes a per-frame debug JSON sidecar).
- **Review rubric** for the QA agent, based on Code2Video failure modes: easing is organic, text doesn't collide along its path, compositions are bold and fill the frame, every shot reads as a silhouette, and there are holds after key poses.

### Parallel rendering on the CPU

- Render shots independently (one Remotion render per shot, or `--frame=a-b` ranges), running 2 processes × `--concurrency=3` or 1 × 6.
- Keep ~2 cores free. This i9 throttles, so monitor with `pmset -g thermlog`.
- Use `--gl=swangle` (or Chrome `--disable-gpu`) to keep the GPU idle.
- Concatenate with ffmpeg's concat demuxer. Encode the final with `libx264 -crf 17 -preset slow -pix_fmt yuv420p`, audio AAC at 256k.

---

## 6. Real examples found

| Project | What it is | Quality and notes |
|---|---|---|
| **[claude-animation-studio](https://github.com/i-afaqrashid/claude-animation-studio)** (i-afaqrashid) | A Claude Code plugin where every frame is drawn in code and the music is synthesized in code | Headless Chrome plus ffmpeg, 1080p to 4K. "Paper-cutout" look with boiling pencil lines, hatching and torn-paper captions. Offline system TTS with word-timed captions and lip-synced mouths, plus a "formant singer" for jingles. JS DSP music with eight genre packs. A score file drives both audio and animation, with sync claimed within ±20 ms. Demo films run 16–58 s (e.g. "Claude × Afaq, World Cup 2026", 58 s, with no samples or stock). **This is the closest precedent and it confirms the recommended stylization.** It is a skill/plugin, so the user's "no skills" rule means using it only as inspiration. Its README doesn't document limitations. |
| **[ft-motion](https://github.com/anupamme/ft-motion)** | "Motion graphics as a pure function of time": Canvas 2D scenes, headless-Chrome rendering, 6-subframe motion blur, numpy/scipy sound on a shared BPM grid, mastered to −14 LUFS, plus a brief-to-video prompt for agents | Motion graphics rather than characters. Notes that three.js via SwiftShader costs ~0.5–1 s per subframe at 1080p, so avoid 3D on this machine. |
| **[svg-animation-studio](https://github.com/ChanMeng666/svg-animation-studio)** | Claude Code builds composable SVG animation from 25 primitives, with snapshot tests | Short loops (e.g. a jumping robot). Shows primitive reuse and snapshot testing, not narrative film. |
| **[Codrops: reverse-engineering Claude's mascot animations with SVG and GSAP](https://tympanus.net/codrops/2026/05/05/reverse-engineering-claude-ais-mascot-animations-with-svg-and-gsap/)** (May 2026) | Hand-authored SVG character animation with GSAP | Good reference for expressive idle and squash techniques. |
| **[Ruidiao: cartoon from the command line](https://ruidiao.substack.com/p/i-generated-a-cartoon-video-entirely)** | 52 s "Three Little Pigs" made with Claude Code | **Used generative models** (Azure TTS, Qwen image, Wan2.2 image-to-video), so it's a counter-example. Its lesson: timestamp-driven assembly is the hard part. |
| **[TheoremExplainAgent](https://arxiv.org/abs/2502.19400)** (Manim plus LLM agents) | Research on agent-generated Manim explainer videos | Most failures were Manim code hallucinations; successful videos still had layout problems. |
| **[HeyGen Code2Video benchmark](https://www.heygen.com/research/introducing-code2video-benchmark)** (2026) | Evaluates frontier models (including Claude Opus 5) on coded motion design | Top models were close. Common failures: timing without organic easing, text laid out "for the final frame, not for the path it travels", and conservative, undersized compositions. |
| Remotion + Claude content ([growthexe](https://growthexe.substack.com/p/everything-claude-code-remotion-can), others) | Guides to Claude-driven Remotion video | Strong at slides, data viz, 3D product shots and Lottie. Character animation isn't covered, so a character film goes beyond typical published demos. |

I found no public example of a coherent **2-minute, multi-character dialogue film** made purely with code and no generative models. The best precedents top out around one minute and lean on music and narration rather than acted dialogue scenes.

---

## 7. Step-by-step pipeline for this machine

### 7.1 Install (no brew, no GPU)

```bash
mkdir -p ~/claude_projects/fashion-film && cd ~/claude_projects/fashion-film

# Video engine (Remotion ships its own Chrome Headless Shell and ffmpeg)
npx create-video@latest --blank .      # or: npm init -y && npm i remotion @remotion/cli react react-dom
npm i simplex-noise roughjs bezier-easing d3-ease d3-shape gsap tone seedrandom paper

# Python audio and QA (this conda env already has numpy, scipy, Pillow, imageio-ffmpeg)
pip install soundfile pedalboard pyloudnorm mido pretty_midi cmudict opensimplex
pip install espeakng-loader            # optional: formant TTS and phonemes, Intel wheel
pip install playwright && python -m playwright install chromium   # fallback engine and stills

# ffmpeg on PATH without brew: symlink the bundled static binary
mkdir -p bin && ln -sf "$(python -c 'import imageio_ffmpeg as i;print(i.get_ffmpeg_exe())')" bin/ffmpeg
export PATH="$PWD/bin:$PATH"
# (or: conda install -c conda-forge ffmpeg sox fluidsynth pycairo)

# Optional: Rhubarb (classical HMM/GMM, not neural)
curl -L -o rhubarb.zip https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.14.0/Rhubarb-Lip-Sync-1.14.0-macOS.zip
```

Note: for any unsigned binary (such as Rhubarb), macOS Gatekeeper may require `xattr -d com.apple.quarantine`. Changing security attributes is the user's call, so ask first.

### 7.2 File structure

```
fashion-film/
  bible/          style.json, shot_spec.schema.json, rig_api.md, golden_frames/
  story/          script.fountain, beats.json
  timing/         dialogue.json, visemes/<char>.json, beats.json, sfx_cues.json, timeline.json
  characters/     <name>/rig.tsx, rig.json, sheet.png
  props/          hat_*.tsx, umbrella.tsx, bag_*.tsx, jewelry.tsx, springs.ts
  sets/           runway.tsx, atelier.tsx, backstage.tsx, street_rain.tsx
  lib/            camera.ts, ease.ts, ik.ts, springs.ts, boil.ts, grain.ts, prng.ts, particles.ts
  scenes/         shot01.tsx … shot14.tsx, Film.tsx (the master <Sequence> list)
  audio/
    tools/        voice.py, animalese.py, synth.py, sfx.py, mix.py, lipsync.py
    dialogue/  sfx/  music/  mix/film_mix.wav
  qa/             stills/, contact_sheets/, reports/
  out/            shots/*.mp4, film.mp4
```

### 7.3 Order of work and time estimates

| Step | Work | Wall time |
|---|---|---|
| 1 | Script, beats and the style bible. Orchestrator approves 3 golden frames. | 30–60 min |
| 2 | Dialogue with `say` plus DSP, then timing JSON and visemes (radio play). Composer builds the beat grid in parallel. Editor builds `timeline.json` and an animatic of blocks and captions. | 30–60 min |
| 3 | Rigs, props and sets in parallel, each checked with expression and turnaround sheets. | 1–2 h |
| 4 | Shots in parallel, with a contact-sheet QA loop on each (2–3 iterations). | 1.5–3 h |
| 5 | Sound effects and the final mix (ducking, −14 LUFS). | 20–40 min |
| 6 | Final render plus concat plus mux. | 10–60 min (see below) |

Step 6 render time: 2,880 frames at 1080p/24fps with filters kept moderate. Cache static layers (backgrounds, paper texture) as PNGs to keep feTurbulence cheap.

**Total: roughly 4–8 hours of agent wall time**, with token cost dominated by QA iterations.

### 7.4 Master prompt for Opus

```
You are the showrunner of a tiny animation studio made of up to 15 Claude subagents. Produce a
complete ~2:00 (120 s ±5 s) 2D animated short, 1920×1080, 24 fps, stereo 48 kHz, delivered as
out/film.mp4 plus out/film_contact_sheet.png.

TITLE / PREMISE: "HAUTE COUTURE ZOO" — at Paris Fashion Week, a tyrannical bulldog couturier,
Maison Grognard, unveils his most grotesque collection on animal models (a flamingo in
a stiletto cage and a chandelier hat, a pug in a caviar-tin handbag, a giraffe with a 12-foot
pearl necklace, a hedgehog in a balloon couture gown, a penguin in an umbrella crinoline). A mouse
assistant secretly fixes every disaster backstage. It builds to a catastrophic finale where the
mouse's accidental "mistake" look wins the room. It needs a clear 3-act arc, at least 6
visual gags, at least 280 words of dialogue across at least 4 characters, and a final button joke.

HARD RULES (non-negotiable):
- NO generative AI of any kind: no image/video/music/voice models, no neural TTS (no Piper,
  Kokoro, Siri, "Enhanced" or "Premium" voices), no MCP connectors, no Claude skills or plugins.
  Every pixel and every sample is produced by code you write and run locally.
- Dialogue: macOS `say` with classic non-neural voices only (e.g. Ralph, Fred, Junior, Albert,
  Kathy, Zarvox, Trinoids, Whisper, Bad News, Good News, Bubbles, Bahh, Grandma, Grandpa,
  Rocko, Reed). Use [[rate]], [[pbas]], [[pmod]], [[slnc]], [[emph]], and [[inpt TUNE]] for
  sung or precisely timed lines. Give each character a DSP signature (pedalboard/numpy: pitch
  shift, vibrato, growl, EQ, room). Crowd and background chatter is "animalese" gibberish.
- Lip sync without ML: phonemes from CMUdict/espeak-ng or authored TUNE timing, mapped to
  visemes A–H,X, plus an RMS jaw-open layer. Minimum 2 frames per viseme, lead audio by 1 frame.
- Music and sound effects are synthesized in numpy (or Tone.js Offline): score, drums, bass,
  motif per character, foley (heels, shutters, fabric, jewelry, umbrella pops), crowd.
  Mix with sidechain ducking under dialogue; master to -14 LUFS, -1 dBTP.
- Machine: Intel i9 Mac, 16 GB, no Homebrew. Do not use the GPU. Render with Remotion
  `--gl=swangle --concurrency=6` (or Playwright with --disable-gpu). ffmpeg comes from Remotion or
  imageio-ffmpeg (symlink into ./bin). Install only via npm/pip/conda-forge.
- Keep at least 2 CPU cores free. Never run more than 6 render workers.

STACK: Remotion 4 (React+SVG/Canvas). Every visual is a pure function of the frame number.
Seeded PRNG only, no Math.random or Date.

VISUAL STYLE (play to code's strengths): bold flat-vector "paper cutout" meets 1960s
Saul Bass / UPA fashion illustration. Limited palette (from bible/style.json), thick
boiling ink outlines (simplex-noise jitter reseeded every 2 frames), characters animated on twos,
camera on ones, paper-grain multiply texture, film grain, vignette, gradient rim light, runway
spotlight cones, flashbulb pops, 5–7 layer parallax, whip-pans with subframe motion blur,
confetti/sequin particles. Exaggerated silhouettes; grotesque = scale absurdity + accessory
excess, never gore.

ANIMATION QUALITY BAR: hierarchical SVG rigs with pivots, 2-bone IK for planted feet and hands on
props, rubber-hose bezier limbs, squash & stretch with volume preservation, anticipation → action
→ overshoot → settle, overlapping action (children lag 2–4 frames), holds of 6–12 frames on key
poses, damped-spring chains on every dangly accessory (earrings, straps, feathers, pearls,
umbrella canopies), parametric runway walk cycles unique to each species, seeded blinks,
breathing idle. No linear easing except mechanical motion. Text must be laid out along its
whole path and never collide. Compositions must be bold and fill the frame.

TEAM (spawn in phases; always pass each agent the bible paths and its contract):
 1 Screenwriter → story/script.fountain, story/beats.json
 2 Art Director → bible/style.json, 3 golden frames rendered in code, a do/don't sheet
 3–6 Character riggers (one per main character) → characters/<id>/rig.tsx + rig.json +
   an expression/viseme/turnaround sheet PNG
 7 Wardrobe/props → props/*.tsx with spring secondary motion and attach points
 8 Set painter → sets/*.tsx with parallax layers and lighting
 9 Voice → audio/dialogue/*.wav, timing/dialogue.json, timing/visemes/*.json
10 Composer → audio/music.wav, timing/beats.json
11 Sound designer → audio/sfx/*.wav, timing/sfx_cues.json
12–13 Scene animators (split the shots) → scenes/shotNN.tsx
14 Editor → timing/timeline.json, the animatic, final assembly and mix
15 QA reviewer → qa/ reports; can block any shot

PROCESS:
 Phase A (audio-first): script → voices → dialogue timing → beat grid → timeline.json →
   a 2:00 animatic with block shapes and captions. Show me the contact sheet, then proceed.
 Phase B: rigs, props and sets in parallel. Each agent renders a verification sheet PNG and
   views it with Read before handing off.
 Phase C: shots in parallel. For every shot, render stills at key frames plus an ffmpeg contact
   sheet (every 12th frame, 6×4 tile). Fix issues and iterate at least twice.
 Phase D: sound effects, mix, master, render per shot, concat, mux, final QA.
CONTRACTS: all colors, strokes, fonts and seeds come only from bible/style.json (lint for
 hard-coded hex values); all frame numbers come from timeline.json; the rig API is
 <Character id pose expression viseme facing t/>.
QA CHECKLIST per shot: on-model vs golden frames; no popping between consecutive frames; planted
 feet don't slide (numeric check); every plosive frame shows viseme A; props stay attached;
 readable silhouettes; LUFS/true-peak report; total runtime 115–125 s.
DELIVER: out/film.mp4, out/film_contact_sheet.png, a README with credits for each agent's
role, render stats, and a list of known weaknesses.
```

---

## 8. Honest limits and how to work around them

| Weak spot | Why | Mitigation |
|---|---|---|
| Subtle facial acting (micro-expressions, eye darts that read as thought) | Hand-coded faces tend to look puppet-like | Use swap-part faces with bold, readable expression presets (a UPA/Saul Bass graphic look). Get emotion from pose, silhouette, timing and camera. Big eyes, brows and a tilted head beat realism. |
| Complex cloth and hair | No simulation, and hand-drawn deformation is hard to write | Make clothes rigid sculptural couture (cages, crinolines, geometric capes); grotesque couture suits this anyway. Use spring chains for fringes, tassels and pearls. A paper-cutout style makes stiffness a feature. |
| Turnarounds and 3/4 views | A flat rig has only a few views | Stage in profile and front, like cutout animation (South Park and Paper-Mario logic). Hide flips with a squash "pop", a whip-pan or a cut. |
| Hands and fine manipulation | Many joints | Four-finger cartoon hands with 5 swap poses. Props attach at a socket. |
| Robotic TTS | `say` classic voices are formant or concatenative | Make it part of the concept: a retro-futurist "announcer", characters with DSP-signature voices, lines kept short and punchy, animalese for the crowd. Use music and sound effects to carry emotion. Or opt in to Piper (neural) as an explicitly separate tier. |
| Organic timing | LLMs tend toward uniform, linear, simultaneous motion (Code2Video) | Mandate the easing and hold rules, animate on twos, offset timing, and have QA review contact sheets. |
| Style drift across 15 agents | Independent authors | One style.json, golden frames, a hex-color lint, and a shared rig API. The orchestrator reviews the first shot from every animator before they continue. |
| Render cost of SVG filters | feTurbulence and blur are CPU-heavy | Pre-render static layers to PNG, apply grain as a cycled tile, avoid three.js/WebGL, and render proxies at 960×540 during iteration. |
| "Blow me away" expectations | Code-only 2D has a ceiling | Win on **design, rhythm and comedy**: frame-accurate music sync (cuts on downbeats), bold graphic compositions, choreographed runway sequences, one showpiece shot (a continuous camera move through 7 parallax layers with hundreds of seeded particles), a musical number sung via `[[inpt TUNE]]`, and credits that are themselves animated. |

---

## Sources

- claude-animation-studio: https://github.com/i-afaqrashid/claude-animation-studio
- ft-motion: https://github.com/anupamme/ft-motion
- svg-animation-studio: https://github.com/ChanMeng666/svg-animation-studio
- Rhubarb Lip Sync README: https://github.com/DanielSWolf/rhubarb-lip-sync/blob/master/README.adoc (release v1.14.0, 2025-04-03, via the GitHub API)
- Remotion license FAQ: https://www.remotion.dev/docs/license/faq (v4.0.529, 2026-09-25, via the GitHub API)
- Motion Canvas video rendering docs: https://motioncanvas.io/docs/rendering/video/ and headless issue https://github.com/motion-canvas/motion-canvas/issues/1218
- HeyGen Code2Video benchmark: https://www.heygen.com/research/introducing-code2video-benchmark
- TheoremExplainAgent: https://arxiv.org/abs/2502.19400
- Codrops, Claude mascot SVG+GSAP: https://tympanus.net/codrops/2026/05/05/reverse-engineering-claude-ais-mascot-animations-with-svg-and-gsap/
- Ruidiao, command-line cartoon (counter-example, uses generative models): https://ruidiao.substack.com/p/i-generated-a-cartoon-video-entirely
- growthexe, Claude Code + Remotion overview: https://growthexe.substack.com/p/everything-claude-code-remotion-can
- Package versions and wheels checked live on PyPI, npm and anaconda.org (conda-forge) on 2026-09-29.
