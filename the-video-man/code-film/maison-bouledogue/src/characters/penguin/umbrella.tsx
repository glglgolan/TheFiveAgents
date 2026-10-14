import React from 'react';
import { C, ink, S } from '../../lib/style';
import { clamp } from '../../lib/motion';

/**
 * UMBRELLA CRINOLINE — an 8-rib umbrella built in 3D and projected.
 * u = umbrellaOpen 0..1: 0 = stiff bell skirt hung from the waist hub, 1 = parasol dome high above her head.
 * In between: anticipation squeeze, ribs telescope out, runner shoots up the shaft, canopy flips through flat,
 * overshoots and settles into a dome.
 */
type V3 = [number, number, number];
const n1 = (v: number) => Math.round(v * 10) / 10;

/** Catmull-Rom through [u,value] keys (clamped). */
const spline = (u: number, keys: [number, number][]) => {
  if (u <= keys[0][0]) return keys[0][1];
  const last = keys.length - 1;
  if (u >= keys[last][0]) return keys[last][1];
  let i = 0;
  while (i < last - 1 && u > keys[i + 1][0]) i++;
  const t = (u - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
  const p1 = keys[i][1], p2 = keys[i + 1][1];
  const p0 = i > 0 ? keys[i - 1][1] : p1;
  const p3 = i + 2 <= last ? keys[i + 2][1] : p2;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
};

// ---- choreography of the pop (u -> geometry) ----
// 0 -> 0.12 anticipation squeeze | 0.12 -> 0.24 skirt flares up flat like a tutu | 0.24 -> 0.5 runner shoots up,
// canopy blows inside-out past her head | 0.5 -> 0.72 snaps through into a dome, overshoots | -> 1 settles
const K_THETA: [number, number][] = [[0, 46], [0.12, 36], [0.24, 90], [0.4, 114], [0.55, 96], [0.72, 50], [0.86, 62], [1, 58]];
const K_LEN: [number, number][] = [[0, 142], [0.12, 136], [0.24, 170], [0.45, 262], [0.7, 300], [1, 288]];
const K_R0: [number, number][] = [[0, 44], [0.14, 42], [0.3, 36], [0.55, 12], [1, 8]];
const K_HUBY: [number, number][] = [[0, -150], [0.12, -142], [0.24, -172], [0.45, -470], [0.62, -640], [0.8, -612], [1, -618]];
const K_AXX: [number, number][] = [[0, 0], [0.24, -4], [0.5, -50], [1, -76]];
const K_TILT: [number, number][] = [[0, 0.16], [0.24, 0.1], [0.45, 0.0], [0.62, -0.2], [1, -0.16]];
const K_TWIST: [number, number][] = [[0, 0], [0.5, 30], [1, 45]];
const K_SAG: [number, number][] = [[0, 0.1], [0.3, 0.05], [1, 0.12]];
const K_BULGE: [number, number][] = [[0, 0.27], [0.24, 0.1], [0.45, 0.08], [0.75, 0.2], [1, 0.18]];

export interface UmbrellaGeom {
  u: number;
  hub: V3; axX: number; tilt: number; theta: number; L: number;
  ring: V3[]; ctrl: V3[]; tip: V3[]; phi: number[];
  runner: V3; stretchAt: V3[];
  frontInFront: boolean;
}

export const umbrellaGeom = (uRaw: number, jiggle: number, frame: number, wind: number): UmbrellaGeom => {
  const u = clamp(uRaw, 0, 1);
  const theta = spline(u, K_THETA) + jiggle;
  const L = spline(u, K_LEN) * (1 + jiggle * 0.003);
  const r0 = spline(u, K_R0);
  const hy = spline(u, K_HUBY) - jiggle * 0.6;
  const axX = spline(u, K_AXX);
  const tilt = spline(u, K_TILT);
  const phi0 = 22.5 + spline(u, K_TWIST) + frame * 0.45 * clamp((u - 0.7) / 0.3);
  const hub: V3 = [axX, hy, 0];
  const ring: V3[] = [], ctrl: V3[] = [], tip: V3[] = [], phi: number[] = [], stretchAt: V3[] = [];
  const th = (theta * Math.PI) / 180;
  const bulge = spline(u, K_BULGE);
  for (let i = 0; i < 8; i++) {
    const p = ((phi0 + i * 45) * Math.PI) / 180;
    phi.push(p);
    const cp = Math.cos(p), sp = Math.sin(p);
    const d: V3 = [Math.sin(th) * cp, Math.cos(th), Math.sin(th) * sp];
    const nrm: V3 = [Math.cos(th) * cp, -Math.sin(th), Math.cos(th) * sp];
    const r: V3 = [hub[0] + r0 * cp, hub[1], r0 * sp];
    // canopy-edge flutter: breathes with wind once open
    const fl = Math.sin(frame * 0.33 + i * 1.9) * (1.2 + wind * 5) * clamp(u * 1.4);
    const t3: V3 = [r[0] + L * d[0], r[1] + L * d[1] + fl, r[2] + L * d[2]];
    const b = L * bulge;
    const c3: V3 = [r[0] + 0.5 * L * d[0] + b * nrm[0], r[1] + 0.5 * L * d[1] + b * nrm[1], r[2] + 0.5 * L * d[2] + b * nrm[2]];
    ring.push(r); tip.push(t3); ctrl.push(c3);
    stretchAt.push([r[0] + 0.5 * L * d[0] + b * 0.7 * nrm[0], r[1] + 0.5 * L * d[1] + b * 0.7 * nrm[1], r[2] + 0.5 * L * d[2] + b * 0.7 * nrm[2]]);
  }
  const runner: V3 = [axX, hy + L * 0.42 * clamp((u - 0.15) / 0.5), 0];
  // front canopy panels go in front of her body only while it is a skirt, or once it is above her head
  const frontInFront = hy > -200 || hy < -470;
  return { u, hub, axX, tilt, theta, L, ring, ctrl, tip, phi, runner, stretchAt, frontInFront };
};

const pj = (p: V3, tilt: number): [number, number] => [p[0], p[1] + p[2] * tilt];
const pt = (p: V3, tilt: number) => { const [x, y] = pj(p, tilt); return `${n1(x)},${n1(y)}`; };
const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

interface Panel { i: number; path: string; z: number; inner: boolean; dots: { x: number; y: number; r: number }[] }

const panels = (g: UmbrellaGeom, frame: number): Panel[] => {
  const out: Panel[] = [];
  const th = (g.theta * Math.PI) / 180;
  const sag = spline(g.u, K_SAG);
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    const tm = mix3(g.tip[i], g.tip[j], 0.5);
    const rm = mix3(g.ring[i], g.ring[j], 0.5);
    // scallop: hem between ribs pulled back toward the hub
    const sc = mix3(tm, rm, sag + 0.015 * Math.sin(frame * 0.4 + i));
    const path = `M${pt(g.ring[i], g.tilt)} Q${pt(g.ctrl[i], g.tilt)} ${pt(g.tip[i], g.tilt)} Q${pt(sc, g.tilt)} ${pt(g.tip[j], g.tilt)} Q${pt(g.ctrl[j], g.tilt)} ${pt(g.ring[j], g.tilt)} Z`;
    const pm = (g.phi[i] + g.phi[j]) / 2 + (j === 0 ? Math.PI : 0);
    const facing = Math.cos(th) * Math.sin(pm) + Math.sin(th) * g.tilt;
    const z = (g.tip[i][2] + g.tip[j][2]) / 2;
    // polka dots on the white panels (bilinear on the panel + bulge)
    const dots: Panel['dots'] = [];
    if (i % 2 === 1) {
      const spots: [number, number][] = [[0.5, 0.36], [0.3, 0.72], [0.72, 0.7]];
      for (const [a, b] of spots) {
        const e0 = mix3(g.ring[i], g.tip[i], b), e1 = mix3(g.ring[j], g.tip[j], b);
        const pp = mix3(e0, e1, a);
        const cm = mix3(g.ctrl[i], g.ctrl[j], a), lm = mix3(mix3(g.ring[i], g.tip[i], 0.5), mix3(g.ring[j], g.tip[j], 0.5), a);
        const k = 4 * b * (1 - b);
        const k2 = k * 0.5; // quadratic bezier reaches half its control offset
        const p3: V3 = [pp[0] + (cm[0] - lm[0]) * k2, pp[1] + (cm[1] - lm[1]) * k2, pp[2] + (cm[2] - lm[2]) * k2];
        const [x, y] = pj(p3, g.tilt);
        const w = Math.abs(facing);
        dots.push({ x, y, r: g.L * 0.045 * (0.55 + 0.45 * w) * (0.6 + 0.4 * b) });
      }
    }
    out.push({ i, path, z, inner: facing < 0, dots });
  }
  return out.sort((a, b) => a.z - b.z);
};

const PanelShape: React.FC<{ p: Panel }> = ({ p }) => (
  <g>
    <path d={p.path} fill={p.i % 2 === 0 ? C.hotPink : C.white} {...ink(S.inkThin + 0.5)} />
    {p.dots.map((d, k) => <circle key={k} cx={n1(d.x)} cy={n1(d.y)} r={n1(d.r)} fill={C.teal} />)}
    {p.inner && <path d={p.path} fill="url(#halftone)" opacity={0.85} />}
  </g>
);

/** Layer drawn BEHIND the penguin's body: shaft, ferrule, back panels, inner mechanism. */
export const UmbrellaBack: React.FC<{ g: UmbrellaGeom; frame: number }> = ({ g, frame }) => {
  const ps = panels(g, frame);
  const back = ps.filter((p) => !g.frontInFront || p.z < 0);
  const tl = g.tilt;
  const open = g.u;
  const shaftBase: [number, number] = [g.axX, -150]; // attaches at the waist bow
  const [hx, hy] = pj(g.hub, tl);
  const [rx, ry] = pj(g.runner, tl);
  const ferruleLen = 30 + 8 * open;
  return (
    <g>
      {/* shaft: telescopes from her waist up to the hub */}
      {hy < shaftBase[1] - 4 && (
        <g>
          <line x1={n1(shaftBase[0])} y1={shaftBase[1]} x2={n1(hx)} y2={n1(hy)} {...ink(9)} />
          <line x1={n1(shaftBase[0])} y1={shaftBase[1]} x2={n1(hx)} y2={n1(hy)} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      {/* ferrule + finial cap on top */}
      <path d={`M${n1(hx - 7)},${n1(hy - 4)} L${n1(hx)},${n1(hy - ferruleLen)} L${n1(hx + 7)},${n1(hy - 4)} Z`} fill={C.gold} {...ink(S.inkThin)} />
      <circle cx={n1(hx)} cy={n1(hy - ferruleLen)} r={4.5} fill={C.goldLight} {...ink(2.5)} />
      {back.map((p) => <PanelShape key={p.i} p={p} />)}
      {/* the mechanism: runner + stretchers, visible from underneath once it opens */}
      {open > 0.25 && (
        <g opacity={clamp((open - 0.25) / 0.2)}>
          {g.stretchAt.map((s, k) => {
            if (g.frontInFront && g.tip[k][2] > 30) return null;
            const [sx, sy] = pj(s, tl);
            return <line key={k} x1={n1(rx)} y1={n1(ry)} x2={n1(sx)} y2={n1(sy)} stroke={C.gold} strokeWidth={3} strokeLinecap="round" />;
          })}
          <line x1={n1(hx)} y1={n1(hy)} x2={n1(rx)} y2={n1(ry)} stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
          <rect x={n1(rx - 7)} y={n1(ry - 6)} width={14} height={12} rx={4} fill={C.gold} {...ink(2.5)} />
        </g>
      )}
      {/* gold rib tips on the far side */}
      {g.tip.map((t, k) => (t[2] < 0 ? <circle key={k} cx={n1(pj(t, tl)[0])} cy={n1(pj(t, tl)[1])} r={4} fill={C.gold} {...ink(2)} /> : null))}
    </g>
  );
};

/** Layer drawn IN FRONT of her body (skirt front, or the parasol's near side). */
export const UmbrellaFront: React.FC<{ g: UmbrellaGeom; frame: number }> = ({ g, frame }) => {
  if (!g.frontInFront) return null;
  const ps = panels(g, frame).filter((p) => p.z >= 0);
  const tl = g.tilt;
  return (
    <g>
      {ps.map((p) => <PanelShape key={p.i} p={p} />)}
      {g.tip.map((t, k) => (t[2] >= 0 ? <circle key={k} cx={n1(pj(t, tl)[0])} cy={n1(pj(t, tl)[1])} r={4.5} fill={C.gold} {...ink(2)} /> : null))}
      {/* finial knob over the hub once it's a parasol */}
      {g.u > 0.5 && <circle cx={n1(pj(g.hub, tl)[0])} cy={n1(pj(g.hub, tl)[1])} r={7} fill={C.gold} {...ink(2.5)} />}
    </g>
  );
};

/** Paper-cut drop-shadow silhouette of the canopy (one hull path). */
export const UmbrellaShadow: React.FC<{ g: UmbrellaGeom }> = ({ g }) => {
  const tl = g.tilt;
  const pts = [pj(g.hub, tl), ...g.tip.map((t) => pj(t, tl))];
  // simple hull: sort tips by angle around their centroid, then add the hub on top
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const hull = pts.slice().sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  return <path d={`M${hull.map((p) => `${n1(p[0])},${n1(p[1])}`).join(' L')} Z`} fill={C.ink} opacity={0.22} strokeLinejoin="round" stroke={C.ink} strokeWidth={10} strokeOpacity={0.22} />;
};
