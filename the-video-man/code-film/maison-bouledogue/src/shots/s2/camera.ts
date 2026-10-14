// S2 camera (on ones, eased). All frames absolute (S2 = 192..456).
import { ease, track, wobble, type EaseFn } from '../../lib/motion';

/** Camera x during the S1→S2 whip (S1 frames 179..191 reveal the backstage racing past; S2 decelerates it). */
export const S2_WHIP_CAMX = (f: number) => (f < 192 ? Math.max(-560, -300 - (192 - f) * 30) : track(f, [[192, -300], [200, 0, ease.out]]));

const o = ease.out, io = ease.inOut, i = ease.in;
const ob: EaseFn = (t) => ease.outBack(t, 1.2);

const X: [number, number, EaseFn?][] = [
  [192, -300], [200, 0, o],
  [204, 0], [210, -175, ob],          // punch-in on the bulldog: "Pipette!"
  [274, -150, io],                    // slow drift through L02
  [282, 120, io],                     // whip over to the heels as they ratchet up
  [298, 130, io],
  [308, 120, ob],                     // pan to the mouse for L03
  [366, 132, io],
  [384, -40, io],                     // pull back for L04
  [428, -110, io],
  [440, -150, i],                     // final push lands on the whip
  [456, -155, o],
];
const Z: [number, number, EaseFn?][] = [
  [192, 1.12], [200, 1.0, o],
  [204, 1.0], [210, 1.38, ob],
  [274, 1.42, io],
  [282, 1.08, io],
  [298, 1.08],
  [308, 1.9, ob],
  [366, 1.95, io],
  [384, 1.1, io],
  [428, 1.3, io],
  [440, 1.5, i],
  [456, 1.53, o],
];
const Y: [number, number, EaseFn?][] = [
  [192, 0], [204, 0], [210, 70, ob],
  [246, 70], [252, 40, io], [266, 60, io],   // tilt up a touch with "Higher!"
  [274, 70, io],
  [282, -40, io], [300, -110, io],            // tilt up with the telescoping heels
  [308, -30, ob], [366, -30],
  [384, 20, io], [428, 60, io], [440, 80, i], [456, 82],
];

/** Shake impulses (hammer hits, ratchet clunks, pearl whip). */
const SHAKE: [number, number][] = [[214, 0.35], [238, 0.35], [262, 0.45], [282, 0.3], [286, 0.3], [290, 0.3], [294, 0.3], [300, 0.7], [440, 1]];

export const cameraAt = (f: number) => {
  const sx = wobble(f, SHAKE, 6, 7) * 12;
  const sy = wobble(f, SHAKE.map(([a, b]) => [a + 1, b] as [number, number]), 7, 8) * 10;
  return { camX: track(f, X) + sx, camY: track(f, Y) + sy, zoom: track(f, Z) };
};
