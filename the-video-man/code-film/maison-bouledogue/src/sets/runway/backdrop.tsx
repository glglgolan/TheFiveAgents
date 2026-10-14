// Runway set — far backdrop: art-deco MB monogram wall with sunburst + hanging spotlight truss.
import React from 'react';
import { C, F, ink } from '../../lib/style';
import { hash01 } from '../../lib/rng';
import { Cam, layerTransform, PARALLAX, PB } from './geom';

export const WALL_W = 3000;
/** Wall-space x of the giant monogram (visible for the whole camX range 0..2500). */
export const MONO_X = 1330;
export const MONO_Y = 336;
export const TRUSS_Y = 70;

// ---- static geometry (computed once)
const sunburst = (() => {
  const dark = new PB(), lines = new PB();
  const N = 44, R = 1700;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 0.5) / N) * Math.PI * 2;
    const p = (a: number): [number, number] => [MONO_X + Math.cos(a) * R, MONO_Y + Math.sin(a) * R];
    dark.poly([[MONO_X, MONO_Y], p(a0), p(a1)]);
    const [x, y] = p(a0);
    lines.M(MONO_X + Math.cos(a0) * 300, MONO_Y + Math.sin(a0) * 300).L(x, y);
  }
  return { dark: dark.str(), lines: lines.str() };
})();

const pilasters = (() => {
  const body = new PB(), trim = new PB(), fan = new PB();
  for (let x = 90; x < WALL_W; x += 400) {
    if (Math.abs(x - MONO_X) < 420) continue;
    const w = 74;
    // shaft with stepped ziggurat capital
    body.poly([
      [x - w / 2, 760], [x - w / 2, 150], [x - w / 2 - 14, 150], [x - w / 2 - 14, 128], [x - w / 2 - 28, 128], [x - w / 2 - 28, 104],
      [x + w / 2 + 28, 104], [x + w / 2 + 28, 128], [x + w / 2 + 14, 128], [x + w / 2 + 14, 150], [x + w / 2, 150], [x + w / 2, 760],
    ]);
    for (const dx of [-18, 0, 18]) trim.M(x + dx, 170).L(x + dx, 700);
    trim.M(x - w / 2 - 28, 104).L(x + w / 2 + 28, 104);
    // deco fan on top of capital
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + (k / 6) * Math.PI;
      fan.M(x, 104).L(x + Math.cos(a) * 70, 104 + Math.sin(a) * 70);
    }
    fan.M(x - 70, 104).C(x - 70, 20, x + 70, 20, x + 70, 104);
  }
  return { body: body.str(), trim: trim.str(), fan: fan.str() };
})();

const valance = (() => {
  const sw = new PB(), fr = new PB(), shade = new PB();
  const w = 240;
  sw.M(-200, -400);
  for (let x = -200; x < WALL_W + 200; x += w) sw.L(x, 0).Q(x + w / 2, 90, x + w, 0);
  sw.L(WALL_W + 200, -400).Z();
  for (let x = -200; x < WALL_W + 200; x += w) {
    fr.M(x, 6).Q(x + w / 2, 96, x + w, 6);
    shade.M(x + 30, 10).Q(x + w / 2, 60, x + w - 30, 10).Q(x + w / 2, 40, x + 30, 10).Z();
  }
  return { sw: sw.str(), fr: fr.str(), shade: shade.str() };
})();

const pearlSwags = (() => {
  const p = new PB();
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const x0 = MONO_X + side * (270 + k * 150), x1 = MONO_X + side * (420 + k * 150);
      p.M(x0, 150 + k * 14).Q((x0 + x1) / 2, 250 + k * 16, x1, 150 + (k + 1) * 14);
    }
  }
  return p.str();
})();

const trussGeo = (() => {
  const bars = new PB(), zig = new PB(), lamps = new PB(), lens = new PB(), cables = new PB();
  const W = 3800;
  bars.rect(-200, TRUSS_Y - 26, W + 400, 8).rect(-200, TRUSS_Y + 18, W + 400, 8);
  zig.M(-200, TRUSS_Y - 22);
  let up = false;
  for (let x = -200; x < W + 200; x += 36) { zig.L(x, up ? TRUSS_Y - 22 : TRUSS_Y + 22); up = !up; }
  for (let x = 40; x < W + 200; x += 180) cables.M(x, TRUSS_Y - 26).L(x - 80, -600);
  // unlit decorative lamp cans
  for (let x = 20; x < W; x += 150) {
    const a = (hash01('trusslamp', x) - 0.5) * 50;
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    lamps.set([c, s, -s, c, x, TRUSS_Y + 30]);
    lamps.rect(-15, -2, 30, 44).poly([[-19, 38], [19, 38], [23, 50], [-23, 50]]);
    lens.set([c, s, -s, c, x, TRUSS_Y + 30]);
    lens.ellipse(0, 50, 18, 5);
  }
  return { bars: bars.str(), zig: zig.str(), lamps: lamps.str(), lens: lens.str(), cables: cables.str() };
})();

export const Wall: React.FC<{ frame: number; cam: Cam; uid: string; dim?: number }> = ({ frame, cam, uid, dim = 0 }) => {
  const shimmer = 0.5 + 0.5 * Math.sin(frame * 0.08);
  return (
    <g transform={layerTransform(PARALLAX.wall, cam)}>
      <defs>
        <linearGradient id={`${uid}wallG`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ink} />
          <stop offset="0.38" stopColor={C.curtainDark} />
          <stop offset="0.62" stopColor={C.curtain} />
          <stop offset="0.86" stopColor={C.curtainDark} />
          <stop offset="1" stopColor={C.ink} />
        </linearGradient>
        <radialGradient id={`${uid}monoGlow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.goldLight} stopOpacity="0.55" />
          <stop offset="0.5" stopColor={C.gold} stopOpacity="0.18" />
          <stop offset="1" stopColor={C.gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}goldG`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.goldLight} />
          <stop offset="0.55" stopColor={C.gold} />
          <stop offset="1" stopColor={C.leopard} />
        </linearGradient>
      </defs>
      <rect x={-1200} y={-1000} width={WALL_W + 2400} height={1800} fill={`url(#${uid}wallG)`} />
      {/* sunburst */}
      <path d={sunburst.dark} fill={C.curtainDark} opacity={0.62} />
      <path d={sunburst.lines} stroke={C.gold} strokeWidth={3} opacity={0.28} fill="none" />
      <circle cx={MONO_X} cy={MONO_Y} r={620} fill={`url(#${uid}monoGlow)`} opacity={0.75 + 0.25 * shimmer} />
      {[430, 380, 330].map((r, i) => (
        <circle key={r} cx={MONO_X} cy={MONO_Y} r={r} fill="none" stroke={i === 1 ? C.goldLight : C.gold}
          strokeWidth={i === 1 ? 3 : 7} opacity={0.5 - i * 0.08} strokeDasharray={i === 0 ? '2 26' : undefined} strokeLinecap="round" />
      ))}
      {/* pilasters */}
      <g>
        <path d={pilasters.body} fill={C.ink} opacity={0.25} transform="translate(8 8)" />
        <path d={pilasters.body} fill={C.curtainDark} {...ink(4)} />
        <path d={pilasters.trim} stroke={C.gold} strokeWidth={3} opacity={0.6} fill="none" />
        <path d={pilasters.fan} stroke={C.gold} strokeWidth={4} fill="none" opacity={0.8} />
      </g>
      {/* pearl swags */}
      <path d={pearlSwags} stroke={C.ink} strokeWidth={17} strokeDasharray="0 22" strokeLinecap="round" fill="none" opacity={0.35} transform="translate(3 4)" />
      <path d={pearlSwags} stroke={C.pearl} strokeWidth={14} strokeDasharray="0 22" strokeLinecap="round" fill="none" />
      {/* monogram medallion */}
      <g filter="url(#boil)">
        {/* art-deco chevron wings */}
        {[-1, 1].map((sd) => (
          <g key={sd}>
            {[0, 1, 2].map((k) => {
              const x0 = MONO_X + sd * (300 + k * 44), y0 = MONO_Y - 70 + k * 30;
              return <path key={k} d={`M${x0} ${y0} L${x0 + sd * 120} ${y0 - 40} L${x0 + sd * 120} ${y0 + 10} L${x0} ${y0 + 50} Z`}
                fill={k === 1 ? C.goldLight : C.gold} {...ink(4)} />;
            })}
            <circle cx={MONO_X + sd * 262} cy={MONO_Y} r={20} fill={C.pearl} {...ink(4)} />
          </g>
        ))}
        <circle cx={MONO_X + 10} cy={MONO_Y + 12} r={262} fill={C.ink} opacity={0.3} />
        <circle cx={MONO_X} cy={MONO_Y} r={262} fill={C.curtainDark} stroke={`url(#${uid}goldG)`} strokeWidth={22} />
        <circle cx={MONO_X} cy={MONO_Y} r={274} fill="none" {...ink(5)} />
        <circle cx={MONO_X} cy={MONO_Y} r={250} fill="none" {...ink(3)} />
        <circle cx={MONO_X} cy={MONO_Y} r={226} fill="none" stroke={C.goldLight} strokeWidth={3} strokeDasharray="1 14" strokeLinecap="round" />
        <text x={MONO_X + 12} y={MONO_Y + 118} textAnchor="middle" fontFamily={F.display} fontSize={330} fontWeight={700}
          fill={C.ink} opacity={0.4} letterSpacing={-30}>MB</text>
        <text x={MONO_X} y={MONO_Y + 104} textAnchor="middle" fontFamily={F.display} fontSize={330} fontWeight={700}
          fill={`url(#${uid}goldG)`} stroke={C.ink} strokeWidth={7} paintOrder="stroke" letterSpacing={-30}>MB</text>
        <text x={MONO_X} y={MONO_Y + 196} textAnchor="middle" fontFamily={F.sans} fontSize={30} letterSpacing={16}
          fill={C.goldLight}>PARIS</text>
      </g>
      {/* valance swags */}
      <path d={valance.sw} fill={C.curtain} {...ink(5)} />
      <path d={valance.shade} fill={C.curtainDark} opacity={0.7} />
      <path d={valance.fr} stroke={C.gold} strokeWidth={10} strokeDasharray="2 9" fill="none" />
      {dim > 0 ? <rect x={-1200} y={-1000} width={WALL_W + 2400} height={1800} fill={C.ink} opacity={dim} /> : null}
    </g>
  );
};

export const Truss: React.FC<{ cam: Cam }> = ({ cam }) => (
  <g transform={layerTransform(PARALLAX.truss, cam)}>
    <path d={trussGeo.cables} stroke={C.ink} strokeWidth={3} opacity={0.8} />
    <path d={trussGeo.zig} stroke={C.ink} strokeWidth={5} fill="none" />
    <path d={trussGeo.bars} fill={C.penguinBlack} {...ink(3)} />
    <path d={trussGeo.lamps} fill={C.penguinBlack} stroke={C.plum} strokeWidth={2} />
    <path d={trussGeo.lens} fill={C.plum} />
  </g>
);
