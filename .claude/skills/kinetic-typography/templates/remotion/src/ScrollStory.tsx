// ScrollStory — a "scrollytelling" website rendered frame-accurately (skill: scroll-relay).
// The page scrolls DOWN on a timeline; inside each section an image sequence is scrubbed by time
// (Apple-style scroll video). Global z-passes across ALL sections let media spill over section
// borders (the "relay": grounds falling from one section into the next) and let big words sit
// behind (plane 'back') or in front of (plane 'front') the cut-out objects.
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'expoOut' | 'backOut';
type Key = { t: number; y: number; ease?: Ease };
type Word = {
  text: string; family?: string; weight?: number; size: number; color?: string; italic?: boolean;
  x: number; y: number;                 // px inside the section (top-left of the text box)
  plane?: 'back' | 'front'; parallax?: number; tracking?: number; align?: 'left' | 'center' | 'right'; width?: number;
  enter?: { t: number; dur?: number; dy?: number; blur?: number; scale?: number; stagger?: number; ease?: Ease };
  exit?: { t: number; dur?: number; dy?: number; opacity?: number };
};
type Media = {
  dir: string; count: number; ext?: string;     // frames dir (relative to public dir), 1-based %06d
  x: number; y: number; w: number; h: number;   // px inside the section (may exceed the section → spills)
  map?: [number, number][];                     // [[time_s, frame], ...] scrub curve (default: play across scroll window)
  plane?: number; opacity?: [number, number][]; // z order among media; opacity keys [[t, a]]
  parallax?: number; fit?: 'contain' | 'cover';
};
type Card = { x: number; y: number; w: number; h: number; img?: string; title?: string; price?: string; enter?: number; color?: string };
type Section = { id: string; height: number; bg?: string; words?: Word[]; media?: Media[]; cards?: Card[] };
export type ScrollProps = {
  fps: number; duration_sec: number; width: number; height: number; background?: string; ink?: string;
  fonts?: { family: string; weights: number[] }[];
  nav?: { brand: string; items?: string[]; cta?: string; family?: string };
  sections: Section[]; scroll: Key[];
};

const EASE: Record<Ease, (x: number) => number> = {
  linear: (x) => x, in: Easing.in(Easing.cubic), out: Easing.out(Easing.cubic), inOut: Easing.inOut(Easing.cubic),
  expoOut: Easing.out(Easing.exp), backOut: Easing.out(Easing.back(1.4)),
};
const pad = (n: number) => String(n).padStart(6, '0');

function keyed(keys: Key[], t: number): number {
  if (t <= keys[0].t) return keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) return a.y + (b.y - a.y) * EASE[b.ease || 'inOut']((t - a.t) / Math.max(1e-6, b.t - a.t));
  }
  return keys[keys.length - 1].y;
}
const lin = (pairs: [number, number][], t: number) =>
  interpolate(t, pairs.map((p) => p[0]), pairs.map((p) => p[1]), { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const FontLoader: React.FC<{ fonts: { family: string; weights: number[] }[]; children: React.ReactNode }> = ({ fonts, children }) => {
  const [h] = useState(() => delayRender('fonts'));
  const [ok, setOk] = useState(false);
  useEffect(() => {
    (async () => {
      for (const f of fonts) {
        const fam = f.family.trim().replace(/ /g, '+');
        try {
          const r = await fetch(`https://fonts.googleapis.com/css2?family=${fam}:wght@${[...new Set(f.weights)].sort((a, b) => a - b).join(';')}&display=block`);
          if (r.ok) {
            const s = document.createElement('style'); s.textContent = await r.text(); document.head.appendChild(s);
            await Promise.all(f.weights.map((w) => document.fonts.load(`${w} 80px "${f.family}"`)));
          }
        } catch { console.warn('font failed', f.family); }
      }
      setOk(true); continueRender(h);
    })();
  }, []);
  return ok ? <>{children}</> : null;
};

const WordView: React.FC<{ w: Word; t: number; dy: number; ink: string }> = ({ w, t, dy, ink }) => {
  const e = w.enter;
  const letters = [...w.text];
  const stag = e?.stagger ?? 0.03;
  const exitA = w.exit ? lin([[w.exit.t, 1], [w.exit.t + (w.exit.dur ?? 0.4), w.exit.opacity ?? 0]], t) : 1;
  const exitY = w.exit ? lin([[w.exit.t, 0], [w.exit.t + (w.exit.dur ?? 0.4), w.exit.dy ?? -40]], t) : 0;
  return (
    <div style={{
      position: 'absolute', left: w.x, top: w.y + dy + exitY, width: w.width, textAlign: w.align || 'left', whiteSpace: 'pre',
      fontFamily: `"${w.family || 'Playfair Display'}", serif`, fontWeight: w.weight ?? 700, fontStyle: w.italic ? 'italic' : 'normal',
      fontSize: w.size, lineHeight: 0.92, letterSpacing: `${w.tracking ?? -0.02}em`, color: w.color || ink, opacity: exitA,
    }}>
      {letters.map((ch, i) => {
        if (!e) return <span key={i}>{ch}</span>;
        const t0 = e.t + i * stag, d = e.dur ?? 0.6;
        const p = EASE[e.ease || 'expoOut'](Math.min(1, Math.max(0, (t - t0) / d)));
        return (
          <span key={i} style={{
            display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * (e.dy ?? 60)}px) scale(${1 + (1 - p) * ((e.scale ?? 1) - 1)})`,
            filter: e.blur ? `blur(${(1 - p) * e.blur}px)` : undefined,
          }}>{ch === ' ' ? ' ' : ch}</span>
        );
      })}
    </div>
  );
};

export const ScrollStory: React.FC<ScrollProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ink = p.ink || '#2A1A10';
  const scrollY = keyed(p.scroll, t);
  const tops: number[] = [];
  p.sections.reduce((acc, s) => { tops.push(acc); return acc + s.height; }, 0);
  const navH = p.nav ? 64 : 0;

  const media = p.sections.flatMap((s, si) => (s.media || []).map((m) => ({ m, top: tops[si] })))
    .sort((a, b) => (a.m.plane ?? 0) - (b.m.plane ?? 0));
  const words = (plane: 'back' | 'front') => p.sections.flatMap((s, si) => (s.words || [])
    .filter((w) => (w.plane || 'back') === plane)
    .map((w, wi) => <WordView key={`${s.id}-${plane}-${wi}`} w={w} t={t} ink={ink}
      dy={tops[si] + (tops[si] - scrollY) * (w.parallax ?? 0)} />));

  return (
    <AbsoluteFill style={{ background: p.background || '#EFE6DA', overflow: 'hidden' }}>
      <FontLoader fonts={p.fonts || [{ family: 'Playfair Display', weights: [400, 700, 900] }, { family: 'Inter', weights: [400, 600] }]}>
        <div style={{ position: 'absolute', left: 0, top: navH - scrollY, width: '100%' }}>
          {p.sections.map((s, si) => (
            <div key={s.id} style={{ position: 'absolute', left: 0, top: tops[si], width: '100%', height: s.height, background: s.bg }} />
          ))}
          {words('back')}
          {media.map(({ m, top }, i) => {
            const map = m.map || [[0, 1], [p.duration_sec, m.count]];
            const idx = Math.round(Math.min(m.count, Math.max(1, lin(map, t))));
            const op = m.opacity ? lin(m.opacity, t) : 1;
            const par = (top - scrollY) * (m.parallax ?? 0);
            return (
              <Img key={i} src={staticFile(`${m.dir}/${pad(idx)}.${m.ext || 'png'}`)} style={{
                position: 'absolute', left: m.x, top: top + m.y + par, width: m.w, height: m.h, objectFit: m.fit || 'contain', opacity: op,
              }} />
            );
          })}
          {words('front')}
          {p.sections.map((s, si) => (s.cards || []).map((c, ci) => {
            const a = c.enter !== undefined ? EASE.backOut(Math.min(1, Math.max(0, (t - c.enter) / 0.5))) : 1;
            return (
              <div key={`${s.id}-c${ci}`} style={{
                position: 'absolute', left: c.x, top: tops[si] + c.y + (1 - a) * 50, width: c.w, height: c.h, opacity: Math.min(1, a),
                background: c.color || '#FBF7F1', borderRadius: 18, boxShadow: '0 18px 40px rgba(60,40,20,.18)', overflow: 'hidden',
                fontFamily: '"Inter", sans-serif', color: ink, display: 'flex', flexDirection: 'column',
              }}>
                {c.img && <Img src={staticFile(c.img)} style={{ width: '100%', height: '68%', objectFit: 'cover' }} />}
                <div style={{ padding: '10px 14px', fontSize: 18, fontWeight: 600 }}>{c.title}</div>
                <div style={{ padding: '0 14px', fontSize: 15, opacity: 0.7 }}>{c.price}</div>
              </div>
            );
          }))}
        </div>
        {p.nav && (
          <div style={{
            position: 'absolute', left: 0, top: 0, width: '100%', height: navH, display: 'flex', alignItems: 'center', padding: '0 40px',
            boxSizing: 'border-box', fontFamily: `"${p.nav.family || 'Inter'}", sans-serif`, color: ink, background: 'rgba(239,230,218,.72)',
            backdropFilter: 'blur(8px)', fontSize: 17, letterSpacing: '0.04em', zIndex: 10,
          }}>
            <div style={{ fontWeight: 600, flex: 1 }}>{p.nav.brand}</div>
            {(p.nav.items || []).map((x) => <div key={x} style={{ marginLeft: 28, opacity: 0.75 }}>{x}</div>)}
            {p.nav.cta && <div style={{ marginLeft: 28, padding: '8px 18px', borderRadius: 99, background: ink, color: '#F5EEE4', fontSize: 15 }}>{p.nav.cta}</div>}
          </div>
        )}
      </FontLoader>
    </AbsoluteFill>
  );
};
