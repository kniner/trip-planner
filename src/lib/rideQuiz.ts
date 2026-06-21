import { ITEMS } from '../data';
import { RIDE_WARNINGS } from '../data/rideInfo';
import { RIDE_VIBES, type Franchise } from '../data/rideVibes';
import type { Attraction } from './types';

export type ThrillPref = 'chill' | 'moderate' | 'thrill';
export type RideStyle = 'dark' | 'water' | 'classic' | 'immersive';
export type WaitPref = 'short' | 'any';
export type { Franchise };

export interface QuizAnswers {
  thrill: ThrillPref;
  motionSensitive: boolean;
  littleKids: boolean;
  styles: RideStyle[];
  spectacle: boolean;
  /** 'short' favors low-wait rides; 'any' ignores wait time. */
  waits: WaitPref;
  /** Penalize water rides (don't want to get soaked). */
  avoidWater: boolean;
  /** Exclude rides with a pregnancy advisory. */
  pregnant: boolean;
  /** Favor indoor / air-conditioned rides. */
  indoor: boolean;
  /** Boost rides from these franchises. */
  franchises: Franchise[];
}

export const DEFAULT_ANSWERS: QuizAnswers = {
  thrill: 'moderate',
  motionSensitive: false,
  littleKids: false,
  styles: [],
  spectacle: false,
  waits: 'any',
  avoidWater: false,
  pregnant: false,
  indoor: false,
  franchises: [],
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
      // Pregnancy advisory is a hard exclude.
      if (ans.pregnant && w.pregnancy) score -= 100;
      if (ans.motionSensitive && w.motion) score -= 6;
      if (ans.littleKids) {
        if (v.kids) score += 3;
        if (w.heightMin && w.heightMin >= 40) score -= 4;
      }
      if (ans.avoidWater && v.water) score -= 6;
      if (ans.indoor && v.indoor) score += 2;
      if (ans.franchises.length && v.franchises) {
        if (v.franchises.some((f) => ans.franchises.includes(f))) score += 3;
      }
      for (const s of ans.styles) if (v[s]) score += 2;
      if (ans.spectacle && v.spectacle) score += 2;
      // Don't crowd results with shows unless spectacle was asked for.
      if (!ans.spectacle && v.spectacle && a.kind === 'show') score -= 1;
      // Wait-time preference: strongly favor shorter typical waits, so
      // long-wait headliners (e.g. Tiana ~50m) drop out of "short waits" picks.
      if (ans.waits === 'short') {
        if (a.avgWait >= 45) score -= 6;
        else if (a.avgWait >= 30) score -= 2;
        else score += 1;
      }
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.a.maxWait - x.a.maxWait)
    .slice(0, limit)
    .map((x) => x.a);
}
