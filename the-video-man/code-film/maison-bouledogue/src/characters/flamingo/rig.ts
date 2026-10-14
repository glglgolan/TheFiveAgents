/**
 * FLAMINGO rig — skeleton, pose params, IK/FK solver, walk cycle.
 * Local coords: origin = ground point between the feet, +x = facing, -y = up. Units = px at scale 1.
 * Pure functions of their inputs (deterministic).
 */
import { onTwos, ease, clamp, lerp } from '../../lib/motion';

export const DIM = {
  H0: 190,          // ankle (heel-top) height above ground at heelExtend 0  (~1/4 of 760)
  EXT: 400,         // extra heel height at heelExtend 1 (telescoped)
  TIB: 128,         // tibia: hip socket -> backward "knee" (the flamingo ankle joint)
  TAR: 170,         // tarsus: knee -> ankle (top of the stiletto)
  HIP_H: 224,       // hip height above the ankles when standing
  TOE: 110,         // heel-tip -> toe-front distance of the shoe on the ground
  SOCKET_N: [8, 4] as const,
  SOCKET_F: [-6, 0] as const,
  SHOULDER: [10, -100] as const,
  FSHOULDER: [-16, -106] as const,
  NECK_BASE: [26, -112] as const,
  NECK: [30, 32, 28] as const,
  NECK_S: [26, -40, 20] as const,
  WING_UP: 62,
  WING_FORE: 56,
};

export type Pose = Record<string, number>;

/** Every pose key with its range. Angles in degrees. */
export const POSE_KEYS: { key: string; min: number; max: number; desc: string }[] = [
  { key: 'heelExtend', min: 0, max: 1, desc: 'telescoping heel height: 0 = merely tall (190px), 1 = +400px. Legs stay attached; whole body rises.' },
  { key: 'hipX', min: -60, max: 60, desc: 'hip (pelvis) x offset, px' },
  { key: 'bob', min: -30, max: 30, desc: 'hip vertical offset, px, + = down' },
  { key: 'tilt', min: -45, max: 45, desc: 'torso lean around hip, + = forward' },
  { key: 'hipSway', min: -1, max: 1, desc: 'skirt/tail swish (runway hip sway)' },
  { key: 'squash', min: -1, max: 1, desc: 'body squash(+)/stretch(-), volume preserving' },
  { key: 'nX', min: -200, max: 200, desc: 'near shoe: heel-tip ground x (when flat)' },
  { key: 'nLift', min: 0, max: 300, desc: 'near shoe lift above ground, px' },
  { key: 'nPitch', min: -90, max: 30, desc: 'near shoe pitch, + = toe up (pivots on heel tip), - = heel up (pivots on toe)' },
  { key: 'fX', min: -200, max: 200, desc: 'far shoe heel-tip ground x' },
  { key: 'fLift', min: 0, max: 300, desc: 'far shoe lift' },
  { key: 'fPitch', min: -90, max: 30, desc: 'far shoe pitch' },
  { key: 'fTuck', min: 0, max: 1, desc: 'far leg folds up into the flamingo "4" (one-leg stance)' },
  { key: 'nWingSh', min: -180, max: 900, desc: 'near wing shoulder, 0 = hanging, + = swings forward/up (windmill goes past 360)' },
  { key: 'nWingEl', min: -30, max: 150, desc: 'near elbow bend, + = forward' },
  { key: 'nWingHand', min: -60, max: 90, desc: 'near wrist' },
  { key: 'fWingSh', min: -180, max: 900, desc: 'far wing shoulder' },
  { key: 'fWingEl', min: -30, max: 150, desc: 'far elbow' },
  { key: 'fWingHand', min: -60, max: 90, desc: 'far wrist' },
  { key: 'wingFan', min: 0, max: 1, desc: 'primary feathers fanned open' },
  { key: 'neckLean', min: -40, max: 40, desc: 'whole-neck lean, + = forward' },
  { key: 'neckS', min: 0, max: 1.6, desc: 'S-curve amount of the neck (less = straighter & taller)' },
  { key: 'headTilt', min: -40, max: 50, desc: 'head angle in WORLD, + = beak up (stays proud regardless of body)' },
  { key: 'beakOpen', min: 0, max: 1, desc: 'lower mandible drop (also driven by expression)' },
  { key: 'teeter', min: 0, max: 1, desc: 'amount of the big wobble (tilts body, windmills wings, crystals go wild)' },
  { key: 'teeterPhase', min: 0, max: 99, desc: 'wobble phase in cycles; animate it upward (~1 cycle per 16-20 frames)' },
];

export const DEFAULT_POSE: Pose = {
  heelExtend: 0, hipX: 0, bob: 0, tilt: 3, hipSway: 0, squash: 0,
  nX: -14, nLift: 0, nPitch: 0, fX: -52, fLift: 0, fPitch: 0, fTuck: 0,
  nWingSh: 8, nWingEl: 22, nWingHand: 10, fWingSh: -4, fWingEl: 16, fWingHand: 6, wingFan: 0.25,
  neckLean: 2, neckS: 1, headTilt: 10, beakOpen: 0, teeter: 0, teeterPhase: 0,
};

export const POSES: Record<string, Pose> = {
  idle: { ...DEFAULT_POSE },
  strikePose: {
    ...DEFAULT_POSE, hipX: -26, bob: 6, tilt: -9, hipSway: -0.9, squash: 0.2,
    nX: 40, nPitch: 0, fX: -44, fPitch: 0,
    nWingSh: -38, nWingEl: 118, nWingHand: 30,      // wing on hip
    fWingSh: 150, fWingEl: 40, fWingHand: -10, wingFan: 0.9, // far wing flung up behind the head
    neckLean: -6, neckS: 0.8, headTilt: 28,
  },
  teeter: {
    ...DEFAULT_POSE, teeter: 1, teeterPhase: 0.25, nX: 0, fX: -40,
  },
  oneLeg: {
    ...DEFAULT_POSE, hipX: -40, tilt: 8, bob: 4, nX: -64, nPitch: 0, fX: -40, fTuck: 1,
    nWingSh: 110, nWingEl: -10, nWingHand: -18, fWingSh: 136, fWingEl: -6, fWingHand: -14, wingFan: 1,
    neckLean: -4, neckS: 0.9, headTilt: 18,
  },
};

/** Linear blend of two (partial) poses; missing keys fall back to DEFAULT_POSE. */
export const blendPose = (a: Pose, b: Pose, t: number): Pose => {
  const out: Pose = {};
  const keys = new Set([...Object.keys(DEFAULT_POSE), ...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const va = a[k] ?? DEFAULT_POSE[k] ?? 0;
    const vb = b[k] ?? DEFAULT_POSE[k] ?? 0;
    out[k] = va + (vb - va) * t;
  });
  return out;
};

// ------------------------------------------------------------------ geometry
export type V2 = { x: number; y: number };
const D2R = Math.PI / 180;
/** SVG rotate(a) applied to vector. */
export const rot = (x: number, y: number, aDeg: number): V2 => {
  const a = aDeg * D2R, c = Math.cos(a), s = Math.sin(a);
  return { x: x * c - y * s, y: x * s + y * c };
};
/** SVG angle that maps local +y (down) onto direction (dx,dy). */
export const angDown = (dx: number, dy: number) => Math.atan2(-dx, dy) / D2R;

export const heelHeight = (heelExtend: number) => DIM.H0 + DIM.EXT * clamp(heelExtend, 0, 1.5);

/**
 * Ankle position (root coords) for a shoe whose flat heel-tip sits at ground x, with pitch (deg, + toe up).
 * Toe-up pivots on the heel tip, heel-up pivots on the toe, so ground contact never slides.
 */
export const plantedAnkle = (x: number, pitch: number, h: number, lift: number): V2 => {
  const a = -pitch; // svg rotation of the shoe
  let px: number, qx: number;
  if (pitch >= 0) { px = x; qx = 0; } else { px = x + DIM.TOE; qx = DIM.TOE; }
  const r = rot(qx, h, a);
  return { x: px - r.x, y: 0 - r.y - lift };
};

export type LegSolve = {
  hip: V2; knee: V2; ankle: V2; a1: number; a2: number; stretch: number; pitch: number;
};

const solveLeg = (hip: V2, ankle: V2, pitch: number): LegSolve => {
  const L1 = DIM.TIB, L2 = DIM.TAR;
  let dx = ankle.x - hip.x, dy = ankle.y - hip.y;
  let d = Math.hypot(dx, dy) || 1e-3;
  const maxR = (L1 + L2) * 0.992;
  let stretch = 1;
  if (d > maxR) stretch = d / maxR; // cartoon stretch instead of detaching
  const l1 = L1 * stretch, l2 = L2 * stretch;
  const dd = clamp(d, Math.abs(l1 - l2) + 4, (l1 + l2) * 0.992);
  const ux = dx / d, uy = dy / d;
  const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // perpendicular pointing BACKWARD (flamingo joint bends back)
  const px = -uy, py = ux;
  const knee = { x: hip.x + ux * a + px * hh, y: hip.y + uy * a + py * hh };
  const a1 = angDown(knee.x - hip.x, knee.y - hip.y);
  const a2 = angDown(ankle.x - knee.x, ankle.y - knee.y);
  return { hip, knee, ankle, a1, a2, stretch, pitch };
};

const applyTeeter = (p: Pose) => {
  const w = clamp(p.teeter);
  if (w <= 0) return;
  const ph = p.teeterPhase * 2 * Math.PI;
  const s = Math.sin(ph);
  p.hipX += w * 34 * s;
  p.tilt += w * (-4 + 24 * Math.sin(ph - 0.35));
  p.bob += w * 6 * (1 - Math.cos(2 * ph)) * 0.5;
  p.headTilt += w * (14 - 22 * Math.sin(ph - 0.9));
  p.neckLean += w * (-14 * Math.sin(ph - 0.7));
  p.neckS += w * 0.25 * Math.sin(ph * 2);
  p.nPitch += w * 11 * Math.sin(ph + 0.4);
  p.fPitch += w * 11 * Math.sin(ph + 2.2);
  p.nWingSh = lerp(p.nWingSh, 70 + 720 * p.teeterPhase, w);
  p.fWingSh = lerp(p.fWingSh, 250 + 790 * p.teeterPhase, w);
  p.nWingEl = lerp(p.nWingEl, 10 + 25 * Math.sin(ph * 2), w);
  p.fWingEl = lerp(p.fWingEl, 14 + 25 * Math.cos(ph * 2), w);
  p.nWingHand = lerp(p.nWingHand, -14, w);
  p.fWingHand = lerp(p.fWingHand, -14, w);
  p.wingFan = lerp(p.wingFan, 1, w);
};

export type Skeleton = ReturnType<typeof solve>;

/** Full FK/IK solve. Returns joint positions (root coords) and SVG angles. */
export const solve = (pin: Pose) => {
  const p: Pose = { ...DEFAULT_POSE, ...pin };
  applyTeeter(p);
  const h = heelHeight(p.heelExtend);
  const E = h - DIM.H0;
  const hip: V2 = { x: p.hipX, y: -(h + DIM.HIP_H) + p.bob };
  const tilt = p.tilt;
  const T = (lx: number, ly: number): V2 => { const r = rot(lx, ly, tilt); return { x: hip.x + r.x, y: hip.y + r.y }; };

  const nAnk = plantedAnkle(p.nX, p.nPitch, h, p.nLift);
  let fAnk = plantedAnkle(p.fX, p.fPitch, h, p.fLift);
  let fPitch = p.fPitch;
  const tuck = clamp(p.fTuck);
  if (tuck > 0) {
    const tk = T(-4, 58);
    fAnk = { x: lerp(fAnk.x, tk.x, tuck), y: lerp(fAnk.y, tk.y, tuck) };
    fPitch = lerp(fPitch, -95 - tilt, tuck);
  }
  const nSock = T(DIM.SOCKET_N[0], DIM.SOCKET_N[1]);
  const fSock = T(DIM.SOCKET_F[0], DIM.SOCKET_F[1]);
  const legN = solveLeg(nSock, nAnk, p.nPitch);
  const legF = solveLeg(fSock, fAnk, fPitch);

  const wing = (sh: V2, s: number, e: number, hd: number) => {
    const a1 = tilt - s;
    const elbow = (() => { const r = rot(0, DIM.WING_UP, a1); return { x: sh.x + r.x, y: sh.y + r.y }; })();
    const a2 = a1 - e;
    const wrist = (() => { const r = rot(0, DIM.WING_FORE, a2); return { x: elbow.x + r.x, y: elbow.y + r.y }; })();
    return { sh, elbow, wrist, a1, a2, a3: a2 - hd };
  };
  const wingN = wing(T(DIM.SHOULDER[0], DIM.SHOULDER[1]), p.nWingSh, p.nWingEl, p.nWingHand);
  const wingF = wing(T(DIM.FSHOULDER[0], DIM.FSHOULDER[1]), p.fWingSh, p.fWingEl, p.fWingHand);

  const neck: V2[] = [T(DIM.NECK_BASE[0], DIM.NECK_BASE[1])];
  let g = tilt * 0.6 + p.neckLean;
  for (let i = 0; i < 3; i++) {
    const gi = g + p.neckS * DIM.NECK_S[i];
    const prev = neck[i];
    neck.push({ x: prev.x + Math.sin(gi * D2R) * DIM.NECK[i], y: prev.y - Math.cos(gi * D2R) * DIM.NECK[i] });
  }
  const head = neck[3];
  return {
    p, h, E, hip, tilt, legN, legF, wingN, wingF, neck, head, headRot: -p.headTilt,
    hipSway: p.hipSway, squash: p.squash, teeter: clamp(p.teeter), teeterPhase: p.teeterPhase,
  };
};

// ------------------------------------------------------------------ walk
export const WALK = {
  STEP_FRAMES: 12,   // one step per beat at 120 BPM / 24 fps
  STEP_X: 150,       // forward travel per step (px at scale 1)
  STANCE: 14,        // frames each foot is on the ground (of a 24-frame cycle)
  CENTER: -40,       // mid-stance heel-tip x (support under the hip)
  LIFT: 50,
  PITCH_STRIKE: 10,  // toe-up at heel strike
  PITCH_OFF: -34,    // heel-up at toe-off
};

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Shoe params (heel-tip x, lift) that put the ankle at A for a given pitch (inverse of plantedAnkle). */
const shoeFor = (A: V2, pitch: number, h: number) => {
  const toe = pitch >= 0 ? 0 : DIM.TOE;
  const r = rot(toe, h, -pitch);
  return { x: A.x + r.x - toe, lift: -(A.y + r.y) };
};

/** Foot state at cycle time u (0 = this foot's heel strike). */
const footAt = (u: number, v: number, h: number) => {
  const Ts = WALK.STANCE, sw = 24 - Ts;
  const xs = WALK.CENTER + (v * Ts) / 2;
  if (u < Ts) {
    let pitch = 0;
    if (u < 2) pitch = WALK.PITCH_STRIKE * (1 - u / 2);
    else if (u > Ts - 4) pitch = WALK.PITCH_OFF * Math.pow((u - (Ts - 4)) / 4, 1.6);
    return { x: xs - v * u, lift: 0, pitch };
  }
  // swing: interpolate the ANKLE between lift-off and the next strike, then re-express as shoe params
  const s = (u - Ts) / sw;
  const A0 = plantedAnkle(xs - v * Ts, WALK.PITCH_OFF, h, 0);
  const A1 = plantedAnkle(xs, WALK.PITCH_STRIKE, h, 0);
  const e = ease.inOut(s);
  const A = {
    x: lerp(A0.x, A1.x, e) + 18 * Math.sin(Math.PI * s),
    y: lerp(A0.y, A1.y, s) - WALK.LIFT * Math.pow(Math.sin(Math.PI * s), 0.8),
  };
  const pitch = s < 0.35
    ? lerp(WALK.PITCH_OFF, WALK.PITCH_OFF - 20, s / 0.35)
    : lerp(WALK.PITCH_OFF - 20, WALK.PITCH_STRIKE, ease.inOut((s - 0.35) / 0.65));
  const sh = shoeFor(A, pitch, h);
  return { x: sh.x, lift: sh.lift, pitch };
};

/**
 * Runway strut. One step every 12 frames: NEAR heel strikes on frame ≡ phase (mod 24), FAR on phase+12.
 * Sampled on twos internally. `pose.bob` already contains the bob (returned bob is informational, don't add it).
 * NO-SLIDE CONTRACT: move the character root forward by `walkTravel(frame, opts)` (= stepX/12 px per frame, ON TWOS)
 * times the character's scale. Then planted shoes are exactly fixed in world space.
 */
export const walkPose = (frame: number, opts: { phase?: number; stepX?: number; heelExtend?: number } = {}) => {
  const phase = opts.phase ?? 0;
  const stepX = opts.stepX ?? WALK.STEP_X;
  const v = stepX / WALK.STEP_FRAMES;
  const t = onTwos(frame - phase);
  const h = heelHeight(opts.heelExtend ?? 0);
  const n = footAt(mod(t, 24), v, h);
  const f = footAt(mod(t - 12, 24), v, h);
  const st = mod(t, 12);
  const bobAt = (tt: number) => 5 + 7 * Math.cos((2 * Math.PI * (mod(tt, 12) - 1)) / 12); // + = down; lowest just after strike
  const bob = bobAt(t);
  const bobLag = bobAt(t - 3);
  const sway = Math.sin((2 * Math.PI * (t - 2)) / 24);
  const armSw = Math.sin((2 * Math.PI * (t + 1)) / 24);
  const pose: Pose = {
    ...DEFAULT_POSE,
    heelExtend: opts.heelExtend ?? 0,
    hipX: 4,
    bob,
    tilt: 5 + 2.5 * Math.sin((2 * Math.PI * (st - 3)) / 12),
    hipSway: sway,
    squash: st < 3 ? 0.6 * (1 - st / 3) : -0.15,
    nX: n.x, nLift: n.lift, nPitch: n.pitch,
    fX: f.x, fLift: f.lift, fPitch: f.pitch,
    nWingSh: 2 - 22 * armSw, nWingEl: 28 + 10 * armSw, nWingHand: 14 + 12 * Math.sin((2 * Math.PI * (t - 2)) / 24),
    fWingSh: 2 + 22 * armSw, fWingEl: 28 - 10 * armSw, fWingHand: 14 - 12 * Math.sin((2 * Math.PI * (t - 2)) / 24),
    wingFan: 0.35,
    neckLean: 4 - 0.25 * (bobLag - 5),
    neckS: 1 - 0.018 * (bobLag - 5),
    headTilt: 12 + 0.35 * (bobLag - 5),
  };
  return { pose, bob, stepX };
};

/** Root forward travel (px at scale 1) that matches walkPose with the same opts: stepX/12 * onTwos(frame-phase). */
export const walkTravel = (frame: number, opts: { phase?: number; stepX?: number } = {}) =>
  ((opts.stepX ?? WALK.STEP_X) / WALK.STEP_FRAMES) * onTwos(frame - (opts.phase ?? 0));
