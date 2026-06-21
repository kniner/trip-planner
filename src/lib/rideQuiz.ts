import { ITEMS } from '../data';
import { RIDE_WARNINGS } from '../data/rideInfo';
import { RIDE_VIBES } from '../data/rideVibes';
import type { Attraction } from './types';

export type ThrillPref = 'chill' | 'moderate' | 'thrill';
export type RideStyle = 'dark' | 'water' | 'classic' | 'immersive';

export interface QuizAnswers {
  thrill: ThrillPref;
  motionSensitive: boolean;
  littleKids: boolean;
  styles: RideStyle[];
  spectacle: boolean;
}

export const DEFAULT_ANSWERS: QuizAnswers = {
  thrill: 'moderate',
  motionSensitive: false,
  littleKids: false,
  styles: [],
  spectacle: false,
};

const THRILL_TARGET: Record<ThrillPref, number> = { chill: 0, moderate: 2, thrill: 3 };

/**
 * Score MK + EPCOT rides/shows against the quiz answers and return the best
 * matches. Respects safety: motion rides are penalized for motion-sensitive
 * guests, and tall-height rides are downranked when little kids are along.
 */
export function recommendRides(ans: QuizAnswers, limit = 8): Attraction[] {
  const target = THRILL_TARGET[ans.thrill];

  return ITEMS.filter((a) => (a.park === 'mk' || a.park === 'epcot') && RIDE_VIBES[a.id])
    .map((a) => {
      const v = RIDE_VIBES[a.id];
      const w = RIDE_WARNINGS[a.id] ?? {};
      // Thrill closeness: 4 (exact) → 2 → 0 → -2 (furthest).
      let score = 4 - Math.abs(v.thrill - target) * 2;
      if (ans.motionSensitive && w.motion) score -= 6;
      if (ans.littleKids) {
        if (v.kids) score += 3;
        if (w.heightMin && w.heightMin >= 40) score -= 4;
      }
      for (const s of ans.styles) if (v[s]) score += 2;
      if (ans.spectacle && v.spectacle) score += 2;
      // Don't crowd results with shows unless spectacle was asked for.
      if (!ans.spectacle && v.spectacle && a.kind === 'show') score -= 1;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.a.maxWait - x.a.maxWait)
    .slice(0, limit)
    .map((x) => x.a);
}
