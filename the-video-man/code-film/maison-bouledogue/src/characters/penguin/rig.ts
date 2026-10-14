import { ease, lerp, track, wobble } from '../../lib/motion';

/**
 * PENGUIN pose parameters. All angles in degrees.
 * Local coords: origin = ground between feet, +x = facing, -y = up. Height 380 at scale 1
 * (the OPEN umbrella canopy extends far above that, to about y = -640).
 */
export const POSE_KEYS: { key: string; min: number; max: number; note: string }[] = [
  { key: 'bodyTilt', min: -90, max: 90, note: 'whole-body rotation about the hips (0,-60). negative = tip backwards' },
  { key: 'lean', min: -30, max: 40, note: 'torso lean about hips. positive = forward' },
  { key: 'crouch', min: 0, max: 1, note: 'knees-in crouch: drops body, splays legs, squashes' },
  { key: 'squash', min: -0.3, max: 0.3, note: 'volume-preserving squash (+) / stretch (-) of the body' },
  { key: 'legF', min: -60, max: 120, note: 'near leg swing at hip. positive = forward/up' },
  { key: 'legB', min: -60, max: 120, note: 'far leg swing at hip. positive = forward/up' },
  { key: 'toePoint', min: 0, max: 1, note: 'ballet point of both feet' },
  { key: 'flipF', min: -40, max: 200, note: 'near flipper at shoulder. 0 = hanging, 90 = forward horizontal, 180 = straight up' },
  { key: 'flipB', min: -40, max: 200, note: 'far flipper at shoulder (same convention)' },
  { key: 'flipFBend', min: -60, max: 60, note: 'near flipper wrist bend' },
  { key: 'flipBBend', min: -60, max: 60, note: 'far flipper wrist bend' },
  { key: 'headTilt', min: -30, max: 30, note: 'head rotation at neck. negative = nose up' },
  { key: 'slip', min: 0, max: 1, note: 'continuous SLIP overlay: feet fly up, body tips back, flippers flail (flail driven by frame)' },
  { key: 'tuck', min: 0, max: 1, note: 'continuous SPIN tuck overlay: knees up, flippers hugged, head down' },
  { key: 'hold', min: 0, max: 1, note: 'marker for the float grip; the grip itself is flipB=-160 (far flipper up-back, lands on the shaft at x~-76)' },
];

export type Pose = Record<string, number>;

export const DEFAULT_POSE: Pose = {
  bodyTilt: 0, lean: 0, crouch: 0, squash: 0, legF: 4, legB: -4, toePoint: 0,
  flipF: 14, flipB: 10, flipFBend: 8, flipBBend: 6, headTilt: 0, slip: 0, tuck: 0, hold: 0,
};

export const POSES: Record<string, Pose> = {
  idle: { ...DEFAULT_POSE },
  slip: { ...DEFAULT_POSE, slip: 1 },
  slide: {
    ...DEFAULT_POSE, crouch: 0.75, lean: 20, legF: 26, legB: -22, flipF: 96, flipB: 112,
    flipFBend: -22, flipBBend: 18, headTilt: -8,
  },
  spin: { ...DEFAULT_POSE, tuck: 1 },
  float: {
    ...DEFAULT_POSE, hold: 1, toePoint: 1, legF: 8, legB: -20, flipF: 118, flipFBend: -30,
    flipB: -160, flipBBend: 0, headTilt: -8, lean: -2, bodyTilt: -8, squash: -0.05,
  },
};

/** Expression presets (brows / eyes / beak / head attitude). */
export const EXPRESSIONS = ['prim', 'alarmed', 'terrified', 'serene', 'delighted'] as const;
export type Expression = typeof EXPRESSIONS[number];

export const blendPose = (a: Pose, b: Pose, t: number): Pose => {
  const out: Pose = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const va = a[k] ?? DEFAULT_POSE[k] ?? 0;
    const vb = b[k] ?? DEFAULT_POSE[k] ?? 0;
    out[k] = lerp(va, vb, t);
  });
  return out;
};

/**
 * Prim waddle. Tiny steps every 6 frames (12-frame cycle), side-to-side rock, flippers slightly out.
 * Returns pose (on twos), bob (y offset, negative = up, px at scale 1) and stepX = cumulative forward
 * travel in px at scale 1 (advance ~11 px per step, eased so each step 'pats' down).
 */
export const walkPose = (frame: number, opts: { stepLen?: number; startFrame?: number; prim?: number } = {}) => {
  const stepLen = opts.stepLen ?? 11;
  const f = Math.floor((frame - (opts.startFrame ?? 0)) / 2) * 2;
  const step = Math.floor(f / 6);
  const ph = (f % 6) / 6; // 0..1 within a step
  const side = step % 2 === 0 ? 1 : -1; // which foot is swinging
  const lift = Math.sin(ph * Math.PI);
  const rock = Math.sin(((f % 12) / 12) * Math.PI * 2);
  const prim = opts.prim ?? 1;
  const pose: Pose = {
    ...DEFAULT_POSE,
    bodyTilt: rock * 7,
    lean: 3,
    squash: 0.04 * (1 - lift) - 0.02 * lift,
    legF: side > 0 ? 4 + lift * 26 : 4 - lift * 6,
    legB: side < 0 ? -4 + lift * 24 : -4 - lift * 6,
    flipF: 30 + rock * 8 * prim,
    flipB: 26 - rock * 8 * prim,
    flipFBend: -14 - lift * 10,
    flipBBend: -10 - lift * 8,
    headTilt: -5 - rock * 3,
    toePoint: 0.15 * lift,
  };
  const bob = -lift * 5;
  const stepX = step * stepLen + ease.inOut(ph) * stepLen;
  return { pose, bob, stepX };
};

/**
 * Convenience for the shot: the umbrella POP, choreographed on ones around `popFrame` (the 'whump').
 *  popFrame-4 .. popFrame   anticipation: skirt squeezes in (u 0 -> 0.12)
 *  popFrame .. +2           skirt flares flat like a tutu (the whump)
 *  +2 .. +5                 runner shoots up the shaft, canopy blows inside-out past her head
 *  +5 .. +7                 snaps through into a dome and overshoots
 *  +7 .. +12                settles (openJiggle = damped wobble in degrees of rib spread)
 * `speed` scales the whole thing (1 = default ~16 frames).
 */
export const umbrellaPop = (frame: number, popFrame: number, speed = 1) => {
  const k = (d: number) => popFrame + d / speed;
  const umbrellaOpen = track(frame, [
    [k(-4), 0], [k(0), 0.12, ease.inOut], [k(2), 0.27, ease.in], [k(5), 0.56, (t) => t], [k(7), 0.76, ease.out], [k(12), 1, ease.out],
  ]);
  const openJiggle = wobble(frame, [[k(7), 22]], 2.4 * speed, 3.0);
  return { umbrellaOpen, openJiggle };
};
