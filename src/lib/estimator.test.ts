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
  settings: { pace: 'average', waitMode: 'avg', startTime: '09:00', bufferPerStop: 0 },
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
      dayWith({ stops, settings: { pace: 'average', waitMode: 'max', startTime: '09:00', bufferPerStop: 0 } }),
      {},
    );
    expect(max.totalWait).toBeGreaterThan(avg.totalWait);
  });

  it('adds a per-stop buffer to attraction stops only', () => {
    const stops = [
      { id: 'c', kind: 'custom' as const, custom: { name: 'Parking', durationMin: 20 } },
      { id: '1', kind: 'item' as const, attractionId: 'space-mountain' },
      { id: '2', kind: 'item' as const, attractionId: 'buzz' },
    ];
    const base = estimatePlan(dayWith({ stops }), {});
    const buffered = estimatePlan(
      dayWith({
        stops,
        settings: { pace: 'average', waitMode: 'avg', startTime: '09:00', bufferPerStop: 10 },
      }),
      {},
    );
    // Two attraction stops × 10m buffer; the custom block gets none.
    expect(base.totalBuffer).toBe(0);
    expect(buffered.totalBuffer).toBe(20);
    expect(buffered.totalMinutes).toBe(base.totalMinutes + 20);
    expect(buffered.stops[0].buffer).toBe(0); // custom block
    expect(buffered.stops[1].buffer).toBe(10);
  });

  it('runs split groups in parallel and advances by the longest group', () => {
    const day = dayWith({
      stops: [
        {
          id: 'sp',
          kind: 'split',
          branches: [
            {
              id: 'a',
              name: 'Boutique',
              stops: [{ id: 'a1', kind: 'item', attractionId: 'mk-bibbidi-bobbidi-boutique' }],
            },
            {
              id: 'b',
              name: 'Rides',
              stops: [{ id: 'b1', kind: 'item', attractionId: 'space-mountain' }],
            },
          ],
        },
      ],
    });
    const est = estimatePlan(day, {});
    const split = est.stops[0];

    expect(split.branches).toHaveLength(2);
    // Boutique (60m) is the long pole vs Space Mountain (45m avg wait + 3m).
    expect(split.duration).toBe(60);
    expect(split.branches!.find((b) => b.name === 'Boutique')!.isLongest).toBe(true);
    expect(est.endClock).toBe('10:00');
    // Parallel: total counts the longest group once, not the sum of both.
    expect(est.totalMinutes).toBe(60);
  });

  it("attributes the longest split group's legs to the day totals", () => {
    // Longest group has two rides (a real walk + waits); the totals should
    // reflect that group, and the pieces must still sum to totalMinutes.
    const day = dayWith({
      stops: [
        {
          id: 'sp',
          kind: 'split',
          branches: [
            {
              id: 'a',
              name: 'Rides crew',
              stops: [
                { id: 'a1', kind: 'item', attractionId: 'space-mountain' },
                { id: 'a2', kind: 'item', attractionId: 'jungle-cruise' },
              ],
            },
            { id: 'b', name: 'Solo', stops: [{ id: 'b1', kind: 'item', attractionId: 'dumbo' }] },
          ],
        },
      ],
    });
    const est = estimatePlan(day, {});
    expect(est.totalWalk).toBeGreaterThan(0); // the rides crew's between-ride walk
    expect(est.totalWait).toBeGreaterThan(0);
    expect(est.totalMinutes).toBe(
      est.totalWalk + est.totalWait + est.totalDuration + est.totalBuffer,
    );
  });

  it('uses a fixed meet-up time as the split rejoin when set', () => {
    const day = dayWith({
      stops: [
        {
          id: 'sp',
          kind: 'split',
          arrival: '11:00', // fixed meet-up two hours after a 09:00 start
          branches: [
            {
              id: 'a',
              name: 'Boutique',
              stops: [{ id: 'a1', kind: 'item', attractionId: 'mk-bibbidi-bobbidi-boutique' }],
            },
            {
              id: 'b',
              name: 'Rides',
              stops: [{ id: 'b1', kind: 'item', attractionId: 'space-mountain' }],
            },
          ],
        },
      ],
    });
    const est = estimatePlan(day, {});
    // Rejoin is fixed at 11:00 regardless of group lengths (120 min block).
    expect(est.stops[0].duration).toBe(120);
    expect(est.endClock).toBe('11:00');
  });

  it('anchors a pinned fixed-time stop and inserts free time before it', () => {
    // A short ride, then a parade pinned at 15:00 with a 9:00 start.
    const day = dayWith({
      stops: [
        { id: '1', kind: 'item', attractionId: 'dumbo' },
        { id: 'p', kind: 'custom', custom: { name: 'Parade', durationMin: 20 }, fixedTime: '15:00' },
      ],
    });
    const est = estimatePlan(day, {});
    const parade = est.stops[1];
    expect(parade.arriveClock).toBe('15:00'); // pinned to the clock
    expect(parade.idle).toBeGreaterThan(0); // free time before it
    expect(parade.conflictMin).toBeUndefined();
    expect(est.endClock).toBe('15:20'); // parade ends 20 min later
    // Identity holds with idle included.
    expect(est.totalMinutes).toBe(
      est.totalWalk + est.totalWait + est.totalDuration + est.totalBuffer + est.totalIdle,
    );
  });

  it('flags a conflict when you cannot reach a fixed-time stop in time', () => {
    const day = dayWith({
      stops: [
        // A 90-minute dining block starting 09:00 ends 10:30...
        { id: 'd', kind: 'custom', custom: { name: 'Brunch', durationMin: 90 } },
        // ...so a 09:30 fixed showtime is unreachable.
        { id: 's', kind: 'custom', custom: { name: 'Show', durationMin: 15 }, fixedTime: '09:30' },
      ],
    });
    const est = estimatePlan(day, {});
    expect(est.stops[1].conflictMin).toBe(60); // arrive 10:30, show at 09:30
    expect(est.stops[1].idle ?? 0).toBe(0);
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
