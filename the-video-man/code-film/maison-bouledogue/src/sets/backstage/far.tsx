import React from 'react';
import { C, S, F, ink } from '../../lib/style';
import { wobble } from '../../lib/motion';
import { noise2 } from '../../lib/rng';
import { Cut, WALL_BASE, rot, sway, zigEllipse } from './common';

type FP = { frame: number; chaos: number };

// ---------------------------------------------------------------- WALL
export const Wall: React.FC = () => {
  const stripes: React.ReactNode[] = [];
  for (let x = -460; x < 2400; x += 128) {
    stripes.push(<rect key={x} x={x} y={-300} width={52} height={920} fill={C.navy} opacity={0.32} />);
  }
  const panels: React.ReactNode[] = [];
  for (let x = -440; x < 2400; x += 250) {
    panels.push(
      <g key={x}>
        <rect x={x} y={636} width={200} height={96} rx={6} fill={C.plum} opacity={0.55} />
        <rect x={x} y={636} width={200} height={96} rx={6} fill="none" stroke={C.gold} strokeWidth={3} opacity={0.45} />
      </g>,
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id="bs-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.navy} />
          <stop offset="0.55" stopColor={C.plum} />
          <stop offset="1" stopColor={C.plum} />
        </linearGradient>
      </defs>
      <rect x={-500} y={-400} width={2920} height={1100} fill="url(#bs-wall)" />
      {stripes}
      {/* frieze of repeating fans (Saul-Bass wallpaper motif) */}
      <g opacity={0.22}>
        {Array.from({ length: 24 }, (_, i) => {
          const x = -440 + i * 128 + 26;
          return <path key={i} d={`M${x - 40} 60 A40 40 0 0 1 ${x + 40} 60 Z`} fill={C.gold} />;
        })}
      </g>
      <rect x={-500} y={60} width={2920} height={8} fill={C.gold} opacity={0.35} />
      {/* wainscot */}
      <rect x={-500} y={612} width={2920} height={WALL_BASE - 612} fill={C.navy} />
      {panels}
      <rect x={-500} y={604} width={2920} height={16} fill={C.gold} {...ink(S.inkThin)} />
      <rect x={-500} y={WALL_BASE - 26} width={2920} height={30} fill={C.ink} />
      {/* halftone darkening at top of wall */}
      <rect x={-500} y={-400} width={2920} height={560} fill="url(#halftone)" opacity={0.7} />
    </g>
  );
};

// ---------------------------------------------------------------- SKETCHES
/** Grotesque fashion doodles, drawn inside a 130x170 sheet. */
const doodles: ((k: string) => React.ReactNode)[] = [
  // 0 elephant in tutu
  (k) => (
    <g key={k} fill="none" {...ink(2.5)}>
      <ellipse cx={65} cy={50} rx={20} ry={18} fill={C.pearlShade} />
      <ellipse cx={42} cy={50} rx={14} ry={20} fill={C.pearlShade} />
      <ellipse cx={88} cy={50} rx={14} ry={20} fill={C.pearlShade} />
      <path d="M65 62 q6 22 -8 28" />
      <path d="M52 70 L78 70 L82 100 L48 100 Z" fill={C.pearlShade} />
      <path d={zigEllipse(65, 104, 50, 12, 11, 0.45)} fill={C.blush} />
      <path d="M55 112 l-2 34 M75 112 l2 34" strokeWidth={6} />
    </g>
  ),
  // 1 giraffe with ruff
  (k) => (
    <g key={k} fill="none" {...ink(2.5)}>
      <path d="M62 150 L62 60 Q62 34 76 26" strokeWidth={5} />
      <ellipse cx={82} cy={24} rx={12} ry={7} fill={C.giraffe} />
      <path d="M78 16 l-2 -8 M86 16 l2 -8" />
      <path d={zigEllipse(62, 70, 34, 12, 12, 0.5)} fill={C.pearl} />
      <path d={zigEllipse(62, 96, 28, 10, 10, 0.5)} fill={C.pearl} />
      <path d="M44 150 L62 108 L80 150 Z" fill={C.mustard} />
    </g>
  ),
  // 2 snail in opera cape
  (k) => (
    <g key={k} fill="none" {...ink(2.5)}>
      <path d="M22 130 Q60 138 104 130 Q110 118 96 116" />
      <circle cx={70} cy={96} r={30} fill={C.leopard} />
      <path d="M70 96 m-6 0 a6 6 0 1 1 12 0 a12 12 0 1 1 -24 0 a18 18 0 1 1 36 0" />
      <path d="M30 70 L50 40 L110 60 L92 132 L34 128 Z" fill={C.hotPink} opacity={0.85} />
      <path d="M26 120 l-6 -30 M34 118 l2 -30" />
      <circle cx={20} cy={88} r={3} fill={C.ink} />
    </g>
  ),
  // 3 hippo in towering hat
  (k) => (
    <g key={k} fill="none" {...ink(2.5)}>
      <ellipse cx={65} cy={112} rx={40} ry={32} fill={C.mouseFur} />
      <ellipse cx={65} cy={128} rx={24} ry={12} fill={C.blush} />
      <ellipse cx={65} cy={78} rx={56} ry={9} fill={C.teal} />
      <rect x={45} y={30} width={40} height={48} fill={C.teal} />
      <path d="M85 32 Q110 0 96 -14" strokeWidth={4} />
      <path d="M85 40 Q124 14 118 -2" strokeWidth={3} />
    </g>
  ),
  // 4 fish in mermaid gown (irony)
  (k) => (
    <g key={k} fill="none" {...ink(2.5)}>
      <path d="M50 20 Q80 10 86 34 Q80 56 50 48 L40 60 L40 10 Z" fill={C.tealLight} />
      <circle cx={74} cy={30} r={3} fill={C.ink} />
      <path d="M56 50 Q72 90 56 130 Q76 140 96 160 L24 160 Q44 140 60 130" fill={C.coral} />
      <path d="M40 84 q30 -10 40 0" />
    </g>
  ),
];

const SKETCHES = [
  { x: -120, y: 250, r: -6, d: 1 }, { x: 60, y: 190, r: 4, d: 0 }, { x: 230, y: 300, r: -3, d: 3 },
  { x: 1420, y: 330, r: 5, d: 2 }, { x: 1800, y: 190, r: -4, d: 4 }, { x: 1980, y: 330, r: 3, d: 0 },
  { x: 2150, y: 220, r: -5, d: 3 }, { x: 780, y: 250, r: -2, d: 4 }, { x: 1080, y: 262, r: 3, d: 2 },
];

export const Sketches: React.FC<FP> = ({ frame, chaos }) => (
  <g>
    {SKETCHES.map((s, i) => {
      const flutter = sway('sk' + i, frame, 0.02) * 1.2 + chaos * sway('skf' + i, frame, 0.22) * 7;
      const curl = 12 + chaos * (10 + 10 * sway('skc' + i, frame, 0.3));
      return (
        <g key={i} transform={`translate(${s.x} ${s.y}) ${rot(s.r + flutter, 65, 0)}`}>
          <rect x={6} y={8} width={130} height={170} fill={C.ink} opacity={0.3} />
          <path d={`M0 0 L130 0 L130 ${170 - curl} L${130 - curl} 170 L0 170 Z`} fill={C.paper} {...ink(S.inkThin)} />
          <path d={`M130 ${170 - curl} L${130 - curl * 1.1} ${170 - curl * 1.1} L${130 - curl} 170 Z`} fill={C.paperDark} {...ink(2)} />
          <g transform="translate(0 6)">{doodles[s.d]('d')}</g>
          <text x={10} y={162} fontFamily={F.sans} fontSize={13} fill={C.ink} opacity={0.7}>{`N°${(i * 7 + 3) % 40}`}</text>
          <circle cx={65} cy={4} r={7} fill={C.hotPink} {...ink(2)} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- SIGN
export const Sign: React.FC<FP> = ({ frame, chaos }) => {
  const a = sway('sign', frame, 0.025) * 0.8 + chaos * sway('signf', frame, 0.12) * 3;
  return (
    <g transform={rot(a, 960, -40)}>
      <path d="M800 -40 L850 88 M1120 -40 L1070 88" {...ink(3)} />
      <Cut d="M740 86 L1180 86 L1168 200 L752 200 Z" fill={C.curtain} sw={S.ink} sh={9} />
      <path d="M760 98 L1160 98 L1150 188 L770 188 Z" fill="none" stroke={C.gold} strokeWidth={4} />
      <text x={960} y={170} textAnchor="middle" fontFamily={F.display} fontSize={78} fontWeight={700} fontStyle="italic" fill={C.paper} letterSpacing={4}>
        SILENCE!
      </text>
      <text x={1130} y={184} textAnchor="end" fontFamily={F.sans} fontSize={18} fill={C.goldLight} letterSpacing={3}>— M.B.</text>
      <circle cx={850} cy={88} r={6} fill={C.gold} {...ink(2)} />
      <circle cx={1070} cy={88} r={6} fill={C.gold} {...ink(2)} />
    </g>
  );
};

// ---------------------------------------------------------------- CLOCK
export const Clock: React.FC<FP & { x?: number; y?: number }> = ({ frame, x = 1640, y = 470 }) => {
  const sec = Math.floor(frame / 24) * 6 + 150; // ticks once per second
  const min = 57 * 6 + frame / 240;
  const hr = 7 * 30 + 57 * 0.5;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return <line key={i} x1={Math.sin(a) * 50} y1={-Math.cos(a) * 50} x2={Math.sin(a) * (i % 3 === 0 ? 38 : 44)} y2={-Math.cos(a) * (i % 3 === 0 ? 38 : 44)} {...ink(i % 3 === 0 ? 4 : 2)} />;
  });
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={7} cy={9} r={70} fill={C.ink} opacity={0.3} />
      <circle r={70} fill={C.gold} {...ink(S.ink)} />
      <circle r={58} fill={C.pearl} {...ink(S.inkThin)} />
      {ticks}
      <text y={26} textAnchor="middle" fontFamily={F.display} fontSize={12} fill={C.ink} letterSpacing={2}>M · B</text>
      <line x1={0} y1={0} x2={0} y2={-28} transform={`rotate(${hr})`} {...ink(6)} />
      <line x1={0} y1={0} x2={0} y2={-44} transform={`rotate(${min})`} {...ink(4)} />
      <line x1={0} y1={8} x2={0} y2={-48} transform={`rotate(${sec})`} stroke={C.curtain} strokeWidth={2.5} strokeLinecap="round" />
      <circle r={5} fill={C.curtain} {...ink(2)} />
      
    </g>
  );
};

// ---------------------------------------------------------------- TAPE MEASURES
const TAPES = [
  { x: 150, len: 330 }, { x: 560, len: 230 }, { x: 1212, len: 250 }, { x: 1560, len: 190 }, { x: 2060, len: 360 },
];
export const TapeMeasures: React.FC<FP> = ({ frame, chaos }) => (
  <g>
    {TAPES.map((t, i) => {
      const n = 9;
      const seg = t.len / n;
      let x = t.x, y = -20;
      let d = `M${x} ${y}`;
      const base = sway('tp' + i, frame, 0.02) * 4 + chaos * sway('tpf' + i, frame, 0.08) * 16;
      for (let j = 1; j <= n; j++) {
        const a = ((base * (0.6 + j * 0.18) + Math.sin(j * 0.9 + i) * 7) * Math.PI) / 180;
        x += Math.sin(a) * seg;
        y += Math.cos(a) * seg;
        d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      return (
        <g key={i}>
          <path d={d} fill="none" stroke={C.ink} strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" />
          <path d={d} fill="none" stroke={C.mustard} strokeWidth={14} strokeLinejoin="round" />
          <path d={d} fill="none" stroke={C.ink} strokeWidth={9} strokeDasharray="2 9" opacity={0.75} />
          <rect x={x - 10} y={y - 2} width={20} height={14} rx={3} fill={C.gold} {...ink(3)} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------- HANGING LAMPS
const LAMPS = [{ x: 470, cord: 150 }, { x: 1460, cord: 110 }, { x: 2060, cord: 170 }];
export const Lamps: React.FC<FP & { lampSwing: [number, number][] }> = ({ frame, chaos, lampSwing }) => (
  <g>
    {LAMPS.map((l, i) => {
      const a = wobble(frame, lampSwing, 0.55 + i * 0.05, 0.7) + sway('lamp' + i, frame, 0.02) * 1.5 + chaos * sway('lampf' + i, frame, 0.06) * 5;
      const flick = 0.85 + 0.15 * noise2('lampfl' + i, frame * (0.05 + chaos * 0.3), 0);
      const top = -40;
      const sy = top + l.cord;
      return (
        <g key={i} transform={rot(a, l.x, top)}>
          <path d={`M${l.x - 60} ${sy + 60} L${l.x - 330} 900 L${l.x + 330} 900 L${l.x + 60} ${sy + 60} Z`} fill="url(#bs-cone)" opacity={0.55 * flick} />
          <line x1={l.x} y1={top} x2={l.x} y2={sy} {...ink(4)} />
          <path d={`M${l.x - 64} ${sy + 62} Q${l.x - 60} ${sy} ${l.x} ${sy} Q${l.x + 60} ${sy} ${l.x + 64} ${sy + 62} Z`} fill={i === 1 ? C.teal : C.curtain} {...ink(S.ink)} />
          <path d={`M${l.x - 64} ${sy + 62} Q${l.x - 60} ${sy} ${l.x} ${sy} L${l.x - 12} ${sy + 62} Z`} fill="url(#halftone)" />
          <ellipse cx={l.x} cy={sy + 64} rx={30} ry={12} fill={C.spot} opacity={flick} {...ink(3)} />
          <rect x={l.x - 9} y={sy - 14} width={18} height={16} fill={C.gold} {...ink(3)} />
        </g>
      );
    })}
  </g>
);
