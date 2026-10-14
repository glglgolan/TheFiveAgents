import React from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { FPS, PULLS, TEAR, stepFrame, tq } from './lib/time';
import { Tear } from './lib/tear';
import { Hook, Storyboard, Images, Video, Sound, Finale } from './scenes';

const fontHandle = typeof document !== 'undefined' ? delayRender('Heebo') : 0;
if (typeof document !== 'undefined') {
  new FontFace('Heebo', `url(${staticFile('font/Heebo.ttf')})`, { weight: '100 900' }).load()
    .then((f) => { (document.fonts as any).add(f); continueRender(fontHandle); })
    .catch(() => continueRender(fontHandle));
}

const SCENES = [Hook, Storyboard, Images, Video, Sound, Finale];

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const t = tq(frame);                      // the paper world moves at 12fps
  const tt = frame / FPS;
  let body: React.ReactNode;
  const tearIdx = PULLS.findIndex((p) => tt >= p && tt < p + TEAR);
  if (tearIdx >= 0) {
    const A = SCENES[tearIdx], B = SCENES[tearIdx + 1];
    body = <Tear p={(t - PULLS[tearIdx]) / TEAR} seed={tearIdx + 1} step={stepFrame(frame)} top={<A t={t} />} bottom={<B t={t} />} />;
  } else {
    const i = PULLS.filter((p) => tt >= p + TEAR).length;
    const S = SCENES[i];
    body = <S t={t} />;
  }
  return (
    <AbsoluteFill style={{ background: '#1d1814' }}>
      <Audio src={staticFile('audio/full_mix.wav')} />
      {body}
    </AbsoluteFill>
  );
};
