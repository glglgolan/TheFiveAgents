// Pipette the mouse — pose data, presets and cycle helpers (pure functions, no React).
import { onTwos, lerp, clamp } from '../../lib/motion';
import { hash01 } from '../../lib/rng';

export type Pose = Record<string, number>;

/**
 * [key, min, max, meaning]. Angles in degrees.
 * Arms: 0 = hanging down, 90 = pointing forward (+x), 180 = straight up, >180 = behind head.
 * Elbow: + bends the forearm further in the same (forward/up) direction.
 * Legs: hip + swings the thigh forward; knee + bends the shin backward.
 */
export const POSE_KEYS: [string, number, number, string][] = [
  ['bodyY', -60, 20, 'root vertical offset px (negative = up; hops/bob)'],
  ['squash', 0.75, 1.3, 'volume-preserving squash(<1)/stretch(>1) about the ground'],
  ['lean', -30, 35, 'torso lean deg (+ forward)'],
  ['hipX', -8, 8, 'pelvis shift px (weight shift)'],
  ['headTilt', -30, 30, 'head tilt deg (+ nose down)'],
  ['nearSh', -60, 230, 'near (front) shoulder angle'],
  ['nearEl', -10, 150, 'near elbow bend'],
  ['farSh', -60, 230, 'far (back) shoulder angle'],
  ['farEl', -10, 150, 'far elbow bend'],
  ['nearHip', -60, 70, 'near hip swing'],
  ['nearKnee', 0, 120, 'near knee bend'],
  ['farHip', -60, 70, 'far hip swing'],
  ['farKnee', 0, 120, 'far knee bend'],
  ['earBack', 0, 1, 'ears pinned back (gasp/fear)'],
  ['tailCurl', -1, 1.2, 'tail curl amount (+ curls up/over)'],
  ['tailLift', -40, 60, 'tail base lift deg'],
  ['lookX', -1, 1, 'pupil offset x (+ forward)'],
  ['lookY', -1, 1, 'pupil offset y (+ down)'],
  ['point', 0, 1, '>=0.5 near paw makes a finger-gun (index finger extended)'],
  ['hammer', 0, 1, '>=0.5 shows hammer prop in near paw and drives near arm from hammerSwing'],
  ['hammerSwing', -0.35, 1.25, '0 = raised overhead, 1 = impact. <0 anticipation wind-up, >1 overshoot'],
];

export const DEFAULT_POSE: Pose = {
  bodyY: 0, squash: 1, lean: 2, hipX: -1, headTilt: -2,
  nearSh: 8, nearEl: 18, farSh: -8, farEl: 16,
  nearHip: -2, nearKnee: 2, farHip: 14, farKnee: 22,
  earBack: 0, tailCurl: 0.6, tailLift: 0, lookX: 0.3, lookY: 0, hammer: 0, hammerSwing: 0, point: 0,
};

const P = (o: Pose): Pose => ({ ...DEFAULT_POSE, ...o });

export const POSES: Record<string, Pose> = {
  idle: P({}),
  hammer: P({ lean: 4, headTilt: 10, lookX: 0.8, lookY: 0.9, hammer: 1, hammerSwing: 0, farSh: 62, farEl: 30,
    nearHip: -8, nearKnee: 4, farHip: 8, farKnee: 10, tailCurl: 0.9, tailLift: 12 }),
  deadpanTalk: P({ lean: -3, headTilt: -4, hipX: 2, farSh: -40, farEl: 118, nearSh: 58, nearEl: 62,
    nearHip: 3, farHip: -10, farKnee: 6, tailCurl: 0.85, lookX: 1 }),
  gasp: P({ lean: -7, headTilt: -6, bodyY: -2, squash: 1.04, nearSh: 122, nearEl: 12, farSh: 112, farEl: 22,
    earBack: 1, tailCurl: -0.2, tailLift: 55, nearHip: 8, nearKnee: 4, farHip: -6, farKnee: 4, lookX: 0.2, lookY: -0.3 }),
  wink: P({ lean: -4, headTilt: -8, nearSh: 96, nearEl: 12, point: 1, farSh: -40, farEl: 118, tailCurl: 1.1, lookX: 1, hipX: 2 }),
  clap: P({ nearSh: 78, nearEl: 46, farSh: 70, farEl: 64, lean: 3, headTilt: -5, tailCurl: 0.8, lookX: 0.8 }),
  run: P({}), // filled below from runPose(0)
};

/** Blend two poses (union of keys, missing keys fall back to DEFAULT_POSE). */
export const blendPose = (a: Pose, b: Pose, t: number): Pose => {
  const out: Pose = {};
  const keys = new Set([...Object.keys(DEFAULT_POSE), ...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const va = a[k] ?? DEFAULT_POSE[k] ?? 0, vb = b[k] ?? DEFAULT_POSE[k] ?? 0;
    out[k] = lerp(va, vb, t);
  });
  return out;
};

/**
 * Run cycle: 8 frames per step (16-frame cycle), evaluated on twos.
 * Returns a full pose (bodyY carries the bob). opts.speed scales stride amplitude, opts.phase offsets (frames).
 */
export const runPose = (frame: number, opts: { phase?: number; amp?: number } = {}): Pose => {
  const f = onTwos(frame) + (opts.phase ?? 0);
  const a = opts.amp ?? 1;
  const ph = (2 * Math.PI * f) / 16;
  const s = Math.sin(ph), c = Math.cos(ph);
  const legSwing = 38 * a;
  return P({
    bodyY: -6 * a * Math.abs(c) + 1.5,
    squash: 1 + 0.05 * a * (Math.abs(c) - 0.5),
    lean: 14 * a,
    hipX: 0,
    headTilt: -6 + 3 * Math.abs(s),
    nearHip: legSwing * s,
    nearKnee: 12 + 62 * a * Math.max(0, c),
    farHip: -legSwing * s,
    farKnee: 12 + 62 * a * Math.max(0, -c),
    nearSh: 30 - 50 * a * s,
    nearEl: 80,
    farSh: 30 + 50 * a * s,
    farEl: 80,
    earBack: 0.35 * a,
    tailCurl: 0.2,
    tailLift: 20 * a,
    lookX: 1,
  });
};
POSES.run = runPose(0);

/** Clapping: paws meet every `period` frames (default 6), on twos. */
export const clapPose = (frame: number, period = 6): Pose => {
  const f = onTwos(frame);
  const t = 0.5 - 0.5 * Math.cos((2 * Math.PI * f) / period);
  return blendPose(POSES.clap, { ...POSES.clap, nearEl: 72, farEl: 38, nearSh: 84, farSh: 76 }, t);
};

/**
 * One hammer blow ending in an impact at `impactFrame`: wind-up (anticipation) -> fast swing -> overshoot -> settle.
 * Returns hammerSwing value; use with POSES.hammer. Blow window = 20 frames before impact to 8 after.
 */
export const hammerSwingAt = (frame: number, impactFrame: number): number => {
  const f = onTwos(frame) - impactFrame;
  if (f < -20) return 1;
  if (f < -12) return lerp(1, 0, easeInOut(clamp((f + 20) / 8)));      // lift
  if (f < -4) return lerp(0, -0.3, easeInOut(clamp((f + 12) / 8)));    // anticipation (further back)
  if (f < 0) return lerp(-0.3, 1.18, (clamp((f + 4) / 4)) ** 2);       // snap down
  if (f < 8) return 1 + 0.18 * Math.exp(-f / 2.2) * Math.cos(f * 0.9); // overshoot & settle
  return 1;
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---- expressions ----
export type Expr = {
  lidN: number; lidF: number;          // 0 open .. 1 closed
  browN: number; browF: number;        // brow rotation deg (+ = inner end up / worried)
  browY: number;                       // brow height offset (negative = raised)
  corner: number;                      // mouth corner -1 frown .. 1 smile
  pupil: number;                       // pupil scale
  eye: number;                         // eye size scale
  winkN?: boolean;                     // near eye closed as happy arc
  earBack: number;
  smirk?: number;                      // asymmetric corner lift
};
export const EXPRESSIONS: Record<string, Expr> = {
  deadpan: { lidN: 0.52, lidF: 0.52, browN: -4, browF: -4, browY: 1.5, corner: 0, pupil: 1, eye: 1, earBack: 0 },
  worried: { lidN: 0.12, lidF: 0.12, browN: 22, browF: 22, browY: -2.5, corner: -0.8, pupil: 0.8, eye: 1.05, earBack: 0.35 },
  amazed: { lidN: 0, lidF: 0, browN: 6, browF: 6, browY: -5, corner: 0, pupil: 0.62, eye: 1.2, earBack: 0 },
  smug: { lidN: 0.45, lidF: 0.5, browN: -14, browF: 4, browY: -1.5, corner: 0.35, smirk: 1, pupil: 1, eye: 1, earBack: 0 },
  wink: { lidN: 1, lidF: 0.18, browN: -8, browF: 6, browY: -2, corner: 0.8, pupil: 1, eye: 1, winkN: true, earBack: 0 },
};

/** Seeded blink amount 0..1 at frame (one blink per ~2.5s window, occasional double blink). */
export const blinkAt = (frame: number, seed = 'pipette'): number => {
  const win = 60;
  const w = Math.floor(frame / win);
  const off = 6 + Math.floor(hash01(seed, 'blink', w) * 44);
  const dt = frame - (w * win + off);
  const shape = [0.55, 1, 1, 0.45];
  if (dt >= 0 && dt < 4) return shape[dt];
  if (hash01(seed, 'dbl', w) > 0.7 && dt >= 6 && dt < 10) return shape[dt - 6];
  return 0;
};
