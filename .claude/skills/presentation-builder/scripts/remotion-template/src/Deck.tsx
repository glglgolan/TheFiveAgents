import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {DeckProps} from './types';
import {Slide} from './Slide';
import {DEFAULT_SECONDS_PER_SLIDE} from './Root';

export const Deck: React.FC<DeckProps> = (props) => {
  const {fps} = useVideoConfig();
  const spp = props.secondsPerSlide ?? DEFAULT_SECONDS_PER_SLIDE;
  const per = Math.round(spp * fps);

  return (
    <AbsoluteFill style={{backgroundColor: `#${props.theme.bg}`}}>
      {props.slides.map((slide, i) => (
        <Sequence
          key={i}
          from={i * per}
          durationInFrames={per}
          name={`slide-${i + 1}-${slide.layout}`}
        >
          <Slide slide={slide} theme={props.theme} dir={props.dir} per={per} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
