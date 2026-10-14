// S6 button: a single pearl rolls toward the camera and CLINKS against the lens (screen space).
import React from 'react';
import { C } from '../../lib/style';
import { clamp, ease, lerp } from '../../lib/motion';
import { rand } from '../../lib/rng';

const n1 = (v: number) => Math.round(v * 10) / 10;

export const ROLL0 = 1410, CLINK = 1428;
const D_END = 0.045;
const START = { x: 1150, y: 806 }, END = { x: 1450, y: 858 };
const R0 = 9;

/** Pearl centre/radius/roll angle at frame. */
export const lastPearlAt = (frame: number) => {
  if (frame < ROLL0) return null;
  if (frame <= CLINK) {
    const t = (frame - ROLL0) / (CLINK - ROLL0);
    const d = lerp(1, D_END, t);
    const g = (1 / d - 1) / (1 / D_END - 1); // perspective-consistent screen travel
    const r = R0 / d;
    const hop = Math.abs(Math.sin(t * Math.PI * 5)) * r * 0.06 * (1 - t);
    return { x: lerp(START.x, END.x, g), y: lerp(START.y, END.y, g) - hop, r, ang: (t * 900 + g * 360) };
  }
  // after the clink: tiny squash & rebound away from the glass
  const u = frame - CLINK;
  const back = ease.out(clamp(u / 8));
  const r = R0 / D_END * (1 - 0.1 * back);
  return { x: END.x - 10 * back, y: END.y + 16 * back, r, ang: 1260 - back * 30 };
};

export const LastPearl: React.FC<{ frame: number }> = ({ frame }) => {
  const p = lastPearlAt(frame);
  if (!p) return null;
  const { x, y, r, ang } = p;
  const sq = frame >= CLINK && frame < CLINK + 3 ? [1.07, 1.03, 1.01][frame - CLINK] : 1;
  const a = (ang * Math.PI) / 180;
  // rolling seam: an ellipse (great circle) rotating with the roll
  const seamRy = r * Math.abs(Math.cos(a)) * 0.9;
  const glow = clamp((r - 40) / 120);
  return (
    <g>
      <defs>
        <radialGradient id="s6lpG" cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor={C.white} />
          <stop offset="0.3" stopColor={C.pearl} />
          <stop offset="0.72" stopColor={C.pearlShade} />
          <stop offset="0.93" stopColor={C.mouseFur} />
          <stop offset="1" stopColor={C.blush} />
        </radialGradient>
        <clipPath id="s6lpC"><circle cx={n1(x)} cy={n1(y)} r={n1(r)} /></clipPath>
      </defs>
      {/* contact shadow on the floor */}
      <ellipse cx={n1(x + r * 0.12)} cy={n1(y + r * 0.96)} rx={n1(r * 1.05)} ry={n1(r * 0.2)} fill={C.ink} opacity={0.5} />
      {/* paper-cut drop shadow */}
      <circle cx={n1(x + Math.max(3, r * 0.05))} cy={n1(y + Math.max(3, r * 0.05))} r={n1(r)} fill={C.ink} opacity={0.3} />
      <g transform={`translate(${n1(x)} ${n1(y)}) scale(${sq} ${n1((2 - sq) * 100) / 100}) translate(${n1(-x)} ${n1(-y)})`}>
        <circle cx={n1(x)} cy={n1(y)} r={n1(r)} fill="url(#s6lpG)" stroke={C.ink} strokeWidth={Math.max(1.6, r * 0.045)} />
        <g clipPath="url(#s6lpC)">
          {/* iridescent nacre bands, rolling */}
          <ellipse cx={n1(x + Math.sin(a) * r * 0.5)} cy={n1(y)} rx={n1(r * 0.18 + r * 0.25 * Math.abs(Math.sin(a)))} ry={n1(r * 1.05)}
            fill={C.blush} opacity={0.18 * glow + 0.05} />
          <ellipse cx={n1(x)} cy={n1(y)} rx={n1(r * 0.98)} ry={n1(Math.max(1, seamRy))} fill="none" stroke={C.pearlShade} strokeWidth={Math.max(1, r * 0.02)} opacity={0.7} />
          <path d={`M${n1(x - r)} ${n1(y + r * 0.55)} Q${n1(x)} ${n1(y + r * 1.05)} ${n1(x + r)} ${n1(y + r * 0.55)}`} fill="none" stroke={C.tealLight}
            strokeWidth={Math.max(1, r * 0.05)} opacity={0.18 * glow} />
          {/* halftone shade */}
          <circle cx={n1(x + r * 0.35)} cy={n1(y + r * 0.35)} r={n1(r * 0.85)} fill="url(#halftone)" opacity={0.5 * glow} />
        </g>
        {/* specular: fixed to the light, spinning glint on it */}
        <ellipse cx={n1(x - r * 0.38)} cy={n1(y - r * 0.4)} rx={n1(Math.max(1.5, r * 0.2))} ry={n1(Math.max(1.2, r * 0.14))} fill={C.white}
          transform={`rotate(-35 ${n1(x - r * 0.38)} ${n1(y - r * 0.4)})`} />
        <circle cx={n1(x - r * 0.16)} cy={n1(y - r * 0.56)} r={n1(Math.max(0.8, r * 0.05))} fill={C.white} />
        {r > 24 && (
          <g transform={`translate(${n1(x - r * 0.38)} ${n1(y - r * 0.4)}) rotate(${n1(ang * 0.5)})`} opacity={0.9}>
            <path d={`M0 ${n1(-r * 0.42)} L${n1(r * 0.04)} 0 L0 ${n1(r * 0.42)} L${n1(-r * 0.04)} 0 Z M${n1(-r * 0.42)} 0 L0 ${n1(r * 0.04)} L${n1(r * 0.42)} 0 L0 ${n1(-r * 0.04)} Z`} fill={C.white} />
          </g>
        )}
      </g>
    </g>
  );
};

// ---------------- lens crack ----------------
interface Ray { pts: [number, number][]; w: number; branch?: [number, number][] }
const RAYS: Ray[] = (() => {
  const r = rand('lens-crack');
  const out: Ray[] = [];
  const N = 15;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 + (r() - 0.5) * 0.35;
    const len = (i % 3 === 0 ? 300 : 120) + r() * 260;
    // glass fractures: straight runs with one or two sharp kinks
    const k1 = 0.3 + r() * 0.3;
    const a1 = a0 + (r() - 0.5) * 0.7;
    const pts: [number, number][] = [
      [Math.cos(a0) * 10, Math.sin(a0) * 10],
      [Math.cos(a0) * len * k1, Math.sin(a0) * len * k1],
    ];
    const [px, py] = pts[1];
    pts.push([px + Math.cos(a1) * len * (1 - k1), py + Math.sin(a1) * len * (1 - k1)]);
    let branch: [number, number][] | undefined;
    if (r() < 0.45) {
      const ba = a0 + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.4);
      const bl = 40 + r() * 80;
      branch = [[px, py], [px + Math.cos(ba) * bl, py + Math.sin(ba) * bl]];
    }
    out.push({ pts, w: 1.4 + r() * 1.8, branch });
  }
  return out;
})();
/** Polygonal fracture rings (broken chords between neighbouring rays). */
const RINGS: [number, number][][] = [0.16, 0.34].map((kr, k) => {
  const r = rand(`lens-ring${k}`);
  return RAYS.map((_, i) => {
    const a = (i / RAYS.length) * Math.PI * 2 + (r() - 0.5) * 0.2;
    const rr = (60 + kr * 300) * (0.85 + r() * 0.3);
    return [Math.cos(a) * rr, Math.sin(a) * rr] as [number, number];
  });
});

export const LensCrack: React.FC<{ frame: number; x: number; y: number }> = ({ frame, x, y }) => {
  const t = frame - CLINK;
  if (t < 0) return null;
  const grow = ease.out(clamp((t + 1) / 3));
  const flash = clamp(1 - t / 5);
  const star = t < 10 ? ease.outBack(clamp(t / 3), 2) * (1 - clamp((t - 3) / 7) * 0.6) : 0.4;
  const path = (pts: [number, number][]) => pts.map(([px, py], i) => `${i ? 'L' : 'M'}${n1(x + px * grow)} ${n1(y + py * grow)}`).join('');
  return (
    <g>
      {/* glassy flash */}
      {flash > 0 && <rect x={-50} y={-50} width={2020} height={1180} fill={C.white} opacity={0.32 * flash} />}
      {/* crack lines: dark refraction edge + bright glass edge */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {RAYS.map((ry, i) => (
          <g key={i}>
            <path d={path(ry.pts)} stroke={C.ink} strokeWidth={ry.w + 2.5} opacity={0.45} />
            <path d={path(ry.pts)} stroke={C.white} strokeWidth={ry.w} opacity={0.95} />
            {ry.branch && <path d={path(ry.branch)} stroke={C.white} strokeWidth={ry.w * 0.7} opacity={0.8} />}
          </g>
        ))}
        {/* concentric fracture rings: broken chords (every other one missing) */}
        {RINGS.map((ring, k) => (
          <path key={k} d={ring.map((p, i) => (i % 2 === k % 2 ? '' : `M${n1(x + p[0] * grow)} ${n1(y + p[1] * grow)}L${n1(x + ring[(i + 1) % ring.length][0] * grow)} ${n1(y + ring[(i + 1) % ring.length][1] * grow)}`)).join('')}
            stroke={C.white} strokeWidth={2.2 - k * 0.6} opacity={0.85} />
        ))}
      </g>
      {/* impact glint star */}
      <g transform={`translate(${n1(x)} ${n1(y)}) scale(${n1(star * 100) / 100}) rotate(12)`}>
        <path d="M0 -150 L12 -12 L150 0 L12 12 L0 150 L-12 12 L-150 0 L-12 -12 Z" fill={C.white} opacity={0.95} />
        <path d="M0 -70 L6 -6 L70 0 L6 6 L0 70 L-6 6 L-70 0 L-6 -6 Z" fill={C.spot} transform="rotate(45)" />
        <circle r={16} fill={C.white} />
      </g>
    </g>
  );
};
