import { ITEMS_BY_ID } from '../data';
import type { Day, LiveWaits, PlanSettings, PlanStop, WaitMode } from './types';
import { walkMinutes } from './walking';

export interface EstimatedStop {
  stop: PlanStop;
  /** Display name (attraction name, custom block name, or split label). */
  label: string;
  walk: number;
  wait: number;
  duration: number;
  buffer: number;
  arriveClock: string;
  leaveClock: string;
  /** Minutes since the start of the sequence this stop belongs to. */
  arriveOffset: number;
  /** If a target arrival was set, how far off the estimate is (minutes). */
  arrivalDelta?: number;
  /** Present when the stop is a parallel split: one entry per group. */
  branches?: EstimatedBranch[];
}

export interface EstimatedBranch {
  id: string;
  name: string;
  /** Total minutes this group is busy during the split. */
  total: number;
  endClock: string;
  /** True for the group that takes longest (drives the rejoin time). */
  isLongest: boolean;
  stops: EstimatedStop[];
  /** Collaborator ids assigned to this group. */
  members: string[];
  /** Free-text names assigned to this group. */
  manualMembers: string[];
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

function isSplit(stop: PlanStop): boolean {
  return stop.kind === 'split' && Array.isArray(stop.branches);
}

/** Resolve the wait minutes for an attraction under a given wait mode. */
export function waitFor(attractionId: string, mode: WaitMode, live: LiveWaits): number {
  const a = ITEMS_BY_ID[attractionId];
  if (!a) return 0;
  if (mode === 'avg') return a.avgWait;
  if (mode === 'max') return a.maxWait;
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

interface StepResult {
  est: EstimatedStop;
  cursorAfter: number;
  prevItemId?: string;
  walk: number;
  wait: number;
  duration: number;
  buffer: number;
}

/**
 * Estimate a single item/custom stop given the running clock and the previous
 * located stop (for the walk leg). Returns null for an unknown attraction.
 */
function stepStop(
  stop: PlanStop,
  settings: PlanSettings,
  live: LiveWaits,
  prevItemId: string | undefined,
  startAbs: number,
  cursor: number,
): StepResult | null {
  const bufferPerStop = settings.bufferPerStop ?? 0;
  let label: string;
  let walk = 0;
  let wait = 0;
  let duration = 0;
  let buffer = 0;
  let nextPrev = prevItemId;

  if (isCustom(stop)) {
    label = stop.custom?.name ?? 'Time block';
    duration = stop.custom?.durationMin ?? 0;
    nextPrev = undefined; // custom block has no location; break the walk chain
  } else {
    const attraction = stop.attractionId ? ITEMS_BY_ID[stop.attractionId] : undefined;
    if (!attraction) return null;
    label = attraction.name;
    const prev = prevItemId ? ITEMS_BY_ID[prevItemId] : undefined;
    walk = prev ? walkMinutes(prev, attraction, settings.pace) : 0;
    wait = waitFor(attraction.id, settings.waitMode, live);
    duration = attraction.duration;
    buffer = bufferPerStop;
    nextPrev = attraction.id;
  }

  const arriveOffset = cursor + walk;
  const cursorAfter = arriveOffset + wait + duration + buffer;
  const arriveAbs = startAbs + arriveOffset;
  const target = stop.arrival ? parseClock(stop.arrival) : undefined;

  return {
    est: {
      stop,
      label,
      walk,
      wait,
      duration,
      buffer,
      arriveOffset,
      arriveClock: formatClock(arriveAbs),
      leaveClock: formatClock(startAbs + cursorAfter),
      arrivalDelta: target === undefined ? undefined : arriveAbs - target,
    },
    cursorAfter,
    prevItemId: nextPrev,
    walk,
    wait,
    duration,
    buffer,
  };
}

interface LinearResult {
  stops: EstimatedStop[];
  totalWalk: number;
  totalWait: number;
  totalDuration: number;
  totalBuffer: number;
  /** Elapsed minutes for the whole sequence. */
  end: number;
}

/** Estimate a linear run of item/custom stops starting at an absolute clock. */
function estimateLinear(
  stops: PlanStop[],
  settings: PlanSettings,
  live: LiveWaits,
  startAbs: number,
): LinearResult {
  let cursor = 0;
  let prevItemId: string | undefined;
  let totalWalk = 0;
  let totalWait = 0;
  let totalDuration = 0;
  let totalBuffer = 0;
  const est: EstimatedStop[] = [];

  for (const stop of stops) {
    const r = stepStop(stop, settings, live, prevItemId, startAbs, cursor);
    if (!r) continue;
    est.push(r.est);
    cursor = r.cursorAfter;
    prevItemId = r.prevItemId;
    totalWalk += r.walk;
    totalWait += r.wait;
    totalDuration += r.duration;
    totalBuffer += r.buffer;
  }

  return { stops: est, totalWalk, totalWait, totalDuration, totalBuffer, end: cursor };
}

/**
 * Build a full time-and-distance estimate for a planned day.
 *
 * Item stops add walking (from the previous located stop), queue wait, ride
 * duration and per-stop buffer. Custom blocks add their own duration and break
 * the walk chain. Split stops run several groups in parallel: the clock advances
 * by the *longest* group (they rejoin when the slowest finishes), and only the
 * longest group's time counts toward the totals.
 */
export function estimatePlan(day: EstimateInput, live: LiveWaits): PlanEstimate {
  const { stops, settings } = day;
  const startAbs = parseClock(settings.startTime);

  let cursor = 0;
  let prevItemId: string | undefined;
  let totalWalk = 0;
  let totalWait = 0;
  let totalDuration = 0;
  let totalBuffer = 0;
  const est: EstimatedStop[] = [];

  for (const stop of stops) {
    if (isSplit(stop)) {
      const splitStartAbs = startAbs + cursor;
      const branchResults = (stop.branches ?? []).map((b) => ({
        branch: b,
        r: estimateLinear(b.stops, settings, live, splitStartAbs),
      }));
      const maxEnd = branchResults.reduce((m, b) => Math.max(m, b.r.end), 0);

      // If a fixed meet-up time is set, the rejoin happens then (groups wait or
      // run short); otherwise the longest group sets the rejoin. The whole split
      // counts as activity time toward the day total so the clock stays exact.
      const meetUp = stop.arrival ? parseClock(stop.arrival) : undefined;
      const effectiveDuration =
        meetUp !== undefined && meetUp >= splitStartAbs ? meetUp - splitStartAbs : maxEnd;

      const arriveOffset = cursor;
      const cursorAfter = cursor + effectiveDuration;
      let longestSeen = false;
      const branches: EstimatedBranch[] = branchResults.map((b) => {
        const isLongest = !longestSeen && b.r.end === maxEnd && maxEnd > 0;
        if (isLongest) longestSeen = true;
        return {
          id: b.branch.id,
          name: b.branch.name,
          total: b.r.end,
          endClock: formatClock(splitStartAbs + b.r.end),
          isLongest,
          stops: b.r.stops,
          members: b.branch.members ?? [],
          manualMembers: b.branch.manualMembers ?? [],
        };
      });

      est.push({
        stop,
        label: 'Split — parallel groups',
        walk: 0,
        wait: 0,
        duration: effectiveDuration,
        buffer: 0,
        arriveOffset,
        arriveClock: formatClock(splitStartAbs),
        leaveClock: formatClock(startAbs + cursorAfter),
        branches,
      });

      totalDuration += effectiveDuration;
      cursor = cursorAfter;
      prevItemId = undefined; // groups reconvene; next walk leg is ambiguous
      continue;
    }

    const r = stepStop(stop, settings, live, prevItemId, startAbs, cursor);
    if (!r) continue;
    est.push(r.est);
    cursor = r.cursorAfter;
    prevItemId = r.prevItemId;
    totalWalk += r.walk;
    totalWait += r.wait;
    totalDuration += r.duration;
    totalBuffer += r.buffer;
  }

  return {
    stops: est,
    totalWalk,
    totalWait,
    totalDuration,
    totalBuffer,
    totalMinutes: totalWalk + totalWait + totalDuration + totalBuffer,
    endClock: formatClock(startAbs + cursor),
  };
}
