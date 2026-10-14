// A lone pair of white-gloved hands rising out of the frozen crowd for a single clap (screen space).
import React from 'react';
import { C, ink } from '../../lib/style';
import { clamp, ease, track, wobble } from '../../lib/motion';

const n1 = (v: number) => Math.round(v * 10) / 10;

const Glove: React.FC<{ side: 1 | -1 }> = ({ side }) => (
  <g transform={`scale(${side} 1)`}>
    {/* cuff */}
    <path d="M-15 34 L15 34 L19 50 L-19 50 Z" fill={C.pearl} {...ink(3)} />
    {/* mitten palm, fingers pointing up, thumb toward the partner */}
    <path d="M-14 36 C-18 18 -18 -8 -12 -30 C-9 -40 3 -40 5 -30 C9 -12 12 6 13 36 Z" fill={C.white} {...ink(3.5)} />
    <path d="M10 8 C22 2 26 -8 22 -14 C18 -18 12 -12 8 -4" fill={C.white} {...ink(3)} />
    <path d="M-6 -12 L-6 12 M1 -14 L1 10" fill="none" stroke={C.pearlShade} strokeWidth={2.5} strokeLinecap="round" />
  </g>
);

/**
 * Hands rise from (x, baseY) to (x, y), part, and CLAP exactly at clapFrame, then hold together in the silence.
 * sleeve colour picks from the palette.
 */
export const Clapper: React.FC<{ frame: number; clapFrame: number; x: number; y: number; baseY: number; s: number; sleeve: string; clip: string }> = ({
  frame, clapFrame, x, y, baseY, s, sleeve, clip,
}) => {
  const t = frame - clapFrame;
  if (t < -7) return null;
  const rise = ease.outBack(clamp((t + 7) / 5), 1.4);
  const yy = baseY + (y - baseY) * rise;
  // separation: rise together-ish, part wide (anticipation), snap shut on the clap, tiny rebound
  const sep = t < 0 ? track(t, [[-7, 22], [-3, 70, ease.out], [-1, 78], [0, 0, ease.in]]) : 5 * Math.max(0, wobble(t, [[0, 1]], 3, 5)) + 1;
  const squash = t >= 0 ? wobble(t, [[0, 0.22]], 3.5, 6) : 0;
  const tilt = t < 0 ? -6 : 0;
  const ring = t >= 0 && t < 9 ? t / 9 : -1;
  return (
    <g>
      <g clipPath={`url(#${clip})`}>
        <g transform={`translate(${n1(x)} ${n1(yy)}) scale(${s})`}>
          {/* sleeves down behind the heads */}
          <path d={`M${n1(-sep - 16)} 46 L${n1(-sep - 34)} 400 L${n1(-sep + 4)} 400 L${n1(-sep + 14)} 46 Z`} fill={sleeve} {...ink(3)} />
          <path d={`M${n1(sep - 14)} 46 L${n1(sep - 4)} 400 L${n1(sep + 34)} 400 L${n1(sep + 16)} 46 Z`} fill={sleeve} {...ink(3)} />
          <g transform={`translate(${n1(-sep - 12)} 0) rotate(${tilt}) scale(${1 - squash} ${1 + squash})`}><Glove side={1} /></g>
          <g transform={`translate(${n1(sep + 12)} 0) rotate(${-tilt}) scale(${1 - squash} ${1 + squash})`}><Glove side={-1} /></g>
        </g>
      </g>
      {ring >= 0 && (
        <g transform={`translate(${n1(x)} ${n1(yy - 6 * s)}) scale(${s})`} opacity={1 - ring}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
            const r0 = 40 + ring * 50, r1 = 58 + ring * 80;
            return <line key={i} x1={n1(Math.cos(a) * r0)} y1={n1(Math.sin(a) * r0)} x2={n1(Math.cos(a) * r1)} y2={n1(Math.sin(a) * r1)}
              stroke={C.spot} strokeWidth={6 * (1 - ring) + 1} strokeLinecap="round" />;
          })}
          <circle r={30 + ring * 60} fill="none" stroke={C.white} strokeWidth={3 * (1 - ring)} />
        </g>
      )}
    </g>
  );
};
