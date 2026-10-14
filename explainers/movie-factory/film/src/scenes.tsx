import React from 'react';
import { Img, Loop, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { beat, FPS, SEWS, TOTAL, W, clamp, easeOut, easeInOut, rand, seg, stepFrame } from './lib/time';
import { Card, CARD, drop, HEB, Header, INK, INK_SOFT, MONO, Photo, RED, Sheet, Tape, useBoil, Words } from './lib/paper';
import { smooth, Thread, Pt } from './lib/thread';
import waves from './data/waves.json';

type SP = { t: number };

/* ------------------------------------------------------------------ shared bits */

/** a video that starts playing at global time `at` (muted — the soundtrack is the mix) */
const Clip: React.FC<{ src: string; at: number; frames: number; rate?: number; poster?: string; fit?: 'cover' | 'contain' }> =
  ({ src, at, frames, rate = 1, poster, fit = 'cover' }) => {
    const style: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit };
    return (
      <>
        {poster && <Img src={staticFile(poster)} style={style} />}
        <Sequence from={Math.round(at * FPS)} layout="none">
          <Loop durationInFrames={Math.floor(frames / rate) - 1} layout="none">
            <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} style={style} />
          </Loop>
        </Sequence>
      </>
    );
  };

/** the stitched underline under each stage header (sew event of that stage) */
const HeaderThread: React.FC<{ t: number; stage: number; y?: number }> = ({ t, stage, y = 268 }) => {
  const s = SEWS.find((e) => e.stage === stage)!;
  const pts = smooth([[-40, y], [260, y + 14], [540, y - 8], [820, y + 12], [1120, y]], 10);
  return <Thread pts={pts} progress={stage === 0 ? 0 : easeInOut(seg(t, s.t, s.t + (s.dur ?? 1.5)))} />;
};

const Stamp: React.FC<{ x: number; y: number; t: number; t0: number; text: string; size?: number; seed: number }> = ({ x, y, t, t0, text, size = 230, seed }) => {
  const b = useBoil(seed, 1);
  if (t < t0) return null;
  const p = seg(t, t0, t0 + 0.17);
  return (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%',
      border: `${size * 0.06}px solid ${RED}`, color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: HEB, fontWeight: 900, fontSize: size * 0.34, direction: 'rtl', opacity: 0.88, mixBlendMode: 'multiply',
      transform: `translate(${b.dx}px, ${b.dy}px) rotate(${-14 + b.dr}deg) scale(${2.2 - 1.2 * p})`,
      boxShadow: `inset 0 0 0 ${size * 0.03}px rgba(200,40,30,0.35)`,
    }}>{text}</div>
  );
};

const shake = (t: number, t0: number, dur: number, amp: number, seed: number) => {
  if (t < t0 || t > t0 + dur) return 'none';
  const k = Math.round(t * 12), fall = 1 - seg(t, t0, t0 + dur);
  return `translate(${(rand(seed, k) - 0.5) * 2 * amp * fall}px, ${(rand(seed + 1, k) - 0.5) * 2 * amp * fall}px) rotate(${(rand(seed + 2, k) - 0.5) * 1.6 * fall}deg)`;
};

/* ------------------------------------------------------------------ 0 · hook */

export const Hook: React.FC<SP> = ({ t }) => {
  const [b0, b1, b2, b3] = [0, 1, 2, 3].map((i) => beat(0, i));
  const typed = 'make me a 15s surreal ad for MELT';
  const n = clamp(Math.floor((t - b2 - 0.35) * 26), 0, typed.length);
  const cursorOn = Math.floor(t * 3) % 2 === 0;
  return (
    <Sheet color="#efe6d6">
      <Thread pts={smooth([[-40, 320], [300, 338], [600, 310], [900, 332], [1120, 318]], 10)} progress={easeInOut(seg(t, 0.25, 1.45))} />
      <Words text="מה כבר רציתי?!" t={t} t0={b0} x={80} y={150} size={128} seed={10} />
      <Card x={250} y={420} w={580} h={880} rot={-2} seed={11} t={t} t0={b1}>
        <Photo src="img/k0.jpg" label="MELT · K0" />
      </Card>
      <Tape x={540} y={404} text="פרסומת של 15 שניות" t={t} t0={b1 + 0.25} seed={12} rot={-4} size={52} />
      <Stamp x={820} y={560} t={t} t0={b1 + 0.95} text="15s" seed={13} />
      <Card x={70} y={1370} w={940} h={290} seed={14} t={t} t0={b2} bg="#211b17" rot={1} pad={30}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />)}
          <div style={{ fontFamily: MONO, color: '#c9b8a6', fontSize: 28, marginLeft: 16 }}>Claude Code</div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 40, color: '#f4ece2', direction: 'ltr', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#d97757' }}>› </span>{typed.slice(0, n)}
          <span style={{ opacity: cursorOn ? 1 : 0, background: '#f4ece2', marginLeft: 4 }}>&nbsp;</span>
        </div>
        {t > b2 + 1.75 && <div style={{ fontFamily: MONO, fontSize: 30, color: '#9bc59d', marginTop: 18, direction: 'ltr' }}>✓ bambi · image-generator · video-man · composer</div>}
      </Card>
      {t >= b3 && <Chair t={t} t0={b3} />}
      <Tape x={290} y={1750} text="בלי לקום מהכיסא" t={t} t0={b3 + 0.3} seed={15} rot={3} size={44} />
    </Sheet>
  );
};

const Chair: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  const d = drop(t, t0);
  const b = useBoil(16, 1.2);
  return (
    <svg width={260} height={260} viewBox="0 0 260 260" style={{ position: 'absolute', left: 760, top: 1650, opacity: d.o, transform: `translate(${b.dx}px, ${d.y + b.dy}px) rotate(${4 + d.r + b.dr}deg)`, filter: 'drop-shadow(0 10px 10px rgba(60,35,15,0.35))' }}>
      <rect x={50} y={20} width={160} height={120} rx={26} fill="#c9a227" />
      <rect x={30} y={120} width={200} height={60} rx={22} fill="#b38c1a" />
      <rect x={14} y={92} width={44} height={96} rx={18} fill="#d8b23a" />
      <rect x={202} y={92} width={44} height={96} rx={18} fill="#d8b23a" />
      <rect x={52} y={180} width={18} height={60} rx={6} fill="#5a3b20" />
      <rect x={190} y={180} width={18} height={60} rx={6} fill="#5a3b20" />
    </svg>
  );
};

/* ------------------------------------------------------------------ 1 · storyboard */

export const Storyboard: React.FC<SP> = ({ t }) => {
  const [b0, b1, b2, b3, b4] = [0, 1, 2, 3, 4].map((i) => beat(1, i));
  const brief: [string, string][] = [['brand', 'MELT'], ['product', 'שוקולד מריר'], ['hero_word', 'MELT'], ['transformation', 'נמס']];
  const arm = t < b2 ? -24 : t < b2 + 0.17 ? -10 : 0;
  const scroll = 35 * easeInOut(seg(t, b4 + 0.6, b4 + 2.4));
  return (
    <Sheet color="#e9dcc6">
      <Header n={1} title="סטוריבורד" t={t} t0={0} />
      <HeaderThread t={t} stage={1} />
      <Card x={150} y={350} w={780} h={440} seed={20} t={t} t0={b0} rot={-1.5} pad={36} out={{ t: b3, dx: -230, dy: -70, s: 0.5, r: -3 }}>
        <div style={{ fontFamily: MONO, fontSize: 40, color: INK, fontWeight: 700, marginBottom: 16 }}>brief.json</div>
        {brief.map(([k, v], i) => (
          <div key={k} style={{ fontFamily: MONO, fontSize: 36, color: INK_SOFT, direction: 'ltr', lineHeight: 1.6, opacity: t > b0 + 0.3 + i * 0.3 ? 1 : 0 }}>
            <span style={{ color: RED }}>"{k}"</span>: <span style={{ color: INK, fontFamily: `${HEB}`, fontWeight: 700 }}>"{v}"</span>
          </div>
        ))}
      </Card>
      <Card x={600} y={840} w={360} h={360} seed={21} t={t} t0={b1} rot={4} bg="transparent" style={{ boxShadow: 'none' }} out={{ t: b3, dx: 30, dy: -500, s: 0.62, r: -4 }}>
        <svg width={360} height={300} viewBox="0 0 360 300" style={{ filter: 'drop-shadow(0 12px 12px rgba(60,35,15,0.4))' }}>
          <rect x={20} y={110} width={320} height={180} rx={8} fill="#2a2420" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={30 + i * 64} y={120} width={30} height={22} fill="#efe6d6" transform={`skewX(-20)`} />)}
          <text x={180} y={230} textAnchor="middle" fontFamily={HEB} fontWeight={900} fontSize={52} fill="#efe6d6">MELT · S1</text>
          <g transform={`rotate(${arm} 22 100)`}>
            <rect x={20} y={70} width={320} height={36} rx={6} fill="#2a2420" />
            {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={36 + i * 64} y={74} width={30} height={28} fill="#efe6d6" transform="skewX(-20)" />)}
          </g>
        </svg>
        <Tape x={180} y={330} text="במבי · הבמאי" t={t} t0={b2} seed={22} rot={-3} size={44} />
      </Card>
      {[['img/k0.jpg', 'S1'], ['img/k1.jpg', 'S2'], ['img/k2.jpg', 'S3'], ['img/k2b.jpg', 'S4']].map(([src, l], i) => (
        <Card key={l} x={810 - i * 240} y={660} w={220} h={330} seed={30 + i} t={t} t0={b3 + 0.15 + i * 0.17} rot={[-3, 2, -1.5, 3][i]}>
          <Photo src={src} label={l} size={36} />
        </Card>
      ))}
      <Card x={70} y={1040} w={940} h={760} seed={40} t={t} t0={b4} bg="#16120f" rot={-1} pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', background: '#2a231e' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <div style={{ fontFamily: MONO, color: '#c9b8a6', fontSize: 26, marginLeft: 12 }}>storyboard_grid.html</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 26, color: '#ff6b5e' }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: '#ff3b30', opacity: Math.floor(t * 2) % 2 ? 1 : 0.25 }} />LIVE
          </div>
        </div>
        <Img src={staticFile('img/widget.jpg')} style={{ width: '100%', height: 696, objectFit: 'cover', objectPosition: `50% ${scroll}%` }} />
      </Card>
      <Tape x={540} y={1852} text="ווידג'ט חי" t={t} t0={b4 + 0.35} seed={41} rot={-2} size={46} />
    </Sheet>
  );
};

/* ------------------------------------------------------------------ 2 · images */

export const Images: React.FC<SP> = ({ t }) => {
  const [b0, b1, b2] = [0, 1, 2].map((i) => beat(2, i));
  const row: [number, string][] = [[700, 'img/k1.jpg'], [400, 'img/k2.jpg'], [100, 'img/k3.jpg']];
  const thrPts = smooth([[310, 930], [520, 1010], [840, 1110], [700, 1230], [540, 1110], [400, 1230], [240, 1110]], 12);
  const thrP = easeInOut(seg(t, b1 + 0.2, b1 + 3.6));
  const lens = (rand(5, Math.round(t * 12)) - 0.5) * 3;
  return (
    <Sheet color="#e6d3b3">
      <Header n={2} title="תמונות" t={t} t0={0} />
      <HeaderThread t={t} stage={2} />
      <Card x={570} y={330} w={400} h={600} seed={50} t={t} t0={b0} rot={2.5}><Photo src="img/product.jpg" label="עוגן מוצר" size={38} /></Card>
      <Card x={110} y={340} w={400} h={600} seed={51} t={t} t0={b0 + 1.7} rot={-2}><Photo src="img/k0.jpg" label="K0" size={40} /></Card>
      <Tape x={540} y={985} text="GPT Image 2" t={t} t0={b0 + 0.35} seed={52} rot={-3} size={50} ltr />
      <Thread pts={thrPts} progress={thrP} />
      {row.map(([x, src], i) => (
        <Card key={src} x={x} y={1100} w={280} h={420} seed={53 + i} t={t} t0={b1 + 0.9 + i * 1.05} rot={[2, -2.5, 1.5][i]}>
          <Photo src={src} label={`K${i + 1}`} size={36} />
        </Card>
      ))}
      <Tape x={540} y={1585} text="GPT Image 1.5" t={t} t0={b1 + 0.25} seed={56} rot={2} size={50} ltr />
      <Tape x={540} y={1672} text="כל פריים ← מתוך הקודם + העוגן" t={t} t0={b1 + 1.3} seed={57} rot={-1.5} size={36} color="rgba(251,246,236,0.95)" />
      {t >= b2 && (
        <svg width={W} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: drop(t, b2).o }}>
          <g transform={`translate(${540 + lens} ${1300 + lens})`}>
            <line x1={110} y1={120} x2={210} y2={230} stroke="#5a3b20" strokeWidth={30} strokeLinecap="round" />
            <circle r={160} fill="rgba(255,240,170,0.18)" stroke="#f2c94c" strokeWidth={22} />
            <circle r={160} fill="none" stroke="#b38c1a" strokeWidth={4} />
            {t > b2 + 0.8 && <g transform="translate(70 -110) rotate(-10)">
              <circle r={52} fill="#2f9e5b" /><path d="M-24 2 L-6 20 L26 -16" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
            </g>}
          </g>
        </svg>
      )}
      <Tape x={540} y={1790} text="Nano Banana · תיקון" t={t} t0={b2 + 0.3} seed={58} rot={-3} size={46} color="rgba(246,215,67,0.95)" />
    </Sheet>
  );
};

/* ------------------------------------------------------------------ 3 · video */

const Shards: React.FC<{ t: number; t0: number; cx: number; cy: number }> = ({ t, t0, cx, cy }) => {
  if (t < t0) return null;
  const p = easeOut(seg(t, t0, t0 + 1.6));
  return (
    <svg width={W} height={1920} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2 + rand(70, i) * 0.4, dist = (260 + rand(71, i) * 420) * p, sz = 40 + rand(72, i) * 70;
        const x = cx + Math.cos(a) * dist, y = cy + Math.sin(a) * dist, r = (rand(73, i) - 0.5) * 540 * p;
        return (
          <polygon key={i} points={`0,${-sz} ${sz * 0.8},${sz * 0.6} ${-sz * 0.6},${sz * 0.4}`} transform={`translate(${x} ${y}) rotate(${r})`}
            fill="rgba(215,235,245,0.55)" stroke="#ffffff" strokeWidth={4} style={{ filter: 'drop-shadow(0 8px 8px rgba(40,30,20,0.35))' }} opacity={1 - seg(t, t0 + 1.4, t0 + 2.2)} />
        );
      })}
    </svg>
  );
};

export const Video: React.FC<SP> = ({ t }) => {
  const [b0, b1, b2, b3, b4, b5] = [0, 1, 2, 3, 4, 5].map((i) => beat(3, i));
  const merge = b2 + 0.6;
  const zig: Pt[] = [];
  for (let i = 0; i <= 8; i++) zig.push([i % 2 ? 470 : 610, 400 + i * 62]);
  const clips = [['vid/s01.mp4', 97], ['vid/s02.mp4', 97], ['vid/s03.mp4', 73], ['vid/s04.mp4', 97]] as const;
  const main = t < b4 ? { src: 'vid/s01.mp4', at: merge, rate: 1 } : t < b5 + 1.0 ? { src: 'vid/s02.mp4', at: b4, rate: 0.35 } : { src: 'vid/s01.mp4', at: b5 + 1.0, rate: 1 };
  return (
    <Sheet color="#ece2d0">
      <div style={{ position: 'absolute', inset: 0, transform: shake(t, b5, 0.8, 22, 77) }}>
        <Header n={3} title="וידאו" t={t} t0={0} />
        <HeaderThread t={t} stage={3} />
        {t < merge + 0.1 && <>
          <Card x={590} y={330} w={400} h={600} seed={60} t={t} t0={b0} rot={2} out={{ t: b2, dx: -170, s: 0.9, dur: 0.6 }}><Photo src="img/k0.jpg" label="ראשון" size={40} /></Card>
          <Card x={90} y={330} w={400} h={600} seed={61} t={t} t0={b0 + 0.3} rot={-2} out={{ t: b2, dx: 170, s: 0.9, dur: 0.6 }}><Photo src="img/k1.jpg" label="אחרון" size={40} /></Card>
          <Thread pts={zig} progress={easeInOut(seg(t, b1, b2))} />
        </>}
        {t >= merge && (
          <Card x={240} y={310} w={600} h={900} seed={62} t={t} t0={merge} rot={-1} bg="#1a1410" pad={18}>
            <div style={{ position: 'absolute', inset: 18, overflow: 'hidden', borderRadius: 4 }}>
              <Clip key={main.src + main.at} src={main.src} at={main.at} frames={main.src.includes('s03') ? 73 : 97} rate={main.rate} poster="img/k0.jpg" />
            </div>
          </Card>
        )}
        <Tape x={540} y={1240} text="Kling 3 · first + last frame" t={t} t0={merge + 0.2} seed={63} rot={-2} size={40} ltr />
        {t >= b4 && <Tape x={860} y={380} text="האטה" t={t} t0={b4 + 0.5} seed={64} rot={7} size={50} />}
        {t >= b5 && <Tape x={230} y={420} text="זעזוע מסך" t={t} t0={b5 + 0.1} seed={65} rot={-7} size={50} />}
        <Shards t={t} t0={b5 + 1.0} cx={540} cy={760} />
        {t >= b5 + 1.0 && <Tape x={820} y={1140} text="שברי זכוכית" t={t} t0={b5 + 1.15} seed={66} rot={5} size={50} />}
        {t >= b3 && (
          <div style={{ position: 'absolute', left: -20, top: 1330, width: W + 40, height: 360, background: '#1c1612', opacity: drop(t, b3).o, transform: `translateY(${drop(t, b3).y}px) rotate(-1.5deg)`, boxShadow: '0 16px 30px rgba(40,25,10,0.45)' }}>
            {Array.from({ length: 22 }).map((_, i) => <React.Fragment key={i}>
              <div style={{ position: 'absolute', left: 30 + i * 50, top: 14, width: 26, height: 18, borderRadius: 4, background: '#e9dcc6' }} />
              <div style={{ position: 'absolute', left: 30 + i * 50, top: 328, width: 26, height: 18, borderRadius: 4, background: '#e9dcc6' }} />
            </React.Fragment>)}
            {clips.map(([src, fr], i) => (
              <div key={src} style={{ position: 'absolute', left: 820 - i * 250, top: 46, width: 210, height: 268, overflow: 'hidden', borderRadius: 3, opacity: t > b3 + 0.2 + i * 0.25 ? 1 : 0 }}>
                <Clip src={src} at={b3 + 0.2 + i * 0.25} frames={fr} />
              </div>
            ))}
          </div>
        )}
        <Thread pts={smooth([[1100, 1320], [800, 1300], [500, 1330], [200, 1300], [-40, 1325]], 10)} progress={easeInOut(seg(t, b3 + 0.3, b3 + 1.5))} />
        <Tape x={540} y={1760} text="FFmpeg concat → fx_edit.py" t={t} t0={b3 + 0.4} seed={67} rot={2} size={40} ltr />
      </div>
    </Sheet>
  );
};

/* ------------------------------------------------------------------ 4 · sound */

/** whole-track overview (max per bucket), bars before the playhead are lit */
const Overview: React.FC<{ data: number[]; t: number; color: string; h: number }> = ({ data, t, color, h }) => {
  const bars = 90, per = data.length / bars, now = t * FPS;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 3, padding: '0 20px' }}>
      {Array.from({ length: bars }).map((_, i) => {
        const v = Math.max(...data.slice(Math.floor(i * per), Math.floor((i + 1) * per)), 0);
        const lit = i * per <= now, head = Math.abs(i * per - now) < per;
        return <div key={i} style={{ flex: 1, height: Math.max(4, Math.sqrt(v) * h * 0.9), background: head ? RED : color, borderRadius: 2, opacity: lit ? 1 : 0.22 }} />;
      })}
    </div>
  );
};

const Wave: React.FC<{ data: number[]; t: number; color: string; h: number; window?: number }> = ({ data, t, color, h, window = 6 }) => {
  const bars = 72, now = Math.floor(t * FPS), span = window * FPS;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '0 20px' }}>
      {Array.from({ length: bars }).map((_, i) => {
        const k = Math.floor(now - span / 2 + (i / bars) * span);
        const v = k >= 0 && k <= now ? data[Math.min(k, data.length - 1)] ?? 0 : 0;
        const head = Math.abs(i - bars / 2) < 0.6;
        return <div key={i} style={{ flex: 1, height: Math.max(4, v * h * 0.9), background: head ? RED : color, borderRadius: 3, opacity: k > now ? 0.15 : 1 }} />;
      })}
    </div>
  );
};

export const Sound: React.FC<SP> = ({ t }) => {
  const [b0, b1, b2, b3, b4, b5] = [0, 1, 2, 3, 4, 5].map((i) => beat(4, i));
  const cues = ['0.0s  push-in', '0.9s  glass cracks', '1.6s  bar breaks out', '4.1s  letters rise', '8.0s  macro drip'];
  const chips = ['קריעה', 'ווש', 'נחיתה', 'תפר'];
  const W8 = waves as Record<string, number[]>;
  return (
    <Sheet color="#e9e3d7">
      <Header n={4} title="סאונד" t={t} t0={0} />
      <HeaderThread t={t} stage={4} />
      {t < b1 + 0.4 && [0, 1, 2].map((i) => {
        const d = drop(t, b0 + 0.25 + i * 0.38, 0.3);
        const gone = seg(t, b1, b1 + 0.35);
        return d.visible ? <div key={i} style={{ position: 'absolute', left: 380 + i * 140, top: 760, width: 64, height: 64, borderRadius: 32, background: INK, opacity: d.o * (1 - gone), transform: `translateY(${d.y - gone * 300}px) scale(${1 + gone})`, boxShadow: '0 10px 14px rgba(60,35,15,0.3)' }} /> : null;
      })}
      <Card x={330} y={320} w={420} h={340} seed={80} t={t} t0={b1} rot={-2} out={{ t: b2, dx: -200, dy: -10, s: 0.75 }}>
        <svg width={420} height={340} viewBox="0 0 420 340">
          <ellipse cx={150} cy={250} rx={62} ry={44} fill={INK} transform="rotate(-20 150 250)" />
          <rect x={198} y={60} width={18} height={196} fill={INK} />
          <path d="M216 60 C 300 90, 320 150, 280 210 C 300 150, 270 120, 216 118 Z" fill={RED} />
        </svg>
      </Card>
      <Tape x={350} y={640} text="הסוכן המלחין" t={t} t0={b1 + 0.25} seed={81} rot={-3} size={46} />
      {t >= b2 && (
        <Card x={600} y={330} w={380} h={540} seed={82} t={t} t0={b2} rot={2.5} bg="#1a1410" pad={14}>
          <div style={{ position: 'absolute', inset: 14, overflow: 'hidden', borderRadius: 3 }}>
            <Clip src="vid/s01.mp4" at={b2} frames={97} poster="img/k0.jpg" />
            {[0, 1, 2].map((i) => {
              const k = Math.floor(t * 6 + i * 7);
              return <div key={i} style={{ position: 'absolute', left: 30 + rand(83, k, i) * 200, top: 60 + rand(84, k, i) * 360, width: 90, height: 70, border: `4px solid ${RED}` }} />;
            })}
          </div>
        </Card>
      )}
      <Card x={90} y={700} w={470} h={380} seed={85} t={t} t0={b2 + 0.4} rot={-1.5} pad={26}>
        <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 700, color: INK, marginBottom: 10 }}>CUES.md</div>
        {cues.map((c, i) => <div key={c} style={{ fontFamily: MONO, fontSize: 27, color: INK_SOFT, direction: 'ltr', lineHeight: 1.55, opacity: t > b2 + 0.6 + i * 0.25 ? 1 : 0 }}>{c}</div>)}
      </Card>
      <Tape x={330} y={1110} text="מיפוי כל תנועה" t={t} t0={b2 + 0.7} seed={86} rot={2} size={42} />
      <Card x={70} y={1180} w={940} h={190} seed={87} t={t} t0={b3} rot={-0.8} bg="#f6efe2">
        <Wave data={W8.music_only} t={t} color="#5a4636" h={170} />
      </Card>
      <Tape x={540} y={1170} text="score = pluck(mtof(74)) + pad(D)" t={t} t0={b3 + 0.3} seed={88} rot={-2} size={34} ltr color="rgba(251,246,236,0.96)" />
      <Card x={70} y={1420} w={940} h={150} seed={89} t={t} t0={b4} rot={0.8} bg="#f6efe2">
        <Overview data={W8.sfx_only} t={t} color="#8e150f" h={140} />
      </Card>
      {chips.map((c, i) => {
        const pulse = t > b5 + i * 0.3 && t < b5 + i * 0.3 + 0.17 ? 1.18 : 1;
        return t >= b4 + 0.3 + i * 0.4 ? (
          <div key={c} style={{ position: 'absolute', left: 820 - i * 245, top: 1620, transform: `scale(${pulse})` }}>
            <Tape x={95} y={40} text={c} t={t} t0={b4 + 0.3 + i * 0.4} seed={90 + i} rot={[-4, 3, -2, 5][i]} size={46} color="rgba(251,246,236,0.96)" />
          </div>
        ) : null;
      })}
      <Tape x={540} y={1790} text="ElevenLabs SFX" t={t} t0={b4 + 0.15} seed={95} rot={-2} size={46} ltr />
    </Sheet>
  );
};

/* ------------------------------------------------------------------ 5 · finale */

export const Finale: React.FC<SP> = ({ t }) => {
  const [b0, b1, b2, b3, b4, b5, b6, b7] = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => beat(5, i));
  const tag = 'MADE TO MELT';
  const faders: [string, number][] = [['VO', 0.78], ['MUSIC', 0.42], ['SFX', 0.6]];
  const fx = 215, fy = 250, fw = 650, fh = 1156;
  const loop = smooth([[fx + fw / 2, fy - 40], [fx + fw + 40, fy - 20], [fx + fw + 50, fy + fh / 2], [fx + fw + 30, fy + fh + 40], [fx + fw / 2, fy + fh + 55], [fx - 40, fy + fh + 30], [fx - 50, fy + fh / 2], [fx - 30, fy - 25], [fx + fw / 2 + 30, fy - 45]], 14);
  const agents: [string, number, number, boolean][] = [['במבי', 130, 430, false], ['image generator', 830, 560, true], ['the-video-man', 170, 900, true], ['מלחין', 940, 1050, false], ['Claude Code', 860, 1330, true]];
  return (
    <Sheet color="#efe6d6">
      <Header n={5} title="עריכה" t={t} t0={0} />
      <HeaderThread t={t} stage={5} />
      {t < b2 && <>
        <div style={{ position: 'absolute', top: 380, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, direction: 'ltr' }}>
          {tag.split('').map((ch, i) => {
            const d = drop(t, b0 + 0.1 + i * 0.07, 0.4);
            const sc = (rand(100, i) - 0.5) * 220 * (1 - seg(t, b0 + 0.1 + i * 0.07, b0 + 0.6 + i * 0.07));
            return <span key={i} style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 116, color: '#5a2e14', opacity: d.visible ? d.o : 0, transform: `translate(${sc}px, ${d.y * 2}px) rotate(${d.r * 6}deg)`, minWidth: ch === ' ' ? 30 : undefined, textShadow: '0 6px 10px rgba(60,35,15,0.25)' }}>{ch}</span>;
          })}
        </div>
        <Tape x={540} y={560} text="טיפוגרפיה מונפשת" t={t} t0={b0 + 0.6} seed={101} rot={-2} size={44} />
        <Card x={190} y={680} w={700} h={480} seed={102} t={t} t0={b1} rot={1} pad={30}>
          {faders.map(([l, v], i) => {
            const p = easeOut(seg(t, b1 + 0.2 + i * 0.15, b1 + 0.8 + i * 0.15));
            return <div key={l} style={{ position: 'absolute', left: 90 + i * 210, top: 50, width: 100, height: 380 }}>
              <div style={{ position: 'absolute', left: 44, top: 0, width: 12, height: 320, background: '#cdbfa8', borderRadius: 6 }} />
              <div style={{ position: 'absolute', left: 14, top: 300 - 300 * v * p, width: 72, height: 40, background: i === 0 ? RED : INK, borderRadius: 6, boxShadow: '0 5px 8px rgba(60,35,15,0.35)' }} />
              <div style={{ position: 'absolute', top: 336, width: 100, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 28, color: INK }}>{l}</div>
            </div>;
          })}
        </Card>
        <Tape x={540} y={1200} text="מיקס אחרון" t={t} t0={b1 + 0.3} seed={103} rot={3} size={46} />
      </>}
      {t >= b2 && (
        <Card x={fx} y={fy} w={fw} h={fh} seed={104} t={t} t0={b2} rot={-1} bg="#1a1410" pad={14}>
          <div style={{ position: 'absolute', inset: 14, overflow: 'hidden', borderRadius: 3 }}>
            <Clip src="vid/melt_final.mp4" at={b2} frames={360} poster="img/k0.jpg" />
          </div>
        </Card>
      )}
      <Thread pts={loop} progress={easeInOut(seg(t, b6 - 0.3, Math.min(TOTAL - 0.4, b6 + 1.6)))} />
      <Words text="מפעל קליפים" t={t} t0={b3} x={80} y={1440} size={132} seed={110} color={INK} />
      <Tape x={540} y={1640} text="מחשבה שלי · המון סוכנים" t={t} t0={b4} seed={111} rot={-2} size={48} />
      {agents.map(([a, x, y, ltr], i) => <Tape key={a} x={x} y={y} text={a} t={t} t0={b5 + i * 0.16} seed={112 + i} rot={(rand(120, i) - 0.5) * 14} size={38} ltr={ltr} color="rgba(251,246,236,0.95)" />)}
      <Stamp x={800} y={1790} t={t} t0={b7} text="נכון?" size={210} seed={130} />
    </Sheet>
  );
};
