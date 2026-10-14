import React from 'react';
import { W, H } from './time';

export type Pt = [number, number];

/** sample a polyline into a smooth, evenly spaced point list (Catmull-Rom) */
export const smooth = (pts: Pt[], per = 14): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

const cut = (pts: Pt[], p: number): Pt[] => {
  if (p >= 1) return pts;
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const target = L[L.length - 1] * Math.max(0, p);
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= target) { out.push(pts[i]); continue; }
    const r = (target - L[i - 1]) / (L[i] - L[i - 1] || 1);
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]);
    break;
  }
  return out;
};

const d = (pts: Pt[]) => 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');

/** the red sewing thread: dashed "over/under" stitches, drawn up to `progress`, needle at the tip */
export const Thread: React.FC<{ pts: Pt[]; progress: number; stitches?: boolean; width?: number; needle?: boolean; opacity?: number }> =
  ({ pts, progress, stitches = true, width = 11, needle = true, opacity = 1 }) => {
    if (progress <= 0) return null;
    const seen = cut(pts, progress);
    if (seen.length < 2) return null;
    const a = seen[seen.length - 2], b = seen[seen.length - 1];
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    return (
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity, overflow: 'visible' }}>
        <defs>
          <linearGradient id="thr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e8483a" /><stop offset="0.5" stopColor="#c8281e" /><stop offset="1" stopColor="#8e150f" />
          </linearGradient>
          <filter id="thrSh" x="-5%" y="-50%" width="110%" height="200%">
            <feDropShadow dx="2" dy="5" stdDeviation="2.5" floodColor="#3a0d08" floodOpacity="0.5" />
          </filter>
        </defs>
        <g filter="url(#thrSh)">
          <path d={d(seen)} fill="none" stroke="url(#thr)" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={stitches ? '44 24' : undefined} />
          {needle && progress < 1 && (
            <g transform={`translate(${b[0]} ${b[1]}) rotate(${ang})`}>
              <path d="M0 0 L-200 -9 L-200 9 Z" fill="#aeb4ba" />
              <path d="M0 0 L-200 -2" stroke="#f4f6f8" strokeWidth={3} />
              <ellipse cx={-178} cy={0} rx={14} ry={4.5} fill="#3d4146" />
            </g>
          )}
        </g>
      </svg>
    );
  };
