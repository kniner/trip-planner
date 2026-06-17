import { ATTRACTIONS_BY_ID } from '../data/attractions';
import type { LiveWaits, PlanDoc, PlanStop, WaitMode } from './types';
import { walkMinutes } from './walking';

export interface EstimatedStop {
  stop: PlanStop;
  /** Walking minutes from the previous stop (0 for the first). */
  walk: number;
  /** Modeled queue wait minutes for the chosen wait mode. */
  wait: number;
  /** Ride/show duration minutes. */
  duration: number;
  /** Clock time the group arrives at this stop ("HH:MM"). */
  arriveClock: string;
  /** Clock time the group leaves this stop ("HH:MM"). */
  leaveClock: string;
  /** Minutes since the day start when the group arrives. */
  arriveOffset: number;
  /** If the target arrival was set, how far off the estimate is (minutes). */
  arrivalDelta?: number;
}

export interface PlanEstimate {
  stops: EstimatedStop[];
  totalWalk: number;
  totalWait: number;
  totalDuration: number;
  /** Grand total minutes (walk + wait + duration). */
  totalMinutes: number;
  endClock: string;
}

/** Resolve the wait minutes for an attraction under a given wait mode. */
export function waitFor(
  attractionId: string,
  mode: WaitMode,
  live: LiveWaits,
): number {
  const a = ATTRACTIONS_BY_ID[attractionId];
  if (!a) return 0;
  if (mode === 'avg') return a.avgWait;
  if (mode === 'max') return a.maxWait;
  // live: fall back to average when no live data is available.
  const l = live[attractionId];
  if (l && l.isOpen) return l.wait;
  return a.avgWait;
}

export function parseClock(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatClock(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = Math.round(wrapped % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Build a full time-and-distance estimate for the planned route.
 *
 * The clock starts at `settings.startTime`. Each stop adds walking time from
 * the previous stop, the modeled queue wait, and the experience duration.
 * Walking time scales with the group's pace; queue time follows the wait mode
 * (average / max / live).
 */
export function estimatePlan(doc: PlanDoc, live: LiveWaits): PlanEstimate {
  const { stops, settings } = doc;
  const startOffset = parseClock(settings.startTime);

  let cursor = 0; // minutes elapsed since day start
  let totalWalk = 0;
  let totalWait = 0;
  let totalDuration = 0;

  const estimated: EstimatedStop[] = [];

  stops.forEach((stop, i) => {
    const attraction = ATTRACTIONS_BY_ID[stop.attractionId];
    if (!attraction) return;

    const prev = i > 0 ? ATTRACTIONS_BY_ID[stops[i - 1].attractionId] : undefined;
    const walk = prev ? walkMinutes(prev, attraction, settings.pace) : 0;
    const wait = waitFor(stop.attractionId, settings.waitMode, live);
    const duration = attraction.duration;

    cursor += walk;
    const arriveOffset = cursor;
    cursor += wait + duration;

    const arriveAbs = startOffset + arriveOffset;
    const target = stop.arrival ? parseClock(stop.arrival) : undefined;

    estimated.push({
      stop,
      walk,
      wait,
      duration,
      arriveOffset,
      arriveClock: formatClock(arriveAbs),
      leaveClock: formatClock(startOffset + cursor),
      arrivalDelta: target === undefined ? undefined : arriveAbs - target,
    });

    totalWalk += walk;
    totalWait += wait;
    totalDuration += duration;
  });

  return {
    stops: estimated,
    totalWalk,
    totalWait,
    totalDuration,
    totalMinutes: totalWalk + totalWait + totalDuration,
    endClock: formatClock(startOffset + cursor),
  };
}
