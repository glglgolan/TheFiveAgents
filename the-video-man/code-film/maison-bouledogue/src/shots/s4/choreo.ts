// S4 "FORTY FEET OF PEARLS" choreography — pure functions of the absolute film frame.
import { POSES, walkPose, blendPose } from '../../characters/Giraffe';
import { onTwos, clamp, ease, track } from '../../lib/motion';
import type { CrowdState } from '../../sets/Runway';

export const T = { from: 696, to: 936, enter: 720, stop: 792, pose: 804, flash0: 806, flash1: 822, snap: 840, freeze: 852, slide1: 870 };
export const SNAP = T.snap;
export const GS = 0.78;            // giraffe scale (~700px tall)
export const GX_STOP = 2300;       // world x of the root when she stops (pearls land around here, downstage of S3)

type Pose = Record<string, number>;
const walk = (f: number) => walkPose(f).pose;
const stepX = (f: number) => walkPose(f).stepX;

/** Giraffe root world x: walks (no slide) until the near-front heel strike at 792, then plants. */
export const giraffeRootX = (f: number) => GX_STOP + GS * (stepX(Math.min(f, T.stop)) - stepX(T.stop));

export const FLASHES = [806, 807, 809, 811, 812, 814, 816, 818, 819, 822];

// feet-on-floor corrections of the presets (the preset hind foot floats ~12px; freeze lifts all hooves ~9px)
const swoop: Pose = { ...POSES.swoop, bodyTilt: 1, bnHip: 5 };
const freeze: Pose = { ...POSES.freeze, bodyY: 5 };

const e = (g: number, a: number, b: number, fn = ease.inOut) => fn(clamp((g - a) / (b - a)));

/** Body pose (on twos). */
export const giraffePoseAt = (f: number): Pose => {
  const g = onTwos(f);
  if (g < T.stop) return walk(g);
  const w0 = walk(T.stop);
  if (g < 806) {
    // settle then the big neck swoop landing on 804 (slight overshoot)
    const t = e(g, T.stop, T.pose);
    const P = blendPose(w0, swoop, t);
    P.neckSwoop = clamp(P.neckSwoop + 0.08 * Math.sin(Math.PI * clamp((g - 798) / 10)));
    P.bodyY += 6 * Math.sin(Math.PI * clamp((g - T.stop) / 8)); // plant dip
    // the legs that must reposition take little lifted steps (hind pair first) instead of sliding
    const step = (a: number, b: number) => Math.sin(Math.PI * clamp((g - a) / (b - a)));
    P.bnKnee += 58 * step(T.stop, 802); P.bnHip -= 24 * step(T.stop, 802);
    P.bfKnee += 54 * step(794, 806); P.bfHip -= 22 * step(794, 806);
    return P;
  }
  if (g <= SNAP) {
    const P = { ...swoop };
    // hold for the cameras: tiny chin flicks on the flash storm, then a proud chin-lift that strains the strand
    P.headTilt += 3 * Math.sin((g - 806) * 0.8) * clamp((822 - g) / 16) - 6 * e(g, 828, 838);
    P.neckSwoop -= 0.06 * e(g, 828, 838);
    P.lookY = -2 * e(g, 828, 838);
    return P;
  }
  // SNAP recoil: whole body jolts upright into the freeze (stiff shock), squash-stretch overshoot
  const t = e(g, SNAP, T.freeze, ease.out);
  const P = blendPose(swoop, freeze, t);
  P.squash = 1 + 0.07 * Math.sin(Math.PI * clamp((g - SNAP) / 6)) - 0.03 * Math.sin(Math.PI * clamp((g - SNAP - 6) / 8));
  P.bodyY -= 10 * Math.sin(Math.PI * clamp((g - SNAP) / 8));
  P.glassesSlide = track(g, [[T.freeze, 0], [858, 0.12, ease.out], [T.slide1, 1, ease.in]]) ;
  // after the glasses hit the nose tip: tiny mortified shrink
  P.neckLean += -2 * e(g, 872, 890);
  P.headTilt += 4 * e(g, 872, 890);
  P.lookY = 3 * e(g, 872, 890);
  return P;
};

export const giraffeExpression = (f: number) => (f < SNAP ? 'aloof' : f < 866 ? 'shocked' : 'mortified');

// ------------------------------------------------------------------ camera
export interface Cam { camX: number; camY: number; zoom: number; rot: number }

// ------------------------------------------------------------------ crowd
const CROWD: [number, CrowdState, number][] = [
  [T.from, 'murmur', 1], [T.pose, 'lean', 10], [SNAP + 1, 'gasp', 4], [888, 'murmur', 26],
];
export const crowdAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < CROWD.length; k++) if (f >= CROWD[k][0]) i = k;
  const [f0, st, d] = CROWD[i];
  const prev = i > 0 ? CROWD[i - 1][1] : st;
  return { crowd: st, crowdFrom: prev, crowdT: clamp((f - f0) / d) };
};
