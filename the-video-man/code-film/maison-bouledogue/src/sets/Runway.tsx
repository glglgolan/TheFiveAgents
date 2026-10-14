// RUNWAY — Maison Bouledogue Paris Fashion Week catwalk (hero set, shots S3–S6).
//
// World: runway plane x ∈ [0, WORLD_W=4400]; the screen shows [camX, camX+1920] (camX 0..~2500).
// Characters stand with feet on GROUND_Y in the runway plane. Draw them inside
//   <g transform={runwayTransform(camX, camY, zoom)}> ... world coords ... </g>
// or convert with worldToScreen(x, camX, zoom).
//
// Layers (far -> near, parallax factor): wall/monogram 0.3, truss 0.55, audience rows 0.64..0.87,
// runway plane 1.0 (+ spotlight cones in screen space), photographers' pit 1.35, confetti ~1.15.
//
// Back props:  frame, camX=0, camY=0 (+ = camera moves down; use negative to tilt up), zoom=1,
//              spots: {x, intensity, width?}[] (world x; default DEFAULT_SPOTS),
//              crowd: 'murmur'|'lean'|'gasp'|'silent'|'cheer' (default 'murmur'),
//              crowdFrom: previous state (default 'murmur'), crowdT 0..1 blend crowdFrom -> crowd (default 1; ripples through the crowd,
//              'gasp' snaps with overshoot), lookX: world x the crowd watches (default screen centre), flashFrames (eyes glint), dim 0..1.
// Front props: frame, camX, camY, zoom, flashFrames: absolute frames (each pops a starburst at a seeded visible photographer +
//              global warm exposure bump), confettiFrom?: frame the confetti cannons fire (confetti + streamers from then on).
// Helpers:     flashIntensity(frame, flashFrames) 0..1 (use to brighten characters), worldToScreen, runwayTransform,
//              <Reflection camX? strength?>{chars}</Reflection> glossy mirror on the runway top, <FinalTitle frame from/>.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, F, ink } from '../lib/style';
import { BoilDefs } from '../lib/fx';
import { clamp } from '../lib/motion';
import { Cam, GROUND_Y, RUNWAY_END_X, runwayTransform } from './runway/geom';
import { Truss, Wall } from './runway/backdrop';
import { Audience, AudienceDefs, CrowdState } from './runway/audience';
import { Platform, Reflection, Spot, StageDefs, Spots } from './runway/stage';
import { activeFlashes, Confetti, FlashBursts, flashIntensity, Photographers } from './runway/front';
import { FinalTitle } from './runway/title';

export { GROUND_Y, RUNWAY_END_X, RUNWAY_START_X, SURFACE_FAR_Y, SURFACE_NEAR_Y, LIP_Y, WORLD_W, PARALLAX, worldToScreen, runwayTransform, layerToScreen } from './runway/geom';
export { flashIntensity } from './runway/front';
export { Reflection } from './runway/stage';
export { FinalTitle } from './runway/title';
export type { CrowdState } from './runway/audience';
export type { Spot } from './runway/stage';

/** Default house spots if a shot passes none. */
export const DEFAULT_SPOTS: Spot[] = [
  { x: 500, intensity: 0.55 }, { x: 1400, intensity: 0.7 }, { x: 2300, intensity: 0.55 }, { x: 3200, intensity: 0.6 }, { x: 3850, intensity: 0.45 },
];

export interface RunwayProps {
  frame: number; camX?: number; camY?: number; zoom?: number;
  spots?: Spot[]; crowd?: CrowdState; crowdFrom?: CrowdState; crowdT?: number; lookX?: number;
  flashFrames?: number[]; confettiFrom?: number; dim?: number;
  [k: string]: unknown;
}

const useUid = () => 'rw' + React.useId().replace(/[^a-zA-Z0-9]/g, '');

export const Back: React.FC<RunwayProps> = ({
  frame, camX = 0, camY = 0, zoom = 1, spots = DEFAULT_SPOTS, crowd = 'murmur', crowdFrom = 'murmur', crowdT = 1, lookX,
  flashFrames = [], dim = 0,
}) => {
  const uid = useUid();
  const cam: Cam = { camX, camY, zoom };
  const fl = flashIntensity(frame, flashFrames);
  return (
    <g>
      <defs>
        <StageDefs uid={uid} />
        <AudienceDefs uid={uid} />
      </defs>
      <Wall frame={frame} cam={cam} uid={uid} dim={dim} />
      <Truss cam={cam} />
      <Audience frame={frame} cam={cam} uid={uid} crowd={crowd} crowdFrom={crowdFrom} crowdT={clamp(crowdT)}
        lookX={lookX ?? camX + 960} flash={fl} />
      <Platform frame={frame} cam={cam} uid={uid} spots={spots} />
      <Spots frame={frame} cam={cam} uid={uid} spots={spots} />
    </g>
  );
};

export const Front: React.FC<RunwayProps> = ({ frame, camX = 0, camY = 0, zoom = 1, flashFrames = [], confettiFrom }) => {
  const uid = useUid();
  const cam: Cam = { camX, camY, zoom };
  const act = activeFlashes(frame, flashFrames, cam);
  const lit = new Set(act.filter((a) => a.I > 0.2).map((a) => a.i));
  return (
    <g>
      <Photographers frame={frame} cam={cam} uid={uid} lit={lit} flash={flashIntensity(frame, flashFrames)} />
      {confettiFrom !== undefined && <Confetti frame={frame} from={confettiFrom} cam={cam} />}
      <FlashBursts frame={frame} flashFrames={flashFrames} cam={cam} uid={uid} />
    </g>
  );
};

// ---------------------------------------------------------------- sheet
/** Stand-in mannequin (sheet only) to show the reflection + spotlight pool; feet on GROUND_Y. */
const Mannequin: React.FC<{ x: number; frame: number }> = ({ x, frame }) => {
  const sway = Math.sin(frame * 0.2) * 4;
  return (
    <g transform={`translate(${x} ${GROUND_Y})`}>
      <path d={`M-18 0 L-10 -200 L10 -200 L18 0 Z`} fill={C.pearlShade} {...ink(4)} />
      <path d={`M-70 -200 C-60 -330 60 -330 70 -200 Z`} fill={C.hotPink} {...ink(5)} />
      <rect x={-22} y={-420} width={44} height={110} rx={20} fill={C.pearl} {...ink(4)} />
      <circle cx={sway} cy={-470} r={40} fill={C.pearl} {...ink(5)} />
      <path d={`M${-60 + sway} -500 L${60 + sway} -500 L${sway} -600 Z`} fill={C.gold} {...ink(4)} />
    </g>
  );
};

interface Panel {
  label: string; camX: number; crowd?: CrowdState; flash?: boolean; confetti?: boolean; title?: boolean; mannequin?: boolean;
  spots?: Spot[]; lookX?: number;
}
const spotsAt = (camX: number): Spot[] => [
  { x: camX + 960, intensity: 1, width: 330 }, { x: camX + 300, intensity: 0.45 }, { x: camX + 1620, intensity: 0.5 },
];
const PANELS: Panel[] = [
  { label: 'camX 0 · murmur', camX: 0, crowd: 'murmur', spots: spotsAt(0), mannequin: true },
  { label: 'camX 1800 · lean', camX: 1800, crowd: 'lean', spots: spotsAt(1800), lookX: 2500 },
  { label: 'camX 2500 · END (drop) · gasp', camX: 2500, crowd: 'gasp', lookX: 4100,
    spots: [{ x: 3500, intensity: 0.5 }, { x: 4120, intensity: 1.2, width: 380 }] },
  { label: 'crowd: murmur', camX: 900, crowd: 'murmur', spots: spotsAt(900) },
  { label: 'crowd: lean (look → right)', camX: 900, crowd: 'lean', spots: spotsAt(900), lookX: 2300 },
  { label: 'crowd: gasp', camX: 900, crowd: 'gasp', spots: spotsAt(900) },
  { label: 'crowd: silent', camX: 900, crowd: 'silent', spots: spotsAt(900) },
  { label: 'crowd: cheer', camX: 900, crowd: 'cheer', spots: spotsAt(900) },
  { label: 'flash storm', camX: 1200, crowd: 'lean', flash: true, spots: spotsAt(1200), mannequin: true },
  { label: 'confetti + cheer', camX: 1500, crowd: 'cheer', confetti: true, spots: spotsAt(1500) },
  { label: 'FinalTitle', camX: 1200, crowd: 'cheer', title: true, spots: spotsAt(1200) },
  { label: 'reflection + pool', camX: 600, crowd: 'lean', spots: spotsAt(600), mannequin: true },
];

const SetView: React.FC<{ p: Panel; frame: number }> = ({ p, frame }) => {
  const flashFrames = p.flash ? Array.from({ length: 16 }, (_, i) => i * 6 + (i % 3)) : [];
  const conf = p.confetti ? -40 : undefined;
  const mx = p.camX + 960;
  return (
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ display: 'block' }}>
      <BoilDefs frame={frame} />
      <Back frame={frame} camX={p.camX} crowd={p.crowd} spots={p.spots} lookX={p.lookX ?? (p.mannequin ? mx : undefined)} flashFrames={flashFrames} />
      {p.mannequin && (
        <g transform={runwayTransform(p.camX)}>
          <Reflection><Mannequin x={mx} frame={frame} /></Reflection>
          <Mannequin x={mx} frame={frame} />
        </g>
      )}
      <Front frame={frame} camX={p.camX} flashFrames={flashFrames} confettiFrom={conf} />
      {p.title && <FinalTitle frame={frame} from={Math.max(0, Math.floor(frame / 48) * 48) - 0} />}
    </svg>
  );
};

export const Sheet: React.FC<{ panel?: number }> = ({ panel }) => {
  const frame = useCurrentFrame();
  if (panel !== undefined && PANELS[panel]) {
    return (
      <AbsoluteFill style={{ background: C.ink }}>
        <SetView p={PANELS[panel]} frame={frame} />
      </AbsoluteFill>
    );
  }
  const cols = 4, pw = 456, ph = 256.5, gx = 16, top = 92;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div style={{ position: 'absolute', left: 24, top: 18, fontFamily: F.display, fontSize: 44, color: C.ink }}>
        RUNWAY — set sheet <span style={{ fontFamily: F.sans, fontSize: 20, color: C.curtain, letterSpacing: 3 }}>
          MAISON BOULEDOGUE · S3–S6 · world 0–4400 · end x {RUNWAY_END_X} · ground y {GROUND_Y}</span>
      </div>
      {PANELS.map((p, i) => {
        const cx = i % cols, cy = Math.floor(i / cols);
        return (
          <div key={i} style={{ position: 'absolute', left: gx + cx * (pw + 16), top: top + cy * (ph + 40), width: pw }}>
            <div style={{ width: pw, height: ph, outline: `3px solid ${C.ink}`, overflow: 'hidden' }}>
              <SetView p={p} frame={frame} />
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 18, color: C.ink, marginTop: 6 }}>{i}. {p.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
