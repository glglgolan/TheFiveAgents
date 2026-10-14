// TEMPLATE — register Film + per-shot previews + per-character/set model-sheet compositions.
// Import each character/set Sheet as riggers/painters finish, and add it to `sheets` below.
import React from 'react';
import { Composition } from 'remotion';
import timeline from './data/timeline.json';
import { Film, ShotPreview } from './Film';
import { W, H, FPS } from './lib/style';
// import { Sheet as BulldogSheet } from './characters/Bulldog';
// import { Sheet as BackstageSheet } from './sets/Backstage';

const sheets: [string, React.FC][] = [
  // ['Sheet-<character>', <Character>Sheet],
  // ['Set-<setname>', <Set>Sheet],
];

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={timeline.totalFrames} fps={FPS} width={W} height={H} />
    {timeline.shots.map((s: { id: string; from: number; to: number }) => (
      <Composition key={s.id} id={`Shot-${s.id}`} component={ShotPreview} defaultProps={{ id: s.id, from: s.from }}
        durationInFrames={s.to - s.from} fps={FPS} width={W} height={H} />
    ))}
    {sheets.map(([id, C]) => (
      <Composition key={id} id={id} component={C} durationInFrames={96} fps={FPS} width={W} height={H} />
    ))}
  </>
);
