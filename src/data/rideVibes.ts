/**
 * Lightweight "vibe" tags for Magic Kingdom & EPCOT rides and shows, used by the
 * ride-suggestion quiz. Safety facts (height/motion) come from RIDE_WARNINGS;
 * this captures taste: how thrilling, and what kind of experience it is.
 */
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
}

export const RIDE_VIBES: Record<string, RideVibe> = {
  // Magic Kingdom
  'wdw-railroad': { thrill: 0, classic: true, kids: true },
  'jungle-cruise': { thrill: 0, classic: true, kids: true },
  pirates: { thrill: 1, dark: true, classic: true, kids: true },
  'tiki-room': { thrill: 0, classic: true, kids: true, spectacle: true },
  'magic-carpets': { thrill: 0, kids: true },
  'big-thunder': { thrill: 2, classic: true },
  tianas: { thrill: 2, water: true, immersive: true },
  'country-bears': { thrill: 0, classic: true, kids: true, spectacle: true },
  'haunted-mansion': { thrill: 1, dark: true, classic: true },
  'hall-of-presidents': { thrill: 0, classic: true, spectacle: true },
  riverboat: { thrill: 0, classic: true, kids: true },
  'seven-dwarfs': { thrill: 2, kids: true, immersive: true },
  'peter-pan': { thrill: 1, dark: true, classic: true, kids: true },
  'small-world': { thrill: 0, dark: true, classic: true, kids: true },
  'winnie-pooh': { thrill: 0, dark: true, classic: true, kids: true },
  'mad-tea-party': { thrill: 1, classic: true, kids: true },
  carrousel: { thrill: 0, classic: true, kids: true },
  'little-mermaid': { thrill: 0, dark: true, kids: true },
  philharmagic: { thrill: 0, kids: true, spectacle: true },
  dumbo: { thrill: 0, classic: true, kids: true },
  'space-mountain': { thrill: 3, dark: true, classic: true },
  buzz: { thrill: 1, dark: true, kids: true },
  peoplemover: { thrill: 0, classic: true },
  'astro-orbiter': { thrill: 1 },
  'carousel-progress': { thrill: 0, classic: true, spectacle: true },
  speedway: { thrill: 1, kids: true },
  'laugh-floor': { thrill: 0, kids: true, spectacle: true },

  // EPCOT
  'spaceship-earth': { thrill: 0, dark: true, classic: true, kids: true },
  'cosmic-rewind': { thrill: 3, dark: true, immersive: true },
  'test-track': { thrill: 2, immersive: true },
  'mission-space': { thrill: 2, immersive: true },
  soarin: { thrill: 1, immersive: true, spectacle: true },
  'living-with-the-land': { thrill: 0, classic: true, kids: true },
  'the-seas-nemo': { thrill: 0, dark: true, kids: true },
  'journey-imagination': { thrill: 0, dark: true, classic: true, kids: true },
  'gran-fiesta': { thrill: 0, dark: true, classic: true, kids: true },
  'frozen-ever-after': { thrill: 1, dark: true, water: true, kids: true, immersive: true },
  'remys-ratatouille': { thrill: 1, dark: true, kids: true, immersive: true },
};
