#!/usr/bin/env node
// Convert a TTF/OTF (e.g. an OFL Google Font) into three.js typeface JSON so 3D letters (engine:"three")
// use the same family as the CSS layers. Usage: node ttf_to_typeface.mjs <font.ttf> <out.typeface.json> [chars]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const opentype = require(path.resolve(path.dirname(new URL(import.meta.url).pathname), '../templates/remotion/node_modules/opentype.js'));

const [src, out, charsArg] = process.argv.slice(2);
if (!src || !out) { console.error('usage: ttf_to_typeface.mjs <font.ttf> <out.json> [chars]'); process.exit(1); }
const font = opentype.parse(fs.readFileSync(src).buffer.slice(0));
const chars = charsArg || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?&\'"-–—:;ÀÁÂÉÈÊÍÓÔÚÜÇÑ@#%+/אבגדהוזחטיכךלמםנןסעפףצץקרשת';
const glyphs = {};
const r = (n) => Math.round(n);
for (const ch of Array.from(chars)) {
  const g = font.charToGlyph(ch);
  if (!g || (g.index === 0 && ch !== ' ')) continue;
  const o = [];
  for (const c of g.path.commands) {
    if (c.type === 'M') o.push('m', r(c.x), r(c.y));
    else if (c.type === 'L') o.push('l', r(c.x), r(c.y));
    else if (c.type === 'Q') o.push('q', r(c.x), r(c.y), r(c.x1), r(c.y1));
    else if (c.type === 'C') o.push('b', r(c.x), r(c.y), r(c.x1), r(c.y1), r(c.x2), r(c.y2));
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.join(' ') };
}
const json = {
  glyphs, familyName: font.names.fontFamily?.en || path.basename(src), resolution: font.unitsPerEm,
  ascender: font.ascender, descender: font.descender, underlinePosition: font.tables.post?.underlinePosition ?? -100,
  underlineThickness: font.tables.post?.underlineThickness ?? 50,
  boundingBox: { xMin: font.tables.head.xMin, yMin: font.tables.head.yMin, xMax: font.tables.head.xMax, yMax: font.tables.head.yMax },
  original_font_information: { license: 'see source font (OFL)' }, cssFontWeight: 'normal', cssFontStyle: 'normal',
};
fs.writeFileSync(out, JSON.stringify(json));
console.log(`[typeface] ${out} — ${Object.keys(glyphs).length} glyphs from ${path.basename(src)}`);
