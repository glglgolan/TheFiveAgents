// S1 — title shot geometry + timing (all frames absolute; S1 = 0..192).
import { clamp, ease, track, wobble } from '../../lib/motion';
import { hash01 } from '../../lib/rng';

export const CURTAIN_TOP = 120;
export const HEM_Y = 968;
export const STAGE_LIP = 985;
export const SEAM_X = 960;
export const OUTER_L = 70;
export const OUTER_R = 1850;

export const SPOT_ON = 12;
export const SPOT_SETTLE = 48;
export const FLASHES = [132, 141, 147, 158];
export const SUB_IN = 116;
export const WHIP_START = 178;
export const SHOT_END = 192;

// ---- title layout ------------------------------------------------------------------------
/** Approx. Georgia-Bold uppercase advance widths (em). Slots are centred, so small errors don't matter. */
const ADV: Record<string, number> = { M: 0.93, A: 0.74, I: 0.42, S: 0.62, O: 0.8, N: 0.8, B: 0.73, U: 0.8, L: 0.66, E: 0.7, D: 0.8, G: 0.78 };

export type Letter = { ch: string; x: number; base: number; size: number; land: number; line: 0 | 1; idx: number; group: number };

const layLine = (word: string, size: number, track: number, base: number, cx: number) => {
  const ws = word.split('').map((c) => (ADV[c] ?? 0.72) * size + track * size);
  const total = ws.reduce((a, b) => a + b, 0) - track * size;
  let x = cx - total / 2;
  return word.split('').map((ch, i) => { const c = x + (ws[i] - track * size) / 2; x += ws[i]; return { ch, x: c, base, size }; });
};

export const LINE1_BASE = 420;
export const LINE2_BASE = 662;
export const LINE1_SIZE = 160;
export const LINE2_SIZE = 186;
/**
 * The timeline has 13 thumps (56,60,...,104) but the title has 16 letters. Mapping: M A I S O N (6 thumps),
 * B O U L E D (6 thumps), then "OGUE" slams in together on the 13th (104) as the finale — bigger shake.
 */
export const LETTERS: Letter[] = (() => {
  const l1 = layLine('MAISON', LINE1_SIZE, 0.22, LINE1_BASE, 960);
  const l2 = layLine('BOULEDOGUE', LINE2_SIZE, 0.06, LINE2_BASE, 960);
  const out: Letter[] = [];
  l1.forEach((p, i) => out.push({ ...p, land: 56 + i * 4, line: 0, idx: i, group: i }));
  l2.forEach((p, i) => { const g = Math.min(6 + i, 12); out.push({ ...p, land: 56 + g * 4, line: 1, idx: i, group: g }); });
  return out;
})();
export const LANDS = Array.from({ length: 13 }, (_, i) => 56 + i * 4);

// ---- camera ------------------------------------------------------------------------------
/** Impulses for the camera micro-shake (one per thump, the finale stronger). */
export const SHAKE_IMP: [number, number][] = LANDS.map((f, i) => [f, i === 12 ? 1 : 0.38]);

export const camera = (frame: number) => {
  // slow push over the whole shot, then an accelerating rush into the stage during the whip
  const push = track(frame, [[0, 1], [WHIP_START - 4, 1.075, ease.inOut]]);
  const rush = frame > WHIP_START - 4 ? Math.pow(clamp((frame - (WHIP_START - 4)) / (SHOT_END - WHIP_START + 4)), 2.2) * 0.32 : 0;
  const zoom = push + rush;
  const sy = wobble(frame, SHAKE_IMP, 6.5, 9) * 13;
  const sx = wobble(frame, SHAKE_IMP.map(([f, a]) => [f, a * (hash01('s1shx', f) - 0.5) * 2] as [number, number]), 7.5, 10) * 7;
  // flashes jostle the camera a hair
  const fl = wobble(frame, FLASHES.map((f) => [f, 0.25] as [number, number]), 8, 12) * 4;
  return { zoom, sx: sx + fl, sy, cy: 520 };
};

export const camT = (frame: number, depth = 1) => {
  const c = camera(frame);
  const z = 1 + (c.zoom - 1) * depth;
  return `translate(960 ${c.cy}) scale(${z.toFixed(4)}) translate(-960 ${-c.cy}) translate(${(c.sx * depth).toFixed(2)} ${(c.sy * depth).toFixed(2)})`;
};

// ---- spotlight ---------------------------------------------------------------------------
export const spot = (frame: number) => {
  if (frame < SPOT_ON) return { on: 0, x: 330, y: 560, rx: 300, ry: 250 };
  const t = frame - SPOT_ON;
  // clunk: hard on, one dim flicker frame, then steady
  const flick = [1.25, 0.45, 1.05, 0.8, 1][Math.min(t, 4)];
  const x = track(frame, [[SPOT_ON, 330], [20, 420, ease.inOut], [34, 1260, ease.inOut], [44, 900, ease.inOut], [SPOT_SETTLE, 960, ease.out]]);
  const y = track(frame, [[SPOT_ON, 600], [34, 470, ease.inOut], [SPOT_SETTLE, 540, ease.out]]);
  const open = clamp((frame - 46) / 12);
  const o = open <= 0 ? 0 : ease.outBack(open, 1.6);
  const rx = 300 + (900 - 300) * o;
  const ry = 250 + (440 - 250) * o;
  return { on: flick, x, y, rx, ry };
};

// ---- whip ---------------------------------------------------------------------------------
/** Curtain opening 0..1 (anticipation pinch before). */
export const whipOpen = (frame: number) => {
  const t = clamp((frame - (WHIP_START + 1)) / 10);
  return Math.pow(t, 1.7);
};
export const whipPinch = (frame: number) => track(frame, [[WHIP_START - 6, 0], [WHIP_START, 1, ease.out], [WHIP_START + 2, 0, ease.in]]);
