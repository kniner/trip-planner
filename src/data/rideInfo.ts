/**
 * Ride safety advisories, keyed by attraction id. Figures reflect Disney's
 * posted guidance: a height minimum (inches), an expectant-mother advisory,
 * a motion-sickness advisory, and a "may not fit larger / very tall guests"
 * advisory (relevant for very tall riders, ~6′8″+). Always confirm posted
 * signage at the park — these are planning references.
 */
export interface RideWarning {
  /** Minimum height in inches required to ride. */
  heightMin?: number;
  /** Not recommended during pregnancy. */
  pregnancy?: boolean;
  /** May trigger motion sickness. */
  motion?: boolean;
  /** Restraints may not accommodate larger or very tall guests. */
  bigTall?: boolean;
}

export const RIDE_WARNINGS: Record<string, RideWarning> = {
  // Magic Kingdom
  'space-mountain': { heightMin: 44, pregnancy: true, motion: true, bigTall: true },
  'big-thunder': { heightMin: 40, pregnancy: true, motion: true, bigTall: true },
  tianas: { heightMin: 40, pregnancy: true, bigTall: true },
  'seven-dwarfs': { heightMin: 38, pregnancy: true, motion: true },
  speedway: { heightMin: 32, pregnancy: true },
  'mad-tea-party': { pregnancy: true, motion: true },
  'astro-orbiter': { pregnancy: true, motion: true },
  buzz: { motion: true },
  barnstormer: { heightMin: 35, pregnancy: true, motion: true },

  // EPCOT
  'cosmic-rewind': { heightMin: 42, pregnancy: true, motion: true, bigTall: true },
  'test-track': { heightMin: 40, pregnancy: true, motion: true, bigTall: true },
  'mission-space': { heightMin: 40, pregnancy: true, motion: true },
  soarin: { heightMin: 40, pregnancy: true, motion: true },
  'frozen-ever-after': { pregnancy: true },
};

export interface WarningKeyEntry {
  field: keyof RideWarning;
  icon: string;
  label: string;
}

/** Legend entries explaining the badges shown on ride cards. */
export const WARNING_KEY: WarningKeyEntry[] = [
  { field: 'heightMin', icon: '📏', label: 'Height minimum to ride (under it can’t ride)' },
  { field: 'pregnancy', icon: '🤰', label: 'Not recommended for expectant mothers' },
  { field: 'motion', icon: '🌀', label: 'May cause motion sickness' },
  { field: 'bigTall', icon: '📐', label: 'May not fit larger or very tall guests (≈6′8″+)' },
];
