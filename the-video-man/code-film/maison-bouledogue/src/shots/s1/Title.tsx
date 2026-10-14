// S1 — marquee title: gold Didone letters with chaser bulbs dropping onto hanging gold rails; subtitle with shimmer.
import React from 'react';
import { C, F, S, ink } from '../../lib/style';
import { clamp, ease, lerp, track, wobble } from '../../lib/motion';
import { hash01 } from '../../lib/rng';
import { LETTERS, LINE1_BASE, LINE2_BASE, LANDS, SUB_IN, WHIP_START, type Letter } from './geom';

const f1 = (n: number) => n.toFixed(1);

/** Letter motion relative to its landing frame. */
const letterMotion = (L: Letter, frame: number) => {
  const t = frame - L.land;
  const big = L.group === 12;
  const hangY = 60 - L.base; // baseline just inside the top of frame while it peeks
  const r0 = (hash01('lr', L.line, L.idx) - 0.5) * 22;
  if (t < -12) return null;
  if (t < -8) {
    // peek + anticipation: tugs UP (wind-up) before the release
    const a = (t + 12) / 4;
    const tug = Math.sin(a * Math.PI) * 26;
    return { y: hangY - tug - 70 * (1 - a), sx: 1 - 0.05 * Math.sin(a * Math.PI), sy: 1 + 0.08 * Math.sin(a * Math.PI), rot: r0 * (1 + 0.3 * Math.sin(a * 6)), lit: 0, landed: false };
  }
  if (t < 0) {
    const p = (t + 8) / 8;
    const y = lerp(hangY, 0, p * p);
    const sy = 1 + 0.42 * p * (big ? 1.2 : 1);
    return { y, sx: 1 / Math.sqrt(sy), sy, rot: r0 * (1 - p * 0.6), lit: 0, landed: false };
  }
  // landing: squash -> stretch overshoot -> settle; small bounce; rotation snaps through zero
  const k = big ? 1.3 : 1;
  const sy = 1 - 0.36 * k * Math.exp(-t / 2.6) * Math.cos(t * 1.05);
  const y = -24 * k * Math.exp(-t / 2.8) * Math.max(0, Math.sin(t * 0.95));
  const rot = r0 * 0.4 * Math.exp(-t / 2.2) * Math.cos(t * 1.4 + 0.3) * -1;
  // neighbours' thumps rattle already-landed letters a little
  const rattle = wobble(frame, LANDS.filter((f) => f > L.land).map((f) => [f, 0.35] as [number, number]), 5, 8);
  const lit = t < 1 ? 1.6 : t < 3 ? 1.25 : 1;
  return { y: y + rattle * 3, sx: 1 / Math.sqrt(Math.max(0.5, sy)), sy, rot: rot + rattle * 1.2 * (L.idx % 2 ? 1 : -1), lit, landed: true };
};

/** Fly-out for the whip: rails dip (anticipation) then yank up out of frame, stretching. */
export const flyOut = (frame: number) => {
  const dip = track(frame, [[WHIP_START - 5, 0], [WHIP_START - 1, 16, ease.out]]);
  const t = clamp((frame - (WHIP_START - 1)) / 9);
  const up = t * t * t * 1100;
  return { y: dip - up, stretch: 1 + t * 0.6 };
};

const Glyph: React.FC<{ L: Letter; frame: number }> = ({ L, frame }) => {
  const m = letterMotion(L, frame);
  if (!m) return null;
  const s = L.size;
  const chase = -frame * 2.2 - L.idx * 7;
  return (
    <g transform={`translate(${f1(L.x)} ${f1(L.base + m.y)}) rotate(${m.rot.toFixed(2)}) scale(${m.sx.toFixed(3)} ${m.sy.toFixed(3)})`}>
      <g fontFamily={F.display} fontWeight={700} fontSize={s} textAnchor="middle">
        <text x={9} y={12} fill={C.ink} opacity={0.3}>{L.ch}</text>
        <text x={0} y={0} fill={C.ink} stroke={C.ink} strokeWidth={22} strokeLinejoin="round">{L.ch}</text>
        <text x={-3} y={-3} fill={C.goldLight}>{L.ch}</text>
        <text x={1.5} y={1.5} fill="url(#s1gold)">{L.ch}</text>
        {/* bulbs: round-capped zero-length dashes ride the glyph outline */}
        <text x={0} y={0} fill="none" stroke={C.goldLight} strokeWidth={m.landed ? 20 : 0} strokeDasharray="0 30" strokeDashoffset={chase} strokeLinecap="round" opacity={0.28 * m.lit}>{L.ch}</text>
        <text x={0} y={0} fill="none" stroke={m.landed ? C.spot : C.pearlShade} strokeWidth={9} strokeDasharray="0 30" strokeDashoffset={chase} strokeLinecap="round">{L.ch}</text>
        <text x={0} y={0} fill="none" stroke={m.landed ? C.white : C.pearlShade} strokeWidth={4} strokeDasharray="0 30" strokeDashoffset={chase} strokeLinecap="round" opacity={m.landed ? 0.9 : 0.5}>{L.ch}</text>
      </g>
    </g>
  );
};

/** Dust puff + impact ticks at each landing (on ones). */
const Dust: React.FC<{ L: Letter; frame: number }> = ({ L, frame }) => {
  const t = frame - L.land;
  if (t < 0 || t > 16) return null;
  const big = L.group === 12 ? 1.5 : 1;
  const hw = (L.ch === 'I' ? 0.25 : 0.42) * L.size;
  const puffs: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    const h = hash01('dust', L.line, L.idx, i);
    const d = (1 - Math.exp(-t / 4)) * (50 + h * 60) * big;
    const x = L.x + side * (hw * 0.6 + d);
    const y = L.base + 14 - (1 - Math.exp(-t / 5)) * (10 + h * 30) * big;
    const r = (10 + h * 12) * big * (0.5 + 0.7 * clamp(t / 6));
    const op = clamp(1 - t / 16) * 0.9;
    puffs.push(<circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? C.paper : C.paperDark} opacity={op} {...ink(2.5)} strokeOpacity={op * 0.8} />);
  }
  const ticks = t < 5 ? (
    <path
      d={[-1, 1].map((sd) => [0, 1, 2].map((k) => {
        const a = (-20 - k * 25) * (Math.PI / 180);
        const r0 = hw + 20 + t * 10, r1 = r0 + 26 * big;
        return `M${f1(L.x + sd * Math.cos(a) * r0)} ${f1(L.base + Math.sin(a) * r0 * 0.6)} L${f1(L.x + sd * Math.cos(a) * r1)} ${f1(L.base + Math.sin(a) * r1 * 0.6)}`;
      }).join(' ')).join(' ')}
      stroke={C.spot} strokeWidth={6} strokeLinecap="round" opacity={1 - t / 5}
    />
  ) : null;
  return <g>{puffs}{ticks}</g>;
};

/** Gold marquee rail the letters land on; hangs on two cables and bounces on each thump. */
const Rail: React.FC<{ y: number; x0: number; x1: number; frame: number; line: 0 | 1 }> = ({ y, x0, x1, frame, line }) => {
  const imp = LETTERS.filter((l) => l.line === line).map((l) => [l.land, l.group === 12 ? 1.4 : 0.6] as [number, number]);
  const b = wobble(frame, imp, 3.4, 4) * 5 + Math.sin(frame * 0.05 + line) * 1.5;
  const tilt = wobble(frame, imp.map(([f, a], i) => [f, a * (i % 2 ? 1 : -1)] as [number, number]), 2.2, 3) * 0.5;
  const ry = y + 16 + b;
  return (
    <g transform={`rotate(${tilt.toFixed(3)} 960 ${ry})`}>
      {[x0 + 60, x1 - 60].map((x) => (
        <g key={x}>
          <path d={`M${x} ${ry} L${x + (x < 960 ? -30 : 30)} -400`} stroke={C.ink} strokeWidth={6} />
          <path d={`M${x} ${ry} L${x + (x < 960 ? -30 : 30)} -400`} stroke={C.pearlShade} strokeWidth={2} opacity={0.6} />
        </g>
      ))}
      <rect x={x0 + 8} y={ry + 8} width={x1 - x0} height={22} fill={C.ink} opacity={0.3} />
      <rect x={x0} y={ry} width={x1 - x0} height={22} rx={6} fill={C.gold} {...ink(S.ink)} />
      <rect x={x0 + 6} y={ry + 3} width={x1 - x0 - 12} height={5} rx={2} fill={C.goldLight} />
      {Array.from({ length: Math.floor((x1 - x0) / 40) }, (_, i) => {
        const on = ((i + Math.floor(frame / 3)) % 3) !== 0 && frame >= 56;
        return <circle key={i} cx={x0 + 20 + i * 40} cy={ry + 15} r={4.5} fill={on ? C.spot : C.mustard} {...ink(1.8)} />;
      })}
    </g>
  );
};

export const Title: React.FC<{ frame: number }> = ({ frame }) => {
  const fo = flyOut(frame);
  return (
    <g transform={`translate(0 ${f1(fo.y)}) translate(960 540) scale(1 ${fo.stretch.toFixed(3)}) translate(-960 -540)`}>
      <Rail y={LINE1_BASE} x0={520} x1={1400} frame={frame} line={0} />
      <Rail y={LINE2_BASE} x0={190} x1={1730} frame={frame} line={1} />
      {LETTERS.map((L) => <Glyph key={`${L.line}-${L.idx}`} L={L} frame={frame} />)}
      {LETTERS.map((L) => <Dust key={`d${L.line}-${L.idx}`} L={L} frame={frame} />)}
      <Subtitle frame={frame} />
    </g>
  );
};

// ---- subtitle -----------------------------------------------------------------------------
const Sparkle: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => {
  if (t < 0 || t > 8) return null;
  const k = Math.sin((t / 8) * Math.PI) * s;
  return (
    <g transform={`translate(${x} ${y}) scale(${k.toFixed(3)}) rotate(${t * 6})`}>
      <path d="M0 -38 Q4 -4 38 0 Q4 4 0 38 Q-4 4 -38 0 Q-4 -4 0 -38 Z" fill={C.white} {...ink(2.5)} />
    </g>
  );
};

const Subtitle: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - SUB_IN;
  if (t < 0) return null;
  const p = clamp(t / 12);
  const x = (1 - ease.outBack(p, 1.4)) * 1500;
  const skew = t < 12 ? -28 * (1 - p) : 7 * Math.exp(-(t - 12) / 3) * Math.cos((t - 12) * 0.9);
  const y = 760;
  const sh = clamp((t - 8) / 26);
  const shimmerX = lerp(-700, 700, ease.inOut(sh));
  const text = 'Collection Grotesque';
  const common = { fontFamily: F.display, fontStyle: 'italic' as const, fontSize: 92, textAnchor: 'middle' as const, letterSpacing: 3 };
  return (
    <g transform={`translate(${f1(960 + x)} ${y}) skewX(${skew.toFixed(2)})`}>
      {/* speed lines while sliding */}
      {t < 10 && (
        <path d={[0, 1, 2, 3].map((i) => `M${480 + i * 30} ${-60 + i * 28} l${f1(300 * (1 - p) + 60)} 0`).join(' ')} stroke={C.goldLight} strokeWidth={6} strokeLinecap="round" opacity={1 - p} />
      )}
      <line x1={-560} x2={-440} y1={-28} y2={-28} {...ink(4)} stroke={C.gold} />
      <line x1={440} x2={560} y1={-28} y2={-28} {...ink(4)} stroke={C.gold} />
      <circle cx={-580} cy={-28} r={7} fill={C.gold} {...ink(2.5)} />
      <circle cx={580} cy={-28} r={7} fill={C.gold} {...ink(2.5)} />
      <text {...common} x={6} y={8} fill={C.ink} opacity={0.3}>{text}</text>
      <text {...common} fill={C.ink} stroke={C.ink} strokeWidth={10} strokeLinejoin="round">{text}</text>
      <text {...common} fill={C.pearl}>{text}</text>
      <clipPath id="s1subclip"><text {...common}>{text}</text></clipPath>
      <g clipPath="url(#s1subclip)">
        <rect x={-700} y={-90} width={1400} height={130} fill="url(#s1gold)" opacity={0.55} />
        <rect x={shimmerX - 60} y={-120} width={120} height={200} fill="url(#s1shimmer)" transform={`skewX(-25)`} />
      </g>
      <Sparkle x={-420} y={-70} t={t - 14} />
      <Sparkle x={shimmerX * 0.9} y={-60} t={t - 24} s={0.8} />
      <Sparkle x={440} y={-66} t={t - 32} s={1.1} />
    </g>
  );
};
