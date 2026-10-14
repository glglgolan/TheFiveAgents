import React from 'react';
import { C, S, ink } from '../../lib/style';
import { noise2 } from '../../lib/rng';

/** Floor line (character ground plane) in screen space at camX=0, camY=0, zoom=1. */
export const GROUND_Y = 930;
/** Where the back wall meets the floor. */
export const WALL_BASE = 760;
/** Base line for mid-layer furniture standing on the floor. */
export const MID_BASE = 792;

/** Parallax factors per depth layer (character plane = 1). */
export const P = {
  wall: 0.18,
  far: 0.3,
  lamps: 0.45,
  mid: 0.7,
  midNear: 0.85,
  chars: 1,
  front: 1.55,
};

/**
 * SVG transform for a depth layer with parallax factor p.
 * Zoom is applied about the frame centre, scaled by depth too.
 * Shot animators: wrap characters in <g transform={layerT(1, camX, camY, zoom)}> so they track the floor.
 */
export const layerT = (p: number, camX = 0, camY = 0, zoom = 1) => {
  const z = 1 + (zoom - 1) * p;
  return `translate(960 540) scale(${z}) translate(-960 -540) translate(${-camX * p} ${-camY * p})`;
};

export const rot = (a: number, x = 0, y = 0) => `rotate(${a} ${x} ${y})`;

/** Paper-cut shape: offset ink drop shadow + inked fill. */
export const Cut: React.FC<{ d: string; fill: string; sw?: number; sh?: number; op?: number; stroke?: boolean }> = ({
  d, fill, sw = S.ink, sh = 7, op = 1, stroke = true,
}) => (
  <>
    <path d={d} fill={C.ink} opacity={0.25} transform={`translate(${sh * 0.8} ${sh})`} />
    <path d={d} fill={fill} opacity={op} {...(stroke ? ink(sw) : {})} />
  </>
);

/** Smooth seeded sway in [-1,1] at constant speed (safe with animated amplitudes). */
export const sway = (seed: string, frame: number, speed = 0.03) => noise2(seed, frame * speed, 0.37);

/** Zig-zag ellipse path (tutus, ruffs, pinking-shear edges). */
export const zigEllipse = (cx: number, cy: number, rx: number, ry: number, n: number, depth: number, phase = 0) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + phase;
    const k = i % 2 === 0 ? 1 : 1 - depth;
    const x = cx + Math.cos(a) * rx * k;
    const y = cy + Math.sin(a) * ry * k;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d + 'Z';
};

/** Scalloped edge: a row of bumps from (x0,y) to (x1,y) (feathers / trims). */
export const scallops = (x0: number, x1: number, y: number, n: number, h: number) => {
  const w = (x1 - x0) / n;
  let d = `M${x0} ${y}`;
  for (let i = 0; i < n; i++) d += ` q${w / 2} ${h} ${w} 0`;
  return d;
};

/** Pinked (zigzag) scrap polygon around a centre. */
export const scrapPath = (w: number, h: number, teeth = 7) => {
  let d = `M${-w / 2} ${-h / 2}`;
  const tw = w / teeth;
  for (let i = 0; i < teeth; i++) d += ` l${tw / 2} -6 l${tw / 2} 6`;
  d += ` L${w / 2 - 8} ${h / 2} L${-w / 2 + 10} ${h / 2 - 4} Z`;
  return d;
};
