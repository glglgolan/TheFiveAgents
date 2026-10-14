// TEMPLATE — subtle burned-in captions, timed from dialogue_timing.json (written by the voice agent).
// Copy to src/Subtitles.tsx, fill data/subtitles.json {lineId: "translated text"}, wire into Film.tsx.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import timing from './data/dialogue_timing.json';
import subs from './data/subtitles.json';
import { C, F } from './lib/style';
import { clamp } from './lib/motion';

const TEXT = subs as Record<string, string>;
const HOLD = 14;
const FADE = 4;

export const Subtitles: React.FC<{ frame: number }> = ({ frame }) => {
  const lines = (timing as { id: string; start: number; end: number }[]).filter((l) => TEXT[l.id]);
  const idx = lines.findIndex((l, i) => {
    const next = lines[i + 1];
    const end = Math.min(l.end + HOLD, next ? next.start - 3 : Infinity);
    return frame >= l.start - 2 && frame <= end;
  });
  if (idx < 0) return null;
  const l = lines[idx];
  const next = lines[idx + 1];
  const end = Math.min(l.end + HOLD, next ? next.start - 3 : Infinity);
  const opacity = clamp((frame - (l.start - 2)) / FADE) * clamp((end - frame) / FADE);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 64, pointerEvents: 'none' }}>
      <div style={{
        opacity: opacity * 0.92,
        fontFamily: F.sans, fontSize: 38, letterSpacing: 0.6, fontWeight: 500,
        color: C.paper, textAlign: 'center', maxWidth: 1400, lineHeight: 1.25,
        textShadow: `0 0 10px ${C.ink}, 0 2px 3px ${C.ink}, 0 0 2px ${C.ink}`,
      }}>{TEXT[l.id]}</div>
    </AbsoluteFill>
  );
};
