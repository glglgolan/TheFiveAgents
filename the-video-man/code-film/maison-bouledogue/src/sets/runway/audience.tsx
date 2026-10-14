// Runway set — the audience: tiered rows of animal silhouettes behind the catwalk.
// Each row is batched into a handful of <path>s (all members of a row share a few path strings),
// so ~90 audience members cost ~20 SVG elements per row.
import React from 'react';
import { C } from '../../lib/style';
import { noise2, rand } from '../../lib/rng';
import { clamp, ease, lerp } from '../../lib/motion';
import { Cam, chain, layerToScreen, layerTransform, Mat, PARALLAX, PB, rot, sc, tr } from './geom';

export type CrowdState = 'murmur' | 'lean' | 'gasp' | 'silent' | 'cheer';

type Species = 'bunny' | 'cat' | 'bear' | 'mouse' | 'elephant' | 'ram' | 'deer' | 'bird' | 'croc' | 'poodle' | 'moose' | 'fox';
type Hat = 'none' | 'top' | 'wide' | 'cloche' | 'pillbox' | 'fascinator' | 'tower';
const SPECIES: Species[] = ['bunny', 'cat', 'bear', 'mouse', 'elephant', 'ram', 'deer', 'bird', 'croc', 'poodle', 'moose', 'fox'];
const HATS: Hat[] = ['top', 'wide', 'cloche', 'pillbox', 'fascinator', 'tower'];

interface Member {
  x: number; species: Species; hat: Hat; lorgnette: boolean; phase: number; col: 0 | 1;
  size: number; throwsHat: boolean; accent: 0 | 1 | 2; stagger: number;
}
interface RowDef { id: string; p: number; s: number; spacing: number; headY: number; cols: [string, string] }

export const ROWS: RowDef[] = [
  { id: 'D', p: PARALLAX.rowD, s: 0.5, spacing: 50, headY: 566, cols: [C.plum, C.plum] },
  { id: 'C', p: PARALLAX.rowC, s: 0.6, spacing: 60, headY: 598, cols: [C.plum, C.navy] },
  { id: 'B', p: PARALLAX.rowB, s: 0.76, spacing: 76, headY: 632, cols: [C.navy, C.plum] },
  { id: 'A', p: PARALLAX.rowA, s: 0.95, spacing: 96, headY: 668, cols: [C.navy, C.penguinBlack] },
];

const members = new Map<string, Member[]>();
const getMembers = (row: RowDef) => {
  let m = members.get(row.id);
  if (m) return m;
  const r = rand(`aud-${row.id}`);
  m = [];
  const span = 1920 + 2600 * row.p + 400;
  for (let x = -200, i = 0; x < span; x += row.spacing * (0.85 + r() * 0.3), i++) {
    const hatRoll = r();
    m.push({
      x: x + (r() - 0.5) * row.spacing * 0.2,
      species: SPECIES[Math.floor(r() * SPECIES.length)],
      hat: hatRoll < 0.42 ? HATS[Math.floor(r() * HATS.length)] : 'none',
      lorgnette: r() < 0.2,
      phase: r() * Math.PI * 2,
      col: (i % 2) as 0 | 1,
      size: 0.9 + r() * 0.22,
      throwsHat: r() < 0.6,
      accent: Math.floor(r() * 3) as 0 | 1 | 2,
      stagger: r(),
    });
  }
  members.set(row.id, m);
  return m;
};

// ---------------------------------------------------------------- crowd state params
interface CP { bob: number; lean: number; drop: number; tilt: number; eye: number; mouth: number; arms: number; hat: number; wave: number }
const stateParams = (st: CrowdState, f: number, mb: Member, dir: number): CP => {
  const ph = mb.phase;
  switch (st) {
    case 'murmur': {
      const chat = Math.sin(f * 0.55 + ph * 3) > 0.55 && Math.sin(f * 0.05 + ph) > 0 ? 0.28 : 0;
      return { bob: Math.sin(f * 0.13 + ph) * 2.6 + noise2('mur', f * 0.03, ph) * 2, lean: 0, drop: 0,
        tilt: Math.sin(f * 0.06 + ph * 2) * 7, eye: 0, mouth: chat, arms: 0, hat: 0, wave: 0 };
    }
    case 'lean':
      return { bob: Math.sin(f * 0.09 + ph) * 1.2, lean: dir * 11, drop: 9, tilt: dir * 9, eye: 0.35, mouth: 0, arms: 0, hat: 0, wave: 0 };
    case 'gasp':
      return { bob: Math.sin(f * 2.3 + ph * 5) * 1.3, lean: -dir * 5, drop: -16, tilt: -dir * 6 + Math.sin(ph) * 4, eye: 1, mouth: 1, arms: 0.25, hat: 0, wave: 0 };
    case 'silent':
      return { bob: 0, lean: dir * 3, drop: 2, tilt: dir * 3, eye: 0.2, mouth: 0, arms: 0, hat: 0, wave: 0 };
    case 'cheer':
      return { bob: -Math.abs(Math.sin(f * 0.34 + ph)) * 18 * (0.6 + 0.4 * Math.sin(ph * 7)), lean: Math.sin(f * 0.2 + ph) * 5, drop: -4,
        tilt: Math.sin(f * 0.27 + ph) * 10, eye: 0.3, mouth: 0.85, arms: 1, hat: 1, wave: Math.sin(f * 0.5 + ph) };
  }
};
const mix = (a: CP, b: CP, t: number): CP => ({
  bob: lerp(a.bob, b.bob, t), lean: lerp(a.lean, b.lean, t), drop: lerp(a.drop, b.drop, t), tilt: lerp(a.tilt, b.tilt, t),
  eye: lerp(a.eye, b.eye, t), mouth: lerp(a.mouth, b.mouth, t), arms: lerp(a.arms, b.arms, t), hat: lerp(a.hat, b.hat, t), wave: lerp(a.wave, b.wave, t),
});

// ---------------------------------------------------------------- geometry in head coords (head centre 0,0; r~30)
const drawEars = (sil: PB, horn: PB, antler: PB, sp: Species) => {
  switch (sp) {
    case 'bunny': sil.ellipse(-13, -52, 9, 36, -10).ellipse(13, -52, 9, 36, 12); break;
    case 'cat': sil.poly([[-28, -10], [-24, -50], [-4, -27]]).poly([[28, -10], [24, -50], [4, -27]]); break;
    case 'fox': sil.poly([[-30, -6], [-30, -56], [-6, -26]]).poly([[30, -6], [30, -56], [6, -26]]).poly([[-26, 8], [0, 34], [26, 8]]); break;
    case 'bear': sil.circle(-24, -22, 12).circle(24, -22, 12); break;
    case 'mouse': sil.circle(-30, -24, 21).circle(30, -24, 21); break;
    case 'elephant': sil.ellipse(-36, 2, 26, 34, 10).ellipse(36, 2, 26, 34, -10)
      .M(-9, 12).C(-10, 40, 0, 56, 14, 60).L(16, 50).C(8, 46, 8, 34, 9, 12).Z(); break;
    case 'ram': horn.M(-16, -24).C(-46, -44, -64, -6, -40, 8).C(-30, 14, -24, 2, -34, -4)
      .M(16, -24).C(46, -44, 64, -6, 40, 8).C(30, 14, 24, 2, 34, -4); break;
    case 'deer': antler.M(-12, -26).L(-26, -62).L(-44, -86).M(-26, -62).L(-12, -86).M(-34, -74).L(-50, -66)
      .M(12, -26).L(26, -62).L(44, -86).M(26, -62).L(12, -86).M(34, -74).L(50, -66);
      sil.ellipse(-30, -16, 12, 6, -25).ellipse(30, -16, 12, 6, 25); break;
    case 'moose': sil.M(-18, -24).C(-40, -40, -70, -60, -82, -44).L(-72, -56).L(-66, -40).L(-58, -66).L(-50, -44).L(-42, -70).L(-36, -40).Z()
      .M(18, -24).C(40, -40, 70, -60, 82, -44).L(72, -56).L(66, -40).L(58, -66).L(50, -44).L(42, -70).L(36, -40).Z()
      .ellipse(0, 18, 16, 20); break;
    case 'bird': sil.ellipse(-8, -40, 5, 18, -25).ellipse(0, -46, 5, 20).ellipse(8, -40, 5, 18, 25); break;
    case 'croc': sil.circle(-16, -24, 11).circle(16, -24, 11); break;
    case 'poodle': sil.circle(0, -34, 20).circle(-26, -18, 15).circle(26, -18, 15).circle(-32, 8, 14).circle(32, 8, 14); break;
  }
};
const headShape = (sil: PB, sp: Species) => {
  if (sp === 'croc') sil.ellipse(0, 2, 36, 25);
  else if (sp === 'elephant') sil.ellipse(0, 0, 27, 31);
  else if (sp === 'bird') sil.circle(0, 0, 26);
  else sil.circle(0, 0, 29);
  sil.rect(-12, 20, 24, 24); // neck
};
const beak = (acc: PB, sp: Species) => { if (sp === 'bird') acc.poly([[-8, 6], [8, 6], [0, 24]]); };

/** hat in head coords; returns [band/feather accent path pieces] */
const drawHat = (sil: PB, acc: PB, hat: Hat, top: number) => {
  switch (hat) {
    case 'top': sil.ellipse(0, top, 36, 7).poly([[-20, top], [-23, top - 64], [23, top - 64], [20, top]]); acc.rect(-21, top - 14, 42, 8); break;
    case 'wide': sil.ellipse(0, top + 4, 66, 11).ellipse(0, top - 6, 30, 22); acc.ellipse(36, top - 26, 7, 30, 35); break;
    case 'cloche': sil.ellipse(0, top + 12, 36, 26).ellipse(0, top + 20, 42, 8); acc.rect(-34, top + 8, 68, 6); break;
    case 'pillbox': sil.rect(-18, top - 22, 36, 22).ellipse(0, top - 22, 18, 5); acc.ellipse(14, top - 40, 5, 22, 20).ellipse(22, top - 34, 4, 18, 45); break;
    case 'fascinator': sil.circle(16, top + 4, 10); acc.ellipse(22, top - 34, 6, 34, 18).ellipse(8, top - 28, 5, 28, -12).ellipse(30, top - 18, 4, 22, 50); break;
    case 'tower': sil.ellipse(0, top - 10, 30, 22).ellipse(4, top - 44, 24, 20).ellipse(-2, top - 74, 18, 16).circle(2, top - 98, 11); acc.circle(18, top - 30, 6).circle(-14, top - 60, 5); break;
  }
};
const hatTop = (sp: Species) => (sp === 'poodle' ? -46 : sp === 'bunny' ? -30 : sp === 'bird' ? -30 : -26);

export interface AudienceProps {
  frame: number; cam: Cam; uid: string;
  crowd: CrowdState; crowdFrom: CrowdState; crowdT: number;
  lookX: number; // world (runway-plane) x the crowd looks at
  flash: number; // global flash intensity (brightens eyes / rim)
}

const Row: React.FC<AudienceProps & { row: RowDef }> = ({ frame, cam, crowd, crowdFrom, crowdT, lookX, row, flash }) => {
  const f = frame;
  const sil = [new PB(), new PB()], horn = [new PB(), new PB()], antler = [new PB(), new PB()], arms = [new PB(), new PB()];
  const eyes = new PB(), pupils = new PB(), mouths = new PB(), accP = new PB(), accT = new PB(), accM = new PB(), lorg = new PB();
  const accs = [accP, accT, accM];
  const lookScreen = layerToScreen(lookX, 0, 1, cam)[0];
  const snap = crowd === 'gasp' || crowdFrom === 'gasp';
  for (const mb of getMembers(row)) {
    const [sx] = layerToScreen(mb.x, 0, row.p, cam);
    if (sx < -160 || sx > 2080) continue;
    const dir = clamp((lookScreen - sx) / 650, -1, 1);
    // staggered ripple through the crowd
    const tt = clamp(crowdT * 1.35 - mb.stagger * 0.35);
    const e = snap ? ease.outBack(tt, 2.4) : ease.inOut(tt);
    const P = mix(stateParams(crowdFrom, f, mb, dir), stateParams(crowd, f, mb, dir), e);
    const s = row.s * mb.size;
    const base = row.headY + 92 * row.s;
    const body: Mat = chain(tr(mb.x, base + P.drop * row.s * 0.5 + P.bob * row.s * 0.4), sc(s), rot(P.lean));
    const head: Mat = chain(body, tr(0, -92 + P.drop * 0.6 + P.bob), rot(P.tilt));
    const c = mb.col;
    // body (shoulders)
    sil[c].set(body).M(-52, 90).L(-52, 0).C(-52, -44, -32, -62, 0, -62).C(32, -62, 52, -44, 52, 0).L(52, 90).Z();
    // arms (cheer)
    if (P.arms > 0.05) {
      for (const side of [-1, 1]) {
        const up = P.arms;
        const ang = side * (lerp(160, 25, up) + P.wave * 14 * side);
        const r = (ang * Math.PI) / 180;
        const L = 70;
        const ex = side * 40 + Math.sin(r) * L, ey = -40 - Math.cos(r) * L;
        arms[c].set(body).M(side * 40, -38).Q(side * 40 + Math.sin(r) * L * 0.4, -60, ex, ey);
        sil[c].set(body).circle(ex, ey, 11);
      }
    }
    sil[c].set(head);
    headShape(sil[c], mb.species);
    drawEars(sil[c], horn[c].set(head), antler[c].set(head), mb.species);
    beak(accs[1].set(head), mb.species);
    // hat (thrown in cheer)
    if (mb.hat !== 'none') {
      let hm = head;
      if (mb.throwsHat && P.hat > 0.02) {
        const period = 46;
        const u = ((f + mb.phase * 20) % period) / period;
        const hy = -4 * u * (1 - u) * 190 * P.hat;
        hm = chain(head, tr(0, hatTop(mb.species) + hy), rot(u * 400 * P.hat), tr(0, -hatTop(mb.species)));
      }
      sil[c].set(hm);
      const a = accs[mb.accent].set(hm);
      drawHat(sil[c], a, mb.hat, hatTop(mb.species));
    }
    // face: eyes / pupils / mouth
    const blink = (Math.floor(f + mb.phase * 31) % 83) < 3 && P.eye < 0.5;
    const er = lerp(4.2, 7.5, clamp(P.eye));
    const ey = mb.species === 'croc' ? -8 : -3;
    if (!blink) {
      eyes.set(head).circle(-11, ey, er).circle(11, ey, er);
      if (row.s > 0.55) {
        const px = dir * er * 0.45;
        const pr = lerp(1.8, 2.6, clamp(P.eye));
        pupils.set(head).circle(-11 + px, ey + 0.5, pr).circle(11 + px, ey + 0.5, pr);
      }
    } else {
      eyes.set(head).rect(-15, ey - 0.8, 8, 1.6).rect(7, ey - 0.8, 8, 1.6);
    }
    if (P.mouth > 0.05) {
      const my = mb.species === 'croc' ? 12 : 14;
      mouths.set(head).ellipse(0, my, 3 + 5 * P.mouth, 2 + 8 * P.mouth);
    }
    if (mb.lorgnette && P.arms < 0.5) {
      lorg.set(head).circle(-11, ey, 9).circle(11, ey, 9).M(-2, ey).L(2, ey).M(20, ey + 4).L(30, 52);
    }
  }
  const sw = (w: number) => w * row.s;
  const shadow = `translate(${5 * row.s + 2} ${6 * row.s + 2})`;
  return (
    <g transform={layerTransform(row.p, cam)}>
      {/* paper-cut drop shadow */}
      <g transform={shadow} opacity={0.25}>
        {[0, 1].map((c) => (
          <g key={c}>
            <path d={sil[c].str()} fill={C.ink} />
            <path d={horn[c].str()} stroke={C.ink} strokeWidth={sw(11)} fill="none" strokeLinecap="round" />
            <path d={antler[c].str()} stroke={C.ink} strokeWidth={sw(6)} fill="none" strokeLinecap="round" />
            <path d={arms[c].str()} stroke={C.ink} strokeWidth={sw(19)} fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
      {[0, 1].map((c) => (
        <g key={c}>
          <path d={arms[c].str()} stroke={row.cols[c]} strokeWidth={sw(19)} fill="none" strokeLinecap="round" />
          <path d={sil[c].str()} fill={row.cols[c]} />
          <path d={horn[c].str()} stroke={row.cols[c]} strokeWidth={sw(11)} fill="none" strokeLinecap="round" />
          <path d={antler[c].str()} stroke={row.cols[c]} strokeWidth={sw(6)} fill="none" strokeLinecap="round" />
        </g>
      ))}
      <path d={accP.str()} fill={C.hotPink} opacity={0.8} />
      <path d={accT.str()} fill={C.mustard} opacity={0.8} />
      <path d={accM.str()} fill={C.tealLight} opacity={0.75} />
      <path d={eyes.str()} fill={C.paper} opacity={Math.min(1, 0.8 + flash)} />
      <path d={pupils.str()} fill={C.ink} />
      <path d={mouths.str()} fill={C.curtainDark} stroke={C.blush} strokeWidth={sw(2)} />
      <path d={lorg.str()} stroke={C.gold} strokeWidth={sw(3)} fill="none" strokeLinecap="round" />
    </g>
  );
};

export const Audience: React.FC<AudienceProps> = (p) => (
  <g>
    {ROWS.map((row) => <Row key={row.id} {...p} row={row} />)}
    {/* atmospheric haze between rows and runway */}
    <rect x={-400} y={520} width={2720} height={200} fill={`url(#${p.uid}hazeG)`} />
  </g>
);

export const AudienceDefs: React.FC<{ uid: string }> = ({ uid }) => (
  <linearGradient id={`${uid}hazeG`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor={C.plum} stopOpacity="0" />
    <stop offset="1" stopColor={C.navy} stopOpacity="0.45" />
  </linearGradient>
);

