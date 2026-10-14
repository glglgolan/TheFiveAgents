// S1 — dark audience of assorted mammals (foreground silhouettes), flashbulb starbursts, exposure bump,
// and the whip-pan streak overlay shared with the head of S2.
import React from 'react';
import { C, W, H } from '../../lib/style';
import { onTwos, clamp } from '../../lib/motion';
import { hash01, noise2 } from '../../lib/rng';
import { FLASHES } from './geom';

type Kind = 'bear' | 'rabbit' | 'cat' | 'hat' | 'mouse' | 'horn' | 'plain';
const KINDS: Kind[] = ['bear', 'rabbit', 'cat', 'hat', 'mouse', 'horn', 'plain', 'cat', 'bear', 'hat', 'rabbit', 'mouse'];

type Head = { x: number; y: number; r: number; kind: Kind; row: number; i: number };
const HEADS: Head[] = (() => {
  const out: Head[] = [];
  for (let row = 0; row < 2; row++) {
    const n = row === 0 ? 13 : 11;
    for (let i = 0; i < n; i++) {
      const h = hash01('aud', row, i);
      out.push({
        x: -60 + (i + 0.5) * ((W + 120) / n) + (h - 0.5) * 60 + (row ? 70 : 0),
        y: row === 0 ? 1005 : 1085,
        r: (row === 0 ? 44 : 60) + h * 10,
        kind: KINDS[Math.floor(hash01('audk', row, i) * KINDS.length)],
        row, i,
      });
    }
  }
  return out;
})();

/** Which head holds the camera for each flash. */
const FLASH_AT = FLASHES.map((f, k) => HEADS.filter((h) => h.row === 0)[[2, 9, 5, 11][k]]);

const ears = (k: Kind, r: number) => {
  switch (k) {
    case 'bear': return `M${-r * 0.75} ${-r * 0.55} m-${r * 0.3} 0 a${r * 0.3} ${r * 0.3} 0 1 0 ${r * 0.6} 0 a${r * 0.3} ${r * 0.3} 0 1 0 -${r * 0.6} 0 M${r * 0.75} ${-r * 0.55} m-${r * 0.3} 0 a${r * 0.3} ${r * 0.3} 0 1 0 ${r * 0.6} 0 a${r * 0.3} ${r * 0.3} 0 1 0 -${r * 0.6} 0`;
    case 'mouse': return `M${-r * 0.85} ${-r * 0.6} m-${r * 0.5} 0 a${r * 0.5} ${r * 0.5} 0 1 0 ${r} 0 a${r * 0.5} ${r * 0.5} 0 1 0 -${r} 0 M${r * 0.85} ${-r * 0.6} m-${r * 0.5} 0 a${r * 0.5} ${r * 0.5} 0 1 0 ${r} 0 a${r * 0.5} ${r * 0.5} 0 1 0 -${r} 0`;
    case 'rabbit': return `M${-r * 0.5} ${-r * 0.6} Q${-r * 0.9} ${-r * 2.6} ${-r * 0.15} ${-r * 2.3} Q${-r * 0.1} ${-r * 1.2} ${-r * 0.1} ${-r * 0.7} Z M${r * 0.2} ${-r * 0.7} Q${r * 0.6} ${-r * 2.4} ${r * 0.9} ${-r * 2.0} Q${r * 0.8} ${-r * 1.1} ${r * 0.6} ${-r * 0.5} Z`;
    case 'cat': return `M${-r * 0.9} ${-r * 0.3} L${-r * 0.7} ${-r * 1.35} L${-r * 0.1} ${-r * 0.85} Z M${r * 0.9} ${-r * 0.3} L${r * 0.7} ${-r * 1.35} L${r * 0.1} ${-r * 0.85} Z`;
    case 'hat': return `M${-r * 1.2} ${-r * 0.7} L${r * 1.2} ${-r * 0.7} L${r * 1.2} ${-r * 0.85} L${r * 0.65} ${-r * 0.85} L${r * 0.6} ${-r * 2.1} L${-r * 0.6} ${-r * 2.1} L${-r * 0.65} ${-r * 0.85} L${-r * 1.2} ${-r * 0.85} Z`;
    case 'horn': return `M${-r * 0.5} ${-r * 0.7} Q${-r * 1.4} ${-r * 1.2} ${-r * 1.2} ${-r * 1.9} Q${-r * 0.8} ${-r * 1.2} ${-r * 0.1} ${-r * 0.95} Z M${r * 0.5} ${-r * 0.7} Q${r * 1.4} ${-r * 1.2} ${r * 1.2} ${-r * 1.9} Q${r * 0.8} ${-r * 1.2} ${r * 0.1} ${-r * 0.95} Z`;
    default: return '';
  }
};

export const Audience: React.FC<{ frame: number; rim: number }> = ({ frame, rim }) => {
  const f2 = onTwos(frame);
  return (
    <g>
      {HEADS.map((h) => {
        const bob = noise2('ab', h.row * 20 + h.i, f2 * 0.03) * 5;
        const tilt = noise2('at', h.row * 20 + h.i, f2 * 0.02) * 6;
        const fi = FLASH_AT.findIndex((q) => q === h);
        const raise = fi >= 0 ? clamp((frame - (FLASHES[fi] - 10)) / 6) * (1 - clamp((frame - FLASHES[fi] - 8) / 8)) : 0;
        const d = `M${-h.r * 1.5} 200 L${-h.r * 1.2} ${h.r * 0.7} Q${-h.r * 1.1} ${h.r * 0.2} ${-h.r * 0.55} ${h.r * 0.45} a${h.r} ${h.r} 0 1 1 ${h.r * 1.1} 0 Q${h.r * 1.1} ${h.r * 0.2} ${h.r * 1.2} ${h.r * 0.7} L${h.r * 1.5} 200 Z`;
        return (
          <g key={`${h.row}-${h.i}`} transform={`translate(${h.x.toFixed(1)} ${(h.y + bob).toFixed(1)}) rotate(${tilt.toFixed(2)})`}>
            <path d={d} fill={h.row ? C.ink : C.navy} />
            <path d={ears(h.kind, h.r)} fill={h.row ? C.ink : C.navy} />
            {/* rim light from the stage */}
            <path d={`M${-h.r * 0.8} ${-h.r * 0.25} A${h.r} ${h.r} 0 0 1 ${h.r * 0.8} ${-h.r * 0.25}`} fill="none" stroke={C.spot} strokeWidth={4} strokeLinecap="round" opacity={rim * (h.row ? 0.35 : 0.6)} transform={`translate(0 ${-h.r * 0.28})`} />
            {raise > 0 && (
              <g transform={`translate(${h.r * 0.2} ${-h.r * 1.2 - raise * 70})`}>
                <path d={`M${h.r * 0.5} 60 L${h.r * 0.4} 10`} stroke={C.navy} strokeWidth={22} strokeLinecap="round" />
                <rect x={-36} y={-26} width={72} height={46} rx={6} fill={C.navy} />
                <circle cx={0} cy={-2} r={14} fill={C.ink} />
                <rect x={-26} y={-52} width={30} height={26} rx={4} fill={C.navy} />
                <rect x={-22} y={-48} width={22} height={16} rx={2} fill={C.pearlShade} opacity={0.6} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Starbursts in screen space (drawn above everything but under the exposure bump). */
export const FlashBursts: React.FC<{ frame: number; toScreen: (x: number, y: number) => { x: number; y: number } }> = ({ frame, toScreen }) => (
  <g>
    {FLASHES.map((f, k) => {
      const t = frame - f;
      if (t < 0 || t > 3) return null;
      const h = FLASH_AT[k];
      const p = toScreen(h.x + h.r * 0.2, h.y - h.r * 1.2 - 70 - 2);
      const s = [1, 0.75, 0.4, 0.15][t];
      const rays: string[] = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + k;
        const L = (i % 2 ? 150 : 320) * s * (0.8 + hash01('ray', k, i) * 0.5);
        const w = i % 2 ? 7 : 13;
        const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
        rays.push(`M${(p.x + nx).toFixed(1)} ${(p.y + ny).toFixed(1)} L${(p.x + Math.cos(a) * L).toFixed(1)} ${(p.y + Math.sin(a) * L).toFixed(1)} L${(p.x - nx).toFixed(1)} ${(p.y - ny).toFixed(1)} Z`);
      }
      return (
        <g key={f}>
          <circle cx={p.x} cy={p.y} r={170 * s} fill="url(#s1flashGlow)" />
          <path d={rays.join(' ')} fill={C.white} opacity={0.95} />
          <circle cx={p.x} cy={p.y} r={34 * s + 8} fill={C.white} />
        </g>
      );
    })}
  </g>
);

export const flashExposure = (frame: number) => {
  let e = 0;
  for (const f of FLASHES) { const t = frame - f; if (t >= 0 && t < 5) e = Math.max(e, [0.42, 0.24, 0.12, 0.05, 0.02][t]); }
  return e;
};

/**
 * Whip-pan streaks: long horizontal flat bars in the backstage palette racing sideways.
 * amount 0..1 covers the frame; speed px/frame (negative = leftward).
 */
export const WhipStreaks: React.FC<{ frame: number; amount: number; speed: number; seed?: string }> = ({ frame, amount, speed, seed = 'whip' }) => {
  if (amount <= 0.001) return null;
  const pal = [C.plum, C.curtainDark, C.navy, C.curtain, C.gold, C.plum, C.teal, C.curtainDark, C.hotPink, C.ink];
  const bars: React.ReactNode[] = [];
  const n = 46;
  for (let i = 0; i < n; i++) {
    const h = hash01(seed, i), h2 = hash01(seed, 'b', i);
    const y = (i / n) * H + (h - 0.5) * 30;
    const hh = 10 + h2 * 60;
    const len = 600 + h * 1600;
    const x = ((((h2 * 4000 + frame * speed * (0.7 + h * 0.6)) % 4000) + 4000) % 4000) - 1000;
    const show = hash01(seed, 'show', i) < amount * 1.1;
    if (!show) continue;
    bars.push(<rect key={i} x={x} y={y} width={len} height={hh} rx={hh / 2} fill={pal[i % pal.length]} opacity={0.55 + 0.45 * amount} />);
  }
  return (
    <g>
      <rect width={W} height={H} fill={C.plum} opacity={clamp(amount * 1.1)} />
      {bars}
      {Array.from({ length: 14 }, (_, i) => {
        const y = hash01(seed, 'l', i) * H;
        const x = ((hash01(seed, 'lx', i) * 3000 + frame * speed * 1.6) % 3000 + 3000) % 3000 - 800;
        return <rect key={'l' + i} x={x} y={y} width={500} height={4} fill={C.spot} opacity={0.7 * amount} />;
      })}
    </g>
  );
};
