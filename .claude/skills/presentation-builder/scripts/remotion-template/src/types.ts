export type Layout =
  | 'title'
  | 'section'
  | 'bullets'
  | 'two-column'
  | 'stat'
  | 'image-left'
  | 'image-right'
  | 'quote'
  | 'closing';

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  headerFont: string;
  bodyFont: string;
}

export interface Slide {
  layout: Layout;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  stat?: {value: string; label: string};
  image?: string; // basename of a file placed in public/
  notes?: string;
}

export interface DeckProps {
  title: string;
  name: string;
  lang: string;
  dir: 'rtl' | 'ltr';
  theme: Theme;
  slides: Slide[];
  secondsPerSlide?: number;
}
