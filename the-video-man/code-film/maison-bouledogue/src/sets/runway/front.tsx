// Runway set — foreground: photographers' pit, flashbulb pops, confetti & streamers.
import React from 'react';
import { C, ink } from '../../lib/style';
import { hash01, noise2, rand } from '../../lib/rng';
import { Cam, chain, layerToScreen, layerTransform, Mat, PARALLAX, PB, rot, sc, tr } from './geom';

// ---------------------------------------------------------------- flashes
const FLASH_CURVE = [1, 0.72, 0.45, 0.26, 0.14, 0.07, 0.03];
/** 0..1 flash exposure at `frame` for a list of absolute flash frames (max of overlapping pops). */
export const flashIntensity = (frame: number, flashFrames: number[] = []) => {
  let v = 0;
  for (const f0 of flashFrames) {
    const a = Math.floor(frame - f0);
    if (a >= 0 && a < FLASH_CURVE.length) v = Math.max(v, FLASH_CURVE[a]);
  }
  return v;
};

// ---------------------------------------------------------------- photographers
type PSpecies = 'dog' | 'rabbit' | 'bear' | 'pig' | 'cat' | 'hippo' | 'goat';
const PSP: PSpecies[] = ['dog', 'rabbit', 'bear', 'pig', 'cat', 'hippo', 'goat'];
interface Pho { x: number; s: number; sp: PSpecies; dir: 1 | -1; fedora: boolean; phase: number; raise: number }
const PHOTOGS: Pho[] = (() => {
  const r = rand('photogs');
  const out: Pho[] = [];
  for (let x = -100; x < 1920 + 2600 * PARALLAX.front + 400; x += 250 + r() * 170) {
    out.push({
      x, s: 0.86 + r() * 0.2, sp: PSP[Math.floor(r() * PSP.length)], dir: r() < 0.5 ? 1 : -1,
      fedora: r() < 0.45, phase: r() * 6.28, raise: 0.8 + r() * 0.2,
    });
  }
  return out;
})();
const BASE_Y = 1232;

/** Dish (flash) centre in photographer-local coords. */
const dishLocal = (p: Pho): [number, number] => [p.dir * 40, -350 * p.raise - 10];

const photogMat = (p: Pho, frame: number): Mat => {
  const bob = Math.sin(frame * 0.09 + p.phase) * 4 + noise2('phb', p.phase, frame * 0.03) * 3;
  return chain(tr(p.x, BASE_Y + bob), sc(p.s), rot(Math.sin(frame * 0.05 + p.phase) * 1.5));
};

const visiblePhotogs = (cam: Cam) =>
  PHOTOGS.map((p, i) => ({ p, i, sx: layerToScreen(p.x, 0, PARALLAX.front, cam)[0] })).filter((o) => o.sx > -220 && o.sx < 2140);

export const Photographers: React.FC<{ frame: number; cam: Cam; uid: string; lit: Set<number>; flash: number }> = ({ frame, cam, uid, lit, flash }) => {
  const sil = new PB(), camBody = new PB(), lens = new PB(), dishRim = new PB(), dishIn = new PB(), press = new PB(), bellows = new PB();
  const litDish = new PB();
  for (const { p, i } of visiblePhotogs(cam)) {
    const m = photogMat(p, frame);
    const d = p.dir;
    sil.set(m);
    // shoulders / back (huge, boxy coat)
    sil.M(-110, 60).L(-104, -120).C(-100, -176, -60, -196, 0, -196).C(60, -196, 100, -176, 104, -120).L(110, 60).Z();
    // head (back view, snout poking toward dir)
    const hy = -244;
    sil.circle(0, hy, 50);
    if (p.sp === 'pig' || p.sp === 'hippo') sil.ellipse(d * 44, hy + 10, 26, 22);
    else if (p.sp === 'dog' || p.sp === 'goat') sil.ellipse(d * 46, hy + 8, 30, 17, d * 12);
    else sil.ellipse(d * 36, hy + 8, 18, 14);
    // ears
    switch (p.sp) {
      case 'dog': sil.ellipse(-40, hy + 6, 16, 42, 18).ellipse(40, hy + 6, 16, 42, -18); break;
      case 'rabbit': sil.ellipse(-18, hy - 78, 14, 52, -8).ellipse(20, hy - 74, 14, 50, 14); break;
      case 'bear': sil.circle(-38, hy - 36, 18).circle(38, hy - 36, 18); break;
      case 'pig': sil.poly([[-44, hy - 20], [-50, hy - 62], [-16, hy - 44]]).poly([[44, hy - 20], [50, hy - 62], [16, hy - 44]]); break;
      case 'cat': sil.poly([[-46, hy - 14], [-40, hy - 76], [-10, hy - 44]]).poly([[46, hy - 14], [40, hy - 76], [10, hy - 44]]); break;
      case 'hippo': sil.circle(-30, hy - 42, 11).circle(30, hy - 42, 11); break;
      case 'goat': sil.M(-20, hy - 40).C(-40, -90 + hy, -80, -70 + hy, -70, hy - 20).C(-60, hy - 50, -40, hy - 50, -20, hy - 30).Z()
        .M(20, hy - 40).C(40, -90 + hy, 80, -70 + hy, 70, hy - 20).C(60, hy - 50, 40, hy - 50, 20, hy - 30).Z(); break;
    }
    if (p.fedora) {
      sil.ellipse(0, hy - 34, 74, 12).poly([[-40, hy - 34], [-34, hy - 82], [0, hy - 72], [34, hy - 82], [40, hy - 34]]);
      press.set(m).poly([[14, hy - 70], [40, hy - 74], [40, hy - 56], [14, hy - 54]]);
    }
    // raised arm to the camera
    const [dx, dy] = dishLocal(p);
    const cx = d * 10, cy = dy + 80;
    sil.M(d * 70, -150).C(d * 110, -210, d * 70, cy + 40, cx + d * 10, cy + 20).L(cx - d * 20, cy + 26).C(d * 30, cy + 70, d * 60, -200, d * 30, -150).Z();
    sil.M(-d * 70, -150).C(-d * 100, -220, -d * 40, cy + 40, cx - d * 30, cy + 10).L(cx - d * 20, cy + 30).C(-d * 30, -180, -d * 50, -160, -d * 40, -140).Z();
    // vintage press camera (profile, lens toward dir)
    camBody.set(m).rect(cx - 36, cy - 30, 72, 58).rect(cx - 14, cy - 44, 28, 14);
    bellows.set(m).poly([[cx + d * 36, cy - 26], [cx + d * 72, cy - 18], [cx + d * 72, cy + 16], [cx + d * 36, cy + 24]]);
    lens.set(m).ellipse(cx + d * 78, cy - 1, 8, 20);
    // flash bracket + reflector dish
    camBody.set(m).rect(cx - d * 26 - 4, dy + 10, 8, cy - 30 - dy - 10);
    dishRim.set(m).ellipse(dx, dy, 18, 44);
    (lit.has(i) ? litDish : dishIn).set(m).ellipse(dx + d * 3, dy, 12, 36);
  }
  return (
    <g transform={layerTransform(PARALLAX.front, cam)}>
      <g filter="url(#boil)">
        <path d={sil.str()} fill={C.ink} opacity={0.25} transform="translate(10 12)" />
        <path d={sil.str()} fill={C.navy} stroke={C.navy} strokeWidth={9} strokeLinejoin="round" />
        <path d={sil.str()} fill={C.ink} />
        <path d={sil.str()} fill="url(#halftone)" opacity={0.35} />
        <path d={press.str()} fill={C.paperDark} {...ink(2)} />
        <path d={bellows.str()} fill={C.penguinBlack} stroke={C.plum} strokeWidth={3} strokeDasharray="3 5" />
        <path d={camBody.str()} fill={C.navy} {...ink(4)} />
        <path d={lens.str()} fill={C.pearlShade} {...ink(3)} />
        <path d={dishRim.str()} fill={C.gold} {...ink(4)} />
        <path d={dishIn.str()} fill={C.pearlShade} />
        <path d={litDish.str()} fill={C.white} />
      </g>
      <defs>
        <radialGradient id={`${uid}flashG`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.white} stopOpacity="1" />
          <stop offset="0.2" stopColor={C.white} stopOpacity="0.8" />
          <stop offset="0.5" stopColor={C.spot} stopOpacity="0.3" />
          <stop offset="1" stopColor={C.spot} stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
};

/** Which photographers are firing at `frame`, with each pop's age-intensity. */
export const activeFlashes = (frame: number, flashFrames: number[], cam: Cam) => {
  const vis = visiblePhotogs(cam).filter((o) => o.sx > 80 && o.sx < 1840);
  const out: { i: number; I: number; f0: number; sx: number; sy: number }[] = [];
  if (!vis.length) return out;
  for (const f0 of flashFrames) {
    const a = Math.floor(frame - f0);
    if (a < 0 || a >= FLASH_CURVE.length) continue;
    const o = vis[Math.floor(hash01('flashpick', f0) * vis.length)];
    const m = photogMat(o.p, frame);
    const [lx, ly] = dishLocal(o.p);
    const wx = m[0] * lx + m[2] * ly + m[4], wy = m[1] * lx + m[3] * ly + m[5];
    const [sx, sy] = layerToScreen(wx, wy, PARALLAX.front, cam);
    out.push({ i: o.i, I: FLASH_CURVE[a], f0, sx, sy });
  }
  return out;
};

const starPath = (cx: number, cy: number, R: number, r: number, n: number, a0: number) => {
  const p = new PB();
  const pts: [number, number][] = [];
  for (let k = 0; k < n * 2; k++) {
    const a = a0 + (k / (n * 2)) * Math.PI * 2;
    const rr = k % 2 ? r : R * (k % 4 === 0 ? 1 : 0.62);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return p.poly(pts).str();
};

export const FlashBursts: React.FC<{ frame: number; flashFrames: number[]; cam: Cam; uid: string }> = ({ frame, flashFrames, cam, uid }) => {
  const act = activeFlashes(frame, flashFrames, cam);
  const exposure = flashIntensity(frame, flashFrames);
  return (
    <g>
      {act.map(({ I, f0, sx, sy }) => {
        const a0 = hash01('flashrot', f0) * Math.PI;
        const z = cam.zoom;
        return (
          <g key={f0}>
            <circle cx={sx} cy={sy} r={330 * I * z} fill={`url(#${uid}flashG)`} />
            <ellipse cx={sx} cy={sy} rx={900 * I * z} ry={7 * z} fill={C.white} opacity={0.75 * I} />
            <path d={starPath(sx, sy, 230 * I * z, 26 * z, 8, a0)} fill={C.white} opacity={Math.min(1, 1.3 * I)} />
            <path d={starPath(sx, sy, 120 * I * z, 18 * z, 6, a0 + 0.4)} fill={C.spot} opacity={I} />
            <circle cx={sx} cy={sy} r={34 * z} fill={C.white} opacity={Math.min(1, 1.5 * I)} />
          </g>
        );
      })}
      {exposure > 0 && <rect x={-100} y={-100} width={2120} height={1280} fill={C.spot} opacity={0.22 * exposure} />}
      {exposure > 0 && <rect x={-100} y={-100} width={2120} height={1280} fill={C.white} opacity={0.07 * exposure} />}
    </g>
  );
};

// ---------------------------------------------------------------- confetti
const CONF_COLS = [C.hotPink, C.gold, C.goldLight, C.teal, C.tealLight, C.coral, C.blush, C.pearl, C.mustard];
const CONF_BACK: Record<string, string> = {
  [C.hotPink]: C.curtain, [C.gold]: C.leopard, [C.goldLight]: C.gold, [C.teal]: C.navy, [C.tealLight]: C.teal,
  [C.coral]: C.hotPink, [C.blush]: C.coral, [C.pearl]: C.pearlShade, [C.mustard]: C.leopard,
};
const RAIN = Array.from({ length: 120 }, (_, i) => {
  const r = rand(`rain${i}`);
  return { x: r() * 2300 - 190, d: r() * 46, v: 3.2 + r() * 3.8, sway: 14 + r() * 34, w: 0.07 + r() * 0.1, ph: r() * 6.28,
    spin: (r() - 0.5) * 16, flip: 0.12 + r() * 0.2, col: CONF_COLS[Math.floor(r() * CONF_COLS.length)], size: 0.7 + r() * 0.8, kind: r() < 0.25 ? 1 : 0, cyc: 1100 + r() * 300 };
});
const BURST = Array.from({ length: 70 }, (_, i) => {
  const r = rand(`burst${i}`);
  const side = i % 2 ? 1 : -1;
  return { side, vx: 16 + r() * 60, vy: -(42 + r() * 36), d: r() * 6, ph: r() * 6.28, spin: (r() - 0.5) * 30, flip: 0.15 + r() * 0.25,
    col: CONF_COLS[Math.floor(r() * CONF_COLS.length)], size: 0.8 + r() * 0.9, kind: r() < 0.3 ? 1 : 0 };
});
const STREAM = Array.from({ length: 14 }, (_, i) => {
  const r = rand(`stream${i}`);
  return { x: r() * 2000 - 40, d: r() * 40, v: 2.6 + r() * 1.8, len: 160 + r() * 140, ph: r() * 6.28, col: CONF_COLS[Math.floor(r() * CONF_COLS.length)], amp: 12 + r() * 16 };
});

const piece = (key: string, x: number, y: number, a: number, flipT: number, col: string, size: number, kind: number) => {
  const fx = Math.cos(flipT);
  const c = fx >= 0 ? col : CONF_BACK[col] ?? col;
  const sx = Math.max(0.08, Math.abs(fx));
  return kind
    ? <circle key={key} cx={x} cy={y} r={7 * size} fill={c} transform={`rotate(${a.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}) translate(${x.toFixed(1)} 0) scale(${sx.toFixed(2)} 1) translate(${(-x).toFixed(1)} 0)`} />
    : <rect key={key} x={-9 * size} y={-5 * size} width={18 * size} height={10 * size} fill={c}
      transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${sx.toFixed(2)} 1)`} />;
};

export const Confetti: React.FC<{ frame: number; from: number; cam: Cam }> = ({ frame, from, cam }) => {
  const t0 = frame - from;
  if (t0 < 0) return null;
  const px = -cam.camX * (PARALLAX.confetti - 1) * 0.5;
  const els: React.ReactNode[] = [];
  // streamers (behind pieces)
  STREAM.forEach((s, i) => {
    const t = t0 - s.d;
    if (t < 0) return;
    const yTop = -s.len - 40 + ((t * s.v) % (1200 + s.len));
    const p = new PB();
    for (let k = 0; k <= 10; k++) {
      const yy = yTop + (k / 10) * s.len;
      const xx = s.x + px + Math.sin(yy * 0.035 + t * 0.18 + s.ph) * s.amp + Math.sin(t * 0.04 + s.ph) * 30;
      if (k) p.L(xx, yy); else p.M(xx, yy);
    }
    els.push(<path key={`s${i}`} d={p.str()} stroke={s.col} strokeWidth={7} fill="none" strokeLinecap="round" />);
  });
  // cannon burst from both bottom corners
  const k = 0.075, g = 0.42;
  BURST.forEach((b, i) => {
    const t = t0 - b.d;
    if (t < 0 || t > 260) return;
    const e = (1 - Math.exp(-k * t)) / k;
    const x0 = b.side < 0 ? -20 : 1940;
    const x = x0 - b.side * b.vx * e + Math.sin(t * 0.18 + b.ph) * 18 * Math.min(1, t / 30);
    const y = 1020 + (g / k) * t + (b.vy - g / k) * e;
    if (y > 1140) return;
    els.push(piece(`b${i}`, x + px, y, t * b.spin + b.ph * 57, t * b.flip + b.ph, b.col, b.size, b.kind));
  });
  // steady rain
  RAIN.forEach((r, i) => {
    const t = t0 - r.d;
    if (t < 0) return;
    const y = -40 + ((t * r.v) % r.cyc);
    if (y > 1120) return;
    const x = ((r.x + px + Math.sin(t * r.w + r.ph) * r.sway) % 2300 + 2300) % 2300 - 190;
    els.push(piece(`r${i}`, x, y, t * r.spin + r.ph * 57, t * r.flip + r.ph, r.col, r.size, r.kind));
  });
  return <g>{els}</g>;
};
