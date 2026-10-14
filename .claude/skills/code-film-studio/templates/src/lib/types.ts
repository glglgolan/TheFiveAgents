/** Mouth shapes (Preston Blair / Rhubarb set). A=closed MBP, B=slightly open teeth (K S T EE), C=open (EH AE), D=wide (AA), E=rounded (AO ER), F=pucker (UW OW W), G=F/V teeth-on-lip, H=L tongue, X=rest. */
export type Viseme = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X';

/**
 * Common character contract. Every character component draws in LOCAL coordinates:
 * origin (0,0) = ground point between the feet, +x = facing direction (right), -y = up.
 * Height at scale 1 is given by HEIGHTS in style.ts. Shots position/scale via an outer <g transform>.
 */
export interface CharProps {
  frame: number;              // absolute film frame (use onTwos(frame) inside for poses)
  pose?: Record<string, number>; // named joint params (degrees / 0..1 blends); see each character's POSE_KEYS
  expression?: string;        // see each character's EXPRESSIONS
  viseme?: Viseme;            // mouth shape (speaking characters)
  flip?: boolean;             // face left instead of right
  seed?: string;              // variation seed
  [k: string]: unknown;       // character-specific extras (documented in the character file)
}
