// Film grain applied ONLY to the typography/drawing passes so clean vector letters sit inside grainy live-action
// footage (hyperreal look). Seeded per frame → deterministic renders.
import React from 'react';
import { useCurrentFrame } from 'remotion';

export const GrainDefs: React.FC<{ amount: number; size?: number }> = ({ amount, size }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }}>
      <filter id="ktGrain" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={size ?? 0.9} numOctaves={2} seed={frame} result="noise" />
        <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
        <feComposite in="SourceGraphic" in2="mono" operator="arithmetic" k1={0} k2={1} k3={amount} k4={-amount / 2} result="grainy" />
        <feComposite in="grainy" in2="SourceAlpha" operator="in" />
      </filter>
    </svg>
  );
};

export const grainStyle = (on: boolean): React.CSSProperties => (on ? { filter: 'url(#ktGrain)' } : {});
