export type ParkId = 'mk' | 'epcot' | 'legoland' | 'resort';

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
  | 'experience'
  | 'food';

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
  /** One-line explanation of what the ride/attraction is. */
  description?: string;
  /** Gluten-free options available (food/dining locations). */
  gf?: boolean;
  /** Service style for food locations. */
  service?: 'table' | 'quick';
  /** Mobile Order ahead available (food locations). */
  mobileOrder?: boolean;
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

/** One parallel group within a split (e.g. "Boutique crew" vs "Rides crew"). */
export interface SplitBranch {
  id: string;
  name: string;
  /** This group's mini-route (item/custom stops only). */
  stops: PlanStop[];
  /** Collaborator ids (app users) assigned to this group. */
  members?: string[];
  /** Free-text names assigned (for people not using the app). */
  manualMembers?: string[];
}

/**
 * A single stop in a day's route:
 *  - 'item'   references an attraction/dining/experience,
 *  - 'custom' is a free time block,
 *  - 'split'  divides the party into parallel groups that rejoin afterward.
 */
export interface PlanStop {
  id: string;
  kind?: 'item' | 'custom' | 'split';
  /** Set when kind === 'item'. */
  attractionId?: string;
  /** Set when kind === 'custom'. */
  custom?: CustomEntry;
  /** Set when kind === 'split'. */
  branches?: SplitBranch[];
  /** Optional soft target arrival time, "HH:MM" 24h (shows early/late). */
  arrival?: string;
  /** Pinned exact start time, "HH:MM" 24h (e.g. a parade) — anchors the clock. */
  fixedTime?: string;
  /**
   * Manual wait-time override in minutes (item stops only). Overrides the
   * avg/max/live estimate — handy for party nights (MNSSHP) where real waits
   * differ a lot from typical-day averages.
   */
  waitOverride?: number;
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
  /** Calendar date this day falls on, ISO "YYYY-MM-DD" (optional). */
  date?: string;
  /**
   * 'park' (default) days plan attractions at a specific park. 'other' days are
   * lightly scheduled non-park days (travel, rest, resort, dining) that only
   * hold free-form time blocks — no attractions, map, or wait estimates.
   */
  kind?: 'park' | 'other';
  /** Park operating hours & guest-perk windows for this day. */
  hours?: DayHours;
}

/** Park operating hours and resort-guest perk windows for a single day. */
export interface DayHours {
  /** Park open time, "HH:MM" 24h. */
  open?: string;
  /** Park close time, "HH:MM" 24h. */
  close?: string;
  /** Early Theme Park Entry — resort guests enter ~30 min early. */
  earlyEntry?: boolean;
  /** Extended Evening hours — deluxe/club guests stay late on select nights. */
  extendedEvening?: boolean;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
}

/**
 * A suggested personal/packing item. The list of items is shared (anyone can
 * add, and it appears for everyone), but each person's done/checked status is
 * tracked locally per device — see the store's `checkedItems`.
 */
export interface ChecklistItem {
  id: string;
  text: string;
  /** Collaborator id who added it (undefined for seeded suggestions). */
  addedBy?: string;
  /**
   * Private items are only visible to the collaborator who added them
   * (`addedBy`); shared items appear on everyone's list as suggestions.
   */
  private?: boolean;
  /** Optional free-text note shown under the item. */
  note?: string;
  /** Optional quantity to pack (e.g. 5 shirts). */
  qty?: number;
}

/** A shared group task people can sign up for. */
export interface GroupItem {
  id: string;
  text: string;
  addedBy?: string;
  /** Collaborator ids (app users) who have signed up for this item. */
  signups: string[];
  /** Free-text names signed up manually (for people not using the app). */
  manualSignups?: string[];
  /** Shared completion flag — the task is done (anyone can check it off). */
  done?: boolean;
  /** Optional free-text note shown under the item. */
  note?: string;
}

/** The full shared, synced plan document, spanning multiple days/parks. */
export interface PlanDoc {
  collaborators: Collaborator[];
  /** Collaborator id who owns the schedule (only they see the Schedule page). */
  ownerId?: string;
  /** Tags are global per item, shared across every day of the trip. */
  tags: TagEntry[];
  days: Day[];
  activeDayId: string;
  /** Shared personal/packing suggestions (each person checks them off). */
  personalItems: ChecklistItem[];
  /** Per-user checked item ids for the personal list, keyed by collaborator id. */
  personalChecks: Record<string, string[]>;
  /**
   * Per-user hidden item ids: when someone removes a shared item they didn't
   * add, it's hidden just for them rather than deleted for everyone. Keyed by
   * collaborator id.
   */
  personalHides: Record<string, string[]>;
  /** Shared group tasks people sign up for. */
  groupItems: GroupItem[];
  /** Highest seeded-group-task version merged in (so new defaults appear once). */
  seededGroupVersion?: number;
  /** Home meal plan + auto-generated grocery list. */
  meals: MealPlan;
  /** Shared trip info: confirmation numbers, addresses, contacts. */
  tripInfo: InfoItem[];
  /** Dining reservations (ADRs), surfaced on their matching schedule day. */
  dining: DiningReservation[];
  /** Shared trip expenses, split among collaborators. */
  expenses: Expense[];
  /**
   * Onboarding dismissal per account (synced): collaborator id → the onboarding
   * version they dismissed. Showing again for everyone is a matter of bumping
   * ONBOARDING_VERSION; users below the current version see it again.
   */
  onboardingDismissed: Record<string, number>;
}

export type InfoCategory = 'lodging' | 'tickets' | 'dining' | 'travel' | 'contact' | 'other';

/** One shared piece of trip info (a confirmation number, address, contact…). */
export interface InfoItem {
  id: string;
  label: string;
  value: string;
  category: InfoCategory;
  addedBy?: string;
}

/** A dining reservation (ADR). */
export interface DiningReservation {
  id: string;
  name: string;
  /** ISO date "YYYY-MM-DD". */
  date: string;
  /** Reservation time, "HH:MM" 24h. */
  time: string;
  partySize?: number;
  confirmation?: string;
  note?: string;
  /** Estimated total cost in dollars (for the whole party). */
  cost?: number;
  /** Set once pushed to the budget — links to the created Expense. */
  expenseId?: string;
}

/** A shared trip expense, split among the chosen people (default: everyone). */
export interface Expense {
  id: string;
  label: string;
  /** Amount in dollars. */
  amount: number;
  /** Collaborator id who paid. */
  paidBy?: string;
  /** ISO date "YYYY-MM-DD" (optional). */
  date?: string;
  /** Collaborator ids who share this cost. Empty/undefined = split among all. */
  splitAmong?: string[];
  /**
   * Custom (uneven) split: exact dollars each collaborator owes, keyed by id.
   * When present it overrides the even split (and `amount` equals their sum).
   */
  shares?: Record<string, number>;
}

/** A single ingredient and how much is needed per adult serving. */
export interface Ingredient {
  name: string;
  unit: string;
  /** Quantity needed per adult-equivalent serving. */
  perPerson: number;
  /** If this ingredient contains gluten, the gluten-free substitute to buy. */
  gfSub?: string;
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'out';

/** A known meal/recipe with its ingredient list. */
export interface Recipe {
  id: string;
  name: string;
  category: MealCategory;
  ingredients: Ingredient[];
  /** True for user-created recipes (stored in the plan, removable). */
  custom?: boolean;
}

/** A planned meal slot tied to a date (e.g. 2026-07-04 dinner → Tacos). */
export interface MealEntry {
  id: string;
  /** ISO date "YYYY-MM-DD" (empty string if unscheduled). */
  date: string;
  recipeId: string;
  /** Which meal slot this fills; overrides the recipe's own category. */
  course?: MealCategory;
}

/** A manually-added grocery item not tied to a recipe. */
export interface GroceryExtra {
  id: string;
  text: string;
  /** Optional free-text quantity (e.g. "2 gallons", "1 dozen"). */
  qty?: string;
}

export interface MealPlan {
  adults: number;
  kids: number;
  /** Number of gluten-free eaters; their portions use GF substitutes. */
  glutenFree: number;
  entries: MealEntry[];
  /** User-created recipes, available alongside the seeded catalog. */
  customRecipes: Recipe[];
  /** Checked-off grocery keys/ids (shared, so shoppers don't double-buy). */
  groceryChecked: string[];
  /** Manually-added grocery items. */
  extras: GroceryExtra[];
  /** Manual adjustments to auto-generated grocery lines, keyed by line key. */
  groceryOverrides: Record<string, { qty?: number; removed?: boolean }>;
  /** Who's getting each grocery item and from which store, keyed by line key/id. */
  groceryMeta: Record<string, { assignee?: string; store?: string }>;
}

/** Current live wait for an attraction, keyed by attraction id. */
export type LiveWaits = Record<string, { wait: number; isOpen: boolean }>;
