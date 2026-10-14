import bible from '../../bible/style.json';
export const C = bible.palette;
export const S = bible.stroke;
export const F = bible.fonts;
export const FPS = bible.format.fps;
export const W = bible.format.width;
export const H = bible.format.height;
export const HEIGHTS = bible.characterHeights_px_at_scale1;
/** Standard ink stroke props for SVG shapes. */
export const ink = (w: number = S.ink) => ({
  stroke: C.ink, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});
