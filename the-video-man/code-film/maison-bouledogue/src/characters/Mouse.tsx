// PIPETTE — the deadpan, hyper-competent mouse seamstress-assistant.
// Local coords: origin = ground point between feet, facing +x, up = -y. Height ~170px at scale 1.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { CharProps, Viseme } from '../lib/types';
import { C, F, ink } from '../lib/style';
import { onTwos, wobble, clamp, lerp } from '../lib/motion';
import { BoilDefs } from '../lib/fx';
import { POSE_KEYS, POSES, DEFAULT_POSE, EXPRESSIONS, blendPose, runPose, clapPose, hammerSwingAt, blinkAt, type Pose } from './mouse/rig';
import { Eye, Mouth, Ladder, chainPts, ribbonPath, LW } from './mouse/parts';

export { POSE_KEYS, POSES, EXPRESSIONS, blendPose, runPose, clapPose, hammerSwingAt, Ladder };
export const VISEMES: Viseme[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];

/**
 * Extra props (besides CharProps):
 *  - vel?: number            horizontal speed px/frame in facing direction (tape scarf/tail/ears stream back)
 *  - impulses?: [frame, amp][] kicks for all springs (e.g. hammer impacts, landings, a gasp). amp ~ 1 typical.
 *  - poseFn?: (f) => pose    pose as a function of frame -> springs follow real body motion (overlap / drag)
 *  - xFn?: (f) => number     world x of the root over time (for drag when she is moved around by the shot)
 *  - blink?: boolean         seeded blinking (default true)
 *  - showHammer?: boolean    force hammer prop visibility (default from pose.hammer)
 */
export interface MouseProps extends CharProps {
  vel?: number;
  impulses?: [number, number][];
  poseFn?: (f: number) => Pose;
  xFn?: (f: number) => number;
  blink?: boolean;
  showHammer?: boolean;
}

// Damped follower history: returns lag(d) = follower - target at (frame - d), d in [0, win).
const lagHistory = (sig: (f: number) => number, frame: number, win: number, k: number, c: number) => {
  const from = frame - win;
  let x = sig(from), v = 0;
  const hist: number[] = [];
  const dt = 1 / 48;
  for (let f = from; f <= frame; f++) {
    const t0 = sig(f);
    hist.push(x - t0);
    const t1 = sig(f + 0.5);
    for (const tg of [t0, t1]) { const a = k * (tg - x) - c * v; v += a * dt; x += v * dt; }
  }
  return (d: number) => {
    const i = clamp(hist.length - 1 - d, 0, hist.length - 1);
    const i0 = Math.floor(i), i1 = Math.min(hist.length - 1, i0 + 1);
    return lerp(hist[i0], hist[i1], i - i0);
  };
};

const full = (p?: Pose): Pose => ({ ...DEFAULT_POSE, ...(p ?? {}) });

/** Resolve hammer override: near arm driven by hammerSwing. */
const resolve = (p: Pose): Pose => {
  if ((p.hammer ?? 0) < 0.5) return p;
  const s = p.hammerSwing ?? 0;
  return {
    ...p,
    nearSh: lerp(168, 56, s),
    nearEl: lerp(36, 6, s),
    lean: p.lean + lerp(-5, 4, s),
    headTilt: p.headTilt + lerp(-8, 5, s),
    squash: p.squash * (1 - 0.05 * clamp((s - 0.85) / 0.3)),
  };
};

const Limb: React.FC<{ len: number; w: number; fill: string }> = ({ len, w, fill }) => (
  <>
    <line x1={0} y1={0} x2={0} y2={len} {...ink(w + LW.main * 2)} />
    <line x1={0} y1={0} x2={0} y2={len} stroke={fill} strokeWidth={w} strokeLinecap="round" />
  </>
);

const Mouse: React.FC<MouseProps> = (props) => {
  const { frame, expression = 'deadpan', viseme = 'X', flip, seed = 'pipette', vel = 0, impulses = [], poseFn, xFn, blink = true } = props;
  const f2 = onTwos(frame);
  const p = resolve(full(props.pose));
  const ex = EXPRESSIONS[expression] ?? EXPRESSIONS.deadpan;

  // --- breathing (on twos) ---
  const br = Math.sin((2 * Math.PI * f2) / 52);
  const breathe = 1 + 0.018 * br;

  // --- secondary motion signals (on ones) ---
  const sway = (f: number) => {
    const q = poseFn ? resolve(full(poseFn(f))) : p;
    return (xFn ? xFn(f) : 0) * (flip ? -1 : 1) + (q.lean + q.headTilt * 0.6) * 1.1;
  };
  const bob = (f: number) => {
    const q = poseFn ? resolve(full(poseFn(f))) : p;
    return q.bodyY + (q.squash - 1) * 60;
  };
  const swayLag = poseFn || xFn ? lagHistory(sway, frame, 30, 70, 6) : () => 0;
  const bobLag = poseFn ? lagHistory(bob, frame, 30, 90, 7) : () => 0;
  const kick = (lagF: number, hz = 2.4, dec = 3.2) => wobble(frame - lagF, impulses, hz, dec);
  const drag = clamp(vel, -12, 12);
  const idle = (ph: number, amp: number, per = 70) => amp * Math.sin((2 * Math.PI * (frame + ph)) / per);

  // --- geometry ---
  const sx = 1 / Math.sqrt(p.squash), sy = p.squash;
  const hipY = -27 + p.bodyY;
  const HS = 1.22; // head scale (big head = appeal)
  const earBack = clamp(p.earBack + ex.earBack);

  // tail: 12 segments, curls up at the end
  const tailAngles: number[] = [];
  {
    let a = 150 + p.tailLift + drag * 1.5;
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      a += (i === 0 ? 0 : p.tailCurl * (9 * t + 42 * t ** 4) - 1)
        + (-swayLag(i * 0.6) * 0.5 - bobLag(i * 0.6) * 0.4) * (0.3 + t)
        + idle(i * 3, 1.6 * (0.3 + t), 64) + kick(i * 0.7) * 9 * t;
      tailAngles.push(a);
    }
  }
  const tailPts = chainPts(-14, -1, tailAngles, 7);
  const tailD = ribbonPath(tailPts, (i) => lerp(3.2, 1.1, i / (tailPts.length - 1)));

  // tape-measure scarf tails (in torso space, from knot at back of neck)
  const scarfTail = (n: number, base: number, ph: number) => {
    const angs: number[] = [];
    let a = base + drag * 5 - (vel > 6 ? 0 : 0);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      a += (i === 0 ? 0 : -1.5 + 6 * t) + (-swayLag(i * 0.7 + ph) * 0.9 - bobLag(i * 0.7) * 0.9) * (0.25 + t * 0.8)
        + idle(ph * 10 + i * 4, 2.4 * (0.3 + t) + Math.abs(drag) * 0.6 * t, drag > 3 ? 14 : 58) + kick(i * 0.8 + ph, 2.2) * 12 * t;
      angs.push(clamp(a, 60, 200));
    }
    return chainPts(-7, -40, angs, 7.5);
  };
  const scarfA = scarfTail(9, 132, 0);
  const scarfB = scarfTail(7, 116, 1.2);
  const tapeTicks = (pts: [number, number][]) => pts.slice(0, -1).map((q, i) => {
    const r = pts[i + 1];
    const dx = r[0] - q[0], dy = r[1] - q[1], d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d;
    const mx = (q[0] + r[0]) / 2, my = (q[1] + r[1]) / 2;
    const L = i % 2 === 0 ? 3.4 : 2;
    return <line key={i} x1={mx + nx * 3} y1={my + ny * 3} x2={mx + nx * (3 - L)} y2={my + ny * (3 - L)} stroke={C.ink} strokeWidth={0.9} />;
  });
  const endTab = (pts: [number, number][]) => {
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    return <rect x={-1} y={-3.6} width={4} height={7.2} fill={C.gold} {...ink(1.1)} transform={`translate(${b[0]} ${b[1]}) rotate(${ang})`} />;
  };

  // ears (spring)
  const earSpring = -swayLag(1.5) * 0.6 + bobLag(1.5) * 1.3 + kick(1.5, 2.6) * 10 + idle(10, 1.2, 80) - drag * 1.4;
  const earSpringF = -swayLag(2.5) * 0.6 + bobLag(2.5) * 1.3 + kick(2.5, 2.6) * 10 + idle(30, 1.2, 80) - drag * 1.4;
  // whiskers
  const whisk = bobLag(1) * 1.4 + kick(1, 3.4, 4) * 12 + idle(0, 2, 44) - drag * 1.2;
  // scissors on back
  const sciss = -swayLag(2) * 0.25 + kick(2, 3, 5) * 5 + bobLag(2) * 0.3;

  const blinkAmt = blink ? blinkAt(frame, seed) : 0;
  const lidN = Math.max(ex.lidN, blinkAmt), lidF = Math.max(ex.lidF, blinkAmt);
  const eyeS = ex.eye;

  // hammer
  const showHammer = props.showHammer ?? p.hammer >= 0.5;

  const FUR = C.mouseFur, SH = C.mouseShade;

  // ---- sub-renderers ----
  const leg = (side: 'near' | 'far') => {
    const h = side === 'near' ? p.nearHip : p.farHip;
    const k = side === 'near' ? p.nearKnee : p.farKnee;
    const hx = p.hipX + (side === 'near' ? 4 : -5);
    const fill = side === 'near' ? FUR : SH;
    return (
      <g transform={`translate(${hx} ${hipY}) rotate(${-h})`}>
        <Limb len={12} w={6.4} fill={fill} />
        <g transform={`translate(0 12) rotate(${k})`}>
          <Limb len={12} w={5.8} fill={fill} />
          <g transform={`translate(0 12) rotate(${h - k})`}>
            <path d="M -4 -2.5 C -5 4 2 5.5 16 4 C 21 3.2 21 -1.5 16 -2.5 C 9 -3.6 1 -5 -4 -2.5 Z"
              fill={side === 'near' ? C.blush : C.coral} {...ink(LW.detail)} />
          </g>
        </g>
      </g>
    );
  };

  const arm = (side: 'near' | 'far') => {
    const sh = side === 'near' ? p.nearSh : p.farSh;
    const el = side === 'near' ? p.nearEl : p.farEl;
    const pos = side === 'near' ? [6, -33] : [-4, -35];
    const fill = side === 'near' ? FUR : SH;
    return (
      <g transform={`translate(${pos[0]} ${pos[1]}) rotate(${-sh})`}>
        <Limb len={16} w={5} fill={fill} />
        <g transform={`translate(0 16) rotate(${-el})`}>
          <Limb len={14} w={4.6} fill={fill} />
          {side === 'near' && (
            // pincushion bracelet bristling with pins
            <g transform="translate(0 10)">
              {[-60, -25, 10, 45, 80, 115].map((a, i) => {
                const r = (a * Math.PI) / 180;
                const x2 = Math.cos(r) * 8.5, y2 = Math.sin(r) * 6.5 - 1;
                return (
                  <g key={i}>
                    <line x1={0} y1={0} x2={x2} y2={y2} stroke={C.ink} strokeWidth={0.9} />
                    <circle cx={x2} cy={y2} r={1.35} fill={[C.hotPink, C.goldLight, C.white, C.teal, C.mustard, C.hotPink][i]} {...ink(0.7)} />
                  </g>
                );
              })}
              <ellipse cx={0} cy={0} rx={5.8} ry={3.6} fill={C.curtain} {...ink(1.6)} />
              <path d="M -3.6 -0.8 Q 0 1.6 3.6 -0.8" fill="none" stroke={C.curtainDark} strokeWidth={0.9} />
            </g>
          )}
          <g transform="translate(0 15)">
            {side === 'near' && showHammer && (
              <g transform="rotate(40)">
                <line x1={-4} y1={0} x2={26} y2={0} {...ink(6)} />
                <line x1={-4} y1={0} x2={26} y2={0} stroke={C.leopard} strokeWidth={3} strokeLinecap="round" />
                <g transform="translate(27 0)">
                  <rect x={-4.5} y={-6} width={9} height={17} rx={1.6} fill={C.navy} {...ink(LW.detail)} />
                  <path d="M -4.5 -6 L -2.5 -14 Q 0 -16 2.5 -14 L 4.5 -6 Z" fill={C.navy} {...ink(1.6)} />
                  <line x1={-2.2} y1={-4} x2={-2.2} y2={8} stroke={C.tealLight} strokeWidth={1.2} />
                </g>
              </g>
            )}
            {side === 'near' && p.point > 0.5 && (
              // finger-gun: index finger along the forearm, thumb cocked
              <g>
                <line x1={0} y1={0} x2={0} y2={10} {...ink(5.2)} />
                <line x1={0} y1={0} x2={0} y2={10} stroke={FUR} strokeWidth={2.4} strokeLinecap="round" />
                <line x1={0} y1={0} x2={-6} y2={-1} {...ink(4.6)} />
                <line x1={0} y1={0} x2={-6} y2={-1} stroke={FUR} strokeWidth={2} strokeLinecap="round" />
              </g>
            )}
            <circle cx={0.6} cy={0} r={4.4} fill={side === 'near' ? FUR : SH} {...ink(LW.detail)} />
            <path d="M 2.4 -2 Q 5.6 -1 4.4 2" fill="none" {...ink(1.1)} />
          </g>
        </g>
      </g>
    );
  };

  const ear = (side: 'near' | 'far') => {
    const near = side === 'near';
    const base = near ? -24 : 20;
    const back = earBack * (near ? -46 : -40);
    const rot = base + back + (near ? earSpring : earSpringF);
    const r = near ? 21 : 18.5;
    return (
      <g transform={`translate(${near ? -14 : 4} ${near ? -41 : -46}) rotate(${rot}) scale(1 ${1 - earBack * 0.18})`}>
        <circle cx={0} cy={-r * 0.9} r={r} fill={near ? FUR : SH} {...ink(LW.main)} />
        <circle cx={near ? 1.5 : -1} cy={-r * 0.95} r={r * 0.66} fill={C.blush} opacity={0.82} />
        <circle cx={near ? -2 : 1} cy={-r * 1.05} r={r * 0.38} fill={C.coral} opacity={0.28} />
        <path d={`M ${-r * 0.45} ${-r * 1.4} Q 0 ${-r * 1.62} ${r * 0.45} ${-r * 1.4}`} fill="none" stroke={C.white} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
      </g>
    );
  };

  const whiskers = (near: boolean) => {
    const set = near ? [-14, 0, 13] : [-10, 8];
    const len = near ? 20 : 13;
    return (
      <g transform={`translate(${near ? 29 : 31} ${near ? -15 : -17})`}>
        {set.map((a, i) => (
          <g key={i} transform={`rotate(${a + whisk * (1 + i * 0.25)})`}>
            <path d={`M 0 0 Q ${len * 0.55} ${-1.5 + i} ${len} ${2 + i * 0.8}`} fill="none" stroke={C.ink} strokeWidth={1.1} strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  };

  const head = (
    <g transform={`translate(3 -43) rotate(${p.headTilt + br * 0.6}) scale(${HS})`}>
      {ear('far')}
      {ear('near')}
      {whiskers(false)}
      {/* head silhouette: round cranium + pointed snout */}
      <path d="M 35 -14 C 33 -2 16 3 0 0 C -18 -3 -27 -18 -25 -32 C -23 -48 -8 -56 6 -54 C 20 -52 26 -40 29 -30 C 31 -24 36 -20 35 -14 Z"
        fill={FUR} {...ink(LW.main)} />
      {/* halftone back-of-head shade + rim */}
      <path d="M -24 -30 C -24 -14 -14 -4 -2 -2 C -12 -8 -17 -20 -16 -34 C -15 -44 -10 -50 -4 -53 C -16 -50 -24 -42 -24 -30 Z" fill="url(#halftone)" />
      <path d="M 4 -51 C 14 -50 22 -42 25 -34" fill="none" stroke={C.pearl} strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />
      {/* cheek */}
      <circle cx={8} cy={-12} r={5.5} fill={C.blush} opacity={0.6} />
      {/* eyes + spectacles */}
      <g transform={`translate(12 -28) scale(${eyeS}) translate(-12 28)`}>
        <Eye x={5} y={-29} rx={4.4} ry={5.4} lid={lidN} lookX={p.lookX} lookY={p.lookY} pupil={ex.pupil} wink={ex.winkN && blinkAmt < 2}
          browRot={-ex.browN} browY={ex.browY} browLen={8} />
        <Eye x={18.5} y={-28} rx={3.7} ry={5} lid={lidF} lookX={p.lookX} lookY={p.lookY} pupil={ex.pupil * 0.9}
          browRot={ex.browF} browY={ex.browY + 0.5} browLen={6} />
      </g>
      {/* tiny round spectacles */}
      <g>
        <line x1={-1.8} y1={-29} x2={-13} y2={-31} stroke={C.gold} strokeWidth={1.4} />
        <circle cx={5} cy={-29} r={7} fill="none" stroke={C.ink} strokeWidth={3.4} />
        <circle cx={18.5} cy={-28} r={5.8} fill="none" stroke={C.ink} strokeWidth={3.1} />
        <circle cx={5} cy={-29} r={7} fill={C.white} fillOpacity={0.14} stroke={C.goldLight} strokeWidth={1.5} />
        <circle cx={18.5} cy={-28} r={5.8} fill={C.white} fillOpacity={0.14} stroke={C.goldLight} strokeWidth={1.3} />
        <path d="M 11.8 -29.5 Q 12.3 -32 12.9 -29.2" fill="none" stroke={C.gold} strokeWidth={1.4} />
        <path d="M 1.5 -33 Q 3.5 -35 6 -34.6" fill="none" stroke={C.white} strokeWidth={1.2} strokeLinecap="round" opacity={0.9} />
      </g>
      {/* nose */}
      <circle cx={35} cy={-17.5} r={4.3} fill={C.hotPink} {...ink(LW.detail)} />
      <circle cx={34} cy={-19} r={1.2} fill={C.white} opacity={0.8} />
      {whiskers(true)}
      {/* mouth */}
      <g transform="translate(23 -9.5) scale(0.95)">
        <Mouth v={viseme} corner={ex.corner} smirk={ex.smirk} />
      </g>
    </g>
  );

  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      {/* paper-cut drop shadow on the floor */}
      <ellipse cx={0} cy={1} rx={30} ry={4.5} fill={C.ink} opacity={0.25} />
      <g transform={`scale(${sx} ${sy})`}>
        {leg('far')}
        <g transform={`translate(${p.hipX} ${hipY}) rotate(${p.lean})`}>
          {/* tail */}
          <path d={tailD} fill={C.blush} {...ink(LW.detail)} />
          {/* scarf tails trail behind */}
          <g>
            <path d={ribbonPath(scarfB, () => 3.2)} fill={C.mustard} {...ink(1.6)} />
            {tapeTicks(scarfB)}
            {endTab(scarfB)}
            <path d={ribbonPath(scarfA, () => 3.4)} fill={C.mustard} {...ink(1.6)} />
            {tapeTicks(scarfA)}
            {endTab(scarfA)}
          </g>
          {arm('far')}
          {/* giant gold tailor's scissors strapped to her back */}
          <g transform={`translate(-17 -16) rotate(${-18 + sciss}) scale(1.2)`}>
            <path d="M -1 2 C -6 -12 -7.5 -36 -3.5 -54 C -1 -44 1 -20 2.2 2 Z" fill={C.goldLight} {...ink(LW.detail)} />
            <path d="M 1.4 2 C 4 -14 8.5 -34 7 -51 C 3 -40 -0.5 -20 -1.8 2 Z" fill={C.gold} {...ink(LW.detail)} />
            <path d="M -3.2 -10 C -4.2 -26 -4.3 -40 -3.5 -48" fill="none" stroke={C.white} strokeWidth={1} opacity={0.7} />
            <circle cx={0.2} cy={0} r={2} fill={C.ink} />
            <ellipse cx={-6} cy={11} rx={5.2} ry={7} fill="none" stroke={C.ink} strokeWidth={6} />
            <ellipse cx={-6} cy={11} rx={5.2} ry={7} fill="none" stroke={C.gold} strokeWidth={2.8} />
            <ellipse cx={5.5} cy={10} rx={4.2} ry={5.8} fill="none" stroke={C.ink} strokeWidth={5.6} />
            <ellipse cx={5.5} cy={10} rx={4.2} ry={5.8} fill="none" stroke={C.gold} strokeWidth={2.6} />
          </g>
          {/* torso (breathing) */}
          <g transform={`scale(${1.1 / Math.sqrt(breathe)} ${0.84 * breathe})`}>
            <path d="M -15 4 C -22 -14 -16 -44 2 -52 C 14 -47 20 -22 17 4 C 10 9 -8 9 -15 4 Z" fill={FUR} {...ink(LW.main)} />
            <path d="M -15 4 C -21 -14 -15 -40 -3 -49 C -10 -38 -12 -16 -6 6 C -9 6 -13 5 -15 4 Z" fill="url(#halftone)" />
            {/* teal apron with pocket */}
            <path d="M -1 -40 L 11 -41 C 17 -28 21 -10 18 5 C 12 8 2 8 -5 6 C -3 -10 -5 -26 -1 -40 Z" fill={C.teal} {...ink(LW.detail)} />
            <path d="M 16 -30 C 19 -18 20 -6 18 5" fill="none" stroke={C.tealLight} strokeWidth={1.6} opacity={0.8} />
            <line x1={-13} y1={-20} x2={1} y2={-22} {...ink(1.6)} />
            {/* pocket full of pins & a spool */}
            <g transform="translate(8 -12)">
              <line x1={-3} y1={-2} x2={-5} y2={-11} stroke={C.ink} strokeWidth={0.9} />
              <circle cx={-5} cy={-11} r={1.5} fill={C.hotPink} {...ink(0.7)} />
              <line x1={0} y1={-2} x2={1} y2={-12} stroke={C.ink} strokeWidth={0.9} />
              <circle cx={1} cy={-12} r={1.5} fill={C.goldLight} {...ink(0.7)} />
              <rect x={3} y={-9} width={5} height={7} rx={1} fill={C.hotPink} {...ink(1)} />
              <rect x={2.2} y={-10} width={6.6} height={1.8} fill={C.gold} {...ink(0.7)} />
              <rect x={-6} y={-3} width={14} height={10} rx={2} fill={C.tealLight} {...ink(LW.detail)} />
              <line x1={-4} y1={0} x2={6} y2={0} stroke={C.teal} strokeWidth={1} strokeDasharray="1.6 1.6" />
            </g>
            {/* scissors strap across chest */}
            <path d="M -11 -40 L 12 -7" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
            <path d="M -11 -40 L 12 -7" stroke={C.plum} strokeWidth={2.4} strokeLinecap="round" />
            <circle cx={3} cy={-20} r={1.8} fill={C.gold} {...ink(0.8)} />
          </g>
          {head}
          {/* tape-measure scarf band around neck */}
          <g transform="translate(3 -42) rotate(-8)">
            <ellipse cx={0} cy={0} rx={12} ry={4.8} fill={C.mustard} {...ink(LW.detail)} />
            {[-7, -3.5, 0, 3.5, 7].map((x, i) => <line key={i} x1={x} y1={1.5} x2={x} y2={i % 2 ? 4.2 : 3.2} stroke={C.ink} strokeWidth={0.9} />)}
            <path d="M -13 -1 Q -16 3 -10 4" fill="none" {...ink(1.4)} />
          </g>
          {arm('near')}
        </g>
        {leg('near')}
      </g>
    </g>
  );
};
export default Mouse;

// ============================= MODEL SHEET =============================
const Label: React.FC<{ x: number; y: number; t: string; size?: number; anchor?: 'middle' | 'start' }> = ({ x, y, t, size = 20, anchor = 'middle' }) => (
  <text x={x} y={y} fontFamily={F.sans} fontSize={size} fill={C.ink} textAnchor={anchor} letterSpacing={1.5}>{t}</text>
);

/** Crop window (local coords) rendered into a cell. */
const Crop: React.FC<{ x: number; y: number; w: number; h: number; vb: [number, number, number, number]; children: React.ReactNode }> =
  ({ x, y, w, h, vb, children }) => (
    <svg x={x} y={y} width={w} height={h} viewBox={vb.join(' ')} overflow="hidden">{children}</svg>
  );

export const Sheet: React.FC = () => {
  const frame = useCurrentFrame();
  const heroImp: [number, number][] = [[0, 0.8], [48, 1]];
  const poseCells: { name: string; el: (fx: number) => React.ReactNode }[] = [
    { name: 'IDLE', el: () => <Mouse frame={frame} pose={POSES.idle} seed="c1" impulses={heroImp} /> },
    {
      name: 'HAMMER', el: () => {
        const impacts = [22, 46, 70, 94];
        const fn = (f: number) => {
          const next = impacts.find((i) => f <= i + 8) ?? impacts[impacts.length - 1];
          return { ...POSES.hammer, hammerSwing: hammerSwingAt(f, next) };
        };
        return <Mouse frame={frame} pose={fn(frame)} poseFn={fn} impulses={impacts.map((i) => [i, 1] as [number, number])} seed="c2" />;
      },
    },
    { name: 'DEADPAN TALK', el: () => <Mouse frame={frame} pose={POSES.deadpanTalk} viseme={(['X', 'C', 'B', 'E', 'A', 'D', 'X', 'G'] as Viseme[])[Math.floor(frame / 6) % 8]} seed="c3" /> },
    { name: 'GASP', el: () => <Mouse frame={frame} pose={POSES.gasp} expression="amazed" viseme="E" seed="c4" impulses={[[0, 1.2], [48, 1.2]]} /> },
    { name: 'WINK', el: () => <Mouse frame={frame} pose={POSES.wink} expression="wink" seed="c5" /> },
    { name: 'CLAP', el: () => <Mouse frame={frame} pose={clapPose(frame)} poseFn={(f) => clapPose(f)} expression="smug" seed="c6" /> },
    { name: 'RUN (8f/step)', el: () => <Mouse frame={frame} pose={runPose(frame)} poseFn={(f) => runPose(f)} vel={9} expression="worried" seed="c7" /> },
  ];
  const exprs = Object.keys(EXPRESSIONS);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <BoilDefs frame={frame} />
        <rect x={0} y={0} width={600} height={1080} fill={C.paperDark} />
        <text x={40} y={78} fontFamily={F.display} fontSize={60} fill={C.ink} fontStyle="italic">Pipette</text>
        <Label x={42} y={112} t="MOUSE · SEAMSTRESS-ASSISTANT · 170px @1" size={17} anchor="start" />
        <Label x={42} y={138} t="deadpan · hyper-competent · fixes everything" size={15} anchor="start" />
        {/* hero */}
        <g transform="translate(370 1000) scale(4.1)" filter="url(#boil)">
          <Mouse frame={frame} pose={POSES.idle} impulses={heroImp} seed="hero" />
        </g>
        {/* height ruler */}
        <g>
          <line x1={560} y1={1000} x2={560} y2={1000 - 170 * 4.1} stroke={C.ink} strokeWidth={2} />
          {[0, 50, 100, 150, 170].map((v) => (
            <g key={v}>
              <line x1={552} y1={1000 - v * 4.1} x2={568} y2={1000 - v * 4.1} stroke={C.ink} strokeWidth={2} />
              <Label x={546} y={1006 - v * 4.1} t={String(v)} size={13} anchor="middle" />
            </g>
          ))}
        </g>
        {/* poses */}
        <Label x={630} y={50} t="POSES" size={22} anchor="start" />
        {poseCells.map((c, i) => (
          <g key={c.name}>
            <g transform={`translate(${720 + i * 172} 340) scale(1.45)`} filter="url(#boil)">{c.el(frame)}</g>
            <Label x={720 + i * 172} y={375} t={c.name} size={15} />
          </g>
        ))}
        {/* expressions */}
        <Label x={630} y={430} t="EXPRESSIONS" size={22} anchor="start" />
        {exprs.map((e, i) => (
          <g key={e}>
            <rect x={630 + i * 158} y={445} width={148} height={170} rx={10} fill={C.pearl} stroke={C.ink} strokeWidth={2} />
            <Crop x={630 + i * 158} y={445} w={148} h={170} vb={[-38, -176, 92, 106]}>
              <Mouse frame={frame} pose={{ ...POSES.idle, headTilt: 0, lookX: e === 'worried' ? -0.4 : 0.5 }} expression={e} seed={`e${i}`}
                viseme={e === 'amazed' ? 'E' : e === 'worried' ? 'X' : 'X'} blink={false} />
            </Crop>
            <Label x={630 + i * 158 + 74} y={636} t={e.toUpperCase()} size={15} />
          </g>
        ))}
        {/* visemes */}
        <Label x={630} y={686} t="VISEMES" size={22} anchor="start" />
        {VISEMES.map((v, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const x = 630 + col * 158, y = 700 + row * 188;
          return (
            <g key={v}>
              <rect x={x} y={y} width={148} height={160} rx={10} fill={C.pearl} stroke={C.ink} strokeWidth={2} />
              <Crop x={x} y={y} w={148} h={160} vb={[2, -124, 60, 65]}>
                <Mouse frame={frame} pose={{ ...POSES.idle, headTilt: 0 }} expression="deadpan" viseme={v} blink={false} seed="v" />
              </Crop>
              <Label x={x + 74} y={y + 180} t={v} size={17} />
            </g>
          );
        })}
        {/* ladder prop with her on top, hammering */}
        <Label x={1440} y={430} t="PROP · LADDER (height=260)" size={18} anchor="start" />
        <g transform="translate(1660 1040) scale(1.2)">
          <Ladder height={260} frame={frame} impulses={[22, 46, 70, 94].map((i) => [i, 1] as [number, number])} />
          <g transform="translate(-6 -260)" filter="url(#boil)">
            {(() => {
              const impacts = [22, 46, 70, 94];
              const fn = (f: number) => {
                const next = impacts.find((i) => f <= i + 8) ?? impacts[impacts.length - 1];
                return { ...POSES.hammer, hammerSwing: hammerSwingAt(f, next) };
              };
              return <Mouse frame={frame} pose={fn(frame)} poseFn={fn} impulses={impacts.map((i) => [i, 1] as [number, number])} seed="lad" />;
            })()}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
