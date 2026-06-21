/**
 * Lightweight "vibe" tags for Magic Kingdom & EPCOT rides and shows, used by the
 * ride-suggestion quiz. Safety facts (height/motion/pregnancy) come from
 * RIDE_WARNINGS; this captures taste: how thrilling, what kind of experience,
 * whether it's indoor/AC, and which franchise it belongs to.
 */
export type Franchise = 'princess' | 'pixar' | 'space' | 'adventure';

export interface RideVibe {
  /** 0 gentle · 1 mild · 2 moderate · 3 big thrill. */
  thrill: 0 | 1 | 2 | 3;
  /** Indoor dark ride / story ride. */
  dark?: boolean;
  /** Water ride (you may get wet). */
  water?: boolean;
  /** Great for little kids. */
  kids?: boolean;
  /** Nostalgic / classic Disney. */
  classic?: boolean;
  /** Big, immersive headliner / newer E-ticket. */
  immersive?: boolean;
  /** Show / big production / spectacle. */
  spectacle?: boolean;
  /** Mostly indoor / air-conditioned (good for beating the heat). */
  indoor?: boolean;
  /** Franchises / IP this ride belongs to. */
  franchises?: Franchise[];
}

export const RIDE_VIBES: Record<string, RideVibe> = {
  // Magic Kingdom
  'wdw-railroad': { thrill: 0, classic: true, kids: true },
  'jungle-cruise': { thrill: 0, classic: true, kids: true, franchises: ['adventure'] },
  pirates: { thrill: 1, dark: true, classic: true, kids: true, indoor: true, franchises: ['adventure'] },
  'tiki-room': { thrill: 0, classic: true, kids: true, spectacle: true, indoor: true },
  'magic-carpets': { thrill: 0, kids: true },
  'big-thunder': { thrill: 2, classic: true, franchises: ['adventure'] },
  tianas: { thrill: 2, water: true, immersive: true, franchises: ['princess'] },
  'country-bears': { thrill: 0, classic: true, kids: true, spectacle: true, indoor: true },
  'haunted-mansion': { thrill: 1, dark: true, classic: true, indoor: true, franchises: ['adventure'] },
  'hall-of-presidents': { thrill: 0, classic: true, spectacle: true, indoor: true },
  riverboat: { thrill: 0, classic: true, kids: true },
  'seven-dwarfs': { thrill: 2, kids: true, immersive: true, franchises: ['princess'] },
  'peter-pan': { thrill: 1, dark: true, classic: true, kids: true, indoor: true },
  'small-world': { thrill: 0, dark: true, classic: true, kids: true, indoor: true },
  'winnie-pooh': { thrill: 0, dark: true, classic: true, kids: true, indoor: true },
  'mad-tea-party': { thrill: 1, classic: true, kids: true },
  carrousel: { thrill: 0, classic: true, kids: true },
  'little-mermaid': { thrill: 0, dark: true, kids: true, indoor: true, franchises: ['princess'] },
  philharmagic: { thrill: 0, kids: true, spectacle: true, indoor: true },
  dumbo: { thrill: 0, classic: true, kids: true },
  'space-mountain': { thrill: 3, dark: true, classic: true, indoor: true, franchises: ['space'] },
  buzz: { thrill: 1, dark: true, kids: true, indoor: true, franchises: ['pixar', 'space'] },
  peoplemover: { thrill: 0, classic: true },
  'astro-orbiter': { thrill: 1, franchises: ['space'] },
  'carousel-progress': { thrill: 0, classic: true, spectacle: true, indoor: true },
  speedway: { thrill: 1, kids: true },
  'laugh-floor': { thrill: 0, kids: true, spectacle: true, indoor: true, franchises: ['pixar'] },

  // EPCOT
  'spaceship-earth': { thrill: 0, dark: true, classic: true, kids: true, indoor: true },
  'cosmic-rewind': { thrill: 3, dark: true, immersive: true, indoor: true, franchises: ['space'] },
  'test-track': { thrill: 2, immersive: true, indoor: true },
  'mission-space': { thrill: 2, immersive: true, indoor: true, franchises: ['space'] },
  soarin: { thrill: 1, immersive: true, spectacle: true, indoor: true },
  'living-with-the-land': { thrill: 0, classic: true, kids: true, indoor: true },
  'the-seas-nemo': { thrill: 0, dark: true, kids: true, indoor: true, franchises: ['pixar'] },
  'journey-imagination': { thrill: 0, dark: true, classic: true, kids: true, indoor: true },
  'gran-fiesta': { thrill: 0, dark: true, classic: true, kids: true, indoor: true },
  'frozen-ever-after': {
    thrill: 1,
    dark: true,
    water: true,
    kids: true,
    immersive: true,
    indoor: true,
    franchises: ['princess'],
  },
  'remys-ratatouille': {
    thrill: 1,
    dark: true,
    kids: true,
    immersive: true,
    indoor: true,
    franchises: ['pixar'],
  },
};
