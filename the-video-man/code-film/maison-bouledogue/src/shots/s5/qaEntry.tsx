// QA-only entry (S5/S6 animator): registers Shot-S5 / Shot-S6 without importing other shots,
// so these shots can be previewed while other agents' files are mid-edit.
// npx remotion still src/shots/s5/qaEntry.tsx Shot-S5 out.png --frame=<rel> --gl=swangle
import React from 'react';
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from 'remotion';
import { FilmFinish } from '../../lib/fx';
import { C, FPS, H, W } from '../../lib/style';
import S5 from '../S5';
import S6 from '../S6';

const mk = (Comp: React.FC<{ frame: number }>, from: number): React.FC => () => {
  const frame = useCurrentFrame() + from;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <Comp frame={frame} />
      <FilmFinish frame={frame} />
    </AbsoluteFill>
  );
};
const P5 = mk(S5, 936), P6 = mk(S6, 1224);

const Root: React.FC = () => (
  <>
    <Composition id="Shot-S5" component={P5} durationInFrames={288} fps={FPS} width={W} height={H} />
    <Composition id="Shot-S6" component={P6} durationInFrames={216} fps={FPS} width={W} height={H} />
  </>
);
registerRoot(Root);
