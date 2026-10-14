// Renderer-agnostic animation core: preset resolution → layout → per-unit keyframe evaluation.
import { gsap } from 'gsap';
import { PRESETS } from './presets';
import type { DrawState, Keyframe, Layer, LayerState, Plane, Preset, UnitState } from './types';

const LAYER_PROPS = ['x', 'y', 'tracking', 'orbit', 'ring', 'lrx', 'lry', 'lrz', 'lscale', 'lopacity', 'draw'] as const;
const UNIT_PROPS = ['dx', 'dy', 'z', 'rx', 'ry', 'rz', 'scale', 'opacity', 'blur'] as const;
type NumProp = (typeof LAYER_PROPS)[number] | (typeof UNIT_PROPS)[number];

const easeCache = new Map<string, (p: number) => number>();
export function ease(name?: string): (p: number) => number {
  const key = name || 'power2.inOut';
  let fn = easeCache.get(key);
  if (!fn) {
    fn = (gsap.parseEase(key) as (p: number) => number) || ((p: number) => p);
    easeCache.set(key, fn);
  }
  return fn;
}

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Merge preset + preset_params + explicit fields. Explicit layer.keyframes win over preset keyframes. */
export function resolveLayer(layer: Layer): Layer {
  const preset: Preset | undefined = layer.preset ? PRESETS[layer.preset] : undefined;
  if (layer.preset && !preset) console.warn(`[kinetic-typography] unknown preset "${layer.preset}"`);
  const dur = Math.max(0.001, layer.to - layer.from);
  const presetKfs = (preset?.keyframes || []).map((k) => ({ ...k, t: preset?.normalized ? k.t * dur : k.t }));
  const p = layer.preset_params || {};
  return {
    ...layer,
    plane: layer.plane ?? p.plane ?? preset?.plane ?? 'front',
    keyframes: layer.keyframes?.length ? layer.keyframes : presetKfs,
    stagger: layer.stagger ?? p.stagger ?? preset?.stagger,
    scatter: layer.scatter ?? p.scatter ?? preset?.scatter,
    ring: layer.ring ?? p.ring ?? preset?.ring,
  };
}

export function splitUnits(layer: Layer): string[] {
  const mode = layer.split || 'letter';
  if (mode === 'none') return [layer.text];
  if (mode === 'word') return layer.text.split(/(\s+)/).filter((s) => s.length);
  return Array.from(layer.text);
}

export interface Slot { char: string; cx: number; cy: number; w: number }

/** Absolute line layout (both renderers share it). `measure` returns advance width in px. */
export function layoutUnits(layer: Layer, units: string[], measure: (s: string) => number, frameW: number,
  trackingEm: number): Slot[] {
  const size = layer.font.size;
  const track = trackingEm * size;
  const maxW = (layer.max_width ?? 0.92) * frameW;
  const lh = (layer.line_height ?? 1.12) * size;
  // group units into words so wrapping only happens on spaces
  type Item = { char: string; w: number; space: boolean };
  const items: Item[] = units.map((u) => ({ char: u, w: measure(u) + track, space: /^\s+$/.test(u) }));
  const lines: Item[][] = [[]];
  let lineW = 0;
  let word: Item[] = [];
  let wordW = 0;
  const flushWord = () => {
    if (!word.length) return;
    if (lineW + wordW > maxW && lines[lines.length - 1].length) {
      // drop trailing spaces on the wrapped line
      const cur = lines[lines.length - 1];
      while (cur.length && cur[cur.length - 1].space) lineW -= cur.pop()!.w;
      lines.push([]);
      lineW = 0;
    }
    lines[lines.length - 1].push(...word);
    lineW += wordW;
    word = [];
    wordW = 0;
  };
  for (const it of items) {
    if (it.space) {
      flushWord();
      lines[lines.length - 1].push(it);
      lineW += it.w;
    } else {
      word.push(it);
      wordW += it.w;
    }
  }
  flushWord();
  const slots: Slot[] = [];
  const totalH = lines.length * lh;
  lines.forEach((line, li) => {
    const lw = line.reduce((a, b) => a + b.w, 0) - track;
    let x = -lw / 2;
    const cy = -totalH / 2 + lh * (li + 0.5);
    for (const it of line) {
      slots.push({ char: it.char, cx: x + (it.w - track) / 2, cy, w: it.w });
      x += it.w;
    }
  });
  return slots;
}

function valueAt(kfs: Keyframe[], prop: NumProp, t: number, dflt: number): number {
  let prev: Keyframe | undefined;
  for (const k of kfs) {
    const v = k[prop];
    if (v === undefined) continue;
    if (k.t >= t) {
      if (!prev) return v;
      const pv = prev[prop] as number;
      const span = k.t - prev.t;
      const p = span <= 0 ? 1 : Math.min(1, Math.max(0, (t - prev.t) / span));
      return pv + (v - pv) * ease(k.ease)(p);
    }
    prev = k;
  }
  return prev ? (prev[prop] as number) : dflt;
}

function planeAt(kfs: Keyframe[], t: number, dflt: Plane): Plane {
  let cur = dflt;
  for (const k of kfs) if (k.plane && k.t <= t) cur = k.plane;
  return cur;
}

function staggerOrder(n: number, from: string, seed: number): number[] {
  const idx = [...Array(n).keys()];
  const mid = (n - 1) / 2;
  switch (from) {
    case 'end': return idx.map((i) => n - 1 - i);
    case 'center': return idx.map((i) => Math.abs(i - mid));
    case 'edges': return idx.map((i) => mid - Math.abs(i - mid));
    case 'random': {
      const r = mulberry32(seed);
      const order = idx.map((i) => ({ i, r: r() })).sort((a, b) => a.r - b.r);
      const out = new Array(n);
      order.forEach((o, rank) => (out[o.i] = rank));
      return out;
    }
    default: return idx;
  }
}

/** Per-unit keyframes: base (or per-unit override) + seeded scatter offsets on the chosen keyframes. */
function unitKeyframes(layer: Layer, i: number): Keyframe[] {
  const override = layer.units?.[String(i)];
  if (override) return [...override.keyframes].sort((a, b) => a.t - b.t);
  const base = (layer.keyframes || []).map((k) => ({ ...k }));
  const sc = layer.scatter;
  if (sc) {
    const r = mulberry32((sc.seed ?? 7) * 1000 + i * 9973);
    for (const ki of sc.at) {
      const k = base[ki];
      if (!k) continue;
      for (const p of ['dx', 'dy', 'z', 'rx', 'ry', 'rz'] as const) {
        const amp = sc[p];
        if (amp) k[p] = (k[p] ?? 0) + (r() * 2 - 1) * amp;
      }
      if (sc.scale) k.scale = (k.scale ?? 1) + (r() * 2 - 1) * sc.scale;
    }
  }
  return base.sort((a, b) => a.t - b.t);
}

const DEFAULTS: Record<NumProp, number> = {
  x: 0.5, y: 0.5, tracking: 0, orbit: 0, ring: 0, lrx: 0, lry: 0, lrz: 0, lscale: 1, lopacity: 1, draw: 1,
  dx: 0, dy: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1, opacity: 1, blur: 0,
};

/** Evaluate a resolved layer at absolute time `time` (seconds). Returns null outside [from, to]. */
export function evaluateLayer(layer: Layer, time: number, frameW: number, frameH: number,
  measure: (s: string) => number): LayerState | null {
  if (time < layer.from || time > layer.to) return null;
  const t = time - layer.from;
  const kfs = [...(layer.keyframes || [])].sort((a, b) => a.t - b.t);
  const d = { ...DEFAULTS, x: layer.anchor?.x ?? 0.5, y: layer.anchor?.y ?? 0.5, tracking: layer.font.tracking ?? 0 };
  const L = (p: (typeof LAYER_PROPS)[number]) => valueAt(kfs, p, t, d[p]);

  const units = splitUnits(layer);
  const slots = layoutUnits(layer, units, measure, frameW, L('tracking'));
  const n = slots.length;
  const st = layer.stagger;
  const order = st ? staggerOrder(n, st.from || 'start', st.seed ?? 3) : new Array(n).fill(0);
  const orbit = L('orbit');
  const ringAmt = layer.ring ? L('ring') : 0;
  const R = layer.ring?.radius ?? 0;
  const tilt = ((layer.ring?.tilt ?? 0) * Math.PI) / 180;
  const arc = layer.ring?.arc ?? 360;
  const nonSpace = slots.filter((s) => s.char.trim()).length || 1;

  let k = 0;
  const out: UnitState[] = slots.map((s, i) => {
    const ut = t - (st ? st.each * order[i] : 0);
    const ukfs = unitKeyframes(layer, i);
    const U = (p: (typeof UNIT_PROPS)[number]) => valueAt(ukfs, p, ut, d[p]);
    let x = s.cx, y = s.cy, z = 0, ry = 0;
    if (ringAmt > 0 && s.char.trim()) {
      const step = arc >= 360 ? 360 / nonSpace : arc / Math.max(1, nonSpace - 1);
      const a = ((orbit + (arc >= 360 ? 0 : -arc / 2) + step * k) * Math.PI) / 180;
      const rx_ = R * Math.sin(a), rz_ = R * Math.cos(a), ry_ = -R * Math.sin(tilt) * Math.cos(a);
      x = x + (rx_ - x) * ringAmt;
      y = y + (ry_ - y) * ringAmt;
      z = rz_ * ringAmt;
      if (layer.ring?.face === 'outward') ry = (a * 180) / Math.PI * ringAmt;
    }
    if (s.char.trim()) k++;
    const zz = z + U('z');
    let plane = planeAt(ukfs, ut, layer.plane || 'front');
    if (plane === 'auto') plane = zz >= 0 ? 'front' : 'back';
    return {
      char: s.char,
      x: x + U('dx'), y: y + U('dy'), z: zz,
      rx: U('rx'), ry: ry + U('ry'), rz: U('rz'),
      scale: U('scale'), opacity: Math.max(0, Math.min(1, U('opacity'))), blur: Math.max(0, U('blur')),
      plane,
    };
  });

  return {
    ax: L('x') * frameW, ay: L('y') * frameH,
    lrx: L('lrx'), lry: L('lry'), lrz: L('lrz'), lscale: L('lscale'), lopacity: L('lopacity'),
    units: out,
  };
}

/** Draw layers: one stroke group, layer-level props only (x, y, lrz, lscale, lopacity, draw, plane). */
export function evaluateDraw(layer: Layer, time: number, frameW: number, frameH: number): DrawState | null {
  if (time < layer.from || time > layer.to) return null;
  const t = time - layer.from;
  const kfs = [...(layer.keyframes || [])].sort((a, b) => a.t - b.t);
  const d = { ...DEFAULTS, x: layer.anchor?.x ?? 0.5, y: layer.anchor?.y ?? 0.5 };
  const L = (p: (typeof LAYER_PROPS)[number]) => valueAt(kfs, p, t, d[p]);
  const pl = planeAt(kfs, t, layer.plane || 'front');
  return {
    ax: L('x') * frameW, ay: L('y') * frameH, lrz: L('lrz'), lscale: L('lscale'),
    lopacity: Math.max(0, Math.min(1, L('lopacity'))), draw: Math.max(0, Math.min(1, L('draw'))),
    plane: pl === 'back' ? 'back' : 'front',
  };
}
