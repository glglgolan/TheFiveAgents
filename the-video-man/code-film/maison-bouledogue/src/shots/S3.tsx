// S3 (456–696) — FLAMINGO "VERTIGO". Runway, side view. Owner: Shot Animator B.
// Beats: cut on the downbeat (456) · L05 announcer (offscreen) · 488 strut in (heel strikes every 12f, no slide) ·
// 584 strikePose + punch-in · 586–606 flash storm · 612–652 teeter (Dutch tilt, crowd gasp) · 656 oneLeg recovery ·
// 664 smug strut off right (camera lets her go with a push) · cut 696.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../lib/style';
import { BoilDefs } from '../lib/fx';
import { FlashPops } from './s3/FlashPops';
import { clamp, track, ease } from '../lib/motion';
import Flamingo from '../characters/Flamingo';
import { Back, Front, DEFAULT_SPOTS, Reflection, runwayTransform, flashIntensity, GROUND_Y } from '../sets/Runway';
import { cameraAt, crowdAt, expressionAt, FLASHES, FS, poseAt, rootX, spotX, T } from './s3/choreo';

/** Brightens a character with the flash exposure (defs + filter id), only when needed. */
export const FlashLift: React.FC<{ id: string; amount: number }> = ({ id, amount }) => {
  const s = 1 + 0.55 * amount, b = 0.1 * amount;
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feComponentTransfer>
        <feFuncR type="linear" slope={s} intercept={b} />
        <feFuncG type="linear" slope={s} intercept={b} />
        <feFuncB type="linear" slope={s * 0.94} intercept={b * 0.8} />
      </feComponentTransfer>
    </filter>
  );
};

const travel = (f: number) => rootX(f) / FS;
const IMPULSES: [number, number][] = [[584, 0.5], [614, 0.8], [656, 0.9], [668, 0.4]];

const S3: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = cameraAt(frame);
  const x = rootX(frame);
  const fl = flashIntensity(frame, FLASHES);
  const crowd = crowdAt(frame);
  const sx = spotX(frame);
  const spotI = track(frame, [[T.from, 0.75], [492, 1.05, ease.out], [584, 1.1], [590, 1.35, ease.out], [612, 1.25], [664, 1.15], [696, 1.0]]);
  const spots = [
    ...DEFAULT_SPOTS.map((s) => ({ ...s, intensity: s.intensity * 0.45 })),
    { x: sx, intensity: spotI, width: 300 },
  ];
  const over = 1 + Math.abs(cam.rot) * 0.03;
  const expression = expressionAt(frame);
  const flam = (refl: boolean) => (
    <g transform={`translate(${x.toFixed(2)} ${GROUND_Y}) scale(${FS})`}>
      <Flamingo frame={frame} poseAt={poseAt} travel={travel} expression={expression} impulses={IMPULSES} shadow={!refl} />
    </g>
  );
  // hard cut on the beat: 2-frame exposure pop so the cut lands with the kick
  const cutPop = clamp(1 - (frame - T.from) / 3) * 0.18;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ display: 'block' }}>
        <BoilDefs frame={frame} />
        <defs>{fl > 0.01 && <FlashLift id="s3flash" amount={fl} />}</defs>
        <g transform={`translate(960 540) rotate(${cam.rot.toFixed(3)}) scale(${over.toFixed(4)}) translate(-960 -540)`}>
          <Back frame={frame} camX={cam.camX} camY={cam.camY} zoom={cam.zoom} spots={spots} lookX={x}
            crowd={crowd.crowd} crowdFrom={crowd.crowdFrom} crowdT={crowd.crowdT} flashFrames={FLASHES} />
          <g transform={runwayTransform(cam.camX, cam.camY, cam.zoom)}>
            <Reflection strength={0.3}>{flam(true)}</Reflection>
            <g filter={fl > 0.01 ? 'url(#s3flash)' : undefined}>{flam(false)}</g>
          </g>
          <Front frame={frame} camX={cam.camX} camY={cam.camY} zoom={cam.zoom} flashFrames={FLASHES} />
          <FlashPops frame={frame} flashFrames={FLASHES} camX={cam.camX} camY={cam.camY} zoom={cam.zoom} id="s3pop" />
        </g>
        {cutPop > 0 && <rect width={1920} height={1080} fill={C.spot} opacity={cutPop} />}
      </svg>
    </AbsoluteFill>
  );
};
export default S3;
