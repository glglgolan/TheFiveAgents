// S4 camera (on ones). Keyed as the WORLD point at screen centre (cx, cy) + zoom, converted to runway camX/camY.
import { ease, track } from '../../lib/motion';
import { noise2 } from '../../lib/rng';
import { giraffeRootX, SNAP, T, type Cam } from './choreo';
import { snapCentroid } from './pearls';

const X720 = giraffeRootX(T.enter);
export const cameraAt = (f: number): Cam => {
  const c = snapCentroid();
  const cxWalk = X720 + 1190;
  const cxPose = c.x + 30;
  const cxWide = GX_WIDE();
  const cx = track(f, [[T.from, cxWalk - 30], [T.enter, cxWalk - 10, ease.out], [T.stop, cxWalk], [808, cxPose, ease.inOut],
    [SNAP, cxPose + 6], [850, c.x + 10, ease.out], [858, c.x + 10], [894, cxWide, ease.inOut], [T.to, cxWide + 46]]);
  const cy = track(f, [[T.from, 540], [T.stop, 540], [808, 392, ease.inOut], [SNAP, 380], [850, 360, ease.out], [858, 362], [894, 520, ease.inOut], [T.to, 530]]);
  let zoom = track(f, [[T.from, 1.0], [T.stop, 1.0], [808, 1.13, ease.inOut], [SNAP, 1.19], [850, 1.33, ease.out], [858, 1.32], [894, 1.02, ease.inOut], [T.to, 1.0]]);
  // hit shake (decaying), plus a whisper of handheld
  const k = f >= SNAP ? Math.exp(-(f - SNAP) / 4.5) : 0;
  const sx = 30 * k * noise2('s4sx', 0, f * 0.9) + 2.5 * noise2('s4hx', 0, f * 0.04);
  const sy = 22 * k * noise2('s4sy', 0, f * 0.9) + 2 * noise2('s4hy', 0, f * 0.04);
  const rot = 1.6 * k * noise2('s4sr', 0, f * 0.8);
  zoom += 0.02 * k;
  return { camX: cx + sx - 960, camY: cy + sy - 540, zoom, rot };
};
const GX_WIDE = () => giraffeRootX(T.stop) + 170;

