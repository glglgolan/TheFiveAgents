// Circular iris inset: Monsieur Bouledogue (offscreen, backstage) reacting to the snap — L07 "Non. Non non non non."
import React from 'react';
import { C, ink } from '../../lib/style';
import { clamp, ease, onTwos, track, wobble } from '../../lib/motion';
import Bulldog from '../../characters/Bulldog';

export const INSET = { open: 857, close: 910, cx: 1596, cy: 262, R: 172 };

export const BulldogInset: React.FC<{ frame: number }> = ({ frame }) => {
  const { open, close, cx, cy, R } = INSET;
  if (frame < open || frame > close + 8) return null;
  const tOpen = clamp((frame - open) / 7), tClose = clamp((frame - close) / 7);
  const r = R * (frame < close ? ease.outBack(tOpen, 1.6) : 1 - ease.in(tClose));
  if (r < 1) return null;
  const g = onTwos(frame);
  // "Non." (862-870): recoil; "non non non non" (886-905): rapid head shakes, on twos
  const recoil = wobble(g, [[862, 9]], 1.6, 4);
  const shaking = g >= 885 && g < 906 ? 1 : 0;
  const shake = shaking * 10 * Math.sin(((g - 885) / 5.3) * Math.PI * 2) * (1 - 0.3 * clamp((g - 885) / 20));
  const lean = track(g, [[open, 6], [864, -4, ease.out], [884, -2], [908, 3]]);
  const expression = g < 882 ? 'horrified' : 'pained';
  const hs = 0.86; // head scale inside the iris
  const uid = 's4inset';
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}><circle cx={cx} cy={cy} r={r} /></clipPath>
        <radialGradient id={`${uid}g`} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor={C.curtain} />
          <stop offset="1" stopColor={C.curtainDark} />
        </radialGradient>
      </defs>
      {/* paper-cut drop shadow */}
      <circle cx={cx + 10} cy={cy + 10} r={r + 12} fill={C.ink} opacity={0.3} />
      <g clipPath={`url(#${uid}c)`}>
        <rect x={cx - R - 20} y={cy - R - 20} width={2 * R + 40} height={2 * R + 40} fill={`url(#${uid}g)`} />
        {/* backstage: hanging garment silhouettes + halftone */}
        {[-150, -60, 40, 130].map((dx, i) => (
          <path key={i} d={`M${cx + dx},${cy - R} L${cx + dx},${cy - R + 30} M${cx + dx - 26},${cy - R + 40} L${cx + dx},${cy - R + 30} L${cx + dx + 26},${cy - R + 40} L${cx + dx + 34},${cy - R + 150} L${cx + dx - 34},${cy - R + 150} Z`}
            fill={C.curtainDark} opacity={0.6} stroke={C.ink} strokeWidth={3} />
        ))}
        <rect x={cx - R - 20} y={cy - R - 20} width={2 * R + 40} height={2 * R + 40} fill="url(#halftone)" opacity={0.6} />
        {/* speed lines behind the head for the shake */}
        <g opacity={0.25 + 0.4 * shaking}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return <path key={i} d={`M${cx + Math.cos(a) * R * 0.62},${cy + 20 + Math.sin(a) * R * 0.62} L${cx + Math.cos(a) * R * 1.2},${cy + 20 + Math.sin(a) * R * 1.2}`} stroke={C.spot} strokeWidth={5} />;
          })}
        </g>
        <g transform={`translate(${cx + 10} ${cy + 136}) rotate(${(-(lean + recoil) + shake).toFixed(2)}) scale(${hs})`}>
          {/* flipped: he looks left, toward the catastrophe on the runway */}
          <Bulldog frame={frame} headOnly flip expression={expression} seed="inset" pose={{ lookX: 0.6, lookY: 0.2 }} />
        </g>
      </g>
      {/* iris ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.gold} strokeWidth={14} />
      <circle cx={cx} cy={cy} r={r + 7} fill="none" {...ink(5)} />
      <circle cx={cx} cy={cy} r={r - 7} fill="none" {...ink(3)} />
    </g>
  );
};
