// Screen-space flashbulb pops for punched-in framings: when the set's own starburst sits on a photographer who is
// cropped below frame, re-draw the pop peeking up from the bottom edge so the flash storm still reads.
import React from 'react';
import { C } from '../../lib/style';
import { hash01 } from '../../lib/rng';
import { activeFlashes } from '../../sets/runway/front';

const star = (cx: number, cy: number, R: number, r: number, n: number, a0: number) => {
  let d = '';
  for (let k = 0; k < n * 2; k++) {
    const a = a0 + (k / (n * 2)) * Math.PI * 2;
    const rr = k % 2 ? r : R * (k % 4 === 0 ? 1 : 0.62);
    d += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return d + 'Z';
};

export const FlashPops: React.FC<{ frame: number; flashFrames: number[]; camX: number; camY: number; zoom: number; id: string }> = ({
  frame, flashFrames, camX, camY, zoom, id,
}) => {
  const act = activeFlashes(frame, flashFrames, { camX, camY, zoom }).filter((a) => a.sy > 1010);
  if (!act.length) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.white} stopOpacity="1" />
          <stop offset="0.3" stopColor={C.spot} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.spot} stopOpacity="0" />
        </radialGradient>
      </defs>
      {act.map(({ I, f0, sx }) => {
        const cy = 1045 + hash01('popy', f0) * 30;
        const a0 = hash01('poprot', f0) * Math.PI;
        return (
          <g key={f0}>
            <circle cx={sx} cy={cy} r={340 * I} fill={`url(#${id}g)`} />
            <ellipse cx={sx} cy={cy} rx={820 * I} ry={6} fill={C.white} opacity={0.7 * I} />
            <path d={star(sx, cy, 240 * I, 24, 8, a0)} fill={C.white} opacity={Math.min(1, 1.3 * I)} />
            <path d={star(sx, cy, 120 * I, 16, 6, a0 + 0.4)} fill={C.spot} opacity={I} />
            <circle cx={sx} cy={cy} r={30} fill={C.white} opacity={Math.min(1, 1.5 * I)} />
          </g>
        );
      })}
    </g>
  );
};
