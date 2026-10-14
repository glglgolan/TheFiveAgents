// MONSIEUR BOULEDOGUE — the tyrannical couturier. Rig by the Bulldog rigger.
// Local coords: origin = ground point between the feet, facing +x, up = -y. Height ~420 at scale 1 (+ plume).
import React, { useId } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { CharProps, Viseme } from '../lib/types';
import { C, S, F, ink } from '../lib/style';
import { onTwos, clamp, wobble } from '../lib/motion';
import { hash01, rand } from '../lib/rng';
import { visemeAt } from '../lib/visemes';
import { BoilDefs } from '../lib/fx';
import {
  POSE_KEYS, POSES, DEFAULT_POSE, EXPRESSIONS, EXPRESSION_NAMES, VISEMES, MOUTH,
  blendPose, fullPose, waddlePose, ikArm, fkWrist, simulate,
  HIP_Y, NECK, SH_F, SH_B, L1, L2, type Pose, type SimOut,
} from './bulldog/rig';
import { Head, EYE_F } from './bulldog/Head';

export { POSE_KEYS, POSES, DEFAULT_POSE, EXPRESSIONS, EXPRESSION_NAMES, VISEMES, blendPose, fullPose, waddlePose, ikArm, fkWrist };
export type { Pose };

/**
 * Props (beyond CharProps):
 *  poseFn?: (f) => Pose     — preferred: pose as a function of frame. Body renders poseFn(onTwos(frame)); all springs
 *                             (jowls, ears, plume, monocle chain, scissors, cape hem, pearls, dangling button) are simulated
 *                             from its motion. If only `pose` is given, springs only react to talking/breath/impulses.
 *  worldX?: (f) => number   — his x position in the shot (px) so pendants swing when he travels.
 *  simFrom?: number         — frame the spring sim starts from (default frame-72).
 *  impulses?: [frame, amp][]— extra jolts (stomps, slams); amp ~ 1 = strong.
 *  holdPearls?: boolean     — a pearl strand in the near fist (pearlWhip).
 *  pearlSwing?: number      — strand swing angle, deg (+ = toward +x). Animate it for the whip.
 *  monocleOut?: number      — 0 monocle in eye .. 1 popped out dangling on its chain (default from expression).
 *  voice?: string           — lipsync source if `viseme` not given (default 'bulldog' via visemeAt).
 *  headOnly?: boolean       — draw just the head (origin = neck pivot) for close-ups / sheet.
 */
export interface BulldogProps extends CharProps {
  poseFn?: (f: number) => Pose;
  worldX?: (f: number) => number;
  simFrom?: number;
  impulses?: [number, number][];
  holdPearls?: boolean;
  pearlSwing?: number;
  monocleOut?: number;
  voice?: string;
  headOnly?: boolean;
}

const D2R = Math.PI / 180;
const f1 = (n: number) => n.toFixed(1);
const rot = (x: number, y: number, deg: number) => {
  const r = deg * D2R, c = Math.cos(r), s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
};

// ---------------- limbs ----------------
const taper = (L: number, r1: number, r2: number) =>
  `M ${-r1},0 L ${-r2},${L} A ${r2},${r2} 0 0 0 ${r2},${L} L ${r1},0 A ${r1},${r1} 0 0 0 ${-r1},0 Z`;

const Paw: React.FC<{ shape: number }> = ({ shape }) => {
  const h = Math.round(clamp(shape, 0, 2));
  if (h === 0) {
    return (
      <g>
        <path d="M -16,-2 C -26,12 -24,30 -13,35 C -9,41 -2,41 0,36 C 3,42 11,42 13,35 C 22,31 26,14 16,-2 Z" fill={C.bulldogFur} {...ink(S.ink)} />
        <path d="M -6,26 L -5,34 M 7,26 L 6,34" fill="none" {...ink(S.inkThin)} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={0} cy={15} r={18} fill={C.bulldogFur} {...ink(S.ink)} />
      {h === 2 ? (
        <path d={taper(26, 7, 6)} transform="translate(5,24)" fill={C.bulldogFur} {...ink(S.ink)} />
      ) : (
        <path d="M -10,24 Q -6,30 0,26 Q 5,31 10,24" fill="none" {...ink(S.inkThin)} />
      )}
      <path d="M -17,8 Q -24,16 -14,22" fill="none" {...ink(S.inkThin)} />
    </g>
  );
};

const Cuff: React.FC = () => (
  <path d="M -20,-4 Q -24,6 -14,8 Q -10,14 -3,9 Q 2,15 8,9 Q 14,14 17,7 Q 25,5 20,-4 Z" fill={C.white} {...ink(S.inkThin)} />
);

const Arm: React.FC<{ side: 'F' | 'B'; arm: number; fore: number; paw: number; hand: number; children?: React.ReactNode }> = ({ side, arm, fore, paw, hand, children }) => {
  const Sh = side === 'F' ? SH_F : SH_B;
  const mir = side === 'B' ? ' scale(-1,1)' : '';
  return (
    <g transform={`translate(${Sh.x},${Sh.y})${mir} rotate(${-arm})`}>
      <path d={taper(L1, 23, 15)} fill={C.ink} {...ink(S.ink)} />
      <path d="M -10,6 Q -14,26 -9,44" fill="none" stroke={C.plum} strokeWidth={4} strokeLinecap="round" />
      <g transform={`translate(0,${L1}) rotate(${-fore})`}>
        <path d={taper(L2 - 4, 15, 13)} fill={C.ink} {...ink(S.ink)} />
        <g transform={`translate(0,${L2}) rotate(${-paw})`}>
          <Paw shape={hand} />
          <Cuff />
          {children}
        </g>
      </g>
    </g>
  );
};

// ---------------- pearls (prop) ----------------
const PearlStrand: React.FC<{ frame: number; absRot: number; swing: number; lag: number }> = ({ frame, absRot, swing, lag }) => {
  const M = 9, seg = 15;
  const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let x = 0, y = 0;
  for (let i = 0; i < M; i++) {
    const s = (i + 1) / M;
    const a = (swing * (0.7 + 0.3 * s) + lag * 1.1 * (0.3 + s) + Math.sin(frame * 0.35 - i * 0.8) * 3 * s) * D2R;
    x += Math.sin(a) * seg; y += Math.cos(a) * seg;
    pts.push({ x, y });
  }
  const at = (t: number) => {
    const u = t * M, i = Math.min(M - 1, Math.floor(u)), k = u - i;
    const a = pts[i], b = pts[i + 1];
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, tx: b.x - a.x, ty: b.y - a.y };
  };
  const beads: React.ReactNode[] = [];
  const K = 11;
  for (let k = 1; k <= K; k++) {
    const t = k / (K + 1);
    const p = at(t);
    const l = Math.hypot(p.tx, p.ty) || 1;
    const nx = -p.ty / l, ny = p.tx / l;
    const w = 17 * Math.pow(Math.sin(Math.PI * t), 0.8);
    beads.push(<circle key={`a${k}`} cx={p.x + nx * w} cy={p.y + ny * w} r={5.2} fill={C.pearl} {...ink(2)} />);
    beads.push(<circle key={`b${k}`} cx={p.x - nx * w} cy={p.y - ny * w} r={5.2} fill={C.pearl} {...ink(2)} />);
  }
  const end = pts[M];
  return (
    <g transform={`rotate(${-absRot})`}>
      {beads}
      <circle cx={end.x} cy={end.y + 4} r={9} fill={C.pearl} {...ink(2.4)} />
      <circle cx={end.x - 3} cy={end.y + 1} r={2.5} fill={C.white} />
    </g>
  );
};

// ---------------- ruff ----------------
const ruffPath = (rx: number, ry: number, n: number, bulge: number) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    if (i === 0) { d += `M ${f1(x)},${f1(y)}`; continue; }
    const am = ((i - 0.5) / n) * Math.PI * 2;
    d += ` Q ${f1(Math.cos(am) * rx * bulge)},${f1(Math.sin(am) * ry * bulge)} ${f1(x)},${f1(y)}`;
  }
  return d + ' Z';
};
const RUFF_N = 24, RUFF_RX = 158, RUFF_RY = 44;
const RUFF_OUT = ruffPath(RUFF_RX, RUFF_RY, RUFF_N, 1.16);
const RUFF_WEDGES = (() => {
  let d = '';
  for (let i = 0; i < RUFF_N; i += 2) {
    const a0 = (i / RUFF_N) * Math.PI * 2, a1 = ((i + 1) / RUFF_N) * Math.PI * 2, am = ((i + 0.5) / RUFF_N) * Math.PI * 2;
    d += `M 0,0 L ${f1(Math.cos(a0) * RUFF_RX)},${f1(Math.sin(a0) * RUFF_RY)} Q ${f1(Math.cos(am) * RUFF_RX * 1.16)},${f1(Math.sin(am) * RUFF_RY * 1.16)} ${f1(Math.cos(a1) * RUFF_RX)},${f1(Math.sin(a1) * RUFF_RY)} Z `;
  }
  return d;
})();
const RUFF_FOLDS = (() => {
  let d = '';
  for (let i = 0; i < RUFF_N; i++) {
    const a = (i / RUFF_N) * Math.PI * 2;
    d += `M ${f1(Math.cos(a) * 56)},${f1(Math.sin(a) * 14)} L ${f1(Math.cos(a) * RUFF_RX)},${f1(Math.sin(a) * RUFF_RY)} `;
  }
  return d;
})();

const Ruff: React.FC<{ uid: string }> = ({ uid }) => (
  <g>
    <path d={RUFF_OUT} transform="translate(6,20)" fill={C.ink} opacity={0.25} />
    <path d={RUFF_OUT} transform="translate(0,13)" fill={C.mustard} {...ink(S.ink)} />
    <path d={RUFF_OUT} fill={C.gold} {...ink(S.ink)} />
    <clipPath id={`${uid}ruffc`}><path d={RUFF_OUT} /></clipPath>
    <path d={RUFF_WEDGES} fill={C.goldLight} opacity={0.75} clipPath={`url(#${uid}ruffc)`} />
    <path d={RUFF_FOLDS} fill="none" stroke={C.ink} strokeWidth={2} strokeLinecap="round" opacity={0.55} />
    <ellipse cx={0} cy={0} rx={60} ry={16} fill={C.mustard} {...ink(S.inkThin)} />
  </g>
);

// ---------------- leopard rosettes (static, seeded) ----------------
const ROSETTES = (() => {
  const r = rand('bulldog-leopard');
  let ringD = '', coreD = '', dotD = '';
  for (let gy = -350; gy < 20; gy += 30) {
    for (let gx = -220; gx < 220; gx += 32) {
      const cx = gx + (r() - 0.5) * 18 + ((gy / 30) % 2 ? 16 : 0), cy = gy + (r() - 0.5) * 16;
      const s = 7 + r() * 4;
      coreD += `M ${f1(cx - s * 0.7)},${f1(cy)} a ${f1(s * 0.7)},${f1(s * 0.6)} 0 1,0 ${f1(s * 1.4)},0 a ${f1(s * 0.7)},${f1(s * 0.6)} 0 1,0 ${f1(-s * 1.4)},0 `;
      const nb = 3 + Math.floor(r() * 2), ph = r() * Math.PI * 2;
      for (let k = 0; k < nb; k++) {
        const a0 = ph + (k / nb) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / nb * 0.62;
        ringD += `M ${f1(cx + Math.cos(a0) * s)},${f1(cy + Math.sin(a0) * s * 0.85)} A ${f1(s)},${f1(s * 0.85)} 0 0,1 ${f1(cx + Math.cos(a1) * s)},${f1(cy + Math.sin(a1) * s * 0.85)} `;
      }
      if (r() < 0.5) { const dx = cx + 15 + r() * 4, dy = cy + 12; dotD += `M ${f1(dx - 2.4)},${f1(dy)} a 2.4,2.4 0 1,0 4.8,0 a 2.4,2.4 0 1,0 -4.8,0 `; }
    }
  }
  return { ringD, coreD, dotD };
})();

// ---------------- blinks ----------------
const blinkAt = (f: number, seed: string) => {
  const P = 64;
  for (const k of [Math.floor(f / P), Math.floor(f / P) - 1]) {
    const st = k * P + Math.floor(hash01(seed, 'blink', k) * 44);
    const d = f - st;
    const prof = [0.55, 1, 1, 0.6, 0.2];
    if (d >= 0 && d < prof.length) return prof[d];
    if (hash01(seed, 'dbl', k) < 0.3) { const d2 = d - 7; if (d2 >= 0 && d2 < prof.length) return prof[d2]; }
  }
  return 0;
};

// ---------------- main ----------------
const Bulldog: React.FC<BulldogProps> = (props) => {
  const { frame, flip, seed = 'bulldog' } = props;
  const uid = 'bd' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const pf = onTwos(frame);
  const poseAt = (f: number) => fullPose(props.poseFn ? props.poseFn(f) : props.pose);
  const p = props.poseFn ? fullPose(props.poseFn(pf)) : fullPose(props.pose);
  const exName = props.expression && EXPRESSIONS[props.expression] ? props.expression : 'neutral';
  const ex = EXPRESSIONS[exName];
  const voice = props.voice ?? 'bulldog';
  const vis: Viseme = props.viseme ?? visemeAt(voice, frame);
  const jawAt = (f: number) => {
    const v = props.viseme ?? visemeAt(voice, f);
    return MOUTH[v].open / 54;
  };
  const worldX = props.worldX ?? (() => 0);
  const simFrom = props.simFrom ?? frame - 72;
  const sim: SimOut = simulate(frame, simFrom, poseAt, worldX, jawAt);
  const imp = props.impulses ?? [];
  const jolt = imp.length ? wobble(frame, imp, 3.2, 4.5) : 0;
  const joltSlow = imp.length ? wobble(frame, imp, 1.6, 2.6) : 0;
  const talkJiggle = vis !== 'X' ? Math.sin(frame * 2.1) * 1.4 : 0;
  const breath = Math.sin((pf / 48) * Math.PI * 2);
  const blink = blinkAt(pf, seed);
  const monoOut = clamp(props.monocleOut ?? ex.monocle);
  const shake = exName === 'horrified' ? Math.sin(frame * 3.1) * 1.6 : 0;

  const headProps = {
    frame, ex, viseme: vis, jawExtra: p.jaw, blink, lookX: p.lookX, lookY: p.lookY,
    jowlX: sim.jowlX + jolt * 4, jowlY: sim.jowlY + jolt * 7 + talkJiggle, ear: sim.ear + jolt * 6,
    plume1: sim.plume1 + jolt * 10, plume2: sim.plume2 + joltSlow * 14, plumeX: sim.plumeX, plumeDroop: p.plumeDroop,
    hatTip: p.hatTip - sim.plume1 * 0.15, uid, shake,
  };

  const defs = (
    <defs>
      <linearGradient id={`${uid}rim`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={C.goldLight} stopOpacity={0} />
        <stop offset="1" stopColor={C.goldLight} stopOpacity={0.75} />
      </linearGradient>
    </defs>
  );

  if (props.headOnly) {
    const m = { x: EYE_F.x, y: EYE_F.y };
    return (
      <g transform={flip ? 'scale(-1,1)' : undefined}>
        {defs}
        <g filter="url(#boil)">
          <Head {...headProps} />
          {monoOut < 0.5 && <Monocle x={m.x} y={m.y} rot={0} />}
        </g>
      </g>
    );
  }

  // ---- body transforms ----
  const sq = p.squash;
  const sy = 1 - 0.14 * sq, sx = 1 / sy;
  const pelvisY = HIP_Y + p.bodyY;
  const bodyRot = p.lean + p.torso;
  const toLean = (x: number, y: number) => { const r = rot(x, y, p.torso); return { x: r.x, y: r.y + pelvisY }; };
  const toGround = (x: number, y: number) => rot(x, y, p.lean);
  // hips / feet
  const hipF = toGround(26, pelvisY + 6), hipB = toGround(-30, pelvisY + 6);
  const ankF = { x: 24 + p.stepF, y: -12 - p.liftF }, ankB = { x: -26 + p.stepB, y: -12 - p.liftB };
  // cape anchors (lean space)
  const cSL = toLean(-100, -124), cSR = toLean(98, -126);
  const hemX = sim.hem * 1.6 + joltSlow * 6;
  const HL = { x: -176 + hemX * 1.2, y: -4 }, HR = { x: 138 + hemX * 0.8, y: -4 };
  const hemWave = (x0: number, x1: number, n: number, amp: number) => {
    let d = ''; const step = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const xa = x1 - step * (i + 0.5), xb = x1 - step * (i + 1);
      const ph = Math.sin(frame * 0.12 + i * 1.7) * 2 + hemX * 0.15 * (i % 2 ? 1 : -1);
      d += ` Q ${f1(xa)},${f1(-4 + (i % 2 ? amp : -amp * 0.4) + ph)} ${f1(xb)},${f1(-4)}`;
    }
    return d;
  };
  const capeD = `M ${f1(cSL.x)},${f1(cSL.y)} C ${f1(cSL.x - 70)},${f1(cSL.y + 40)} ${f1(HL.x - 6)},${f1(HL.y - 150)} ${f1(HL.x)},${f1(HL.y)} L ${f1(HR.x)},${f1(HR.y)} C ${f1(HR.x + 4)},${f1(HR.y - 150)} ${f1(cSR.x + 64)},${f1(cSR.y + 40)} ${f1(cSR.x)},${f1(cSR.y)} Q ${f1((cSL.x + cSR.x) / 2)},${f1(Math.min(cSL.y, cSR.y) - 26)} ${f1(cSL.x)},${f1(cSL.y)} Z`;
  const capeHemD = `M ${f1(HR.x)},-4` + hemWave(HL.x, HR.x, 6, 7);
  const lin = { l: { x: HL.x + 52, y: -4 }, r: { x: HR.x - 44, y: -4 } };
  const liningD = `M ${f1(cSL.x + 16)},${f1(cSL.y + 26)} C ${f1(cSL.x - 20)},${f1(cSL.y + 90)} ${f1(lin.l.x)},${f1(lin.l.y - 120)} ${f1(lin.l.x)},${f1(lin.l.y)} L ${f1(lin.r.x)},${f1(lin.r.y)} C ${f1(lin.r.x)},${f1(lin.r.y - 120)} ${f1(cSR.x + 18)},${f1(cSR.y + 90)} ${f1(cSR.x - 14)},${f1(cSR.y + 26)} Z`;

  // neck/head
  const neckY = NECK.y + p.headY - breath * 1.5;
  const headRot = p.head;
  // monocle (torso space)
  const monoEye = (() => { const r = rot(EYE_F.x, EYE_F.y, headRot); return { x: NECK.x + r.x, y: neckY + r.y }; })();
  const anchor = { x: 112, y: -128 };
  const monoHang = { x: anchor.x + sim.mono * 1.5 + 4, y: anchor.y + 46 };
  const mono = { x: monoEye.x + (monoHang.x - monoEye.x) * monoOut, y: monoEye.y + (monoHang.y - monoEye.y) * monoOut };
  const chainStart = { x: mono.x + 8, y: mono.y + 28 };
  const chainMid = { x: (chainStart.x + anchor.x) / 2 - sim.mono * 1.4 + 14, y: Math.max(chainStart.y, anchor.y) + 30 - monoOut * 20 };
  // scissors pendant
  const scisAng = -bodyRot - sim.scis * 1.3 + joltSlow * 12;
  const btnAng = -bodyRot - sim.button * 2 + jolt * 20;
  // pearls
  const pearlAbs = bodyRot - p.armF - p.foreF - p.pawF;

  // waistcoat
  const pw = 1 + 0.07 * p.puff + breath * 0.012;
  const wcD = `M -62,-146 C -128,-132 -146,-58 -116,-12 C -94,14 -44,20 -12,18 L 0,6 L 12,18 C 44,20 100,14 120,-12 C 150,-58 130,-132 66,-146 Q 2,-156 -62,-146 Z`;
  const gap = 2 + p.puff * 4;

  const farArm = <Arm side="B" arm={p.armB} fore={p.foreB} paw={p.pawB} hand={p.handB} />;

  return (
    <g transform={flip ? 'scale(-1,1)' : undefined}>
      {defs}
      <g filter="url(#boil)">
        {/* ground contact shadow */}
        <ellipse cx={-10} cy={2} rx={170} ry={12} fill={C.ink} opacity={0.2} />
        <g transform={`scale(${f1(sx * 1000 / 1000)},${sy.toFixed(3)})`}>
          {/* --- CAPE (behind all) --- */}
          <g transform={`rotate(${p.lean})`}>
            <path d={capeD} transform="translate(7,6)" fill={C.ink} opacity={0.25} />
            <path d={capeD} fill={C.leopard} {...ink(S.inkBold)} />
            <clipPath id={`${uid}cape`}><path d={capeD} /></clipPath>
            <g clipPath={`url(#${uid}cape)`}>
              <path d={ROSETTES.coreD} fill={C.bulldogShade} opacity={0.9} />
              <path d={ROSETTES.ringD} fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
              <path d={ROSETTES.dotD} fill={C.ink} />
              <path d={capeD} fill="url(#halftoneFine)" opacity={0.6} transform="translate(-40,0)" />
            </g>
            <path d={liningD} fill={C.curtainDark} {...ink(S.ink)} />
            <path d={`M ${f1(lin.l.x + 30)},-8 Q ${f1(lin.l.x + 24)},-80 ${f1(cSL.x + 20)},${f1(cSL.y + 70)} M ${f1(lin.r.x - 26)},-8 Q ${f1(lin.r.x - 20)},-80 ${f1(cSR.x - 16)},${f1(cSR.y + 70)}`} fill="none" stroke={C.hotPink} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
            <path d={capeHemD} fill="none" {...ink(S.ink)} />
          </g>
          {/* --- LEGS & SHOES --- */}
          {[{ h: hipB, a: ankB, far: true }, { h: hipF, a: ankF, far: false }].map(({ h, a, far }) => (
            <g key={far ? 'lb' : 'lf'}>
              <path d={`M ${f1(h.x)},${f1(h.y)} L ${f1(a.x)},${f1(a.y - 4)}`} stroke={C.ink} strokeWidth={36} strokeLinecap="round" />
              <path d={`M ${f1(h.x + 8)},${f1(h.y + 6)} L ${f1(a.x + 6)},${f1(a.y - 10)}`} stroke={C.plum} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
              <g transform={`translate(${f1(a.x)},${f1(a.y)}) rotate(${far ? -4 : 2})`}>
                <path d="M -16,-8 C -20,4 -12,10 4,10 L 34,9 C 46,8 54,0 52,-12 C 44,-4 30,-10 12,-14 C 0,-16 -12,-14 -16,-8 Z" fill={C.ink} {...ink(S.inkThin)} />
                <path d="M 6,2 Q 22,3 38,1" fill="none" stroke={C.white} strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
                <path d="M -18,-10 C -16,-20 14,-22 16,-12 L 12,-4 C 0,-2 -12,-2 -16,-4 Z" fill={C.pearl} {...ink(S.inkThin)} />
                <circle cx={10} cy={-9} r={2.6} fill={C.gold} />
              </g>
            </g>
          ))}
          {/* --- TORSO --- */}
          <g transform={`rotate(${p.lean})`}>
            <g transform={`translate(0,${f1(pelvisY)}) rotate(${p.torso})`}>
              {!p.armBFront && farArm}
              {/* waistcoat */}
              <g transform={`scale(${pw.toFixed(3)},${(1 + breath * 0.008).toFixed(3)})`}>
                <path d={wcD} transform="translate(6,6)" fill={C.ink} opacity={0.25} />
                <path d={wcD} fill={C.curtain} {...ink(S.inkBold)} />
                <clipPath id={`${uid}wc`}><path d={wcD} /></clipPath>
                <g clipPath={`url(#${uid}wc)`}>
                  <path d={Array.from({ length: 18 }, (_, i) => `M ${-118 + i * 14},-160 L ${-118 + i * 14 + (i - 8.5) * 2.2},20`).join(' ')} stroke={C.gold} strokeWidth={1.8} opacity={0.7} />
                  <path d="M -130,-160 C -86,-120 -100,-40 -70,20 L -130,20 Z" fill="url(#halftone)" />
                  <path d="M 120,-150 C 88,-110 104,-40 86,16 L 130,16 Z" fill={C.coral} opacity={0.35} />
                </g>
                {/* strained button gaps + pull lines */}
                <path d={[-86, -58, -30].map((y) => `M 0,${y - 9} Q ${gap},${y} 0,${y + 9} Q ${-gap},${y} 0,${y - 9} Z`).join(' ')} fill={C.white} {...ink(2)} />
                <path d={[-100, -72, -44].map((y) => `M -6,${y} Q -18,${y + 4} -30,${y + 12} M 6,${y} Q 18,${y + 4} 30,${y + 12}`).join(' ')} fill="none" stroke={C.curtainDark} strokeWidth={3} strokeLinecap="round" />
                {[-100, -72, -44].map((y) => <circle key={y} cx={0} cy={y} r={6.5} fill={C.gold} {...ink(2.4)} />)}
                {/* dangling popped button */}
                <g transform={`translate(0,-16) rotate(${btnAng.toFixed(1)})`}>
                  <path d="M 0,0 L 0,16" stroke={C.ink} strokeWidth={1.6} />
                  <circle cx={0} cy={20} r={6} fill={C.gold} {...ink(2.4)} />
                </g>
              </g>
              {/* scissors pendant */}
              <g transform={`translate(-22,-118) rotate(${scisAng.toFixed(1)})`}>
                <path d="M 0,0 L 0,56" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
                <path d="M 0,0 L 0,56" stroke={C.gold} strokeWidth={2.4} strokeDasharray="4 4" strokeLinecap="round" />
                <g transform="translate(0,58)">
                  <path d="M -3,4 L 7,40 L 2,40 Z M 3,4 L -7,40 L -2,40 Z" fill={C.goldLight} {...ink(2.2)} />
                  <circle cx={-6} cy={0} r={6} fill="none" stroke={C.ink} strokeWidth={5.5} />
                  <circle cx={6} cy={0} r={6} fill="none" stroke={C.ink} strokeWidth={5.5} />
                  <circle cx={-6} cy={0} r={6} fill="none" stroke={C.gold} strokeWidth={2.6} />
                  <circle cx={6} cy={0} r={6} fill="none" stroke={C.gold} strokeWidth={2.6} />
                </g>
              </g>
              {/* ruff */}
              <g transform={`translate(${NECK.x},${f1(neckY + 10)}) rotate(${(headRot * 0.25).toFixed(1)})`}>
                <Ruff uid={uid} />
              </g>
              {/* head */}
              <g transform={`translate(${NECK.x},${f1(neckY)}) rotate(${headRot})`}>
                <Head {...headProps} />
              </g>
              {/* monocle chain + monocle */}
              <path d={`M ${f1(chainStart.x)},${f1(chainStart.y)} Q ${f1(chainMid.x)},${f1(chainMid.y)} ${anchor.x},${anchor.y}`} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
              <path d={`M ${f1(chainStart.x)},${f1(chainStart.y)} Q ${f1(chainMid.x)},${f1(chainMid.y)} ${anchor.x},${anchor.y}`} fill="none" stroke={C.gold} strokeWidth={2.4} strokeDasharray="3 4" strokeLinecap="round" />
              <Monocle x={mono.x} y={mono.y} rot={headRot + monoOut * (sim.mono * 2 + 20)} />
              {p.armBFront > 0.5 && farArm}
              <Arm side="F" arm={p.armF} fore={p.foreF} paw={p.pawF} hand={p.handF}>
                {props.holdPearls && <PearlStrand frame={frame} absRot={pearlAbs} swing={props.pearlSwing ?? 0} lag={sim.pearl} />}
              </Arm>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

const Monocle: React.FC<{ x: number; y: number; rot: number }> = ({ x, y, rot }) => (
  <g transform={`translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})`}>
    <circle r={31} fill={C.white} opacity={0.18} />
    <circle r={31} fill="none" stroke={C.ink} strokeWidth={10} />
    <circle r={31} fill="none" stroke={C.gold} strokeWidth={5} />
    <path d="M -16,-14 Q -8,-22 2,-24" fill="none" stroke={C.white} strokeWidth={3.5} strokeLinecap="round" opacity={0.8} />
    <circle cx={8} cy={31} r={3.5} fill={C.gold} {...ink(2)} />
  </g>
);

export default Bulldog;

// ---------------- MODEL SHEET ----------------
const Label: React.FC<{ x: number; y: number; t: string; size?: number }> = ({ x, y, t, size = 17 }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={F.sans} fontSize={size} letterSpacing={2} fill={C.ink}>{t.toUpperCase()}</text>
);

export const Sheet: React.FC = () => {
  const frame = useCurrentFrame();
  const poseNames = Object.keys(POSES);
  // hero idle with a pompous harrumph to show the springs
  const heroPose = (f: number) => {
    const u = (f % 96);
    const t = u < 30 ? 0 : u < 38 ? (u - 30) / 8 : u < 60 ? 1 : u < 70 ? 1 - (u - 60) / 10 : 0;
    const e = t * t * (3 - 2 * t);
    return blendPose(POSES.idle, { ...POSES.idle, head: -20, headY: -10, lean: -6, puff: 1 }, e);
  };
  const heroExpr = frame % 96 >= 32 && frame % 96 < 66 ? 'proud' : 'neutral';
  const x0 = 640, colW = (1900 - x0) / 8;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <BoilDefs frame={frame} />
        <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
        <rect x={610} y={20} width={1290} height={1040} fill={C.paperDark} opacity={0.5} rx={12} />
        <text x={40} y={70} fontFamily={F.display} fontSize={46} fill={C.ink} fontStyle="italic">Monsieur Bouledogue</text>
        <text x={42} y={102} fontFamily={F.sans} fontSize={17} letterSpacing={3} fill={C.curtain}>COUTURIER · MODEL SHEET · H 420</text>
        <line x1={60} x2={560} y1={1010} y2={1010} stroke={C.ink} strokeWidth={3} opacity={0.4} />
        <g transform="translate(330,1010) scale(1.42)">
          <Bulldog frame={frame} poseFn={heroPose} expression={heroExpr} viseme={frame % 96 >= 44 && frame % 96 < 56 ? 'D' : 'X'} />
        </g>
        {/* poses */}
        {poseNames.map((n, i) => {
          const cx = x0 + colW * (i + 0.5);
          const isWhip = n === 'pearlWhip';
          const ex = ({ shout: 'angry', point: 'angry', pearlWhip: 'angry', shocked: 'shocked', pained: 'pained', bow: 'smug', smug: 'smug', idle: 'proud' } as Record<string, string>)[n];
          const vis: Viseme = n === 'shout' ? 'D' : n === 'pearlWhip' ? 'C' : 'X';
          return (
            <g key={n}>
              <g transform={`translate(${cx},352) scale(0.37)`}>
                <Bulldog frame={frame} pose={POSES[n]} expression={ex} viseme={vis} seed={n} holdPearls={isWhip} pearlSwing={isWhip ? Math.sin(frame * 0.26) * 70 : 0} />
              </g>
              <Label x={cx} y={384} t={n} />
            </g>
          );
        })}
        {/* expressions (head close-ups) */}
        {EXPRESSION_NAMES.filter((n) => n !== 'neutral').map((n, i) => {
          const cx = x0 + colW * (i + 0.5);
          return (
            <g key={n}>
              <g transform={`translate(${cx},660) scale(0.62)`}>
                <Bulldog frame={frame} headOnly expression={n} viseme="X" seed={n} pose={{ lookX: n === 'smug' ? 0.8 : 0.3 }} />
              </g>
              <Label x={cx} y={700} t={n} />
            </g>
          );
        })}
        {/* waddle + blend */}
        {(() => {
          const w = waddlePose(frame);
          const cx = x0 + colW * 6.5;
          return (
            <g>
              <g transform={`translate(${cx},${672 + w.bob * 0.44}) scale(0.44)`}>
                <Bulldog frame={frame} poseFn={(f) => waddlePose(f).pose} worldX={(f) => waddlePose(f).x} expression="proud" seed="w" />
              </g>
              <Label x={cx} y={700} t="waddle" />
            </g>
          );
        })()}
        {(() => {
          const cx = x0 + colW * 7.5;
          const fn = (f: number) => { const t = (Math.sin((f / 96) * Math.PI * 2) + 1) / 2; return blendPose(POSES.idle, POSES.shout, t * t * (3 - 2 * t)); };
          return (
            <g>
              <g transform={`translate(${cx},672) scale(0.44)`}>
                <Bulldog frame={frame} poseFn={fn} expression="angry" viseme={frame % 24 < 12 ? 'C' : 'D'} seed="b" />
              </g>
              <Label x={cx} y={700} t="blend idle→shout" />
            </g>
          );
        })()}
        {/* visemes */}
        {VISEMES.map((v, i) => {
          const cw = (1900 - x0) / 9;
          const cx = x0 + cw * (i + 0.5);
          return (
            <g key={v}>
              <g transform={`translate(${cx},990) scale(0.52)`}>
                <Bulldog frame={frame} headOnly expression="neutral" viseme={v} seed={v} />
              </g>
              <Label x={cx} y={1035} t={v} size={22} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
