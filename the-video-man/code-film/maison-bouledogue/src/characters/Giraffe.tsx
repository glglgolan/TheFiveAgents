/**
 * GIRAFFE — "Look two: forty feet of pearls". Height 900 at scale 1, origin = ground between feet, faces +x.
 *
 * Extra props (besides CharProps):
 *   pearlsIntact?: boolean      default true. false = snapped: bare spotted neck + a few dangling loops/broken strands.
 *   snapFrame?: number          frame the strand broke (drives the dangling-strand wobble). default 840.
 *   bagImpulses?: [frame, amp][] extra damped jolts for the handbag pendulum (deg), e.g. [[840, 30]].
 *   debugPearls?: boolean       overlay pearlPositions() dots (QA only).
 * Exports: POSE_KEYS, POSES, EXPRESSIONS, blendPose, walkPose, pearlPositions, Sheet.
 */
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import type { CharProps } from '../lib/types';
import { C, F, S, ink } from '../lib/style';
import { BoilDefs } from '../lib/fx';
import { clamp, lerp, onTwos, wobble } from '../lib/motion';
import {
  DEFAULT_POSE, HIPS, NECK_LEN, resolvePose, bodyXform, neckSpine, neckPath, napeStripPath, pearlRows,
  neckSpotsPath, neckPoint, dirOf, EXPR, blinkAt, walkPose as walkPoseImpl, jolt, spineAt, type Pearl, type Pt,
  type SpinePt,
} from './giraffe/geom';
import { GiraffeDefs, Leg, Handbag, HeadProfile, HeadFront, OSSI_P_TIP, OSSI_F_TIP } from './giraffe/parts';

export const walkPose = walkPoseImpl;

export const POSE_KEYS: { key: string; range: [number, number]; note: string }[] = [
  { key: 'bodyY', range: [-40, 40], note: 'px, +down (walk bob baked in)' },
  { key: 'bodyTilt', range: [-10, 10], note: 'deg, torso pitch about belly' },
  { key: 'squash', range: [0.85, 1.15], note: 'volume-preserving: sx=1/squash, sy=squash' },
  { key: 'neckLean', range: [-20, 60], note: 'deg from vertical, + forward' },
  { key: 'neckCurve', range: [-1, 1], note: 'uniform bend along the 8-link chain' },
  { key: 'neckSwoop', range: [0, 1], note: 'elegant S-curve swoop, head low' },
  { key: 'neckWave', range: [-1, 1], note: 'lagged top-heavy bob (walk)' },
  { key: 'headTilt', range: [-45, 30], note: 'deg, - = nose in the air' },
  { key: 'headTurn', range: [0, 1], note: '0 profile, 1 facing audience (swap at .5 with squash)' },
  ...['fn', 'ff', 'bn', 'bf'].flatMap((l) => [
    { key: `${l}Hip`, range: [-40, 40] as [number, number], note: `${l} leg hip deg (+ swings foot back). fn=front near, bf=back far` },
    { key: `${l}Knee`, range: [-10, 90] as [number, number], note: 'relative deg, + folds foot back' },
    { key: `${l}Ankle`, range: [-60, 60] as [number, number], note: 'relative deg, + points toe down' },
  ]),
  { key: 'tailSwing', range: [-30, 30], note: 'deg' },
  { key: 'bagSwing', range: [-45, 45], note: 'deg, handbag pendulum (walkPose fills it)' },
  { key: 'sashSwing', range: [-30, 30], note: 'deg, wrap-dress sash ends' },
  { key: 'trainWave', range: [-1, 1], note: 'dress train ripple / drag' },
  { key: 'glassesSlide', range: [0, 1], note: 'sunglasses slide from eyes to nose tip' },
  { key: 'lookX', range: [-5, 5], note: 'pupil offset' },
  { key: 'lookY', range: [-5, 5], note: 'pupil offset' },
];

export const POSES: Record<string, Record<string, number>> = {
  idle: { ...DEFAULT_POSE, neckLean: 20, neckCurve: -0.55, fnHip: -4, ffHip: 5, bnHip: 5, bfHip: -3, fnAnkle: 4, tailSwing: 4 },
  swoop: {
    ...DEFAULT_POSE, neckLean: 10, neckCurve: 0, neckSwoop: 1, headTilt: 4, headTurn: 1, bodyTilt: 3, bodyY: 4,
    fnHip: -16, fnKnee: 8, fnAnkle: 30, ffHip: 6, bnHip: 10, bfHip: -4, tailSwing: -10, trainWave: 0.6,
  },
  freeze: {
    ...DEFAULT_POSE, neckLean: 9, neckCurve: -0.15, neckSwoop: 0, headTilt: 0, headTurn: 1, squash: 1.04, bodyY: -6,
    fnHip: -9, ffHip: 9, bnHip: 9, bfHip: -9, fnAnkle: 9, ffAnkle: -9, bnAnkle: -9, bfAnkle: 9, tailSwing: 28,
  },
};
export const EXPRESSIONS = Object.keys(EXPR); // aloof (default), shocked, mortified

export const blendPose = (a: Record<string, number>, b: Record<string, number>, t: number) => {
  const out: Record<string, number> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => { out[k] = lerp(a[k] ?? DEFAULT_POSE[k] ?? 0, b[k] ?? DEFAULT_POSE[k] ?? 0, t); });
  return out;
};

const D2R = Math.PI / 180;
const HEAD_SCALE = 1.2;
const fmt = (n: number) => n.toFixed(1);

/** Head world transform (root/local coords, before flip/squash). */
const headXform = (P: Record<string, number>, sp: SpinePt[]) => {
  const top = sp[sp.length - 1], d = dirOf(top.a);
  const turn = clamp(P.headTurn);
  const front = turn >= 0.5;
  const sx = front ? 0.5 + (turn - 0.5) : 1 - turn;
  const rot = front ? P.headTilt * 0.3 + top.a * 0.12 : P.headTilt + top.a * 0.45;
  const x = top.x + d.x * (front ? 14 : 8), y = top.y + d.y * (front ? 14 : 8);
  const apply = (p: Pt): Pt => {
    const c = Math.cos(rot * D2R), s = Math.sin(rot * D2R), px = p.x * sx * HEAD_SCALE, py = p.y * HEAD_SCALE;
    return { x: x + px * c - py * s, y: y + px * s + py * c };
  };
  return { x, y, rot, sx, front, apply };
};

const globalScale = (props: CharProps, P: Record<string, number>) => {
  const sq = P.squash || 1;
  return { sx: (props.flip ? -1 : 1) / sq, sy: sq };
};

/** LOCAL coords of every pearl as drawn in the INTACT state for the given props/pose (flip + squash applied). */
export const pearlPositions = (props: CharProps): { x: number; y: number; r: number }[] => {
  const P = resolvePose(props);
  const sp = neckSpine(P);
  const g = globalScale(props, P);
  const out: { x: number; y: number; r: number }[] = [];
  pearlRows(sp).forEach((row) => row.forEach((p) => out.push({ x: p.x * g.sx, y: p.y * g.sy, r: p.r })));
  return out;
};

const circles = (ps: Pearl[], k: number, ox: number, oy: number) =>
  ps.map((p) => {
    const r = p.r * k, cx = p.x + ox * p.r, cy = p.y + oy * p.r;
    return `M${fmt(cx - r)},${fmt(cy)}a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(2 * r)},0a${fmt(r)},${fmt(r)} 0 1,0 ${fmt(-2 * r)},0`;
  }).join('');

const PearlSet: React.FC<{ pearls: Pearl[] }> = ({ pearls }) => (
  <>
    <path d={circles(pearls, 1, 0, 0)} fill={C.pearlShade} stroke={C.ink} strokeWidth={1.4} />
    <path d={circles(pearls, 0.8, -0.13, -0.15)} fill={C.pearl} />
    <path d={circles(pearls, 0.3, -0.34, -0.38)} fill={C.white} />
  </>
);

/** Snapped state: dangling loops + broken strands (gravity in local space). */
const brokenStrands = (sp: SpinePt[], frame: number, snap: number) => {
  const sw = wobble(frame, [[snap, 26], [snap + 10, -10]], 1.2, 1.6) + Math.sin(onTwos(frame) / 20) * 2;
  const out: { d: string; pearls: Pearl[]; end?: Pt }[] = [];
  const rot = (v: Pt, a: number): Pt => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
  const sampleQ = (A: Pt, Cc: Pt, B: Pt, r: number) => {
    const pts: Pt[] = [];
    let last: Pt | null = null;
    for (let i = 0; i <= 200; i++) {
      const t = i / 200, u = 1 - t;
      const p = { x: u * u * A.x + 2 * u * t * Cc.x + t * t * B.x, y: u * u * A.y + 2 * u * t * Cc.y + t * t * B.y };
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= r * 2.05) { pts.push(p); last = p; }
    }
    return pts;
  };
  const PR = 6;
  // loose loops slipping off the neck (both ends still caught), hanging with gravity
  const loop = (sa: number, sb: number, u: number, hx: number, hy: number, k: number) => {
    const A = neckPoint(sp, NECK_LEN * sa, u), B = neckPoint(sp, NECK_LEN * sb, u);
    const m = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    const hang = rot({ x: hx, y: hy }, sw * k * D2R);
    const Cc = { x: m.x + hang.x, y: m.y + hang.y };
    const pts = sampleQ(A, Cc, B, PR);
    out.push({ d: `M${fmt(A.x)},${fmt(A.y)} Q${fmt(Cc.x)},${fmt(Cc.y)} ${fmt(B.x)},${fmt(B.y)}`, pearls: pts.map((p) => ({ ...p, r: PR, row: 0, depth: 1 })) });
  };
  loop(0.7, 0.42, 1.0, 40, 230, 0.8);
  loop(0.55, 0.3, -1.0, -30, 170, 1.1);
  // broken strands with frayed ends
  const strand = (s: number, u: number, len: number, a0: number, seed: number) => {
    const A = neckPoint(sp, NECK_LEN * s, u);
    const dv = rot({ x: 0, y: len }, (a0 + sw * (0.8 + seed * 0.3)) * D2R);
    const Cc = { x: A.x + dv.x * 0.5 + 14 * seed, y: A.y + dv.y * 0.5 };
    const B = { x: A.x + dv.x, y: A.y + dv.y };
    const pts = sampleQ(A, Cc, B, PR * 0.9).slice(0, -1);
    out.push({ d: `M${fmt(A.x)},${fmt(A.y)} Q${fmt(Cc.x)},${fmt(Cc.y)} ${fmt(B.x)},${fmt(B.y)}`, pearls: pts.map((p) => ({ ...p, r: PR * 0.9, row: 0, depth: 1 })), end: B });
  };
  strand(0.86, -1.02, 150, 10, 1);
  strand(0.18, 1.02, 110, -12, -1);
  strand(0.94, 1.0, 70, -18, 0.5);
  return out;
};

const Giraffe: React.FC<CharProps> = (props) => {
  const { frame, seed = 'giraffe' } = props;
  const P = resolvePose(props);
  const intact = props.pearlsIntact !== false;
  const snapFrame = typeof props.snapFrame === 'number' ? props.snapFrame : 840;
  const bagImp = props.bagImpulses as [number, number][] | undefined;
  const ex = EXPR[props.expression ?? 'aloof'] ?? EXPR.aloof;
  const lid = Math.max(ex.lid, blinkAt(frame, seed));
  const g = globalScale(props, P);
  const sp = neckSpine(P);
  const neckD = neckPath(sp);
  const hx = headXform(P, sp);
  const bodyT = `translate(0,${fmt(P.bodyY)}) rotate(${P.bodyTilt.toFixed(2)},-15,-450)`;

  // ---- train (root coords, attached to the rump, drags on the ground) ----
  const tw = P.trainWave, t2 = onTwos(frame);
  const att = bodyXform(P, { x: -140, y: -505 });
  const att2 = bodyXform(P, { x: -160, y: -372 });
  const ripple = Math.sin(t2 / 9) * 6;
  const tipX = -575 + tw * 22;
  const trainD = `M${fmt(att.x)},${fmt(att.y)} C${fmt(att.x - 120)},${fmt(att.y + 30 + ripple)} ${-335 + tw * 8},-330 ${-368 + tw * 10},-150 `
    + `C${-392 + tw * 12},-52 ${-452 + tw * 16},-12 ${fmt(tipX)},-4 L${fmt(tipX + 30)},0 L-238,0 `
    + `C${-216 + ripple * 0.5},-70 -196,-230 ${fmt(att2.x)},${fmt(att2.y)} Z`;
  const trainFold = `M${fmt(att.x - 30)},${fmt(att.y + 30)} C-300,-330 ${-320 + tw * 8},-160 ${-400 + tw * 14},-18 M${fmt(att.x - 10)},${fmt(att.y + 80)} C-250,-300 ${-270 + tw * 6},-120 ${-300 + tw * 10},-4`;
  const trainHem = `M${fmt(tipX + 4)},-3 L-238,0`;

  // ---- dress (body-local) ----
  const DRESS = `M64,-552 C10,-548 -110,-528 -172,-494 C-204,-470 -204,-420 -186,-392 L-178,-346 Q-152,-322 -126,-342 Q-100,-326 -74,-348 Q-48,-334 -22,-352 Q4,-336 30,-350 Q56,-330 82,-340 Q108,-316 132,-332 C150,-380 166,-430 158,-470 L120,-500 Z`;
  const sash = P.sashSwing + jolt(frame, bagImp, 2, 3) * 0.3;

  // ---- head / bag ----
  const headProps = { ex, lid, look: { x: P.lookX, y: P.lookY }, slide: clamp(P.glassesSlide), seed, sadRot: 0 };
  const tip = hx.apply(hx.front ? OSSI_F_TIP : OSSI_P_TIP);
  const bagAng = P.bagSwing + jolt(frame, bagImp) + Math.sin(onTwos(frame) / 14) * 2.5;

  const rows = intact ? pearlRows(sp) : [];
  const strands = intact ? [] : brokenStrands(sp, frame, snapFrame);
  const legs = (far: boolean, shadow = false) => (
    <>
      <Leg x={far ? HIPS.bf.x : HIPS.bn.x} y={HIPS.bn.y} hip={far ? P.bfHip : P.bnHip} knee={far ? P.bfKnee : P.bnKnee} ankle={far ? P.bfAnkle : P.bnAnkle} far={far} shadow={shadow} seed={`${seed}b${far}`} />
      <Leg x={far ? HIPS.ff.x : HIPS.fn.x} y={HIPS.fn.y} hip={far ? P.ffHip : P.fnHip} knee={far ? P.ffKnee : P.fnKnee} ankle={far ? P.ffAnkle : P.fnAnkle} far={far} shadow={shadow} seed={`${seed}f${far}`} />
    </>
  );
  const headT = `translate(${fmt(hx.x)},${fmt(hx.y)}) rotate(${hx.rot.toFixed(2)}) scale(${(hx.sx * HEAD_SCALE).toFixed(3)},${HEAD_SCALE})`;
  const bow = { x: -30, y: -356 };

  return (
    <g transform={`scale(${g.sx.toFixed(4)},${g.sy.toFixed(4)})`}>
      <GiraffeDefs />
      <g filter="url(#boil)">
        {/* paper-cut drop shadow */}
        <g transform="translate(10,7)" fill={C.ink} opacity={0.22}>
          <path d={trainD} />
          <g transform={bodyT}><path d={DRESS} />{legs(false, true)}</g>
          <path d={neckD} />
          <g transform={headT}><ellipse cx={hx.front ? 0 : 55} cy={hx.front ? -10 : -8} rx={hx.front ? 50 : 82} ry={hx.front ? 84 : 42} /></g>
        </g>
        {/* train */}
        <path d={trainD} fill={C.teal} {...ink(S.ink)} />
        <path d={trainD} fill="url(#halftone)" opacity={0.7} />
        <path d={trainFold} fill="none" stroke={C.tealLight} strokeWidth={5} strokeLinecap="round" />
        <path d={trainHem} stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
        <g transform={bodyT}>
          {legs(true)}
          {/* tail */}
          <g transform={`translate(-178,-482) rotate(${(26 + P.tailSwing).toFixed(2)})`}>
            <path d="M-4,0 C-6,50 -3,100 -2,128 L2,128 C3,100 6,50 4,0 Z" fill={C.giraffe} {...ink(S.inkThin)} />
            <path d="M0,124 C-10,134 -12,152 -4,168 C0,160 6,164 8,170 C12,152 10,134 0,124 Z" fill={C.ink} />
          </g>
          {legs(false)}
          {/* wrap dress */}
          <path d={DRESS} fill={C.teal} {...ink(S.ink)} />
          <path d="M-190,-420 C-120,-360 40,-350 150,-400 L140,-330 L-180,-340 Z" fill="url(#halftone)" opacity={0.8} />
          <path d="M40,-548 C-40,-540 -130,-515 -170,-488" fill="none" stroke={C.tealLight} strokeWidth={5} strokeLinecap="round" />
          <path d="M150,-470 C90,-420 0,-380 -70,-336" fill="none" stroke={C.tealLight} strokeWidth={6} strokeLinecap="round" />
          <path d="M104,-532 C70,-470 20,-410 -28,-356" fill="none" stroke={C.ink} strokeWidth={22} strokeLinecap="round" />
          <path d="M104,-532 C70,-470 20,-410 -28,-356" fill="none" stroke={C.gold} strokeWidth={14} strokeLinecap="round" />
          {/* bow + sash ends (spring) */}
          <g transform={`translate(${bow.x},${bow.y})`}>
            <g transform={`rotate(${(sash * 0.7).toFixed(2)})`}>
              <path d="M-4,4 C-14,40 -22,70 -30,92 L-16,96 C-10,70 -2,40 2,6 Z" fill={C.gold} {...ink(S.inkThin)} />
            </g>
            <g transform={`rotate(${(sash).toFixed(2)})`}>
              <path d="M4,4 C12,36 22,60 34,80 L20,88 C10,64 2,40 -2,6 Z" fill={C.gold} {...ink(S.inkThin)} />
            </g>
            <path d="M0,0 C-20,-26 -46,-14 -38,6 C-30,20 -12,10 0,0 C12,10 30,20 38,6 C46,-14 20,-26 0,0 Z" fill={C.gold} {...ink(S.inkThin)} />
            <circle cx={0} cy={0} r={8} fill={C.gold} {...ink(S.inkThin)} />
          </g>
        </g>
        {/* neck */}
        <path d={neckD} fill={C.giraffe} {...ink(S.ink)} />
        <path d={neckSpotsPath(sp, seed)} fill={C.giraffeSpot} />
        <path d={napeStripPath(sp, -1, -0.55)} fill="url(#halftone)" />
        {(() => {
          const dd = dirOf(spineAt(sp, 10).a);
          const pts = [-1.08, -0.7, -0.3, 0, 0.3, 0.7, 1.08].map((u) => { const q = neckPoint(sp, 10, u), c = Math.sqrt(Math.max(0, 1 - Math.min(1, u * u))); return { x: q.x - dd.x * 10 * c, y: q.y - dd.y * 10 * c - 4 }; });
          const d = `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y + 4)}`).join(' L')}`;
          return <>
            <path d={d} fill="none" stroke={C.ink} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke={C.tealLight} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
          </>;
        })()}
        {!intact && strands.map((s, i) => (
          <path key={`s${i}`} d={s.d} fill="none" stroke={C.ink} strokeWidth={1.6} />
        ))}
      </g>
      {/* pearls (crisp, no boil) */}
      {rows.map((row, j) => <PearlSet key={j} pearls={row} />)}
      {intact && <path d={napeStripPath(sp, -1.15, -0.62, NECK_LEN * 0.03, NECK_LEN * 0.95)} fill="url(#halftone)" opacity={0.55} />}
      {!intact && <>
        <PearlSet pearls={strands.flatMap((s) => s.pearls)} />
        {strands.filter((s) => s.end).map((s, i) => (
          <path key={`e${i}`} d={`M${fmt(s.end!.x)},${fmt(s.end!.y)} q-3,8 2,12 m-2,-12 q5,6 1,14`} fill="none" stroke={C.ink} strokeWidth={1.5} strokeLinecap="round" />
        ))}
      </>}
      <g filter="url(#boil)">
        <g transform={headT}>
          {hx.front ? <HeadFront {...headProps} /> : <HeadProfile {...headProps} />}
        </g>
        <g transform={`translate(${fmt(tip.x)},${fmt(tip.y)})`}><Handbag angle={bagAng} /></g>
      </g>
      {props.debugPearls ? (() => {
        // drawn in un-flipped space: invert global scale so dots land on the returned coordinates
        const pts = pearlPositions(props);
        return <g transform={`scale(${(1 / g.sx).toFixed(4)},${(1 / g.sy).toFixed(4)})`}>
          <path d={pts.map((p) => `M${fmt(p.x - 1.8)},${fmt(p.y)}a1.8,1.8 0 1,0 3.6,0a1.8,1.8 0 1,0 -3.6,0`).join('')} fill={C.hotPink} />
        </g>;
      })() : null}
    </g>
  );
};
export default Giraffe;

// ============================ MODEL SHEET ============================
const Label: React.FC<{ x: number; y: number; t: string; size?: number; anchor?: 'start' | 'middle' }> = ({ x, y, t, size = 18, anchor = 'middle' }) => (
  <text x={x} y={y} fontFamily={F.sans} fontSize={size} fill={C.ink} textAnchor={anchor} letterSpacing={1.5}>{t.toUpperCase()}</text>
);

const HeadCam: React.FC<{ x: number; y: number; w: number; h: number; props: CharProps; label: string; zoom?: number }> = ({ x, y, w, h, props, label, zoom = 1 }) => {
  const P = resolvePose(props);
  const sp = neckSpine(P);
  const hx = headXform(P, sp);
  const c = hx.apply({ x: hx.front ? 0 : 55, y: hx.front ? -30 : -20 });
  const vw = 240 / zoom, vh = (240 / zoom) * (h / w);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={C.paperDark} />
      <svg x={x} y={y} width={w} height={h} viewBox={`${fmt(c.x - vw / 2)} ${fmt(c.y - vh / 2)} ${fmt(vw)} ${fmt(vh)}`}>
        <Giraffe {...props} />
      </svg>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="none" {...ink(2)} />
      <Label x={x + w / 2} y={y + h + 20} t={label} size={14} />
    </g>
  );
};

/** QA-only close-ups: render with --props='{"qa":"snap"}' (snap | debug | swoop). */
const QaView: React.FC<{ qa: string; frame: number }> = ({ qa, frame }) => {
  if (qa === 'walk') {
    const w = walkPose(frame);
    return (
      <AbsoluteFill style={{ background: C.paper }}>
        <svg width={1920} height={1080} viewBox="-700 -1000 1400 1050">
          <BoilDefs frame={frame} />
          {Array.from({ length: 15 }, (_, i) => <rect key={i} x={-700 + i * 100} y={0} width={4} height={30} fill={C.ink} />)}
          <g transform={`translate(${(-250 + w.stepX - 360).toFixed(1)},0)`}><Giraffe frame={frame} pose={w.pose} /></g>
        </svg>
      </AbsoluteFill>
    );
  }
  const pose = qa === 'swoop' || qa === 'debug' ? POSES.swoop : qa === 'snap' ? { ...POSES.freeze, glassesSlide: 0.8 } : POSES.idle;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <svg width={1920} height={1080} viewBox="-700 -1000 1400 1050">
        <BoilDefs frame={frame} />
        <Giraffe frame={frame} pose={pose} pearlsIntact={qa !== 'snap'} snapFrame={0} debugPearls={qa === 'debug'}
          expression={qa === 'snap' ? 'shocked' : 'aloof'} flip={qa === 'debug'} />
      </svg>
    </AbsoluteFill>
  );
};

export const Sheet: React.FC<{ qa?: string }> = ({ qa }) => {
  const frame = useCurrentFrame();
  if (qa) return <QaView qa={qa} frame={frame} />;
  const cellPose = (x: number, name: string, extra: Partial<CharProps> = {}, sc = 0.27) => (
    <g key={name}>
      <ellipse cx={x} cy={392} rx={80} ry={8} fill={C.paperDark} />
      <g transform={`translate(${x},390) scale(${sc})`}>
        <Giraffe frame={frame} pose={POSES[name] ?? POSES.idle} {...extra} />
      </g>
      <Label x={x} y={420} t={extra.label as string ?? name} size={15} />
    </g>
  );
  const walk = walkPose(frame);
  const dash = (sx: number, gy: number, sc: number) => {
    const off = ((walk.stepX * sc) % 40 + 40) % 40;
    return Array.from({ length: 9 }, (_, i) => <rect key={i} x={sx + i * 40 - off} y={gy + 4} width={18} height={4} fill={C.ink} opacity={0.5} />);
  };
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <BoilDefs frame={frame} />
        <text x={40} y={62} fontFamily={F.display} fontSize={44} fill={C.ink} fontStyle="italic">Giraffe</text>
        <Label x={40} y={92} t="Look two — forty feet of pearls · h 900" anchor="start" size={16} />
        {/* hero */}
        <ellipse cx={560} cy={1022} rx={380} ry={16} fill={C.paperDark} />
        <g transform="translate(560,1020) scale(0.97)">
          <Giraffe frame={frame} pose={POSES.idle} bagImpulses={[[0, 22], [48, -18]]} />
        </g>
        {/* POSES row */}
        <Label x={1000} y={60} t="Poses" anchor="start" />
        {cellPose(1050, 'idle')}
        {cellPose(1225, 'swoop')}
        {cellPose(1400, 'freeze', { expression: 'shocked', pose: { ...POSES.freeze, glassesSlide: 1 } } as Partial<CharProps>)}
        {cellPose(1575, 'freeze', { expression: 'mortified', pearlsIntact: false, snapFrame: 40, label: 'snapped', pose: { ...POSES.freeze, glassesSlide: 0.7 } } as Partial<CharProps>)}
        <g>
          <g clipPath="url(#gir-walkclip)">
            <clipPath id="gir-walkclip"><rect x={1670} y={100} width={240} height={310} /></clipPath>
            {dash(1670, 390, 0.27)}
            <g transform="translate(1800,390) scale(0.27)"><Giraffe frame={frame} pose={walk.pose} /></g>
          </g>
          <Label x={1790} y={420} t="walk live (treadmill)" size={15} />
        </g>
        {/* EXPRESSIONS row */}
        <Label x={1000} y={462} t="Expressions (glasses up / slid down)" anchor="start" />
        {EXPRESSIONS.map((e, i) => (
          <HeadCam key={e} x={1000 + i * 150} y={476} w={140} h={150} label={e}
            props={{ frame, expression: e, pose: { ...POSES.idle, glassesSlide: 0.85 } }} />
        ))}
        {EXPRESSIONS.map((e, i) => (
          <HeadCam key={`f${e}`} x={1450 + i * 150} y={476} w={140} h={150} label={`${e} front`}
            props={{ frame, expression: e, pose: { ...POSES.freeze, glassesSlide: i === 0 ? 0 : 0.9 } }} />
        ))}
        {/* GLASSES + WALK + DEBUG */}
        <Label x={1000} y={676} t="glassesSlide 0 · .5 · 1" anchor="start" />
        {[0, 0.5, 1].map((s, i) => (
          <HeadCam key={`g${s}`} x={1000 + i * 110} y={690} w={100} h={120} label={`${s}`}
            props={{ frame, expression: 'shocked', pose: { ...POSES.freeze, glassesSlide: s } }} />
        ))}
        <Label x={1340} y={676} t="walk cycle (every 4f)" anchor="start" />
        {[0, 4, 8, 12, 16, 20].map((ph, i) => (
          <g key={ph} transform={`translate(${1380 + i * 88},1040) scale(0.19)`}>
            <line x1={-300} y1={0} x2={300} y2={0} {...ink(5)} opacity={0.4} />
            <Giraffe frame={0} pose={walkPose(0, { phase: ph / 24 }).pose} />
          </g>
        ))}
        <Label x={1000} y={862} t="pearlPositions debug" anchor="start" />
        <g transform="translate(1180,1040) scale(0.19)">
          <Giraffe frame={frame} pose={POSES.swoop} debugPearls />
        </g>
        <Label x={1180} y={1070} t={`${pearlPositions({ frame, pose: POSES.swoop }).length} pearls`} size={13} />
      </svg>
    </AbsoluteFill>
  );
};
