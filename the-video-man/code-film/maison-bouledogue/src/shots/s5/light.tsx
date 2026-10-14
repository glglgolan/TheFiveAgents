// S5 lighting helpers (screen space): the follow-spot beam on the floating penguin, halo, dust motes, dim scrim.
import React from 'react';
import { C } from '../../lib/style';
import { hash01, noise2 } from '../../lib/rng';

const n1 = (v: number) => Math.round(v * 10) / 10;

export interface BeamGeom { ax: number; ay: number; tx: number; ty: number; w: number }

/** Point inside the beam: v = 0 apex .. 1 target (can exceed 1), u = -1..1 across. */
const beamPt = (b: BeamGeom, v: number, u: number, k = 1) => {
  const dx = b.tx - b.ax, dy = b.ty - b.ay;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L, ny = dx / L;
  const hw = (26 + (b.w - 26) * v) * k;
  return [b.ax + dx * v + nx * hw * u, b.ay + dy * v + ny * hw * u];
};

/** Follow-spot beam from an off-screen lamp (ax, ay) through the target (tx, ty), continuing past it and fading. */
export const FollowBeam: React.FC<{ id: string; b: BeamGeom; intensity: number; frame: number }> = ({ id, b, intensity, frame }) => {
  if (intensity <= 0.01) return null;
  const vEnd = 2.1;
  const cone = (k: number) => {
    const p = [beamPt(b, 0, -1, k), beamPt(b, 0, 1, k), beamPt(b, vEnd, 1, k), beamPt(b, vEnd, -1, k)];
    return `M${p.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L')} Z`;
  };
  const [ex, ey] = beamPt(b, vEnd, 0);
  const flick = 1 + 0.035 * noise2('fbeam', frame * 0.25, 3);
  return (
    <g opacity={Math.min(1.2, intensity) * flick}>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={b.ax} y1={b.ay} x2={ex} y2={ey}>
          <stop offset="0" stopColor={C.white} stopOpacity="0.9" />
          <stop offset="0.42" stopColor={C.spot} stopOpacity="0.75" />
          <stop offset="0.6" stopColor={C.spot} stopOpacity="0.4" />
          <stop offset="1" stopColor={C.spot} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.white} stopOpacity="0.55" />
          <stop offset="0.35" stopColor={C.spot} stopOpacity="0.28" />
          <stop offset="1" stopColor={C.spot} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={cone(1.5)} fill={`url(#${id}g)`} opacity={0.12} />
      <path d={cone(1.1)} fill={`url(#${id}g)`} opacity={0.17} />
      <path d={cone(0.7)} fill={`url(#${id}g)`} opacity={0.2} />
      <path d={cone(0.3)} fill={`url(#${id}g)`} opacity={0.22} />
      <ellipse cx={b.tx} cy={b.ty} rx={b.w * 1.9} ry={b.w * 1.9} fill={`url(#${id}h)`} />
    </g>
  );
};

/** Dust motes drifting inside the beam. layer 0 = behind the character, 1 = in front. */
export const Motes: React.FC<{ b: BeamGeom; frame: number; intensity: number; layer: 0 | 1; count?: number }> = ({ b, frame, intensity, layer, count = 34 }) => {
  if (intensity <= 0.02) return null;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    if ((i % 2) !== layer) continue;
    const sp = 0.0016 + hash01('msp', i) * 0.0026;
    const v = 0.35 + ((hash01('mv', i) + frame * sp) % 1) * 1.35;
    const u = (hash01('mu', i) * 2 - 1) * 0.85 + noise2('mote', i * 3.1, frame * 0.018) * 0.25;
    const [x, y] = beamPt(b, v, u);
    const near = Math.abs(v - 1) < 0.35 ? 1 : 0.55;
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * (0.12 + hash01('mt', i) * 0.2) + i * 2.3));
    const r = (1.2 + hash01('mr', i) * 2.6) * (layer ? 1.3 : 1);
    els.push(<circle key={i} cx={n1(x)} cy={n1(y)} r={n1(r)} fill={C.white} opacity={n1(tw * near * Math.min(1, intensity) * 100) / 100} />);
  }
  return <g>{els}</g>;
};

/** Screen-space dark scrim (house lights down). */
export const Scrim: React.FC<{ amount: number }> = ({ amount }) =>
  amount > 0.005 ? <rect x={-100} y={-100} width={2120} height={1280} fill={C.ink} opacity={amount} /> : null;
