// Runway set — shared constants, camera/parallax math and a tiny affine path builder.
// Everything here is pure math (no colors).

export const WORLD_W = 4400;
/** Feet line of characters on the runway (screen y at camY=0, zoom=1). */
export const GROUND_Y = 760;
/** Far (back) edge of the visible glossy runway top surface. */
export const SURFACE_FAR_Y = 712;
/** Near (front) edge of the glossy top surface — reflections are clipped to [GROUND_Y, SURFACE_NEAR_Y]. */
export const SURFACE_NEAR_Y = 816;
/** Bottom of the gold lip / top of the front face with footlights. */
export const LIP_Y = 828;
export const FACE_BOTTOM_Y = 908;
export const RUNWAY_START_X = -800;
/** World x where the catwalk ends in a sheer drop. */
export const RUNWAY_END_X = 3900;

/** Parallax factors (1 = runway plane, moves 1:1 with camX). */
export const PARALLAX = {
  wall: 0.3,
  truss: 0.55,
  rowD: 0.64,
  rowC: 0.7,
  rowB: 0.78,
  rowA: 0.87,
  runway: 1,
  front: 1.35,
  confetti: 1.15,
};

export interface Cam { camX: number; camY: number; zoom: number }

/** SVG transform for a layer with parallax factor p (zoom about screen centre, far layers zoom less). */
export const layerTransform = (p: number, cam: Cam) => {
  const z = 1 + (cam.zoom - 1) * p;
  return `translate(960 540) scale(${z.toFixed(4)}) translate(${(-960 - cam.camX * p).toFixed(2)} ${(-540 - cam.camY * p).toFixed(2)})`;
};

/** Layer-space point -> screen point. */
export const layerToScreen = (x: number, y: number, p: number, cam: Cam): [number, number] => {
  const z = 1 + (cam.zoom - 1) * p;
  return [(x - 960 - cam.camX * p) * z + 960, (y - 540 - cam.camY * p) * z + 540];
};

/** Runway-plane world x -> screen x (p = 1). */
export const worldToScreen = (x: number, camX: number, zoom = 1) => (x - 960 - camX) * zoom + 960;

/** Transform string for the runway plane; wrap world-space characters in <g transform={runwayTransform(...)}>. */
export const runwayTransform = (camX = 0, camY = 0, zoom = 1) => layerTransform(1, { camX, camY, zoom });

// ---------------------------------------------------------------- affine path builder
export type Mat = [number, number, number, number, number, number]; // a b c d e f
export const I: Mat = [1, 0, 0, 1, 0, 0];
export const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
export const tr = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];
export const rot = (deg: number): Mat => {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [c, s, -s, c, 0, 0];
};
export const sc = (s: number): Mat => [s, 0, 0, s, 0, 0];
export const chain = (...ms: Mat[]) => ms.reduce((a, b) => mul(a, b), I);

const n = (v: number) => (Math.round(v * 10) / 10).toString();

/** Accumulates path data in a transformed (uniform-scale + rotation + translation) frame. */
export class PB {
  d: string[] = [];
  m: Mat = I;
  set(m: Mat) { this.m = m; return this; }
  private p(x: number, y: number) {
    const m = this.m;
    return `${n(m[0] * x + m[2] * y + m[4])} ${n(m[1] * x + m[3] * y + m[5])}`;
  }
  private s() { return Math.hypot(this.m[0], this.m[1]); }
  private a() { return (Math.atan2(this.m[1], this.m[0]) * 180) / Math.PI; }
  M(x: number, y: number) { this.d.push(`M${this.p(x, y)}`); return this; }
  L(x: number, y: number) { this.d.push(`L${this.p(x, y)}`); return this; }
  C(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.d.push(`C${this.p(x1, y1)} ${this.p(x2, y2)} ${this.p(x, y)}`); return this;
  }
  Q(x1: number, y1: number, x: number, y: number) { this.d.push(`Q${this.p(x1, y1)} ${this.p(x, y)}`); return this; }
  Z() { this.d.push('Z'); return this; }
  poly(pts: [number, number][]) {
    pts.forEach(([x, y], i) => (i ? this.L(x, y) : this.M(x, y)));
    return this.Z();
  }
  line(pts: [number, number][]) { pts.forEach(([x, y], i) => (i ? this.L(x, y) : this.M(x, y))); return this; }
  ellipse(cx: number, cy: number, rx: number, ry: number, deg = 0) {
    const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    const k = this.s(), a = this.a() + deg;
    const x1 = cx - rx * c, y1 = cy - rx * s, x2 = cx + rx * c, y2 = cy + rx * s;
    this.d.push(`M${this.p(x1, y1)}A${n(rx * k)} ${n(ry * k)} ${n(a)} 1 0 ${this.p(x2, y2)}A${n(rx * k)} ${n(ry * k)} ${n(a)} 1 0 ${this.p(x1, y1)}Z`);
    return this;
  }
  circle(cx: number, cy: number, r: number) { return this.ellipse(cx, cy, r, r); }
  rect(x: number, y: number, w: number, h: number) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); }
  str() { return this.d.join(''); }
}
