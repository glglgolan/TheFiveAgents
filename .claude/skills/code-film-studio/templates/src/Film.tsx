// TEMPLATE — the orchestrator fills SHOTS with real shot components as shot animators finish.
// Do not hand-wave this file: it must end up matching the real shot list in data/timeline.json.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import timeline from './data/timeline.json';
import audioStatus from './data/audio_status.json';
import { FilmFinish } from './lib/fx';
import { C } from './lib/style';
// import { Subtitles } from './Subtitles'; // add once dialogue_timing.json + a subtitles.json exist

const SHOTS: Record<string, React.FC<{ frame: number }>> = {
  // S1: S1Component, S2: S2Component, ...
};

/** Passes the ABSOLUTE film frame to a shot. */
export const ShotAt: React.FC<{ id: string; from: number }> = ({ id, from }) => {
  const f = useCurrentFrame() + from;
  const Comp = SHOTS[id];
  if (!Comp) return null; // stub-safe until the shot exists
  return <Comp frame={f} />;
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {timeline.shots.map((s: { id: string; from: number; to: number }) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} name={s.id}>
          <ShotAt id={s.id} from={s.from} />
        </Sequence>
      ))}
      <FilmFinish frame={frame} />
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
