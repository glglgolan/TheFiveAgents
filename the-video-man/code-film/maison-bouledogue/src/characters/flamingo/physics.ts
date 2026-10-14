/** Cheap deterministic spring integrators over a precomputed driver series (one value per frame). */

/**
 * Damped spring follower chasing `target[i]` (linearly interpolated between frames, 2 substeps).
 * Returns the LAG series (follower - target) for every index. Starts at rest on target[0].
 */
export const lagSeries = (target: number[], k: number, c: number): number[] => {
  const n = target.length;
  const out = new Array<number>(n).fill(0);
  if (n === 0) return out;
  let x = target[0], v = 0;
  const sub = 2, dt = 1 / 24 / sub;
  for (let i = 1; i < n; i++) {
    for (let s = 1; s <= sub; s++) {
      const tg = target[i - 1] + ((target[i] - target[i - 1]) * s) / sub;
      const a = k * (tg - x) - c * v;
      v += a * dt; x += v * dt;
    }
    out[i] = x - target[i];
  }
  return out;
};

/** Sample an array at index from the end (0 = last), clamped. */
export const back = (arr: number[], i: number) => arr[Math.max(0, arr.length - 1 - Math.round(i))] ?? 0;
