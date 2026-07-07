import type { EventType, ParkId } from '../lib/types';

/**
 * Special-event definitions and the date-gating that decides which event
 * day-types the organizer may pick for a given day.
 *
 * Rule: an event option only appears when the day's calendar date falls during
 * that event. Ticketed parties (MNSSHP / Very Merry Christmas Party) run on
 * explicit **select nights** (`dates`); the EPCOT festivals run **daily** across
 * a continuous window (`range`).
 *
 * ── Keeping these current ────────────────────────────────────────────────────
 * These are the officially published Walt Disney World 2026 dates. When Disney
 * announces a new year (usually each spring), update the arrays/ranges below —
 * this is the one file to edit. Sources:
 *   • MNSSHP 2026 — disneyparksblog.com / disneytouristblog.com (38 select nights)
 *   • Food & Wine 2026 — Aug 27–Nov 21 (disneyparksblog.com)
 *   • Very Merry Christmas Party 2026 — Nov 8–Dec 22 select nights (disneyparksblog.com)
 *   • Festival of the Holidays 2026 — Nov 27–Dec 30 (disneyparksblog.com)
 */
export interface TripEventDef {
  /** The event's day-type value (never 'regular'). */
  type: Exclude<EventType, 'regular'>;
  /** Which park hosts it. */
  park: ParkId;
  /** Full label (dropdowns, headers). */
  label: string;
  /** Short label (day-tab badges). */
  shortLabel: string;
  /** Tailwind badge classes for the day-tab pill. */
  badgeClass: string;
  /**
   * Explicit ISO "YYYY-MM-DD" select-night dates (ticketed parties). When set,
   * the event is only offered on exactly these dates.
   */
  dates?: string[];
  /**
   * Continuous inclusive ISO date window (daily festivals). Used when `dates`
   * is absent — the event is offered on any date within [start, end].
   */
  range?: { start: string; end: string };
}

/** Mickey's Not-So-Scary Halloween Party 2026 — 38 select nights (Aug 7–Oct 31). */
const MNSSHP_2026 = [
  // August (9)
  '2026-08-07', '2026-08-11', '2026-08-14', '2026-08-18', '2026-08-21',
  '2026-08-23', '2026-08-25', '2026-08-28', '2026-08-30',
  // September (13)
  '2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-13',
  '2026-09-15', '2026-09-18', '2026-09-20', '2026-09-22', '2026-09-24',
  '2026-09-25', '2026-09-27', '2026-09-29',
  // October (16)
  '2026-10-01', '2026-10-02', '2026-10-04', '2026-10-06', '2026-10-08',
  '2026-10-09', '2026-10-13', '2026-10-15', '2026-10-16', '2026-10-18',
  '2026-10-22', '2026-10-23', '2026-10-25', '2026-10-27', '2026-10-29',
  '2026-10-31',
];

/** Mickey's Very Merry Christmas Party 2026 — select nights (Nov 8–Dec 22). */
const MVMCP_2026 = [
  // November
  '2026-11-08', '2026-11-09', '2026-11-12', '2026-11-13', '2026-11-15',
  '2026-11-17', '2026-11-19', '2026-11-20', '2026-11-24', '2026-11-25',
  '2026-11-27', '2026-11-29',
  // December
  '2026-12-01', '2026-12-03', '2026-12-04', '2026-12-06', '2026-12-08',
  '2026-12-10', '2026-12-11', '2026-12-13', '2026-12-15', '2026-12-17',
  '2026-12-18', '2026-12-20', '2026-12-22',
];

export const TRIP_EVENTS: TripEventDef[] = [
  {
    type: 'mnsshp',
    park: 'mk',
    label: "Mickey's Not-So-Scary Halloween Party",
    shortLabel: 'MNSSHP',
    badgeClass: 'bg-purple-100 text-purple-700',
    dates: MNSSHP_2026,
  },
  {
    type: 'mvmcp',
    park: 'mk',
    label: "Mickey's Very Merry Christmas Party",
    shortLabel: 'Very Merry',
    badgeClass: 'bg-rose-100 text-rose-700',
    dates: MVMCP_2026,
  },
  {
    type: 'food-and-wine',
    park: 'epcot',
    label: 'EPCOT International Food & Wine Festival',
    shortLabel: 'Food & Wine',
    badgeClass: 'bg-amber-100 text-amber-700',
    range: { start: '2026-08-27', end: '2026-11-21' },
  },
  {
    type: 'holidays',
    park: 'epcot',
    label: 'EPCOT International Festival of the Holidays',
    shortLabel: 'Holidays',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    range: { start: '2026-11-27', end: '2026-12-30' },
  },
];

const EVENT_BY_TYPE: Record<string, TripEventDef> = Object.fromEntries(
  TRIP_EVENTS.map((e) => [e.type, e]),
);

/** Look up a special-event definition by its type (undefined for 'regular'). */
export function eventDef(type: EventType): TripEventDef | undefined {
  return EVENT_BY_TYPE[type];
}

/** True when `type` is available on the given ISO date (regular is always ok). */
export function eventAvailableOn(type: EventType, isoDate: string | undefined): boolean {
  if (type === 'regular') return true;
  const def = EVENT_BY_TYPE[type];
  if (!def || !isoDate) return false;
  if (def.dates) return def.dates.includes(isoDate);
  if (def.range) return isoDate >= def.range.start && isoDate <= def.range.end;
  return false;
}

/**
 * The event day-types offered for a park on a given date. 'regular' is always
 * available; each special event is offered only when the date falls during it,
 * so party/festival options simply don't appear unless the day is scheduled
 * then. With no date set, only 'regular' is offered.
 */
export function eventsForParkOn(park: ParkId, isoDate: string | undefined): EventType[] {
  const events: EventType[] = ['regular'];
  for (const def of TRIP_EVENTS) {
    if (def.park === park && eventAvailableOn(def.type, isoDate)) events.push(def.type);
  }
  return events;
}
