import React from 'react';
import { C, ink, S } from '../../lib/style';
import { clamp, lerp } from '../../lib/motion';
import type { Expression } from './rig';

const n1 = (v: number) => Math.round(v * 10) / 10;

// ---------------- flippers ----------------
/** Flipper in local coords: shoulder at (0,0), hanging along +y. Lace glove on the tip segment. */
export const Flipper: React.FC<{ x: number; y: number; angle: number; bend: number; far?: boolean }> = ({ x, y, angle, bend, far }) => {
  const body = far ? C.ink : C.penguinBlack;
  return (
    <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(-angle)})`}>
      <path d="M-14,-4 C-19,24 -15,48 -10,64 L10,64 C15,46 18,22 14,-4 C8,-12 -8,-12 -14,-4 Z" fill={body} {...ink()} />
      <g transform={`translate(0 60) rotate(${n1(-bend)})`}>
        <path d="M-10,-2 C-12,20 -6,42 0,54 C6,42 13,20 10,-2 Z" fill={body} {...ink()} />
        {/* lace glove */}
        <path d="M-10.5,10 C-10,26 -5,42 0,54 C5,42 11,26 10.5,10 Z" fill={C.white} {...ink(S.inkThin)} />
        <path d="M-11,10 q2.75,5 5.5,0 q2.75,5 5.5,0 q2.75,5 5.5,0 q2.75,5 5.5,0" fill="none" {...ink(2.2)} />
        <circle cx={-3.5} cy={24} r={1.6} fill={C.ink} opacity={0.55} />
        <circle cx={3.5} cy={24} r={1.6} fill={C.ink} opacity={0.55} />
        <circle cx={0} cy={34} r={1.6} fill={C.ink} opacity={0.55} />
      </g>
    </g>
  );
};

// ---------------- legs ----------------
/** Leg: hip at (x,y); stocking + hotPink kitten heel. angle positive = forward. */
export const Leg: React.FC<{ x: number; y: number; angle: number; toe: number; far?: boolean }> = ({ x, y, angle, toe, far }) => (
  <g transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(-angle)})`}>
    <path d="M-9,0 C-9,20 -6,36 -4.5,46 L4.5,46 C6,36 9,20 9,0 Z" fill={far ? C.ink : C.penguinBlack} {...ink(S.inkThin)} />
    <g transform={`translate(0 46) rotate(${n1(toe * 62)})`}>
      {/* kitten heel post */}
      <path d="M-8,2 L-6.5,10 L-4,10 L-3.5,3 Z" fill={C.gold} {...ink(2.2)} />
      <path d="M-10,-2 Q-11,5 -5,4 L6,5.5 Q15,8.5 25,8 Q21,1 11,-1.5 L3,-6 Q-7,-8 -10,-2 Z" fill={far ? C.coral : C.hotPink} {...ink(S.inkThin)} />
      <path d="M2,-3 Q6,0 10,-1" fill="none" stroke={C.white} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
    </g>
  </g>
);

// ---------------- head ----------------
interface ExprSpec { lid: number; pupil: number; eyeR: number; browY: number; browRot: number; beak: number; nose: number; closed: 0 | 1 | 2; blush: number }
const EX: Record<Expression, ExprSpec> = {
  prim: { lid: 0.46, pupil: 5.2, eyeR: 12, browY: -27, browRot: -8, beak: 0, nose: -7, closed: 0, blush: 0.7 },
  alarmed: { lid: 0.02, pupil: 4.4, eyeR: 13.5, browY: -33, browRot: 6, beak: 12, nose: 2, closed: 0, blush: 0.5 },
  terrified: { lid: 0, pupil: 2.2, eyeR: 15.5, browY: -36, browRot: 22, beak: 30, nose: 6, closed: 0, blush: 0.25 },
  serene: { lid: 1, pupil: 4, eyeR: 11, browY: -26, browRot: -4, beak: 0, nose: -10, closed: 1, blush: 1 },
  delighted: { lid: 1, pupil: 4, eyeR: 11, browY: -31, browRot: -12, beak: 20, nose: -8, closed: 2, blush: 1 },
};
export const exprNose = (e: string) => (EX[e as Expression] ?? EX.prim).nose;

/**
 * Head in body coords (neck pivot ~ (10,-258)). Includes face, pillbox hat, veil and hat dangle.
 */
export const Head: React.FC<{
  expression: string; blink: number; frame: number; veilLift: number; veilFlut: number; veilKick: number;
  hatLift: number; hatRot: number; dangle: number;
}> = ({ expression, blink, frame, veilLift, veilFlut, veilKick, hatLift, hatRot, dangle }) => {
  const e = EX[expression as Expression] ?? EX.prim;
  const ex = 36, ey = -310;
  const lid = e.closed ? 1 : clamp(Math.max(e.lid, blink));
  const r = e.eyeR;
  // lid chord
  const y0 = -r + 2 * r * Math.min(lid, 0.98);
  const x0 = Math.sqrt(Math.max(0, r * r - y0 * y0));
  const lidPath = `M${n1(-x0)},${n1(y0)} A${r} ${r} 0 ${y0 > 0 ? 1 : 0} 1 ${n1(x0)},${n1(y0)} Z`;
  const beakOpen = e.beak;
  // veil geometry (hat-local): hem lifts with wind, flutters, kicks with impulses
  const fl = (k: number) => Math.sin(frame * (0.55 + veilFlut * 0.35) + k * 1.3) * (1.5 + veilFlut * 7);
  const hemY = lerp(52, -14, veilLift) + veilKick;
  const hemX = lerp(0, 22, veilLift);
  const veil = `M-12,2 Q12,-5 36,-2 Q${n1(46 + hemX * 0.6 + fl(1))},${n1(hemY * 0.45 + 4)} ${n1(50 + hemX + fl(2))},${n1(hemY + fl(3))} ` +
    `Q${n1(40 + hemX)},${n1(hemY + 6 + fl(4))} ${n1(30 + hemX)},${n1(hemY + 2 + fl(5))} Q${n1(20 + hemX)},${n1(hemY + 8 + fl(6))} ${n1(10 + hemX * 0.8)},${n1(hemY + 3 + fl(7))} ` +
    `Q${n1(2 + hemX * 0.6)},${n1(hemY + 8)} ${n1(-6 + hemX * 0.3)},${n1(hemY - 2 + fl(8))} Q${n1(-14 + hemX * 0.2)},${n1(hemY * 0.5)} -12,2 Z`;
  const chen = [[6, 0.35], [24, 0.5], [16, 0.78], [38, 0.7]].map(([x, t]) => [x + hemX * t, lerp(4, hemY, t) + fl(x) * t]);
  return (
    <g>
      {/* head */}
      <circle cx={14} cy={-300} r={49} fill={C.penguinBlack} {...ink()} />
      <path d="M-20,-334 A49 49 0 0 1 40,-340" fill="none" stroke={C.white} strokeWidth={4} strokeLinecap="round" opacity={0.25} />
      <path d="M-30,-282 A49 49 0 0 0 10,-252 L10,-262 A40 40 0 0 1 -22,-282 Z" fill="url(#halftone)" />
      {/* white face patch */}
      <path d="M18,-326 C34,-338 60,-326 60,-300 C60,-282 48,-272 32,-274 C18,-276 10,-290 12,-306 C13,-316 15,-322 18,-326 Z" fill={C.white} {...ink(S.inkThin)} />
      {/* blush */}
      <ellipse cx={34} cy={-284} rx={10} ry={5.5} fill={C.blush} opacity={e.blush} />
      {/* eye */}
      <g transform={`translate(${ex} ${ey})`}>
        {e.closed === 0 && (
          <g>
            <circle r={r} fill={C.white} {...ink(2.6)} />
            <circle cx={2.2} cy={lid > 0.4 ? 2 : 0} r={e.pupil} fill={C.ink} />
            <circle cx={3.6} cy={-1.4} r={1.3} fill={C.white} />
            {lid > 0.02 && <path d={lidPath} fill={C.penguinBlack} {...ink(2.6)} />}
            {/* lashes at the outer (back) corner, riding the lid line */}
            <path d={`M${n1(-x0 + 1)},${n1(y0)} l-7,-5 M${n1(-x0 + 3)},${n1(y0 - 3)} l-6,-8 M${n1(-x0 + 6)},${n1(y0 - 5)} l-3,-9`} {...ink(2.4)} fill="none" />
          </g>
        )}
        {e.closed === 1 && (
          <path d="M-11,-1 Q0,8 11,-1 M-10,1 l-6,4 M-7,4 l-4,6 M-3,6 l-2,6" fill="none" {...ink(3)} />
        )}
        {e.closed === 2 && (
          <path d="M-11,4 Q0,-10 11,4 M-10,1 l-6,-3" fill="none" {...ink(3.4)} />
        )}
      </g>
      {/* brow */}
      <path d={`M-9,0 Q0,-5 10,-1`} transform={`translate(${ex} ${ey + e.browY + r - 11}) rotate(${e.browRot})`} fill="none" {...ink(3.2)} />
      {e.closed === 2 && (
        <g fill={C.goldLight} {...ink(1.6)}>
          <path d="M70,-340 l3,-8 l3,8 l8,3 l-8,3 l-3,8 l-3,-8 l-8,-3 Z" />
          <path d="M-8,-350 l2,-5 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 Z" />
        </g>
      )}
      {expression === 'terrified' && (
        <path d="M-12,-322 q-5,9 0,11 q5,-2 0,-11 Z" fill={C.white} {...ink(2)} />
      )}
      {/* beak */}
      {beakOpen > 1 && <path d="M56,-297 L82,-296 L60,-282 Z" fill={C.curtainDark} />}
      <path d="M57,-297 Q70,-293 82,-297 Q70,-290 57,-289 Z" transform={`rotate(${n1(beakOpen)} 57 -295)`} fill={C.mustard} {...ink(S.inkThin)} />
      <path d="M55,-309 Q75,-311 92,-300 Q76,-296 57,-295 Z" fill={C.gold} {...ink(S.inkThin)} />
      <path d="M62,-305 Q72,-305 80,-302" fill="none" stroke={C.goldLight} strokeWidth={2.2} strokeLinecap="round" />
      {/* pillbox hat */}
      <g transform={`translate(20 ${n1(-345 - hatLift)}) rotate(${n1(-12 + hatRot)})`}>
        {/* dangling pearl drop on a chain from the back of the hat */}
        <g transform={`translate(-28 -8) rotate(${n1(dangle)})`}>
          <line x1={0} y1={0} x2={0} y2={20} stroke={C.gold} strokeWidth={2} />
          <circle cx={0} cy={25} r={5.5} fill={C.pearl} {...ink(2.2)} />
        </g>
        <path d="M-32,0 L-29,-27 Q0,-34 29,-27 L32,0 Q0,7 -32,0 Z" fill={C.hotPink} {...ink()} />
        <path d="M-31.5,-8 Q0,-2 31.5,-8 L32,0 Q0,7 -32,0 Z" fill={C.gold} {...ink(S.inkThin)} />
        <ellipse cx={0} cy={-28} rx={29} ry={6} fill={C.coral} {...ink(S.inkThin)} />
        <path d="M-20,-24 Q-24,-20 -22,-6" fill="none" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        {/* teal bow at the back */}
        <path d="M-30,-14 q-16,-14 -18,2 q2,12 18,-2 Z M-30,-14 q-8,16 -20,16 q2,-12 20,-16 Z" fill={C.teal} {...ink(S.inkThin)} />
        <circle cx={-30} cy={-14} r={4} fill={C.tealLight} {...ink(2)} />
        {/* the black net veil */}
        <path d={veil} fill="url(#pgNet)" {...ink(2.2)} />
        {chen.map(([x, y], k) => <circle key={k} cx={n1(x)} cy={n1(y)} r={2.1} fill={C.ink} />)}
      </g>
    </g>
  );
};

// ---------------- choker ----------------
export const Choker: React.FC<{ dangle: number }> = ({ dangle }) => {
  const pearls: [number, number][] = [];
  for (let k = 0; k < 8; k++) {
    const t = k / 7;
    const x = lerp(-18, 50, t);
    const y = -254 + Math.sin(t * Math.PI) * 8 - t * 6;
    pearls.push([x, y]);
  }
  return (
    <g>
      <g transform={`translate(34 -246) rotate(${n1(dangle)})`}>
        <path d="M0,0 L-6,12 L0,26 L6,12 Z" fill={C.hotPink} {...ink(2.4)} />
        <circle cx={0} cy={31} r={5} fill={C.pearl} {...ink(2.2)} />
      </g>
      {pearls.map(([x, y], k) => (
        <g key={k}>
          <circle cx={n1(x)} cy={n1(y)} r={6.2} fill={C.pearl} {...ink(2.4)} />
          <circle cx={n1(x + 1.8)} cy={n1(y - 1.8)} r={1.8} fill={C.white} />
        </g>
      ))}
    </g>
  );
};
