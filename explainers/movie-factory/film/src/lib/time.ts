import tl from '../data/timeline.json';
import beats from '../data/beats.json';

export const FPS = 24;
export const W = 1080;
export const H = 1920;
export const TOTAL: number = tl.total;
export const DUR_FRAMES = Math.ceil(TOTAL * FPS);

type Line = { id: string; stage: string; start: number; end: number };
export const LINES = tl.lines as Line[];
const EVENTS = tl.events as { type: string; t: number; stage?: number; dur?: number }[];

// the thread pulls → paper tears → next sheet lands, all within TEAR seconds after each pull
export const PULLS = EVENTS.filter((e) => e.type === 'pull').map((e) => e.t);
export const TEAR = 1.0;
export const SEWS = EVENTS.filter((e) => e.type === 'sew');
export const stageStart = (i: number) => (i === 0 ? 0 : PULLS[i - 1]);

/** phrase start time (global seconds) — derived from the approved VO by tools/beats.py */
export const beat = (line: number, idx: number): number => (beats as any)['s' + line][idx].t;

/** stop-motion: the paper world moves at 12fps (every 2nd frame of 24) */
export const stepFrame = (frame: number) => Math.floor(frame / 2) * 2;
export const tq = (frame: number) => stepFrame(frame) / FPS;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const easeOutBack = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** deterministic hash → [0,1) */
export const rand = (...k: number[]) => {
  let h = 2166136261;
  for (const v of k) { h ^= Math.floor(v * 1000) | 0; h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
