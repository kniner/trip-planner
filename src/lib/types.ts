export type Land =
  | 'Main Street, U.S.A.'
  | 'Adventureland'
  | 'Frontierland'
  | 'Liberty Square'
  | 'Fantasyland'
  | 'Tomorrowland';

export type AttractionKind = 'ride' | 'show' | 'attraction';

/** Tag a collaborator can apply to an attraction. */
export type Tag = 'must' | 'nice' | 'avoid';

/** How the plan estimator models the time spent in a queue. */
export type WaitMode = 'avg' | 'max' | 'live';

/** Group walking pace; scales the base walking-time estimate. */
export type Pace = 'slow' | 'average' | 'fast';

export interface Attraction {
  id: string;
  name: string;
  land: Land;
  kind: AttractionKind;
  /** Typical average wait in minutes. */
  avgWait: number;
  /** Typical peak/max wait in minutes. */
  maxWait: number;
  /** Ride/show experience duration in minutes (excludes queue). */
  duration: number;
  /**
   * Approximate position in the park, in meters, on a ~600x600m grid.
   * Used to estimate walking distance between stops.
   */
  coords: { x: number; y: number };
  /** Name used to match this attraction against the live queue-times feed. */
  liveName?: string;
}

/** A tag applied by a specific collaborator. */
export interface TagEntry {
  attractionId: string;
  userId: string;
  tag: Tag;
}

/** A single stop in the day's route. */
export interface PlanStop {
  id: string;
  attractionId: string;
  /** Optional target arrival time, "HH:MM" 24h. */
  arrival?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
}

/** The full shared, synced plan document. */
export interface PlanDoc {
  collaborators: Collaborator[];
  tags: TagEntry[];
  stops: PlanStop[];
  settings: {
    pace: Pace;
    waitMode: WaitMode;
    /** Day start time, "HH:MM" 24h, used as the route's clock origin. */
    startTime: string;
  };
}

/** Current live wait for an attraction, keyed by attraction id. */
export type LiveWaits = Record<string, { wait: number; isOpen: boolean }>;
