/**
 * FLAMINGO — "Look one: Vertigo". Imperious supermodel on telescoping gold-cage stilettos, crystal chandelier hat,
 * hot-pink sequin mini with enormous puffed shoulders, feather boa. 760px tall at scale 1 (heelExtend 0) incl. heels + hat.
 *
 * Props (beyond CharProps):
 *   pose        partial pose (see POSE_KEYS). If omitted, poseAt(frame) or POSES.idle is used.
 *   poseAt      (f) => pose. STRONGLY recommended when animating: accessories (crystal drops, boa) are springs
 *               integrated over the last 40 frames of the real head/neck motion.
 *   travel      (f) => root x travel in character px (scale 1), e.g. f => walkTravel(f, opts). Drives drag on boa/crystals.
 *   impulses    [frame, amp][] kicks (e.g. hammer hits in S2): heels shiver, crystals jingle. amp ~1.
 *   expression  'fierce' (default) | 'panic' | 'relieved' | 'smug'
 *   shadow      paper-cut drop shadow (default true)
 *
 * WALK: const { pose } = walkPose(frame, { phase }); root.x += walkTravel(frame, { phase }) * scale.
 *   One step per 12 frames, heel strike on (frame - phase) % 12 == 0 (near foot on even beats). stepX = 150px/step
 *   => 12.5 px/frame at scale 1 (on twos). Planted shoes are then fixed in world space (verified numerically).
 */
import React, { useId } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, F, ink } from '../lib/style';
import { onTwos, clamp, wobble } from '../lib/motion';
import { hash01 } from '../lib/rng';
import { BoilDefs } from '../lib/fx';
import type { CharProps } from '../lib/types';
import {
  DEFAULT_POSE, POSES, POSE_KEYS, blendPose, solve, walkPose, walkTravel, WALK, DIM, rot, type Pose,
} from './flamingo/rig';
import { lagSeries, back } from './flamingo/physics';
import {
  Leg, Wing, Head, Chandelier, Piece, EXPR, EXPRESSIONS, BODICE, SKIRT, puffPath, pleats, sequins, fluff, smooth, tr, f1,
  DROP_COUNT, DROP_TIER,
} from './flamingo/parts';

export { POSES, POSE_KEYS, blendPose, walkPose, walkTravel, WALK, DIM, EXPRESSIONS, solve };
export type { Pose };

export interface FlamingoProps extends CharProps {
  poseAt?: (f: number) => Pose;
  travel?: (f: number) => number;
  impulses?: [number, number][];
  shadow?: boolean;
}

const D2R = Math.PI / 180;
const HIST = 40;
const HEAD_S = 1.3;
const CHAND_S = 0.58;

const Flamingo: React.FC<FlamingoProps> = ({
  frame, pose, poseAt, travel, impulses, expression = 'fierce', flip, seed = 'flamingo', shadow = true,
}) => {
  const uid = 'fl' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const f2 = onTwos(frame);
  const P: Pose = { ...DEFAULT_POSE, ...(pose ?? (poseAt ? poseAt(frame) : POSES.idle)) };
  const sk = solve(P);
  const breath = Math.sin((2 * Math.PI * f2) / 64);

  // ---------------------------------------------------------------- secondary motion drivers (on ones)
  const hx: number[] = [], nx: number[] = [];
  for (let i = HIST; i >= 0; i--) {
    const f = frame - i;
    const s = poseAt ? solve(poseAt(f)) : sk;
    const tv = travel ? travel(f) : 0;
    hx.push(tv + s.head.x - 70 * Math.sin(s.p.headTilt * D2R) + s.hip.y * 0);
    nx.push(tv + s.neck[0].x);
  }
  const lags = [lagSeries(hx, 50, 2.6), lagSeries(hx, 68, 3.2), lagSeries(hx, 90, 3.8)];
  const imp = impulses ? wobble(frame, impulses, 3.2, 2.4) : 0;
  const tt = sk.teeter;
  const angles: number[] = [];
  for (let i = 0; i < DROP_COUNT; i++) {
    const lag = back(lags[DROP_TIER[i]], 0);
    const hsh = hash01(seed, 'drop', i);
    let a = clamp(-lag * 1.6, -75, 75) * (0.8 + 0.4 * hsh);
    a += 2.5 * Math.sin(frame * 0.17 + i * 1.7);
    a += tt * (30 * Math.sin(frame * 1.55 + i * 1.9) + 14 * Math.sin(frame * 2.7 + i * 0.7));
    a += imp * 22 * Math.sin(i * 2.3 + 1);
    angles.push(a + P.headTilt);
  }
  const lf = lagSeries(nx, 30, 4), lb = lagSeries(nx, 22, 3.2);
  const vel = (nx[HIST] - nx[HIST - 2]) / 2;

  // ---------------------------------------------------------------- boa chain
  const n0 = sk.neck[0];
  const chain = (start: { x: number; y: number }, rest: number[], lag: number[], extra: number, segL: number) => {
    const pts = [start];
    rest.forEach((r, i) => {
      const a = r + sk.tilt * 0.6 + clamp(-back(lag, i * 1.5) * 1.2, -55, 55) + extra * (1 - i * 0.05)
        + 4 * Math.sin(frame * 0.21 + i * 0.9) + tt * 26 * Math.sin(sk.teeterPhase * 2 * Math.PI - i * 0.5);
      const d = rot(0, segL, a);
      const p = pts[pts.length - 1];
      pts.push({ x: p.x + d.x, y: p.y + d.y });
    });
    return pts;
  };
  const boaF = chain({ x: n0.x + 16, y: n0.y + 2 }, [-62, -34, -14, -4, 2, 6, 4], lf, 0, 18);
  const boaB = chain({ x: n0.x - 18, y: n0.y - 2 }, [74, 66, 56, 48, 40, 34], lb, clamp(vel * 2.4, -10, 38), 18);
  const rF = [14, 14, 13, 12.5, 12, 11, 10, 8.5], rB = [14, 13.5, 13, 12, 11, 10, 8.5];
  const tuftRot = (i: number) => hash01(seed, 'tuft', i) * 60 + (f2 % 8) * 3;
  const boaPath = (pts: { x: number; y: number }[], rr: number[], off: number) =>
    pts.map((p, i) => fluff(p.x, p.y, rr[i] ?? 9, 7, tuftRot(i + off))).join(' ');

  // ---------------------------------------------------------------- expression / blink
  const e = EXPR[expression] ?? EXPR.fierce;
  const bk = Math.floor(f2 / 72);
  const bStart = bk * 72 + Math.floor(hash01(seed, 'blink', bk) * 50) * 1;
  const blink = f2 - bStart >= 0 && f2 - bStart < 4 && expression !== 'relieved';
  const jitter = expression === 'panic' ? (hash01(seed, 'jit', f2) - 0.5) * 1.6 : 0;

  // ---------------------------------------------------------------- torso pieces
  const sq = sk.squash * 0.06 + breath * 0.012;
  const sx = 1 + sq, sy = 1 / sx;
  const torsoT = tr(sk.hip.x, sk.hip.y, sk.tilt);
  const skirtRot = sk.hipSway * 5;
  const nearPuff = puffPath(DIM.SHOULDER[0], DIM.SHOULDER[1] - breath, 54);
  const farPuff = puffPath(DIM.FSHOULDER[0], DIM.FSHOULDER[1] - breath, 44);
  const seqB = sequins(seed + 'b', 4, -78, 52, 30, 26);
  const seqS = sequins(seed + 's', -4, -6, 72, 26, 30);
  const seqP = sequins(seed + 'p', DIM.SHOULDER[0], DIM.SHOULDER[1], 44, 40, 18);
  const shiver = imp * 5 * Math.sin(frame * 2.2);
  const tailRot = sk.hipSway * 12 + 3 * Math.sin(frame * 0.2) + tt * 20 * Math.sin(sk.teeterPhase * 6.28 + 1);
  const PLUMES = 'M 0,0 Q -30,-18 -64,-4 Q -34,4 0,0 Z M 0,4 Q -34,2 -62,22 Q -28,20 0,4 Z M 2,8 Q -24,18 -44,40 Q -14,28 2,8 Z';
  const neckD = smooth(sk.neck);
  const head = sk.head;

  const Sil = () => (
    <g transform="translate(9,8)" opacity={0.25}>
      <Wing W={sk.wingF} fan={sk.p.wingFan} near={false} sil flutter={0} />
      <Leg L={sk.legF} near={false} h={sk.h} sil />
      <Leg L={sk.legN} near h={sk.h} sil />
      <g transform={torsoT} fill={C.ink}>
        <path d={BODICE} /><path d={SKIRT} /><path d={nearPuff} /><path d={farPuff} />
      </g>
      <Wing W={sk.wingN} fan={sk.p.wingFan} near sil flutter={0} />
      <path d={neckD} stroke={C.ink} strokeWidth={28} fill="none" strokeLinecap="round" />
      <path d={boaPath(boaF, rF, 0)} fill={C.ink} />
      <g transform={`${tr(head.x, head.y, sk.headRot)} scale(${HEAD_S})`}>
        <Head e={e} blink={false} beakOpen={0} sil jitter={0} uid={uid} />
        <g transform={`translate(8,-43) scale(${CHAND_S})`}><Chandelier angles={angles} sil frame={frame} flame={1} /></g>
      </g>
    </g>
  );

  return (
    <g transform={flip ? 'scale(-1,1)' : undefined}>
      {shadow && <Sil />}
      <g filter="url(#boil)">
        {/* far side */}
        <Wing W={sk.wingF} fan={sk.p.wingFan} near={false} flutter={Math.sin(frame * 0.3)} />
        <path d={boaPath(boaB, rB, 20)} fill={C.flamingo} {...ink(3)} />
        <Leg L={sk.legF} near={false} h={sk.h} shiver={shiver} />
        <g transform={torsoT}>
          <g transform={`rotate(${f1(tailRot)} -56 -26)`}>
            <g transform="translate(-56,-26)">
              <path d={PLUMES} fill={C.coral} {...ink(3.5)} />
              <path d="M -6,1 Q -30,-8 -54,-4 M -6,5 Q -30,8 -52,20" stroke={C.flamingo} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            </g>
          </g>
          <g transform={`scale(${f1(sx)} ${f1(sy)})`}>
            <path d={farPuff} fill={C.hotPink} {...ink(5)} />
            <path d={farPuff} fill="url(#halftone)" />
            <path d={pleats(DIM.FSHOULDER[0], DIM.FSHOULDER[1], 44)} stroke={C.ink} strokeWidth={2.2} fill="none" opacity={0.5} />
          </g>
        </g>
        <Leg L={sk.legN} near h={sk.h} shiver={shiver} />
        <g transform={torsoT}>
          <g transform={`scale(${f1(sx)} ${f1(sy)})`}>
            <g transform={`rotate(${f1(skirtRot)} 0 -42)`}>
              <Piece id={`${uid}-sk`} d={SKIRT} fill={C.hotPink} rim={C.blush} seq={seqS} glint={3} frame2={f2} seqCol={C.blush} />
            </g>
            <Piece id={`${uid}-bo`} d={BODICE} fill={C.hotPink} rim={C.blush} seq={seqB} glint={3} frame2={f2 + 1} seqCol={C.blush} />
            <path d="M -48,-47 L 48,-47 L 46,-37 L -47,-37 Z" fill={C.gold} {...ink(3.5)} />
            <path d="M 38,-49 L 44,-42 L 38,-35 L 32,-42 Z" fill={C.white} {...ink(2.5)} />
          </g>
        </g>
        <Wing W={sk.wingN} fan={sk.p.wingFan} near flutter={Math.sin(frame * 0.3 + 1)} />
        <g transform={torsoT}>
          <g transform={`scale(${f1(sx)} ${f1(sy)})`}>
            <Piece id={`${uid}-pf`} d={nearPuff} fill={C.hotPink} rim={C.blush} seq={seqP} glint={2} frame2={f2 + 2} seqCol={C.blush}
              extra={<path d={pleats(DIM.SHOULDER[0], DIM.SHOULDER[1], 54)} stroke={C.ink} strokeWidth={2.4} fill="none" opacity={0.55} />} />
          </g>
        </g>
        {/* neck */}
        <path d={neckD} stroke={C.ink} strokeWidth={27} fill="none" strokeLinecap="round" />
        <path d={neckD} stroke={C.flamingo} strokeWidth={18} fill="none" strokeLinecap="round" />
        <g transform="translate(-4.5,1)"><path d={neckD} stroke={C.coral} strokeWidth={5} fill="none" strokeLinecap="round" /></g>
        <g transform="translate(5,-1)"><path d={neckD} stroke={C.blush} strokeWidth={2.4} fill="none" strokeLinecap="round" /></g>
        {/* boa: wrap + front strand */}
        <path d={boaPath(boaF, rF, 0)} fill={C.blush} {...ink(3)} />
        <path d={[fluff(n0.x - 6, n0.y - 6, 13, 7, tuftRot(40)), fluff(n0.x + 8, n0.y - 4, 13, 7, tuftRot(41))].join(' ')} fill={C.blush} {...ink(3)} />
        {/* head + chandelier hat */}
        <g transform={`${tr(head.x, head.y, sk.headRot)} scale(${HEAD_S})`}>
          <Head e={e} blink={blink} beakOpen={sk.p.beakOpen} jitter={jitter} uid={uid} />
          <g transform={`translate(8,-43) scale(${CHAND_S})`}>
            <Chandelier angles={angles} frame={frame} flame={1 + tt * 2} />
          </g>
        </g>
      </g>
    </g>
  );
};
export default Flamingo;

// =================================================================================== MODEL SHEET
const Label: React.FC<{ x: number; y: number; t: string; s?: number; anchor?: 'start' | 'middle' }> = ({ x, y, t, s = 17, anchor = 'middle' }) => (
  <text x={x} y={y} fontFamily={F.sans} fontSize={s} fill={C.ink} textAnchor={anchor} letterSpacing={1.5}>{t}</text>
);

export const Sheet: React.FC = () => {
  const frame = useCurrentFrame();
  const idleAt = () => POSES.idle;
  const teeterAt = (f: number) => ({ ...POSES.teeter, teeterPhase: f / 18 });
  const walkAt = (f: number) => walkPose(f).pose;
  const heelAt = (f: number) => ({ ...POSES.idle, heelExtend: 0.5 - 0.5 * Math.cos((2 * Math.PI * f) / 96) });
  const poses: [string, (f: number) => Pose, string][] = [
    ['idle', idleAt, 'fierce'], ['strikePose', () => POSES.strikePose, 'smug'], ['teeter', teeterAt, 'panic'],
    ['oneLeg', () => POSES.oneLeg, 'relieved'], ['walk (in place)', walkAt, 'fierce'],
  ];
  const idleHead = solve(POSES.idle).head;
  const cyc = [0, 4, 8, 12, 16, 20];
  const laneScale = 0.3;
  // world heel-strike marks for the travel lane
  const marks: number[] = [];
  for (let k = 0; k < 10; k++) marks.push(WALK.CENTER + (WALK.STEP_X / 12) * WALK.STANCE / 2 + k * WALK.STEP_X);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <BoilDefs frame={frame} />
        <text x={40} y={62} fontFamily={F.display} fontSize={44} fill={C.ink} fontStyle="italic">Flamingo</text>
        <Label x={42} y={92} t="LOOK ONE · VERTIGO · 760px @1" s={16} anchor="start" />
        <path d="M 40,1040 L 600,1040" stroke={C.ink} strokeWidth={3} opacity={0.3} />
        <g transform="translate(320,1040) scale(1.2)">
          <Flamingo frame={frame} poseAt={idleAt} />
        </g>
        {/* height guide */}
        <path d={`M 590,1040 L 590,${1040 - 760 * 1.2}`} stroke={C.ink} strokeWidth={2} strokeDasharray="4 6" opacity={0.4} />
        <Label x={580} y={1040 - 760 * 1.2 - 8} t="760" s={13} />

        {poses.map(([name, at, ex], i) => {
          const x = 730 + i * 200;
          return (
            <g key={name}>
              <path d={`M ${x - 90},420 L ${x + 90},420`} stroke={C.ink} strokeWidth={2} opacity={0.3} />
              <g transform={`translate(${x},420) scale(0.4)`}><Flamingo frame={frame} poseAt={at} expression={ex} /></g>
              <Label x={x} y={450} t={name} />
            </g>
          );
        })}
        {/* telescoping heels */}
        <g>
          <path d="M 1730,420 L 1890,420" stroke={C.ink} strokeWidth={2} opacity={0.3} />
          <g transform="translate(1810,420) scale(0.26)"><Flamingo frame={frame} poseAt={heelAt} expression="panic" /></g>
          <Label x={1810} y={450} t="heelExtend 0→1" />
        </g>

        {/* expressions: head close-ups */}
        {EXPRESSIONS.map((ex, i) => {
          const cx = 730 + i * 190, cy = 590;
          return (
            <g key={ex}>
              <clipPath id={`fl-exp-${i}`}><rect x={cx - 88} y={cy - 110} width={176} height={200} rx={14} /></clipPath>
              <rect x={cx - 88} y={cy - 110} width={176} height={200} rx={14} fill={C.paperDark} />
              <g clipPath={`url(#fl-exp-${i})`}>
                <g transform={`translate(${cx - (idleHead.x + 34) * 1.5},${cy - (idleHead.y - 44) * 1.5}) scale(1.5)`}>
                  <Flamingo frame={frame + i * 17} poseAt={idleAt} expression={ex} shadow={false} />
                </g>
              </g>
              <rect x={cx - 88} y={cy - 110} width={176} height={200} rx={14} fill="none" {...ink(3)} />
              <Label x={cx} y={cy + 114} t={ex} />
            </g>
          );
        })}
        {/* S2 crop: just legs + heels, hammered higher */}
        <g>
          <clipPath id="fl-legs"><rect x={1500} y={480} width={390} height={230} rx={14} /></clipPath>
          <rect x={1500} y={480} width={390} height={230} rx={14} fill={C.paperDark} />
          <g clipPath="url(#fl-legs)">
            <g transform="translate(1670,700) scale(0.8)">
              <Flamingo frame={frame} poseAt={(f) => ({ ...POSES.idle, heelExtend: 0.25 })} impulses={[[0, 1], [24, 1], [48, 1], [72, 1]]} />
            </g>
          </g>
          <rect x={1500} y={480} width={390} height={230} rx={14} fill="none" {...ink(3)} />
          <Label x={1695} y={734} t="S2 crop · legs + heels · impulses" />
        </g>

        {/* walk cycle frames */}
        {cyc.map((t, i) => {
          const x = 720 + i * 112;
          return (
            <g key={t}>
              <path d={`M ${x - 55},1030 L ${x + 55},1030`} stroke={C.ink} strokeWidth={2} opacity={0.3} />
              <g transform={`translate(${x},1030) scale(0.3)`}>
                <Flamingo frame={t} poseAt={walkAt} shadow={false} />
              </g>
              <Label x={x} y={1060} t={`t=${t}${t === 0 ? ' N↓' : t === 12 ? ' F↓' : ''}`} s={14} />
            </g>
          );
        })}
        {/* travel lane: moving root; pink ticks = world heel-strike spots (feet must sit still on them) */}
        <g>
          <path d="M 1390,1030 L 1900,1030" stroke={C.ink} strokeWidth={3} opacity={0.5} />
          {marks.map((m, k) => (
            <path key={k} d={`M ${1400 + m * laneScale},1024 L ${1400 + m * laneScale},1040`} stroke={C.hotPink} strokeWidth={3} />
          ))}
          <g transform={`translate(${1400 + walkTravel(frame) * laneScale},1030) scale(${laneScale})`}>
            <Flamingo frame={frame} poseAt={walkAt} travel={(f) => walkTravel(f)} />
          </g>
          <Label x={1645} y={1062} t="travel lane · no-slide check" s={14} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
