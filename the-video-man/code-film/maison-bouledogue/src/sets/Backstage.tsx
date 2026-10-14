import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, F } from '../lib/style';
import { BoilDefs } from '../lib/fx';
import { GROUND_Y, P, layerT } from './backstage/common';
import { Wall, Sketches, Sign, Clock, TapeMeasures, Lamps } from './backstage/far';
import { Racks, Vanity, DressForm, HatBoxes, FabricBolts, SewingTable } from './backstage/mid';
import { Floor, FloorClutter, Stepladder, LADDER_H } from './backstage/near';
import { FrontLayer } from './backstage/front';

export { GROUND_Y, P as PARALLAX, layerT, LADDER_H, Stepladder };

/** Recommended character staging for S2 (character plane, screen space at camX=0; wrap chars in layerT(1,...)). */
export const STAGING = {
  bulldog: { x: 640, y: GROUND_Y, scale: 1, facing: 'right' },
  ladder: { x: 1130 },
  mouse: { x: 1130, y: GROUND_Y - LADDER_H - 14, scale: 1, facing: 'right' },
  flamingo: { x: 1370, y: GROUND_Y + 10, scale: 1.9, note: 'only legs + heels in frame; body crops out top' },
} as const;

export type BackstageProps = {
  frame: number;
  camX?: number;
  camY?: number;
  zoom?: number;
  /** 0..1: hangers swing, bulbs flicker faster, papers flutter, sewing machine runs. */
  chaos?: number;
  /** damped impulses on the hanging lamps: [frame, amplitudeDeg][] */
  lampSwing?: [number, number][];
  /** stepladder x on the character plane (null hides it). */
  ladderX?: number | null;
  /** 0..1 ladder wobble (e.g. on hammer hits). */
  ladderShake?: number;
  [k: string]: unknown;
};

const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bs-bulbglow">
      <stop offset="0" stopColor={C.spot} stopOpacity="0.9" />
      <stop offset="0.45" stopColor={C.goldLight} stopOpacity="0.35" />
      <stop offset="1" stopColor={C.goldLight} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="bs-pool">
      <stop offset="0" stopColor={C.goldLight} stopOpacity="0.45" />
      <stop offset="0.6" stopColor={C.gold} stopOpacity="0.15" />
      <stop offset="1" stopColor={C.gold} stopOpacity="0" />
    </radialGradient>
    <linearGradient id="bs-cone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.spot} stopOpacity="0.45" />
      <stop offset="1" stopColor={C.spot} stopOpacity="0" />
    </linearGradient>
    <linearGradient id="bs-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={C.tealLight} />
      <stop offset="0.6" stopColor={C.teal} />
      <stop offset="1" stopColor={C.navy} />
    </linearGradient>
    <linearGradient id="bs-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.curtainDark} />
      <stop offset="0.5" stopColor={C.curtainDark} />
      <stop offset="1" stopColor={C.plum} />
    </linearGradient>
  </defs>
);

/** Everything behind the characters (wall -> far -> lamps -> mid -> mid-near -> floor -> ladder). */
export const Back: React.FC<BackstageProps> = ({
  frame, camX = 0, camY = 0, zoom = 1, chaos = 0, lampSwing = [], ladderX = STAGING.ladder.x, ladderShake = 0,
}) => {
  const fp = { frame, chaos };
  return (
    <g>
      <Defs />
      <g transform={layerT(P.wall, camX, camY, zoom)}><Wall /></g>
      <g transform={layerT(P.far, camX, camY, zoom)}>
        <Sketches {...fp} />
        <Clock {...fp} x={1330} y={236} />
        <Sign {...fp} />
        <TapeMeasures {...fp} />
      </g>
      <g transform={layerT(P.lamps, camX, camY, zoom)}><Lamps {...fp} lampSwing={lampSwing} /></g>
      <g transform={layerT(1, 0, camY, zoom)}><Floor camX={camX} /></g>
      <g transform={layerT(P.mid, camX, camY, zoom)} filter="url(#boil)">
        <Racks {...fp} />
        <Vanity {...fp} />
        <DressForm {...fp} x={500} />
        <HatBoxes {...fp} x={1545} />
      </g>
      <g transform={layerT(P.midNear, camX, camY, zoom)}>
        <FabricBolts x={-40} />
        <SewingTable {...fp} x={1740} />
      </g>
      <g transform={layerT(1, 0, camY, zoom)}><FloorClutter frame={frame} chaos={chaos} camX={camX} /></g>
      {ladderX !== null && (
        <g transform={layerT(P.chars, camX, camY, zoom)}><Stepladder x={ladderX} frame={frame} shake={ladderShake} /></g>
      )}
    </g>
  );
};

/** Foreground layer (in front of characters, strong parallax). */
export const Front: React.FC<BackstageProps> = ({ frame, camX = 0, camY = 0, zoom = 1, chaos = 0 }) => (
  <g transform={layerT(P.front, camX, camY, zoom)}>
    <FrontLayer frame={frame} chaos={chaos} />
  </g>
);

// ---------------------------------------------------------------- SHEET
const Guides: React.FC<{ camX: number; label?: boolean }> = ({ camX, label }) => (
  <g>
    <line x1={-100} y1={GROUND_Y} x2={2020} y2={GROUND_Y} stroke={C.hotPink} strokeWidth={4} strokeDasharray="18 10" />
    <g transform={layerT(1, camX)} fill="none" stroke={C.white} strokeWidth={4} strokeDasharray="10 8" opacity={0.85}>
      <rect x={STAGING.bulldog.x - 150} y={GROUND_Y - 420} width={300} height={420} rx={40} />
      <rect x={STAGING.mouse.x - 50} y={STAGING.mouse.y - 170} width={100} height={170} rx={20} />
      <path d={`M${STAGING.flamingo.x - 40} ${GROUND_Y} L${STAGING.flamingo.x - 20} -20 M${STAGING.flamingo.x + 50} ${GROUND_Y} L${STAGING.flamingo.x + 30} -20`} />
      {label && (
        <g stroke="none" fill={C.white} fontFamily={F.sans} fontSize={30} opacity={1}>
          <text x={STAGING.bulldog.x} y={GROUND_Y - 430} textAnchor="middle">BULLDOG 420</text>
          <text x={STAGING.mouse.x} y={STAGING.mouse.y - 180} textAnchor="middle">MOUSE</text>
          <text x={STAGING.flamingo.x + 70} y={300}>FLAMINGO LEGS</text>
        </g>
      )}
    </g>
    <text x={760} y={GROUND_Y + 36} fontFamily={F.sans} fontSize={30} fill={C.hotPink}>{`GROUND_Y = ${GROUND_Y}`}</text>
  </g>
);

const Thumb: React.FC<{ x: number; y: number; w: number; frame: number; camX: number; chaos: number; label: string; guides?: boolean; big?: boolean }> = ({
  x, y, w, frame, camX, chaos, label, guides = true, big,
}) => {
  const h = (w * 9) / 16;
  const lampSwing: [number, number][] = [[0, 6], [48, -9]];
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={h} fill={C.ink} opacity={0.25} />
      <svg x={x} y={y} width={w} height={h} viewBox="0 0 1920 1080">
        <rect width={1920} height={1080} fill={C.ink} />
        <Back frame={frame} camX={camX} chaos={chaos} lampSwing={lampSwing} ladderShake={chaos} />
        <Front frame={frame} camX={camX} chaos={chaos} />
        {guides && <Guides camX={camX} label={big} />}
      </svg>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={C.ink} strokeWidth={3} />
      <text x={x} y={y + h + 26} fontFamily={F.sans} fontSize={big ? 24 : 19} fill={C.ink} letterSpacing={1}>{label}</text>
    </g>
  );
};

export const Sheet: React.FC = () => {
  const frame = useCurrentFrame();
  const heroCam = Math.round((frame - 48) * 2.5);
  const tw = 360;
  const cams = [-200, 0, 200];
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <BoilDefs frame={frame} />
        <text x={30} y={62} fontFamily={F.display} fontSize={46} fontStyle="italic" fill={C.ink}>Maison Bouledogue — Set: Backstage Atelier</text>
        <text x={30} y={92} fontFamily={F.sans} fontSize={18} fill={C.ink} letterSpacing={2}>
          {`LAYERS  wall ${P.wall} · far ${P.far} · lamps ${P.lamps} · mid ${P.mid} · mid-near ${P.midNear} · floor 0.7→1.3 · chars 1 · front ${P.front}`}
        </text>
        <Thumb x={30} y={120} w={1120} frame={frame} camX={heroCam} chaos={0.4} big label={`HERO  camX ${heroCam} (sweeps -120→+120)  chaos 0.4  — dashed = GROUND_Y + staging guides`} />
        {cams.map((c, i) => (
          <Thumb key={'a' + c} x={1170} y={120 + i * 240} w={tw} frame={frame} camX={c} chaos={0} guides={false} label={`camX ${c} · chaos 0`} />
        ))}
        {cams.map((c, i) => (
          <Thumb key={'b' + c} x={1545} y={120 + i * 240} w={tw} frame={frame} camX={c} chaos={1} guides={false} label={`camX ${c} · chaos 1`} />
        ))}
        <g fontFamily={F.sans} fontSize={19} fill={C.ink}>
          <text x={30} y={800}>{`GROUND_Y = ${GROUND_Y} (feet line, character plane p=1). Wrap characters in layerT(1, camX, camY, zoom).`}</text>
          <text x={30} y={830}>{`Bulldog: x ${STAGING.bulldog.x}, y ${GROUND_Y}, scale 1.   Stepladder (built into Back): x ${STAGING.ladder.x}, top step y ${GROUND_Y - LADDER_H}.`}</text>
          <text x={30} y={860}>{`Mouse: stand on ladder top at (${STAGING.mouse.x}, ${STAGING.mouse.y}), scale 1.   Flamingo: x ${STAGING.flamingo.x}, y ${STAGING.flamingo.y}, scale ${STAGING.flamingo.scale} (legs only).`}</text>
          <text x={30} y={890}>{`Props: camX ±200, camY, zoom, chaos 0..1, lampSwing [[f,deg]...], ladderX, ladderShake. Frame ${frame}.`}</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
