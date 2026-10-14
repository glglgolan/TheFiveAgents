// S5 choreography — the penguin's world path, pose/expression timeline and the camera.
// All functions are pure functions of the ABSOLUTE film frame.
import { clamp, ease, lerp, onTwos, springFollow, track, wobble } from '../../lib/motion';
import { noise2 } from '../../lib/rng';
import { GROUND_Y, RUNWAY_END_X } from '../../sets/Runway';
import { POSES, blendPose, walkPose } from '../../characters/Penguin';

export const PS = 1; // penguin scale
export const F0 = 936, F1 = 1224;
export const ENTER = 956, SLIP = 992, LAND = 1002, SPIN0 = 1012, SPIN1 = 1036, LAUNCH = 1040, POP = 1060, UPROAR = 1176;
export const CLAPS = [1152, 1166];
export const X_ENTER = 860;
/** Hero pearl she steps on. */
export const HERO_PEARL_X = 1122;

const WALK_SPEED = 1.5; // pitter-pat: walk cycle played 1.5x
const STEP = 30;
const walkF = (f: number) => ENTER + (f - ENTER) * WALK_SPEED;
const walkAt = (f: number) => walkPose(walkF(f), { stepLen: STEP, startFrame: ENTER });

// ---------------- x path table (integer frames, lerped) ----------------
const vRaw = (f: number) =>
  track(f, [[SLIP, 7.5], [LAND, 24, ease.in], [SPIN0, 60, (t) => t], [SPIN1, 95, ease.out], [LAUNCH, 100, (t) => t]]);
const X: number[] = [];
{
  const xs = walkAt(SLIP).stepX * PS + X_ENTER;
  // scale the excess velocity so she reaches the runway end exactly at LAUNCH
  let raw = 0;
  for (let f = SLIP; f < LAUNCH; f++) raw += vRaw(f) - 7.5;
  const k = (RUNWAY_END_X - xs - 7.5 * (LAUNCH - SLIP)) / raw;
  let x = xs;
  for (let f = F0 - 40; f <= F1 + 40; f++) {
    if (f <= SLIP) X[f - (F0 - 40)] = X_ENTER + walkAt(Math.max(f, F0 - 40)).stepX * PS;
    else if (f <= LAUNCH) { x += 7.5 + k * (vRaw(f - 1) - 7.5); X[f - (F0 - 40)] = x; }
    else X[f - (F0 - 40)] = 0;
  }
}
export const vLaunch = () => X[LAUNCH - (F0 - 40)] - X[LAUNCH - 1 - (F0 - 40)];
const TAU = 3.2;
const xInt = (f: number) => {
  if (f > LAUNCH) {
    const t = f - LAUNCH;
    const air = RUNWAY_END_X + vLaunch() * TAU * (1 - Math.exp(-t / TAU));
    // gentle drift while floating
    const drift = f > POP ? Math.sin((f - POP) * 0.045) * 26 * clamp((f - POP) / 30) : 0;
    return air + drift;
  }
  const i = Math.floor(f) - (F0 - 40);
  const a = X[clamp(i, 0, X.length - 1)], b = X[clamp(i + 1, 0, X.length - 1)];
  return lerp(a, b, f - Math.floor(f));
};
/** Penguin root world x (feet). */
export const penX = (f: number) => xInt(f);
export const FLOAT_X = RUNWAY_END_X + 100 * TAU; // ~ where she hangs

/** Vertical offset of the feet from GROUND_Y (negative = up). */
export const penY = (f: number) => {
  if (f < SLIP) return walkAt(f).bob * PS;
  if (f < LAND) return -78 * Math.sin((Math.PI * (f - SLIP)) / (LAND - SLIP)) * (1 - 0.15 * ((f - SLIP) / 10));
  if (f < SPIN0) return -Math.abs(noise2('chatter', f * 0.9, 1)) * 4;
  if (f < SPIN1) return -Math.abs(Math.sin((spinAngle(f) * Math.PI) / 180)) * 30;
  if (f < LAUNCH) return 0;
  // launch -> hang -> drop -> pop catch -> bounce -> float up
  return track(f, [
    [LAUNCH, 0], [1047, -120, ease.out], [1052, -112, ease.inOut], [POP, 210, ease.in], [1064, 250, ease.out],
    [1071, 160, ease.inOut], [1080, 185, ease.inOut], [UPROAR, -430, ease.inOut], [1180, -455, ease.out], [F1, -560, ease.inOut],
  ]);
};

/** Whole-body spin (deg) applied by the shot. */
export const spinAngle = (f: number) => {
  if (f <= SPIN0 - 1) return 0;
  if (f >= SPIN1) return 720;
  const t = (f - (SPIN0 - 1)) / (SPIN1 - (SPIN0 - 1));
  return 720 * (t - Math.sin(2 * Math.PI * t) / (2 * Math.PI));
};
export const spinSpeed = (f: number) => spinAngle(f + 0.5) - spinAngle(f - 0.5);

/** Extra whole-body rotation (deg) outside the spin: launch tip, fall, float sway (pivot = canopy hub). */
export const bodyRot = (f: number) => {
  if (f < LAUNCH) return 0;
  if (f < POP) return track(f, [[LAUNCH, 0], [1046, -10], [1052, -4], [POP, 18, ease.in]]);
  // pendulum under the canopy: catch swing + gentle sway
  const catchSwing = wobble(f, [[POP + 4, -14]], 0.9, 1.6);
  const sway = Math.sin((f - POP) * 0.09) * 4.5 * clamp((f - POP - 8) / 30);
  const cheer = f >= UPROAR ? wobble(f, [[UPROAR, 7]], 1.4, 2) : 0;
  return lerp(18, 0, ease.out(clamp((f - POP) / 10))) + catchSwing + sway + cheer;
};

export const accelAt = (f: number) => clamp((penX(f + 1) - 2 * penX(f) + penX(f - 1)) / PS, -6, 6);

// ---------------- pose + expression ----------------
type Pose = Record<string, number>;
const wave = (f: number, amp: number, sp: number, ph = 0) => Math.sin(f * sp + ph) * amp;
const floatPose = (f: number): Pose => {
  const p = { ...POSES.float };
  p.flipF += wave(f, 14, 0.11);
  p.flipFBend += wave(f, 10, 0.11, 1.2);
  p.legF += wave(f, 7, 0.08, 0.5);
  p.legB += wave(f, 6, 0.08, 2.1);
  p.headTilt += wave(f, 3, 0.05);
  if (f >= UPROAR - 2) {
    const k = ease.outBack(clamp((f - (UPROAR - 2)) / 8));
    p.flipF = lerp(p.flipF, 168 + wave(f, 22, 0.55), k); // waving to the crowd
    p.flipFBend = lerp(p.flipFBend, wave(f, 30, 0.55, 1), k);
    p.legF = lerp(p.legF, 40 + wave(f, 26, 0.5), k); // delighted little kicks
    p.legB = lerp(p.legB, -10 + wave(f, 22, 0.5, 2), k);
    p.headTilt = lerp(p.headTilt, -14, k);
  }
  return p;
};

export const penPose = (frame: number): Pose => {
  const f = onTwos(frame);
  if (f < SLIP - 2) return walkAt(f).pose;
  if (f < SLIP) return blendPose(walkAt(f).pose, POSES.slip, 0.25); // foot rolls on the pearl
  if (f < LAND - 4) return blendPose(walkAt(SLIP).pose, POSES.slip, ease.out(clamp((f - SLIP + 2) / 5)));
  if (f < LAND + 2) {
    const p = blendPose(POSES.slip, POSES.slide, ease.inOut(clamp((f - (LAND - 4)) / 6)));
    return p;
  }
  if (f < SPIN0 - 2) {
    const p = { ...POSES.slide };
    p.squash = 0.14 * Math.exp(-(f - LAND) / 3); // landing squash
    p.flipF += wave(f, 14, 1.3);
    p.flipB += wave(f, 14, 1.1, 2);
    return p;
  }
  if (f < SPIN0 + 2) return blendPose(POSES.slide, POSES.spin, ease.inOut(clamp((f - (SPIN0 - 2)) / 4)));
  if (f < SPIN1 - 2) return POSES.spin;
  if (f < LAUNCH) return blendPose(POSES.spin, POSES.slip, ease.out(clamp((f - (SPIN1 - 2)) / 5)));
  if (f < 1046) return POSES.slip;
  if (f < 1052) {
    // cartoon hang: flailing freezes into a stiff 'uh-oh'
    const p = { ...POSES.slip };
    p.slip = 0.55;
    p.flipF = 150; p.flipB = 165; p.legF = 60; p.legB = 40; p.bodyTilt = 10;
    return p;
  }
  if (f < POP) return POSES.slip;
  if (f < POP + 12) return blendPose(POSES.slip, floatPose(f), ease.inOut(clamp((f - POP) / 10)));
  return floatPose(f);
};

export const penExpr = (frame: number) => {
  const f = onTwos(frame);
  if (f < SLIP - 2) return 'prim';
  if (f < SLIP + 2) return 'alarmed';
  if (f < POP + 4) return 'terrified';
  if (f < POP + 16) return 'alarmed';
  if (f < UPROAR) return 'serene';
  return 'delighted';
};

export const penImpulses: [number, number][] = [
  [SLIP, 1.4], [LAND, 1.2], [SPIN0, 0.8], [LAUNCH, 1.2], [1052, 0.8], [POP, 2.2], [POP + 7, 1], [UPROAR, 1.2],
];

// ---------------- camera ----------------
export const CAMX_MAX = 3050;
const CAM_PRE = 770;
const camXTarget = (f: number) => {
  if (f < SLIP) return track(f, [[F0, 960], [950, 955], [SLIP, CAM_PRE, ease.inOut]]);
  if (f < LAUNCH + 4) return clamp(penX(f) - 820, CAM_PRE, CAMX_MAX);
  return clamp(penX(Math.min(f, 1050)) - 960 + 60, CAM_PRE, CAMX_MAX);
};
/** Whip-tracking camera x (spring lags then overshoots). */
export const camXAt = (f: number) => (f < SLIP ? camXTarget(f) : springFollow(f, camXTarget, SLIP, 150, 17));

/** Screen y we want her body centre at while floating. */
const camYTarget = (f: number) => {
  if (f < LAUNCH) return 0;
  const bodyY = GROUND_Y + penY(Math.max(f, 1049)) - 250 * PS;
  return clamp(bodyY - 560, -640, 250);
};
export const camYAt = (f: number) => (f < LAUNCH - 2 ? 0 : springFollow(f, camYTarget, LAUNCH - 2, 60, 12));
