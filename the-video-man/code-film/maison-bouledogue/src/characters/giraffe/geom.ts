// Giraffe rig math — shared by the renderer AND pearlPositions() so particles spawn exactly on drawn pearls.
import { onTwos, clamp, lerp, springFollow, wobble } from '../../lib/motion';
import { hash01, rand } from '../../lib/rng';
import type { CharProps } from '../../lib/types';

export const NECK_SEGS = 8;
export const SEG_LEN = 39;
export const NECK_LEN = NECK_SEGS * SEG_LEN;
export const LEG = { upper: 200, lower: 215, hoof: 28 };
export const L_EFF = LEG.upper + LEG.lower; // hip -> ankle when straight
export const HIPS = {
  fn: { x: 92, y: -443 }, ff: { x: 70, y: -443 },
  bn: { x: -112, y: -443 }, bf: { x: -134, y: -443 },
};
export const NECK_BASE = { x: 110, y: -486 };
export const TORSO_PIVOT = { x: -15, y: -450 };
export const PEARL_ROWS = 40;

export const DEFAULT_POSE: Record<string, number> = {
  bodyY: 0, bodyTilt: 0, squash: 1,
  neckLean: 12, neckCurve: -0.25, neckSwoop: 0, neckWave: 0,
  headTilt: -22, headTurn: 0,
  fnHip: 0, fnKnee: 0, fnAnkle: 0, ffHip: 0, ffKnee: 0, ffAnkle: 0,
  bnHip: 0, bnKnee: 0, bnAnkle: 0, bfHip: 0, bfKnee: 0, bfAnkle: 0,
  tailSwing: 0, bagSwing: 0, sashSwing: 0, trainWave: 0,
  glassesSlide: 0, lookX: 0, lookY: 0,
};

const D2R = Math.PI / 180;
export type Pt = { x: number; y: number };
export type SpinePt = { x: number; y: number; a: number }; // a = deg from vertical-up, + leans toward +x

/** Merge pose with defaults + breathing idle driven by frame (on twos). */
export const resolvePose = (props: CharProps) => {
  const P = { ...DEFAULT_POSE, ...(props.pose ?? {}) };
  const t = onTwos(props.frame);
  const br = Math.sin((t / 72) * Math.PI * 2);
  const stiff = 1 - clamp(P.neckSwoop) * 0.5;
  P.neckLean += br * 0.9 * stiff;
  P.headTilt -= br * 0.7;
  P.bodyY += br * 1.2;
  return P;
};

/** Body transform (translate + tilt about torso pivot) applied to a body-local point. */
export const bodyXform = (P: Record<string, number>, p: Pt): Pt => {
  const a = P.bodyTilt * D2R, c = Math.cos(a), s = Math.sin(a);
  const dx = p.x - TORSO_PIVOT.x, dy = p.y - TORSO_PIVOT.y;
  return { x: TORSO_PIVOT.x + dx * c - dy * s, y: TORSO_PIVOT.y + dx * s + dy * c + P.bodyY };
};

/** Segment angles of the 8-link neck chain (absolute, deg). */
export const neckAngles = (P: Record<string, number>) => {
  const sw = clamp(P.neckSwoop);
  const out: number[] = [];
  let a = P.neckLean + P.bodyTilt + sw * 38;
  for (let i = 0; i < NECK_SEGS; i++) {
    if (i > 0) {
      a += P.neckCurve * 7 + (i <= 4 ? 13 : -30) * sw + P.neckWave * 2.6 * (i / 7);
    }
    out.push(a);
  }
  return out;
};

/** Smooth spine: 65 samples along the neck (angles interpolated between segment midpoints). */
export const neckSpine = (P: Record<string, number>): SpinePt[] => {
  const angs = neckAngles(P);
  const base = bodyXform(P, NECK_BASE);
  const N = 64, ds = NECK_LEN / N;
  const pts: SpinePt[] = [];
  let x = base.x, y = base.y;
  const angAt = (s: number) => {
    const u = s / SEG_LEN - 0.5;
    const i = Math.floor(u);
    const f = u - i;
    const a0 = angs[clamp(i, 0, NECK_SEGS - 1)], a1 = angs[clamp(i + 1, 0, NECK_SEGS - 1)];
    return lerp(a0, a1, f);
  };
  for (let k = 0; k <= N; k++) {
    const s = k * ds;
    const a = angAt(s);
    pts.push({ x, y, a });
    const am = angAt(s + ds / 2) * D2R;
    x += Math.sin(am) * ds; y -= Math.cos(am) * ds;
  }
  return pts;
};

export const spineAt = (sp: SpinePt[], s: number): SpinePt => {
  const N = sp.length - 1;
  const u = clamp(s / NECK_LEN, 0, 1) * N;
  const i = Math.min(N - 1, Math.floor(u)), f = u - i;
  return { x: lerp(sp[i].x, sp[i + 1].x, f), y: lerp(sp[i].y, sp[i + 1].y, f), a: lerp(sp[i].a, sp[i + 1].a, f) };
};
export const dirOf = (a: number): Pt => ({ x: Math.sin(a * D2R), y: -Math.cos(a * D2R) });
export const nrmOf = (a: number): Pt => ({ x: Math.cos(a * D2R), y: Math.sin(a * D2R) }); // throat side

/** Neck half-width at t in [0,1]. */
export const neckW = (t: number) => lerp(50, 29, Math.pow(t, 0.8)) + (t < 0.14 ? 20 * Math.pow(1 - t / 0.14, 2) : 0);

/** Point on the neck surface: arc length s, across u in [-1 (nape), 1 (throat)]. */
export const neckPoint = (sp: SpinePt[], s: number, u: number): Pt => {
  const p = spineAt(sp, s), n = nrmOf(p.a), w = neckW(s / NECK_LEN);
  return { x: p.x + n.x * u * w, y: p.y + n.y * u * w };
};

export const neckPath = (sp: SpinePt[]) => {
  const L: string[] = [], R: string[] = [];
  sp.forEach((p, k) => {
    const t = k / (sp.length - 1), w = neckW(t), n = nrmOf(p.a);
    L.push(`${(p.x - n.x * w).toFixed(1)},${(p.y - n.y * w).toFixed(1)}`);
    R.push(`${(p.x + n.x * w).toFixed(1)},${(p.y + n.y * w).toFixed(1)}`);
  });
  const top = sp[sp.length - 1], d = dirOf(top.a);
  const cap = `${(top.x + d.x * 22).toFixed(1)},${(top.y + d.y * 22).toFixed(1)}`;
  return `M${L[0]} L${L.slice(1).join(' L')} Q${cap} ${R[R.length - 1]} L${R.slice(0, -1).reverse().join(' L')} Z`;
};

/** Strip along the nape side (for halftone form shading). */
export const napeStripPath = (sp: SpinePt[], u0 = -1, u1 = -0.45, s0 = 0, s1 = NECK_LEN) => {
  const A: string[] = [], B: string[] = [];
  for (let k = 0; k <= 24; k++) {
    const s = lerp(s0, s1, k / 24);
    const a = neckPoint(sp, s, u0), b = neckPoint(sp, s, u1);
    A.push(`${a.x.toFixed(1)},${a.y.toFixed(1)}`); B.push(`${b.x.toFixed(1)},${b.y.toFixed(1)}`);
  }
  return `M${A.join(' L')} L${B.reverse().join(' L')} Z`;
};

export type Pearl = { x: number; y: number; r: number; row: number; depth: number };

/** The coiled necklace: 40 rows of pearls following the neck curve (intact state). Rows ordered base->jaw. */
export const pearlRows = (sp: SpinePt[]): Pearl[][] => {
  const rows: Pearl[][] = [];
  const s0 = 0.05 * NECK_LEN, s1 = 0.935 * NECK_LEN;
  for (let j = 0; j < PEARL_ROWS; j++) {
    const s = lerp(s0, s1, j / (PEARL_ROWS - 1));
    const t = s / NECK_LEN;
    const r = lerp(6.6, 5.0, t);
    const w = neckW(t);
    const p = spineAt(sp, s), n = nrmOf(p.a), d = dirOf(p.a);
    const ext = w + r * 0.35;
    const m = Math.max(4, Math.floor((2 * ext) / (2 * r * 1.04)) + 1);
    const sag = r * 2.3, tilt = r * 0.6;
    const off = j % 2 ? 0.5 / (m - 1) : 0; // staggered rows read as a coil, not a grid
    const row: Pearl[] = [];
    for (let k = 0; k < m; k++) {
      const u = clamp(-1 + (2 * k) / (m - 1) + off, -1, 1);
      if (j % 2 && k === m - 1) continue;
      const c = Math.sqrt(Math.max(0, 1 - u * u));
      const rr = r * (0.82 + 0.18 * c);
      row.push({
        x: p.x + n.x * u * ext - d.x * sag * c + d.x * tilt * u,
        y: p.y + n.y * u * ext - d.y * sag * c + d.y * tilt * u,
        r: rr, row: j, depth: c,
      });
    }
    row.sort((a, b) => a.depth - b.depth);
    rows.push(row);
  }
  return rows;
};

// ---------- organic spots ----------
export type Blob = { cx: number; cy: number; r: number; ar?: number; rot?: number; seed: string };
export const blobPath = (b: Blob, map?: (p: Pt) => Pt) => {
  const R = rand(b.seed);
  const n = 7;
  const ar = b.ar ?? 1, rot = (b.rot ?? 0) * D2R;
  const vs: Pt[] = [];
  const a0 = R() * Math.PI;
  for (let k = 0; k < n; k++) {
    const a = a0 + (k / n) * Math.PI * 2 + (R() - 0.5) * 0.5;
    const rr = b.r * (0.72 + R() * 0.4);
    const lx = Math.cos(a) * rr * ar, ly = Math.sin(a) * rr;
    const p = { x: b.cx + lx * Math.cos(rot) - ly * Math.sin(rot), y: b.cy + lx * Math.sin(rot) + ly * Math.cos(rot) };
    vs.push(map ? map(p) : p);
  }
  const mid = (a: Pt, c: Pt) => `${((a.x + c.x) / 2).toFixed(1)},${((a.y + c.y) / 2).toFixed(1)}`;
  let d = `M${mid(vs[0], vs[1])}`;
  for (let k = 1; k <= n; k++) {
    const v = vs[k % n], nx = vs[(k + 1) % n];
    d += ` Q${v.x.toFixed(1)},${v.y.toFixed(1)} ${mid(v, nx)}`;
  }
  return d + 'Z';
};

/** Neck spots in (s,u) space, deformed with the neck. */
export const neckSpotsPath = (sp: SpinePt[], seed: string) => {
  const R = rand(`gneck|${seed}`);
  let d = '';
  let row = 0;
  for (let s = 16; s < NECK_LEN - 8; s += 31, row++) {
    const cols = row % 2 ? [-0.62, 0.05, 0.72] : [-0.3, 0.42];
    cols.forEach((u0, ci) => {
      const ss = s + (R() - 0.5) * 8;
      const u = u0 + (R() - 0.5) * 0.12;
      const w = neckW(ss / NECK_LEN);
      d += blobPath({ cx: 0, cy: 0, r: 12.5 - (ss / NECK_LEN) * 3, ar: 1.15, seed: `${seed}|n${row}|${ci}` },
        (p) => neckPoint(sp, ss + p.y, clamp(u + p.x / w, -0.95, 0.95)));
    });
  }
  return d;
};

// ---------- expressions / blink ----------
export const EXPR: Record<string, { lid: number; pupR: number; pdx: number; pdy: number; brow: number; browTilt: number; mouth: 'smug' | 'o' | 'wavy'; ears: number; sweat: boolean }> = {
  aloof: { lid: 0.56, pupR: 5.5, pdx: 2, pdy: 3, brow: 0, browTilt: 0, mouth: 'smug', ears: 0, sweat: false },
  shocked: { lid: 0, pupR: 3.2, pdx: 0, pdy: 0, brow: -12, browTilt: 0, mouth: 'o', ears: -22, sweat: false },
  mortified: { lid: 0.32, pupR: 4.5, pdx: -3, pdy: 4, brow: -6, browTilt: 14, mouth: 'wavy', ears: 26, sweat: true },
};

export const blinkAt = (frame: number, seed: string) => {
  const f = onTwos(frame);
  const P = 70;
  const k = Math.floor(f / P);
  const st = k * P + 8 + Math.floor(hash01('gblink', seed, k) * 44);
  const dt = f - st;
  if (dt < 0 || dt > 6) return 0;
  return [0.6, 0.6, 1, 1, 0.5, 0.5, 0.2][dt] ?? 0;
};

// ---------- walk ----------
export const STRIDE = 180; // px of travel per 12-frame step pair... each leg covers STRIDE per stance (12 frames)
export const WALK_SPEED = STRIDE / 12; // px per frame at scale 1

const legGait = (p: number, front: boolean) => {
  // p in [0,1): stance 0..0.5, swing 0.5..1
  const hx = (xrel: number) => Math.asin(clamp(-xrel / L_EFF, -1, 1)) / D2R;
  if (p < 0.5) {
    const xrel = STRIDE / 2 - STRIDE * (p / 0.5);
    const hip = hx(xrel);
    return { hip, knee: 0, ankle: -hip, stance: true };
  }
  const q = (p - 0.5) / 0.5;
  const e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
  const xrel = -STRIDE / 2 + STRIDE * e;
  const lift = Math.sin(Math.PI * q);
  const hip = hx(xrel) - lift * (front ? 16 : 6);
  const knee = lift * (front ? 62 : 44);
  return { hip, knee, ankle: -(hip + knee) + lift * 28, stance: false };
};

/**
 * Slow runway strut (pacing gait: near pair then far pair), one step every 12 frames (beat-synced).
 * Returns pose (bob already baked into pose.bodyY — do NOT add bob again), bob (info), and stepX = distance
 * travelled at this frame (on twos). Move her by x0 + (stepX(frame) - stepX(startFrame)) * scale  -> no foot slide.
 */
export const walkPose = (frame: number, opts?: { phase?: number }) => {
  const f = onTwos(frame) + (opts?.phase ?? 0) * 24;
  const cyc = (x: number) => ((x % 1) + 1) % 1;
  const pn = cyc(f / 24), pf = cyc(f / 24 + 0.5);
  const fn = legGait(pn, true), bn = legGait(cyc(pn + 0.04), false);
  const ff = legGait(pf, true), bf = legGait(cyc(pf + 0.04), false);
  const stanceHip = pn < 0.5 ? fn.hip : ff.hip;
  const bob = L_EFF * (1 - Math.cos(stanceHip * D2R));
  const beat = (x: number) => Math.sin(((x) / 12) * Math.PI * 2);
  const neckWave = beat(f - 3) * 1.0;
  const drive = (g: number) => -Math.cos(((g) / 24) * Math.PI * 2) * 14;
  const bag = springFollow(f, drive, f - 60, 70, 4);
  const sash = springFollow(f, (g) => beat(g) * 10, f - 40, 110, 6);
  const pose: Record<string, number> = {
    bodyY: bob, bodyTilt: Math.sin((f / 24) * Math.PI * 2) * 0.5,
    neckLean: 20 + beat(f - 4) * 1.2, neckCurve: -0.5, neckWave,
    headTilt: -24 + beat(f - 6) * 2.2, headTurn: 0,
    fnHip: fn.hip, fnKnee: fn.knee, fnAnkle: fn.ankle,
    ffHip: ff.hip, ffKnee: ff.knee, ffAnkle: ff.ankle,
    bnHip: bn.hip, bnKnee: bn.knee, bnAnkle: bn.ankle,
    bfHip: bf.hip, bfKnee: bf.knee, bfAnkle: bf.ankle,
    tailSwing: Math.sin(((f - 5) / 24) * Math.PI * 2) * 12,
    bagSwing: bag, sashSwing: sash,
    trainWave: Math.sin(((f - 6) / 24) * Math.PI * 2),
  };
  return { pose, bob, stepX: WALK_SPEED * onTwos(frame) };
};

/** Damped jolt helper for accessories: sum of wobble impulses. */
export const jolt = (frame: number, imp: [number, number][] | undefined, hz = 1.6, decay = 2.2) =>
  imp && imp.length ? wobble(frame, imp, hz, decay) : 0;
