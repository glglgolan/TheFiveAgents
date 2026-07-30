import {Composition} from 'remotion';
import {Deck} from './Deck';
import {DeckProps} from './types';
import sample from './sample-content.json';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DEFAULT_SECONDS_PER_SLIDE = 5;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Deck"
      component={Deck}
      defaultProps={sample as unknown as DeckProps}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={300}
      calculateMetadata={({props}) => {
        const spp = props.secondsPerSlide ?? DEFAULT_SECONDS_PER_SLIDE;
        const frames = Math.max(1, props.slides.length) * spp * FPS;
        return {durationInFrames: frames};
      }}
    />
  );
};
