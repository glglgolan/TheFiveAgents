import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { DUR_FRAMES, FPS, W, H } from './lib/time';

export const Root: React.FC = () => (
  <Composition id="Film" component={Film} durationInFrames={DUR_FRAMES} fps={FPS} width={W} height={H} />
);
