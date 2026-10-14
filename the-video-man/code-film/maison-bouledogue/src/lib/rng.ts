import seedrandom from 'seedrandom';
import { createNoise2D } from 'simplex-noise';

/** Deterministic PRNG: rand(seed)() -> [0,1). */
export const rand = (seed: string | number) => seedrandom(String(seed));
/** Single deterministic value in [0,1) for a key. */
export const hash01 = (...keys: (string | number)[]) => seedrandom(keys.join('|'))();

const noiseCache = new Map<string, (x: number, y: number) => number>();
/** Seeded 2D simplex noise in [-1,1]. */
export const noise2 = (seed: string | number, x: number, y: number) => {
  const k = String(seed);
  let n = noiseCache.get(k);
  if (!n) { n = createNoise2D(seedrandom(k)); noiseCache.set(k, n); }
  return n(x, y);
};
