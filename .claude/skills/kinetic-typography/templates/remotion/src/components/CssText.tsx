// CSS-3D renderer: real perspective, per-letter x/y/z/rotation/scale/blur/opacity, materials via layered shadows.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { evaluateLayer } from '../lib/anim';
import type { Layer, Material } from '../lib/types';

const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
const cache = new Map<string, number>();
export function cssMeasure(l: Layer) {
  const f = `${l.font.italic ? 'italic ' : ''}${l.font.weight ?? 400} ${l.font.size}px "${l.font.family}", serif`;
  return (s: string) => {
    const k = f + '|' + s;
    let w = cache.get(k);
    if (w === undefined) {
      if (ctx) ctx.font = f;
      w = ctx ? ctx.measureText(s).width : s.length * l.font.size * 0.6;
      cache.set(k, w);
    }
    return w;
  };
}

function shade(hex: string, amt: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 'rgba(0,0,0,0.5)';
  const n = parseInt(m[1], 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.max(0, Math.min(255, v + v * amt))));
  return `rgb(${c.join(',')})`;
}

function materialStyle(m: Material | undefined, color: string, size: number, depth: number): React.CSSProperties {
  switch (m) {
    case 'shadow':
      return { color, textShadow: `0 ${size * 0.05}px ${size * 0.16}px rgba(0,0,0,0.28)` };
    case 'extruded': {
      const steps = Math.max(2, Math.round(depth));
      const layers = Array.from({ length: steps }, (_, i) => `0 ${i + 1}px 0 ${shade(color, -0.32 - (i / steps) * 0.25)}`);
      layers.push(`0 ${steps + size * 0.04}px ${size * 0.14}px rgba(0,0,0,0.32)`);
      return { color, textShadow: layers.join(',') };
    }
    case 'glass':
      return {
        color: 'rgba(255,255,255,0.16)',
        WebkitTextStroke: `${Math.max(1, size * 0.01)}px rgba(255,255,255,0.8)`,
        textShadow: `0 0 ${size * 0.07}px rgba(255,255,255,0.4), 0 ${size * 0.05}px ${size * 0.14}px rgba(0,0,0,0.16)`,
      };
    case 'outline':
      return { color: 'transparent', WebkitTextStroke: `${Math.max(1, size * 0.012)}px ${color}` };
    default:
      return { color };
  }
}

export const CssPass: React.FC<{ layers: Layer[]; plane: 'back' | 'front'; time: number; w: number; h: number; perspective: number }> = ({
  layers, plane, time, w, h, perspective,
}) => (
  <AbsoluteFill style={{ perspective, perspectiveOrigin: '50% 45%', pointerEvents: 'none' }}>
    {layers.map((l) => {
      if (l.engine === 'three' || l.type === 'draw') return null;
      const st = evaluateLayer(l, time, w, h, cssMeasure(l));
      if (!st) return null;
      const mat = materialStyle(l.material, l.color || '#2A1E17', l.font.size, l.depth ?? 12);
      return (
        <div
          key={l.id}
          style={{
            position: 'absolute', left: st.ax, top: st.ay, width: 0, height: 0, transformStyle: 'preserve-3d',
            transform: `rotateX(${st.lrx}deg) rotateY(${st.lry}deg) rotateZ(${st.lrz}deg) scale(${st.lscale})`,
            opacity: st.lopacity,
          }}
        >
          {st.units.map((u, i) =>
            u.plane !== plane || !u.char.trim() ? null : (
              <span
                key={i}
                style={{
                  position: 'absolute', left: u.x, top: u.y, whiteSpace: 'pre', lineHeight: 1,
                  fontFamily: `"${l.font.family}", serif`, fontWeight: l.font.weight ?? 400,
                  fontStyle: l.font.italic ? 'italic' : 'normal', fontSize: l.font.size,
                  transform: `translate(-50%,-50%) translate3d(0,0,${u.z}px) rotateX(${u.rx}deg) rotateY(${u.ry}deg) rotateZ(${u.rz}deg) scale(${u.scale})`,
                  opacity: u.opacity, filter: u.blur > 0.05 ? `blur(${u.blur}px)` : undefined,
                  ...mat,
                }}
              >
                {u.char}
              </span>
            ),
          )}
        </div>
      );
    })}
  </AbsoluteFill>
);
