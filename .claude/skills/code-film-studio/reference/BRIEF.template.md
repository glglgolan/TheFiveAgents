# __TITLE__ — Studio Brief (read fully before working)

A short animated film made **100% from code**. You are one agent in a small studio working in parallel.

## Absolute rules
- **NO generative AI of any kind**: no image/video/music/voice models, no neural TTS, no MCP connectors, no Claude skills for asset generation. Every pixel and audio sample comes from code you write.
- **Do not use the GPU.** Renders use `--gl=swiftshader` (see `scripts/render.sh`) — CPU-only, ~7x faster than `swangle` for identical output. Never suggest a GPU-based `--gl` value.
- **Only edit files you own** (listed in your task). Read anything. If you need a change in someone else's file, say so in your final report instead of editing it.
- Colors only from `src/lib/style.ts` (`C.*`, reads `bible/style.json`). No hex literals in your files. Seeded randomness only (`src/lib/rng.ts`). No `Math.random`, no `Date`.
- Keep it deterministic: every visual is a pure function of `frame`.
- **Report tersely.** Your final message: a bullet list only — files owned, exported API (one line per prop/function), best QA image paths, known weaknesses, issues found in others' assets. No prose paragraphs, no restating the brief. Long reports are read by the orchestrator and cost real money to both write and read.

## Project
- Root: `__PROJECT_DIR__`
- Remotion 4 + React 18 + TypeScript. See `bible/style.json` for format (resolution/fps/duration).
- Story, shots, dialogue windows and the exact frame of every event: `src/data/timeline.json` (the contract — honor its frames).
- Style: `bible/style.json`. Look: see its `"look"` field.
- Helpers: `src/lib/motion.ts` (`onTwos`, `track` keyframes, `ease.*`, `wobble` damped impulses, `springFollow`, `pendulum`), `src/lib/fx.tsx` (`<BoilDefs frame/>` gives `filter="url(#boil)"` line-boil + halftone patterns; `<FilmFinish/>` grain+vignette is applied globally — don't add your own), `src/lib/visemes.ts` (`visemeAt(char, frame)`), `src/lib/types.ts` (`CharProps`, `Viseme`).

## Character contract (riggers)
- Default export: `React.FC<CharProps>` returning an SVG `<g>` in LOCAL coords: origin (0,0) = ground point between feet, facing +x (right), up = −y. Height at scale 1 = `HEIGHTS.<id>` in style.ts. `flip` mirrors to face left.
- Build a real hierarchical rig: nested `<g transform="translate(pivot) rotate(angle)">` per joint. Named pose params in `pose`, documented as an exported `POSE_KEYS` array with ranges. Export pose presets `POSES` and any helper the shot animators will need (e.g. `walkPose(frame, opts)`).
- Animation quality bar: squash & stretch with volume preservation, overlapping action (children lag 2–4 frames), breathing idle, seeded blinks, damped-spring secondary motion on every dangling accessory. Poses animate on twos (`onTwos(frame)`); accessories may run on ones.
- Speaking characters: mouth drawn per `viseme` A–H,X (see `src/lib/types.ts`). `expression` swaps brows/eyes/mouth-corner parts.
- Export `Sheet: React.FC` = a model-sheet composition (96 frames): the character large at left in idle, plus rows showing every POSE preset, every EXPRESSION, every viseme, and (for walkers) the walk cycle. This is how QA reviews you.
- Wrap drawn parts with `filter="url(#boil)"` where it helps; the sheet's own `<svg>` must include `<BoilDefs frame={frame}/>` (shots already include it once, so the character itself must NOT render BoilDefs).
- Performance: keep each character under ~250 SVG elements; avoid per-frame filters other than `#boil`; no blur filters.

## Set contract
- Export `Back` (behind characters) and `Front` (in front of characters) as `React.FC<{frame:number; camX?:number; camY?:number; zoom?:number; [k:string]:unknown}>` returning SVG `<g>` sized to the format's viewBox. `camX` pans (parallax: far layers move less). Also `Sheet` showing the set at a few camX/state combinations.

## How to verify your work (iterate at least 2–3 times)
```bash
cd __PROJECT_DIR__
npx tsc -p . 2>&1 | grep <YourFile>
npx remotion still src/index.ts <CompositionId> qa/<you>-<n>.png --frame=<N> --gl=swiftshader --scale=0.5
```
Open the PNG with the Read tool and look at it critically: silhouette readability, proportions, line quality, on-palette, does it match the brief. Fix and re-render at `--scale=1` for your final check. Type errors elsewhere in the project are not yours.

## Final report
Bullet list only (see "Absolute rules" above).
