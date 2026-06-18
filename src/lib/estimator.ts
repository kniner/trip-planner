import { ITEMS_BY_ID } from '../data';
import type { Day, LiveWaits, PlanStop, WaitMode } from './types';
import { walkMinutes } from './walking';

export interface EstimatedStop {
  stop: PlanStop;
  /** Display name (attraction name or custom block name). */
  label: string;
  /** Walking minutes from the previous stop (0 for the first / after a custom block). */
  walk: number;
  /** Modeled queue wait minutes for the chosen wait mode (0 for custom blocks). */
  wait: number;
  /** Ride/show/visit/block duration minutes. */
  duration: number;
  /** Slack minutes added after this stop (0 for custom blocks). */
  buffer: number;
  /** Clock time the group arrives at this stop ("HH:MM"). */
  arriveClock: string;
  /** Clock time the group leaves this stop ("HH:MM"). */
  leaveClock: string;
  /** Minutes since the day start when the group arrives. */
  arriveOffset: number;
  /** If a target arrival was set, how far off the estimate is (minutes). */
  arrivalDelta?: number;
}

export interface PlanEstimate {
  stops: EstimatedStop[];
  totalWalk: number;
  totalWait: number;
  totalDuration: number;
  totalBuffer: number;
  /** Grand total minutes (walk + wait + duration + buffer). */
  totalMinutes: number;
  endClock: string;
}

/** Subset of a Day needed to estimate a route. */
export type EstimateInput = Pick<Day, 'stops' | 'settings'>;

function isCustom(stop: PlanStop): boolean {
  return stop.kind === 'custom' || (!stop.attractionId && !!stop.custom);
}

/** Resolve the wait minutes for an attraction under a given wait mode. */
export function waitFor(
  attractionId: string,
  mode: WaitMode,
  live: LiveWaits,
): number {
  const a = ITEMS_BY_ID[attractionId];
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
 * Build a full time-and-distance estimate for a planned day.
 *
 * The clock starts at `settings.startTime`. Each item stop adds walking time
 * from the previous *item* stop, the modeled queue wait, and the experience
 * duration. Custom blocks (travel, security, parking, breaks) contribute their
 * own duration with no walking or queue, and reset the walking baseline since
 * they have no map location.
 */
export function estimatePlan(day: EstimateInput, live: LiveWaits): PlanEstimate {
  const { stops, settings } = day;
  const startOffset = parseClock(settings.startTime);

  let cursor = 0; // minutes elapsed since day start
  let totalWalk = 0;
  let totalWait = 0;
  let totalDuration = 0;
  let totalBuffer = 0;
  const bufferPerStop = settings.bufferPerStop ?? 0;
  // Coordinates of the previous *item* stop, for the next walk leg.
  let prevItemId: string | undefined;

  const estimated: EstimatedStop[] = [];

  stops.forEach((stop) => {
    let label: string;
    let walk = 0;
    let wait = 0;
    let duration = 0;
    let buffer = 0;

    if (isCustom(stop)) {
      label = stop.custom?.name ?? 'Time block';
      duration = stop.custom?.durationMin ?? 0;
      prevItemId = undefined; // custom block has no location; break the walk chain
    } else {
      const attraction = stop.attractionId ? ITEMS_BY_ID[stop.attractionId] : undefined;
      if (!attraction) return;
      label = attraction.name;
      const prev = prevItemId ? ITEMS_BY_ID[prevItemId] : undefined;
      walk = prev ? walkMinutes(prev, attraction, settings.pace) : 0;
      wait = waitFor(attraction.id, settings.waitMode, live);
      duration = attraction.duration;
      buffer = bufferPerStop;
      prevItemId = attraction.id;
    }

    cursor += walk;
    const arriveOffset = cursor;
    cursor += wait + duration + buffer;

    const arriveAbs = startOffset + arriveOffset;
    const target = stop.arrival ? parseClock(stop.arrival) : undefined;

    estimated.push({
      stop,
      label,
      walk,
      wait,
      duration,
      buffer,
      arriveOffset,
      arriveClock: formatClock(arriveAbs),
      leaveClock: formatClock(startOffset + cursor),
      arrivalDelta: target === undefined ? undefined : arriveAbs - target,
    });

    totalWalk += walk;
    totalWait += wait;
    totalDuration += duration;
    totalBuffer += buffer;
  });

  return {
    stops: estimated,
    totalWalk,
    totalWait,
    totalDuration,
    totalBuffer,
    totalMinutes: totalWalk + totalWait + totalDuration + totalBuffer,
    endClock: formatClock(startOffset + cursor),
  };
}
