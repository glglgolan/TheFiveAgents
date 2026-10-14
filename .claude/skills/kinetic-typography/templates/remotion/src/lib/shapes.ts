// Hand-drawn accent shapes in a 0..100 viewBox — deliberately imperfect strokes (overshoots, uneven curves).
export const SHAPES: Record<string, { paths: string[]; aspect: number }> = {
  underline: { aspect: 0.18, paths: ['M2 11 C 22 6, 48 4, 70 7 S 94 12, 98 8', 'M14 15 C 38 11, 66 10, 90 13'] },
  circle: { aspect: 0.62, paths: ['M60 4 C 26 2, 3 16, 4 32 C 5 50, 32 60, 56 59 C 82 58, 98 45, 96 28 C 94 12, 72 3, 44 6 C 32 7, 24 10, 18 14'] },
  arrow: { aspect: 0.6, paths: ['M4 52 C 22 46, 40 30, 58 22 C 70 16, 82 13, 94 12', 'M78 4 C 85 8, 90 10, 95 12 C 90 18, 86 24, 83 31'] },
  sparkle: { aspect: 1, paths: ['M50 6 C 52 30, 56 44, 94 50 C 58 54, 52 62, 50 94 C 48 64, 42 54, 6 50 C 44 46, 48 34, 50 6'] },
  swoosh: { aspect: 0.4, paths: ['M3 30 C 20 6, 42 4, 52 18 C 60 30, 74 36, 97 8'] },
  star: { aspect: 1, paths: ['M50 5 L 61 38 L 96 38 L 68 59 L 79 93 L 50 72 L 21 93 L 32 59 L 4 38 L 39 38 Z'] },
  scribble: { aspect: 0.5, paths: ['M4 40 C 14 6, 22 44, 32 12 C 40 46, 50 6, 58 40 C 66 8, 74 44, 84 12 C 90 30, 94 26, 97 20'] },
  bracket: { aspect: 1.6, paths: ['M70 4 C 40 6, 34 20, 36 50 C 37 70, 28 78, 14 80 C 28 82, 37 90, 36 110 C 34 140, 40 154, 70 156'] },
};
