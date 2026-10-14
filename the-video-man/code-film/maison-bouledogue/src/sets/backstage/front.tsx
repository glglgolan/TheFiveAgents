import React from 'react';
import { C, ink } from '../../lib/style';
import { rot, sway, scallops } from './common';

type FP = { frame: number; chaos: number };

/** Foreground: big, flat, dark "out-of-focus" shapes. Drawn in the front-layer space (parallax P.front). */
export const FrontLayer: React.FC<FP> = ({ frame, chaos }) => {
  const sw = (k: string, base = 1, hard = 6) => base * sway(k, frame, 0.03) + chaos * hard * sway(k + 'f', frame, 0.1);
  const topGarments: [number, number, string, number][] = [
    // x, hem y, fill, width
    [-260, 190, C.plum, 150], [-90, 250, C.ink, 190], [110, 170, C.curtainDark, 160], [300, 120, C.navy, 150],
    [1650, 140, C.navy, 170], [1850, 230, C.plum, 200], [2060, 180, C.ink, 170], [2240, 260, C.curtainDark, 190],
  ];
  return (
    <g>
      {/* top rail + hanging garment hems */}
      <rect x={-400} y={-30} width={900} height={22} fill={C.ink} />
      <rect x={1560} y={-30} width={900} height={22} fill={C.ink} />
      {topGarments.map(([x, hem, fill, w], i) => {
        const a = sw('fg' + i, 1, 5);
        const half = w / 2;
        return (
          <g key={i} transform={rot(a, x, -20)}>
            <path d={`M${x - half * 0.6} -40 L${x - half} ${hem} Q${x} ${hem + 40} ${x + half} ${hem} L${x + half * 0.6} -40 Z`} fill={fill} {...ink(8)} />
            {i % 3 === 0 && <path d={scallops(x - half, x + half, hem + 10, 5, 34)} fill={fill} {...ink(8)} />}
            <path d={`M${x + half * 0.5} -40 L${x + half * 0.85} ${hem - 6}`} stroke={C.plum} strokeWidth={6} opacity={0.6} strokeLinecap="round" />
          </g>
        );
      })}

      {/* left: towering dress-form silhouette */}
      <g transform={`translate(-110 40) ${rot(sw('fform', 0.3, 1.2), 90, 1080)}`}>
        <path d="M60 1100 L60 900 M-40 1100 L60 1010 L160 1100" fill="none" stroke={C.ink} strokeWidth={34} strokeLinecap="round" />
        <path d="M20 360 L110 360 Q230 390 250 470 Q200 590 215 650 Q270 760 235 900 L-120 900 Q-150 760 -100 650 Q-80 590 -130 470 Q-100 390 20 360 Z" fill={C.ink} />
        <path d="M110 360 Q230 390 250 470 Q200 590 215 650 Q270 760 235 900" fill="none" stroke={C.plum} strokeWidth={10} strokeLinecap="round" />
        <rect x={40} y={300} width={50} height={64} fill={C.ink} />
        <circle cx={65} cy={290} r={30} fill={C.ink} />
        {/* pincushion & sagging tape */}
        <path d="M-60 370 Q-10 520 140 560 Q210 540 240 480" fill="none" stroke={C.curtainDark} strokeWidth={26} strokeLinecap="round" />
        <path d="M-60 370 Q-10 520 140 560 Q210 540 240 480" fill="none" stroke={C.ink} strokeWidth={16} strokeDasharray="3 12" opacity={0.6} />
      </g>

      {/* right: clothes-rail post + half-seen coat */}
      <rect x={1850} y={-60} width={40} height={1200} fill={C.ink} />
      <rect x={1882} y={-60} width={6} height={1200} fill={C.plum} opacity={0.7} />
      <g transform={`translate(60 0) ${rot(sw('fcoat', 0.8, 4), 1960, 60)}`}>
        <path d="M1880 60 L2040 60 Q2130 140 2120 260 L2180 820 L1880 860 Q1900 500 1860 260 Q1850 140 1880 60 Z" fill={C.curtainDark} {...ink(8)} />
        <path d="M1880 60 Q1960 180 1930 860" fill="none" stroke={C.ink} strokeWidth={10} opacity={0.5} />
        <path d="M1870 250 Q1860 500 1882 840" fill="none" stroke={C.curtain} strokeWidth={8} opacity={0.5} strokeLinecap="round" />
        {[380, 470, 560].map((y) => <circle key={y} cx={1950} cy={y} r={14} fill={C.ink} />)}
      </g>

      {/* bottom-right: heap of dropped fabric */}
      <g transform="translate(1940 1120) scale(0.9)">
        <path d="M-230 20 Q-220 -70 -120 -90 Q-60 -150 20 -110 Q110 -160 170 -80 Q240 -60 250 20 Z" fill={C.curtainDark} {...ink(8)} />
        <path d="M-120 -90 Q-90 -30 -110 20 M20 -110 Q0 -40 30 20 M170 -80 Q130 -30 150 20" fill="none" stroke={C.ink} strokeWidth={10} opacity={0.6} strokeLinecap="round" />
        <path d="M-200 -30 Q-150 -80 -110 -84" fill="none" stroke={C.curtain} strokeWidth={8} opacity={0.6} strokeLinecap="round" />
      </g>
      {/* bottom-left: scissors silhouette */}
      <g transform="translate(210 1060) rotate(-12)">
        <path d="M0 0 L260 -30 L260 -10 Z M0 0 L250 30 L244 48 Z" fill={C.ink} />
        <circle cx={-50} cy={-30} r={44} fill="none" stroke={C.ink} strokeWidth={24} />
        <circle cx={-50} cy={40} r={44} fill="none" stroke={C.curtainDark} strokeWidth={24} />
      </g>
    </g>
  );
};
