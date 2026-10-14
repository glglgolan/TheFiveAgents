import { interpolate } from 'remotion';

/** Characters animate on twos. */
export const onTwos = (frame: number) => Math.floor(frame / 2) * 2;

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---- easings (t in [0,1]) ----
export const ease = {
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
  outBack: (t: number, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t: number, s = 1.9) => (s + 1) * t * t * t - s * t * t,
  outElastic: (t: number) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  outBounce: (t: number) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};
export type EaseFn = (t: number) => number;

/**
 * Keyframe track. keys: [frame, value, easeIntoThisKey?][]
 * Holds before first / after last key.
 */
export const track = (frame: number, keys: [number, number, EaseFn?][]) => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (frame <= f1) {
      const t = clamp((frame - f0) / Math.max(1e-6, f1 - f0));
      return lerp(v0, v1, (e ?? ease.inOut)(t));
    }
  }
  return keys[keys.length - 1][1];
};

/**
 * Damped-spring response to a set of impulses (analytic, cheap, deterministic).
 * impulses: [frame, amplitude][]; returns summed damped sine.
 */
export const wobble = (frame: number, impulses: [number, number][], freqHz = 2.2, decay = 3.5, fps = 24) => {
  let v = 0;
  for (const [f0, a] of impulses) {
    if (frame < f0) continue;
    const t = (frame - f0) / fps;
    v += a * Math.exp(-decay * t) * Math.sin(2 * Math.PI * freqHz * t);
  }
  return v;
};

/**
 * Lagged follower: simulates a damped spring chasing target(f) by integrating from `from` to `frame`.
 * Use for pendulums / dangling accessories driven by body motion. Cost O(frame-from); keep windows short (<=240).
 */
export const springFollow = (frame: number, target: (f: number) => number, from: number, k = 90, c = 9, substeps = 2) => {
  let x = target(from), v = 0;
  const dt = 1 / 24 / substeps;
  for (let f = from; f < frame; f++) {
    for (let s = 0; s < substeps; s++) {
      const tgt = target(f + s / substeps);
      const a = k * (tgt - x) - c * v;
      v += a * dt; x += v * dt;
    }
  }
  return x;
};

/** Pendulum angle (deg) for a dangling item given the horizontal acceleration of its pivot, via springFollow. */
export const pendulum = (frame: number, pivotX: (f: number) => number, from: number, gain = 0.6, k = 60, c = 5) => {
  const accel = (f: number) => -(pivotX(f + 1) - 2 * pivotX(f) + pivotX(f - 1)) * gain * 24;
  return springFollow(frame, accel, from, k, c);
};

export const mapRange = (v: number, a: number, b: number, c: number, d: number) =>
  interpolate(v, [a, b], [c, d], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
