// S6 (1224–1440) — BOW + BUTTON.
// Monsieur steps into his spot and takes a deep smug bow (1240) — L09 "Of course. It was... intentional."
// Pipette, deadpan beside him, turns to camera and WINKS (1328, ting, push-in) — L10 "Of course, Monsieur."
// Pull back, FinalTitle slams (1384). A last pearl rolls at the lens (1410–1428) — CLINK — star crack. Black at 1436.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../lib/style';
import { BoilDefs } from '../lib/fx';
import { clamp, ease, lerp, onTwos, track, wobble } from '../lib/motion';
import { hash01 } from '../lib/rng';
import { visemeAt } from '../lib/visemes';
import { Back, FinalTitle, Front, GROUND_Y, Reflection, runwayTransform, type Spot } from '../sets/Runway';
import Bulldog, { POSES as BD, blendPose as bdBlend, waddlePose, type Pose } from '../characters/Bulldog';
import Mouse, { POSES as MP, blendPose as mBlend } from '../characters/Mouse';
import { PearlField } from './s5/pearls';
import { CLINK, LastPearl, lastPearlAt, LensCrack } from './s6/lastPearl';

const n1 = (v: number) => Math.round(v * 10) / 10;

const F0 = 1224, BOW = 1240, WINK = 1328, TITLE = 1384, BLACK = 1436;
const BX = 2060, MX = 1790, MS = 1.18; // world x of Bulldog / Pipette (on his left, behind his bowing rump), Pipette scale (a touch nearer the lens)
const WALK_FROM = BX - 84;
const WALK_END = 1236;

// ---------------------------------------------------------------- Bulldog acting
const RISE: Pose = { ...BD.idle, lean: -6, torso: -8, head: -12, puff: 1, squash: -0.12, lookX: 0.2, lookY: -0.3 };
const GESTURE: Pose = { ...BD.smug, armF: 74, foreF: 18, pawF: -34, handF: 0, armBFront: 0, armB: 20, foreB: -30, head: -8, lookX: 0.2 };
const FINGER: Pose = { ...BD.smug, armF: 128, foreF: 44, pawF: 10, handF: 2, armBFront: 1, head: -24, lean: -9, lookX: 0.1, lookY: -0.4 };
const BASK: Pose = { ...BD.smug, puff: 1 };

const walkState = (g: number) => waddlePose(g - F0 + 6, { cycle: 16, stride: 42, base: BD.idle });
const walkX0 = walkState(F0).x;
const bdX = (g: number) => {
  const gg = Math.min(g, WALK_END);
  return WALK_FROM + (walkState(gg).x - walkX0);
};
const bdPose = (g: number): Pose => {
  if (g < WALK_END) return walkState(g).pose;
  if (g < BOW) return bdBlend(walkState(WALK_END).pose, RISE, ease.out(clamp((g - WALK_END) / 4)));
  if (g < BOW + 8) return bdBlend(RISE, BD.bow, ease.outBack(clamp((g - BOW) / 7), 0.8));
  if (g < 1253) return { ...BD.bow, torso: BD.bow.torso + 4 * ease.inOut(clamp((g - BOW - 8) / 5)) };
  if (g < 1264) return bdBlend({ ...BD.bow, torso: BD.bow.torso + 4 }, BD.smug, ease.inOut(clamp((g - 1253) / 10)));
  if (g < 1274) return BD.smug;
  if (g < 1294) return bdBlend(BD.smug, GESTURE, ease.outBack(clamp((g - 1274) / 6), 1.2));
  if (g < 1300) return GESTURE;
  if (g < 1322) return bdBlend(GESTURE, FINGER, ease.outBack(clamp((g - 1300) / 6), 1.4));
  return bdBlend(FINGER, BASK, ease.inOut(clamp((g - 1322) / 12)));
};
const bdExpr = (f: number) => {
  const g = onTwos(f);
  if (g < BOW) return 'smug';
  if (g < 1252) return 'proud';
  if (g < 1300) return 'smug';
  if (g < 1330) return 'proud';
  return 'smug';
};

// ---------------------------------------------------------------- Pipette acting
const TURN = WINK - 3; // anticipation begins
const mPose = (g: number): Pose => {
  if (g < 1262) return { ...MP.idle, lookX: 1, lookY: -0.1 };
  if (g < 1290) return { ...MP.idle, lookX: 0.8, lookY: -0.9, headTilt: -6 }; // eyes roll up
  if (g < TURN) return mBlend(MP.idle, { ...MP.deadpanTalk, lookX: 1 }, ease.inOut(clamp((g - 1290) / 10)));
  if (g < WINK) return { ...MP.deadpanTalk, squash: 0.9, bodyY: 2, lookX: -1, headTilt: 6 }; // crouch before the turn
  if (g < WINK + 6) return mBlend({ ...MP.wink, squash: 1.12, bodyY: -4 }, MP.wink, ease.out(clamp((g - WINK) / 6)));
  if (g < 1334) return MP.wink;
  if (g < 1366) return mBlend(MP.wink, { ...MP.deadpanTalk, lookX: 0.9 }, ease.inOut(clamp((g - 1334) / 6)));
  return { ...MP.deadpanTalk, lookX: 0.9 };
};
const mExpr = (f: number) => {
  const g = onTwos(f);
  if (g < 1290) return 'deadpan';
  if (g < WINK) return 'deadpan';
  if (g < 1336) return 'wink';
  return 'smug';
};
const mFlip = (f: number) => onTwos(f) >= WINK; // faces him (right) until the turn, then swings round to us

/** Screen position of Pipette's near eye (after she turns right). */
const mouseEyeWorld = () => ({ x: MX - 12 * MS, y: GROUND_Y - 124 * MS });

// ---------------------------------------------------------------- camera
interface Cam { camX: number; camY: number; zoom: number }
const aim = (wx: number, wy: number, z: number, sx = 960, sy = 540): Cam => ({
  camX: wx - 960 - (sx - 960) / z, camY: wy - 540 - (sy - 540) / z, zoom: z,
});
const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({ camX: lerp(a.camX, b.camX, t), camY: lerp(a.camY, b.camY, t), zoom: lerp(a.zoom, b.zoom, t) });
const TWO = aim((BX + MX) / 2 - 10, GROUND_Y, 1.2, 960, 900);
const BOWCAM = aim((BX + MX) / 2 - 30, GROUND_Y, 1.26, 960, 910);
const WINKCAM = aim(MX - 10, GROUND_Y - 100 * MS, 2.6, 760, 560);
const WIDE = aim((BX + MX) / 2, GROUND_Y, 1.0, 960, 800);
const camAt = (f: number): Cam => {
  let c: Cam;
  if (f < WINK - 2) c = lerpCam(TWO, BOWCAM, ease.inOut(clamp((f - F0) / 60)));
  else if (f < 1366) c = lerpCam(BOWCAM, WINKCAM, ease.out(clamp((f - (WINK - 2)) / 7)));
  else c = lerpCam(WINKCAM, WIDE, ease.inOut(clamp((f - 1366) / 16)));
  // little push-bump on the wink
  if (f >= WINK) c = { ...c, zoom: c.zoom + wobble(f, [[WINK + 5, 0.06]], 2.2, 5) };
  return c;
};

const BOW_FLASHES = [1241, 1243, 1246, 1249, 1253, 1258];
const spotsAt = (f: number): Spot[] => {
  const on = ease.out(clamp((f - F0) / 10));
  return [
    { x: BX, intensity: lerp(0.6, 1.2, on), width: 330 },
    { x: MX + 20, intensity: f >= WINK ? 1.1 : 0.5, width: 170 },
    { x: 1250, intensity: 0.45 }, { x: 2900, intensity: 0.45 }, { x: 3600, intensity: 0.35 },
  ];
};

const S6: React.FC<{ frame: number }> = ({ frame }) => {
  const f = Math.max(F0, frame);
  const g = onTwos(f);
  const cam = camAt(f);
  // micro shake on the clink
  const t = f - CLINK;
  const shk = t >= 0 && t < 7 ? 10 * (1 - t / 7) : 0;
  const sx = shk ? (hash01('clk', t) - 0.5) * shk : 0, sy = shk ? (hash01('clky', t) - 0.5) * shk : 0;
  const { camX, camY, zoom } = cam;
  const chars = (
    <>
      <g transform={`translate(${n1(bdX(f))} ${GROUND_Y})`}>
        <Bulldog frame={f} poseFn={bdPose} worldX={bdX} expression={bdExpr(f)} simFrom={F0 - 24} impulses={[[BOW + 7, 0.7], [1302, 0.5]]} />
      </g>
      <g transform={`translate(${MX} ${GROUND_Y + 14}) scale(${MS})`}>
        <Mouse frame={f} pose={mPose(g)} poseFn={mPose} flip={mFlip(f)} expression={mExpr(f)} viseme={visemeAt('mouse', f)}
          impulses={[[WINK, 1], [1334, 0.4]]} />
      </g>
    </>
  );
  const eye = mouseEyeWorld();
  const tingT = f - WINK - 1;
  const lp = lastPearlAt(Math.min(f, CLINK));
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ display: 'block' }}>
        <BoilDefs frame={f} />
        {f < BLACK && (
          <g transform={`translate(${n1(sx)} ${n1(sy)})`}>
            <Back frame={f} camX={camX} camY={camY} zoom={zoom} spots={spotsAt(f)} crowd="cheer" crowdFrom="cheer" lookX={BX + 100}
              flashFrames={BOW_FLASHES} />
            <g transform={runwayTransform(camX, camY, zoom)}>
              <Reflection strength={0.3}>{chars}</Reflection>
              <PearlField frame={f} camX={camX} zoom={zoom} layer="back" splitZ={GROUND_Y + 14} />
              {chars}
              <PearlField frame={f} camX={camX} zoom={zoom} layer="front" splitZ={GROUND_Y + 14} />
              {/* wink 'ting' sparkle */}
              {tingT >= 0 && tingT < 12 && (
                <g transform={`translate(${n1(eye.x - 6)} ${n1(eye.y - 6)}) scale(${n1(ease.outBack(clamp(tingT / 3), 2.4) * (1 - clamp((tingT - 5) / 7)) * 100) / 100}) rotate(${tingT * 6})`}>
                  <path d="M0 -34 L6 -6 L34 0 L6 6 L0 34 L-6 6 L-34 0 L-6 -6 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
                  <circle cx={30} cy={-26} r={4} fill={C.goldLight} />
                  <circle cx={-24} cy={30} r={3} fill={C.goldLight} />
                </g>
              )}
            </g>
            <Front frame={f} camX={camX} camY={camY} zoom={zoom} flashFrames={BOW_FLASHES} confettiFrom={1176} />
            <FinalTitle frame={f} from={TITLE} />
            <LastPearl frame={f} />
          </g>
        )}
        {f < BLACK && lp && <LensCrack frame={f} x={lp.x - lp.r * 0.12} y={lp.y - lp.r * 0.1} />}
        {f >= BLACK && <rect x={0} y={0} width={1920} height={1080} fill={C.ink} />}
      </svg>
    </AbsoluteFill>
  );
};

export default S6;
