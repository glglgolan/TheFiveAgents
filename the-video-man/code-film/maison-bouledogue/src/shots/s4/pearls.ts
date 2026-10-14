// S4 pearl-snap particle system (deterministic). Owner: Shot Animator B.
//
// Every pearl drawn by the Giraffe at the snap (pearlPositions() for the exact pose+frame of SNAP) becomes a particle
// in RUNWAY WORLD coords (the space inside runwayTransform). State per pearl:
//   x  – world x
//   z  – depth on the runway top: its floor line is at screen-plane y = GROUND_Y + z  (z ∈ [SURF_BACK, SURF_FRONT] is on
//        the glossy top surface; z > SURF_FRONT = rolled/bounced off the FRONT edge -> falls into the pit)
//   h  – height above its floor line (px, up = +)
//   world y = GROUND_Y + z - h
// Integrated with a fixed per-frame step from SNAP (seeded burst, gravity, bouncy floor with restitution, rolling friction,
// back barrier, front-edge and runway-end falls). The whole trajectory is simulated once and cached (Float32Arrays), so any
// frame lookup is O(n). Simulated through MAX_FRAME (end of film) so S5/S6 can keep using it.
import { GROUND_Y, SURFACE_FAR_Y, SURFACE_NEAR_Y, RUNWAY_END_X } from '../../sets/Runway';
import { pearlPositions } from '../../characters/Giraffe';
import { rand } from '../../lib/rng';
import { clamp } from '../../lib/motion';
import { SNAP, GS, giraffePoseAt, giraffeRootX } from './choreo';

export const SURF_BACK = SURFACE_FAR_Y - GROUND_Y + 5;    // -43
export const SURF_FRONT = SURFACE_NEAR_Y - GROUND_Y - 2;  // +54
export const MAX_FRAME = 1440;
const G = 2.1;           // gravity, px/frame² (world px)

export type PState = 0 | 1 | 2 | 3; // 0 held (not yet released), 1 flying/bouncing, 2 rolling on the surface, 3 falling off an edge

interface Sim {
  n: number; r: Float32Array; x0: Float32Array; y0: Float32Array; delay: Float32Array;
  X: Float32Array[]; Y: Float32Array[]; Z: Float32Array[]; H: Float32Array[]; S: Uint8Array[]; V: Float32Array[];
  cx: number; cy: number;
}

let SIM: Sim | null = null;

/** Slow-motion time scale right after the snap (sim time per film frame). */
export const timeScale = (f: number) => (f < SNAP + 2 ? 0.45 : f < SNAP + 10 ? 0.45 + 0.55 * ((f - SNAP - 2) / 8) : 1);

const build = (): Sim => {
  const gx = giraffeRootX(SNAP);
  const local = pearlPositions({ frame: SNAP, pose: giraffePoseAt(SNAP) });
  const n = local.length;
  const R = rand('s4-pearl-burst');
  const r = new Float32Array(n), x0 = new Float32Array(n), y0 = new Float32Array(n), delay = new Float32Array(n);
  let cx = 0, cy = 0;
  for (let i = 0; i < n; i++) {
    x0[i] = gx + GS * local[i].x; y0[i] = GROUND_Y + GS * local[i].y; r[i] = GS * local[i].r;
    cx += x0[i]; cy += y0[i];
  }
  cx /= n; cy /= n;
  // break point: 60% up the strand; release ripples outward from it over ~3 frames
  const brk = Math.floor(n * 0.62);
  const x = new Float32Array(n), z = new Float32Array(n), h = new Float32Array(n);
  const vx = new Float32Array(n), vz = new Float32Array(n), vh = new Float32Array(n);
  const st = new Uint8Array(n);
  const W = 6; // row-centroid window
  for (let i = 0; i < n; i++) {
    delay[i] = Math.min(3.5, Math.abs(i - brk) / n * 7) + R() * 0.8;
    // outward direction from the local row centroid (approximates the neck axis)
    let mx = 0, my = 0, k = 0;
    for (let j = Math.max(0, i - W); j <= Math.min(n - 1, i + W); j++) { mx += x0[j]; my += y0[j]; k++; }
    mx /= k; my /= k;
    let ox = x0[i] - mx, oy = y0[i] - my;
    const ol = Math.hypot(ox, oy) || 1; ox /= ol; oy /= ol;
    const up = 5 + R() * 13 + (i > brk * 0.8 ? 3 : 0);
    const spd = 3 + R() * 9;
    vx[i] = ox * spd + (R() - 0.5) * 11 + 0.9;
    vh[i] = up - oy * spd * 0.5;
    vz[i] = (R() - 0.44) * 2.5;
    x[i] = x0[i]; z[i] = (R() - 0.5) * 10; h[i] = GROUND_Y + z[i] - y0[i];
  }
  const frames = MAX_FRAME - SNAP + 1;
  const X: Float32Array[] = [], Y: Float32Array[] = [], Z: Float32Array[] = [], H: Float32Array[] = [], S: Uint8Array[] = [], V: Float32Array[] = [];
  const Rb = rand('s4-pearl-bounce');
  const rest = new Float32Array(n);
  for (let i = 0; i < n; i++) rest[i] = 0.3 + Rb() * 0.18;
  let simT = 0;
  for (let k = 0; k < frames; k++) {
    const f = SNAP + k;
    if (k > 0) {
      const dt = timeScale(f);
      simT += dt;
      for (let i = 0; i < n; i++) {
        if (st[i] === 0) { if (simT >= delay[i]) st[i] = 1; else continue; }
        if (st[i] === 1) {
          vh[i] -= G * dt;
          x[i] += vx[i] * dt; z[i] += vz[i] * dt; h[i] += vh[i] * dt;
          if (z[i] < SURF_BACK) { z[i] = SURF_BACK; vz[i] = Math.abs(vz[i]) * 0.4; }
          const offFront = z[i] > SURF_FRONT, offEnd = x[i] > RUNWAY_END_X;
          if (h[i] <= 0) {
            if (offFront || offEnd) { st[i] = 3; }
            else {
              h[i] = -h[i] * rest[i];
              vh[i] = -vh[i] * rest[i];
              vx[i] *= 0.82; vz[i] *= 0.7;
              if (vh[i] < 2.6) { st[i] = 2; h[i] = 0; vh[i] = 0; }
            }
          }
        } else if (st[i] === 2) {
          x[i] += vx[i] * dt; z[i] += vz[i] * dt;
          vx[i] *= Math.pow(0.978, dt); vz[i] *= Math.pow(0.9, dt);
          if (Math.abs(vx[i]) < 0.05) vx[i] = 0;
          if (z[i] < SURF_BACK) { z[i] = SURF_BACK; vz[i] = Math.abs(vz[i]) * 0.3; }
          if (z[i] > SURF_FRONT || x[i] > RUNWAY_END_X) { st[i] = 3; vh[i] = 0; }
        } else if (st[i] === 3) {
          vh[i] -= G * dt;
          x[i] += vx[i] * dt * 0.9; z[i] += Math.max(vz[i], 0.6) * dt; h[i] += vh[i] * dt;
        }
      }
    }
    const xa = new Float32Array(n), ya = new Float32Array(n), za = new Float32Array(n), ha = new Float32Array(n), sa = new Uint8Array(n), va = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      if (st[i] === 0) { xa[i] = x0[i]; ya[i] = y0[i]; za[i] = z[i]; ha[i] = GROUND_Y + z[i] - y0[i]; }
      else { xa[i] = x[i]; za[i] = z[i]; ha[i] = h[i]; ya[i] = GROUND_Y + z[i] - h[i]; }
      sa[i] = st[i]; va[i] = st[i] === 1 || st[i] === 3 ? Math.hypot(vx[i], vh[i]) : Math.abs(vx[i]);
    }
    X.push(xa); Y.push(ya); Z.push(za); H.push(ha); S.push(sa); V.push(va);
  }
  return { n, r, x0, y0, delay, X, Y, Z, H, S, V, cx, cy };
};

const sim = () => (SIM ??= build());

export interface PearlState { i: number; x: number; y: number; r: number; z: number; h: number; state: PState; speed: number; px: number; py: number }

/** Full per-pearl state at a film frame (empty before SNAP). px/py = previous frame position (for streaks). */
export const pearlStatesAt = (frame: number): PearlState[] => {
  if (frame < SNAP) return [];
  const s = sim();
  const k = Math.min(Math.floor(frame) - SNAP, s.X.length - 1);
  const kp = Math.max(0, k - 1);
  const out: PearlState[] = [];
  for (let i = 0; i < s.n; i++) {
    const y = s.Y[k][i];
    if (y > 1250) continue; // fell out of the world
    out.push({ i, x: s.X[k][i], y, r: s.r[i], z: s.Z[k][i], h: s.H[k][i], state: s.S[k][i] as PState, speed: s.V[k][i], px: s.X[kp][i], py: s.Y[kp][i] });
  }
  return out;
};

/**
 * pearlFieldAt(frame) — RUNWAY WORLD coordinates of every scattered pearl still in the world at `frame`
 * (the same space as `runwayTransform(camX,camY,zoom)`; y is the plane y, i.e. GROUND_Y + depth - height).
 * Returns [] before the snap (840). Deterministic; simulated through frame 1440, so S5/S6 can call it with their
 * absolute frames and the pearls keep rolling (and slowly settle) exactly where S4 left them.
 * r = pearl radius in world px. For depth/height/state use pearlStatesAt().
 */
export const pearlFieldAt = (frame: number): { x: number; y: number; r: number }[] =>
  pearlStatesAt(frame).map((p) => ({ x: p.x, y: p.y, r: p.r }));

/** World centroid of the strand at the snap (camera focus). */
export const snapCentroid = () => { const s = sim(); return { x: s.cx, y: s.cy }; };

export const _clamp = clamp;
