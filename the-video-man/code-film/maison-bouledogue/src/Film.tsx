import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import timeline from './data/timeline.json';
import audioStatus from './data/audio_status.json';
import { FilmFinish } from './lib/fx';
import { C } from './lib/style';
import { Subtitles } from './Subtitles';
import S1 from './shots/S1';
import S2 from './shots/S2';
import S3 from './shots/S3';
import S4 from './shots/S4';
import S5 from './shots/S5';
import S6 from './shots/S6';

const SHOTS: Record<string, React.FC<{ frame: number }>> = { S1, S2, S3, S4, S5, S6 };

/** Passes the ABSOLUTE film frame to a shot. */
export const ShotAt: React.FC<{ id: string; from: number }> = ({ id, from }) => {
  const f = useCurrentFrame() + from;
  const Comp = SHOTS[id];
  return <Comp frame={f} />;
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {timeline.shots.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} name={s.id}>
          <ShotAt id={s.id} from={s.from} />
        </Sequence>
      ))}
      <FilmFinish frame={frame} />
      <Subtitles frame={frame} />
      {audioStatus.mixReady ? <Audio src={staticFile('audio/mix.wav')} /> : null}
    </AbsoluteFill>
  );
};

/** Single shot preview (frame numbers still absolute). */
export const ShotPreview: React.FC<{ id: string; from: number }> = ({ id, from }) => {
  const frame = useCurrentFrame() + from;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <ShotAt id={id} from={from} />
      <FilmFinish frame={frame} />
    </AbsoluteFill>
  );
};
