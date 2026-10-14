// Runway set — closing title card: MAISON BOULEDOGUE / Collection Grotesque (screen space overlay).
import React from 'react';
import { C, F } from '../../lib/style';
import { hash01 } from '../../lib/rng';
import { clamp, ease, track, wobble } from '../../lib/motion';
import { PB } from './geom';

const CX = 960, CY = 470;
const burst = (() => {
  const p = new PB();
  const N = 36, R = 1500;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 0.5) / N) * Math.PI * 2;
    p.poly([[0, 0], [Math.cos(a0) * R, Math.sin(a0) * R], [Math.cos(a1) * R, Math.sin(a1) * R]]);
  }
  return p.str();
})();

/**
 * Closing title card. Anticipation (pull back, 0..3) -> SLAM (3..6, squash on impact at from+6)
 * -> overshoot/settle (6..20). Sunburst pops behind at impact, subtitle slides in at from+14,
 * gold shimmer sweep from from+24. Returns null before `from`.
 */
export const FinalTitle: React.FC<{ frame: number; from: number }> = ({ frame, from }) => {
  const t = frame - from;
  if (t < 0) return null;
  const IMPACT = 6;
  // scale: huge & faint -> anticipation pull-back -> slam -> overshoot -> settle
  const slam = track(t, [[0, 2.6], [3, 2.95, ease.out], [IMPACT, 0.9, ease.in]]);
  const settle = t >= IMPACT ? 1 + wobble(t, [[IMPACT, -0.1]], 2.6, 5.5) : slam;
  const s = t < IMPACT ? slam : settle;
  const squash = t >= IMPACT ? wobble(t, [[IMPACT, 0.16]], 3.2, 7) : 0;
  const sx = s * (1 + squash), sy = s * (1 - squash);
  const op = clamp(t / 3);
  const shake = t >= IMPACT && t < IMPACT + 8 ? (hash01('tshake', t) - 0.5) * 18 * (1 - (t - IMPACT) / 8) : 0;
  const burstS = t < IMPACT ? 0 : ease.outBack(clamp((t - IMPACT) / 10), 2.2);
  const scrim = clamp(t / 6) * 0.62;
  const subT = clamp((t - 14) / 10);
  const subX = (1 - ease.outBack(subT, 2)) * 900;
  const ring = t >= IMPACT ? (t - IMPACT) : -1;
  const sweep = ((t - 24) % 60) / 60;
  const sweepX = -1150 + sweep * 2300;
  const ids = 'rwft';
  return (
    <g>
      <defs>
        <radialGradient id={`${ids}scrim`} cx="0.5" cy="0.45" r="0.7">
          <stop offset="0" stopColor={C.ink} stopOpacity="0.35" />
          <stop offset="1" stopColor={C.ink} stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`${ids}gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.goldLight} />
          <stop offset="0.5" stopColor={C.gold} />
          <stop offset="0.52" stopColor={C.mustard} />
          <stop offset="1" stopColor={C.goldLight} />
        </linearGradient>
        <linearGradient id={`${ids}sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.white} stopOpacity="0" />
          <stop offset="0.5" stopColor={C.white} stopOpacity="0.85" />
          <stop offset="1" stopColor={C.white} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${ids}clip`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={F.display} fontSize={150} fontWeight={700} textLength={1560} lengthAdjust="spacingAndGlyphs">MAISON BOULEDOGUE</text>
        </clipPath>
      </defs>
      <rect x={-50} y={-50} width={2020} height={1180} fill={`url(#${ids}scrim)`} opacity={scrim} />
      {/* sunburst */}
      <g transform={`translate(${CX} ${CY}) rotate(${t * 0.35}) scale(${burstS})`}>
        <path d={burst} fill={C.gold} opacity={0.28} />
        <circle r={430} fill="none" stroke={C.goldLight} strokeWidth={4} strokeDasharray="2 22" strokeLinecap="round" opacity={0.7} />
        <circle r={380} fill="none" stroke={C.gold} strokeWidth={2} opacity={0.6} />
      </g>
      {ring >= 0 && ring < 16 && (
        <ellipse cx={CX} cy={CY + 10} rx={200 + ring * 70} ry={60 + ring * 22} fill="none" stroke={C.goldLight}
          strokeWidth={14 * (1 - ring / 16)} opacity={1 - ring / 16} />
      )}
      {/* impact dust puffs */}
      {ring >= 0 && ring < 18 && Array.from({ length: 10 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const u = ease.out(clamp(ring / 18));
        const x = CX + side * (560 + u * (260 + hash01('pd', i) * 260));
        const y = CY + 30 - u * (hash01('pu', i) * 90) + (i % 3) * 18;
        return <circle key={i} cx={x} cy={y} r={(22 + hash01('pr', i) * 26) * (1 - u * 0.6)} fill={C.paper} opacity={0.75 * (1 - u)} />;
      })}
      <g transform={`translate(${CX + shake} ${CY + 55}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})`} opacity={op}>
        {/* gold rules + tagline */}
        <g opacity={clamp((t - 8) / 6)}>
          <text x={0} y={-170} textAnchor="middle" fontFamily={F.sans} fontSize={30} letterSpacing={18} fill={C.goldLight}>PARIS · FASHION WEEK</text>
          <rect x={-780} y={-150} width={1560} height={5} fill={C.gold} />
          <rect x={-780} y={42} width={1560} height={5} fill={C.gold} />
          {[-800, 800].map((x) => <path key={x} d={`M${x} -148 l14 -14 l14 14 l-14 14 Z`} transform={`translate(${x > 0 ? -14 : -14} 0)`} fill={C.goldLight} />)}
        </g>
        {/* paper-cut ink shadow */}
        <text x={12} y={14} textAnchor="middle" fontFamily={F.display} fontSize={150} fontWeight={700} textLength={1560} lengthAdjust="spacingAndGlyphs"
          fill={C.ink} opacity={0.85}>MAISON BOULEDOGUE</text>
        <text x={0} y={0} textAnchor="middle" fontFamily={F.display} fontSize={150} fontWeight={700} textLength={1560} lengthAdjust="spacingAndGlyphs"
          fill={`url(#${ids}gold)`} stroke={C.ink} strokeWidth={9} paintOrder="stroke" strokeLinejoin="round">MAISON BOULEDOGUE</text>
        {t > 24 && (
          <g clipPath={`url(#${ids}clip)`}>
            <rect x={sweepX} y={-160} width={260} height={220} fill={`url(#${ids}sweep)`} transform="skewX(-20)" />
          </g>
        )}
      </g>
      {/* subtitle */}
      <g transform={`translate(${CX + subX} ${CY + 200})`} opacity={subT > 0 ? 1 : 0}>
        <rect x={-380} y={-62} width={760} height={86} rx={6} fill={C.hotPink} stroke={C.ink} strokeWidth={6} transform="rotate(-2)" />
        <text x={6} y={6} textAnchor="middle" fontFamily={F.display} fontStyle="italic" fontSize={66} fill={C.ink} opacity={0.6} transform="rotate(-2)">Collection Grotesque</text>
        <text x={0} y={0} textAnchor="middle" fontFamily={F.display} fontStyle="italic" fontSize={66} fill={C.pearl} transform="rotate(-2)">Collection Grotesque</text>
      </g>
    </g>
  );
};
