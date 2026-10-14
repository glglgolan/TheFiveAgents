// Monsieur Bouledogue — rig data: pose keys, presets, expressions, visemes, IK, secondary-motion sim.
import { lerp } from '../../lib/motion';
import type { Viseme } from '../../lib/types';

export type Pose = Record<string, number>;

/** Every continuous pose parameter with its range, default and meaning. */
export const POSE_KEYS: { key: string; min: number; max: number; def: number; doc: string }[] = [
  { key: 'lean', min: -30, max: 40, def: 0, doc: 'whole-body lean about the feet, deg, + = forward (+x)' },
  { key: 'torso', min: -25, max: 70, def: 0, doc: 'bend at the hips, deg, + = forward (bow)' },
  { key: 'head', min: -35, max: 40, def: 0, doc: 'head on neck, deg, + = nod forward/down, - = chin up' },
  { key: 'headY', min: -24, max: 30, def: 0, doc: 'head offset along neck px, + = sink into ruff, - = neck stretch' },
  { key: 'armF', min: -40, max: 185, def: 12, doc: 'near (front, +x side) shoulder, deg from hanging, + = raise outward/forward (90 = horizontal point, 180 = straight up)' },
  { key: 'foreF', min: -160, max: 60, def: -20, doc: 'near elbow, deg; + = continue outward, - = bend inward/across body' },
  { key: 'pawF', min: -70, max: 70, def: 0, doc: 'near wrist, deg (same sign convention)' },
  { key: 'handF', min: 0, max: 2, def: 0, doc: 'near hand shape: 0 open paw, 1 fist, 2 pointing (rounded)' },
  { key: 'armB', min: -40, max: 185, def: 12, doc: 'far (-x side) shoulder, mirrored convention: + = raise outward (to -x)' },
  { key: 'foreB', min: -160, max: 60, def: -20, doc: 'far elbow' },
  { key: 'pawB', min: -70, max: 70, def: 0, doc: 'far wrist' },
  { key: 'handB', min: 0, max: 2, def: 0, doc: 'far hand shape: 0 open, 1 fist, 2 point' },
  { key: 'armBFront', min: 0, max: 1, def: 0, doc: '1 = draw far arm in front of body/head (paws to cheeks, crossed arms)' },
  { key: 'squash', min: -1, max: 1, def: 0, doc: 'volume-preserving squash (+) / stretch (-) about the feet' },
  { key: 'bodyY', min: -30, max: 50, def: 0, doc: 'hip drop px (+ = sink, legs compress)' },
  { key: 'puff', min: 0, max: 1, def: 0.4, doc: 'chest/belly puff; buttons strain' },
  { key: 'jaw', min: 0, max: 1, def: 0, doc: 'extra jaw drop added on top of the viseme' },
  { key: 'lookX', min: -1, max: 1, def: 0.3, doc: 'pupil direction x' },
  { key: 'lookY', min: -1, max: 1, def: 0, doc: 'pupil direction y (+ = down)' },
  { key: 'hatTip', min: -30, max: 30, def: 0, doc: 'tiny top hat extra tilt, deg' },
  { key: 'plumeDroop', min: 0, max: 1, def: 0, doc: 'ostrich plume flops forward over the face' },
  { key: 'stepF', min: -60, max: 60, def: 0, doc: 'near foot x offset px' },
  { key: 'liftF', min: 0, max: 40, def: 0, doc: 'near foot lift px' },
  { key: 'stepB', min: -60, max: 60, def: 0, doc: 'far foot x offset px' },
  { key: 'liftB', min: 0, max: 40, def: 0, doc: 'far foot lift px' },
];

export const DEFAULT_POSE: Pose = Object.fromEntries(POSE_KEYS.map((k) => [k.key, k.def]));
export const fullPose = (p?: Pose): Pose => ({ ...DEFAULT_POSE, ...(p || {}) });

/** Linear blend of two (partial) poses, t in [0,1] (use an ease on t). */
export const blendPose = (a: Pose, b: Pose, t: number): Pose => {
  const A = fullPose(a), B = fullPose(b);
  const o: Pose = {};
  for (const k of Object.keys(A)) o[k] = lerp(A[k], B[k] ?? A[k], t);
  return o;
};

// ---------------- skeleton constants (torso-local, origin = pelvis) ----------------
export const HIP_Y = -62;           // pelvis height above ground
export const NECK = { x: 6, y: -150 };
export const SH_F = { x: 94, y: -118 };   // near shoulder
export const SH_B = { x: -88, y: -118 };  // far shoulder
export const L1 = 64, L2 = 64;             // upper arm, forearm
const R2D = 180 / Math.PI, D2R = Math.PI / 180;

/**
 * Two-bone IK in torso space. Returns {arm, fore} in this rig's convention for side 'F' (near) or 'B' (far).
 * bend = +1 elbow out (default), -1 elbow in.
 */
export const ikArm = (side: 'F' | 'B', tx: number, ty: number, bend = 1) => {
  const S = side === 'F' ? SH_F : SH_B;
  let dx = tx - S.x; const dy = ty - S.y;
  if (side === 'B') dx = -dx;
  const D = Math.min(L1 + L2 - 0.5, Math.max(Math.abs(L1 - L2) + 1, Math.hypot(dx, dy)));
  const phi = Math.atan2(dx, dy);
  const al = Math.acos((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D));
  const be = Math.acos((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2));
  return { arm: (phi + bend * al) * R2D, fore: -bend * (Math.PI - be) * R2D };
};
/** Forward kinematics: wrist position in torso space. */
export const fkWrist = (side: 'F' | 'B', arm: number, fore: number) => {
  const S = side === 'F' ? SH_F : SH_B, sg = side === 'F' ? 1 : -1;
  const a = arm * D2R, b = (arm + fore) * D2R;
  return { x: S.x + sg * (L1 * Math.sin(a) + L2 * Math.sin(b)), y: S.y + L1 * Math.cos(a) + L2 * Math.cos(b) };
};

const ik = (side: 'F' | 'B', x: number, y: number, bend = 1): Pose => {
  const r = ikArm(side, x, y, bend);
  return side === 'F' ? { armF: r.arm, foreF: r.fore } : { armB: r.arm, foreB: r.fore };
};

// ---------------- presets ----------------
export const POSES: Record<string, Pose> = {
  idle: { lean: -2, torso: -4, head: -6, puff: 0.7, ...ik('F', 134, -34), pawF: -70, handF: 1, ...ik('B', -128, -34), pawB: -70, handB: 1, lookX: 0.35 },
  shout: { lean: 8, torso: 8, head: 6, headY: -8, armF: 138, foreF: 32, pawF: 10, handF: 1, armB: 64, foreB: 30, pawB: 10, handB: 1, puff: 0.9, jaw: 0.55, squash: -0.2, lookX: 0.8, lookY: 0.2, hatTip: -8, stepF: 22 },
  point: { lean: 8, torso: 6, head: 2, armF: 90, foreF: 0, pawF: 0, handF: 2, ...ik('B', -128, -34), pawB: -70, handB: 1, puff: 0.7, lookX: 1, stepF: 18 },
  pearlWhip: { lean: -4, torso: -8, head: -18, headY: -6, armF: 150, foreF: 24, pawF: 0, handF: 1, ...ik('B', -128, -34), pawB: -70, handB: 1, squash: -0.3, puff: 0.9, lookX: 0.6, lookY: -1 },
  shocked: { lean: -9, torso: -10, head: -6, headY: -14, ...ik('F', 128, -198), pawF: 20, handF: 0, ...ik('B', -106, -186), pawB: 20, handB: 0, armBFront: 1, squash: -0.28, puff: 0.3, lookX: 0, hatTip: -12 },
  pained: { lean: -3, torso: 10, head: 18, headY: 12, ...ik('F', 100, -236), pawF: 30, handF: 0, armB: 14, foreB: -40, handB: 0, squash: 0.35, bodyY: 16, puff: 0.1, lookX: 0.2, lookY: 0.6 },
  bow: { lean: 4, torso: 40, head: 20, headY: 4, ...ik('F', 44, -52, -1), pawF: -30, handF: 0, armB: 100, foreB: 20, pawB: 20, handB: 0, plumeDroop: 1, stepB: -26, squash: 0.08, puff: 0.5, lookX: 0.6, lookY: 0.4, hatTip: 10 },
  smug: { lean: -7, torso: -6, head: -16, headY: -4, ...ik('F', -24, -72), pawF: -20, handF: 0, ...ik('B', 34, -80), pawB: -20, handB: 0, armBFront: 1, puff: 1, lookX: 0.6, lookY: -0.2 },
};

/** Waddle (for stepping out in S6). Returns pose + vertical bob (px) + x advance (px) at frame. cycle frames per 2 steps. */
export const waddlePose = (frame: number, opts: { cycle?: number; stride?: number; base?: Pose } = {}) => {
  const cycle = opts.cycle ?? 24, stride = opts.stride ?? 34;
  const ph = (frame / cycle) * Math.PI * 2;
  const s = Math.sin(ph), c = Math.cos(ph);
  const base = fullPose(opts.base ?? POSES.idle);
  const pose: Pose = {
    ...base,
    stepF: s * stride * 0.5, liftF: Math.max(0, c) * 12,
    stepB: -s * stride * 0.5, liftB: Math.max(0, -c) * 12,
    lean: base.lean + 3 + Math.abs(c) * 1.5,
    torso: base.torso + s * 2.5,
    head: base.head - s * 3,
    bodyY: base.bodyY - Math.abs(c) * 4,
    armF: base.armF + s * 10, armB: base.armB - s * 10,
  };
  return { pose, bob: -Math.abs(c) * 6, x: (frame / cycle) * stride * 2 };
};

// ---------------- expressions ----------------
export interface Expr {
  brow: number;     // + inner ends down (angry), - inner ends up (worried)
  browY: number;    // px, - = raised
  browFarY: number; // extra raise of the far brow (quizzical/smug)
  lidT: number; lidB: number; // 0..1 lid coverage
  eye: number;      // eyeball scale (bulge)
  pupil: number;    // pupil scale
  curveF: number; curveB: number; // resting mouth-corner curve near/far (+ up)
  vein: number; sweat: number; furrow: number; monocle: number; // monocle 1 = popped out
  jaw: number; grit: number; // resting jaw drop 0..1, clenched-teeth grimace 0/1
}
const E0: Expr = { brow: 6, browY: 0, browFarY: 0, lidT: 0.3, lidB: 0.12, eye: 1, pupil: 1, curveF: -0.5, curveB: -0.5, vein: 0, sweat: 0, furrow: 0.3, monocle: 0, jaw: 0, grit: 0 };
export const EXPRESSIONS: Record<string, Expr> = {
  neutral: E0,
  angry: { ...E0, brow: 28, browY: 10, lidT: 0.34, lidB: 0.18, pupil: 0.7, curveF: -1, curveB: -1, vein: 1, furrow: 1, grit: 1 },
  smug: { ...E0, brow: -4, browY: -2, browFarY: -14, lidT: 0.56, lidB: 0.22, pupil: 0.95, curveF: 1, curveB: -0.3, furrow: 0 },
  shocked: { ...E0, brow: -12, browY: -26, lidT: 0, lidB: 0, eye: 1.28, pupil: 0.45, curveF: -0.6, curveB: -0.6, furrow: 0, jaw: 0.3 },
  horrified: { ...E0, brow: -26, browY: -20, lidT: 0, lidB: 0, eye: 1.32, pupil: 0.36, curveF: -1, curveB: -1, sweat: 1, monocle: 1, furrow: 0.6, jaw: 0.45 },
  proud: { ...E0, brow: -6, browY: -8, lidT: 0.5, lidB: 0.26, pupil: 1, curveF: 0.7, curveB: 0.5, furrow: 0 },
  pained: { ...E0, brow: -24, browY: -2, lidT: 0.78, lidB: 0.5, eye: 0.95, pupil: 0.8, curveF: -0.9, curveB: -0.9, sweat: 1, furrow: 1, grit: 1 },
};
export const EXPRESSION_NAMES = Object.keys(EXPRESSIONS);

// ---------------- visemes ----------------
export interface MouthShape { open: number; w: number; round: number; up: number; low: number; tongue: number; press: number }
export const MOUTH: Record<Viseme, MouthShape> = {
  X: { open: 0, w: 1, round: 0, up: 0, low: 1, tongue: 0, press: 0 },
  A: { open: 0, w: 0.92, round: 0, up: 0, low: 1, tongue: 0, press: 1 },
  B: { open: 11, w: 0.95, round: 0, up: 1, low: 1, tongue: 0, press: 0 },
  C: { open: 28, w: 1, round: 0, up: 1, low: 1, tongue: 1, press: 0 },
  D: { open: 54, w: 1.1, round: 0, up: 1, low: 1, tongue: 1, press: 0 },
  E: { open: 34, w: 0.62, round: 1, up: 0, low: 1, tongue: 1, press: 0 },
  F: { open: 14, w: 0.38, round: 1, up: 0, low: 1, tongue: 0, press: 0 },
  G: { open: 3, w: 0.95, round: 0, up: 2, low: 0, tongue: 0, press: 0 },
  H: { open: 30, w: 0.9, round: 0, up: 1, low: 1, tongue: 2, press: 0 },
};
export const VISEMES: Viseme[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];

// ---------------- secondary motion ----------------
export interface SimOut {
  plume1: number; plume2: number; plumeX: number; // deg lags (head-relative), px lag
  jowlX: number; jowlY: number; ear: number;
  mono: number; scis: number; hem: number; pearl: number; button: number;
}
/**
 * Integrates a bank of damped springs following pose-derived drivers from `from` to `frame`.
 * Each output is (follower - driver): a lag that trails, overshoots and settles.
 */
export const simulate = (
  frame: number, from: number,
  poseAt: (f: number) => Pose, worldX: (f: number) => number, jawAt: (f: number) => number,
): SimOut => {
  const drv = (f: number) => {
    const p = poseAt(f);
    const breath = Math.sin((f / 48) * Math.PI * 2);
    const hA = p.lean + p.torso + p.head;
    const hX = worldX(f) + 5.2 * p.lean + 2.6 * p.torso + 1.5 * p.head;
    const hY = p.bodyY + p.headY + p.squash * 30 + breath * 1.6 - p.lean * 0.3;
    const bX = worldX(f) + 3.6 * p.lean + 1.6 * p.torso;
    const w = fkWrist('F', p.armF, p.foreF);
    const pX = worldX(f) + w.x - w.y * (p.lean + p.torso) * D2R;
    return [hA, hA, hX, hA, hY + jawAt(f) * 22, hA, hX, bX, bX, pX, bX];
  };
  //            plume1 plume2 plumeX jowlX jowlY  ear   mono  scis  hem   pearl button
  const K = [70, 26, 36, 150, 190, 120, 45, 42, 30, 34, 60];
  const Cc = [6.5, 3.4, 4, 9, 8, 7, 3, 2.6, 3.4, 2.2, 2.4];
  const n = K.length;
  const start = Math.min(from, frame);
  const x = drv(start).slice(), v = new Array(n).fill(0);
  const sub = 2, dt = 1 / 24 / sub;
  for (let f = start; f < frame; f++) {
    for (let s = 0; s < sub; s++) {
      const t = drv(f + s / sub);
      for (let i = 0; i < n; i++) {
        const a = K[i] * (t[i] - x[i]) - Cc[i] * v[i];
        v[i] += a * dt; x[i] += v[i] * dt;
      }
    }
  }
  const d = drv(frame);
  const L = x.map((xi, i) => xi - d[i]);
  return { plume1: L[0], plume2: L[1], plumeX: L[2], jowlX: L[3], jowlY: L[4], ear: L[5], mono: L[6], scis: L[7], hem: L[8], pearl: L[9], button: L[10] };
};
