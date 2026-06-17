import type { Attraction, Pace } from './types';

/**
 * Walking speeds in meters/second for each group pace.
 * Tuned for theme-park crowds (slower than open-sidewalk pace) and to make
 * the slow/average/fast toggle meaningfully change route estimates.
 */
export const PACE_SPEEDS: Record<Pace, number> = {
  slow: 0.85,
  average: 1.2,
  fast: 1.6,
};

export const PACE_LABELS: Record<Pace, string> = {
  slow: 'Slow / with kids',
  average: 'Average',
  fast: 'Fast',
};

/**
 * Real walking paths wind around buildings, water, and crowds, so straight-line
 * distance underestimates. Scale it up by this factor to approximate path length.
 */
const PATH_WINDINESS = 1.3;

/** Straight-line distance between two attractions, in meters. */
export function distanceMeters(a: Attraction, b: Attraction): number {
  const dx = a.coords.x - b.coords.x;
  const dy = a.coords.y - b.coords.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Estimated walking time between two attractions, in minutes, for the given
 * pace. Returns a value rounded to the nearest minute (minimum 1 when the
 * attractions are distinct).
 */
export function walkMinutes(a: Attraction, b: Attraction, pace: Pace): number {
  if (a.id === b.id) return 0;
  const meters = distanceMeters(a, b) * PATH_WINDINESS;
  const minutes = meters / PACE_SPEEDS[pace] / 60;
  return Math.max(1, Math.round(minutes));
}
