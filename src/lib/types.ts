export type ParkId = 'mk' | 'epcot';

/**
 * The kind of "day" being planned. Regular park days show standard attractions;
 * event days additionally surface event-exclusive experiences (and hide nothing
 * — you can still ride normal rides during a party or festival).
 */
export type EventType = 'regular' | 'mnsshp' | 'food-and-wine';

export type AttractionKind =
  | 'ride'
  | 'show'
  | 'attraction'
  | 'dining'
  | 'festival'
  | 'entertainment'
  | 'experience';

/** Tag a collaborator can apply to an attraction. */
export type Tag = 'must' | 'nice' | 'avoid';

/** How the plan estimator models the time spent in a queue. */
export type WaitMode = 'avg' | 'max' | 'live';

/** Group walking pace; scales the base walking-time estimate. */
export type Pace = 'slow' | 'average' | 'fast';

export interface Attraction {
  id: string;
  name: string;
  /** Land / pavilion / area within the park. */
  land: string;
  park: ParkId;
  kind: AttractionKind;
  /** Typical average wait in minutes. */
  avgWait: number;
  /** Typical peak/max wait in minutes. */
  maxWait: number;
  /** Ride/show/visit duration in minutes (excludes queue). */
  duration: number;
  /**
   * Approximate position in the park, in meters, on a per-park grid.
   * Used to estimate walking distance between stops in the same park.
   */
  coords: { x: number; y: number };
  /** Name used to match this attraction against the live queue-times feed. */
  liveName?: string;
  /**
   * If set, this experience is exclusive to a single event (e.g. an MNSSHP
   * parade, or a Food & Wine marketplace) and only appears on days of that
   * event. If unset, the item is available on any day of its park.
   */
  onlyDuringEvent?: EventType;
  /** Short note shown on the card (e.g. characters at a dining location). */
  note?: string;
}

/** A tag applied by a specific collaborator. */
export interface TagEntry {
  attractionId: string;
  userId: string;
  tag: Tag;
}

/** A free-form timeline block: travel, security, parking, a break, etc. */
export interface CustomEntry {
  name: string;
  durationMin: number;
  address?: string;
}

/** A single stop in a day's route — either a park item or a custom block. */
export interface PlanStop {
  id: string;
  /** 'item' references an attraction/dining/etc.; 'custom' is a free block. */
  kind?: 'item' | 'custom';
  /** Set when kind === 'item'. */
  attractionId?: string;
  /** Set when kind === 'custom'. */
  custom?: CustomEntry;
  /** Optional target arrival time, "HH:MM" 24h. */
  arrival?: string;
}

export interface PlanSettings {
  pace: Pace;
  waitMode: WaitMode;
  /** Day start time, "HH:MM" 24h, used as the route's clock origin. */
  startTime: string;
  /** Slack minutes automatically added to every attraction stop. */
  bufferPerStop: number;
}

/** One planned day: a park, an event mode, a route, and its settings. */
export interface Day {
  id: string;
  name: string;
  park: ParkId;
  event: EventType;
  stops: PlanStop[];
  settings: PlanSettings;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
}

/** The full shared, synced plan document, spanning multiple days/parks. */
export interface PlanDoc {
  collaborators: Collaborator[];
  /** Tags are global per item, shared across every day of the trip. */
  tags: TagEntry[];
  days: Day[];
  activeDayId: string;
}

/** Current live wait for an attraction, keyed by attraction id. */
export type LiveWaits = Record<string, { wait: number; isOpen: boolean }>;
