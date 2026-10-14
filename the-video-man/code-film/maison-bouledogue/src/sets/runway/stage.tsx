// Runway set — the catwalk platform (runway plane, parallax 1), spotlight cones & pools, the end drop, reflection helper.
import React from 'react';
import { C, ink } from '../../lib/style';
import { hash01, noise2 } from '../../lib/rng';
import {
  Cam, FACE_BOTTOM_Y, GROUND_Y, layerToScreen, layerTransform, LIP_Y, PARALLAX, RUNWAY_END_X, RUNWAY_START_X,
  SURFACE_FAR_Y, SURFACE_NEAR_Y,
} from './geom';
import { TRUSS_Y } from './backdrop';

export interface Spot { x: number; intensity: number; width?: number }

const END = RUNWAY_END_X;
const X0 = RUNWAY_START_X;

export const StageDefs: React.FC<{ uid: string }> = ({ uid }) => (
  <>
    <linearGradient id={`${uid}surfG`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.navy} />
      <stop offset="0.18" stopColor={C.ink} />
      <stop offset="0.55" stopColor={C.penguinBlack} />
      <stop offset="0.8" stopColor={C.plum} />
      <stop offset="1" stopColor={C.ink} />
    </linearGradient>
    <linearGradient id={`${uid}faceG`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.plum} />
      <stop offset="0.35" stopColor={C.penguinBlack} />
      <stop offset="1" stopColor={C.ink} />
    </linearGradient>
    <linearGradient id={`${uid}pitG`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.ink} />
      <stop offset="1" stopColor={C.ink} />
    </linearGradient>
    <linearGradient id={`${uid}abyssG`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.navy} stopOpacity="0.55" />
      <stop offset="0.06" stopColor={C.navy} stopOpacity="0.95" />
      <stop offset="0.3" stopColor={C.ink} />
      <stop offset="1" stopColor={C.ink} />
    </linearGradient>
    <linearGradient id={`${uid}coneG`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.spot} stopOpacity="0.95" />
      <stop offset="0.6" stopColor={C.spot} stopOpacity="0.55" />
      <stop offset="1" stopColor={C.spot} stopOpacity="0.35" />
    </linearGradient>
    <linearGradient id={`${uid}coneFadeG`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.spot} stopOpacity="1" />
      <stop offset="0.55" stopColor={C.spot} stopOpacity="0.6" />
      <stop offset="1" stopColor={C.spot} stopOpacity="0" />
    </linearGradient>
    <radialGradient id={`${uid}poolG`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={C.white} stopOpacity="0.9" />
      <stop offset="0.35" stopColor={C.spot} stopOpacity="0.6" />
      <stop offset="1" stopColor={C.spot} stopOpacity="0" />
    </radialGradient>
    <radialGradient id={`${uid}glowG`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={C.white} stopOpacity="1" />
      <stop offset="0.25" stopColor={C.spot} stopOpacity="0.7" />
      <stop offset="1" stopColor={C.spot} stopOpacity="0" />
    </radialGradient>
    <linearGradient id={`${uid}sheenG`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={C.pearl} stopOpacity="0" />
      <stop offset="0.5" stopColor={C.pearl} stopOpacity="0.22" />
      <stop offset="1" stopColor={C.pearl} stopOpacity="0" />
    </linearGradient>
    <pattern id={`${uid}foot`} width="64" height="60" patternUnits="userSpaceOnUse" x="0" y={LIP_Y}>
      <circle cx="32" cy="26" r="17" fill={C.spot} opacity="0.2" />
      <circle cx="32" cy="26" r="8" fill={C.gold} />
      <circle cx="32" cy="26" r="6" fill={C.spot} />
      <circle cx="30" cy="24" r="2.5" fill={C.white} />
    </pattern>
  </>
);

/** Catwalk platform in the runway plane (behind characters). */
export const Platform: React.FC<{ frame: number; cam: Cam; uid: string; spots: Spot[] }> = ({ frame, cam, uid, spots }) => {
  const L = END - X0;
  // chaser bulbs on the end cap
  const chase = Math.floor(frame / 4) % 4;
  return (
    <g transform={layerTransform(PARALLAX.runway, cam)}>
      {/* pit below everything */}
      <rect x={X0 - 1200} y={FACE_BOTTOM_Y - 4} width={L + 4000} height={700} fill={C.ink} />
      {/* the drop beyond the end */}
      <rect x={END} y={SURFACE_FAR_Y - 6} width={2600} height={900} fill={`url(#${uid}abyssG)`} />
      {/* scaffolding legs fading into the void just past the lip (seen under the cantilever) */}
      <path d={`M${END - 60} ${FACE_BOTTOM_Y} L${END - 120} 1200 M${END - 240} ${FACE_BOTTOM_Y} L${END - 180} 1200 M${END - 60} ${FACE_BOTTOM_Y + 40} L${END - 240} 1100`}
        stroke={C.plum} strokeWidth={6} opacity={0.5} />
      {/* depth: falling light streaks + low mist in the void */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = END + 60 + i * 90 + hash01('abx', i) * 50;
        return <rect key={i} x={x} y={SURFACE_FAR_Y + 30} width={3 + (i % 3) * 2} height={260 + hash01('abh', i) * 240} fill={C.plum} opacity={0.18} />;
      })}
      <ellipse cx={END + 500} cy={1060} rx={700} ry={70} fill={C.plum} opacity={0.25} />
      {/* top surface */}
      <rect x={X0} y={SURFACE_FAR_Y} width={L} height={SURFACE_NEAR_Y - SURFACE_FAR_Y} fill={`url(#${uid}surfG)`} />
      {/* glossy sheen streaks (move with the floor) */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = X0 + 200 + i * 780 + hash01('sheen', i) * 200;
        return <ellipse key={i} cx={x} cy={SURFACE_FAR_Y + 18 + (i % 2) * 44} rx={360} ry={5} fill={`url(#${uid}sheenG)`} />;
      })}
      <rect x={X0} y={SURFACE_FAR_Y} width={L} height={3} fill={C.gold} opacity={0.7} />
      {/* gold lip */}
      <rect x={X0} y={SURFACE_NEAR_Y} width={L} height={LIP_Y - SURFACE_NEAR_Y} fill={C.gold} {...ink(3)} />
      <rect x={X0} y={SURFACE_NEAR_Y + 2} width={L} height={3} fill={C.goldLight} />
      {/* front face + footlights */}
      <rect x={X0} y={LIP_Y} width={L} height={FACE_BOTTOM_Y - LIP_Y} fill={`url(#${uid}faceG)`} />
      <rect x={X0} y={LIP_Y} width={L} height={FACE_BOTTOM_Y - LIP_Y} fill="url(#halftoneFine)" opacity={0.6} />
      <rect x={X0} y={LIP_Y} width={L - 20} height={60} fill={`url(#${uid}foot)`} />
      <path d={Array.from({ length: Math.ceil(L / 256) }, (_, i) => `M${X0 + i * 256 + 16} ${LIP_Y + 64}L${X0 + i * 256 + 16} ${FACE_BOTTOM_Y - 6}`).join('')}
        stroke={C.plum} strokeWidth={2} opacity={0.6} />
      <rect x={X0} y={FACE_BOTTOM_Y - 8} width={L} height={8} fill={C.gold} opacity={0.5} />
      {/* spot pools reflected on the front face lip */}
      {spots.map((sp, i) => sp.intensity > 0.02 && sp.x < END - 40 && (
        <ellipse key={i} cx={sp.x} cy={SURFACE_NEAR_Y + 6} rx={(sp.width ?? 280) * 0.55} ry={9} fill={`url(#${uid}poolG)`} opacity={0.7 * sp.intensity} />
      ))}
      {/* END CAP — sheer drop */}
      <path d={`M${END} ${SURFACE_FAR_Y} L${END + 18} ${SURFACE_FAR_Y + 10} L${END + 18} ${FACE_BOTTOM_Y + 6} L${END} ${FACE_BOTTOM_Y} Z`} fill={C.gold} {...ink(4)} />
      <path d={`M${END + 18} ${SURFACE_FAR_Y + 10} L${END + 18} ${FACE_BOTTOM_Y + 6}`} stroke={C.goldLight} strokeWidth={3} />
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <circle cx={END + 9} cy={SURFACE_FAR_Y + 40 + k * 44} r={16} fill={C.hotPink} opacity={k === chase ? 0.45 : 0.08} />
          <circle cx={END + 9} cy={SURFACE_FAR_Y + 40 + k * 44} r={6} fill={k === chase ? C.blush : C.curtainDark} {...ink(2)} />
        </g>
      ))}
      {/* void dust drifting up past the edge */}
      {Array.from({ length: 34 }, (_, i) => {
        const bx = END + 40 + hash01('vdx', i) * 700;
        const sp = 0.6 + hash01('vds', i) * 1.2;
        const y = 1150 - ((frame * sp + hash01('vdy', i) * 900) % 900);
        const x = bx + noise2('vdn', i, frame * 0.01) * 40;
        const tw = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.2 + i * 1.7));
        return <circle key={i} cx={x} cy={y} r={1.5 + hash01('vdr', i) * 2.5} fill={C.spot} opacity={tw * (y < SURFACE_FAR_Y ? 0.5 : 1)} />;
      })}
    </g>
  );
};

/** Spotlight cones (screen space: lamp on the truss layer -> pool on the runway plane) + lamps + dust. */
export const Spots: React.FC<{ frame: number; cam: Cam; uid: string; spots: Spot[] }> = ({ frame, cam, uid, spots }) => (
  <g>
    {spots.map((sp, i) => {
      const I = Math.max(0, Math.min(1.5, sp.intensity));
      const pT = PARALLAX.truss;
      const xT = 960 + pT * (sp.x - 960);
      const [ax, ay] = layerToScreen(xT, TRUSS_Y + 60, pT, cam);
      const overVoid = sp.x > END + 10;
      const [bx, by] = layerToScreen(sp.x, overVoid ? 1180 : GROUND_Y, 1, cam);
      const z = cam.zoom;
      const hw = ((sp.width ?? 280) / 2) * z;
      const ang = (Math.atan2(bx - ax, by - ay) * -180) / Math.PI;
      const cone = (k: number, apexW: number) => `M${ax - apexW} ${ay} L${ax + apexW} ${ay} L${bx + hw * k} ${by} L${bx - hw * k} ${by} Z`;
      const flick = 1 + 0.03 * noise2('spotflick', i, frame * 0.2);
      return (
        <g key={i}>
          {I > 0.01 && (
            <g opacity={Math.min(1, I) * flick}>
              <path d={cone(1.45, 26)} fill={`url(#${uid}${overVoid ? 'coneFadeG' : 'coneG'})`} opacity={0.09} />
              <path d={cone(1.05, 18)} fill={`url(#${uid}${overVoid ? 'coneFadeG' : 'coneG'})`} opacity={0.14} />
              <path d={cone(0.62, 11)} fill={`url(#${uid}${overVoid ? 'coneFadeG' : 'coneG'})`} opacity={0.16} />
              <path d={cone(0.25, 5)} fill={overVoid ? `url(#${uid}coneFadeG)` : C.white} opacity={overVoid ? 0.14 : 0.07} />
              {/* pool on the runway */}
              {!overVoid && <ellipse cx={bx} cy={by + 4} rx={hw * 1.55} ry={40 * z} fill={`url(#${uid}poolG)`} opacity={0.75} />}
              {!overVoid && <ellipse cx={bx} cy={by + 2} rx={hw * 0.7} ry={13 * z} fill={C.white} opacity={0.22} />}
              {/* dust motes in the beam */}
              {Array.from({ length: 12 }, (_, k) => {
                const v = (hash01('md', i, k) + frame * 0.0012 * (0.5 + hash01('mv', i, k))) % 1;
                const u = (hash01('mu', i, k) * 2 - 1) * 0.8 + 0.12 * noise2('mn', k + i * 20, frame * 0.02);
                const x = ax + (bx - ax) * v + u * hw * v;
                const y = ay + (by - ay) * v;
                return <circle key={k} cx={x} cy={y} r={1.4 + hash01('mr', i, k) * 2} fill={C.white}
                  opacity={0.35 + 0.4 * Math.sin(frame * 0.15 + k)} />;
              })}
            </g>
          )}
          {/* lamp can on the truss */}
          <g transform={`translate(${ax} ${ay - 40 * z}) rotate(${ang}) scale(${z})`}>
            <rect x={-22} y={-6} width={44} height={50} rx={6} fill={C.penguinBlack} {...ink(4)} />
            <rect x={-26} y={36} width={52} height={12} rx={4} fill={C.gold} {...ink(3)} />
            <ellipse cx={0} cy={48} rx={22} ry={7} fill={I > 0.01 ? C.white : C.plum} />
            {I > 0.01 && <circle cx={0} cy={50} r={60} fill={`url(#${uid}glowG)`} opacity={0.8 * Math.min(1, I)} />}
          </g>
        </g>
      );
    })}
  </g>
);

/**
 * Reflection on the glossy runway top: renders `children` mirrored about GROUND_Y, faded and clipped
 * to the visible surface band [GROUND_Y, SURFACE_NEAR_Y] and to x <= RUNWAY_END_X.
 * Place it in the SAME coordinate space you draw the characters in, BEFORE the characters, e.g.
 *   <g transform={runwayTransform(camX)}> <Reflection>{chars}</Reflection> {chars} </g>   (world coords, camX=0 default)
 * or in screen space: <Reflection camX={camX}>{charsInScreenCoords}</Reflection>.
 * Characters must stand with feet on GROUND_Y for the mirror line to match.
 */
export const Reflection: React.FC<{ children?: React.ReactNode; camX?: number; strength?: number; id?: string }> = ({ children, camX = 0, strength = 0.32, id }) => {
  const auto = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const rid = id ?? `rwrefl${auto}`;
  const endX = END - camX;
  return (
    <g>
      <defs>
        <clipPath id={`${rid}c`}>
          <rect x={-5000} y={GROUND_Y} width={endX + 5000} height={SURFACE_NEAR_Y - GROUND_Y} />
        </clipPath>
        <linearGradient id={`${rid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={GROUND_Y} x2="0" y2={SURFACE_NEAR_Y}>
          <stop offset="0" stopColor={C.white} stopOpacity="1" />
          <stop offset="1" stopColor={C.white} stopOpacity="0" />
        </linearGradient>
        <mask id={`${rid}m`} maskUnits="userSpaceOnUse" x={-5000} y={GROUND_Y} width={20000} height={SURFACE_NEAR_Y - GROUND_Y}>
          <rect x={-5000} y={GROUND_Y} width={20000} height={SURFACE_NEAR_Y - GROUND_Y} fill={`url(#${rid}g)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${rid}c)`}>
        <g mask={`url(#${rid}m)`} opacity={strength}>
          <g transform={`translate(0 ${2 * GROUND_Y}) scale(1 -1)`}>{children}</g>
        </g>
      </g>
    </g>
  );
};
