# Remotion Build Path

Builds `output/<name>.mp4` from `output/content.json` using the Remotion scaffold in
`scripts/remotion-template/`.

Remotion renders **video** (React → MP4). It is the choice for an animated,
"medium motion" presentation. Output is not editable as slides afterward.

## Setup (once per project)

Copy the template into the working dir as a build folder and install deps:

```bash
cp -R .claude/skills/presentation-builder/scripts/remotion-template ./.remotion-build
cd .remotion-build && npm install
```

Remotion v4 bundles its own ffmpeg — no system ffmpeg needed.

## Build

1. Write the deck to `output/content.json` (schema in `workflow.md`). It must match
   `src/types.ts` (`DeckProps`).
2. **Images**: for each `slide.image`, copy the file into
   `.remotion-build/public/` and set `slide.image` to just the **basename**
   (the scaffold loads images with `staticFile(slide.image)`, which resolves to
   `public/`). Images not copied will not render.
3. Render a still first to sanity-check, then the full MP4:

```bash
cd .remotion-build
npx remotion still Deck ../output/still.png --props=../output/content.json --frame=0
npx remotion render Deck ../output/<name>.mp4 --props=../output/content.json
```

`--props` overrides the bundled `sample-content.json` with the real deck. Duration is
computed automatically: `slides.length * secondsPerSlide * 30fps`.

## Motion design (medium, not flashy)

The scaffold already implements:
- **Cross-fade** in/out at each slide boundary (12 frames).
- **Spring entrance** (`damping: 200`) — title rises + fades in.
- **Staggered bullets** — each bullet springs in ~6 frames after the previous.
- **Large stat callouts** that spring in after the title.

Keep it tasteful. Do not add spinning, bouncing, or rapid effects. If you extend
motion, prefer `spring()` and `interpolate()` with gentle easing.

## RTL (Hebrew)

When `content.json` has `"dir": "rtl"` the scaffold automatically:
- Sets `direction: rtl` and `textAlign: right` on all text.
- Reverses column order in `two-column` / `image-left` / `image-right`.
- Puts bullet markers on the right.

Use an RTL-capable `theme.headerFont`/`bodyFont` (e.g. "Arial", "Heebo"). For a
non-system font, add a webfont via `@remotion/google-fonts` or a local font in the
scaffold and load it in `Root.tsx`.

## QA

Render still frames for a few key slides and inspect with a **subagent** (fresh
eyes) before the full render. Check for overflow, low contrast, and — for Hebrew —
correct RTL alignment and order. Fix once, then render the MP4.

## Cleanup

`.remotion-build/` is a scratch build dir; the deliverable is `output/<name>.mp4`.
Leave it for re-renders or remove it when done.
