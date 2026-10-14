// S2 (192–456) — BACKSTAGE. Monsieur Bouledogue screams at Pipette, who hammers the Flamingo's towering cage
// heels from the top of the stepladder; the heels ratchet higher; Pipette deadpans; "in pearls!" — lasso twirl.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, W, H } from '../lib/style';
import { onTwos, track, ease } from '../lib/motion';
import { BoilDefs } from '../lib/fx';
import { visemeAt } from '../lib/visemes';
import { Back, Front, GROUND_Y, LADDER_H, layerT } from '../sets/Backstage';
import { sway } from '../sets/backstage/common';
import Bulldog from '../characters/Bulldog';
import Mouse from '../characters/Mouse';
import Flamingo from '../characters/Flamingo';
import { cameraAt } from './s2/camera';
import {
  bulldogPose, bulldogExpr, BULLDOG_IMP, bulldogMonocle, holdPearls, pearlSwing,
  mousePose, mouseFlip, mouseExpr, MOUSE_IMP, flamingoPose, FLAMINGO_IMP, ladderShake, LAMP_SWING,
} from './s2/acting';
import { WhipStreaks } from './s1/Audience';
import { PearlSmear } from './s2/PearlSmear';

export const S2_STAGE = {
  bulldog: { x: 640, y: GROUND_Y, s: 1 },
  ladderX: 1130,
  mouse: { x: 1122, y: GROUND_Y - LADDER_H - 14, s: 1 },
  flamingo: { x: 1278, y: GROUND_Y + 10, s: 2.2 },
};

const S2: React.FC<{ frame: number }> = ({ frame }) => {
  const { camX, camY, zoom } = cameraAt(frame);
  const chaos = frame < 440 ? 0.6 : 0.85;
  const shake = ladderShake(frame);
  const ladderRot = shake * sway('ladder', frame, 0.4) * 1.5; // matches Stepladder's own wobble
  const mf = mouseFlip(frame);
  const st = S2_STAGE;
  const streak = track(frame, [[192, 1], [198, 0, ease.out]]);
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <BoilDefs frame={frame} />
        <Back frame={frame} camX={camX} camY={camY} zoom={zoom} chaos={chaos} lampSwing={LAMP_SWING} ladderX={st.ladderX} ladderShake={shake} />
        <g transform={layerT(1, camX, camY, zoom)}>
          {/* Flamingo: drawn huge so only legs + telescoping cage heels are in frame */}
          <g transform={`translate(${st.flamingo.x} ${st.flamingo.y}) scale(${st.flamingo.s})`}>
            <Flamingo frame={frame} poseAt={(f) => flamingoPose(onTwos(f))} impulses={FLAMINGO_IMP} expression="fierce" />
          </g>
          {/* Pipette rides the ladder's wobble */}
          <g transform={`rotate(${ladderRot.toFixed(3)} ${st.ladderX} ${GROUND_Y})`}>
            <g transform={`translate(${st.mouse.x} ${st.mouse.y}) scale(${st.mouse.s})`}>
              <Mouse
                frame={frame}
                pose={mousePose(onTwos(frame))}
                poseFn={(f) => mousePose(onTwos(f))}
                impulses={MOUSE_IMP}
                flip={mf}
                showHammer
                expression={mouseExpr(frame)}
                viseme={visemeAt('mouse', frame)}
              />
            </g>
          </g>
          <g transform={`translate(${st.bulldog.x} ${st.bulldog.y}) scale(${st.bulldog.s})`}>
            <Bulldog
              frame={frame}
              poseFn={bulldogPose}
              simFrom={Math.max(192, frame - 72)}
              impulses={BULLDOG_IMP}
              expression={bulldogExpr(frame)}
              monocleOut={bulldogMonocle(frame)}
              holdPearls={holdPearls(frame)}
              pearlSwing={pearlSwing(frame)}
            />
            <PearlSmear frame={frame} swing={pearlSwing} poseFn={bulldogPose} from={438} />
          </g>
        </g>
        <Front frame={frame} camX={camX} camY={camY} zoom={zoom} chaos={chaos} />
        <WhipStreaks frame={frame} amount={streak} speed={-150 * streak} />
      </svg>
    </AbsoluteFill>
  );
};

export default S2;
