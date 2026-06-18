import { describe, expect, it } from 'vitest';
import { ITEMS_BY_ID } from '../data';
import {
  estimatePlan,
  formatClock,
  parseClock,
  waitFor,
  type EstimateInput,
} from './estimator';
import type { LiveWaits } from './types';
import { walkMinutes } from './walking';

const dayWith = (input: Partial<EstimateInput>): EstimateInput => ({
  stops: [],
  settings: { pace: 'average', waitMode: 'avg', startTime: '09:00' },
  ...input,
});

describe('clock helpers', () => {
  it('round-trips HH:MM', () => {
    expect(formatClock(parseClock('09:30'))).toBe('09:30');
    expect(parseClock('09:00')).toBe(540);
  });
  it('wraps past midnight', () => {
    expect(formatClock(1440 + 90)).toBe('01:30');
  });
});

describe('walkMinutes', () => {
  const a = ITEMS_BY_ID['jungle-cruise'];
  const b = ITEMS_BY_ID['space-mountain'];

  it('is zero for the same attraction', () => {
    expect(walkMinutes(a, a, 'average')).toBe(0);
  });

  it('scales with pace: slow > average > fast', () => {
    const slow = walkMinutes(a, b, 'slow');
    const avg = walkMinutes(a, b, 'average');
    const fast = walkMinutes(a, b, 'fast');
    expect(slow).toBeGreaterThan(avg);
    expect(avg).toBeGreaterThan(fast);
  });

  it('is at least 1 minute between distinct attractions', () => {
    const c = ITEMS_BY_ID['astro-orbiter'];
    const d = ITEMS_BY_ID['peoplemover'];
    expect(walkMinutes(c, d, 'fast')).toBeGreaterThanOrEqual(1);
  });
});

describe('waitFor', () => {
  const live: LiveWaits = { 'space-mountain': { wait: 73, isOpen: true } };

  it('uses average, max, and live values', () => {
    const a = ITEMS_BY_ID['space-mountain'];
    expect(waitFor('space-mountain', 'avg', live)).toBe(a.avgWait);
    expect(waitFor('space-mountain', 'max', live)).toBe(a.maxWait);
    expect(waitFor('space-mountain', 'live', live)).toBe(73);
  });

  it('falls back to average for live when no live data', () => {
    const a = ITEMS_BY_ID['haunted-mansion'];
    expect(waitFor('haunted-mansion', 'live', live)).toBe(a.avgWait);
  });
});

describe('estimatePlan', () => {
  it('accumulates walk + wait + duration and advances the clock', () => {
    const day = dayWith({
      stops: [
        { id: '1', kind: 'item', attractionId: 'space-mountain' },
        { id: '2', kind: 'item', attractionId: 'buzz' },
      ],
    });
    const est = estimatePlan(day, {});

    expect(est.stops[0].walk).toBe(0);
    expect(est.stops[0].arriveClock).toBe('09:00');
    expect(est.stops[1].walk).toBeGreaterThan(0);

    const sumWalk = est.stops.reduce((n, s) => n + s.walk, 0);
    const sumWait = est.stops.reduce((n, s) => n + s.wait, 0);
    const sumDur = est.stops.reduce((n, s) => n + s.duration, 0);
    expect(est.totalWalk).toBe(sumWalk);
    expect(est.totalWait).toBe(sumWait);
    expect(est.totalDuration).toBe(sumDur);
    expect(est.totalMinutes).toBe(sumWalk + sumWait + sumDur);
  });

  it('max mode produces a longer day than avg mode', () => {
    const stops = [
      { id: '1', kind: 'item' as const, attractionId: 'seven-dwarfs' },
      { id: '2', kind: 'item' as const, attractionId: 'space-mountain' },
    ];
    const avg = estimatePlan(dayWith({ stops }), {});
    const max = estimatePlan(
      dayWith({ stops, settings: { pace: 'average', waitMode: 'max', startTime: '09:00' } }),
      {},
    );
    expect(max.totalWait).toBeGreaterThan(avg.totalWait);
  });

  it('computes arrival delta against a target time', () => {
    const day = dayWith({
      stops: [{ id: '1', kind: 'item', attractionId: 'space-mountain', arrival: '09:30' }],
    });
    const est = estimatePlan(day, {});
    expect(est.stops[0].arrivalDelta).toBe(-30);
  });

  it('handles custom blocks: no walk/wait, uses block duration, breaks walk chain', () => {
    const day = dayWith({
      stops: [
        { id: 'c', kind: 'custom', custom: { name: 'Drive + parking + security', durationMin: 60 } },
        { id: '1', kind: 'item', attractionId: 'space-mountain' },
      ],
    });
    const est = estimatePlan(day, {});

    // Custom block contributes only its duration.
    expect(est.stops[0].walk).toBe(0);
    expect(est.stops[0].wait).toBe(0);
    expect(est.stops[0].duration).toBe(60);
    expect(est.stops[0].label).toBe('Drive + parking + security');
    // The item after a custom block has no walk leg (block reset the chain).
    expect(est.stops[1].walk).toBe(0);
    // Item arrives 60 min after a 09:00 start.
    expect(est.stops[1].arriveClock).toBe('10:00');
  });

  it('estimates a 90-minute character dining block', () => {
    const day = dayWith({
      stops: [{ id: '1', kind: 'item', attractionId: 'mk-crystal-palace' }],
    });
    const est = estimatePlan(day, {});
    expect(est.stops[0].duration).toBe(90);
    expect(est.stops[0].wait).toBe(0);
  });
});
