import React from 'react';
import { W, H, rand, seg, easeInOut, easeIn, easeOutBack } from './time';

const BASE = 1000;

/** the signature transition: the thread pulls taut, the sheet tears along it, warm light leaks
 *  through the crack, the halves fly off and the next sheet lands. p = 0..1 over TEAR seconds. */
export const Tear: React.FC<{ p: number; seed: number; step: number; top: React.ReactNode; bottom: React.ReactNode }> = ({ p, seed, step, top, bottom }) => {
  const pull = seg(p, 0, 0.3), crack = seg(p, 0.3, 0.42), split = seg(p, 0.42, 0.95), land = seg(p, 0.42, 1.0);

  // jagged tear line (fixed per transition) + per-step boil
  const edge: [number, number][] = [];
  for (let x = -40, i = 0; x <= W + 40; x += 14, i++) {
    const y = BASE + 70 * Math.sin(x / 240 + seed) + 25 * Math.sin(x / 90 + seed * 2) + (rand(seed, i) - 0.5) * 22 + (rand(seed, i, step) - 0.5) * 4;
    edge.push([x, y]);
  }
  const line = edge.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L');
  const rev = edge.slice().reverse().map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L');
  const clipTop = `path('M-80 -80 L${W + 80} -80 L${rev} Z')`;
  const clipBot = `path('M-80 ${H + 80} L${W + 80} ${H + 80} L${rev} Z')`;

  const jit = () => (rand(seed, step, 3) - 0.5) * 3;
  const s = easeInOut(split);
  const pucker = 6 * Math.sin(Math.PI * pull);
  const gap = 5 * crack;
  const topT = `translate(${-30 * s + jit()}px, ${-gap - pucker - s * 1150}px) rotate(${-6 * s}deg)`;
  const botT = `translate(${40 * s - jit()}px, ${gap + pucker + s * 1100}px) rotate(${5 * s}deg)`;

  const lightOn = Math.max(crack * 0.9 * (1 - s), split > 0 ? 1 - seg(p, 0.75, 1.0) : 0);
  const bloom = (0.25 * crack + 0.9 * s) * (1 - seg(p, 0.8, 1.0));
  const landE = easeOutBack(land);

  // thread: flattens and lifts while pulling, then flies up with the top half
  const amp = 1 - 0.85 * easeInOut(pull);
  const lift = 18 * Math.sin(Math.PI * pull) + easeIn(split) * 1150;
  const thr = edge.map(([x, y], i) => [x, BASE + amp * (y - BASE) - lift] as [number, number]).filter((_, i) => i % 2 === 0);
  const thrD = 'M' + thr.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L');

  const fiber = (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <defs><filter id={`fib${seed}`} x="-5%" y="-50%" width="110%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.25 0.9" numOctaves={2} seed={8} result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale={14} />
      </filter></defs>
      <path d={'M' + line} fill="none" stroke="#fbf6ec" strokeWidth={9} filter={`url(#fib${seed})`} opacity={crack > 0 ? 1 : 0} />
    </svg>
  );
  const half = (clip: string, tr: string) => (
    <div style={{ position: 'absolute', inset: 0, transform: tr, transformOrigin: `540px ${BASE}px`, filter: 'drop-shadow(0 12px 14px rgba(42,26,12,0.45))' }}>
      <div style={{ position: 'absolute', inset: 0, clipPath: clip }}>{top}</div>
      {fiber}
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#1d1814', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1.04 - 0.04 * landE}) translateY(${(1 - landE) * 20}px)`, transformOrigin: '540px 960px' }}>{bottom}</div>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', overflow: 'visible' }}>
        <defs>
          <radialGradient id={`lk${seed}`} cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#fff2c8" /><stop offset="0.35" stopColor="#ffb347" />
            <stop offset="0.75" stopColor="#e2621d" stopOpacity="0.55" /><stop offset="1" stopColor="#7a2a10" stopOpacity="0" />
          </radialGradient>
          <filter id={`gb${seed}`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={W + 600} height={H + 600}><feGaussianBlur stdDeviation={34} /></filter>
        </defs>
        <ellipse cx={540} cy={BASE} rx={600 + 300 * s} ry={120 + 900 * s} fill={`url(#lk${seed})`} opacity={bloom} />
        <path d={'M' + line} fill="none" stroke="#ffcf7a" strokeWidth={40 + 260 * s} filter={`url(#gb${seed})`} opacity={lightOn} />
        {Array.from({ length: 40 }).map((_, i) => {
          const dt = Math.max(0, (p - 0.32) * 1.0);
          const x0 = rand(seed, i, 1) * W, y0 = BASE + (rand(seed, i, 2) - 0.5) * 80;
          const o = dt > 0 ? Math.max(0, 0.9 - dt * 1.4) : 0;
          return <circle key={i} cx={x0 + (rand(seed, i, 3) - 0.5) * 60 * dt} cy={y0 - (60 + rand(seed, i, 4) * 180) * dt} r={2 + rand(seed, i, 5) * 5} fill="#ffe2a6" opacity={o} />;
        })}
      </svg>
      {half(clipTop, topT)}
      {half(clipBot, botT)}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: split > 0.55 ? 0 : 1 }}>
        <path d={thrD} fill="none" stroke="#c8281e" strokeWidth={11} strokeLinecap="round" style={{ filter: 'drop-shadow(2px 5px 2px rgba(58,13,8,0.5))' }} />
      </svg>
    </div>
  );
};
