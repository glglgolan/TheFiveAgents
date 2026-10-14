// S1 — grand red theatre curtain (two halves), valance with swags + tassels, proscenium, stage lip + footlights.
import React from 'react';
import { C, S, ink } from '../../lib/style';
import { onTwos, wobble, lerp, clamp } from '../../lib/motion';
import { noise2 } from '../../lib/rng';
import { CURTAIN_TOP, HEM_Y, SEAM_X, OUTER_L, OUTER_R, STAGE_LIP, SHAKE_IMP } from './geom';

const N = 9; // folds per half
const f1 = (n: number) => n.toFixed(1);

type HalfProps = { side: 'L' | 'R'; frame: number; open: number; pinch: number; prevOpen: number };

/** u in [0,1]: 0 = outer edge, 1 = seam. Returns screen x for a given opening. */
const xAt = (side: 'L' | 'R', u: number, open: number, pinch: number) => {
  const outer = side === 'L' ? OUTER_L - 120 : OUTER_R + 120;
  const seam = SEAM_X + (side === 'L' ? 1 : -1) * (14 + pinch * 26);
  // gather: folds compress toward the outer edge as it opens, and the whole half slides away
  const gathered = 1 - 0.62 * open;
  const slide = open * 1180 * (side === 'L' ? -1 : 1);
  return outer + (seam - outer) * u * gathered + slide;
};
/** Hem height: the leading corner lifts as it whips open (theatre 'tab' drape). */
const hemAt = (u: number, open: number, i: number, frame: number) =>
  HEM_Y - open * 360 * Math.pow(u, 1.6) + (i % 2 === 0 ? 0 : 0) + noise2('hem', u * 4, frame * 0.02) * 3;

export const CurtainHalf: React.FC<HalfProps> = ({ side, frame, open, pinch, prevOpen }) => {
  const f2 = onTwos(frame);
  const sway = (i: number) => noise2('fold' + side, i * 0.7, f2 * 0.018) * 7 + wobble(frame, SHAKE_IMP, 1.4, 2.2) * 5 * Math.sin(i * 1.3);
  const M = N * 2; // samples along width (ridge + trough per fold)
  const pts: { x: number; top: number; hem: number }[] = [];
  for (let k = 0; k <= M; k++) {
    const u = k / M;
    const x = xAt(side, u, open, pinch) + sway(k / 2);
    // scallop: ridges hang lower than troughs
    const ridge = k % 2 === 1;
    pts.push({ x, top: CURTAIN_TOP - 60, hem: hemAt(u, open, k, frame) + (ridge ? 20 : -2) });
  }
  // outline path
  let d = `M${f1(pts[0].x)} ${pts[0].top}`;
  for (let k = 1; k <= M; k++) d += ` L${f1(pts[k].x)} ${pts[k].top}`;
  d += ` L${f1(pts[M].x)} ${f1(pts[M].hem)}`;
  for (let k = M - 1; k >= 0; k--) {
    const a = pts[k + 1], b = pts[k];
    const mx = (a.x + b.x) / 2, my = Math.max(a.hem, b.hem) + 8;
    d += ` Q${f1(mx)} ${f1(my)} ${f1(b.x)} ${f1(b.hem)}`;
  }
  d += ' Z';
  const hemPath = (() => {
    let h = `M${f1(pts[0].x)} ${f1(pts[0].hem)}`;
    for (let k = 1; k <= M; k++) {
      const a = pts[k - 1], b = pts[k];
      h += ` Q${f1((a.x + b.x) / 2)} ${f1(Math.max(a.hem, b.hem) + 8)} ${f1(b.x)} ${f1(b.hem)}`;
    }
    return h;
  })();
  // troughs (even samples) and ridges (odd samples) as vertical bands
  const band = (k: number, wFrac: number, taper = 1) => {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(M, k + 1)], c = pts[k];
    const hw = ((b.x - a.x) / 2) * wFrac;
    const wv = (y: number) => Math.sin(y * 0.006 + k * 1.9 + f2 * 0.03) * 5;
    const y0 = c.top, y1 = c.hem - 6;
    const ym = (y0 + y1) / 2;
    return `M${f1(c.x - hw + wv(y0))} ${y0} Q${f1(c.x - hw * 0.8 + wv(ym) * 2)} ${f1(ym)} ${f1(c.x - hw * taper + wv(y1))} ${f1(y1)} L${f1(c.x + hw * taper + wv(y1))} ${f1(y1)} Q${f1(c.x + hw * 0.8 + wv(ym) * 2)} ${f1(ym)} ${f1(c.x + hw + wv(y0))} ${y0} Z`;
  };
  const troughs: string[] = [], shade: string[] = [], ridges: string[] = [], lines: string[] = [];
  for (let k = 0; k <= M; k += 2) {
    troughs.push(band(k, 0.42, 1.25));
    shade.push(band(k, 0.9, 1.1));
    const c = pts[k];
    lines.push(`M${f1(c.x + 2)} ${c.top} Q${f1(c.x - 8)} ${f1((c.top + c.hem) / 2)} ${f1(c.x + 3)} ${f1(c.hem - 40)}`);
  }
  for (let k = 1; k <= M; k += 2) ridges.push(band(k, 0.16, 0.6));
  // fringe: short tassels hanging from the hem
  let fringe = '';
  const fr = 14;
  for (let k = 0; k < M; k++) {
    const a = pts[k], b = pts[k + 1];
    const n = Math.max(1, Math.round(Math.abs(b.x - a.x) / fr));
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n;
      const x = lerp(a.x, b.x, t);
      const y = lerp(a.hem, b.hem, t) + 4 * (1 - Math.pow(2 * t - 1, 2)) * 2 + 6;
      const sw2 = noise2('fr', x * 0.01, frame * 0.08) * 4 + (open - prevOpen) * (side === 'L' ? 60 : -60);
      fringe += `M${f1(x)} ${f1(y)} l${f1(sw2)} 30 `;
    }
  }
  const clipId = `s1cur${side}`;
  return (
    <g>
      <path d={d} fill={C.ink} opacity={0.3} transform={`translate(${side === 'L' ? 10 : -10} 12)`} />
      <path d={d} fill={C.curtain} />
      <clipPath id={clipId}><path d={d} /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d={shade.join(' ')} fill="url(#halftone)" />
        <path d={troughs.join(' ')} fill={C.curtainDark} />
        <path d={ridges.join(' ')} fill={C.coral} opacity={0.42} />
        <path d={lines.join(' ')} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.45} strokeLinecap="round" />
        {/* top shadow under the valance */}
        <rect x={-400} y={CURTAIN_TOP - 60} width={2800} height={200} fill="url(#s1topShade)" />
      </g>
      <path d={d} fill="none" {...ink(S.ink)} />
      {/* gold braid above the hem */}
      <path d={hemPath} transform="translate(0 -26)" fill="none" stroke={C.ink} strokeWidth={17} strokeLinecap="round" />
      <path d={hemPath} transform="translate(0 -26)" fill="none" stroke={C.gold} strokeWidth={10} strokeLinecap="round" />
      <path d={hemPath} transform="translate(0 -26)" fill="none" stroke={C.goldLight} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
      {/* fringe */}
      <path d={fringe} fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <path d={fringe} fill="none" stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

/** Leading-edge smear for the whip: dry-brush ribbons stretched between last and current edge (no blur). */
export const CurtainSmear: React.FC<{ side: 'L' | 'R'; open: number; prevOpen: number; frame: number }> = ({ side, open, prevOpen, frame }) => {
  if (open - prevOpen < 0.01) return null;
  const dir = side === 'L' ? 1 : -1; // ribbons trail back toward the centre
  const x1 = xAt(side, 1, open, 0);
  const span = Math.abs(xAt(side, 1, prevOpen, 0) - x1) + 80;
  const top = CURTAIN_TOP - 40;
  const hem = hemAt(1, open, 0, frame);
  const rows = 13;
  const ribbons: React.ReactNode[] = [];
  for (let i = 0; i < rows; i++) {
    const y = top + ((i + 0.5) / rows) * (hem - top) + noise2('sm', i, frame) * 10;
    const h = ((hem - top) / rows) * (0.5 + 0.4 * Math.abs(noise2('smh', i, frame * 0.7)));
    const len = span * (0.5 + 0.8 * Math.abs(noise2('sml', i, frame * 0.5)));
    const xa = x1 - dir * 20, xb = x1 + dir * len;
    const d = `M${f1(xa)} ${f1(y - h / 2)} L${f1(xb)} ${f1(y - h * 0.08)} Q${f1(xb + dir * 12)} ${f1(y)} ${f1(xb)} ${f1(y + h * 0.08)} L${f1(xa)} ${f1(y + h / 2)} Z`;
    ribbons.push(<path key={i} d={d} fill={i % 3 === 1 ? C.curtainDark : C.curtain} opacity={0.92} />);
    if (i % 2 === 0) ribbons.push(<path key={'h' + i} d={`M${f1(xa)} ${f1(y - h * 0.15)} L${f1(x1 + dir * len * 0.7)} ${f1(y - h * 0.05)}`} stroke={C.coral} strokeWidth={4} strokeLinecap="round" opacity={0.6} />);
  }
  // fringe smear along the lifted hem
  ribbons.push(<path key="fr" d={`M${f1(x1)} ${f1(hem + 10)} L${f1(x1 + dir * span * 0.9)} ${f1(hem + 30)}`} stroke={C.gold} strokeWidth={10} strokeLinecap="round" opacity={0.8} />);
  return <g>{ribbons}</g>;
};

/** Valance (pelmet) with 4 swags, gold fringe and swinging tassels. Stays put (it's the proscenium header). */
export const Valance: React.FC<{ frame: number }> = ({ frame }) => {
  const f2 = onTwos(frame);
  const xs = [-80, 440, 960, 1480, 2000];
  const bottom = CURTAIN_TOP + 40;
  let d = `M-120 -40 L2040 -40 L2040 ${bottom - 60}`;
  for (let i = xs.length - 1; i > 0; i--) {
    const a = xs[i], b = xs[i - 1];
    d += ` Q${(a + b) / 2} ${bottom + 110} ${b} ${bottom - 40}`;
  }
  d += ' Z';
  let sw = '';
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], m = (a + b) / 2;
    for (let k = 1; k <= 3; k++) sw += `M${a + 30} ${bottom - 40 - k * 26} Q${m} ${bottom + 110 - k * 42} ${b - 30} ${bottom - 40 - k * 26} `;
  }
  let hem = `M${xs[0]} ${bottom - 40}`;
  for (let i = 1; i < xs.length; i++) hem += ` Q${(xs[i] + xs[i - 1]) / 2} ${bottom + 110} ${xs[i]} ${bottom - 40}`;
  // fringe along the swag hems (sample the quadratics)
  let fringe = '';
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1];
    for (let j = 0; j <= 34; j++) {
      const t = j / 34;
      const x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * ((a + b) / 2) + t * t * b;
      const y = (1 - t) * (1 - t) * (bottom - 40) + 2 * (1 - t) * t * (bottom + 110) + t * t * (bottom - 40);
      fringe += `M${f1(x)} ${f1(y + 4)} l${f1(noise2('vf', x * 0.02, f2 * 0.05) * 3)} 24 `;
    }
  }
  return (
    <g>
      <path d={d} fill={C.ink} opacity={0.3} transform="translate(0 14)" />
      <path d={d} fill={C.curtainDark} {...ink(S.ink)} />
      <path d={sw} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.5} strokeLinecap="round" />
      <path d={sw} fill="none" stroke={C.curtain} strokeWidth={3} opacity={0.8} strokeLinecap="round" transform="translate(0 -8)" />
      <path d={d} fill="url(#halftone)" opacity={0.7} />
      <path d={hem} fill="none" stroke={C.ink} strokeWidth={16} />
      <path d={hem} fill="none" stroke={C.gold} strokeWidth={9} />
      <path d={fringe} fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      <path d={fringe} fill="none" stroke={C.gold} strokeWidth={3.5} strokeLinecap="round" />
      {/* crest at centre */}
      <g transform={`translate(960 ${bottom - 70})`}>
        <ellipse rx={62} ry={44} fill={C.gold} {...ink(S.ink)} />
        <ellipse rx={44} ry={30} fill={C.curtainDark} {...ink(S.inkThin)} />
        <path d="M-22 10 L-22 -12 L-8 4 L6 -12 L6 10" fill="none" stroke={C.goldLight} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" transform="translate(8 0)" />
      </g>
      {xs.slice(1, -1).map((x, i) => <Tassel key={x} x={x} y={bottom - 44} frame={frame} seed={i} />)}
    </g>
  );
};

const Tassel: React.FC<{ x: number; y: number; frame: number; seed: number }> = ({ x, y, frame, seed }) => {
  const a = Math.sin(frame * 0.09 + seed * 2) * 2 + wobble(frame - 2 - seed, SHAKE_IMP, 1.1, 1.6) * 16 * (seed % 2 ? -1 : 1);
  return (
    <g transform={`translate(${x} ${y}) rotate(${a.toFixed(2)})`}>
      <path d="M0 0 L0 70" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d="M0 0 L0 70" stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
      <circle cx={0} cy={78} r={15} fill={C.gold} {...ink(S.inkThin)} />
      <path d="M-18 150 L-11 92 L11 92 L18 150 Q0 160 -18 150 Z" fill={C.gold} {...ink(S.inkThin)} />
      <path d="M-9 100 L-12 148 M0 100 L0 152 M9 100 L12 148" stroke={C.mustard} strokeWidth={3} strokeLinecap="round" />
      <rect x={-14} y={88} width={28} height={10} rx={4} fill={C.goldLight} {...ink(2.5)} />
    </g>
  );
};

/** Proscenium sides + stage lip with footlights. `glow` 0..1 scales the footlights. */
export const Proscenium: React.FC<{ frame: number; glow: number }> = ({ frame, glow }) => (
  <g>
    {[0, 1].map((s) => {
      const x = s === 0 ? -200 : OUTER_R + 10;
      const w = s === 0 ? OUTER_L + 190 : 400;
      return (
        <g key={s}>
          <rect x={x} y={-40} width={w} height={1200} fill={C.plum} {...ink(S.ink)} />
          <rect x={x} y={-40} width={w} height={1200} fill="url(#halftone)" />
          <rect x={s === 0 ? OUTER_L - 26 : OUTER_R + 10} y={-40} width={16} height={1200} fill={C.gold} {...ink(S.inkThin)} />
          {Array.from({ length: 22 }, (_, i) => (
            <circle key={i} cx={s === 0 ? OUTER_L - 18 : OUTER_R + 18} cy={i * 50} r={4} fill={C.goldLight} {...ink(1.5)} />
          ))}
        </g>
      );
    })}
    {/* stage lip */}
    <rect x={-200} y={STAGE_LIP} width={2320} height={200} fill={C.ink} />
    <rect x={-200} y={STAGE_LIP} width={2320} height={10} fill={C.gold} {...ink(3)} />
    {Array.from({ length: 13 }, (_, i) => {
      const x = 60 + i * 150;
      const fl = 0.85 + 0.15 * noise2('fl', i, frame * 0.2);
      return (
        <g key={i}>
          <ellipse cx={x} cy={STAGE_LIP - 4} rx={90} ry={60} fill="url(#s1foot)" opacity={clamp(glow * fl)} />
          <path d={`M${x - 34} ${STAGE_LIP + 10} Q${x} ${STAGE_LIP - 36} ${x + 34} ${STAGE_LIP + 10} Z`} fill={C.navy} {...ink(S.inkThin)} />
          <path d={`M${x - 20} ${STAGE_LIP} Q${x} ${STAGE_LIP - 18} ${x + 20} ${STAGE_LIP}`} fill="none" stroke={C.goldLight} strokeWidth={3} opacity={0.6} />
        </g>
      );
    })}
  </g>
);
