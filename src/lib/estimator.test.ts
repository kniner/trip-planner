import { describe, expect, it } from 'vitest';
import { ATTRACTIONS_BY_ID } from '../data/attractions';
import { estimatePlan, formatClock, parseClock, waitFor } from './estimator';
import type { LiveWaits, PlanDoc } from './types';
import { walkMinutes } from './walking';

const docWith = (overrides: Partial<PlanDoc>): PlanDoc => ({
  collaborators: [],
  tags: [],
  stops: [],
  settings: { pace: 'average', waitMode: 'avg', startTime: '09:00' },
  ...overrides,
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
  const a = ATTRACTIONS_BY_ID['jungle-cruise'];
  const b = ATTRACTIONS_BY_ID['space-mountain'];

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
    const c = ATTRACTIONS_BY_ID['astro-orbiter'];
    const d = ATTRACTIONS_BY_ID['peoplemover'];
    expect(walkMinutes(c, d, 'fast')).toBeGreaterThanOrEqual(1);
  });
});

describe('waitFor', () => {
  const live: LiveWaits = { 'space-mountain': { wait: 73, isOpen: true } };

  it('uses average, max, and live values', () => {
    const a = ATTRACTIONS_BY_ID['space-mountain'];
    expect(waitFor('space-mountain', 'avg', live)).toBe(a.avgWait);
    expect(waitFor('space-mountain', 'max', live)).toBe(a.maxWait);
    expect(waitFor('space-mountain', 'live', live)).toBe(73);
  });

  it('falls back to average for live when no live data', () => {
    const a = ATTRACTIONS_BY_ID['haunted-mansion'];
    expect(waitFor('haunted-mansion', 'live', live)).toBe(a.avgWait);
  });
});

describe('estimatePlan', () => {
  it('accumulates walk + wait + duration and advances the clock', () => {
    const doc = docWith({
      stops: [
        { id: '1', attractionId: 'space-mountain' },
        { id: '2', attractionId: 'buzz' },
      ],
    });
    const est = estimatePlan(doc, {});

    // First stop has no walk in.
    expect(est.stops[0].walk).toBe(0);
    expect(est.stops[0].arriveClock).toBe('09:00');
    // Second stop walks from space-mountain to buzz.
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
      { id: '1', attractionId: 'seven-dwarfs' },
      { id: '2', attractionId: 'space-mountain' },
    ];
    const avg = estimatePlan(docWith({ stops, settings: { pace: 'average', waitMode: 'avg', startTime: '09:00' } }), {});
    const max = estimatePlan(docWith({ stops, settings: { pace: 'average', waitMode: 'max', startTime: '09:00' } }), {});
    expect(max.totalWait).toBeGreaterThan(avg.totalWait);
  });

  it('computes arrival delta against a target time', () => {
    const doc = docWith({
      stops: [{ id: '1', attractionId: 'space-mountain', arrival: '09:30' }],
    });
    const est = estimatePlan(doc, {});
    // Arrives at 09:00, target 09:30 -> 30 min early (negative delta).
    expect(est.stops[0].arrivalDelta).toBe(-30);
  });
});
