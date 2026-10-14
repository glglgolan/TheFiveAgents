// Monsieur Bouledogue — head (local coords: origin = neck pivot, facing +x).
import React from 'react';
import { C, S, ink } from '../../lib/style';
import { clamp, lerp } from '../../lib/motion';
import type { Viseme } from '../../lib/types';
import { MOUTH, type Expr } from './rig';

export const EYE_F = { x: 58, y: -114, r: 24 };
export const EYE_B = { x: -30, y: -112, r: 21 };
export const HAT_AT = { x: 14, y: -187 };
const MX = 32; // mouth centre x

const f1 = (n: number) => n.toFixed(1);

/** Circle segment covering the top (dir=1) or bottom (dir=-1) `amt` of a circle. */
const lidPath = (r: number, amt: number, dir: 1 | -1) => {
  const a = clamp(amt, 0, 1);
  if (a <= 0.001) return '';
  const yc = -r + 2 * r * a; // chord y measured from top
  const y = dir === 1 ? yc : -yc;
  const dx = Math.sqrt(Math.max(0, r * r - yc * yc));
  const large = a > 0.5 ? 1 : 0;
  // from left chord point sweeping over top (dir 1) or bottom (dir -1)
  return dir === 1
    ? `M ${f1(-dx)},${f1(y)} A ${r},${r} 0 ${large} 1 ${f1(dx)},${f1(y)} Z`
    : `M ${f1(-dx)},${f1(y)} A ${r},${r} 0 ${large} 0 ${f1(dx)},${f1(y)} Z`;
};

const Eye: React.FC<{ e: typeof EYE_F; ex: Expr; lidT: number; lookX: number; lookY: number; browAng: number; near: boolean; shake: number }> = ({ e, ex, lidT, lookX, lookY, browAng, near, shake }) => {
  const r = e.r * ex.eye;
  const pr = 8.5 * ex.pupil * (near ? 1.05 : 1);
  const px = lookX * r * 0.42 + shake, py = lookY * r * 0.36;
  // lid tilt follows the brow: angry = inner end down
  const tilt = (near ? -1 : 1) * browAng * 0.55;
  return (
    <g transform={`translate(${e.x},${e.y})`}>
      {/* under-eye bag */}
      <path d={`M ${-r * 0.95},${r * 0.35} Q 0,${r * 1.55} ${r * 0.95},${r * 0.35}`} fill={C.bulldogShade} {...ink(S.inkThin)} />
      <circle r={r} fill={C.white} {...ink(S.ink)} />
      <circle cx={px} cy={py} r={pr} fill={C.ink} />
      <circle cx={px + pr * 0.35} cy={py - pr * 0.4} r={Math.max(1.6, pr * 0.3)} fill={C.white} />
      <g transform={`rotate(${tilt})`}>
        {lidT > 0.01 && <path d={lidPath(r + 1.5, lidT, 1)} fill={C.bulldogFur} {...ink(S.ink)} />}
        {ex.lidB > 0.01 && <path d={lidPath(r + 1.5, ex.lidB, -1)} fill={C.bulldogFur} {...ink(S.inkThin)} />}
      </g>
    </g>
  );
};

export interface HeadProps {
  frame: number;
  ex: Expr;
  viseme: Viseme;
  jawExtra: number;
  blink: number;       // 0..1 extra lid closure
  lookX: number; lookY: number;
  jowlX: number; jowlY: number; ear: number;
  plume1: number; plume2: number; plumeX: number; plumeDroop: number; hatTip: number;
  uid: string;
  shake: number;       // pupil tremble px (horrified)
}

/** Mouth parameters shared with the torso overlay. */
export const mouthOpen = (v: Viseme, jawExtra: number, ex?: Expr) =>
  (v === 'X' && ex?.grit ? 9 : MOUTH[v].open) + (jawExtra + (v === 'X' && ex ? ex.jaw : 0)) * 44;

// ---------------- plume ----------------
const PL_LEN = [40, 40, 38, 36, 33, 30, 26, 22, 18];
const PL_REST = [-4, -14, -28, -46, -70, -100, -130, -156, -176];
const catmull = (p: [number, number][], per: number) => {
  const out: [number, number][] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const q = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(p[p.length - 1]);
  return out;
};

export const Plume: React.FC<{ frame: number; l1: number; l2: number; lx: number; droop: number }> = ({ frame, l1, l2, lx, droop }) => {
  const pts: [number, number][] = [[0, 0]];
  let x = 0, y = 0;
  const N = PL_LEN.length;
  for (let i = 0; i < N; i++) {
    const s = (i + 1) / N;
    const a = PL_REST[i] + l1 * (0.35 + 0.65 * s) + l2 * Math.pow(s, 1.6) * 1.3 + lx * 0.45 * s
      + droop * (i + 1) * 24 + Math.sin(frame * 0.21 - i * 0.6) * (1 + s * 2);
    const r = (a * Math.PI) / 180;
    x += Math.sin(r) * PL_LEN[i]; y -= Math.cos(r) * PL_LEN[i];
    pts.push([x, y]);
  }
  const sm = catmull(pts, 4);
  const M = sm.length;
  const L: string[] = [], R: string[] = [], I1: string[] = [], I2: string[] = [];
  let fr = '';
  for (let j = 0; j < M; j++) {
    const a = sm[Math.max(0, j - 1)], b = sm[Math.min(M - 1, j + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;
    const s = j / (M - 1);
    const base = 4 + 30 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.08)), 0.75) * (1 - 0.25 * s);
    const wl = base * 0.7, wr = base * 0.55;
    if (j > 1 && j < M - 1) {
      // drooping fronds: out along the normal, then hanging with gravity
      for (const sd of [1, -1]) {
        const len = base * (sd === 1 ? 1.25 : 1.0) * (0.85 + 0.3 * ((j * 7) % 3) / 2);
        const ox = sm[j][0] + nx * sd * base * 0.4, oy = sm[j][1] + ny * sd * base * 0.4;
        const ex2 = ox + nx * sd * len + tx * len * 0.35, ey2 = oy + ny * sd * len + ty * len * 0.35 + len * 0.55;
        fr += `M ${f1(ox)},${f1(oy)} Q ${f1(ox + nx * sd * len * 0.7)},${f1(oy + ny * sd * len * 0.7)} ${f1(ex2)},${f1(ey2)} `;
      }
    }
    L.push(`${f1(sm[j][0] + nx * wl)},${f1(sm[j][1] + ny * wl)}`);
    R.push(`${f1(sm[j][0] - nx * wr)},${f1(sm[j][1] - ny * wr)}`);
    I1.push(`${f1(sm[j][0] + nx * base * 0.42)},${f1(sm[j][1] + ny * base * 0.42)}`);
    I2.push(`${f1(sm[j][0] - nx * base * 0.2)},${f1(sm[j][1] - ny * base * 0.2)}`);
  }
  const outline = `M ${L.join(' L ')} L ${R.reverse().join(' L ')} Z`;
  const inner = `M ${I1.join(' L ')} L ${I2.reverse().join(' L ')} Z`;
  const spine = `M ${sm.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' L ')}`;
  return (
    <g>
      <path d={fr} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d={fr} fill="none" stroke={C.hotPink} strokeWidth={4.5} strokeLinecap="round" />
      <path d={outline} fill={C.hotPink} {...ink(S.inkThin)} />
      <path d={inner} fill={C.curtain} opacity={0.5} />
      <path d={spine} fill="none" {...ink(2.2)} />
    </g>
  );
};

// ---------------- mouth ----------------
const GRIT = { open: 9, w: 1.04, round: 0, up: 1, low: 1, tongue: 0, press: 0 };
const Mouth: React.FC<{ viseme: Viseme; jawExtra: number; ex: Expr; jowlY: number }> = ({ viseme, jawExtra, ex }) => {
  const rest = viseme === 'X';
  const m = rest && ex.grit ? GRIT : MOUTH[viseme];
  const open = m.open + (jawExtra + (rest ? ex.jaw : 0)) * 44;
  const w = m.w;
  const y0 = -36 + open - m.press * 3;
  const sx = lerp(1, w, 0.55);
  const xw = (x: number, k = w) => MX + (x - MX) * k;
  const cL = rest || viseme === 'A' ? ex.curveB : 0.2;
  const cR = rest || viseme === 'A' ? ex.curveF : 0.2;
  const showCavity = open > 1.5;
  // cavity
  let cavity: React.ReactNode = null;
  if (showCavity) {
    if (m.round > 0.5) {
      cavity = <ellipse cx={MX + 6} cy={(-42 + y0) / 2 + 3} rx={50 * w} ry={(y0 + 42) / 2 + 4} fill={C.curtainDark} {...ink(S.ink)} />;
    } else {
      cavity = <path d={`M ${xw(-30)},-42 Q ${MX},-54 ${xw(96)},-42 L ${xw(94)},${y0 + 8} Q ${MX},${y0 + 18} ${xw(-28)},${y0 + 8} Z`} fill={C.curtainDark} {...ink(S.ink)} />;
    }
  }
  const tongue = showCavity && m.tongue === 1 ? (
    <ellipse cx={MX + 12} cy={y0 - 2} rx={30 * w} ry={11} fill={C.hotPink} {...ink(S.inkThin)} />
  ) : showCavity && m.tongue === 2 ? (
    <path d={`M ${MX - 18},${y0 + 2} C ${MX - 16},${-30} ${MX + 4},${-44} ${MX + 14},${-38} C ${MX + 26},${-32} ${MX + 30},${y0 - 10} ${MX + 34},${y0 + 2} Z`} fill={C.hotPink} {...ink(S.inkThin)} />
  ) : null;
  const upperTeeth = (yTop: number, x0: number, x1: number, n: number) => {
    const tw = (x1 - x0) / n;
    let d = `M ${x0},${yTop} L ${x1},${yTop} L ${x1},${yTop + 11}`;
    for (let i = n; i > 0; i--) d += ` Q ${f1(x0 + tw * (i - 0.5))},${yTop + 15} ${f1(x0 + tw * (i - 1))},${yTop + 11}`;
    return <path d={d + ' Z'} fill={C.white} {...ink(S.inkThin)} />;
  };
  // lower jaw (underbite: juts past the upper lip, sits in front of it)
  const jl = { x: -24, y: y0 - cL * 10 }, jr = { x: 90, y: y0 - cR * 10 };
  const jaw = `M ${jl.x},${f1(jl.y)} Q ${MX},${f1(y0 + 5)} ${jr.x},${f1(jr.y)} C ${jr.x + 6},${f1(y0 + 20)} ${MX + 40},${f1(y0 + 36)} ${MX},${f1(y0 + 34)} C ${MX - 42},${f1(y0 + 34)} ${jl.x - 8},${f1(y0 + 22)} ${jl.x},${f1(jl.y)} Z`;
  const fang = (x: number, lean: number, h = 15) => `M ${x - 5},${y0 + 3} L ${x + lean},${y0 + 3 - h} L ${x + 5},${y0 + 3} Z`;
  const lowTeeth = () => {
    let d = '';
    for (let i = 0; i < 5; i++) { const x = 6 + i * 13; d += `M ${x - 4},${y0 + 4} L ${x},${y0 - 3} L ${x + 4},${y0 + 4} Z `; }
    return d;
  };
  return (
    <g>
      <g transform={`translate(${MX},0) scale(${sx},1) translate(${-MX},0)`}>
        {cavity}
        {tongue}
        {showCavity && m.up === 1 && upperTeeth(-46, 0, 64, 6)}
      </g>
      {/* flews (upper lips) */}
      <g transform={`translate(${MX},0) scale(${sx},${m.press ? 0.9 : 1}) translate(${-MX},0)`}>
        <path d="M 22,-72 C 2,-76 -34,-70 -38,-50 C -40,-32 -16,-26 4,-34 C 12,-38 18,-42 22,-42 C 26,-42 32,-38 42,-34 C 62,-26 90,-32 88,-50 C 86,-70 44,-76 22,-72 Z" fill={C.bulldogFur} {...ink(S.ink)} />
        <path d="M 22,-70 L 22,-44" {...ink(S.inkThin)} fill="none" />
        <path d="M -20,-52 m 0,0 a 1.8,1.8 0 1,0 0.1,0 M -6,-58 a 1.8,1.8 0 1,0 0.1,0 M -22,-40 a 1.8,1.8 0 1,0 0.1,0 M 58,-58 a 1.8,1.8 0 1,0 0.1,0 M 72,-50 a 1.8,1.8 0 1,0 0.1,0 M 68,-40 a 1.8,1.8 0 1,0 0.1,0" fill="none" {...ink(2.2)} />
      </g>
      <g transform={`translate(${MX},0) scale(${lerp(1, w, 0.7)},1) translate(${-MX},0)`}>
        <path d={jaw} fill={C.bulldogFur} {...ink(S.ink)} />
        <path d={`M ${MX - 30},${f1(y0 + 26)} Q ${MX},${f1(y0 + 31)} ${MX + 30},${f1(y0 + 26)}`} fill="none" stroke={C.bulldogShade} strokeWidth={4} strokeLinecap="round" />
        {m.low > 0 && <path d={lowTeeth()} fill={C.white} {...ink(2)} />}
        {m.low > 0 && <path d={`${fang(-4, -3)} ${fang(70, 3)}`} fill={C.white} {...ink(2.6)} />}
      </g>
      {m.up === 2 && upperTeeth(-42, 4, 60, 5)}
      {m.press > 0 && <path d={`M -30,${y0 - 4} q -6,2 -8,8 M 94,${y0 - 4} q 6,2 8,8`} fill="none" {...ink(S.inkThin)} />}
    </g>
  );
};

// ---------------- head ----------------
export const Head: React.FC<HeadProps> = (p) => {
  const { ex } = p;
  const open = mouthOpen(p.viseme, p.jawExtra, ex) * 1.3;
  const sag = p.jowlY + open * 0.42;
  const dx = p.jowlX * 0.9;
  const lidT = clamp(ex.lidT + p.blink * (1 - ex.lidT));
  const bY = ex.browY;
  const browB = `translate(${EYE_B.x - 2},${EYE_B.y - 30 + bY + ex.browFarY}) rotate(${ex.brow})`;
  const browF = `translate(${EYE_F.x + 2},${EYE_F.y - 36 + bY + 4}) rotate(${-ex.brow}) scale(-1.12,1.12)`;
  const brow = 'M -34,4 C -36,-6 -20,-12 2,-14 C 18,-16 34,-16 38,-6 C 42,4 36,12 28,12 C 10,8 -14,6 -34,4 Z';
  const browTuft = 'M 26,-12 l 8,-8 M 14,-14 l 4,-9 M -2,-13 l 1,-8';
  const jowlB = (s: number, x: number) => `M -58,-88 C -94,-82 -112,-50 -106,-22 C -102,${f1(-2 + s)} ${f1(-82 + x)},${f1(8 + s)} ${f1(-60 + x)},${f1(2 + s)} C ${f1(-42 + x)},${f1(-4 + s)} -30,-22 -28,-42`;
  const jowlF = (s: number, x: number) => `M 86,-90 C 124,-86 142,-52 136,-22 C 132,${f1(-2 + s)} ${f1(110 + x)},${f1(8 + s)} ${f1(90 + x)},${f1(2 + s)} C ${f1(74 + x)},${f1(-4 + s)} 66,-22 70,-42`;
  const jowlB2 = (s: number, x: number) => `M -76,-60 C -110,-44 -118,-12 -100,${f1(8 + s * 0.7)} C ${f1(-88 + x)},${f1(22 + s)} ${f1(-64 + x)},${f1(22 + s)} ${f1(-50 + x)},${f1(12 + s)} C -40,4 -36,-8 -34,-24`;
  const jowlF2 = (s: number, x: number) => `M 104,-62 C 138,-46 146,-12 128,${f1(8 + s * 0.7)} C ${f1(116 + x)},${f1(22 + s)} ${f1(92 + x)},${f1(22 + s)} ${f1(80 + x)},${f1(12 + s)} C 70,4 66,-8 66,-24`;
  const s2 = sag * 1.35, x2 = dx * 1.3;
  return (
    <g>
      {/* ears (bat) */}
      <g transform={`rotate(${-6 + p.ear * 0.9} -56 -160)`}>
        <path d="M -82,-146 C -104,-184 -114,-222 -106,-246 C -84,-240 -46,-208 -30,-178 Z" fill={C.bulldogFur} {...ink(S.ink)} />
        <path d="M -78,-156 C -94,-186 -100,-212 -98,-230 C -82,-222 -60,-200 -46,-180 Z" fill={C.hotPink} opacity={0.55} />
      </g>
      <g transform={`rotate(${4 + p.ear * 1.1} 90 -168)`}>
        <path d="M 64,-182 C 84,-212 114,-240 136,-246 C 146,-222 136,-180 112,-148 Z" fill={C.bulldogFur} {...ink(S.ink)} />
        <path d="M 76,-184 C 94,-208 116,-228 130,-232 C 134,-212 126,-186 110,-164 Z" fill={C.hotPink} opacity={0.55} />
      </g>
      {/* paper-cut shadow + skull */}
      <path d="M -82,-52 C -108,-110 -96,-176 -40,-186 C 0,-195 46,-195 80,-184 C 126,-168 130,-110 110,-52 C 84,-26 -54,-26 -82,-52 Z" transform="translate(5,6)" fill={C.ink} opacity={0.25} />
      <path d="M -82,-52 C -108,-110 -96,-176 -40,-186 C 0,-195 46,-195 80,-184 C 126,-168 130,-110 110,-52 C 84,-26 -54,-26 -82,-52 Z" fill={C.bulldogFur} {...ink(S.inkBold)} />
      <path d="M -40,-186 C -96,-176 -108,-110 -82,-52 C -72,-74 -80,-140 -40,-186 Z" fill="url(#halftone)" />
      <path d="M 82,-182 C 124,-166 130,-112 112,-56 C 118,-104 112,-150 82,-182 Z" fill={`url(#${p.uid}rim)`} />
      {/* forehead wrinkles + furrow */}
      <path d="M -26,-162 Q 12,-176 50,-164 M -12,-176 Q 14,-186 38,-177 M -40,-148 Q -30,-154 -18,-150" fill="none" stroke={C.bulldogShade} strokeWidth={4.5} strokeLinecap="round" />
      {ex.furrow > 0.1 && <path d={`M 4,-150 Q ${9},-138 6,-126 M 22,-152 Q 18,-140 20,-126`} fill="none" {...ink(S.inkThin)} opacity={ex.furrow} />}
      {/* back jowls */}
      <path d={jowlB2(s2, x2) + ' Z'} fill={C.bulldogShade} />
      <path d={jowlB2(s2, x2)} fill="none" {...ink(S.ink)} />
      <path d={jowlF2(s2, x2) + ' Z'} fill={C.bulldogShade} />
      <path d={jowlF2(s2, x2)} fill="none" {...ink(S.ink)} />
      {/* eyes */}
      <Eye e={EYE_B} ex={ex} lidT={lidT} lookX={p.lookX} lookY={p.lookY} browAng={ex.brow} near={false} shake={p.shake} />
      <Eye e={EYE_F} ex={ex} lidT={lidT} lookX={p.lookX} lookY={p.lookY} browAng={ex.brow} near shake={p.shake} />
      {/* brows (heavy fur ridges) */}
      <g transform={browB}><path d={brow} fill={C.bulldogShade} {...ink(S.ink)} /><path d={browTuft} {...ink(S.inkThin)} /></g>
      <g transform={browF}><path d={brow} fill={C.bulldogShade} {...ink(S.ink)} /><path d={browTuft} {...ink(S.inkThin)} /></g>
      {/* over-nose rope wrinkle */}
      <path d="M -10,-94 Q 22,-110 56,-95" fill="none" {...ink(S.ink)} />
      <path d="M -2,-90 Q 22,-100 48,-90" fill="none" stroke={C.bulldogShade} strokeWidth={4} strokeLinecap="round" />
      {/* mouth + jaw + flews */}
      <g transform={`translate(${MX},-46) scale(1.32) translate(${-MX},46)`}>
        <Mouth viseme={p.viseme} jawExtra={p.jawExtra} ex={ex} jowlY={p.jowlY} />
      </g>
      {/* nose (squashed) */}
      <path d="M -14,-84 C -18,-98 2,-104 24,-104 C 46,-104 66,-98 62,-84 C 58,-70 40,-66 24,-66 C 8,-66 -10,-70 -14,-84 Z" fill={C.ink} {...ink(S.inkThin)} />
      <path d="M 2,-80 q 7,-6 13,0 M 32,-80 q 7,-6 13,0" fill="none" stroke={C.bulldogShade} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M 24,-100 L 24,-86" stroke={C.bulldogShade} strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={12} cy={-95} rx={10} ry={3.5} fill={C.white} opacity={0.75} />
      {/* front jowls drape over jaw corners */}
      <path d={jowlB(sag, dx) + ' Z'} fill={C.bulldogFur} />
      <path d={jowlB(sag, dx)} fill="none" {...ink(S.ink)} />
      <path d={jowlF(sag, dx) + ' Z'} fill={C.bulldogFur} />
      <path d={jowlF(sag, dx)} fill="none" {...ink(S.ink)} />
      <path d={`M -96,-40 Q -86,-30 -76,${f1(-20 + sag * 0.5)} M 128,-40 Q 118,-28 108,${f1(-20 + sag * 0.5)}`} fill="none" stroke={C.bulldogShade} strokeWidth={4} strokeLinecap="round" />
      {/* vein / sweat */}
      {ex.vein > 0 && <path d="M 70,-176 q 6,6 0,12 M 76,-170 q 6,-6 12,0 M 88,-176 q -6,6 0,12 M 76,-158 q 6,-6 12,0" fill="none" stroke={C.curtain} strokeWidth={4} strokeLinecap="round" />}
      {ex.sweat > 0 && <path d="M 118,-150 C 112,-138 110,-130 116,-126 C 122,-122 128,-130 124,-138 Z" fill={C.white} {...ink(S.inkThin)} />}
      {/* tiny top hat + gigantic plume */}
      <g transform={`translate(${HAT_AT.x},${HAT_AT.y}) rotate(${10 + p.hatTip})`}>
        <g transform="translate(-12,-12)">
          <Plume frame={p.frame} l1={p.plume1} l2={p.plume2} lx={p.plumeX} droop={p.plumeDroop} />
        </g>
        <path d="M -26,0 Q 0,7 26,0 Q 28,-5 21,-6 Q 0,-1 -21,-6 Q -28,-5 -26,0 Z" fill={C.ink} {...ink(S.inkThin)} />
        <path d="M -13,-4 L -15,-34 Q 0,-37 15,-34 L 13,-4 Z" fill={C.ink} {...ink(S.inkThin)} />
        <path d="M -13.5,-7 L -14,-14 Q 0,-16 14,-14 L 13.5,-7 Q 0,-5 -13.5,-7 Z" fill={C.curtain} />
        <path d="M 8,-30 L 8,-18" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
      </g>
    </g>
  );
};
