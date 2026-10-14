import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { clamp, easeOutBack, rand, seg, stepFrame, tq } from './time';

export const INK = '#33271e';
export const INK_SOFT = '#7a6550';
export const RED = '#c8281e';
export const CARD = '#fbf6ec';
export const HEB = 'Heebo, sans-serif';
export const MONO = 'Menlo, Monaco, monospace';

/** ±px / ±deg stop-motion boil — changes every 12fps step, seeded per element */
export const useBoil = (seed: number, amp = 1.2) => {
  const s = stepFrame(useCurrentFrame());
  return { dx: (rand(seed, s) - 0.5) * 2 * amp, dy: (rand(seed + 7, s) - 0.5) * 2 * amp, dr: (rand(seed + 13, s) - 0.5) * 0.5 };
};

/** stop-motion "drop onto the table": lands from above in ~4 steps with a small overshoot */
export const drop = (t: number, t0: number, dur = 0.42) => {
  if (t < t0) return { visible: false, y: -80, s: 1.08, r: 3, o: 0 };
  const p = seg(t, t0, t0 + dur);
  const e = easeOutBack(p);
  return { visible: true, y: (1 - e) * -80, s: 1.08 - 0.08 * e, r: (1 - e) * 3, o: clamp(p * 3) };
};

/** a full sheet of paper: base color + cycling grain (boil) + soft vignette */
export const Sheet: React.FC<{ color: string; children?: React.ReactNode }> = ({ color, children }) => {
  const f = useCurrentFrame();
  const g = Math.floor(stepFrame(f) / 2) % 4;
  return (
    <div style={{ position: 'absolute', inset: 0, background: color, overflow: 'hidden' }}>
      <Img src={staticFile(`tex/grain${g}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.9 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(255,250,240,0.0) 55%, rgba(80,50,25,0.22) 100%)' }} />
      {children}
    </div>
  );
};

type CardProps = {
  x: number; y: number; w: number; h: number; rot?: number; seed: number;
  t?: number; t0?: number; bg?: string; pad?: number; children?: React.ReactNode; style?: React.CSSProperties;
  out?: { t: number; dx?: number; dy?: number; s?: number; r?: number; dur?: number }; // move/scale after landing
};

/** a paper cut-out card with a real shadow; drops in at t0, optionally moves later */
export const Card: React.FC<CardProps> = ({ x, y, w, h, rot = 0, seed, t, t0, bg = CARD, pad = 0, children, style, out }) => {
  const b = useBoil(seed);
  const d = t0 !== undefined && t !== undefined ? drop(t, t0) : { visible: true, y: 0, s: 1, r: 0, o: 1 };
  if (!d.visible) return null;
  let mx = 0, my = 0, ms = 1, mr = 0;
  if (out && t !== undefined) {
    const p = easeOutBack(seg(t, out.t, out.t + (out.dur ?? 0.5)));
    mx = (out.dx ?? 0) * p; my = (out.dy ?? 0) * p; ms = 1 + ((out.s ?? 1) - 1) * p; mr = (out.r ?? 0) * p;
  }
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, padding: pad, boxSizing: 'border-box',
      background: bg, borderRadius: 6, opacity: d.o,
      transform: `translate(${b.dx + mx}px, ${b.dy + d.y + my}px) rotate(${rot + b.dr + d.r + mr}deg) scale(${d.s * ms})`,
      boxShadow: '0 16px 30px rgba(60,35,15,0.32), 0 3px 6px rgba(60,35,15,0.28)', ...style,
    }}>{children}</div>
  );
};

/** photo print inside a card (white border bottom like a polaroid) */
export const Photo: React.FC<{ src: string; label?: string; pos?: string; size?: number }> = ({ src, label, pos = 'center', size = 44 }) => (
  <div style={{ position: 'absolute', inset: 0, padding: '5% 5% 0 5%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ flex: 1, overflow: 'hidden', borderRadius: 3, background: '#2b1a10' }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />
    </div>
    <div style={{ height: label ? '13%' : '5%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEB, fontWeight: 900, color: INK, fontSize: size }}>{label}</div>
  </div>
);

/** masking-tape label: semi-transparent tape strip with handwritten-weight text */
export const Tape: React.FC<{ x: number; y: number; text: string; rot?: number; t: number; t0: number; seed: number; size?: number; color?: string; ink?: string; ltr?: boolean }> =
  ({ x, y, text, rot = -3, t, t0, seed, size = 46, color = 'rgba(233,214,160,0.92)', ink = INK, ltr = false }) => {
    const b = useBoil(seed, 1);
    if (t < t0) return null;
    // tape is "slapped" on: 2 steps of scale
    const p = seg(t, t0, t0 + 0.17);
    const s = 1.25 - 0.25 * p;
    return (
      <div style={{
        position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) translate(${b.dx}px, ${b.dy}px) rotate(${rot + b.dr}deg) scale(${s})`,
        background: color, padding: `${size * 0.22}px ${size * 0.6}px`, fontFamily: ltr ? MONO : HEB, fontWeight: 800,
        fontSize: size, color: ink, whiteSpace: 'nowrap', direction: ltr ? 'ltr' : 'rtl',
        boxShadow: '0 4px 8px rgba(60,35,15,0.2)', clipPath: 'polygon(1% 6%, 99% 0%, 100% 92%, 0% 100%)',
      }}>{text}</div>
    );
  };

/** big Hebrew headline, words drop in one by one (cut-out paper words) */
export const Words: React.FC<{ text: string; t: number; t0: number; x: number; y: number; size: number; color?: string; gap?: number; seed: number; width?: number }> =
  ({ text, t, t0, x, y, size, color = INK, gap = 0.12, seed, width = 920 }) => {
    const words = text.split(' ');
    return (
      <div style={{ position: 'absolute', left: x, top: y, width, display: 'flex', flexWrap: 'wrap', direction: 'rtl', gap: `${size * 0.1}px ${size * 0.28}px`, justifyContent: 'center' }}>
        {words.map((w, i) => <Word key={i} w={w} d={drop(t, t0 + i * gap, 0.34)} size={size} color={color} seed={seed + i} />)}
      </div>
    );
  };
const Word: React.FC<{ w: string; d: ReturnType<typeof drop>; size: number; color: string; seed: number }> = ({ w, d, size, color, seed }) => {
  const b = useBoil(seed, 1);
  return (
    <span style={{
      display: 'inline-block', fontFamily: HEB, fontWeight: 900, fontSize: size, lineHeight: 1.05, color,
      opacity: d.visible ? d.o : 0, transform: `translate(${b.dx}px, ${d.y + b.dy}px) rotate(${d.r * 2 + b.dr}deg) scale(${d.s})`,
      textShadow: '0 6px 10px rgba(60,35,15,0.22)', unicodeBidi: 'plaintext',
    }}>{w}</span>
  );
};

/** stage header: red number + title, top of every sheet */
export const Header: React.FC<{ n: number; title: string; sub?: string; t: number; t0: number }> = ({ n, title, sub, t, t0 }) => {
  const b = useBoil(900 + n, 1);
  return (
    <div style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', direction: 'rtl', transform: `translate(${b.dx}px, ${b.dy}px)` }}>
      <span style={{ fontFamily: HEB, fontWeight: 900, fontSize: 92, color: RED }}>{n}</span>
      <span style={{ fontFamily: HEB, fontWeight: 900, fontSize: 92, color: INK, margin: '0 22px' }}>·</span>
      <span style={{ fontFamily: HEB, fontWeight: 900, fontSize: 92, color: INK }}>{title}</span>
      {sub && <div style={{ fontFamily: HEB, fontWeight: 400, fontSize: 36, color: INK_SOFT, marginTop: 4, opacity: seg(t, t0, t0 + 0.3) }}>{sub}</div>}
    </div>
  );
};

export { tq };
