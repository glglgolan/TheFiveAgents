import React from 'react';
import { C, S, F, ink } from '../../lib/style';
import { noise2, hash01 } from '../../lib/rng';
import { Cut, MID_BASE, rot, sway, zigEllipse, scallops } from './common';

type FP = { frame: number; chaos: number };

// ---------------------------------------------------------------- GARMENTS (hook at 0,0; hanger bar y=30)
const Hanger: React.FC<{ w?: number }> = ({ w = 62 }) => (
  <g fill="none">
    <path d="M0 16 L0 4 Q0 -10 10 -10 Q18 -10 18 -2" {...ink(4)} />
    <path d={`M0 16 L${-w} 38 L${w} 38 Z`} fill={C.gold} {...ink(3.5)} />
  </g>
);

const Tag: React.FC<{ x: number; y: number; text: string; a?: number }> = ({ x, y, text, a = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    <line x1={0} y1={-26} x2={0} y2={0} {...ink(2)} />
    <rect x={-40} y={0} width={80} height={30} rx={3} fill={C.pearl} {...ink(2.5)} />
    <text x={0} y={21} textAnchor="middle" fontFamily={F.sans} fontSize={14} fontWeight={700} fill={C.ink} letterSpacing={1}>{text}</text>
  </g>
);

const G: Record<string, React.FC> = {
  puff: () => (
    <g>
      <Cut d="M-150 90 A68 68 0 1 1 -30 60 L-40 140 Z" fill={C.hotPink} />
      <Cut d="M150 90 A68 68 0 1 0 30 60 L40 140 Z" fill={C.hotPink} />
      <path d="M-120 40 q20 30 0 90 M-80 30 q16 40 -4 100 M120 40 q-20 30 0 90 M80 30 q-16 40 4 100" fill="none" {...ink(2.5)} opacity={0.6} />
      <Cut d="M-36 36 L36 36 L26 160 L-26 160 Z" fill={C.coral} />
      <Cut d="M-26 160 L26 160 L110 420 Q0 446 -110 420 Z" fill={C.hotPink} />
      <path d="M40 180 L110 420 Q60 434 40 436 Z" fill="url(#halftone)" />
      <path d="M-30 160 l-18 -16 l0 32 Z M30 160 l18 -16 l0 32 Z" fill={C.blush} {...ink(3)} />
    </g>
  ),
  feather: () => (
    <g>
      <Cut d="M-50 36 L50 36 L84 420 L-84 420 Z" fill={C.coral} />
      <path d={scallops(-92, 92, 420, 7, 34)} fill={C.blush} {...ink(3.5)} />
      <path d={scallops(-86, 86, 380, 6, 30)} fill={C.blush} {...ink(3)} opacity={0.9} />
      <path d="M-50 36 Q-90 70 -60 130 Q-30 90 0 120 Q30 90 60 130 Q90 70 50 36 Z" fill={C.blush} {...ink(3.5)} />
      <path d="M0 120 L0 380" {...ink(2.5)} />
      <path d="M10 36 L84 420 L50 420 Z" fill="url(#halftoneFine)" />
    </g>
  ),
  tutu: () => (
    <g>
      <Cut d="M-44 36 L44 36 L58 120 L-58 120 Z" fill={C.blush} />
      <path d={zigEllipse(0, 150, 180, 50, 30, 0.14)} fill={C.ink} opacity={0.25} transform="translate(6 8)" />
      <path d={zigEllipse(0, 150, 180, 50, 30, 0.14)} fill={C.blush} {...ink(S.ink)} />
      <path d={zigEllipse(0, 138, 140, 36, 24, 0.14, 0.1)} fill={C.pearl} {...ink(3)} />
      <path d={zigEllipse(0, 126, 96, 22, 18, 0.16, 0.3)} fill={C.blush} {...ink(3)} />
      <Tag x={-120} y={192} text="ÉLÉPH. XXL" a={6} />
    </g>
  ),
  cape: () => (
    <g>
      <Cut d="M-24 36 L24 36 L130 380 Q0 410 -130 380 Z" fill={C.leopard} />
      {[[-40, 120], [10, 160], [-70, 250], [40, 240], [-20, 320], [80, 330], [-100, 350], [20, 90], [60, 170], [-60, 190], [0, 250]].map(([x, y], i) => (
        <path key={i} d={`M${x - 10} ${y} q10 -12 20 0 q-4 10 -20 0`} fill="none" stroke={C.giraffeSpot} strokeWidth={6} strokeLinecap="round" />
      ))}
      <path d={zigEllipse(0, 44, 60, 18, 12, 0.4)} fill={C.pearl} {...ink(3)} />
    </g>
  ),
  shoulder: () => (
    <g>
      <Cut d="M-52 60 L52 60 L60 400 L-60 400 Z" fill={C.mustard} />
      <Cut d="M-50 42 L-190 12 L-176 80 L-52 96 Z" fill={C.mustard} />
      <Cut d="M50 42 L190 12 L176 80 L52 96 Z" fill={C.mustard} />
      <path d="M-40 60 L0 180 L40 60 L22 56 L0 130 L-22 56 Z" fill={C.navy} {...ink(3)} />
      {[200, 240, 280, 320, 360].map((y) => (
        <circle key={y} cx={0} cy={y} r={7} fill={C.navy} {...ink(2)} />
      ))}
      <path d="M20 100 L60 400 L30 400 Z" fill="url(#halftone)" />
    </g>
  ),
  tail: () => (
    <g>
      <Cut d="M-46 36 L46 36 L42 200 L66 420 L22 396 L0 210 L-22 396 L-66 420 L-42 200 Z" fill={C.penguinBlack} />
      <path d="M-22 40 L22 40 L0 190 Z" fill={C.white} {...ink(3)} />
      <path d="M-18 56 l18 10 l18 -10 l0 18 l-18 -10 l-18 10 Z" fill={C.curtain} {...ink(2.5)} />
      <circle cx={0} cy={110} r={4} fill={C.ink} />
      <circle cx={0} cy={140} r={4} fill={C.ink} />
    </g>
  ),
  ruff: () => (
    <g>
      <Cut d="M-26 60 L26 60 L72 430 Q0 450 -72 430 Z" fill={C.teal} />
      <path d="M-10 90 L-30 430 M14 90 L30 430" fill="none" stroke={C.tealLight} strokeWidth={6} />
      <path d={zigEllipse(0, 56, 100, 34, 18, 0.35)} fill={C.ink} opacity={0.25} transform="translate(5 7)" />
      <path d={zigEllipse(0, 56, 100, 34, 18, 0.35)} fill={C.pearl} {...ink(S.inkThin)} />
      <path d={zigEllipse(0, 56, 64, 20, 14, 0.35, 0.2)} fill={C.white} {...ink(2.5)} />
    </g>
  ),
  octo: () => (
    <g>
      {[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((k, i) => {
        const x0 = k * 14;
        const d = `M${x0} 120 Q${x0 + k * 30} 200 ${x0 + k * 18 + (i % 2 ? 20 : -20)} 280 T${x0 + k * 26} ${380 + (i % 3) * 20}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" />
            <path d={d} fill="none" stroke={C.tealLight} strokeWidth={17} strokeLinecap="round" />
          </g>
        );
      })}
      <Cut d="M-60 36 L60 36 Q84 90 60 140 L-60 140 Q-84 90 -60 36 Z" fill={C.tealLight} />
      <path d="M-50 70 L50 70 M-56 100 L56 100" fill="none" stroke={C.teal} strokeWidth={8} />
      <Tag x={-50} y={150} text="POULPE" a={5} />
    </g>
  ),
};

const RACKS = [
  { x0: -260, x1: 410, y: 300, items: [['feather', -170], ['cape', -20], ['puff', 140], ['tutu', 310]] },
  { x0: 1620, x1: 2280, y: 290, items: [['ruff', 1720], ['shoulder', 1860], ['octo', 2020], ['tail', 2170]] },
] as const;

export const Racks: React.FC<FP> = ({ frame, chaos }) => (
  <g>
    {RACKS.map((r, ri) => (
      <g key={ri}>
        {/* halftone cast shadow on wall */}
        <rect x={r.x0 + 30} y={r.y + 20} width={r.x1 - r.x0} height={MID_BASE - r.y - 30} fill="url(#halftone)" opacity={0.8} />
        {/* posts */}
        {[r.x0 + 20, r.x1 - 20].map((px) => (
          <g key={px}>
            <rect x={px - 9} y={r.y - 20} width={18} height={MID_BASE - r.y + 10} fill={C.pearlShade} {...ink(S.inkThin)} />
            <path d={`M${px - 60} ${MID_BASE} L${px + 60} ${MID_BASE}`} {...ink(10)} />
            <circle cx={px - 56} cy={MID_BASE + 8} r={9} fill={C.gold} {...ink(3)} />
            <circle cx={px + 56} cy={MID_BASE + 8} r={9} fill={C.gold} {...ink(3)} />
          </g>
        ))}
        {r.items.map(([k, hx], i) => {
          const amp = 0.8 + chaos * 9;
          const a = amp * sway(`hg${ri}${i}`, frame, 0.035) + chaos * 3 * sway(`hgj${ri}${i}`, frame, 0.14);
          const Comp = G[k];
          return (
            <g key={i} transform={`translate(${hx} ${r.y}) rotate(${a})`}>
              <Comp />
              <Hanger />
            </g>
          );
        })}
        <rect x={r.x0} y={r.y - 6} width={r.x1 - r.x0} height={14} rx={7} fill={C.pearlShade} {...ink(S.inkThin)} />
        <circle cx={r.x0} cy={r.y + 1} r={12} fill={C.gold} {...ink(3)} />
        <circle cx={r.x1} cy={r.y + 1} r={12} fill={C.gold} {...ink(3)} />
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------- MIRRORS + VANITY COUNTER
const MIRRORS = [
  { cx: 700, w: 250 }, { cx: 1020, w: 250 }, { cx: 1340, w: 250 },
];
const M_TOP = 330, M_BOT = 640;

const bulbLevel = (key: string, frame: number, chaos: number) => {
  const base = 0.82 + 0.18 * noise2('bulb' + key, frame * (0.04 + chaos * 0.28), 1.3);
  const period = Math.max(2, Math.round(9 - chaos * 6));
  const dip = hash01('bdip', key, Math.floor(frame / period)) < 0.025 + chaos * 0.13;
  return dip ? 0.12 : base;
};

export const Vanity: React.FC<FP> = ({ frame, chaos }) => {
  const bulbs: React.ReactNode[] = [];
  const glows: React.ReactNode[] = [];
  MIRRORS.forEach((m, mi) => {
    const x0 = m.cx - m.w / 2, x1 = m.cx + m.w / 2;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 5; i++) pts.push([x0 + (i * m.w) / 5, M_TOP - 4]);
    for (let j = 1; j <= 6; j++) { pts.push([x0 - 4, M_TOP + (j * (M_BOT - M_TOP)) / 7]); pts.push([x1 + 4, M_TOP + (j * (M_BOT - M_TOP)) / 7]); }
    pts.forEach(([x, y], bi) => {
      const lv = bulbLevel(`${mi}-${bi}`, frame, chaos);
      glows.push(<circle key={`g${mi}-${bi}`} cx={x} cy={y} r={30} fill="url(#bs-bulbglow)" opacity={lv} />);
      bulbs.push(<circle key={`b${mi}-${bi}`} cx={x} cy={y} r={12} fill={lv > 0.5 ? C.goldLight : C.gold} {...ink(2.5)} />);
      if (lv > 0.5) bulbs.push(<circle key={`h${mi}-${bi}`} cx={x - 3} cy={y - 4} r={4} fill={C.white} opacity={0.9 * lv} />);
    });
  });
  const avg = MIRRORS.map((_, mi) => bulbLevel(`${mi}-2`, frame, chaos));
  return (
    <g>
      {/* warm light pool on wall behind mirrors */}
      <ellipse cx={1020} cy={500} rx={760} ry={300} fill="url(#bs-pool)" opacity={0.55} />
      {MIRRORS.map((m, mi) => {
        const x0 = m.cx - m.w / 2;
        return (
          <g key={mi}>
            <rect x={x0 - 26 + 12} y={M_TOP - 26 + 14} width={m.w + 52} height={M_BOT - M_TOP + 52} rx={14} fill="url(#halftone)" />
            <rect x={x0 - 26} y={M_TOP - 26} width={m.w + 52} height={M_BOT - M_TOP + 52} rx={14} fill={C.ink} opacity={0.3} transform="translate(7 9)" />
            <rect x={x0 - 26} y={M_TOP - 26} width={m.w + 52} height={M_BOT - M_TOP + 52} rx={14} fill={mi === 1 ? C.curtainDark : C.navy} {...ink(S.ink)} />
            <rect x={x0 + 8} y={M_TOP + 10} width={m.w - 16} height={M_BOT - M_TOP - 20} rx={6} fill="url(#bs-glass)" {...ink(S.inkThin)} />
            <path d={`M${x0 + 40} ${M_BOT - 10} L${x0 + 150} ${M_TOP + 10} L${x0 + 190} ${M_TOP + 10} L${x0 + 80} ${M_BOT - 10} Z`} fill={C.white} opacity={0.18 + 0.1 * avg[mi]} />
            <path d={`M${x0 + 110} ${M_BOT - 10} L${x0 + 206} ${M_TOP + 60} L${x0 + 218} ${M_TOP + 80} L${x0 + 128} ${M_BOT - 10} Z`} fill={C.white} opacity={0.14} />
          </g>
        );
      })}
      {/* lipstick scrawl on the middle mirror + tucked photos */}
      <text x={1020} y={420} textAnchor="middle" fontFamily={F.display} fontStyle="italic" fontSize={34} fill={C.hotPink} transform="rotate(-8 1020 420)">Couture</text>
      <text x={1024} y={462} textAnchor="middle" fontFamily={F.display} fontStyle="italic" fontSize={34} fill={C.hotPink} transform="rotate(-8 1020 460)">= Douleur</text>
      <path d="M950 478 q70 -26 150 -20" fill="none" stroke={C.hotPink} strokeWidth={4} strokeLinecap="round" transform="rotate(-8 1020 460)" />
      <g transform="translate(588 350) rotate(-10)">
        <rect width={58} height={70} fill={C.paper} {...ink(2.5)} />
        <circle cx={29} cy={30} r={14} fill={C.bulldogFur} {...ink(2)} />
        <path d="M13 62 Q29 44 45 62" fill={C.curtain} {...ink(2)} />
      </g>
      <g transform="translate(1404 560) rotate(8)">
        <rect width={52} height={64} fill={C.paper} {...ink(2.5)} />
        <path d="M26 12 L26 50 M18 50 L34 50" {...ink(3)} />
        <circle cx={26} cy={14} r={8} fill={C.flamingo} {...ink(2)} />
      </g>
      {glows}
      {bulbs}
      <Counter frame={frame} chaos={chaos} />
    </g>
  );
};

const Counter: React.FC<FP> = ({ frame, chaos }) => {
  const puffBob = chaos * 4 * sway('puff', frame, 0.2);
  return (
    <g>
      {/* items on counter top (behind lip) */}
      {/* wig head with towering beehive */}
      <g transform="translate(860 676)">
        <rect x={-14} y={-36} width={28} height={36} fill={C.pearlShade} {...ink(3)} />
        <ellipse cx={0} cy={-70} rx={30} ry={38} fill={C.pearl} {...ink(S.inkThin)} />
        <path d="M-10 -66 q4 -4 8 0 M6 -66 q4 -4 8 0" fill="none" {...ink(2)} />
        <Cut d="M-34 -84 Q-78 -150 -46 -206 Q0 -262 46 -206 Q78 -150 34 -84 Q0 -104 -34 -84 Z" fill={C.mustard} sw={S.inkThin} sh={5} />
        <path d="M-30 -120 Q-40 -180 -6 -222 M22 -110 Q40 -160 14 -206 M-40 -160 Q0 -150 40 -164" fill="none" {...ink(2.5)} opacity={0.6} />
        <circle cx={0} cy={-252} r={10} fill={C.hotPink} {...ink(2.5)} />
      </g>
      {/* perfume bottles */}
      {[[640, C.tealLight, 1], [676, C.blush, 0.8], [1180, C.goldLight, 1.1], [1214, C.coral, 0.75]].map(([x, col, s], i) => (
        <g key={i} transform={`translate(${x} 680) scale(${s})`}>
          <path d="M-18 0 L-18 -34 Q-18 -48 0 -48 Q18 -48 18 -34 L18 0 Z" fill={col as string} {...ink(3)} />
          <rect x={-6} y={-60} width={12} height={12} fill={C.gold} {...ink(2.5)} />
          <path d="M6 -56 Q24 -56 26 -44" fill="none" {...ink(2.5)} />
          <circle cx={28} cy={-38} r={8} fill={C.hotPink} {...ink(2.5)} />
          <path d="M-10 -8 L-10 -36" stroke={C.white} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        </g>
      ))}
      {/* lipsticks, powder puff, tomato pincushion */}
      {[1080, 1096, 1112].map((x, i) => (
        <g key={x}>
          <rect x={x - 6} y={650 + i * 4} width={12} height={30 - i * 4} fill={C.gold} {...ink(2)} />
          <path d={`M${x - 5} ${650 + i * 4} L${x - 5} ${640 + i * 4} L${x + 5} ${634 + i * 4} L${x + 5} ${650 + i * 4} Z`} fill={i === 1 ? C.hotPink : C.curtain} {...ink(2)} />
        </g>
      ))}
      <g transform={`translate(1290 ${668 + puffBob * 0.3}) rotate(${puffBob * 3})`}>
        <ellipse rx={34} ry={16} fill={C.blush} {...ink(3)} />
        <path d="M-10 -14 q10 -12 20 0" fill="none" {...ink(2.5)} />
      </g>
      <g transform="translate(1410 666)">
        <circle r={20} fill={C.curtain} {...ink(3)} />
        <path d="M-6 -20 l6 -8 l6 8" fill={C.teal} {...ink(2)} />
        {[[-10, -6, -30], [4, -12, 10], [12, 2, 40], [-4, 8, -60]].map(([x, y, a], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
            <line x1={0} y1={0} x2={0} y2={-20} stroke={C.pearlShade} strokeWidth={2.5} />
            <circle cy={-20} r={4} fill={i % 2 ? C.goldLight : C.hotPink} {...ink(1.5)} />
          </g>
        ))}
      </g>
      {/* counter */}
      <path d={`M540 700 L1500 700 L1500 ${MID_BASE} L540 ${MID_BASE} Z`} fill={C.ink} opacity={0.3} transform="translate(7 9)" />
      <rect x={540} y={700} width={960} height={MID_BASE - 700} fill={C.curtainDark} {...ink(S.ink)} />
      <rect x={540} y={700} width={960} height={MID_BASE - 700} fill="url(#halftone)" />
      {[620, 860, 1100, 1340].map((x) => (
        <g key={x}>
          <rect x={x} y={722} width={160} height={50} rx={4} fill="none" stroke={C.gold} strokeWidth={3} opacity={0.7} />
          <circle cx={x + 80} cy={747} r={7} fill={C.gold} {...ink(2)} />
        </g>
      ))}
      <rect x={522} y={676} width={996} height={26} rx={6} fill={C.pearl} {...ink(S.ink)} />
      <rect x={530} y={696} width={980} height={5} fill={C.pearlShade} />
    </g>
  );
};

// ---------------------------------------------------------------- DRESS FORM (mid)
export const DressForm: React.FC<FP & { x: number }> = ({ frame, chaos, x }) => {
  const drape = chaos * 5 * sway('drape', frame, 0.12);
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={-8} y={560} width={16} height={MID_BASE - 560} fill={C.gold} {...ink(3)} />
      <path d={`M-70 ${MID_BASE} L0 ${MID_BASE - 40} L70 ${MID_BASE}`} fill="none" {...ink(9)} />
      <Cut d="M-20 330 L20 330 Q64 344 70 380 Q50 440 56 470 Q76 520 64 572 L-64 572 Q-76 520 -56 470 Q-50 440 -70 380 Q-64 344 -20 330 Z" fill={C.pearl} />
      <path d="M8 336 Q60 350 66 384 Q46 440 52 470 Q72 520 60 568 L30 568 Q40 480 8 336 Z" fill={C.pearlShade} />
      <ellipse cx={0} cy={326} rx={20} ry={8} fill={C.gold} {...ink(3)} />
      <rect x={-6} y={300} width={12} height={24} fill={C.gold} {...ink(2.5)} />
      <circle cx={0} cy={296} r={10} fill={C.gold} {...ink(2.5)} />
      {/* half-pinned drape */}
      <g transform={rot(drape, -30, 380)}>
        <Cut d="M-60 380 Q-10 360 30 400 Q60 470 40 560 Q50 640 20 700 L-40 680 Q-20 600 -54 520 Q-80 440 -60 380 Z" fill={C.hotPink} sw={S.inkThin} sh={6} />
        <path d="M-40 420 Q-20 520 -20 660 M0 420 Q20 520 10 680" fill="none" {...ink(2.5)} opacity={0.5} />
      </g>
      {[[-30, 392], [10, 402], [34, 460]].map(([px, py], i) => (
        <g key={i}>
          <line x1={px} y1={py} x2={px + 12} y2={py - 14} stroke={C.pearlShade} strokeWidth={3} />
          <circle cx={px + 12} cy={py - 14} r={5} fill={C.goldLight} {...ink(2)} />
        </g>
      ))}
      {/* tape measure over the shoulders */}
      <path d="M-30 336 Q-50 420 -40 500 M30 336 Q46 420 40 470" fill="none" stroke={C.ink} strokeWidth={17} strokeLinecap="round" />
      <path d="M-30 336 Q-50 420 -40 500 M30 336 Q46 420 40 470" fill="none" stroke={C.mustard} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------- HAT BOXES (mid)
export const HatBoxes: React.FC<FP & { x: number }> = ({ frame, chaos, x }) => {
  const box = (y: number, w: number, h: number, fill: string, deco: 'stripe' | 'dot' | 'none', k: number) => (
    <g key={k}>
      <path d={`M${-w / 2} ${y - h} L${-w / 2} ${y} A${w / 2} ${w * 0.12} 0 0 0 ${w / 2} ${y} L${w / 2} ${y - h} Z`} fill={C.ink} opacity={0.3} transform="translate(6 7)" />
      <path d={`M${-w / 2} ${y - h} L${-w / 2} ${y} A${w / 2} ${w * 0.12} 0 0 0 ${w / 2} ${y} L${w / 2} ${y - h} Z`} fill={fill} {...ink(S.inkThin)} />
      {deco === 'stripe' && [-0.3, 0, 0.3].map((t) => <rect key={t} x={t * w - 8} y={y - h} width={16} height={h + w * 0.1} fill={C.hotPink} opacity={0.9} />)}
      {deco === 'dot' && [-0.3, 0, 0.3].map((t, i) => <circle key={t} cx={t * w} cy={y - h / 2 + (i % 2) * 10} r={7} fill={C.pearl} />)}
      <path d={`M${-w / 2} ${y - h} L${-w / 2} ${y} A${w / 2} ${w * 0.12} 0 0 0 ${w / 2} ${y} L${w / 2} ${y - h}`} fill="none" {...ink(S.inkThin)} />
      <ellipse cx={0} cy={y - h} rx={w / 2 + 6} ry={w * 0.12} fill={fill} {...ink(S.inkThin)} />
    </g>
  );
  const f = chaos * 8 * sway('plume', frame, 0.15) + sway('plume0', frame, 0.03) * 2;
  return (
    <g transform={`translate(${x} ${MID_BASE})`}>
      {box(0, 170, 80, C.pearl, 'stripe', 0)}
      {box(-94, 140, 70, C.teal, 'dot', 1)}
      {box(-178, 110, 60, C.mustard, 'none', 2)}
      {/* absurd hat: a whole ostrich plume fountain */}
      <g transform="translate(0 -250)">
        {[-40, -18, 6, 28].map((a, i) => (
          <g key={i} transform={`rotate(${a + f * (1 + i * 0.2)})`}>
            <path d="M0 0 Q-20 -90 10 -170 Q40 -90 0 0 Z" fill={i % 2 ? C.blush : C.pearl} {...ink(3)} />
            <path d="M0 -10 Q2 -90 10 -160" fill="none" {...ink(2)} />
          </g>
        ))}
        <ellipse cx={0} cy={8} rx={96} ry={16} fill={C.plum} {...ink(S.inkThin)} />
        <path d="M-40 8 Q-40 -34 0 -36 Q40 -34 40 8 Z" fill={C.plum} {...ink(S.inkThin)} />
        <rect x={-40} y={-12} width={80} height={12} fill={C.hotPink} {...ink(2)} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- MID-NEAR: fabric bolts + sewing table
export const FabricBolts: React.FC<{ x: number }> = ({ x }) => {
  const bolts: [number, number, string, number][] = [
    [-60, 330, C.curtain, -8], [0, 380, C.teal, -3], [56, 300, C.leopard, 4], [110, 350, C.blush, 9],
  ];
  const base = 850;
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx={30} cy={base + 6} rx={160} ry={16} fill="url(#halftone)" />
      {bolts.map(([bx, h, col, a], i) => (
        <g key={i} transform={rot(a, bx, base)}>
          <Cut d={`M${bx - 30} ${base} L${bx - 30} ${base - h} Q${bx} ${base - h - 14} ${bx + 30} ${base - h} L${bx + 30} ${base} Z`} fill={col} sw={S.inkThin} sh={6} />
          <path d={`M${bx - 18} ${base - h + 20} L${bx - 18} ${base - 10}`} stroke={C.white} strokeWidth={5} opacity={0.3} strokeLinecap="round" />
          {col === C.leopard && [0.3, 0.5, 0.7].map((t) => <circle key={t} cx={bx + 6} cy={base - h * t} r={6} fill={C.giraffeSpot} />)}
          {col === C.teal && [0.2, 0.4, 0.6, 0.8].map((t) => <line key={t} x1={bx - 30} y1={base - h * t} x2={bx + 30} y2={base - h * t - 8} stroke={C.tealLight} strokeWidth={5} />)}
        </g>
      ))}
      {/* unrolled tongue of fabric onto floor */}
      <path d={`M60 ${base - 20} Q140 ${base + 10} 220 ${base + 30} L260 ${base + 60} L90 ${base + 40} Z`} fill={C.curtain} {...ink(S.inkThin)} />
    </g>
  );
};

export const SewingTable: React.FC<FP & { x: number }> = ({ frame, chaos, x }) => {
  const base = 862;
  const needle = chaos > 0.05 ? Math.abs(Math.sin(frame * (0.9 + chaos * 1.2))) * 10 * Math.min(1, chaos * 2) : 0;
  const wheel = frame * (2 + chaos * 30);
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx={0} cy={base + 4} rx={200} ry={16} fill="url(#halftone)" />
      {/* iron treadle legs */}
      <path d={`M-150 ${base} L-130 ${base - 150} L-110 ${base} M-130 ${base - 150} L-130 ${base - 170}`} fill="none" {...ink(9)} />
      <path d={`M150 ${base} L130 ${base - 150} L110 ${base} M130 ${base - 150} L130 ${base - 170}`} fill="none" {...ink(9)} />
      <circle cx={-130} cy={base - 80} r={34} fill="none" {...ink(6)} />
      <path d={`M-130 ${base - 114} L-130 ${base - 46} M-164 ${base - 80} L-96 ${base - 80}`} {...ink(4)} transform={rot(wheel, -130, base - 80)} />
      <rect x={-110} y={base - 30} width={220} height={12} fill={C.ink} />
      {/* table top */}
      <Cut d={`M-190 ${base - 196} L190 ${base - 196} L190 ${base - 170} L-190 ${base - 170} Z`} fill={C.leopard} />
      {/* fabric on table */}
      <path d={`M-150 ${base - 196} Q-40 ${base - 206} 40 ${base - 196} L60 ${base - 150} Q-40 ${base - 130} -130 ${base - 160} Z`} fill={C.hotPink} {...ink(S.inkThin)} />
      {/* machine */}
      <g transform={`translate(0 ${base - 196})`}>
        <Cut d="M-110 0 L-110 -40 L-100 -120 Q-96 -140 -70 -140 L80 -140 Q104 -140 104 -116 L104 -80 L60 -80 L60 -50 L90 -50 L90 0 Z" fill={C.penguinBlack} sw={S.ink} />
        <path d="M-80 -118 Q-10 -130 60 -118" fill="none" stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
        <text x={-12} y={-94} textAnchor="middle" fontFamily={F.display} fontStyle="italic" fontSize={18} fill={C.gold}>Bouledogue</text>
        <circle cx={-96} cy={-86} r={20} fill={C.pearlShade} {...ink(3)} />
        <path d={`M-96 -106 L-96 -66`} {...ink(3)} transform={rot(wheel * 1.5, -96, -86)} />
        <rect x={70} y={-80 + needle} width={6} height={36} fill={C.pearlShade} {...ink(2)} />
        <rect x={-20} y={-160} width={14} height={20} fill={C.teal} {...ink(2.5)} />
        <path d="M-13 -160 Q30 -190 73 -80" fill="none" stroke={C.teal} strokeWidth={2} />
      </g>
    </g>
  );
};
