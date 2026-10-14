// S5/S6 pearl field: the pearls from the giraffe's snapped strand lying on the runway (world coords, runway plane).
// The penguin's slide kicks the pearls near her path (deterministic per-pearl ballistic sim with bounces/rolling,
// falling off the lip / the end drop). Split into back (behind her feet line) and front layers.
import React from 'react';
import { C } from '../../lib/style';
import { clamp } from '../../lib/motion';
import { hash01, rand } from '../../lib/rng';
import { GROUND_Y, RUNWAY_END_X, SURFACE_FAR_Y, SURFACE_NEAR_Y } from '../../sets/Runway';
import { HERO_PEARL_X, LAUNCH, penX, SLIP } from './motion';

export interface Pearl { x: number; z: number; r: number; seed: number }

const Z0 = SURFACE_FAR_Y + 7, Z1 = SURFACE_NEAR_Y - 5;
export const FIELD: Pearl[] = (() => {
  const r = rand('s5-pearls');
  const out: Pearl[] = [];
  let i = 0;
  while (out.length < 205) {
    const x = 1000 + Math.pow(r(), 0.8) * 2880;
    // sparse stragglers before 1200
    if (x < 1200 && r() > 0.25) continue;
    const z = Z0 + r() * (Z1 - Z0);
    const depth = (z - Z0) / (Z1 - Z0);
    out.push({ x, z, r: 5.2 + depth * 3.6 + r() * 1.6, seed: i++ });
  }
  out.push({ x: HERO_PEARL_X, z: GROUND_Y + 3, r: 8.5, seed: 999 });
  return out;
})();

const REACH = 42; // depth half-band her feet sweep
/** Frame each pearl gets kicked (or Infinity). */
const KICK: number[] = FIELD.map((p) => {
  if (Math.abs(p.z - GROUND_Y) > REACH) return Infinity;
  if (p.seed === 999) return SLIP - 3;
  for (let f = SLIP - 4; f <= LAUNCH; f++) if (penX(f) + 46 >= p.x) return f;
  return Infinity;
});

export const SIM_END = 1224;
interface PS { x: number; z: number; h: number; spin: number; gone: boolean }
const cache = new Map<number, PS[]>();

const simulate = (frame: number): PS[] => {
  const F = Math.min(Math.floor(frame), SIM_END);
  const hit = cache.get(F);
  if (hit) return hit;
  const res = FIELD.map((p, i): PS => {
    const kf = KICK[i];
    if (F < kf) return { x: p.x, z: p.z, h: 0, spin: 0, gone: false };
    const r = rand(`pk${p.seed}`);
    const vP = Math.max(4, penX(kf + 1) - penX(kf));
    const hero = p.seed === 999;
    let vx = hero ? 3.5 : vP * (0.55 + 0.75 * r());
    let vz = (p.z - GROUND_Y) * 0.05 + (r() - 0.5) * 3.2;
    let vh = hero ? 0 : -(5 + 15 * r()) * clamp(vP / 40 + 0.35, 0.35, 1.4);
    let x = p.x, z = p.z, h = 0, spin = 0, gone = false;
    for (let f = kf; f < F; f++) {
      if (hero && f === SLIP) { vx = 34; vh = -9; } // shoots out from under her foot
      x += vx; z += vz; h += vh; spin += vx / p.r;
      const onDeck = x < RUNWAY_END_X && z > SURFACE_FAR_Y && z < SURFACE_NEAR_Y;
      vh += 1.35;
      if (onDeck && h >= 0) {
        h = 0;
        if (vh > 2.5) { vh = -vh * 0.42; vx *= 0.8; } else { vh = 0; vx *= 0.92; vz *= 0.88; }
      }
      if (h > 900) { gone = true; break; }
    }
    return { x, z, h, spin, gone };
  });
  if (cache.size > 64) cache.clear();
  cache.set(F, res);
  return res;
};

/** World-space state of every pearl at a frame (for other shots / debugging). */
export const pearlsAt = (frame: number) => simulate(frame).map((s, i) => ({ ...s, r: FIELD[i].r }));

const n1 = (v: number) => Math.round(v * 10) / 10;

/** One pearl, centre (cx, cy). */
export const PearlDot: React.FC<{ cx: number; cy: number; r: number; tw?: number; spin?: number }> = ({ cx, cy, r, tw = 0, spin = 0 }) => (
  <g>
    <circle cx={n1(cx)} cy={n1(cy)} r={r} fill={C.pearlShade} stroke={C.ink} strokeWidth={Math.max(1.4, r * 0.2)} />
    <circle cx={n1(cx - r * 0.16)} cy={n1(cy - r * 0.18)} r={r * 0.7} fill={C.pearl} />
    <circle cx={n1(cx - r * 0.36 + Math.sin(spin) * r * 0.05)} cy={n1(cy - r * 0.38)} r={Math.max(1.2, r * 0.27)} fill={C.white} />
    {tw > 0.05 && (
      <path d={`M${n1(cx - r * 0.36)} ${n1(cy - r * 0.38 - r * 2.2 * tw)} L${n1(cx - r * 0.36 + r * 0.3)} ${n1(cy - r * 0.38)} L${n1(cx - r * 0.36)} ${n1(cy - r * 0.38 + r * 2.2 * tw)} L${n1(cx - r * 0.36 - r * 0.3)} ${n1(cy - r * 0.38)} Z M${n1(cx - r * 0.36 - r * 2.2 * tw)} ${n1(cy - r * 0.38)} L${n1(cx - r * 0.36)} ${n1(cy - r * 0.38 - r * 0.3)} L${n1(cx - r * 0.36 + r * 2.2 * tw)} ${n1(cy - r * 0.38)} L${n1(cx - r * 0.36)} ${n1(cy - r * 0.38 + r * 0.3)} Z`}
        fill={C.white} />
    )}
  </g>
);

/**
 * Pearls in world coords (draw inside runwayTransform). layer 'back' = depth z < splitZ (behind the character's feet),
 * 'front' = the rest. Culls to the visible world range [camX-100, camX+1920/zoom+100].
 */
export const PearlField: React.FC<{ frame: number; camX: number; zoom?: number; layer: 'back' | 'front'; splitZ?: number; dim?: number }> = ({
  frame, camX, zoom = 1, layer, splitZ = GROUND_Y + 2, dim = 0,
}) => {
  const st = simulate(frame);
  const half = 960 / zoom + 120;
  const cx = camX + 960;
  const els: React.ReactNode[] = [];
  st.forEach((s, i) => {
    if (s.gone) return;
    const p = FIELD[i];
    const front = s.z >= splitZ;
    if ((layer === 'front') !== front) return;
    if (Math.abs(s.x - cx) > half) return;
    const onDeck = s.x < RUNWAY_END_X && s.z > SURFACE_FAR_Y && s.z < SURFACE_NEAR_Y;
    const air = clamp(-s.h / 60);
    if (onDeck) {
      els.push(<ellipse key={`s${i}`} cx={n1(s.x + 2)} cy={n1(s.z + 1)} rx={p.r * (1.15 - air * 0.5)} ry={p.r * 0.32 * (1 - air * 0.5)}
        fill={C.ink} opacity={0.55 * (1 - air * 0.7)} />);
    }
    // seeded twinkles on resting pearls
    const per = 90, ph = Math.floor(hash01('ptw', p.seed) * per);
    const k = (frame + ph) % per;
    const tw = s.h === 0 && k < 6 ? Math.sin((k / 6) * Math.PI) : 0;
    els.push(<PearlDot key={i} cx={s.x} cy={s.z + s.h - p.r} r={p.r} tw={tw} spin={s.spin} />);
  });
  return <g opacity={1 - dim}>{els}</g>;
};
