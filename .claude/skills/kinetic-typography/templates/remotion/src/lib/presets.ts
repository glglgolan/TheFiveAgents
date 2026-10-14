// Presets live as plain JSON at the skill root (presets/*.json) — add a file there and register it here.
import type { Preset } from './types';
import emerge from '../../../../presets/emerge-from-screen.json';
import orbit from '../../../../presets/orbit-behind-product.json';
import shatter from '../../../../presets/shatter-to-particles.json';
import assemble from '../../../../presets/assemble-tagline.json';
import breathe from '../../../../presets/breathe.json';
import drop from '../../../../presets/drop-with-gravity.json';
import drawOn from '../../../../presets/draw-on.json';
import drawOnOff from '../../../../presets/draw-on-off.json';

export const PRESETS: Record<string, Preset> = {
  'emerge-from-screen': emerge as Preset,
  'orbit-behind-product': orbit as Preset,
  'shatter-to-particles': shatter as Preset,
  'assemble-tagline': assemble as Preset,
  breathe: breathe as Preset,
  'drop-with-gravity': drop as Preset,
  'draw-on': drawOn as Preset,
  'draw-on-off': drawOnOff as Preset,
};
