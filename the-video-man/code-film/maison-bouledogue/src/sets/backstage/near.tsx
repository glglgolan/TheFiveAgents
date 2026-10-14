import React from 'react';
import { C, S, ink } from '../../lib/style';
import { hash01 } from '../../lib/rng';
import { Cut, GROUND_Y, WALL_BASE, rot, scrapPath, sway } from './common';

const FLOOR_H = 1080 - WALL_BASE + 60;
/** Screen point of a floor location: X = world x at the wall line, d = depth 0 (wall) .. 1 (screen bottom). */
export const floorPt = (X: number, d: number, camX: number) => {
  const p = 0.7 + 0.6 * d;
  const spread = 1 + 0.8 * d;
  return { x: 960 + (X - 960) * spread - camX * p, y: WALL_BASE + d * (1080 - WALL_BASE), s: 0.6 + 0.75 * d };
};

export const Floor: React.FC<{ camX: number }> = ({ camX }) => {
  const seams: React.ReactNode[] = [];
  for (let X = -700; X <= 2700; X += 110) {
    const a = floorPt(X, 0, camX), b = floorPt(X, 1.2, camX);
    seams.push(<line key={X} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.ink} strokeWidth={3} opacity={0.55} />);
    // staggered plank butt-joints
    const dj = 0.15 + hash01('plank', X) * 0.7;
    const j0 = floorPt(X, dj, camX), j1 = floorPt(X + 110, dj, camX);
    seams.push(<line key={'j' + X} x1={j0.x} y1={j0.y} x2={j1.x} y2={j1.y} stroke={C.ink} strokeWidth={2.5} opacity={0.45} />);
    // wood highlight line
    const h0 = floorPt(X + 30, 0.05, camX), h1 = floorPt(X + 30, 1.2, camX);
    seams.push(<line key={'h' + X} x1={h0.x} y1={h0.y} x2={h1.x} y2={h1.y} stroke={C.curtain} strokeWidth={2} opacity={0.5} />);
  }
  return (
    <g>
      <rect x={-600} y={WALL_BASE} width={3120} height={FLOOR_H} fill="url(#bs-floor)" />
      {seams}
      {/* warm pools of light from the mirror bulbs + lamps */}
      <ellipse cx={1020 - camX * 0.85} cy={848} rx={700} ry={90} fill="url(#bs-pool)" opacity={0.85} />
      <ellipse cx={470 - camX * 0.8} cy={880} rx={300} ry={60} fill="url(#bs-pool)" opacity={0.5} />
      <ellipse cx={1460 - camX * 0.8} cy={880} rx={300} ry={60} fill="url(#bs-pool)" opacity={0.5} />
      {/* halftone deepening toward the viewer */}
      <rect x={-600} y={980} width={3120} height={160} fill="url(#halftone)" opacity={0.9} />
      <rect x={-600} y={WALL_BASE} width={3120} height={22} fill="url(#halftone)" />
    </g>
  );
};

// ---------------------------------------------------------------- floor clutter
type Item = { k: 'pin' | 'spool' | 'scrap' | 'button' | 'scissors'; X: number; d: number; a: number; c: number };
const ITEMS: Item[] = [
  { k: 'spool', X: 180, d: 0.18, a: 0, c: 0 }, { k: 'scrap', X: 330, d: 0.3, a: 20, c: 1 },
  { k: 'pin', X: 420, d: 0.15, a: 40, c: 0 }, { k: 'pin', X: 460, d: 0.2, a: -20, c: 0 },
  { k: 'button', X: 560, d: 0.12, a: 0, c: 2 }, { k: 'scrap', X: 1500, d: 0.2, a: -30, c: 0 },
  { k: 'spool', X: 1560, d: 0.32, a: 0, c: 1 }, { k: 'pin', X: 1620, d: 0.12, a: 70, c: 0 },
  { k: 'button', X: 1660, d: 0.25, a: 0, c: 0 }, { k: 'scrap', X: 1720, d: 0.42, a: 50, c: 3 },
  { k: 'pin', X: 900, d: 0.1, a: 10, c: 0 }, { k: 'pin', X: 1180, d: 0.08, a: -60, c: 0 },
  { k: 'button', X: 1060, d: 0.14, a: 0, c: 1 },
  { k: 'scrap', X: 160, d: 0.75, a: -15, c: 2 }, { k: 'spool', X: 300, d: 0.9, a: 0, c: 2 },
  { k: 'pin', X: 520, d: 0.85, a: 30, c: 0 }, { k: 'pin', X: 560, d: 0.92, a: -40, c: 0 },
  { k: 'scissors', X: 780, d: 0.95, a: -20, c: 0 }, { k: 'button', X: 1000, d: 0.88, a: 0, c: 2 },
  { k: 'pin', X: 1120, d: 0.97, a: 80, c: 0 }, { k: 'scrap', X: 1380, d: 0.9, a: 25, c: 0 },
  { k: 'spool', X: 1640, d: 0.8, a: 0, c: 0 }, { k: 'pin', X: 1760, d: 0.7, a: -10, c: 0 },
  { k: 'scrap', X: 1880, d: 0.62, a: -40, c: 1 },
];
const SCRAP_COL = [C.hotPink, C.teal, C.leopard, C.blush];
const SPOOL_COL = [C.hotPink, C.teal, C.mustard];

export const FloorClutter: React.FC<{ frame: number; chaos: number; camX: number }> = ({ frame, chaos, camX }) => (
  <g>
    {ITEMS.map((it, i) => {
      const p = floorPt(it.X, it.d, camX);
      const jig = it.k === 'scrap' ? chaos * 6 * sway('scr' + i, frame, 0.2) : 0;
      let body: React.ReactNode;
      if (it.k === 'pin') body = (
        <g transform={`rotate(${it.a})`}>
          <line x1={-16} y1={0} x2={16} y2={0} stroke={C.pearlShade} strokeWidth={3} strokeLinecap="round" />
          <circle cx={-16} cy={0} r={5} fill={i % 2 ? C.goldLight : C.hotPink} {...ink(1.5)} />
        </g>
      );
      else if (it.k === 'spool') body = (
        <g>
          <ellipse cx={3} cy={4} rx={26} ry={9} fill={C.ink} opacity={0.35} />
          <rect x={-18} y={-34} width={36} height={32} fill={SPOOL_COL[it.c]} {...ink(3)} />
          {[-26, -18, -10].map((y) => <line key={y} x1={-18} y1={y} x2={18} y2={y} stroke={C.ink} strokeWidth={1.5} opacity={0.4} />)}
          <ellipse cx={0} cy={-36} rx={24} ry={7} fill={C.leopard} {...ink(3)} />
          <ellipse cx={0} cy={-2} rx={24} ry={7} fill={C.leopard} {...ink(3)} />
          <ellipse cx={0} cy={-36} rx={5} ry={2} fill={C.ink} />
          <path d="M18 -20 Q46 -10 70 4" fill="none" stroke={SPOOL_COL[it.c]} strokeWidth={2.5} />
        </g>
      );
      else if (it.k === 'scrap') body = (
        <g transform={`rotate(${it.a + jig}) scale(1 0.5)`}>
          <path d={scrapPath(70, 50)} fill={C.ink} opacity={0.3} transform="translate(4 8)" />
          <path d={scrapPath(70, 50)} fill={SCRAP_COL[it.c]} {...ink(3)} />
        </g>
      );
      else if (it.k === 'button') body = (
        <g transform="scale(1 0.55)">
          <circle r={11} fill={SPOOL_COL[it.c]} {...ink(2.5)} />
          <circle cx={-3} cy={0} r={2} fill={C.ink} /><circle cx={3} cy={0} r={2} fill={C.ink} />
        </g>
      );
      else body = (
        <g transform={`rotate(${it.a}) scale(1 0.6)`}>
          <path d="M0 0 L70 -8 L70 -2 Z M0 0 L70 10 L68 16 Z" fill={C.pearlShade} {...ink(2.5)} />
          <circle cx={-14} cy={-10} r={11} fill="none" stroke={C.curtain} strokeWidth={6} />
          <circle cx={-14} cy={12} r={11} fill="none" stroke={C.curtain} strokeWidth={6} />
          <circle cx={0} cy={0} r={3} fill={C.ink} />
        </g>
      );
      return <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>{body}</g>;
    })}
  </g>
);

// ---------------------------------------------------------------- STEPLADDER (character plane, p=1)
export const LADDER_H = 340;
/** Stepladder with its feet on GROUND_Y at x. Top platform (where the mouse stands) = (x, GROUND_Y - LADDER_H). */
export const Stepladder: React.FC<{ x: number; frame?: number; shake?: number }> = ({ x, frame = 0, shake = 0 }) => {
  const g = GROUND_Y, top = g - LADDER_H;
  const wob = shake * sway('ladder', frame, 0.4) * 1.5;
  const steps = [0.25, 0.5, 0.75];
  return (
    <g transform={rot(wob, x, g)}>
      <ellipse cx={x + 20} cy={g + 4} rx={120} ry={14} fill="url(#halftone)" />
      {/* back legs */}
      <path d={`M${x - 30} ${top + 10} L${x + 30} ${g - 14} M${x + 40} ${top + 10} L${x + 96} ${g - 14}`} {...ink(12)} />
      <path d={`M${x - 30} ${top + 10} L${x + 30} ${g - 14} M${x + 40} ${top + 10} L${x + 96} ${g - 14}`} stroke={C.leopard} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
      {/* spreader */}
      <path d={`M${x - 50} ${g - 150} L${x + 60} ${g - 140}`} {...ink(4)} />
      {/* front rails */}
      <Cut d={`M${x - 84} ${g} L${x - 58} ${top} L${x - 42} ${top} L${x - 64} ${g} Z`} fill={C.gold} sw={S.inkThin} sh={5} />
      <Cut d={`M${x + 64} ${g} L${x + 44} ${top} L${x + 60} ${top} L${x + 84} ${g} Z`} fill={C.gold} sw={S.inkThin} sh={5} />
      {steps.map((t) => {
        const y = g - LADDER_H * t;
        const hw = 74 - t * 20;
        return <rect key={t} x={x - hw} y={y - 7} width={hw * 2} height={14} rx={3} fill={C.goldLight} {...ink(S.inkThin)} />;
      })}
      {/* top platform + paint pot */}
      <rect x={x - 64} y={top - 14} width={128} height={18} rx={3} fill={C.goldLight} {...ink(S.ink)} />
      <path d={`M${x - 60} ${top - 14} L${x + 20} ${top - 14}`} stroke={C.white} strokeWidth={3} opacity={0.5} />
      {/* paint drips */}
      <path d={`M${x - 20} ${top + 4} q2 16 4 0 M${x + 10} ${top + 4} q2 24 4 0`} fill={C.hotPink} {...ink(1.5)} />
    </g>
  );
};
