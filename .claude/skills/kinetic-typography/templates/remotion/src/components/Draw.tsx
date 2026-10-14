// Hand-drawn accents: stroke draw-on (pathLength dash trick) + optional "boiling line" wobble at 12 fps,
// the classic hand-animated look — sits on the same back/front planes as the typography.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { evaluateDraw } from '../lib/anim';
import { SHAPES } from '../lib/shapes';
import type { Layer } from '../lib/types';

export const DrawPass: React.FC<{ layers: Layer[]; plane: 'back' | 'front'; time: number; w: number; h: number }> = ({ layers, plane, time, w, h }) => {
  const frame = useCurrentFrame();
  const draws = layers.filter((l) => l.type === 'draw');
  if (!draws.length) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {draws.map((l) => {
        const st = evaluateDraw(l, time, w, h);
        if (!st || st.plane !== plane || st.lopacity <= 0) return null;
        const shape = l.shape ? SHAPES[l.shape] : undefined;
        const paths = l.paths?.length ? l.paths : shape?.paths || [];
        const aspect = l.aspect ?? shape?.aspect ?? 1;
        const size = l.size ?? 300;
        const vbH = 100 * aspect;
        const sw = ((l.stroke_width ?? 6) * 100) / size;
        const boilSeed = Math.floor(frame / 2); // 12 fps boil on a 24 fps timeline
        const fid = `boil-${l.id}`;
        // draw multiple strokes sequentially: stroke i occupies [i/n, (i+1)/n] of the draw progress
        const n = paths.length || 1;
        return (
          <svg key={l.id} width={size} height={size * aspect} viewBox={`0 0 100 ${vbH}`}
            style={{ position: 'absolute', left: st.ax, top: st.ay, overflow: 'visible', opacity: st.lopacity,
              transform: `translate(-50%,-50%) rotate(${st.lrz}deg) scale(${st.lscale})` }}>
            {l.boil ? (
              <defs>
                <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={boilSeed} />
                  <feDisplacementMap in="SourceGraphic" scale={(l.boil * 100) / size} />
                </filter>
              </defs>
            ) : null}
            <g filter={l.boil ? `url(#${fid})` : undefined} fill="none" stroke={l.stroke || '#FFFFFF'}
              strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
              {paths.map((d, i) => {
                const p = Math.max(0, Math.min(1, st.draw * n - i));
                return <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={p > 0 ? 1 : 0} />;
              })}
            </g>
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};
