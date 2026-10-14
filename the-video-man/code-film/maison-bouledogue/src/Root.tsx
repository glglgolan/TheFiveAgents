import React from 'react';
import { Composition } from 'remotion';
import timeline from './data/timeline.json';
import { Film, ShotPreview } from './Film';
import { W, H, FPS } from './lib/style';
import { Sheet as BulldogSheet } from './characters/Bulldog';
import { Sheet as MouseSheet } from './characters/Mouse';
import { Sheet as FlamingoSheet } from './characters/Flamingo';
import { Sheet as GiraffeSheet } from './characters/Giraffe';
import { Sheet as PenguinSheet } from './characters/Penguin';
import { Sheet as BackstageSheet } from './sets/Backstage';
import { Sheet as RunwaySheet } from './sets/Runway';

const sheets: [string, React.FC][] = [
  ['Sheet-bulldog', BulldogSheet], ['Sheet-mouse', MouseSheet], ['Sheet-flamingo', FlamingoSheet],
  ['Sheet-giraffe', GiraffeSheet], ['Sheet-penguin', PenguinSheet],
  ['Set-backstage', BackstageSheet], ['Set-runway', RunwaySheet],
];

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={timeline.totalFrames} fps={FPS} width={W} height={H} />
    {timeline.shots.map((s) => (
      <Composition key={s.id} id={`Shot-${s.id}`} component={ShotPreview} defaultProps={{ id: s.id, from: s.from }}
        durationInFrames={s.to - s.from} fps={FPS} width={W} height={H} />
    ))}
    {sheets.map(([id, C]) => (
      <Composition key={id} id={id} component={C} durationInFrames={96} fps={FPS} width={W} height={H} />
    ))}
  </>
);
