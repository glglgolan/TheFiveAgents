// Pipette the mouse — drawn sub-parts (mouth visemes, eyes, chains, ladder prop).
import React from 'react';
import { C, ink } from '../../lib/style';
import type { Viseme } from '../../lib/types';
import { wobble } from '../../lib/motion';

export const LW = { main: 3, detail: 2.1, fine: 1.4 };

// ---------- chains ----------
export type Pt = [number, number];
/** Walk a chain: start point, per-segment absolute angles (deg, screen coords: 0 = +x, 90 = down), seg length. */
export const chainPts = (x0: number, y0: number, angles: number[], seg: number): Pt[] => {
  const pts: Pt[] = [[x0, y0]];
  let x = x0, y = y0;
  for (const a of angles) {
    const r = (a * Math.PI) / 180;
    x += Math.cos(r) * seg; y += Math.sin(r) * seg;
    pts.push([x, y]);
  }
  return pts;
};
/** Closed ribbon polygon around a polyline with per-point half widths. Smooth via quadratic midpoints. */
export const ribbonPath = (pts: Pt[], hw: (i: number) => number): string => {
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = hw(i);
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const smooth = (P: Pt[]) => {
    let s = '';
    for (let i = 1; i < P.length - 1; i++) {
      const m: Pt = [(P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2];
      s += ` Q ${P[i][0].toFixed(2)} ${P[i][1].toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`;
    }
    const e = P[P.length - 1];
    return s + ` L ${e[0].toFixed(2)} ${e[1].toFixed(2)}`;
  };
  const Rr = [...R].reverse();
  return `M ${L[0][0].toFixed(2)} ${L[0][1].toFixed(2)}` + smooth(L) + ` L ${Rr[0][0].toFixed(2)} ${Rr[0][1].toFixed(2)}` + smooth(Rr) + ' Z';
};

// ---------- eye ----------
/** Upper-lid cap of an ellipse (rx,ry) covering `amt` (0..1) of its height, as a path. */
const lidPath = (rx: number, ry: number, amt: number) => {
  const yL = -ry + 2 * ry * Math.min(0.999, Math.max(0.001, amt));
  const xL = rx * Math.sqrt(Math.max(0, 1 - (yL / ry) ** 2));
  const large = yL > 0 ? 1 : 0;
  return { d: `M ${-xL} ${yL} A ${rx} ${ry} 0 ${large} 1 ${xL} ${yL} Z`, yL, xL };
};

export const Eye: React.FC<{ x: number; y: number; rx: number; ry: number; lid: number; lookX: number; lookY: number;
  pupil: number; wink?: boolean; browRot: number; browY: number; browLen: number; mirrorBrow?: boolean }> =
  ({ x, y, rx, ry, lid, lookX, lookY, pupil, wink, browRot, browY, browLen, mirrorBrow }) => {
    const lp = lidPath(rx, ry, lid);
    const pr = 2.7 * pupil;
    const px = lookX * (rx - pr) * 0.7, py = lookY * (ry - pr) * 0.6;
    const br = mirrorBrow ? -browRot : browRot;
    return (
      <g transform={`translate(${x} ${y})`}>
        {wink ? (
          <path d={`M ${-rx} 0.5 Q 0 ${-ry * 0.9} ${rx} 0.5`} fill="none" {...ink(LW.detail)} />
        ) : (
          <>
            <ellipse rx={rx} ry={ry} fill={C.white} {...ink(LW.fine)} />
            <circle cx={px} cy={py} r={pr} fill={C.ink} />
            <circle cx={px + pr * 0.35} cy={py - pr * 0.4} r={pr * 0.33} fill={C.white} />
            {lid > 0.02 && <path d={lp.d} fill={C.mouseShade} />}
            {lid > 0.02 && <line x1={-lp.xL - 0.6} y1={lp.yL} x2={lp.xL + 0.6} y2={lp.yL} {...ink(LW.detail)} />}
          </>
        )}
        <g transform={`translate(0 ${-ry - 6 + browY}) rotate(${br})`}>
          <line x1={-browLen / 2} y1={0} x2={browLen / 2} y2={0} {...ink(2.4)} />
        </g>
      </g>
    );
  };

// ---------- mouth ----------
/** Mouse mouth centred at (0,0) under the snout. corner: -1 frown..1 smile, smirk: asymmetric. */
export const Mouth: React.FC<{ v: Viseme; corner: number; smirk?: number }> = ({ v, corner, smirk = 0 }) => {
  const cy = -corner * 2.2;
  const teeth = (y: number, h = 4.2) => (
    <g>
      <rect x={-3.4} y={y} width={3.2} height={h} rx={0.8} fill={C.white} {...ink(1.1)} />
      <rect x={0.2} y={y} width={3.2} height={h} rx={0.8} fill={C.white} {...ink(1.1)} />
    </g>
  );
  const open = (rx: number, ry: number, tongue = true, tongueUp = false) => {
    const d = `M ${-rx} ${cy * 0.5} C ${-rx * 0.6} ${-ry * 0.3} ${rx * 0.6} ${-ry * 0.3} ${rx} ${cy * 0.5 - smirk * 1.5}` +
      ` C ${rx * 0.95} ${ry * 1.45} ${-rx * 0.95} ${ry * 1.45} ${-rx} ${cy * 0.5} Z`;
    return (
      <g>
        <path d={d} fill={C.curtainDark} {...ink(LW.detail)} />
        {tongue && !tongueUp && <ellipse cx={0} cy={ry * 0.8} rx={rx * 0.55} ry={ry * 0.32} fill={C.coral} />}
        {tongueUp && <path d={`M ${-rx * 0.45} ${ry * 0.9} Q 0 ${-ry * 0.2} ${rx * 0.45} ${ry * 0.9} Z`} fill={C.coral} />}
        {teeth(-ry * 0.12, Math.min(4.2, ry * 0.75))}
      </g>
    );
  };
  switch (v) {
    case 'A':
      return (
        <g>
          <path d={`M -6 ${cy * 0.4} Q 0 1.2 6 ${cy * 0.4 - smirk * 1.5}`} fill="none" {...ink(2.8)} />
          <path d="M -7.5 -1.5 Q -8.8 0 -7.5 1.5" fill="none" {...ink(1.2)} />
        </g>
      );
    case 'B': return open(6, 3.6, false);
    case 'C': return open(7, 6);
    case 'D': return open(8.5, 9.5);
    case 'E': return (
      <g>
        <path d="M -5.2 0 C -5.2 -5 5.2 -5 5.2 0 C 5.2 7 -5.2 7 -5.2 0 Z" fill={C.curtainDark} {...ink(LW.detail)} />
        <ellipse cx={0} cy={3.2} rx={2.8} ry={1.4} fill={C.coral} />
        {teeth(-2.6, 2.6)}
      </g>
    );
    case 'F': return (
      <g>
        <ellipse cx={1} cy={0.5} rx={3.2} ry={3} fill={C.curtainDark} {...ink(2.4)} />
        <path d="M -3.6 -3.2 Q -5 0.5 -3.6 4" fill="none" {...ink(1.1)} />
      </g>
    );
    case 'G': return (
      <g>
        <path d={`M -6.5 ${cy * 0.4} Q 0 -1.2 6.5 ${cy * 0.4}`} fill="none" {...ink(LW.detail)} />
        {teeth(-0.6, 4.6)}
        <path d="M -5.5 4.4 Q 0 6.8 5.5 4.4" fill="none" {...ink(LW.detail)} />
      </g>
    );
    case 'H': return open(7, 7, false, true);
    case 'X':
    default:
      return (
        <g>
          <path d={`M -6 ${cy * 0.5} Q -1 ${1 + cy * -0.3} 1 0.4 Q 3 ${1 + cy * -0.3} 6 ${cy * 0.5 - smirk * 2.4}`} fill="none" {...ink(LW.detail)} />
          {corner > -0.3 && teeth(0.9, 3.4)}
        </g>
      );
  }
};

// ---------- Ladder prop ----------
/**
 * Wooden stepladder, flat-graphic. Origin at base centre, top platform surface at y = -height.
 * Optional frame+impulses gives a small damped rattle (e.g. on hammer hits).
 */
export const Ladder: React.FC<{ height: number; frame?: number; impulses?: [number, number][]; flip?: boolean }> =
  ({ height, frame = 0, impulses = [], flip }) => {
    const h = height;
    const baseW = Math.max(60, h * 0.42), topW = baseW * 0.62;
    const rattle = wobble(frame, impulses, 6, 9) * 1.2;
    const railW = 9;
    const nSteps = Math.max(2, Math.floor((h - 30) / 42));
    const steps = Array.from({ length: nSteps }, (_, i) => -h + ((i + 1) * (h - 18)) / (nSteps + 0.5));
    const xAt = (y: number, side: -1 | 1) => side * (baseW / 2 + ((topW - baseW) / 2) * (-y / h));
    return (
      <g transform={`${flip ? 'scale(-1 1) ' : ''}rotate(${rattle} 0 0)`}>
        {/* ground shadow */}
        <ellipse cx={-baseW * 0.25} cy={2} rx={baseW * 0.95} ry={6} fill={C.ink} opacity={0.22} />
        {/* back legs (behind, darker) */}
        <path d={`M ${-topW / 2 + 4} ${-h + 6} L ${-baseW / 2 - h * 0.28} 0`} {...ink(railW + 5)} />
        <path d={`M ${-topW / 2 + 4} ${-h + 6} L ${-baseW / 2 - h * 0.28} 0`} stroke={C.bulldogShade} strokeWidth={railW - 1} strokeLinecap="round" />
        <path d={`M ${-topW / 2 + 4 - (baseW / 2 + h * 0.28 - topW / 2 + 4) * 0.55} ${-h * 0.45} L ${xAt(-h * 0.45, -1)} ${-h * 0.45}`} stroke={C.pearlShade} strokeWidth={3} {...{ strokeLinecap: 'round' as const }} />
        {/* front rails */}
        {([-1, 1] as const).map((s) => (
          <g key={s}>
            <line x1={xAt(0, s)} y1={0} x2={xAt(-h, s)} y2={-h} {...ink(railW + 5)} />
            <line x1={xAt(0, s)} y1={0} x2={xAt(-h, s)} y2={-h} stroke={C.leopard} strokeWidth={railW - 1} strokeLinecap="round" />
          </g>
        ))}
        {/* halftone shade on right rail */}
        <line x1={xAt(0, 1)} y1={0} x2={xAt(-h, 1)} y2={-h} stroke="url(#halftone)" strokeWidth={railW - 1} />
        {/* steps */}
        {steps.map((y, i) => (
          <g key={i}>
            <rect x={xAt(y, -1) - 2} y={y - 4} width={xAt(y, 1) - xAt(y, -1) + 4} height={9} rx={2} fill={C.leopard} {...ink(3)} />
            <line x1={xAt(y, -1) + 4} y1={y + 5} x2={xAt(y, 1) - 4} y2={y + 5} stroke={C.bulldogShade} strokeWidth={2} />
          </g>
        ))}
        {/* top platform */}
        <rect x={-topW / 2 - 12} y={-h - 2} width={topW + 24} height={12} rx={3} fill={C.goldLight} {...ink(3.2)} />
        <rect x={-topW / 2 - 10} y={-h + 6} width={topW + 20} height={3} fill={C.bulldogShade} />
      </g>
    );
  };
