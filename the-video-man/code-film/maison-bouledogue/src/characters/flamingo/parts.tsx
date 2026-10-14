/** FLAMINGO drawing parts. All colors from C.*; no hex literals. */
import React from 'react';
import { C, ink } from '../../lib/style';
import { rand } from '../../lib/rng';
import { DIM, rot, type LegSolve, type V2 } from './rig';

export const f1 = (n: number) => (Math.round(n * 1000) / 1000).toString();
export const tr = (x: number, y: number, a = 0) => `translate(${f1(x)},${f1(y)})${a ? ` rotate(${f1(a)})` : ''}`;

/** Shift an absolute path made of M/L/C/Q/Z commands. */
export const shift = (d: string, dx: number, dy: number) => {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (m) => f1(parseFloat(m) + (i++ % 2 === 0 ? dx : dy)));
};
/** Tapered capsule along local +y, half-widths a (top) b (bottom). */
export const capsule = (len: number, a: number, b: number) =>
  `M ${f1(-a)},0 L ${f1(-b)},${f1(len)} A ${f1(b)},${f1(b)} 0 0 0 ${f1(b)},${f1(len)} L ${f1(a)},0 A ${f1(a)},${f1(a)} 0 0 0 ${f1(-a)},0 Z`;
const circ = (x: number, y: number, r: number) =>
  `M ${f1(x - r)},${f1(y)} a ${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0 a ${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0 `;
export const star = (x: number, y: number, r: number) =>
  `M ${f1(x)},${f1(y - r)} Q ${f1(x)},${f1(y)} ${f1(x + r)},${f1(y)} Q ${f1(x)},${f1(y)} ${f1(x)},${f1(y + r)} Q ${f1(x)},${f1(y)} ${f1(x - r)},${f1(y)} Q ${f1(x)},${f1(y)} ${f1(x)},${f1(y - r)} Z `;
/** Smooth open path through points (Catmull-Rom -> cubic). */
export const smooth = (pts: V2[]) => {
  let d = `M ${f1(pts[0].x)},${f1(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${f1(p1.x + (p2.x - p0.x) / 6)},${f1(p1.y + (p2.y - p0.y) / 6)} ${f1(p2.x - (p3.x - p1.x) / 6)},${f1(p2.y - (p3.y - p1.y) / 6)} ${f1(p2.x)},${f1(p2.y)}`;
  }
  return d;
};
/** Scalloped fluffy blob (feather puff). */
export const fluff = (x: number, y: number, r: number, lobes: number, rotDeg: number) => {
  let d = '';
  const n = lobes;
  for (let j = 0; j <= n; j++) {
    const a0 = ((j / n) * 360 + rotDeg) * (Math.PI / 180);
    const am = (((j + 0.5) / n) * 360 + rotDeg) * (Math.PI / 180);
    const ix = x + Math.cos(a0) * r * 0.82, iy = y + Math.sin(a0) * r * 0.82;
    if (j === 0) { d += `M ${f1(ix)},${f1(iy)} `; continue; }
    const pa = (((j - 0.5) / n) * 360 + rotDeg) * (Math.PI / 180);
    d += `Q ${f1(x + Math.cos(pa) * r * 1.22)},${f1(y + Math.sin(pa) * r * 1.22)} ${f1(ix)},${f1(iy)} `;
    void am;
  }
  return d + 'Z';
};

// ======================================================================= LEGS & SHOES
const H0 = DIM.H0;
const FOOT = `M -10,-4 C 2,-12 16,-6 21,18 C 28,56 42,106 58,132 C 72,134 90,134 104,138 Q 114,142 108,148 L 60,150 C 42,132 20,84 8,44 C 3,28 -12,18 -10,-4 Z`;
const INSOLE = `M -12,12 C 6,22 16,58 28,94 C 38,122 46,142 58,150 L 114,150`;
const PLATFORM = `M 52,150 L 114,150 Q 124,150 122,162 L 118,182 Q 116,${H0} 106,${H0} L 62,${H0} Q 54,${H0} 54,182 Z`;
const PLAT_BAND = `M 54,153 L 118,153 Q 122,154 121,160 L 55,160 Z`;
const CAGE = [
  'M -14,-8 C -6,-20 12,-18 18,-6',                  // ankle strap
  'M -13,4 C -18,-16 20,-22 26,4',                    // heel cup
  'M 26,6 C 40,40 52,96 74,126 C 90,126 106,128 118,140', // cage outline over the instep
  'M 8,40 C 20,30 30,26 34,30',
  'M 16,70 C 28,60 40,56 44,62',
  'M 26,100 C 38,90 50,88 56,94',
  'M 40,128 C 50,116 62,114 70,122',
  'M 60,148 C 66,134 80,128 90,130',
  'M 86,150 C 92,138 104,134 112,140',
].join(' ');
const STUDS = [66, 80, 94, 108].map((x) => circ(x, 172, 3.4)).join('');

export const Shoe: React.FC<{ h: number; near: boolean; sil?: boolean; shiver?: number }> = ({ h, near, sil, shiver = 0 }) => {
  const E = h - H0;
  const tele = E > 0.5;
  const sec = 3;
  const rods: string[] = [], cols: string[] = [], plat: string[] = [], pcols: string[] = [];
  if (tele) {
    for (let i = 0; i < sec; i++) {
      const y0 = H0 - 6 + (i * E) / sec, y1 = H0 + ((i + 1) * E) / sec;
      const hw = 3.6 - 0.8 * i, sx = shiver * (i + 1) * 0.6;
      rods.push(`M ${f1(sx - hw)},${f1(y0)} L ${f1(sx + hw)},${f1(y0)} L ${f1(sx + hw)},${f1(y1)} L ${f1(sx - hw)},${f1(y1)} Z`);
      cols.push(`M ${f1(sx - hw - 3)},${f1(y0 - 1)} L ${f1(sx + hw + 3)},${f1(y0 - 1)} L ${f1(sx + hw + 3)},${f1(y0 + 6)} L ${f1(sx - hw - 3)},${f1(y0 + 6)} Z`);
      const pw = 12 - 2.6 * i, px = 86 + sx;
      plat.push(`M ${f1(px - pw)},${f1(y0 - 2)} L ${f1(px + pw)},${f1(y0 - 2)} L ${f1(px + pw)},${f1(y1)} L ${f1(px - pw)},${f1(y1)} Z`);
      pcols.push(`M ${f1(px - pw - 3)},${f1(y0 - 1)} L ${f1(px + pw + 3)},${f1(y0 - 1)} L ${f1(px + pw + 3)},${f1(y0 + 7)} L ${f1(px - pw - 3)},${f1(y0 + 7)} Z`);
    }
  }
  const sxEnd = shiver * sec * 0.6;
  const spike = `M -9,10 L 9,14 L 3.2,${H0 - 6} L -3.2,${H0 - 6} Z`;
  const tip = tele
    ? `M ${f1(sxEnd - 3.5)},${f1(h - 7)} L ${f1(sxEnd + 3.5)},${f1(h - 7)} L ${f1(sxEnd + 3)},${f1(h)} L ${f1(sxEnd - 3)},${f1(h)} Z`
    : `M -3.6,${H0 - 7} L 3.6,${H0 - 7} L 3,${H0} L -3,${H0} Z`;
  const pad = `M ${f1(sxEnd + 64)},${f1(h - 14)} L ${f1(sxEnd + 110)},${f1(h - 14)} Q ${f1(sxEnd + 114)},${f1(h - 14)} ${f1(sxEnd + 113)},${f1(h - 7)} L ${f1(sxEnd + 111)},${f1(h)} L ${f1(sxEnd + 66)},${f1(h)} Q ${f1(sxEnd + 61)},${f1(h)} ${f1(sxEnd + 62)},${f1(h - 7)} Z`;
  if (sil) {
    return (
      <g fill={C.ink}>
        <path d={spike} /><path d={PLATFORM} /><path d={FOOT} />
        {tele && <path d={rods.join(' ') + plat.join(' ') + pad} />}
      </g>
    );
  }
  const legCol = near ? C.flamingo : C.coral;
  return (
    <g>
      {tele && (
        <g>
          <path d={plat.join(' ')} fill={C.gold} {...ink(3)} />
          <path d={pcols.join(' ')} fill={C.goldLight} {...ink(2.5)} />
          <path d={`M ${f1(86 + sxEnd * 0.3)},${H0 + 4} L ${f1(86 + sxEnd)},${f1(h - 16)}`} stroke={C.ink} strokeWidth={6} strokeDasharray="1.5 7" opacity={0.5} />
          <path d={pad} fill={C.gold} {...ink(3)} />
          <path d={rods.join(' ')} fill={C.gold} {...ink(2.5)} />
          <path d={cols.join(' ')} fill={C.goldLight} {...ink(2.2)} />
        </g>
      )}
      <path d={spike} fill={C.gold} {...ink(3)} />
      <path d={`M 4,16 L 1.4,${H0 - 10}`} stroke={near ? C.goldLight : C.gold} strokeWidth={2.2} strokeLinecap="round" />
      <path d={tip} fill={C.ink} />
      <path d={PLATFORM} fill={C.gold} {...ink(3.5)} />
      <path d={PLAT_BAND} fill={near ? C.goldLight : C.gold} />
      <path d={STUDS} fill={C.pearl} {...ink(1.6)} />
      <path d={FOOT} fill={legCol} {...ink(3.5)} />
      <path d="M 4,6 C 12,30 24,76 40,112" stroke={near ? C.blush : C.flamingo} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d={INSOLE} stroke={C.ink} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={INSOLE} stroke={C.gold} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={CAGE} stroke={C.ink} strokeWidth={6.5} fill="none" strokeLinecap="round" />
      <path d={CAGE} stroke={near ? C.goldLight : C.gold} strokeWidth={3} fill="none" strokeLinecap="round" />
      {!near && <path d={PLATFORM} fill="url(#halftone)" />}
    </g>
  );
};

export const Leg: React.FC<{ L: LegSolve; near: boolean; h: number; sil?: boolean; shiver?: number }> = ({ L, near, h, sil, shiver }) => {
  const l1 = DIM.TIB * L.stretch, l2 = DIM.TAR * L.stretch;
  const thin = 1 / Math.sqrt(L.stretch);
  const t1 = capsule(l1, 15 * thin, 6.8 * thin);
  const t2 = capsule(l2, 6.6 * thin, 5.6 * thin);
  const col = near ? C.flamingo : C.coral;
  const shade = near ? C.coral : C.hotPink;
  const hi = near ? C.blush : C.flamingo;
  const shoe = (
    <g transform={tr(L.ankle.x, L.ankle.y, -L.pitch)}>
      <Shoe h={h} near={near} sil={sil} shiver={shiver} />
    </g>
  );
  if (sil) {
    return (
      <g fill={C.ink}>
        <g transform={tr(L.hip.x, L.hip.y, L.a1)}><path d={t1} /></g>
        <g transform={tr(L.knee.x, L.knee.y, L.a2)}><path d={t2} /></g>
        {shoe}
      </g>
    );
  }
  return (
    <g>
      {/* hierarchical: hip -> tibia -> backward knee -> tarsus ; shoe at ankle */}
      <g transform={tr(L.hip.x, L.hip.y, L.a1)}>
        <path d={t1} fill={col} {...ink(4)} />
        <path d={`M ${f1(-8 * thin)},10 L ${f1(-3.4 * thin)},${f1(l1 - 4)}`} stroke={shade} strokeWidth={4 * thin} strokeLinecap="round" />
        <path d={`M ${f1(7 * thin)},14 L ${f1(3 * thin)},${f1(l1 - 8)}`} stroke={hi} strokeWidth={2.2} strokeLinecap="round" />
      </g>
      <g transform={tr(L.knee.x, L.knee.y, L.a2)}>
        <path d={t2} fill={col} {...ink(3.5)} />
        <path d={`M ${f1(-3 * thin)},12 L ${f1(-2.6 * thin)},${f1(l2 - 8)}`} stroke={shade} strokeWidth={2.6 * thin} strokeLinecap="round" />
        <path d={`M ${f1(2.6 * thin)},14 L ${f1(2.2 * thin)},${f1(l2 - 14)}`} stroke={hi} strokeWidth={1.8} strokeLinecap="round" />
      </g>
      {shoe}
      {/* the famous backward knee */}
      <circle cx={L.knee.x} cy={L.knee.y} r={9.5 * thin} fill={col} {...ink(3.5)} />
      <path d={`M ${f1(L.knee.x - 3)},${f1(L.knee.y - 4)} q 3,-3 6,0`} stroke={hi} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
};

// ======================================================================= DRESS
export const BODICE = 'M 30,-118 C 50,-112 66,-96 66,-76 C 66,-60 56,-48 44,-40 L -46,-40 C -60,-56 -62,-88 -42,-106 C -24,-122 6,-124 30,-118 Z';
export const SKIRT = 'M -47,-44 L 46,-44 C 60,-24 78,-2 90,20 Q 80,31 68,24 Q 57,35 45,27 Q 33,37 21,29 Q 9,39 -3,31 Q -15,39 -27,31 Q -39,39 -51,29 Q -63,37 -75,27 Q -88,31 -96,20 C -82,-2 -62,-24 -47,-44 Z';
export const puffPath = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  const N = 40;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = r * (1 + 0.05 * Math.cos(a * 6) - 0.12 * Math.max(0, Math.sin(a)) ** 3); // gathered cuff at bottom
    pts.push(`${f1(cx + Math.cos(a) * rr * 1.06)},${f1(cy + Math.sin(a) * rr * 0.94)}`);
  }
  return `M ${pts.join(' L ')} Z`;
};
export const pleats = (cx: number, cy: number, r: number) => {
  const bx = cx + r * 0.05, by = cy + r * 0.8;
  return [-0.9, -0.45, 0, 0.45, 0.9].map((k) => {
    const tx = cx + k * r * 0.85, ty = cy - r * (0.8 - Math.abs(k) * 0.25);
    return `M ${f1(tx)},${f1(ty)} Q ${f1(cx + k * r * 0.95)},${f1(cy + r * 0.2)} ${f1(bx + k * 6)},${f1(by)}`;
  }).join(' ');
};

type Pt = { x: number; y: number };
const seqCache = new Map<string, Pt[]>();
/** Seeded sequin positions inside an ellipse-ish region. */
export const sequins = (key: string, cx: number, cy: number, rx: number, ry: number, n: number) => {
  const k = `${key}|${cx}|${cy}|${rx}|${ry}|${n}`;
  const hit = seqCache.get(k);
  if (hit) return hit;
  const r = rand(k);
  const pts: Pt[] = [];
  let guard = 0;
  while (pts.length < n && guard++ < 2000) {
    const x = (r() * 2 - 1), y = (r() * 2 - 1);
    if (x * x + y * y > 1) continue;
    const p = { x: cx + x * rx, y: cy + y * ry };
    if (pts.every((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 > 110)) pts.push(p);
  }
  seqCache.set(k, pts);
  return pts;
};

/** A garment piece: blush rim light on front/top, hot-pink body, halftone crescent on the back, sequins + glints. */
export const Piece: React.FC<{
  id: string; d: string; fill: string; rim: string; seq: Pt[]; glint: number; frame2: number; shade?: number; seqCol: string;
  extra?: React.ReactNode;
}> = ({ id, d, fill, rim, seq, glint, frame2, shade = 1, seqCol, extra }) => {
  const dots = seq.map((p) => circ(p.x, p.y, 2.9)).join('');
  const g = rand(`${id}-glint-${frame2}`);
  let gl = '';
  for (let i = 0; i < glint; i++) {
    const p = seq[Math.floor(g() * seq.length)];
    if (p) gl += star(p.x, p.y, 5 + g() * 5);
  }
  return (
    <g>
      <clipPath id={id}><path d={d} /></clipPath>
      <g clipPath={`url(#${id})`}>
        <path d={d} fill={rim} />
        <path d={shift(d, -6, 6)} fill={fill} />
        {extra}
        <path d={dots} fill={seqCol} />
        {shade > 0 && <path d={`${d} ${shift(d, 24, -18)}`} fill="url(#halftone)" fillRule="evenodd" opacity={shade} />}
        <path d={gl} fill={C.white} />
      </g>
      <path d={d} fill="none" {...ink(5)} />
    </g>
  );
};

// ======================================================================= WINGS
const leaf = (len: number, w: number, a: number, ox: number, oy: number, tip: boolean) => {
  const P = (x: number, y: number) => { const r = rot(x, y, a); return `${f1(ox + r.x)},${f1(oy + r.y)}`; };
  if (!tip) return `M ${P(0, 0)} Q ${P(w, len * 0.45)} ${P(0, len)} Q ${P(-w, len * 0.45)} ${P(0, 0)} Z `;
  return `M ${P(-0.46 * w, 0.66 * len)} Q ${P(-0.32 * w, 0.9 * len)} ${P(0, len)} Q ${P(0.32 * w, 0.9 * len)} ${P(0.46 * w, 0.66 * len)} Q ${P(0, 0.62 * len)} ${P(-0.46 * w, 0.66 * len)} Z `;
};

export const Wing: React.FC<{
  W: { sh: V2; a1: number; a2: number; a3: number }; fan: number; near: boolean; sil?: boolean; flutter: number;
}> = ({ W, fan, near, sil, flutter }) => {
  const up = capsule(DIM.WING_UP, 12, 9);
  const fore = capsule(DIM.WING_FORE, 9, 7);
  const lens = [60, 56, 51, 45, 38];
  let feathers = '', tips = '', cov = '';
  lens.forEach((L, j) => {
    const a = -10 + j * (5 + 13 * fan) + flutter * (j - 2) * 0.8;
    feathers += leaf(L, 10, a, 0, -2, false);
    tips += leaf(L, 10, a, 0, -2, true);
  });
  for (let j = 0; j < 4; j++) cov += leaf(26, 8, -30 - j * 10, -4, -40 + j * 12, false); // coverts along the forearm back
  const col = near ? C.flamingo : C.coral;
  if (sil) {
    return (
      <g fill={C.ink} transform={tr(W.sh.x, W.sh.y, W.a1)}>
        <path d={up} />
        <g transform={tr(0, DIM.WING_UP, W.a2 - W.a1)}>
          <path d={fore} />
          <g transform={tr(0, DIM.WING_FORE, W.a3 - W.a2)}><path d={feathers} /></g>
        </g>
      </g>
    );
  }
  return (
    <g transform={tr(W.sh.x, W.sh.y, W.a1)}>
      <path d={up} fill={col} {...ink(4)} />
      <g transform={tr(0, DIM.WING_UP, W.a2 - W.a1)}>
        <path d={fore} fill={col} {...ink(4)} />
        <g transform={tr(0, DIM.WING_FORE, W.a3 - W.a2)}>
          <path d={cov} fill={near ? C.coral : C.hotPink} {...ink(2.5)} />
          <path d={feathers} fill={near ? C.flamingo : C.coral} {...ink(3)} />
          <path d={tips} fill={C.ink} />
          <circle cx={0} cy={0} r={8} fill={col} {...ink(3)} />
        </g>
        <circle cx={0} cy={0} r={8.5} fill={col} {...ink(3)} />
      </g>
    </g>
  );
};

// ======================================================================= HEAD
export type Expr = {
  lid: number; lower: number; eye: number; pupil: number; pupDx: number; browY: number; browTilt: number; browArch: number;
  beak: number; smile: number; sweat: number;
};
export const EXPR: Record<string, Expr> = {
  fierce: { lid: 0.46, lower: 0.1, eye: 1, pupil: 1, pupDx: 1.6, browY: -35, browTilt: 7, browArch: 6, beak: 0, smile: 0, sweat: 0 },
  panic: { lid: 0, lower: 0, eye: 1.32, pupil: 0.5, pupDx: 0, browY: -42, browTilt: -9, browArch: 4, beak: 0.85, smile: -0.6, sweat: 1 },
  relieved: { lid: 1, lower: 0, eye: 1, pupil: 1, pupDx: 0, browY: -37, browTilt: -5, browArch: 5, beak: 0.12, smile: 0.7, sweat: 0 },
  smug: { lid: 0.6, lower: 0.34, eye: 1, pupil: 1, pupDx: -1.4, browY: -39, browTilt: -2, browArch: 9, beak: 0, smile: 1, sweat: 0 },
};
export const EXPRESSIONS = Object.keys(EXPR);

const SKULL = 'M -15,-6 C -22,-30 -4,-48 14,-45 C 30,-43 38,-32 38,-20 C 38,-6 28,3 10,4 C -3,5 -11,2 -15,-6 Z';
const LORE = 'M 24,-36 C 32,-38 38,-32 39,-26 L 39,-12 C 32,-10 26,-14 22,-20 Z';
const BEAK_UP = 'M 34,-32 C 48,-35 62,-31 72,-23 C 81,-15 84,-3 81,9 C 79,15 74,15 73,10 C 72,2 68,-7 60,-10 C 50,-13 42,-13 35,-11 Z';
const BEAK_TIP = 'M 69,-25 C 79,-17 84,-4 81,9 C 79,15 74,15 73,10 C 72,3 70,-4 64,-9 C 67,-14 69,-19 69,-25 Z';
const BEAK_LO = 'M 35,-12 C 46,-12 58,-10 64,-6 C 70,-1 72,5 72,11 C 66,8 58,4 50,2 C 43,0 38,-3 35,-6 Z';
const BEAK_LO_TIP = 'M 64,-6 C 70,-1 72,5 72,11 C 68,9 64,6 60,4 C 63,1 64,-2 64,-6 Z';

export const Head: React.FC<{ e: Expr; blink: boolean; beakOpen: number; sil?: boolean; jitter: number; uid: string }> = ({ e, blink, beakOpen, sil, jitter, uid }) => {
  if (sil) return <g fill={C.ink}><path d={SKULL} /><path d={BEAK_UP} /><path d={BEAK_LO} /></g>;
  const ex = 17, ey = -24, hw = 8.8 * e.eye, hh = 5.6 * e.eye;
  const lid = blink ? 1 : e.lid;
  const almond = `M ${f1(ex - hw)},${ey} Q ${ex},${f1(ey - 2 * hh)} ${f1(ex + hw)},${ey} Q ${ex},${f1(ey + 2 * hh)} ${f1(ex - hw)},${ey} Z`;
  const cU = ey - 2 * hh + 4 * hh * lid;
  const lidD = `M ${f1(ex - hw - 1)},${ey} Q ${ex},${f1(ey - 2 * hh - 2)} ${f1(ex + hw + 1)},${ey} Q ${ex},${f1(cU)} ${f1(ex - hw - 1)},${ey} Z`;
  const cL = ey + 2 * hh - 4 * hh * (blink ? 0 : e.lower) * 0.8;
  const lowD = `M ${f1(ex - hw - 1)},${ey} Q ${ex},${f1(ey + 2 * hh + 2)} ${f1(ex + hw + 1)},${ey} Q ${ex},${f1(cL)} ${f1(ex - hw - 1)},${ey} Z`;
  // lash line follows lid edge: apex at cU/2 + ey/2
  const lx0 = ex - hw, lx1 = ex + hw;
  const lashLine = `M ${f1(lx1)},${ey} Q ${ex},${f1(cU)} ${f1(lx0)},${ey} L ${f1(lx0 - 9)},${f1(ey - 7)}`;
  const edge = (t: number) => { const x = (1 - t) * (1 - t) * lx1 + 2 * t * (1 - t) * ex + t * t * lx0; const y = (1 - t) * (1 - t) * ey + 2 * t * (1 - t) * cU + t * t * ey; return { x, y }; };
  let lashes = '';
  [0.35, 0.55, 0.75, 0.92].forEach((t, i) => {
    const p = edge(t);
    const L = 7 + i * 2.2;
    lashes += `M ${f1(p.x)},${f1(p.y)} Q ${f1(p.x - 2)},${f1(p.y - L)} ${f1(p.x - L * 0.8)},${f1(p.y - L * 1.1)} `;
  });
  const bY = e.browY, bt = e.browTilt;
  const brow = `M ${f1(ex - 11)},${f1(bY - bt * 0.5)} Q ${f1(ex)},${f1(bY - e.browArch)} ${f1(ex + 11)},${f1(bY + bt * 0.5)}`;
  const open = Math.max(beakOpen, e.beak);
  const pr = 2.4 * e.pupil;
  const px = ex + e.pupDx + jitter, py = ey + 0.4;
  return (
    <g>
      <path d={SKULL} fill={C.flamingo} {...ink(4.5)} />
      <path d="M -8,-12 C -10,-26 -2,-38 8,-41" stroke={C.coral} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
      <path d="M 12,-43 C 22,-43 30,-38 34,-31" stroke={C.blush} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={LORE} fill={C.pearl} />
      {/* lower mandible hinged at the gape */}
      <g transform={`rotate(${f1(open * 24)} 36 -10)`}>
        {open > 0.05 && <path d="M 36,-11 C 48,-12 58,-9 64,-6 L 60,2 C 50,0 42,-3 36,-6 Z" fill={C.ink} />}
        <path d={BEAK_LO} fill={C.blush} {...ink(3.5)} />
        <path d={BEAK_LO_TIP} fill={C.ink} />
      </g>
      <path d={BEAK_UP} fill={C.pearl} {...ink(4)} />
      <path d={BEAK_TIP} fill={C.ink} />
      <path d="M 40,-28 C 50,-30 60,-27 66,-22" stroke={C.white} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      {/* gape line / smirk */}
      <path d={`M 34,-11 Q ${f1(30)},${f1(-11 - e.smile * 4)} ${f1(27)},${f1(-13 - e.smile * 6)}`} stroke={C.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      {/* eyeshadow + eye */}
      <path d={`M ${f1(ex - hw - 3)},${ey - 1} Q ${ex},${f1(ey - 2 * hh - 9)} ${f1(ex + hw + 3)},${ey - 1} Q ${ex},${f1(ey - 2 * hh - 1)} ${f1(ex - hw - 3)},${ey - 1} Z`} fill={C.hotPink} />
      <clipPath id={`${uid}-eye`}><path d={almond} /></clipPath>
      <path d={almond} fill={C.white} />
      <g clipPath={`url(#${uid}-eye)`}>
        <circle cx={px} cy={py} r={4.8 * Math.min(1.15, e.eye)} fill={C.goldLight} stroke={C.gold} strokeWidth={1.4} />
        <circle cx={px} cy={py} r={pr} fill={C.ink} />
        <circle cx={px + 1.6} cy={py - 1.8} r={1.2} fill={C.white} />
        <path d={lidD} fill={C.ink} opacity={0.72} />
        <path d={lowD} fill={C.flamingo} />
      </g>
      <path d={lashLine} stroke={C.ink} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={lashes} stroke={C.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <path d={brow} stroke={C.ink} strokeWidth={2.8} fill="none" strokeLinecap="round" />
      <ellipse cx={14} cy={-11} rx={7} ry={3.6} fill={C.hotPink} opacity={0.55} />
      {e.sweat > 0 && <path d="M -4,-40 Q -10,-30 -7,-26 Q -2,-24 -1,-30 Q -1,-35 -4,-40 Z" fill={C.white} {...ink(2)} />}
    </g>
  );
};

// ======================================================================= CHANDELIER
export const TIERS = [
  { cy: -12, rx: 86, ry: 11, n: 7, len: 30, arm: -34 },
  { cy: -52, rx: 58, ry: 8, n: 5, len: 24, arm: -68 },
  { cy: -82, rx: 32, ry: 6, n: 3, len: 18, arm: -94 },
];
export const dropAnchors = () => {
  const out: { x: number; y: number; tier: number; len: number; j: number }[] = [];
  TIERS.forEach((T, ti) => {
    for (let j = 0; j < T.n; j++) {
      const th = Math.PI * (0.1 + (0.8 * j) / (T.n - 1));
      const center = Math.abs(j - (T.n - 1) / 2) < 0.6;
      out.push({ x: Math.cos(th) * T.rx, y: T.cy + Math.sin(th) * T.ry, tier: ti, len: T.len + (center ? 8 : 0) - Math.abs(j - (T.n - 1) / 2) * 1.5, j });
    }
  });
  return out;
};
const ANCH = dropAnchors();

export const Chandelier: React.FC<{ angles: number[]; sil?: boolean; frame: number; flame: number }> = ({ angles, sil, frame, flame }) => {
  const rings = TIERS.map((T) => `M ${-T.rx},${T.cy} Q ${-T.rx},${T.cy + T.ry * 1.3} 0,${T.cy + T.ry} Q ${T.rx},${T.cy + T.ry * 1.3} ${T.rx},${T.cy} Q ${T.rx},${T.cy - T.ry * 1.1} 0,${T.cy - T.ry} Q ${-T.rx},${T.cy - T.ry * 1.1} ${-T.rx},${T.cy}`).join(' ');
  const arms = TIERS.map((T) => {
    const k = T.rx;
    return `M 0,${T.arm} C ${-k * 0.25},${T.arm - 16} ${-k * 0.95},${T.arm - 10} ${-k},${T.cy} M 0,${T.arm} C ${k * 0.25},${T.arm - 16} ${k * 0.95},${T.arm - 10} ${k},${T.cy} M 0,${T.arm} C ${-k * 0.2},${T.arm + 6} ${-k * 0.5},${T.cy} ${-k * 0.45},${T.cy + T.ry * 0.9} M 0,${T.arm} C ${k * 0.2},${T.arm + 6} ${k * 0.5},${T.cy} ${k * 0.45},${T.cy + T.ry * 0.9}`;
  }).join(' ');
  const stem = 'M 0,0 L 0,-112';
  const knobs = [circ(0, -26, 6), circ(0, -62, 7), circ(0, -90, 5.5), circ(0, -108, 6.5)].join('');
  if (sil) return <g fill={C.ink}><path d={rings} fill="none" stroke={C.ink} strokeWidth={9} /><path d={arms + ' ' + stem} fill="none" stroke={C.ink} strokeWidth={8} /></g>;
  // candles at ring ends
  let candles = '', flames = '';
  TIERS.forEach((T, i) => {
    [-1, 1].forEach((s) => {
      const x = s * T.rx, y = T.cy;
      const ch = 16 - i * 3;
      candles += `M ${x - 3.5},${y - 2} L ${x + 3.5},${y - 2} L ${x + 3.5},${y - ch} L ${x - 3.5},${y - ch} Z `;
      const fl = 1 + 0.18 * Math.sin(frame * 1.3 + i * 2 + s) * flame;
      flames += `M ${x},${f1(y - ch - 2)} Q ${x + 4.5},${f1(y - ch - 7 * fl)} ${x},${f1(y - ch - 14 * fl)} Q ${x - 4.5},${f1(y - ch - 7 * fl)} ${x},${f1(y - ch - 2)} Z `;
    });
  });
  // bead swags between neighbouring bottom-tier drops
  const bot = ANCH.filter((a) => a.tier === 0);
  let swag = '';
  for (let i = 0; i < bot.length - 1; i++) {
    const a = bot[i], b = bot[i + 1];
    swag += `M ${f1(a.x)},${f1(a.y + 2)} Q ${f1((a.x + b.x) / 2)},${f1((a.y + b.y) / 2 + 16)} ${f1(b.x)},${f1(b.y + 2)} `;
  }
  const midT = ANCH.filter((a) => a.tier === 1);
  for (let i = 0; i < midT.length - 1; i++) {
    const a = midT[i], b = midT[i + 1];
    swag += `M ${f1(a.x)},${f1(a.y + 2)} Q ${f1((a.x + b.x) / 2)},${f1((a.y + b.y) / 2 + 11)} ${f1(b.x)},${f1(b.y + 2)} `;
  }
  let gl = '';
  const g = rand(`chand-${Math.floor(frame / 2)}`);
  const glintIdx = [Math.floor(g() * ANCH.length), Math.floor(g() * ANCH.length), Math.floor(g() * ANCH.length)];
  return (
    <g>
      <path d={stem} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d={stem} stroke={C.gold} strokeWidth={4.5} strokeLinecap="round" />
      <path d={arms} stroke={C.ink} strokeWidth={7.5} fill="none" strokeLinecap="round" />
      <path d={arms} stroke={C.gold} strokeWidth={3.6} fill="none" strokeLinecap="round" />
      <path d={rings} stroke={C.ink} strokeWidth={8} fill="none" />
      <path d={rings} stroke={C.gold} strokeWidth={4} fill="none" />
      <path d={rings} stroke={C.goldLight} strokeWidth={1.4} fill="none" strokeDasharray="6 10" />
      <path d={knobs} fill={C.goldLight} {...ink(3)} />
      <path d="M 0,-114 L -3.5,-124 L 0,-140 L 3.5,-124 Z" fill={C.white} {...ink(2.5)} />
      <path d={candles} fill={C.white} {...ink(2.2)} />
      <path d={flames} fill={C.goldLight} {...ink(1.8)} />
      <path d={swag} stroke={C.ink} strokeWidth={6} fill="none" strokeDasharray="0.1 6.5" strokeLinecap="round" />
      <path d={swag} stroke={C.white} strokeWidth={3.4} fill="none" strokeDasharray="0.1 6.5" strokeLinecap="round" />
      {ANCH.map((a, i) => {
        const L = a.len;
        const d = `${circ(0, 3.6, 2.8)} M 0,7 L -5.8,${f1(7 + L * 0.34)} L 0,${f1(7 + L)} L 5.8,${f1(7 + L * 0.34)} Z M 0,7 L 0,${f1(7 + L)} M -5.8,${f1(7 + L * 0.34)} L 5.8,${f1(7 + L * 0.34)}`;
        const ang = angles[i] ?? 0;
        if (glintIdx.includes(i)) { const r = rot(0, 7 + L * 0.5, ang); gl += star(a.x + r.x + 3, a.y + r.y - 2, 7); }
        return (
          <g key={i} transform={tr(a.x, a.y, ang)}>
            <path d={d} fill={a.tier === 1 ? C.pearl : C.white} {...ink(2.2)} />
          </g>
        );
      })}
      <path d={gl} fill={C.white} stroke={C.goldLight} strokeWidth={0.8} />
    </g>
  );
};
export const DROP_COUNT = ANCH.length;
export const DROP_TIER = ANCH.map((a) => a.tier);
