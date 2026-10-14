// S3 "VERTIGO" choreography — pure functions of the absolute film frame.
// Flamingo root path is built so the planted shoe NEVER slides:
//   walk-in  (<584)      root = XA + FS * walkTravel(f, IN)
//   584..668 (on spot)   root = NF - FS * pose.nX   (near shoe pinned at world NF through strike / teeter / oneLeg / first exit step)
//   exit     (>=668)     root continues with walkTravel(f, OUT) from that pinned stance.
import { POSES, walkPose, walkTravel, blendPose, type Pose } from '../../characters/Flamingo';
import { onTwos, clamp, ease, track, lerp } from '../../lib/motion';
import { noise2 } from '../../lib/rng';
import type { CrowdState } from '../../sets/Runway';

export const T = {
  from: 456, to: 696,
  enter: 488, pose: 584, flash0: 586, flash1: 606, teeter0: 612, teeter1: 652, recover: 656, exitBlend: 660, exitStep: 668, exit: 664,
};
export const FS = 0.6;          // flamingo scale (heels fully telescoped: ~1160px tall at scale 1 -> ~700px)
export const HEEL = 1;          // heelExtend carried over from S2
export const STEP = 290;        // long runway stride (px per step at scale 1)
export const XC = 1400;         // world x of the root when she hits the pose

const IN = { phase: T.enter, stepX: STEP, heelExtend: HEEL };
const OUT = { phase: 656, stepX: STEP, heelExtend: HEEL };

const walkIn = (f: number) => walkPose(f, IN).pose;
const walkOut = (f: number) => walkPose(f, OUT).pose;
const XA = XC - FS * walkTravel(T.pose, IN);
const rootIn = (f: number) => XA + FS * walkTravel(f, IN);
/** Pinned near-shoe world x (heel strike at 584). */
const NF = rootIn(T.pose) + FS * walkIn(T.pose).nX;

export const FLASHES = [586, 588, 589, 592, 594, 597, 599, 601, 603, 606];

const strike: Pose = { ...POSES.strikePose, heelExtend: HEEL };
const tBase: Pose = { ...POSES.teeter, heelExtend: HEEL };
const oneLeg: Pose = { ...POSES.oneLeg, heelExtend: HEEL };

/** Teeter weight (0..1) and phase (cycles). */
export const teeterW = (f: number) => track(f, [[608, 0], [616, 1, ease.out], [640, 1], [654, 0, ease.inOut]]);
export const teeterPh = (f: number) => Math.max(0, f - 609) / 17;

const e = (g: number, a: number, b: number, fn = ease.inOut) => fn(clamp((g - a) / (b - a)));

/** Body pose at frame f (sampled on twos). */
export const poseAt = (f: number): Pose => {
  const g = onTwos(f);
  if (g < T.pose) return walkIn(g);
  let P: Pose;
  if (g < 594) {
    const t = clamp((g - T.pose) / 10);
    P = blendPose(walkIn(T.pose), strike, ease.out(t));
    P.fLift = (P.fLift ?? 0) + 70 * Math.sin(Math.PI * t);           // far shoe travels forward in the air
    P.fPitch = (P.fPitch ?? 0) - 18 * Math.sin(Math.PI * t);
    P.tilt += -6 * Math.sin(Math.PI * t);                             // little snap back as she plants
  } else if (g < 608) {
    P = { ...strike };
    // micro-preen for the cameras (head flicks on the flash storm)
    P.headTilt += 4 * Math.sin((g - 594) * 0.9);
    P.hipSway += 0.15 * Math.sin((g - 594) * 0.45);
  } else if (g < 646) {
    P = blendPose(strike, tBase, e(g, 608, 616));
    P.fLift = (P.fLift ?? 0) + 14 * Math.sin(Math.PI * clamp((g - 608) / 8));
  } else if (g < T.exitBlend) {
    const t = e(g, 646, 656, ease.out);
    P = blendPose(tBase, oneLeg, t);
    // relieved settle: overshoot of the lean after she finds the balance point
    P.tilt += 5 * Math.sin(Math.PI * clamp((g - 652) / 8));
  } else {
    const t = e(g, T.exitBlend, T.exitStep);
    P = blendPose(oneLeg, walkOut(g), t);
    if (g >= T.exitStep) P = walkOut(g);
  }
  P.teeter = teeterW(g);
  P.teeterPhase = teeterPh(g);
  return P;
};

const nXexit = walkOut(T.exitStep).nX;
/** Flamingo root world x. */
export const rootX = (f: number) => {
  if (f < T.pose) return rootIn(f);
  if (f < T.exitStep) return NF - FS * poseAt(f).nX;
  return NF - FS * nXexit + FS * (walkTravel(f, OUT) - walkTravel(T.exitStep, OUT));
};

export const expressionAt = (f: number) =>
  f < 590 ? 'fierce' : f < 611 ? 'smug' : f < 653 ? 'panic' : f < 663 ? 'relieved' : 'smug';

// ------------------------------------------------------------------ camera (on ones)
const camA = rootIn(T.enter) + 190;   // she is just off the left edge at 488
const camB = XC + 70 - 960;
export interface Cam { camX: number; camY: number; zoom: number; rot: number }
export const cameraAt = (f: number): Cam => {
  let camX = track(f, [[T.from, camA - 30], [496, camA, ease.out], [592, camB, ease.inOut], [664, camB + 8], [696, camB - 240, ease.in]]);
  let zoom = track(f, [[T.from, 1.03], [468, 1.0, ease.out], [584, 1.0], [590, 1.3, ease.outBack], [612, 1.32], [640, 1.35], [664, 1.33], [696, 1.6, ease.in]]);
  let camY = track(f, [[T.from, 0], [584, 0], [590, -122, ease.out], [664, -126], [696, -150, ease.in]]);
  // handheld breathing + teeter nerves
  const w = teeterW(f);
  camX += 3 * noise2('s3cx', 0, f * 0.05) + w * 5 * noise2('s3tx', 1, f * 0.3);
  camY += 2 * noise2('s3cy', 0, f * 0.05) + w * 4 * noise2('s3ty', 1, f * 0.3);
  // Dutch tilt follows her sway during the teeter
  const rot = w * 2.8 * Math.sin(2 * Math.PI * (teeterPh(f) - 0.12)) + track(f, [[650, 0], [656, -0.8], [664, 0]]);
  zoom += w * 0.015 * Math.sin(2 * Math.PI * teeterPh(f) * 2);
  return { camX, camY, zoom, rot };
};

// ------------------------------------------------------------------ crowd
const CROWD: [number, CrowdState, number][] = [
  [T.from, 'murmur', 1], [T.pose, 'lean', 10], [T.teeter0 + 2, 'gasp', 6], [T.recover, 'murmur', 16],
];
export const crowdAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < CROWD.length; k++) if (f >= CROWD[k][0]) i = k;
  const [f0, st, d] = CROWD[i];
  const prev = i > 0 ? CROWD[i - 1][1] : st;
  return { crowd: st, crowdFrom: prev, crowdT: clamp((f - f0) / d) };
};

/** Follow-spot x: waits near the entrance, then chases her with a little lag. */
export const spotX = (f: number) => {
  const wait = camA + 330;
  const tgt = (g: number) => Math.max(wait, rootX(g) + 20 * FS);
  // critically-damped chase, integrated from the cut
  let x = tgt(T.from), v = 0;
  const k = 70, c = 2 * Math.sqrt(k) * 0.95, dt = 1 / 24;
  for (let g = T.from; g < f; g++) {
    const a = k * (tgt(g) - x) - c * v;
    v += a * dt; x += v * dt;
  }
  return x;
};
export const lerpN = lerp;
