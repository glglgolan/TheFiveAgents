// Data contract — mirrors schema/text_layers.schema.json. One format, several renderers (CSS-3D, three.js).

export type Plane = 'back' | 'front' | 'auto';

/** A keyframe. `t` is seconds from the layer's `from` (or 0..1 when the preset is `normalized`).
 *  Layer-level props (evaluated without stagger): x, y, tracking, orbit, ring, lrx, lry, lrz, lscale, lopacity.
 *  Unit-level props (per letter/word, staggered + scattered): dx, dy, z, rx, ry, rz, scale, opacity, blur, plane. */
export interface Keyframe {
  t: number;
  ease?: string; // any GSAP ease string: "power3.out", "expo.inOut", "elastic.out(1,0.4)", "back.out(2)", "steps(6)"…
  // layer level
  x?: number; y?: number; tracking?: number; orbit?: number; ring?: number;
  lrx?: number; lry?: number; lrz?: number; lscale?: number; lopacity?: number;
  draw?: number; // 0..1 stroke draw-on progress (draw layers)
  // unit level
  dx?: number; dy?: number; z?: number; rx?: number; ry?: number; rz?: number;
  scale?: number; opacity?: number; blur?: number;
  plane?: Plane;
}

export interface Stagger { each: number; from?: 'start' | 'end' | 'center' | 'edges' | 'random'; seed?: number }
export interface Scatter {
  at: number[]; // keyframe indices that receive the random offsets
  dx?: number; dy?: number; z?: number; rx?: number; ry?: number; rz?: number; scale?: number; seed?: number;
}
export interface Ring { radius: number; tilt?: number; arc?: number; face?: 'camera' | 'outward' }

export interface FontSpec { family: string; weight?: number; size: number; tracking?: number; italic?: boolean; three_font?: string }

export type Material = 'flat' | 'shadow' | 'extruded' | 'glass' | 'outline';

export interface Layer {
  id: string;
  type?: 'text' | 'draw';
  text: string;
  // draw layers (hand-drawn accents)
  shape?: string;          // built-in: underline, circle, arrow, sparkle, swoosh, star, scribble, bracket
  paths?: string[];        // custom SVG path data in a 0..100 viewBox
  stroke?: string;
  stroke_width?: number;   // px at size
  size?: number;           // px width of the 100-unit viewBox
  aspect?: number;         // viewBox height/width (default 1)
  boil?: number;           // hand-drawn line wobble in px (0 = static)
  // three engine realism
  env?: boolean;           // environment reflections (default true)
  shadow_catcher?: boolean; // soft cast shadow on a backdrop plane behind the letters
  split?: 'letter' | 'word' | 'none';
  font: FontSpec;  // text layers (ignored by draw layers)
  color?: string;
  material?: Material;
  depth?: number; // extrusion depth px (extruded / three)
  plane?: Plane;
  engine?: 'css' | 'three';
  from: number;
  to: number;
  anchor?: { x: number; y: number };
  max_width?: number; // fraction of frame width before wrapping (css, word boundaries)
  line_height?: number;
  preset?: string;
  preset_params?: Partial<Pick<Layer, 'stagger' | 'scatter' | 'ring' | 'plane'>>;
  keyframes?: Keyframe[];
  stagger?: Stagger;
  scatter?: Scatter;
  ring?: Ring;
  units?: Record<string, { keyframes: Keyframe[] }>; // per-unit override by index
}

export interface TypoProps {
  width: number;
  height: number;
  fps: number;
  duration_sec: number;
  plate?: string | null;      // path relative to public dir (the run dir): final.mp4 / keyframes/k3.png
  matte?: string | null;      // folder of RGBA frames 000001.png… (product cutout)
  matteCount?: number;        // filled by render.sh / studio.sh
  background?: string;
  fonts?: string[];
  perspective?: number;       // CSS perspective px (default 1400)
  grain?: { amount: number; size?: number } | null; // film grain on the text/drawing passes to match the plate
  layers: Layer[];
}

export interface Preset {
  normalized?: boolean;
  plane?: Plane;
  keyframes: Keyframe[];
  stagger?: Stagger;
  scatter?: Scatter;
  ring?: Ring;
}

/** Evaluated state of one unit at a frame — renderer-agnostic, pixels relative to the layer anchor. */
export interface UnitState {
  char: string;
  x: number; y: number; z: number;
  rx: number; ry: number; rz: number;
  scale: number; opacity: number; blur: number;
  plane: 'back' | 'front';
}

export interface DrawState { ax: number; ay: number; lrz: number; lscale: number; lopacity: number; draw: number; plane: 'back' | 'front' }

export interface LayerState {
  ax: number; ay: number; // anchor px
  lrx: number; lry: number; lrz: number; lscale: number; lopacity: number;
  units: UnitState[];
}
