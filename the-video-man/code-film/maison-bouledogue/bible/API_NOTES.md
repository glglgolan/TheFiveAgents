# Asset API notes for shot animators (summarised from each owner's report — the source files are the truth)

## General
- Every shot = one full-frame `<svg viewBox="0 0 1920 1080">` inside an AbsoluteFill, with `<BoilDefs frame={frame}/>` once. Order: set `Back` → characters (+ reflections) → set `Front` → shot overlays.
- Characters draw in local coords (origin = ground between feet). Place with `<g transform={`translate(x,y) scale(s)`}>`.
- Most rigs want **functions of frame** so springs react to real motion: pass `poseFn`/`poseAt` and `worldX`/`travel`/`xFn`. A static `pose` alone gives dead accessories.
- Lip sync: Bulldog reads `visemeAt('bulldog', frame)` automatically when `viseme` is omitted. Mouse: pass `viseme={visemeAt('mouse', frame)}` (check Mouse.tsx whether it auto-reads). Dialogue actual frames: `src/data/dialogue_timing.json`.
- The crowd, spotlights, flashes, confetti are all driven by shot props — nothing is automatic.

## Bulldog — `src/characters/Bulldog.tsx` (H 420)
Props: `poseFn(f)=>Pose` (preferred), `worldX(f)`, `simFrom`, `impulses [f,amp][]`, `holdPearls`, `pearlSwing` deg, `monocleOut` 0..1, `headOnly`, `expression`, `viseme` (auto).
POSES: idle, shout, point, pearlWhip, shocked, pained, bow, smug. EXPRESSIONS: neutral, angry, smug, shocked, horrified, proud, pained.
Helpers: `blendPose`, `fullPose`, `waddlePose(frame,{cycle,stride,base})=>{pose,bob,x}`, `ikArm`. Arms are short — raised arm reaches cheek height.

## Mouse (Pipette) — `src/characters/Mouse.tsx` (H 170)
Props: `vel`, `impulses`, `poseFn`, `xFn`, `blink`, `showHammer`, `expression`, `viseme`.
POSES: idle, hammer, deadpanTalk, gasp, wink (finger-gun), clap, run. EXPRESSIONS: deadpan, worried, amazed, smug, wink.
Helpers: `blendPose`, `runPose(frame,{phase,amp})`, `clapPose(frame,period)`, `hammerSwingAt(frame, impactFrame)` (use with POSES.hammer; impact lands exactly on impactFrame; hammer impact point ~waist height in front of her). Also exports `Ladder` but the Backstage set already draws a stepladder — use the set's.

## Flamingo — `src/characters/Flamingo.tsx` (H 760)
Props: `poseAt(f)` (recommended), `travel(f)`, `impulses`, `shadow`, `expression`.
POSE_KEYS incl. `heelExtend` 0..1 (+400px telescoping stilts), `teeter` 0..1 + `teeterPhase` (cycles, ~1 per 16–20 frames), `fTuck`, wings, `headTilt`…
POSES: idle, strikePose, teeter, oneLeg. EXPRESSIONS: fierce, panic, relieved, smug.
Walk: `walkPose(frame,{phase,stepX,heelExtend})=>{pose,bob,stepX}`; near heel strikes when (frame-phase)%24==0, far at +12. Move root by `walkTravel(frame,{phase})*scale` (12.5 px/frame at scale 1, stepped on twos) — NOT a smooth speed. Pass `travel=f=>walkTravel(f,opts)` and `poseAt=f=>walkPose(f,opts).pose`. pose.bob already included.
S2: crop to legs, heelExtend 0→1 over 280–300, `impulses` amp≈1 at 214/238/262.

## Giraffe — `src/characters/Giraffe.tsx` (H ~900)
Props: `pearlsIntact` (default true), `snapFrame` (840), `bagImpulses [f,amp][]`, `expression`, `pose`.
POSES: idle, swoop (head faces audience), freeze (faces audience). EXPRESSIONS: aloof, shocked, mortified. Pose key `glassesSlide` 0..1, `headTurn` 0..1.
Walk: `walkPose(frame,{phase})=>{pose,bob,stepX}`; bob already inside pose.bodyY. Move by `x0 + (stepX(frame) - stepX(startFrame)) * scale`.
`pearlPositions(props)` → `{x,y,r}[]` local coords (flip/squash applied) of all ~272 pearls for the exact pose+frame → spawn particles there at 840. `bagImpulses=[[840,25]]`.

## Penguin (Madame Parapluie) — `src/characters/Penguin.tsx` (H 380)
Props: `umbrellaOpen` 0..1, `openJiggle`, `wind` 0..1, `spinAngle`, `spinSpeed` (deg/frame, smear full at |18|), `impulses`, `accel`, `expression`, `pose`.
POSES: idle, slip, slide, spin, float. EXPRESSIONS: prim, alarmed, terrified, serene, delighted.
Helpers: `blendPose`, `walkPose(frame,{stepLen=11,startFrame,prim})=>{pose,bob,stepX}` (stepX cumulative px @scale1), `umbrellaPop(frame, popFrame=1060, speed)=>{umbrellaOpen,openJiggle}`.
Float: blend slip→float over ~10 frames from 1060; expression terrified→alarmed→serene; wind≈0.5; offset her ~+70px to centre canopy in the spot. Spin smear only looks right if the shot rotates the whole character.

## Backstage set — `src/sets/Backstage.tsx`
`Back`/`Front` props: frame, camX (±200), camY, zoom, chaos 0..1, lampSwing [f,deg][], ladderX (default 1130; null hides), ladderShake 0..1.
`GROUND_Y=930`, `LADDER_H=340`, `layerT(p,camX,camY,zoom)`, `STAGING`. Wrap characters in `<g transform={layerT(1,camX,camY,zoom)}>`.
Staging @camX0: Bulldog (640,930) s1 facing right; Mouse on ladder top (1130,576) s1; Flamingo (1370,940) s≈1.9 legs only (body crops off top).

## Runway set — `src/sets/Runway.tsx`
`Back` props: frame, camX, camY, zoom, spots [{x(world),intensity,width}] (default DEFAULT_SPOTS; x>RUNWAY_END_X draws a beam into the drop), crowd 'murmur'|'lean'|'gasp'|'silent'|'cheer', crowdFrom, crowdT 0..1, lookX, flashFrames, dim 0..1.
`Front` props: frame, camX, camY, zoom, flashFrames (starbursts + exposure bump), confettiFrom.
Constants: `GROUND_Y=760`, `RUNWAY_END_X=3900`, `WORLD_W=4400`, `PARALLAX`. `runwayTransform(camX,camY,zoom)` — draw characters in WORLD coords inside `<g transform={runwayTransform(...)}>`. `worldToScreen`, `flashIntensity(frame,flashFrames)` (0..1 for brightening characters).
`<Reflection strength={0.32}>{chars}</Reflection>` before the characters in the same space (inside runwayTransform keep its camX default 0).
`FinalTitle({frame, from})` screen overlay (slam lands at from+6, subtitle from+14).
