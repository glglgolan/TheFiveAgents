// Scattered-pearl renderer (runway WORLD coords — draw inside runwayTransform). Batched into a handful of <path>s.
import React from 'react';
import { C } from '../../lib/style';
import { GROUND_Y } from '../../sets/Runway';
import { pearlStatesAt, SURF_FRONT, type PearlState } from './pearls';
import { SNAP } from './choreo';
import { clamp } from '../../lib/motion';

/** Loose pearls read a touch bigger than on the strand (eases in over ~10f after the snap, no pop). */
const grow = (frame: number) => 1 + 0.32 * clamp((frame - SNAP - 2) / 10);

const f1 = (n: number) => n.toFixed(1);
const circ = (cx: number, cy: number, r: number) =>
  `M${f1(cx - r)},${f1(cy)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0`;
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f1(cx - rx)},${f1(cy)}a${f1(rx)},${f1(ry)} 0 1,0 ${f1(2 * rx)},0a${f1(rx)},${f1(ry)} 0 1,0 ${f1(-2 * rx)},0`;

/** Which pearls to draw: 'back' = behind the giraffe (z < 0), 'front' = the rest, 'all'. */
export type PearlPass = 'back' | 'front' | 'all';

const pick = (ps: PearlState[], pass: PearlPass) =>
  pass === 'all' ? ps : ps.filter((p) => (pass === 'back' ? p.z < -2 && p.state !== 3 : !(p.z < -2 && p.state !== 3)));

/** Contact shadows + glossy reflections of the pearls (draw BEFORE characters, on the runway surface). */
export const PearlGround: React.FC<{ frame: number; flash?: number }> = ({ frame, flash = 0 }) => {
  const ps = pearlStatesAt(frame).filter((p) => p.state !== 3 && p.state !== 0 && p.h < 160);
  const G = grow(frame);
  let sh = '', rf = '';
  for (const p of ps) {
    const fy = GROUND_Y + p.z;
    const k = Math.max(0, 1 - p.h / 160);
    const r = p.r * G;
    sh += ell(p.x + 2, fy + r * 0.55, r * (0.7 + 0.5 * k), r * 0.3 * (0.6 + 0.4 * k));
    if (p.z < SURF_FRONT - 4) rf += circ(p.x, fy + p.h + r * 0.2, r * 0.85);
  }
  return (
    <g>
      <path d={rf} fill={C.pearl} opacity={0.22 + 0.2 * flash} />
      <path d={sh} fill={C.ink} opacity={0.45} />
    </g>
  );
};

/** The pearls themselves (+ speed streaks while airborne). */
export const PearlBodies: React.FC<{ frame: number; pass?: PearlPass; flash?: number }> = ({ frame, pass = 'all', flash = 0 }) => {
  const ps = pick(pearlStatesAt(frame), pass).sort((a, b) => a.z - b.z);
  const G = grow(frame);
  let streak = '', body = '', mid = '', hi = '';
  for (const p of ps) {
    if ((p.state === 1 || p.state === 3) && p.speed > 7) {
      streak += `M${f1(p.px)},${f1(p.py)}L${f1(p.x)},${f1(p.y)}`;
    }
    // slight perspective: nearer pearls (z>0) a touch larger
    const r = p.r * (p.state === 0 ? 1 : G) * (1 + p.z * 0.0022);
    body += circ(p.x, p.y, r);
    mid += circ(p.x - 0.13 * r, p.y - 0.15 * r, r * 0.78);
    hi += circ(p.x - 0.34 * r, p.y - 0.38 * r, r * 0.3);
  }
  return (
    <g>
      {streak && <path d={streak} stroke={C.pearl} strokeWidth={4} strokeLinecap="round" opacity={0.35} fill="none" />}
      <path d={body} fill={C.pearlShade} stroke={C.ink} strokeWidth={1.3} />
      <path d={mid} fill={C.pearl} />
      <path d={hi} fill={C.white} opacity={0.85 + 0.15 * flash} />
    </g>
  );
};
