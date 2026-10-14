import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { CharProps } from '../lib/types';
import { C, F, ink, S } from '../lib/style';
import { clamp, lerp, onTwos, wobble } from '../lib/motion';
import { hash01 } from '../lib/rng';
import { BoilDefs } from '../lib/fx';
import { DEFAULT_POSE, POSES, EXPRESSIONS, POSE_KEYS, blendPose, walkPose, umbrellaPop } from './penguin/rig';
import { umbrellaGeom, UmbrellaBack, UmbrellaFront, UmbrellaShadow } from './penguin/umbrella';
import { Flipper, Leg, Head, Choker, exprNose } from './penguin/parts';

export { POSES, EXPRESSIONS, POSE_KEYS, blendPose, walkPose, umbrellaPop };

/**
 * PENGUIN — "Madame Parapluie", the accidental finale.
 *
 * Props (beyond CharProps):
 *  - umbrellaOpen  0..1   0 = umbrella worn as a stiff bell crinoline, 1 = popped up & open above her like a parasol
 *  - openJiggle    deg    added to rib spread (drive with a damped wobble for overshoot; see umbrellaPop())
 *  - wind          0..1   upward airflow while floating: lifts & flutters the veil, ruffles the canopy edge
 *  - spinAngle     deg    current rotation the shot applies (used to flicker the smear arcs)
 *  - spinSpeed     deg/f  signed spin speed; |v|>=18 = full motion-smear. If omitted, smear strength = pose.tuck
 *  - impulses      [frame, amp][]  jolts for all dangling accessories (veil, pearl drops, bow tails)
 *  - accel         number  horizontal acceleration of her root (px/frame^2 at scale 1) for accessory swing
 * Origin = ground between feet, facing +x. Height 380 (the open canopy reaches ~ y -640).
 */
const n1 = (v: number) => Math.round(v * 10) / 10;

const TORSO = 'M0,-40 C60,-40 84,-95 80,-142 C77,-202 55,-262 8,-276 C-40,-271 -78,-206 -81,-146 C-84,-90 -60,-40 0,-40 Z';
const TORSO_SHADE = 'M0,-40 C-60,-40 -84,-90 -81,-146 C-78,-206 -40,-271 8,-276 C-28,-252 -54,-204 -56,-146 C-58,-92 -42,-56 0,-40 Z';
const BIB = 'M16,-266 C56,-256 80,-204 79,-150 C78,-100 62,-54 22,-42 C6,-96 0,-200 16,-266 Z';

const blinkAt = (frame: number, seed: string) => {
  const f = onTwos(frame);
  const B = 70;
  for (let b = Math.floor(f / B) - 1; b <= Math.floor(f / B); b++) {
    if (b < 0) continue;
    const s = b * B + Math.floor(hash01('pgBlink', seed, b) * 48);
    const d = f - s;
    if (d >= 0 && d < 6) return [0.7, 1, 1, 0.5, 0.2, 0][d];
  }
  return 0;
};

/** Tapered crescent along an arc (motion smear). angles in degrees. */
const smear = (cx: number, cy: number, r: number, a0: number, a1: number, w: number) => {
  const N = 12;
  const outer: string[] = [], inner: string[] = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
    const ww = w * Math.pow(1 - t, 0.8) * (0.4 + 0.6 * Math.sin(Math.min(1, t * 4) * Math.PI * 0.5));
    outer.push(`${n1(cx + Math.cos(a) * (r + ww))},${n1(cy + Math.sin(a) * (r + ww))}`);
    inner.push(`${n1(cx + Math.cos(a) * (r - ww))},${n1(cy + Math.sin(a) * (r - ww))}`);
  }
  return `M${outer.join(' L')} L${inner.reverse().join(' L')} Z`;
};

const Penguin: React.FC<CharProps> = (props) => {
  const { frame, pose = {}, expression = 'prim', flip = false, seed = 'penguin' } = props;
  const umbrellaOpen = clamp(Number(props.umbrellaOpen ?? 0));
  const openJiggle = Number(props.openJiggle ?? 0);
  const wind = clamp(Number(props.wind ?? 0));
  const spinAngle = Number(props.spinAngle ?? 0);
  const impulses = (props.impulses as [number, number][] | undefined) ?? [];
  const accel = Number(props.accel ?? 0);
  const ft = onTwos(frame);

  // ---------- resolve pose ----------
  const p = { ...DEFAULT_POSE, ...pose };
  const s = clamp(p.slip), tk = clamp(p.tuck);
  // slip overlay: feet fly up, body tips back, flippers flail
  const flail = (k: number, sp: number) => Math.sin(ft * sp + k) * 38;
  p.legF = lerp(p.legF, 108 + Math.sin(ft * 0.7) * 10, s);
  p.legB = lerp(p.legB, 80 + Math.cos(ft * 0.8) * 12, s);
  p.bodyTilt += -34 * s;
  p.lean += -8 * s;
  p.flipF = lerp(p.flipF, 150 + flail(0, 1.05), s);
  p.flipB = lerp(p.flipB, 170 + flail(2, 0.85), s);
  p.flipFBend = lerp(p.flipFBend, flail(1, 1.3) * 0.9, s);
  p.flipBBend = lerp(p.flipBBend, flail(3, 1.1) * 0.9, s);
  p.headTilt += 12 * s;
  p.toePoint = lerp(p.toePoint, 0.8, s);
  // tuck overlay (spin)
  p.legF = lerp(p.legF, 84, tk);
  p.legB = lerp(p.legB, 70, tk);
  p.crouch = lerp(p.crouch, 0.8, tk);
  p.flipF = lerp(p.flipF, 26, tk);
  p.flipB = lerp(p.flipB, 34, tk);
  p.flipFBend = lerp(p.flipFBend, 56, tk);
  p.flipBBend = lerp(p.flipBBend, 50, tk);
  p.headTilt = lerp(p.headTilt, 16, tk);
  p.lean = lerp(p.lean, 24, tk);
  p.toePoint = lerp(p.toePoint, 1, tk);
  // breathing (on twos)
  const breath = Math.sin((ft / 24) * Math.PI * 2 * 0.33);
  const squash = p.squash + p.crouch * 0.08 + breath * 0.012 + tk * 0.06;
  const sy = 1 - squash, sx = 1 / Math.max(0.5, sy);
  const drop = p.crouch * 20;
  const legF = p.legF + p.crouch * 24, legB = p.legB - p.crouch * 14;
  const headTilt = p.headTilt + exprNose(expression) + breath * 1.2;

  // ---------- secondary motion (on ones) ----------
  const totalTilt = p.bodyTilt + p.lean;
  const jolt = (fq: number, dc: number) => wobble(frame, impulses, fq, dc);
  const sway = Math.sin(frame * 0.13 + 1) * 3 - accel * 9;
  const chokerDangle = -totalTilt * 0.9 + sway + jolt(1.9, 2.6) * 1.2;
  const hatDangle = -(totalTilt + headTilt) * 0.9 + sway * 1.3 + jolt(1.6, 2.2) * 1.5;
  const bowTail = -totalTilt * 0.5 + Math.sin(frame * 0.17) * 3 + jolt(1.7, 2.4) - accel * 6 + wind * 18 * Math.sin(frame * 0.4);
  const veilLift = clamp(wind + s * 0.35);
  const veilFlut = clamp(wind + s * 0.6 + tk * 0.5);
  const veilKick = jolt(3, 3) * 0.5 + Math.sin(frame * 0.21) * 1.2;
  const hatLift = s * 16 + Math.max(0, jolt(2.5, 4)) * 0.4;
  const hatRot = -14 * s - tk * 6;

  const blink = blinkAt(frame, seed);
  const g = umbrellaGeom(umbrellaOpen, openJiggle, frame, wind);

  // ---------- transforms ----------
  const rootT = `rotate(${n1(p.bodyTilt)} 0 -60)`;
  const torsoT = `translate(0 ${n1(drop)}) rotate(${n1(p.lean)} 0 -55) translate(0 -50) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(0 50)`;
  const headT = `rotate(${n1(headTilt)} 12 -258)`;

  // spin smear
  const smearK = props.spinSpeed !== undefined ? clamp(Math.abs(Number(props.spinSpeed)) / 18) : tk;
  const dir = props.spinSpeed !== undefined && Number(props.spinSpeed) < 0 ? -1 : 1;
  const jit = hash01('pgSmear', Math.floor(spinAngle / 25));

  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      <defs>
        <linearGradient id="pgRim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.62" stopColor={C.white} stopOpacity="0" />
          <stop offset="1" stopColor={C.white} stopOpacity="0.42" />
        </linearGradient>
        <pattern id="pgNet" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0,0 L0,9 M0,0 L9,0" stroke={C.ink} strokeWidth="1" opacity="0.55" />
        </pattern>
      </defs>
      {/* ---- paper-cut drop shadow ---- */}
      <g transform="translate(8 6)" opacity={0.9}>
        <g transform={rootT}>
          <g transform={torsoT}>
            <UmbrellaShadow g={g} />
            <path d={TORSO} fill={C.ink} opacity={0.22} />
            <g transform={headT}><circle cx={14} cy={-300} r={49} fill={C.ink} opacity={0.22} /></g>
          </g>
        </g>
      </g>
      <g transform={rootT}>
        {/* ---- umbrella: far side ---- */}
        <g transform={torsoT} filter="url(#boil)"><UmbrellaBack g={g} frame={frame} /></g>
        {/* ---- legs ---- */}
        <g filter="url(#boil)">
          <Leg x={-15} y={-52 + drop} angle={legB} toe={p.toePoint} far />
          <Leg x={16} y={-52 + drop} angle={legF} toe={p.toePoint} />
        </g>
        <g transform={torsoT}>
          <g filter="url(#boil)">
            {/* far flipper (behind body) */}
            <Flipper x={-40} y={-232} angle={p.flipB} bend={p.flipBBend} far />
            {/* sash bow tails behind */}
            <g transform={`translate(-80 -150) rotate(${n1(18 + bowTail)})`}>
              <path d="M0,0 L-8,58 L2,50 L10,60 L10,2 Z" fill={C.hotPink} {...ink(S.inkThin)} />
            </g>
            <g transform={`translate(-78 -148) rotate(${n1(-8 + bowTail * 0.7)})`}>
              <path d="M0,0 L-20,48 L-10,44 L-6,56 L8,4 Z" fill={C.coral} {...ink(S.inkThin)} />
            </g>
            {/* torso */}
            <path d={TORSO} fill={C.penguinBlack} {...ink()} />
            <path d={TORSO_SHADE} fill="url(#halftone)" />
            <path d={BIB} fill={C.white} {...ink(S.inkThin)} />
            <path d="M24,-230 C22,-190 22,-130 30,-80" fill="none" stroke={C.pearlShade} strokeWidth={6} strokeLinecap="round" />
            <path d={TORSO} fill="url(#pgRim)" />
            {/* frilly bloomers (revealed when the skirt pops up) */}
            <path d="M-54,-62 Q0,-42 56,-62 L58,-44 q-7,9 -14,2 q-7,9 -14,2 q-7,9 -14,2 q-7,9 -14,2 q-7,9 -14,2 q-7,9 -14,2 q-7,9 -14,2 q-7,9 -14,2 Z" fill={C.white} {...ink(S.inkThin)} />
          </g>
          {/* ---- umbrella: near side (skirt front / parasol front) ---- */}
          <g filter="url(#boil)"><UmbrellaFront g={g} frame={frame} /></g>
          <g filter="url(#boil)">
            {/* waist sash + bustle bow */}
            <path d="M-81,-160 Q0,-146 81,-162 L80,-142 Q0,-128 -81,-140 Z" fill={C.hotPink} {...ink(S.inkThin)} />
            <path d="M-80,-150 q-34,-30 -40,-4 q4,24 40,4 Z M-80,-150 q-6,-34 24,-30 q12,14 -24,30 Z" fill={C.hotPink} {...ink(S.inkThin)} />
            <circle cx={-80} cy={-150} r={7} fill={C.coral} {...ink(2.5)} />
            <g transform={headT}>
              <Head expression={expression} blink={blink} frame={frame} veilLift={veilLift} veilFlut={veilFlut}
                veilKick={veilKick} hatLift={hatLift} hatRot={hatRot} dangle={hatDangle} />
            </g>
            <Choker dangle={chokerDangle} />
            {/* near flipper */}
            <Flipper x={6} y={-226} angle={p.flipF} bend={p.flipFBend} />
          </g>
        </g>
        {/* ---- spin motion smear ---- */}
        {smearK > 0.05 && (
          <g opacity={smearK}>
            <path d={smear(0, -170, 200 + jit * 14, -90 + jit * 10, -90 - dir * (95 + jit * 30), 13)} fill={C.white} {...ink(S.inkThin)} />
            <path d={smear(0, -170, 170, 90 - jit * 8, 90 - dir * (110 - jit * 25), 11)} fill={C.hotPink} {...ink(S.inkThin)} />
            <path d={smear(0, -170, 232, -40 + jit * 20, -40 - dir * 60, 5)} fill={C.ink} />
            <path d={smear(0, -170, 140, 150 - jit * 20, 150 - dir * 55, 4)} fill={C.ink} />
          </g>
        )}
      </g>
    </g>
  );
};

export default Penguin;

// ======================= MODEL SHEET =======================
const Label: React.FC<{ x: number; y: number; t: string; size?: number }> = ({ x, y, t, size = 20 }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={F.sans} fontSize={size} fill={C.ink} letterSpacing={2}>{t}</text>
);

export const Sheet: React.FC = () => {
  const frame = useCurrentFrame();
  const poseCells: { name: string; el: React.ReactNode }[] = [
    { name: 'IDLE', el: <Penguin frame={frame} pose={POSES.idle} /> },
    { name: 'SLIP', el: <Penguin frame={frame} pose={POSES.slip} expression="alarmed" /> },
    { name: 'SLIDE', el: <Penguin frame={frame} pose={POSES.slide} expression="terrified" /> },
    { name: 'SPIN', el: <Penguin frame={frame} pose={POSES.spin} expression="terrified" spinSpeed={22} spinAngle={frame * 22} /> },
    { name: 'FLOAT', el: <Penguin frame={frame} pose={POSES.float} expression="serene" umbrellaOpen={1} wind={0.6} /> },
  ];
  const w = walkPose(frame);
  const opens = [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1];
  const loopF = frame % 96;
  const pop = umbrellaPop(loopF, 30);
  const popPose = blendPose(POSES.slip, POSES.float, clamp((loopF - 30) / 10));
  const popExpr = loopF < 30 ? 'terrified' : loopF < 42 ? 'alarmed' : 'serene';
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <BoilDefs frame={frame} />
        <rect x={0} y={0} width={1920} height={1080} fill={C.paper} />
        <rect x={20} y={20} width={1880} height={1040} fill="none" stroke={C.paperDark} strokeWidth={6} />
        <text x={50} y={78} fontFamily={F.display} fontSize={50} fill={C.ink} fontStyle="italic">Madame Parapluie</text>
        <text x={52} y={112} fontFamily={F.sans} fontSize={20} fill={C.hotPink} letterSpacing={4}>PENGUIN · UMBRELLA CRINOLINE · 380 PX</text>
        {/* hero idle */}
        <ellipse cx={250} cy={962} rx={170} ry={16} fill={C.paperDark} />
        <g transform="translate(250 960) scale(1.45)"><Penguin frame={frame} pose={POSES.idle} expression="prim" /></g>
        <Label x={250} y={1030} t="IDLE · PRIM" />
        {/* poses row */}
        {poseCells.map((c, k) => (
          <g key={c.name}>
            <line x1={620 + k * 215 - 80} y1={402} x2={620 + k * 215 + 80} y2={402} stroke={C.paperDark} strokeWidth={4} />
            <g transform={`translate(${620 + k * 215} 400) scale(0.55)`}>{c.el}</g>
            <Label x={620 + k * 215} y={440} t={c.name} />
          </g>
        ))}
        <g>
          <line x1={1695 - 80} y1={402} x2={1695 + 80} y2={402} stroke={C.paperDark} strokeWidth={4} />
          <g transform={`translate(1695 ${n1(400 + w.bob * 0.55)}) scale(0.55)`}><Penguin frame={frame} pose={w.pose} /></g>
          <Label x={1695} y={440} t="WALK (loop)" />
        </g>
        {/* umbrellaOpen strip */}
        <text x={540} y={498} fontFamily={F.sans} fontSize={18} fill={C.ink} letterSpacing={3}>UMBRELLA OPEN</text>
        {opens.map((o, k) => (
          <g key={o}>
            <g transform={`translate(${620 + k * 165} 770) scale(0.36)`}>
              <Penguin frame={frame} umbrellaOpen={o} pose={blendPose(POSES.idle, POSES.float, clamp((o - 0.3) / 0.5))}
                expression={o < 0.3 ? 'alarmed' : 'serene'} wind={o * 0.5} />
            </g>
            <Label x={620 + k * 165} y={800} t={o.toFixed(2)} />
          </g>
        ))}
        <g transform={`translate(1790 770) scale(0.36)`}>
          <Penguin frame={frame} umbrellaOpen={pop.umbrellaOpen} openJiggle={pop.openJiggle} pose={popPose} expression={popExpr} wind={pop.umbrellaOpen * 0.6} impulses={[[30, 14]]} />
        </g>
        <Label x={1790} y={800} t="POP (loop)" />
        {/* expressions */}
        <defs>
          {EXPRESSIONS.map((e, k) => (
            <clipPath key={e} id={`pgExClip${k}`}><rect x={640 + k * 250 - 115} y={830} width={230} height={178} rx={18} /></clipPath>
          ))}
        </defs>
        {EXPRESSIONS.map((e, k) => (
          <g key={e}>
            <rect x={640 + k * 250 - 115} y={830} width={230} height={178} rx={18} fill={C.paperDark} opacity={0.5} />
            <g clipPath={`url(#pgExClip${k})`}>
              <g transform={`translate(${640 + k * 250} 935) scale(1.1) translate(-26 300)`}>
                <Penguin frame={frame} expression={e} pose={{ ...POSES.idle, flipF: -10 }} />
              </g>
            </g>
            <Label x={640 + k * 250} y={1036} t={e.toUpperCase()} />
          </g>
        ))}
        <rect x={20} y={1052} width={1880} height={8} fill={C.paperDark} />
      </svg>
    </AbsoluteFill>
  );
};
