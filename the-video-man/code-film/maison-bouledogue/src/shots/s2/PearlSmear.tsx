// S2 — lasso smear for the pearl whip: a flat arc of blurred pearls trailing the strand around the fist
// (drawn in the bulldog's local space, replicating his rig transforms; no blur filter).
import React from 'react';
import { C, ink } from '../../lib/style';
import { onTwos } from '../../lib/motion';
import { fullPose, fkWrist } from '../../characters/Bulldog';
import { HIP_Y } from '../../characters/bulldog/rig';

const D2R = Math.PI / 180;
const rot = (x: number, y: number, deg: number) => {
  const r = deg * D2R, c = Math.cos(r), s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
};

/** Wrist of the near arm in the bulldog's local (ground) coords for the pose shown at `frame`. */
export const bulldogFist = (poseFn: (f: number) => Record<string, number>, frame: number) => {
  const p = fullPose(poseFn(onTwos(frame)));
  const w = fkWrist('F', p.armF, p.foreF);
  const t = rot(w.x, w.y, p.torso);
  const l = rot(t.x, t.y + HIP_Y + p.bodyY, p.lean);
  const sy = 1 - 0.14 * p.squash, sx = 1 / sy;
  return { x: l.x * sx, y: l.y * sy };
};

export const PearlSmear: React.FC<{ frame: number; swing: (f: number) => number; poseFn: (f: number) => Record<string, number>; from: number }> = ({ frame, swing, poseFn, from }) => {
  if (frame < from) return null;
  const fist = bulldogFist(poseFn, frame);
  const a1 = swing(frame), a0 = swing(frame - 1.2);
  const span = Math.min(200, Math.abs(a1 - a0));
  if (span < 12) return null;
  const R = 118;
  const n = 12;
  const pts: string[] = [];
  const beads: React.ReactNode[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (a1 - Math.sign(a1 - a0) * span * (i / n)) * D2R;
    const x = fist.x + Math.sin(a) * R, y = fist.y + Math.cos(a) * R;
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    if (i % 3 === 1) beads.push(<circle key={i} cx={x} cy={y} r={7} fill={C.pearl} {...ink(2)} opacity={1 - i / n} />);
  }
  const d = 'M' + pts.join(' L');
  return (
    <g>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" opacity={0.35} />
      <path d={d} fill="none" stroke={C.pearlShade} strokeWidth={20} strokeLinecap="round" opacity={0.8} />
      <path d={d} fill="none" stroke={C.pearl} strokeWidth={10} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.white} strokeWidth={3} strokeLinecap="round" strokeDasharray="2 14" />
      {beads}
    </g>
  );
};
