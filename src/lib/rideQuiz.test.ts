import { describe, it, expect } from 'vitest';
import { DEFAULT_ANSWERS, recommendRides } from './rideQuiz';
import { RIDE_VIBES } from '../data/rideVibes';

const idsOf = (ans = DEFAULT_ANSWERS, limit?: number) =>
  recommendRides(ans, limit).map((a) => a.id);

describe('recommendRides', () => {
  it('respects the result limit', () => {
    expect(recommendRides(DEFAULT_ANSWERS, 5).length).toBeLessThanOrEqual(5);
  });

  it('chill answers only surface gentle rides', () => {
    const res = recommendRides({ ...DEFAULT_ANSWERS, thrill: 'chill' }, 8);
    expect(res.length).toBeGreaterThan(0);
    for (const a of res) expect(RIDE_VIBES[a.id].thrill).toBeLessThanOrEqual(1);
    expect(res.some((a) => a.id === 'space-mountain')).toBe(false);
  });

  it('big-thrill answers surface a headliner coaster', () => {
    const ids = idsOf({ ...DEFAULT_ANSWERS, thrill: 'thrill' }, 8);
    expect(ids.includes('space-mountain') || ids.includes('cosmic-rewind')).toBe(true);
  });

  it('little kids keep tall-height rides out of the top picks', () => {
    const top = idsOf({ ...DEFAULT_ANSWERS, thrill: 'thrill', littleKids: true }, 12).slice(0, 4);
    expect(top).not.toContain('space-mountain'); // 44" minimum
  });

  it('motion sensitivity demotes (or drops) motion rides', () => {
    const rank = (ids: string[], id: string) => {
      const i = ids.indexOf(id);
      return i === -1 ? Infinity : i;
    };
    const base = idsOf({ ...DEFAULT_ANSWERS, thrill: 'thrill' }, 12);
    const sensitive = idsOf({ ...DEFAULT_ANSWERS, thrill: 'thrill', motionSensitive: true }, 12);
    expect(rank(sensitive, 'cosmic-rewind')).toBeGreaterThanOrEqual(rank(base, 'cosmic-rewind'));
  });
});
