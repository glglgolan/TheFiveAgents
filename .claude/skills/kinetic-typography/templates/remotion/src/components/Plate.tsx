import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';

const isVideo = (p: string) => /\.(mp4|mov|webm|m4v)$/i.test(p);
const pad = (n: number) => String(n).padStart(6, '0');
const cover: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };

/** The background plate: the assembled reel (final.mp4) or a still (keyframe) for tests. */
export const Plate: React.FC<{ src?: string | null }> = ({ src }) => {
  if (!src) return null;
  return (
    <AbsoluteFill>
      {isVideo(src) ? <OffthreadVideo src={staticFile(src)} style={cover} /> : <Img src={staticFile(src)} style={cover} />}
    </AbsoluteFill>
  );
};

/** The product cutout (RGBA frames from extract_matte) — re-drawn above text_back so letters pass behind it. */
export const Matte: React.FC<{ dir: string; count: number }> = ({ dir, count }) => {
  const frame = useCurrentFrame();
  const idx = Math.min(count, frame + 1);
  return (
    <AbsoluteFill>
      <Img src={staticFile(`${dir}/${pad(idx)}.png`)} style={cover} />
    </AbsoluteFill>
  );
};
