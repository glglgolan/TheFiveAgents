// S1 (0–192) — TITLE. Closed grand curtain, spotlight clunks on and hunts for centre, marquee letters thump
// onto gold rails, subtitle slides in with a shimmer, flashbulbs pop from the dark audience, curtain whips open.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, W, H } from '../lib/style';
import { clamp, track, ease } from '../lib/motion';
import { BoilDefs } from '../lib/fx';
import { camT, camera, spot, whipOpen, whipPinch, WHIP_START, SPOT_ON } from './s1/geom';
import { CurtainHalf, CurtainSmear, Valance, Proscenium } from './s1/Curtain';
import { Title } from './s1/Title';
import { Audience, FlashBursts, flashExposure, WhipStreaks } from './s1/Audience';
import { Back as BackstageBack } from '../sets/Backstage';
import { S2_WHIP_CAMX } from './s2/camera';

const AUD_DEPTH = 1.35;

const Defs: React.FC<{ sp: ReturnType<typeof spot> }> = ({ sp }) => (
  <defs>
    <linearGradient id="s1gold" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0" stopColor={C.gold} />
      <stop offset="0.5" stopColor={C.gold} />
      <stop offset="1" stopColor={C.mustard} />
    </linearGradient>
    <linearGradient id="s1topShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={C.ink} stopOpacity={0.75} />
      <stop offset="1" stopColor={C.ink} stopOpacity={0} />
    </linearGradient>
    <radialGradient id="s1foot" cx="0.5" cy="0.9" r="0.6">
      <stop offset="0" stopColor={C.spot} stopOpacity={0.8} />
      <stop offset="1" stopColor={C.goldLight} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="s1flashGlow">
      <stop offset="0" stopColor={C.white} stopOpacity={0.9} />
      <stop offset="0.4" stopColor={C.spot} stopOpacity={0.5} />
      <stop offset="1" stopColor={C.spot} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="s1shimmer" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={C.white} stopOpacity={0} />
      <stop offset="0.5" stopColor={C.white} stopOpacity={0.95} />
      <stop offset="1" stopColor={C.white} stopOpacity={0} />
    </linearGradient>
    <radialGradient id="s1hole">
      <stop offset="0" stopColor={C.ink} />
      <stop offset="0.8" stopColor={C.ink} />
      <stop offset="1" stopColor={C.white} />
    </radialGradient>
    <radialGradient id="s1pool">
      <stop offset="0" stopColor={C.spot} stopOpacity={0.2} />
      <stop offset="0.75" stopColor={C.spot} stopOpacity={0.12} />
      <stop offset="0.92" stopColor={C.goldLight} stopOpacity={0.22} />
      <stop offset="1" stopColor={C.goldLight} stopOpacity={0} />
    </radialGradient>
    <mask id="s1darkMask" maskUnits="userSpaceOnUse" x={-600} y={-600} width={3200} height={2400}>
      <rect x={-600} y={-600} width={3200} height={2400} fill={C.white} />
      <ellipse cx={sp.x} cy={sp.y} rx={sp.rx} ry={sp.ry} fill="url(#s1hole)" opacity={clamp(sp.on)} />
    </mask>
  </defs>
);

const S1: React.FC<{ frame: number }> = ({ frame }) => {
  const sp = spot(frame);
  const open = whipOpen(frame);
  const prevOpen = whipOpen(frame - 1.5);
  const pinch = whipPinch(frame);
  // darkness outside the pool: house lights dim before the spot; the whip floods the stage with light
  const baseDark = frame < SPOT_ON ? 0.8 : 0.62;
  const reveal = clamp((frame - (WHIP_START + 2)) / 6);
  const dark = baseDark * (1 - reveal * 0.85);
  const cam = camera(frame);
  const toScreen = (x: number, y: number) => {
    const z = 1 + (cam.zoom - 1) * AUD_DEPTH;
    return { x: 960 + z * (x + cam.sx * AUD_DEPTH - 960), y: cam.cy + z * (y + cam.sy * AUD_DEPTH - cam.cy) };
  };
  const exposure = flashExposure(frame) + (frame >= WHIP_START + 2 && frame < WHIP_START + 5 ? 0.3 : 0);
  const streak = track(frame, [[WHIP_START + 5, 0], [WHIP_START + 12, 1, ease.in]]);
  const audienceRim = frame < SPOT_ON ? 0.2 : 0.55 + 0.45 * flashExposure(frame) * 2;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <BoilDefs frame={frame} />
        <Defs sp={sp} />
        <rect width={W} height={H} fill={C.ink} />
        {/* what the whip reveals: the backstage atelier racing past (continuous with S2's whip-in camera) */}
        {open > 0 && <BackstageBack frame={frame} camX={S2_WHIP_CAMX(frame)} chaos={0.6} />}
        {open > 0 && <rect width={W} height={H} fill={C.spot} opacity={clamp(0.55 - (frame - WHIP_START - 3) * 0.08)} />}
        <g transform={camT(frame)}>
          <g filter="url(#boil)">
            <CurtainHalf side="L" frame={frame} open={open} pinch={pinch} prevOpen={prevOpen} />
            <CurtainHalf side="R" frame={frame} open={open} pinch={pinch} prevOpen={prevOpen} />
            <CurtainSmear side="L" frame={frame} open={open} prevOpen={prevOpen} />
            <CurtainSmear side="R" frame={frame} open={open} prevOpen={prevOpen} />
            {/* centre seam shadow */}
            {open < 0.02 && <path d={`M960 60 L960 975`} stroke={C.ink} strokeWidth={10} opacity={0.55} />}
          </g>
          <g filter="url(#boil)">
            <Title frame={frame} />
          </g>
          <g filter="url(#boil)">
            <Proscenium frame={frame} glow={frame < SPOT_ON ? 0.25 : 0.8} />
            <Valance frame={frame} />
          </g>
          {/* lighting */}
          <rect x={-600} y={-600} width={3200} height={2400} fill={C.ink} opacity={dark} mask="url(#s1darkMask)" />
          {sp.on > 0 && reveal < 1 && (
            <ellipse cx={sp.x} cy={sp.y} rx={sp.rx * 1.02} ry={sp.ry * 1.02} fill="url(#s1pool)" opacity={clamp(sp.on) * (1 - reveal)} style={{ mixBlendMode: 'screen' }} />
          )}
        </g>
        <g transform={camT(frame, AUD_DEPTH)}>
          <Audience frame={frame} rim={audienceRim} />
        </g>
        <FlashBursts frame={frame} toScreen={toScreen} />
        {exposure > 0 && <rect width={W} height={H} fill={C.spot} opacity={exposure} style={{ mixBlendMode: 'screen' }} />}
        <WhipStreaks frame={frame} amount={streak} speed={-150} />
      </svg>
    </AbsoluteFill>
  );
};

export default S1;
