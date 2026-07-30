import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Slide as SlideType, Theme} from './types';

const PAD = 110;

const useFade = (per: number) => {
  const frame = useCurrentFrame();
  const fadeFrames = 12;
  const inOpacity = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const outOpacity = interpolate(
    frame,
    [per - fadeFrames, per],
    [1, 0],
    {extrapolateLeft: 'clamp'},
  );
  return Math.min(inOpacity, outOpacity);
};

const useEntrance = (delay = 0) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 200}});
  return {
    opacity: s,
    transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`,
  };
};

export const Slide: React.FC<{
  slide: SlideType;
  theme: Theme;
  dir: 'rtl' | 'ltr';
  per: number;
}> = ({slide, theme, dir, per}) => {
  const fade = useFade(per);
  const rtl = dir === 'rtl';
  const align = rtl ? 'right' : 'left';
  const isDark = ['title', 'section', 'closing'].includes(slide.layout);
  const bg = isDark ? `#${theme.primary}` : `#${theme.bg}`;
  const fg = isDark ? `#${theme.accent}` : `#${theme.text}`;

  const base: React.CSSProperties = {
    backgroundColor: bg,
    color: fg,
    direction: rtl ? 'rtl' : 'ltr',
    textAlign: align,
    fontFamily: theme.bodyFont,
    padding: PAD,
    opacity: fade,
  };

  const Title = ({size = 84}: {size?: number}) => {
    const e = useEntrance(0);
    return (
      <div
        style={{
          fontFamily: theme.headerFont,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.1,
          ...e,
        }}
      >
        {slide.title}
      </div>
    );
  };

  const Bullets = () => (
    <ul style={{listStyle: 'none', margin: 0, padding: 0, marginTop: 40}}>
      {(slide.bullets ?? []).map((b, i) => {
        const e = useEntrance(8 + i * 6);
        return (
          <li
            key={i}
            style={{
              fontSize: 40,
              lineHeight: 1.5,
              marginBottom: 22,
              display: 'flex',
              flexDirection: rtl ? 'row-reverse' : 'row',
              gap: 18,
              ...e,
            }}
          >
            <span style={{color: `#${theme.secondary}`, fontWeight: 800}}>•</span>
            <span>{b}</span>
          </li>
        );
      })}
    </ul>
  );

  const Picture = () =>
    slide.image ? (
      <Img
        src={staticFile(slide.image)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 28,
        }}
      />
    ) : null;

  switch (slide.layout) {
    case 'title':
    case 'section':
    case 'closing':
      return (
        <AbsoluteFill
          style={{...base, justifyContent: 'center', alignItems: rtl ? 'flex-end' : 'flex-start'}}
        >
          <Title size={96} />
          {slide.subtitle ? (
            <div style={{fontSize: 40, marginTop: 28, color: `#${theme.secondary}`}}>
              {slide.subtitle}
            </div>
          ) : null}
        </AbsoluteFill>
      );

    case 'stat':
      return (
        <AbsoluteFill style={{...base, justifyContent: 'center'}}>
          <Title size={52} />
          <div style={{...useEntrance(8), marginTop: 30}}>
            <div style={{fontSize: 200, fontWeight: 800, color: `#${theme.primary}`, fontFamily: theme.headerFont}}>
              {slide.stat?.value}
            </div>
            <div style={{fontSize: 40, color: `#${theme.text}`}}>{slide.stat?.label}</div>
          </div>
        </AbsoluteFill>
      );

    case 'quote':
      return (
        <AbsoluteFill style={{...base, justifyContent: 'center'}}>
          <div style={{fontSize: 64, fontStyle: 'italic', lineHeight: 1.3, ...useEntrance(0)}}>
            “{slide.body ?? slide.title}”
          </div>
        </AbsoluteFill>
      );

    case 'image-left':
    case 'image-right': {
      const imgFirst = slide.layout === 'image-left';
      const order = rtl ? !imgFirst : imgFirst;
      const img = <div style={{flex: 1, height: '100%'}}><Picture /></div>;
      const text = (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 60}}>
          <Title size={64} />
          <Bullets />
        </div>
      );
      return (
        <AbsoluteFill style={{...base, padding: 0, flexDirection: 'row'}}>
          {order ? (<>{img}{text}</>) : (<>{text}{img}</>)}
        </AbsoluteFill>
      );
    }

    case 'two-column':
      return (
        <AbsoluteFill style={{...base, flexDirection: 'column'}}>
          <Title size={64} />
          <div style={{display: 'flex', flexDirection: rtl ? 'row-reverse' : 'row', gap: 60, marginTop: 50, flex: 1}}>
            <div style={{flex: 1}}><Bullets /></div>
            <div style={{flex: 1}}>{slide.image ? <Picture /> : <div style={{fontSize: 36, lineHeight: 1.5}}>{slide.body}</div>}</div>
          </div>
        </AbsoluteFill>
      );

    case 'bullets':
    default:
      return (
        <AbsoluteFill style={{...base, flexDirection: 'column', justifyContent: 'flex-start'}}>
          <Title size={68} />
          <Bullets />
          {slide.body ? <div style={{fontSize: 36, marginTop: 30, lineHeight: 1.5, ...useEntrance(10)}}>{slide.body}</div> : null}
        </AbsoluteFill>
      );
  }
};
