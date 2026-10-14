import React from 'react';
import { C, S, ink } from '../../lib/style';
import { lerp, clamp } from '../../lib/motion';
import { LEG, blobPath, EXPR } from './geom';

type Expr = (typeof EXPR)[string];

// ---------------- shared defs (static geometry; duplicate ids across instances are identical & harmless) ----------------
export const GiraffeDefs: React.FC = () => (
  <defs>
    <clipPath id="gir-eyeP"><path d={EYE_P} /></clipPath>
    <clipPath id="gir-eyeF"><path d={EYE_F} /></clipPath>
    <clipPath id="gir-headP"><path d={HEAD_P} /></clipPath>
    <clipPath id="gir-headF"><path d={HEAD_F} /></clipPath>
    <clipPath id="gir-bag"><rect x={-19} y={34} width={38} height={30} rx={7} /></clipPath>
    <linearGradient id="gir-lens" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stopColor={C.teal} />
      <stop offset="0.55" stopColor={C.ink} />
      <stop offset="1" stopColor={C.ink} />
    </linearGradient>
    <linearGradient id="gir-rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={C.white} stopOpacity="0" />
      <stop offset="0.7" stopColor={C.white} stopOpacity="0" />
      <stop offset="1" stopColor={C.white} stopOpacity="0.45" />
    </linearGradient>
  </defs>
);

// ---------------- LEGS ----------------
const UPPER = `M-21,-60 C-24,40 -15,140 -12,196 A12,12 0 0 0 12,196 C15,140 24,40 21,-60 Z`;
const LOWER = `M-10,-4 C-9,70 -8,150 -7,212 L7,212 C8,150 9,70 10,-4 A10,10 0 0 0 -10,-4 Z`;
const HOOF = `M-9,-2 L8,-2 L15,22 Q16,28 10,28 L-2,28 Q-8,26 -9,18 Z`;
const HEEL = `M-9,14 L-8,28 L-4.5,28 L-3,17 Z`;
const SOLE = `M-4,17 Q4,20 13,28 L9,28 Q2,24 -4,21 Z`;

export const Leg: React.FC<{
  x: number; y: number; hip: number; knee: number; ankle: number; far?: boolean; shadow?: boolean; seed: string;
}> = ({ x, y, hip, knee, ankle, far, shadow, seed }) => {
  const fillSkin = shadow ? C.ink : C.giraffe;
  const st = shadow ? {} : ink(S.inkThin + 1);
  const spots = shadow ? '' : [
    blobPath({ cx: -3, cy: 10, r: 11, ar: 0.9, seed: `${seed}u1` }),
    blobPath({ cx: 5, cy: 58, r: 10, ar: 0.8, seed: `${seed}u2` }),
    blobPath({ cx: -4, cy: 108, r: 8.5, ar: 0.8, seed: `${seed}u3` }),
    blobPath({ cx: 3, cy: 150, r: 6.5, ar: 0.8, seed: `${seed}u4` }),
  ].join('');
  return (
    <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${hip.toFixed(2)})`}>
      <path d={UPPER} fill={fillSkin} {...st} />
      {!shadow && <path d={spots} fill={C.giraffeSpot} />}
      {far && !shadow && <path d={UPPER} fill="url(#halftone)" />}
      <g transform={`translate(0,${LEG.upper}) rotate(${knee.toFixed(2)})`}>
        <path d={LOWER} fill={fillSkin} {...st} />
        {far && !shadow && <path d={LOWER} fill="url(#halftone)" />}
        <g transform={`translate(0,${LEG.lower}) rotate(${ankle.toFixed(2)})`}>
          <path d={HOOF} fill={shadow ? C.ink : C.ink} {...(shadow ? {} : ink(S.inkThin))} />
          {!shadow && <>
            <path d={`${HEEL} ${SOLE}`} fill={far ? C.gold : C.gold} {...ink(2)} />
            <rect x={-10} y={-1} width={20} height={5} rx={2.5} fill={C.gold} {...ink(2)} />
          </>}
        </g>
      </g>
    </g>
  );
};

// ---------------- HANDBAG (pendulum; hangs from pivot, gravity-corrected by caller) ----------------
export const Handbag: React.FC<{ angle: number }> = ({ angle }) => (
  <g transform={`rotate(${angle.toFixed(2)})`}>
    <path d="M0,0 L-13,36 M0,0 L13,36" stroke={C.gold} strokeWidth={3} strokeLinecap="round" fill="none" />
    <circle cx={0} cy={0} r={3.5} fill={C.gold} {...ink(1.5)} />
    <rect x={-19} y={34} width={38} height={30} rx={7} fill={C.pearl} />
    <g clipPath="url(#gir-bag)">
      <path d="M-30,30 L10,70 M-18,30 L22,70 M-6,30 L34,70 M6,30 L46,70 M-42,30 L-2,70 M30,30 L-10,70 M18,30 L-22,70 M6,30 L-34,70 M-6,30 L-46,70 M42,30 L2,70"
        stroke={C.pearlShade} strokeWidth={2} />
      <rect x={-19} y={52} width={38} height={14} fill="url(#halftoneFine)" />
    </g>
    <rect x={-19} y={34} width={38} height={30} rx={7} fill="none" {...ink(S.inkThin)} />
    <path d="M-19,42 Q0,48 19,42" fill="none" {...ink(2)} />
    <circle cx={0} cy={45} r={4} fill={C.gold} {...ink(1.5)} />
  </g>
);

// ---------------- PROFILE HEAD (snout toward +x, pivot = neck top) ----------------
export const HEAD_P = `M-24,-6 C-28,-32 -8,-48 14,-48 C34,-48 50,-42 64,-32 C86,-20 110,-16 126,-12 C141,-8 143,14 130,23 C114,31 88,31 62,31 C32,31 6,31 -12,20 C-20,14 -24,6 -24,-6 Z`;
const EYE_P = `M31,-17 Q46,-35 64,-20 Q48,-6 31,-17 Z`;
export const EYE_P_CENTER = { x: 47, y: -19 };
export const NOSE_P = { x: 104, y: -16 };
export const OSSI_P_TIP = { x: -2, y: -92 };

const Brow: React.FC<{ d: string }> = ({ d }) => <path d={d} fill="none" {...ink(S.inkThin + 1)} />;

export const HeadProfile: React.FC<{ ex: Expr; lid: number; look: { x: number; y: number }; slide: number; seed: string; sadRot: number }> = ({ ex, lid, look, slide, seed, sadRot }) => {
  const lidY = lerp(-33, -8, clamp(lid));
  const pdx = ex.pdx + look.x, pdy = ex.pdy + look.y;
  const spots = [
    blobPath({ cx: 8, cy: -24, r: 9, seed: `${seed}h1` }),
    blobPath({ cx: -8, cy: 4, r: 8, seed: `${seed}h2` }),
    blobPath({ cx: 20, cy: 14, r: 7, seed: `${seed}h3` }),
    blobPath({ cx: 72, cy: -20, r: 5, seed: `${seed}h4` }),
  ].join('');
  // glasses travel from eye to snout tip
  const gx = lerp(EYE_P_CENTER.x, NOSE_P.x, slide), gy = lerp(EYE_P_CENTER.y + 5, NOSE_P.y + 4, slide);
  const gr = slide * 10;
  const b = ex.brow, bt = ex.browTilt;
  const mouth = ex.mouth === 'smug' ? 'M134,14 Q116,19 98,15 Q94,13 93,9'
    : ex.mouth === 'o' ? '' : 'M134,15 Q126,11 118,16 Q110,21 102,15';
  return (
    <g>
      {/* far ossicone + far ear */}
      <path d="M22,-42 L18,-86" stroke={C.giraffeSpot} strokeWidth={11} strokeLinecap="round" />
      <circle cx={17} cy={-88} r={8} fill={C.ink} />
      <g transform={`rotate(${ex.ears + sadRot}, -4, -26)`}>
        <path d="M-2,-24 C-30,-52 -64,-50 -74,-40 C-60,-26 -30,-14 -2,-18 Z" fill={C.giraffe} {...ink(S.inkThin + 1)} />
        <path d="M-10,-26 C-30,-40 -52,-40 -62,-38" fill="none" stroke={C.giraffeSpot} strokeWidth={3} strokeLinecap="round" />
      </g>
      {/* near ossicone */}
      <path d="M-6,-40 C-8,-60 -6,-78 -3,-86 L6,-86 C6,-72 8,-56 12,-40 Z" fill={C.giraffe} {...ink(S.inkThin + 1)} />
      <circle cx={1.5} cy={-90} r={9} fill={C.ink} />
      {/* skull */}
      <path d={HEAD_P} fill={C.giraffe} {...ink(S.ink)} />
      <g clipPath="url(#gir-headP)">
        <path d={spots} fill={C.giraffeSpot} />
        <path d="M-30,18 C20,40 90,40 150,22 L150,60 L-30,60 Z" fill="url(#halftone)" />
        <path d="M110,-40 L160,-40 L160,40 L128,40 Z" fill="url(#gir-rim)" />
      </g>
      <path d="M12,-46 C34,-46 50,-40 64,-30 C86,-18 108,-14 124,-10" fill="none" stroke={C.white} strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
      {/* nostril + mouth */}
      <path d="M118,-6 Q126,-9 128,-2" fill="none" {...ink(S.inkThin)} />
      {mouth && <path d={mouth} fill="none" {...ink(S.inkThin)} />}
      {ex.mouth === 'o' && <ellipse cx={118} cy={20} rx={7} ry={8} fill={C.ink} />}
      {/* eye */}
      <path d={EYE_P} fill={C.white} />
      <g clipPath="url(#gir-eyeP)">
        <circle cx={EYE_P_CENTER.x + 3 + pdx} cy={EYE_P_CENTER.y + pdy} r={ex.pupR + 2} fill={C.ink} />
        <circle cx={EYE_P_CENTER.x + 1 + pdx} cy={EYE_P_CENTER.y - 2 + pdy} r={1.8} fill={C.white} />
        <rect x={20} y={-44} width={60} height={lidY + 44} fill={C.giraffe} />
        <path d={`M24,${lidY + 2} Q46,${lidY - 2} 70,${lidY + 1}`} fill="none" {...ink(S.ink)} />
      </g>
      <path d={EYE_P} fill="none" {...ink(S.inkThin)} />
      {/* glasses */}
      <g transform={`translate(${gx.toFixed(1)},${gy.toFixed(1)}) rotate(${gr.toFixed(1)})`}>
        <path d="M-26,-10 L-66,-14" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
        <path d="M-32,-17 C-20,-15 0,-15 16,-10 C23,-7 21,6 12,10 C0,14 -14,12 -20,4 C-24,-1 -26,-9 -32,-17 Z" fill="url(#gir-lens)" fillOpacity={0.9} {...ink(S.ink)} />
        <path d="M-8,-10 L-16,6 M2,-10 L-5,6" stroke={C.white} strokeOpacity={0.65} strokeWidth={3} strokeLinecap="round" />
        <circle cx={-28} cy={-14} r={2.6} fill={C.gold} />
        <circle cx={-22} cy={-13} r={2} fill={C.goldLight} />
      </g>
      {/* lashes over the lens: long, dramatic */}
      <path d={`M34,${lidY} Q28,${lidY - 10} 18,${lidY - 12} M42,${lidY - 1.5} Q38,${lidY - 14} 29,${lidY - 19} M51,${lidY - 1.5} Q50,${lidY - 14} 43,${lidY - 21}`} fill="none" {...ink(S.inkThin)} />
      <Brow d={`M30,${-40 + b} Q46,${-50 + b - bt} 64,${-40 + b + bt * 0.3}`} />
      {ex.sweat && <path d="M-4,-40 Q-10,-28 -4,-24 Q2,-28 -4,-40 Z" fill={C.white} {...ink(2)} />}
    </g>
  );
};

// ---------------- FRONT HEAD (facing audience, pivot = neck top) ----------------
export const HEAD_F = `M0,-82 C30,-82 50,-64 48,-38 C46,-12 33,18 31,44 C31,66 18,76 0,76 C-18,76 -31,66 -31,44 C-33,18 -46,-12 -48,-38 C-50,-64 -30,-82 0,-82 Z`;
const EYE_F = `M-15,0 Q0,-17 15,1 Q0,12 -15,0 Z`; // eye-local, outer corner at +x
export const OSSI_F_TIP = { x: 24, y: -118 };

export const HeadFront: React.FC<{ ex: Expr; lid: number; look: { x: number; y: number }; slide: number; seed: string; sadRot: number }> = ({ ex, lid, look, slide, seed, sadRot }) => {
  const lidY = lerp(-15, 8, clamp(lid));
  const pdx = look.x * 0.6, pdy = ex.pdy + look.y;
  const spots = [
    blobPath({ cx: 0, cy: -66, r: 10, ar: 1.4, seed: `${seed}f1` }),
    blobPath({ cx: -34, cy: -6, r: 8, seed: `${seed}f2` }),
    blobPath({ cx: 34, cy: -4, r: 8, seed: `${seed}f3` }),
    blobPath({ cx: -16, cy: 12, r: 6, seed: `${seed}f4` }),
    blobPath({ cx: 18, cy: 16, r: 6, seed: `${seed}f5` }),
  ].join('');
  const gy = lerp(-38, 18, slide), grot = slide * 7;
  const b = ex.brow, bt = ex.browTilt;
  const Eye = ({ side }: { side: 1 | -1 }) => (
    <g transform={`translate(${side * 24},-38) scale(${side},1)`}>
      <path d={EYE_F} fill={C.white} />
      <g clipPath="url(#gir-eyeF)">
        <circle cx={-2 + pdx * side + (side < 0 ? 0 : 0)} cy={pdy * 0.7} r={ex.pupR + 1.5} fill={C.ink} />
        <circle cx={-4 + pdx * side} cy={-2 + pdy * 0.7} r={1.6} fill={C.white} />
        <rect x={-20} y={-24} width={40} height={lidY + 24} fill={C.giraffe} />
        <path d={`M-18,${lidY + 1} Q0,${lidY - 3} 18,${lidY + 1}`} fill="none" {...ink(S.ink)} />
      </g>
      <path d={EYE_F} fill="none" {...ink(S.inkThin)} />
    </g>
  );
  const Lash = ({ side }: { side: 1 | -1 }) => (
    <g transform={`translate(${side * 24},-38) scale(${side},1)`}>
      <path d={`M6,${lidY - 1} Q12,${lidY - 12} 20,${lidY - 16} M12,${lidY} Q20,${lidY - 8} 27,${lidY - 9} M-1,${lidY - 2} Q2,${lidY - 14} 8,${lidY - 20}`} fill="none" {...ink(S.inkThin)} />
      <path d={`M-14,${-22 + b + bt} Q0,${-30 + b} 16,${-22 + b - bt * 0.4}`} fill="none" {...ink(S.inkThin + 1)} />
    </g>
  );
  const Lens = ({ side }: { side: 1 | -1 }) => (
    <g transform={`translate(${side * 25},0) scale(${side},1)`}>
      <path d="M-15,-9 C-6,-14 14,-16 27,-20 C26,-6 20,10 6,12 C-6,13 -16,6 -15,-9 Z" fill="url(#gir-lens)" fillOpacity={0.9} {...ink(S.ink)} />
      <path d="M-4,-8 L-9,6 M5,-10 L0,6" stroke={C.white} strokeOpacity={0.6} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={24} cy={-17} r={2.6} fill={C.gold} />
    </g>
  );
  const mouth = ex.mouth === 'smug' ? 'M-14,64 Q0,69 13,63 Q16,61 17,58' : ex.mouth === 'wavy' ? 'M-15,65 Q-8,60 -2,65 Q5,70 13,64' : '';
  return (
    <g>
      {/* ears */}
      {[1, -1].map((s) => (
        <g key={s} transform={`scale(${s},1) rotate(${ex.ears * 0.8 + sadRot}, 40, -52)`}>
          <path d="M38,-50 C60,-72 90,-74 100,-66 C90,-50 64,-40 40,-40 Z" fill={C.giraffe} {...ink(S.inkThin + 1)} />
          <path d="M46,-50 C62,-62 80,-64 90,-64" fill="none" stroke={C.giraffeSpot} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
      {/* ossicones */}
      {[1, -1].map((s) => (
        <g key={s} transform={`scale(${s},1)`}>
          <path d="M10,-76 C12,-92 16,-104 19,-112 L28,-110 C26,-98 26,-86 26,-72 Z" fill={C.giraffe} {...ink(S.inkThin + 1)} />
          <circle cx={24} cy={-116} r={9} fill={C.ink} />
        </g>
      ))}
      <path d={HEAD_F} fill={C.giraffe} {...ink(S.ink)} />
      <g clipPath="url(#gir-headF)">
        <path d={spots} fill={C.giraffeSpot} />
        <path d="M-60,30 C-30,48 30,48 60,30 L60,90 L-60,90 Z" fill="url(#halftone)" />
        <path d="M18,-90 L60,-90 L60,80 L26,80 C34,30 44,-20 18,-90 Z" fill="url(#gir-rim)" />
      </g>
      {/* muzzle */}
      <path d="M-22,40 Q0,32 22,40" fill="none" stroke={C.giraffeSpot} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      <path d="M-15,50 Q-10,44 -7,52 M15,50 Q10,44 7,52" fill="none" {...ink(S.inkThin)} />
      {mouth && <path d={mouth} fill="none" {...ink(S.inkThin)} />}
      {ex.mouth === 'o' && <ellipse cx={0} cy={65} rx={8} ry={9} fill={C.ink} />}
      <Eye side={1} /><Eye side={-1} />
      <g transform={`translate(0,${gy.toFixed(1)}) rotate(${grot.toFixed(1)})`}>
        <path d="M-10,-6 Q0,-12 10,-6" fill="none" {...ink(S.inkThin + 1)} />
        <Lens side={1} /><Lens side={-1} />
      </g>
      <Lash side={1} /><Lash side={-1} />
      {ex.sweat && <path d="M44,-46 Q38,-32 44,-28 Q50,-32 44,-46 Z" fill={C.white} {...ink(2)} />}
    </g>
  );
};
