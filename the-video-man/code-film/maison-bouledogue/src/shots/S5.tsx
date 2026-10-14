// S5 (936–1224) — MADAME PARAPLUIE, the showstopper.
// Waddle in (956) → SLIP on a pearl (992) → surf-slide across the pearl field with a whip-tracking camera →
// SPIN (1012–1036) → launch off the runway end (1040, crowd gasp, silence, lights die to one follow-spot) →
// UMBRELLA POP (1060) → serene float up through the dark, dust in the beam → reaction cut (Pipette L08) →
// frozen crowd, one clap (1152)… a second (1166)… → UPROAR (1176): confetti, swinging spots, camera bump.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../lib/style';
import { BoilDefs } from '../lib/fx';
import { clamp, ease, lerp, onTwos, track, wobble } from '../lib/motion';
import { hash01 } from '../lib/rng';
import { visemeAt } from '../lib/visemes';
import { Back, Front, GROUND_Y, Reflection, runwayTransform, type CrowdState, type Spot } from '../sets/Runway';
import Penguin, { umbrellaPop } from '../characters/Penguin';
import Bulldog, { POSES as BD, blendPose as bdBlend } from '../characters/Bulldog';
import Mouse, { POSES as MP, blendPose as mBlend } from '../characters/Mouse';
import {
  accelAt, bodyRot, camXAt, camYAt, CLAPS, ENTER, F0, LAND, LAUNCH, penExpr, penImpulses, penPose, penX, penY, POP, PS,
  SLIP, SPIN0, SPIN1, spinAngle, spinSpeed, UPROAR,
} from './s5/motion';
import { PearlField } from './s5/pearls';
import { FollowBeam, Motes, Scrim, type BeamGeom } from './s5/light';
import { Clapper } from './s5/clapper';

const n1 = (v: number) => Math.round(v * 10) / 10;

// edit points
const CUT_REACT = 1096, CUT_BACK = 1130, CUT_CROWD = 1148;

// ---------------------------------------------------------------- penguin
const PenguinAt: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  const pop = umbrellaPop(f, POP);
  const u = f >= POP - 4 ? pop.umbrellaOpen : 0;
  const x = penX(f), y = penY(f);
  const spin = spinAngle(f);
  const inSpin = f >= SPIN0 - 1 && f < SPIN1 + 1;
  const px = lerp(0, -76, u), py = lerp(-170, -618, u);
  const wind = f >= POP ? 0.5 * clamp((f - POP) / 8) + (f >= UPROAR ? 0.2 : 0) : f >= LAUNCH ? 0.35 : 0;
  return (
    <g transform={`translate(${n1(x)} ${n1(GROUND_Y + y)}) scale(${PS}) rotate(${n1(spin)} 0 -160) rotate(${n1(bodyRot(f))} ${n1(px)} ${n1(py)})`}>
      <Penguin frame={f} pose={penPose(f)} expression={penExpr(f)} umbrellaOpen={u} openJiggle={f >= POP - 4 ? pop.openJiggle : 0}
        wind={wind} spinAngle={spin} spinSpeed={inSpin ? spinSpeed(f) : undefined} impulses={penImpulses} accel={accelAt(f)} />
    </g>
  );
};

/** Speed lines trailing her during the slide (world coords). */
const SpeedLines: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  if (f < SLIP + 4 || f > LAUNCH + 6) return null;
  const v = penX(f) - penX(f - 1);
  const k = clamp((v - 12) / 60) * (f > LAUNCH ? 1 - (f - LAUNCH) / 6 : 1);
  if (k <= 0.02) return null;
  const x = penX(f), y0 = GROUND_Y + penY(f);
  const ft = onTwos(f);
  return (
    <g opacity={k}>
      {Array.from({ length: 9 }, (_, i) => {
        const h = 30 + i * 36 + hash01('slh', i, ft) * 18;
        const len = (120 + hash01('sll', i, ft) * 260) * (0.5 + k);
        const x1 = x - 90 - hash01('slo', i, ft) * 60;
        return <line key={i} x1={n1(x1)} y1={n1(y0 - h)} x2={n1(x1 - len)} y2={n1(y0 - h)}
          stroke={i % 3 === 0 ? C.hotPink : C.white} strokeWidth={i % 3 === 0 ? 5 : 3} strokeLinecap="round" opacity={0.75} />;
      })}
      {/* sparks of pearl-dust at her feet */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = hash01('fs', i, ft);
        return <circle key={`d${i}`} cx={n1(x - 20 - a * 80)} cy={n1(y0 - 4 - hash01('fsy', i, ft) * 30)} r={2 + a * 3} fill={C.pearl} />;
      })}
    </g>
  );
};

/** Little slip 'whoop' puff + impact star under her foot at the slip. */
const SlipPuff: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - SLIP;
  if (t < 0 || t > 9) return null;
  const x = penX(SLIP) + 24, y = GROUND_Y - 6;
  const e = ease.out(t / 9);
  return (
    <g opacity={1 - t / 9}>
      {Array.from({ length: 7 }, (_, i) => {
        const a = Math.PI + (i / 6) * Math.PI;
        return <line key={i} x1={n1(x + Math.cos(a) * (14 + e * 30))} y1={n1(y + Math.sin(a) * (14 + e * 30))}
          x2={n1(x + Math.cos(a) * (30 + e * 70))} y2={n1(y + Math.sin(a) * (30 + e * 70))} stroke={C.white} strokeWidth={5} strokeLinecap="round" />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- lighting & crowd states
const HOUSE_SPOTS = [700, 1400, 2150, 2900, 3600];
const spotsAt = (f: number): Spot[] => {
  const pxh = penX(Math.min(f, LAUNCH));
  if (f >= UPROAR) {
    const t = f - UPROAR;
    const swing = ease.out(clamp(t / 6));
    const cx = 3200;
    return [0, 1, 2, 3, 4, 5].map((i) => ({
      x: cx + (i - 2.5) * 380 + Math.sin(f * (0.16 + i * 0.03) + i * 1.9) * 620 * swing,
      intensity: 1.05 * clamp(t / 2), width: 300,
    }));
  }
  const out: Spot[] = HOUSE_SPOTS.map((x, i) => ({ x, intensity: f < LAUNCH + 1 + i * 2 ? 0.5 : 0 }));
  if (f < LAUNCH + 2 && f >= ENTER - 10) out.push({ x: pxh, intensity: 1.05, width: 300 });
  return out;
};

const crowdAt = (f: number): { crowd: CrowdState; crowdFrom: CrowdState; crowdT: number } => {
  if (f >= UPROAR) return { crowd: 'cheer', crowdFrom: 'silent', crowdT: ease.out(clamp((f - UPROAR) / 8)) };
  if (f >= 1054) return { crowd: 'silent', crowdFrom: 'gasp', crowdT: ease.inOut(clamp((f - 1054) / 16)) };
  if (f >= LAUNCH) return { crowd: 'gasp', crowdFrom: 'lean', crowdT: clamp((f - LAUNCH) / 3) };
  return { crowd: 'lean', crowdFrom: 'murmur', crowdT: ease.inOut(clamp((f - (ENTER + 10)) / 24)) };
};

/** House dim 0..1 — lights clunk out one by one after the launch, slam back on at the uproar. */
const dimAt = (f: number) => {
  if (f >= UPROAR) return 0.7 * (1 - clamp((f - UPROAR) / 2));
  if (f < LAUNCH) return 0;
  const steps = Math.floor(clamp((f - LAUNCH) / 2, 0, 5));
  return 0.7 * (steps / 5);
};
/** Follow-spot on her while over the void. */
const beamAt = (f: number) => {
  if (f < LAUNCH) return 0;
  if (f < LAUNCH + 2) return 0.9;
  if (f < LAUNCH + 3) return 0.4; // flicker
  return f >= UPROAR ? 1.1 : 1;
};

const UPROAR_FLASHES = [1177, 1179, 1182, 1186, 1189, 1193, 1198, 1203, 1207, 1212, 1218];

// ---------------------------------------------------------------- shots
const WideShot: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  let camX = camXAt(f), camY = camYAt(f), zoom = 1;
  let shx = 0, shy = 0;
  if (f >= UPROAR) {
    // new framing on the downbeat: pull back to show the hall erupting under her, camera bump
    const t = f - UPROAR;
    camX = 2720 + t * 1.2;
    camY = 60 + penY(f);
    zoom = 0.88 + wobble(f, [[UPROAR, 0.07]], 1.6, 3.2);
    const sh = 18 * Math.exp(-t / 3);
    shx = (hash01('ush', t) - 0.5) * sh; shy = (hash01('ushy', t) - 0.5) * sh;
  } else {
    if (f >= LAND && f < LAND + 6) shy = wobble(f, [[LAND, 8]], 5, 8);
    if (f >= LAUNCH && f < LAUNCH + 6) shx = wobble(f, [[LAUNCH, 6]], 5, 8);
  }
  camX += shx; camY += shy;
  const cs = crowdAt(f);
  const dim = dimAt(f);
  const airborne = f >= LAUNCH;
  const x = penX(f), y = penY(f);
  // follow-spot geometry (screen space): lamp high up-left off frame, through her body/canopy
  const u = f >= POP ? umbrellaPop(f, POP).umbrellaOpen : 0;
  const [tx, ty] = [(x - 30 * u - 960 - camX) * zoom + 960, (GROUND_Y + y - lerp(200, 330, u) * PS - 540 - camY) * zoom + 540];
  const beam: BeamGeom = { ax: tx - 560, ay: -340, tx, ty, w: lerp(200, 330, u) * zoom };
  const bi = beamAt(f);
  const lookX = airborne ? x : x + 120;
  const pen = <PenguinAt frame={f} />;
  return (
    <g>
      <Back frame={f} camX={camX} camY={camY} zoom={zoom} spots={spotsAt(f)} {...cs} lookX={lookX} dim={dim * 0.6}
        flashFrames={f >= UPROAR ? UPROAR_FLASHES : []} />
      <g transform={runwayTransform(camX, camY, zoom)}>
        {!airborne && <Reflection strength={0.3}>{pen}</Reflection>}
        <PearlField frame={f} camX={camX} zoom={zoom} layer="back" />
        <SpeedLines frame={f} />
        {!airborne && f >= ENTER - 2 && pen}
        <SlipPuff frame={f} />
        <PearlField frame={f} camX={camX} zoom={zoom} layer="front" />
      </g>
      <Front frame={f} camX={camX} camY={camY} zoom={zoom} flashFrames={f >= UPROAR ? UPROAR_FLASHES : []} confettiFrom={UPROAR} />
      <Scrim amount={dim} />
      {airborne && (
        <>
          <FollowBeam id="s5beam" b={beam} intensity={bi} frame={f} />
          <Motes b={beam} frame={f} intensity={bi * clamp((f - LAUNCH - 6) / 20)} layer={0} />
          <g transform={runwayTransform(camX, camY, zoom)}>{pen}</g>
          <Motes b={beam} frame={f} intensity={bi * clamp((f - LAUNCH - 6) / 20)} layer={1} />
          {f >= UPROAR && <Front frame={f} camX={camX} camY={camY} zoom={zoom} confettiFrom={UPROAR} />}
        </>
      )}
    </g>
  );
};

/** Reaction cut: Monsieur and Pipette at the runway entrance, staring up. L08 "Oh... oh my." */
const ReactionShot: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  const t = f - CUT_REACT;
  const zoom = 1.3 + t * 0.003; // slow creep in
  const camX = -250 + t * 0.3, camY = -80;
  const bx = 600, mx = 850;
  const monocle = track(f, [[1116, 0], [1120, 1, ease.outBack]]);
  const bdPose = (g: number) => {
    const p = bdBlend(BD.idle, BD.shocked, ease.out(clamp((g - CUT_REACT + 6) / 8)));
    return { ...p, lookX: 0.8, lookY: -1, head: -14, jaw: track(g, [[1100, 0.2], [1118, 0.2], [1122, 0.75, ease.outBack]]) };
  };
  const mPose = (g: number) => {
    const p = mBlend(MP.idle, MP.gasp, ease.out(clamp((g - 1112) / 6)));
    return { ...p, headTilt: -18, lookY: -0.9, lookX: 0.6 };
  };
  const g2 = onTwos(f);
  return (
    <g>
      <Back frame={f} camX={camX} camY={camY} zoom={zoom} spots={[]} crowd="silent" crowdFrom="silent" lookX={4200} dim={0.5} />
      <Scrim amount={0.55} />
      {/* spill from the follow-spot, far up-right */}
      <FollowBeam id="s5rbeam" b={{ ax: 2100, ay: -400, tx: 900, ty: 1300, w: 900 }} intensity={0.45} frame={f} />
      <g transform={runwayTransform(camX, camY, zoom)}>
        <g transform={`translate(${bx} ${GROUND_Y})`}>
          <Bulldog frame={f} poseFn={bdPose} expression={f < 1118 ? 'shocked' : 'horrified'} monocleOut={monocle} simFrom={CUT_REACT - 30}
            impulses={[[1120, 0.8]]} />
        </g>
        <g transform={`translate(${mx} ${GROUND_Y + 22}) scale(1.3)`}>
          <Mouse frame={f} pose={mPose(g2)} poseFn={mPose} expression="amazed" viseme={visemeAt('mouse', f)} impulses={[[1113, 0.6]]} />
        </g>
      </g>
    </g>
  );
};

/** Frozen silent crowd; one clap… a second… */
const CrowdShot: React.FC<{ frame: number }> = ({ frame }) => {
  const f = frame;
  const t = f - CUT_CROWD;
  const zoom = 1.9 + t * 0.0025;
  const camX = 1460 + t * 1.6, camY = 40;
  return (
    <g>
      <defs>
        <clipPath id="s5clapclip"><rect x={-100} y={-100} width={2120} height={770} /></clipPath>
        <clipPath id="s5clapclip2"><rect x={-100} y={-100} width={2120} height={850} /></clipPath>
      </defs>
      <Back frame={f} camX={camX} camY={camY} zoom={zoom} spots={[]} crowd="silent" crowdFrom="silent" lookX={4300} dim={0.5} />
      <Scrim amount={0.42} />
      <FollowBeam id="s5cbeam" b={{ ax: 2300, ay: -500, tx: 1500, ty: 700, w: 700 }} intensity={0.35} frame={f} />
      <Clapper frame={f} clapFrame={CLAPS[0]} x={640} y={500} baseY={720} s={1.15} sleeve={C.plum} clip="s5clapclip" />
      <Clapper frame={f} clapFrame={CLAPS[1]} x={1330} y={610} baseY={900} s={1.6} sleeve={C.navy} clip="s5clapclip2" />
    </g>
  );
};

const S5: React.FC<{ frame: number }> = ({ frame }) => {
  const f = Math.max(F0, frame);
  let shot: React.ReactNode;
  if (f >= CUT_REACT && f < CUT_BACK) shot = <ReactionShot frame={f} />;
  else if (f >= CUT_CROWD && f < UPROAR) shot = <CrowdShot frame={f} />;
  else shot = <WideShot frame={f} />;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ display: 'block' }}>
        <BoilDefs frame={f} />
        {shot}
      </svg>
    </AbsoluteFill>
  );
};

export default S5;
