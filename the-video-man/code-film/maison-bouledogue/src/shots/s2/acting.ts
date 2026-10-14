// S2 acting: pose timelines for the Bulldog, Pipette and the Flamingo's heels (all absolute frames).
import { clamp, ease, type EaseFn } from '../../lib/motion';
import { POSES as BP, blendPose as bBlend, fullPose as bFull, ikArm, type Pose } from '../../characters/Bulldog';
import { POSES as MP, blendPose as mBlend, hammerSwingAt } from '../../characters/Mouse';
import { POSES as FP } from '../../characters/Flamingo';

type P = Record<string, number>;
type Key = [number, P, EaseFn?];

/** Pose keyframes: holds outside, eased blend between consecutive keys. */
const seq = (f: number, keys: Key[], blend: (a: P, b: P, t: number) => P): P => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, p1, e] = keys[i];
    const [f0, p0] = keys[i - 1];
    if (f <= f1) return blend(p0, p1, (e ?? ease.inOut)(clamp((f - f0) / Math.max(1e-6, f1 - f0))));
  }
  return keys[keys.length - 1][1];
};
const bump = (f: number, at: number, w: number) => { const t = (f - at) / w; return t < 0 || t > 1 ? 0 : Math.sin(t * Math.PI); };

// ---------------------------------------------------------------------------------------------- BULLDOG
const B = (o: P): P => bFull(o);
const ikF = (x: number, y: number, bend = 1) => { const r = ikArm('F', x, y, bend); return { armF: r.arm, foreF: r.fore }; };
const ikB = (x: number, y: number, bend = 1) => { const r = ikArm('B', x, y, bend); return { armB: r.arm, foreB: r.fore }; };

const look = { lookX: 0.85, lookY: -0.55 }; // up and right, at Pipette on her ladder
const glare = B({ ...BP.idle, ...look, lean: 2, head: -10, puff: 0.8 });
const inhale = B({ ...BP.idle, ...look, lean: -9, torso: -8, head: -16, headY: -6, puff: 1, squash: -0.18, bodyY: -3, armF: 40, foreF: -70, pawF: -20, handF: 1, armB: 40, foreB: -60, handB: 1 });
const shoutOver = B({ ...BP.shout, armF: 120, foreF: 62, pawF: 20, lean: 17, torso: 13, head: 10, headY: -12, squash: -0.3, stepF: 26, lookX: 0.9, lookY: -0.4 });
const shout = B({ ...BP.shout, lean: 10, torso: 8, armF: 112, foreF: 58, pawF: 14, lookX: 0.9, lookY: -0.5 });
const pointHeels = B({ ...BP.shout, lean: 9, torso: 6, head: -6, armF: 128, foreF: 4, pawF: 0, handF: 2, armB: 40, foreB: 20, handB: 1, lookX: 1, lookY: -0.7, stepF: 22 });
const higherDip = B({ ...BP.shout, lean: 4, torso: 10, head: 10, headY: 6, squash: 0.35, bodyY: 16, armF: 30, foreF: -40, handF: 1, armB: 30, foreB: -40, handB: 1, lookY: -0.3, stepF: 18 });
const higherOver = B({ ...BP.shout, lean: 1, torso: -4, head: -22, headY: -14, squash: -0.5, bodyY: -12, armF: 176, foreF: 8, pawF: 0, handF: 1, armB: 168, foreB: 8, pawB: 0, handB: 1, liftF: 12, liftB: 12, lookX: 0.6, lookY: -1, stepF: 18, jaw: 0.3 });
const higher = B({ ...higherOver, squash: -0.38, bodyY: -8, armF: 164, armB: 154, head: -18, liftF: 8, liftB: 8 });
const coutureLean = B({ ...BP.shout, lean: 15, torso: 12, head: 6, armF: 112, foreF: 40, handF: 1, armB: 50, foreB: 10, handB: 1, stepF: 26, lookX: 0.9, lookY: -0.4 });
const pain = B({ ...BP.idle, lean: -8, torso: -10, head: -26, headY: -10, ...ikF(58, -104), pawF: 30, handF: 0, armB: 120, foreB: 30, pawB: 20, handB: 0, squash: -0.15, puff: 1, lookX: 0.2, lookY: -1, stepF: 10 });
const pant = B({ ...BP.idle, ...look, lean: 4, head: -6, puff: 1, handF: 1, handB: 1 });
const armsFolded = B({ ...BP.smug, ...look, lean: -4, head: -12, headY: -2, puff: 1, stepF: 6 });
const shockedTake = B({ ...BP.shocked, lean: -14, torso: -12, headY: -20, squash: -0.35, lookX: 0.6, lookY: -0.6 });
const shocked = B({ ...BP.shocked, lookX: 0.6, lookY: -0.6 });
const ponder = B({ ...BP.idle, lean: 0, head: 8, headY: 4, ...ikF(110, -150), pawF: 40, handF: 1, lookX: 0.2, lookY: 0.5, puff: 0.6 });
const eureka = B({ ...BP.point, lean: -4, torso: -6, head: -14, armF: 158, foreF: 6, pawF: 0, handF: 2, puff: 1, squash: -0.2, lookX: 0.9, lookY: -0.6 });
const eurekaHold = B({ ...eureka, armF: 150, squash: -0.12, head: -10 });
const reachBack = B({ ...BP.idle, lean: 6, torso: 6, head: 2, armF: -34, foreF: -30, pawF: -20, handF: 1, lookX: -0.4, lookY: 0.2, puff: 0.9 });
const cock = B({ ...BP.pearlWhip, lean: 8, torso: 10, head: -4, armF: 58, foreF: -96, pawF: -30, squash: 0.28, bodyY: 12, lookX: 0.8, lookY: -0.6 });
const whipOver = B({ ...BP.pearlWhip, armF: 178, foreF: 14, squash: -0.45, bodyY: -8, head: -22, lean: -6 });
const whip = B({ ...BP.pearlWhip });

const BK: Key[] = [
  [192, glare], [196, glare],
  [202, inhale, ease.out],
  [205, shoutOver, ease.out], [212, shout, ease.inOut],
  [220, shout], [226, pointHeels, (t) => ease.outBack(t, 1.5)],
  [238, pointHeels], [244, higherDip, ease.inOut],
  [249, higherOver, ease.out], [256, higher, ease.inOut],
  [262, higher], [268, coutureLean, ease.inOut],
  [280, coutureLean], [284, pain, (t) => ease.outBack(t, 1.3)],
  [292, pain], [300, pant, ease.inOut],
  [306, armsFolded, ease.inOut],
  [350, armsFolded], [354, shockedTake, ease.out], [360, shocked, ease.inOut],
  [368, shocked], [376, ponder, ease.inOut],
  [380, ponder], [384, eureka, (t) => ease.outBack(t, 1.6)], [390, eurekaHold, ease.inOut],
  [410, eurekaHold], [418, reachBack, ease.inOut],
  [424, reachBack], [432, cock, ease.inOut],
  [438, cock], [441, whipOver, ease.out], [448, whip, ease.inOut],
];

export const bulldogPose = (f: number): Pose => {
  const p = seq(f, BK, bBlend);
  // fist shake on "Couture is pain" lead-in and while shouting "Pipette!"
  const shake = (f >= 268 && f < 282 ? 1 : 0) * Math.sin(f * 1.6) * 9;
  // impatient foot tap while Pipette talks (lift on twos)
  const tapPh = (f - 308) % 10;
  const tap = f >= 308 && f < 350 ? (tapPh < 4 ? Math.sin((tapPh / 4) * Math.PI) * 10 : 0) : 0;
  // panting after the tirade
  const pantAmt = clamp((f - 290) / 6) * (1 - clamp((f - 306) / 8));
  return { ...p, armF: p.armF + shake, foreF: p.foreF + shake * 0.6, liftF: (p.liftF ?? 0) + tap, puff: (p.puff ?? 0.5) + pantAmt * 0.3 * Math.sin(f * 0.9), head: p.head + bump(f, 214, 6) * -4 };
};

export const bulldogExpr = (f: number) =>
  f < 282 ? 'angry' : f < 292 ? 'pained' : f < 353 ? 'angry' : f < 370 ? 'shocked' : f < 380 ? 'neutral' : f < 430 ? 'smug' : 'proud';

export const BULLDOG_IMP: [number, number][] = [[205, 0.8], [214, 0.25], [249, 0.7], [284, 0.6], [354, 1], [384, 0.5], [441, 1]];
export const bulldogMonocle = (f: number) => (f < 354 ? 0 : clamp((f - 354) / 3));
export const holdPearls = (f: number) => f >= 421;
/** Strand swing (deg, + toward +x): hangs, winds back, whips overhead, then twirls like a lasso. */
export const pearlSwing = (f: number) => {
  if (f < 432) return Math.sin(f * 0.3) * 8;
  if (f < 438) return -70 * ease.out((f - 432) / 6);
  if (f < 441) return -70 + 270 * ease.in((f - 438) / 3);
  return 200 + (f - 441) * 32;
};

// ---------------------------------------------------------------------------------------------- MOUSE
export const HITS = [214, 238, 262];
const hammerPose = (f: number) => {
  const impact = f < 218 ? 214 : f < 242 ? 238 : 262;
  return { ...MP.hammer, hammerSwing: hammerSwingAt(f, impact) } as P;
};
const rest = { ...MP.hammer, hammerSwing: 1.05, lookY: 0.6, headTilt: 6 };
const turnPrep = { ...MP.hammer, hammerSwing: 1, squash: 0.88, bodyY: 2, lean: -2, lookX: -0.6, lookY: 0.6, headTilt: 0 };
const talk = { ...MP.deadpanTalk, lookX: 0.9, lookY: 0.85, headTilt: 10, lean: 3 };
const talkOver = { ...talk, squash: 1.06, bodyY: -3 };

/** Turn happens at 298: before it she faces the heels (+x), after it she faces the bulldog (flip). */
export const MOUSE_TURN = 298;
export const mouseFlip = (f: number) => f >= MOUSE_TURN;

export const mousePose = (f: number): P => {
  if (f < 268) {
    const p = hammerPose(f);
    return { ...p, headTilt: p.headTilt + bump(f, 204, 8) * -6 }; // tiny ear/head flick at "Pipette!"
  }
  let p: P;
  if (f < MOUSE_TURN) {
    p = seq(f, [[268, hammerPose(268)], [276, rest, ease.inOut], [292, rest], [MOUSE_TURN - 1, turnPrep, ease.inOut]], mBlend);
    // clinging while the ladder shakes under the ratchet
    const sh = f >= 280 && f < 300 ? Math.sin(f * 1.9) * 5 : 0;
    p = { ...p, lean: p.lean + sh, headTilt: p.headTilt - sh * 0.6 };
  } else {
    p = seq(f, [[MOUSE_TURN, turnPrep], [301, talkOver, ease.out], [305, talk, ease.inOut]], mBlend);
    // beats inside L03: nod on "Monsieur", dry paw lift on "oxygen"
    const nod = bump(f, 322, 10) * 9;
    const lift = bump(f, 350, 16);
    const nodTail = bump(f, 338, 10) * -5;
    p = { ...p, headTilt: p.headTilt + nod + nodTail, farSh: p.farSh + lift * 150, farEl: p.farEl - lift * 80, lookY: p.lookY - lift * 0.3 };
    if (f > 366) p = { ...p, farSh: p.farSh, lookY: 0.85 + bump(f, 440, 8) * -0.6 };
  }
  return p;
};
export const MOUSE_IMP: [number, number][] = [[214, 1], [238, 1], [262, 1], [282, 0.4], [288, 0.4], [294, 0.4], [300, 0.8], [441, 0.4]];
export const mouseExpr = (f: number) => (f >= 441 && f < 450 ? 'amazed' : 'deadpan');

// ---------------------------------------------------------------------------------------------- FLAMINGO HEELS
const NOTCHES = [280, 284, 288, 292, 296];
/** Ratchet: 5 notches of 0.2 each, each snapping up in ~3 frames with overshoot, then holding. */
export const heelExtend = (f: number) => {
  let v = 0;
  for (const n of NOTCHES) {
    const t = clamp((f - n) / 3);
    v += 0.2 * (t <= 0 ? 0 : ease.outBack(t, 2.4));
  }
  // final clunk settle
  if (f >= 300) v += -0.03 * Math.exp(-(f - 300) / 3) * Math.cos((f - 300) * 1.3);
  return v;
};
export const flamingoPose = (f: number) => ({ ...FP.idle, heelExtend: heelExtend(f), hipX: Math.sin(f * 0.05) * 6, tilt: 3 + Math.sin(f * 0.04) * 2 });
export const FLAMINGO_IMP: [number, number][] = [[214, 1], [238, 1], [262, 1], ...NOTCHES.map((n) => [n + 1, 0.5] as [number, number]), [300, 0.8]];

// ---------------------------------------------------------------------------------------------- SET
export const ladderShake = (f: number) => {
  let s = 0;
  for (const h of HITS) if (f >= h) s = Math.max(s, 0.8 * Math.exp(-(f - h) / 5));
  if (f >= 278 && f < 300) s = Math.max(s, 1);
  if (f >= 300) s = Math.max(s, Math.exp(-(f - 300) / 7));
  return s;
};
export const LAMP_SWING: [number, number][] = [[200, 2], [214, 3], [238, 3], [262, 4], [300, 6], [441, 8]];
