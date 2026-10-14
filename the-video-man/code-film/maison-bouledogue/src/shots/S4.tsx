// S4 (696–936) — GIRAFFE + THE PEARL SNAP. Runway, side view. Owner: Shot Animator B.
// Beats: L06 announcer (offscreen) · 720 giraffe struts in (hoof-heel on every 12f, no slide) · 792 plants ·
// 804 neck swoop facing audience + push-in · 806–822 flash storm · 828–838 proud chin-lift strains the strand ·
// 840 SNAP (2-frame white hit, camera shake, slow-mo push; every pearl becomes a particle) · 852 freeze,
// 852–870 sunglasses slide, shocked -> mortified · 857–918 iris inset: Bouledogue "Non. Non non non non." ·
// camera pulls wide as the pearls rain, bounce and roll along the runway to 936 (S5 continues them).
//
// EXPORTS for S5/S6:
//   pearlFieldAt(frame) -> {x,y,r}[]   runway-WORLD coords (draw inside runwayTransform(camX,camY,zoom)); [] before 840;
//                                      deterministic, simulated to frame 1440 (pearls keep rolling / settling).
//   pearlStatesAt(frame)               same with depth z, height h, state (1 air, 2 rolling, 3 falling off edge), speed.
//   <PearlGround frame/> <PearlBodies frame pass?/>  ready-made renderers (world coords) if S5 wants the identical look.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../lib/style';
import { BoilDefs } from '../lib/fx';
import { FlashPops } from './s3/FlashPops';
import { ease, track } from '../lib/motion';
import Giraffe from '../characters/Giraffe';
import { Back, Front, DEFAULT_SPOTS, Reflection, runwayTransform, flashIntensity, GROUND_Y } from '../sets/Runway';
import { FlashLift } from './S3';
import { crowdAt, FLASHES, giraffeExpression, giraffePoseAt, giraffeRootX, GS, SNAP, T } from './s4/choreo';
import { cameraAt } from './s4/camera';
import { PearlBodies, PearlGround } from './s4/PearlLayer';
import { BulldogInset } from './s4/BulldogInset';

export { pearlFieldAt, pearlStatesAt } from './s4/pearls';
export { PearlBodies, PearlGround } from './s4/PearlLayer';
export { cameraAt } from './s4/camera';

const BAG: [number, number][] = [[792, 8], [SNAP, 25], [852, -10]];

const X720 = giraffeRootX(T.enter);

const S4: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = cameraAt(frame);
  const gx = giraffeRootX(frame);
  const fl = flashIntensity(frame, FLASHES);
  const crowd = crowdAt(frame);
  const intact = frame < SNAP;
  const pose = giraffePoseAt(frame);
  const spotX = track(frame, [[T.from, X720 + 520], [T.enter + 6, X720 + 520], [T.stop + 6, giraffeRootX(T.stop) + 40, ease.inOut]]);
  const spotI = track(frame, [[T.from, 0.8], [T.enter + 8, 1.1, ease.out], [T.pose, 1.2], [808, 1.4, ease.out], [SNAP, 1.3], [T.to, 1.15]]);
  const spots = [
    ...DEFAULT_SPOTS.map((s) => ({ ...s, intensity: s.intensity * 0.45 })),
    { x: spotX, intensity: spotI, width: 430 },
  ];
  const over = 1 + Math.abs(cam.rot) * 0.03;
  const hit = frame === SNAP ? 0.85 : frame === SNAP + 1 ? 0.45 : frame === SNAP + 2 ? 0.12 : 0;
  const giraffe = (refl: boolean) => (
    <g transform={`translate(${gx.toFixed(2)} ${GROUND_Y}) scale(${GS})`}>
      <Giraffe frame={frame} pose={pose} expression={giraffeExpression(frame)} pearlsIntact={intact} snapFrame={SNAP}
        bagImpulses={BAG} />
    </g>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ display: 'block' }}>
        <BoilDefs frame={frame} />
        <defs>{fl > 0.01 && <FlashLift id="s4flash" amount={fl} />}</defs>
        <g transform={`translate(960 540) rotate(${cam.rot.toFixed(3)}) scale(${over.toFixed(4)}) translate(-960 -540)`}>
          <Back frame={frame} camX={cam.camX} camY={cam.camY} zoom={cam.zoom} spots={spots} lookX={gx + 120}
            crowd={crowd.crowd} crowdFrom={crowd.crowdFrom} crowdT={crowd.crowdT} flashFrames={FLASHES} />
          <g transform={runwayTransform(cam.camX, cam.camY, cam.zoom)}>
            <Reflection strength={0.28}>{giraffe(true)}</Reflection>
            {!intact && <PearlGround frame={frame} flash={fl} />}
            {!intact && <PearlBodies frame={frame} pass="back" />}
            <g filter={fl > 0.01 ? 'url(#s4flash)' : undefined}>{giraffe(false)}</g>
            {!intact && <PearlBodies frame={frame} pass="front" flash={fl} />}
          </g>
          <Front frame={frame} camX={cam.camX} camY={cam.camY} zoom={cam.zoom} flashFrames={FLASHES} />
          <FlashPops frame={frame} flashFrames={FLASHES} camX={cam.camX} camY={cam.camY} zoom={cam.zoom} id="s4pop" />
        </g>
        {hit > 0 && <rect width={1920} height={1080} fill={C.white} opacity={hit} />}
        <BulldogInset frame={frame} />
      </svg>
    </AbsoluteFill>
  );
};
export default S4;
