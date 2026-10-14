# MAISON BOULEDOGUE — Studio Brief (read fully before working)

A 60-second 2D animated short made **100% from code**. You are one agent in a studio of ~14 agents working in parallel.

## Absolute rules
- **NO generative AI of any kind**: no image/video/music/voice models, no neural TTS, no MCP connectors, no Claude skills. Every pixel and audio sample comes from code you write.
- **Do not use the GPU.** Always render with `--gl=swangle`.
- **Only edit files you own** (listed in your task). Read anything. If you need a change in someone else's file, say so in your final report instead.
- Colors only from `src/lib/style.ts` (`C.*`, which reads `bible/style.json`). No hex literals in your files. Seeded randomness only (`src/lib/rng.ts`). No `Math.random`, no `Date`.
- Keep it deterministic: every visual is a pure function of `frame`.

## Project
- Root: `/Users/lirazgolan/claude_projects/TheFiveAgents/the-video-man/code-film/maison-bouledogue`
- Remotion 4 + React 18 + TypeScript. 1920×1080, 24 fps, 1440 frames.
- Story, shots, dialogue windows and the exact frame of every event: `src/data/timeline.json` (the contract — honor its frames).
- Style: `bible/style.json`. Look = **flat-vector paper cutout × 1960s Saul Bass / UPA fashion illustration**. Bold graphic silhouettes, thick round ink outlines (`ink()` helper), limited palette, halftone shading (`url(#halftone)` pattern), gradient rim light, visible paper-cut layering (slight offset drop shadow in `C.ink` at ~25% opacity). Grotesque = absurd scale and accessory excess, never gore. It should look like a gorgeous vintage fashion-illustration poster that moves.
- Helpers: `src/lib/motion.ts` (`onTwos`, `track` keyframes, `ease.*`, `wobble` damped impulses, `springFollow`, `pendulum`), `src/lib/fx.tsx` (`<BoilDefs frame/>` gives `filter="url(#boil)"` hand-drawn line boil + halftone patterns; `<FilmFinish/>` grain+vignette is applied globally by Film.tsx — don't add your own), `src/lib/visemes.ts` (`visemeAt(char, frame)`), `src/lib/types.ts` (`CharProps`, `Viseme`).

## Character contract (riggers)
- Default export: `React.FC<CharProps>` returning an SVG `<g>` in LOCAL coords: origin (0,0) = ground point between feet, facing +x (right), up = −y. Height at scale 1 = `HEIGHTS.<id>` in style.ts. `flip` mirrors to face left.
- Build a real hierarchical rig: nested `<g transform="translate(pivot) rotate(angle)">` per joint, pivots at anatomical joints. Named pose params in `pose` (document them in an exported `POSE_KEYS` array with ranges). Export pose presets `POSES: Record<string, Record<string,number>>` and helper functions the shot animators need (e.g. `walkPose(frame, opts)` returning a pose + body bob, for walkers).
- Animation quality bar: squash & stretch with volume preservation, overlapping action (children lag 2–4 frames), breathing idle driven by `frame`, seeded blinks, damped-spring secondary motion on EVERY dangling accessory (use `wobble`/`springFollow`/`pendulum` or accept an explicit `accel`/`impulses` prop). Poses animate on twos (`onTwos(frame)`), accessories may run on ones.
- Speaking characters: mouth drawn per `viseme` A–H,X (see `src/lib/types.ts` for the shape meanings) — each shape clearly distinct at 1080p from 3 m away. `expression` swaps brows/eyes/mouth-corner parts.
- Export `Sheet: React.FC` = a model sheet composition (uses `useCurrentFrame()`, 96 frames): paper background, the character large at left in idle, plus rows of small copies showing every POSE preset, every EXPRESSION, every viseme, and (for walkers) the walk cycle playing. Label each in `F.sans`. The sheet is how the QA director reviews you.
- Wrap drawn parts with `filter="url(#boil)"` for line boil where it looks good. The sheet's own `<svg>` must include `<BoilDefs frame={frame}/>`. (Shots include BoilDefs once in their svg, so the character itself must NOT render BoilDefs.)
- Performance: keep each character under ~250 SVG elements; avoid per-frame filters other than `#boil`; no blur filters.

## Set contract
- Export `Back` (layers behind characters) and `Front` (layers in front of characters) as `React.FC<{frame:number; camX?:number; camY?:number; zoom?:number; [k:string]:unknown}>` returning SVG `<g>` sized to a 1920×1080 viewBox. `camX` pans (parallax: far layers move less). Also `Sheet` composition showing the set at several camX values and all its state props.

## How to verify your work (mandatory, iterate at least 3 times)
```bash
cd /Users/lirazgolan/claude_projects/TheFiveAgents/the-video-man/code-film/maison-bouledogue
npx tsc -p . 2>&1 | grep <YourFile> ; npx remotion still src/index.ts <CompositionId> qa/<you>-<n>.png --frame=<N> --gl=swangle --scale=0.5
```
Then open the PNG with the Read tool and LOOK at it critically like an art director: silhouette readability, appeal, proportions, line quality, on-palette, does it match the brief, is it genuinely beautiful and funny? Fix and re-render. Several agents render at once, so use `--scale=0.5` for iteration and render one still at a time. For motion checks render 3–4 stills at different frames. Final check at `--scale=1`.
Type errors elsewhere in the project are not yours — only make sure your file has none.

## Final report (your last message)
Short: files you own, the exported API (props, POSE_KEYS, POSES, EXPRESSIONS, helpers with signatures), the paths of your best QA PNGs, and known weaknesses.
