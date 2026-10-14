import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, W, H } from './style';
import { onTwos } from './motion';

declare const process: { env: Record<string, string | undefined> };
const FX = (typeof process !== 'undefined' && process.env && process.env.REMOTION_FX) || 'full';
const NO_BOIL = FX.includes('noboil');
const NO_GRAIN = FX.includes('nograin');

/**
 * <BoilDefs frame/> — put once inside an <svg>. Then use filter="url(#boil)" (or #boilStrong) on a <g>
 * to get hand-drawn 'boiling' ink lines. Seed changes on twos.
 */
export const BoilDefs: React.FC<{ frame: number }> = ({ frame }) => {
  const seed = (onTwos(frame) / 2) % 7;
  return (
    <defs>
      {NO_BOIL ? (<>
        <filter id="boil"><feOffset dx={0} dy={0} /></filter>
        <filter id="boilStrong"><feOffset dx={0} dy={0} /></filter>
      </>) : (<>
      <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={1} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="boilStrong" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={1} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={6} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      </>)}
      <pattern id="halftone" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <circle cx="5" cy="5" r="2.2" fill={C.ink} opacity="0.35" />
      </pattern>
      <pattern id="halftoneFine" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <circle cx="3" cy="3" r="1.2" fill={C.ink} opacity="0.3" />
      </pattern>
    </defs>
  );
};

/** Full-frame film finish: paper grain + vignette + slight gate weave. Put on top of everything. */
export const FilmFinish: React.FC<{ frame: number; grain?: number; vignette?: number }> = ({ frame, grain = 0.10, vignette = 0.55 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <filter id="grainF">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={frame % 13} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <radialGradient id="vig" cx="50%" cy="50%" r="75%">
          <stop offset="55%" stopColor={C.ink} stopOpacity="0" />
          <stop offset="100%" stopColor={C.ink} stopOpacity={vignette} />
        </radialGradient>
      </defs>
      {NO_GRAIN ? null : <rect width={W} height={H} filter="url(#grainF)" opacity={grain} style={{ mixBlendMode: 'multiply' }} />}
      <rect width={W} height={H} fill="url(#vig)" />
    </svg>
  </AbsoluteFill>
);
