// Composition: background → text_back → product_matte → text_front. One data file (text_layers.json).
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { resolveLayer } from './lib/anim';
import type { TypoProps } from './lib/types';
import { FontGate } from './components/Fonts';
import { Matte, Plate } from './components/Plate';
import { CssPass } from './components/CssText';
import { ThreePass } from './components/Text3D';
import { DrawPass } from './components/Draw';
import { GrainDefs, grainStyle } from './components/Grain';

export const Typo: React.FC<TypoProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width: w, height: h } = useVideoConfig();
  const time = frame / fps;
  const layers = useMemo(() => props.layers.map(resolveLayer), [props.layers]);
  const persp = props.perspective ?? 1400;
  const hasMatte = !!props.matte && (props.matteCount ?? 0) > 0;
  const grain = !!props.grain && props.grain.amount > 0;
  return (
    <AbsoluteFill style={{ background: props.background || '#EFE6DA' }}>
      <Plate src={props.plate} />
      {grain && <GrainDefs amount={props.grain!.amount} size={props.grain!.size} />}
      <FontGate layers={layers}>
        <AbsoluteFill style={grainStyle(grain)}>
          <CssPass layers={layers} plane="back" time={time} w={w} h={h} perspective={persp} />
          <ThreePass layers={layers} plane="back" time={time} w={w} h={h} />
          <DrawPass layers={layers} plane="back" time={time} w={w} h={h} />
        </AbsoluteFill>
        {hasMatte && <Matte dir={props.matte!} count={props.matteCount!} />}
        <AbsoluteFill style={grainStyle(grain)}>
          <CssPass layers={layers} plane="front" time={time} w={w} h={h} perspective={persp} />
          <ThreePass layers={layers} plane="front" time={time} w={w} h={h} />
          <DrawPass layers={layers} plane="front" time={time} w={w} h={h} />
        </AbsoluteFill>
      </FontGate>
    </AbsoluteFill>
  );
};
