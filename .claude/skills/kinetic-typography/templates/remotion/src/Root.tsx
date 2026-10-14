import React from 'react';
import { Composition } from 'remotion';
import { Typo } from './Typo';
import { ScrollStory } from './ScrollStory';
import type { ScrollProps } from './ScrollStory';
import type { TypoProps } from './lib/types';
import sample from './sample.json';

export const Root: React.FC = () => (
  <>
  <Composition
    id="Typo"
    component={Typo as unknown as React.FC<Record<string, unknown>>}
    defaultProps={sample as unknown as Record<string, unknown>}
    durationInFrames={360}
    fps={24}
    width={1080}
    height={1920}
    calculateMetadata={({ props }) => {
      const p = props as unknown as TypoProps;
      return { durationInFrames: Math.max(1, Math.round(p.duration_sec * p.fps)), fps: p.fps, width: p.width, height: p.height };
    }}
  />
  <Composition
    id="ScrollStory"
    component={ScrollStory as unknown as React.FC<Record<string, unknown>>}
    defaultProps={{ fps: 24, duration_sec: 2, width: 1600, height: 1000, sections: [{ id: 'a', height: 1000 }], scroll: [{ t: 0, y: 0 }] } as unknown as Record<string, unknown>}
    durationInFrames={48}
    fps={24}
    width={1600}
    height={1000}
    calculateMetadata={({ props }) => {
      const p = props as unknown as ScrollProps;
      return { durationInFrames: Math.max(1, Math.round(p.duration_sec * p.fps)), fps: p.fps, width: p.width, height: p.height };
    }}
  />
  </>
);
