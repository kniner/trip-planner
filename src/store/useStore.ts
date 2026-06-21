import { create } from 'zustand';
import { ITEMS_BY_ID, PARKS } from '../data';
import { SUGGESTED_GROUP, SUGGESTED_PERSONAL } from '../data/checklist';
import { distanceMeters } from '../lib/walking';
import type {
  Collaborator,
  CustomEntry,
  Day,
  DayHours,
  DiningReservation,
  EventType,
  Expense,
  InfoCategory,
  LiveWaits,
  MealCategory,
  Pace,
  ParkId,
  PlanDoc,
  Recipe,
  SplitBranch,
  Tag,
  WaitMode,
} from '../lib/types';
import { fetchLiveWaits } from '../lib/waitTimes';
import { createSyncProvider, type SyncProvider } from './sync';

const COLORS = [
  '#e11d48', '#7c3aed', '#0891b2', '#ea580c',
  '#16a34a', '#db2777', '#ca8a04', '#2563eb',
];

const ME_KEY = 'mk-planner:me';
/** Legacy local checked status — migrated into the synced doc per user. */
const CHECKED_KEY = 'mk-planner:checked';

/**
 * First-run onboarding version. Bump this to re-show the onboarding to everyone
 * (accounts that dismissed an older version fall below the current one).
 */
export const ONBOARDING_VERSION = 1;

/**
 * Seeded group-task version. Bump when adding new default group sign-ups so the
 * new ones get merged once into existing trips (by id; deleted ones aren't
 * re-added past this version).
 */
const SEEDED_GROUP_VERSION = 2;

/**
 * The designated schedule owner, pinned by name so it can't be self-claimed.
 * Whoever joins under this name is the owner regardless of join order; change
 * this to hand the role to a different person.
 */
const OWNER_NAME = 'Kate';

/** Resolve the owner id: the designated owner by name, else the stored owner,
 * else the first member. */
function resolveOwnerId(
  collaborators: Collaborator[],
  storedOwnerId: string | undefined,
): string | undefined {
  const designated = collaborators.find((c) => nameKey(c.name) === nameKey(OWNER_NAME));
  if (designated) return designated.id;
  if (storedOwnerId && collaborators.some((c) => c.id === storedOwnerId)) return storedOwnerId;
  return collaborators[0]?.id;
}

/** Case-insensitive, whitespace-normalized key for matching names. */
function nameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function loadLegacyChecked(): string[] {
  try {
    const raw = localStorage.getItem(CHECKED_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, boolean>;
    return Object.keys(map).filter((id) => map[id]);
  } catch {
    return [];
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function defaultDayName(park: ParkId, event: EventType): string {
  if (event === 'mnsshp') return 'MNSSHP Night';
  if (event === 'food-and-wine') return 'EPCOT — Food & Wine';
  return `${PARKS[park].shortName} Day`;
}

function newDay(park: ParkId, event: EventType, name?: string, date?: string): Day {
  return {
    id: uid(),
    name: name ?? defaultDayName(park, event),
    park,
    event,
    stops: [],
    settings: { pace: 'average', waitMode: 'avg', startTime: '09:00', bufferPerStop: 0 },
    kind: 'park',
    ...(date ? { date } : {}),
  };
}

/** A lightly-scheduled non-park day (travel, rest, resort, dining). */
function newOtherDay(name?: string, date?: string): Day {
  return {
    id: uid(),
    name: name?.trim() || 'Off-park day',
    park: 'mk', // unused for 'other' days; kept valid so park lookups never crash
    event: 'regular',
    stops: [],
    settings: { pace: 'average', waitMode: 'avg', startTime: '09:00', bufferPerStop: 0 },
    kind: 'other',
    ...(date ? { date } : {}),
  };
}

function emptyMealPlan(): PlanDoc['meals'] {
  return {
    adults: 8,
    kids: 3,
    glutenFree: 1,
    entries: [],
    customRecipes: [],
    groceryChecked: [],
    extras: [],
    groceryOverrides: {},
    groceryMeta: {},
  };
}

function emptyDoc(): PlanDoc {
  const day = newDay('mk', 'regular', 'Magic Kingdom — Day 1');
  return {
    collaborators: [],
    tags: [],
    days: [day],
    activeDayId: day.id,
    personalItems: [...SUGGESTED_PERSONAL],
    personalChecks: {},
    personalHides: {},
    groupItems: [...SUGGESTED_GROUP],
    seededGroupVersion: SEEDED_GROUP_VERSION,
    meals: emptyMealPlan(),
    tripInfo: [],
    dining: [],
    expenses: [],
    onboardingDismissed: {},
  };
}

/**
 * Normalize one day so a malformed/older shape (missing settings, bad park,
 * non-array stops) can never crash the estimator or UI. This matters because
 * every remote update is migrated, so one bad write must not white-screen
 * every connected client.
 */
function normalizeDay(d: Partial<Day> | undefined): Day {
  const raw = (d ?? {}) as Partial<Day>;
  const park: ParkId = raw.park && PARKS[raw.park] ? raw.park : 'mk';
  const event: EventType =
    raw.event === 'mnsshp' || raw.event === 'food-and-wine' ? raw.event : 'regular';
  const s = (raw.settings ?? {}) as Partial<Day['settings']>;
  const kind: Day['kind'] = raw.kind === 'other' ? 'other' : 'park';
  return {
    id: typeof raw.id === 'string' ? raw.id : uid(),
    name:
      typeof raw.name === 'string' && raw.name
        ? raw.name
        : kind === 'other'
          ? 'Off-park day'
          : defaultDayName(park, event),
    park,
    event,
    stops: Array.isArray(raw.stops) ? raw.stops : [],
    settings: {
      pace: s.pace === 'slow' || s.pace === 'fast' ? s.pace : 'average',
      waitMode: s.waitMode === 'max' || s.waitMode === 'live' ? s.waitMode : 'avg',
      startTime: typeof s.startTime === 'string' ? s.startTime : '09:00',
      bufferPerStop: typeof s.bufferPerStop === 'number' ? s.bufferPerStop : 0,
    },
    kind,
    ...(typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
      ? { date: raw.date }
      : {}),
    ...(raw.hours ? { hours: normalizeHours(raw.hours) } : {}),
  };
}

/** Keep only well-formed "HH:MM" times and boolean perk flags. */
function normalizeHours(h: Partial<DayHours>): DayHours {
  const time = (v: unknown): string | undefined =>
    typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : undefined;
  return {
    ...(time(h.open) ? { open: time(h.open) } : {}),
    ...(time(h.close) ? { close: time(h.close) } : {}),
    ...(h.earlyEntry ? { earlyEntry: true } : {}),
    ...(h.extendedEvening ? { extendedEvening: true } : {}),
  };
}

/**
 * Order days chronologically: dated days ascending (ISO strings compare
 * correctly), undated days kept last in their existing relative order. Used
 * everywhere days change so the persisted order always reflects the calendar.
 */
function sortDays(days: Day[]): Day[] {
  return [...days].sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

/**
 * Bring older/partial persisted docs up to the current shape. Early versions
 * stored a single top-level `stops`/`settings`; wrap those into a default
 * Magic Kingdom day so existing plans aren't lost.
 */
function migrate(raw: unknown): PlanDoc {
  const doc = (raw ?? {}) as Partial<PlanDoc> & {
    stops?: Day['stops'];
    settings?: Day['settings'];
  };
  let days = Array.isArray(doc.days) ? doc.days : undefined;
  if (!days || days.length === 0) {
    const legacy = newDay('mk', 'regular', 'Magic Kingdom — Day 1');
    if (doc.stops) legacy.stops = doc.stops;
    if (doc.settings) legacy.settings = doc.settings;
    days = [legacy];
  }
  days = sortDays(days.map(normalizeDay));
  const activeDayId = days.some((d) => d.id === doc.activeDayId)
    ? doc.activeDayId!
    : days[0].id;
  const collaborators = Array.isArray(doc.collaborators) ? doc.collaborators : [];
  // Merge in any newly-seeded group tasks (by id) once per seed version, so new
  // defaults reach existing trips without re-adding ones a user has deleted.
  const baseGroup = Array.isArray(doc.groupItems) ? doc.groupItems : [...SUGGESTED_GROUP];
  const seededGroupVersion =
    typeof doc.seededGroupVersion === 'number' ? doc.seededGroupVersion : 0;
  const groupItems =
    seededGroupVersion < SEEDED_GROUP_VERSION
      ? [...baseGroup, ...SUGGESTED_GROUP.filter((s) => !baseGroup.some((g) => g.id === s.id))]
      : baseGroup;
  return {
    collaborators,
    ownerId: resolveOwnerId(collaborators, doc.ownerId),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    days,
    activeDayId,
    personalItems: Array.isArray(doc.personalItems) ? doc.personalItems : [...SUGGESTED_PERSONAL],
    personalChecks: doc.personalChecks ?? {},
    personalHides: doc.personalHides ?? {},
    groupItems,
    seededGroupVersion: SEEDED_GROUP_VERSION,
    meals: doc.meals ? { ...emptyMealPlan(), ...doc.meals } : emptyMealPlan(),
    tripInfo: Array.isArray(doc.tripInfo) ? doc.tripInfo : [],
    dining: Array.isArray(doc.dining) ? doc.dining : [],
    expenses: Array.isArray(doc.expenses) ? doc.expenses : [],
    // Anything not already a version-map (e.g. the old string[] form) resets to
    // {} — which restarts onboarding for everyone.
    onboardingDismissed:
      doc.onboardingDismissed &&
      typeof doc.onboardingDismissed === 'object' &&
      !Array.isArray(doc.onboardingDismissed)
        ? (doc.onboardingDismissed as Record<string, number>)
        : {},
  };
}

interface StoreState {
  doc: PlanDoc;
  meId: string | null;
  live: LiveWaits;
  liveStatus: 'idle' | 'loading' | 'ok' | 'unavailable';
  ready: boolean;

  init: () => Promise<void>;
  join: (name: string) => void;
  leave: () => void;
  /** Dismiss the first-run checklist for the current account (synced). */
  dismissOnboarding: () => void;
  removeCollaborator: (userId: string) => void;

  // Days
  setActiveDay: (dayId: string) => void;
  addDay: (park: ParkId, event: EventType, name?: string, date?: string) => void;
  addOtherDay: (name?: string, date?: string) => void;
  removeDay: (dayId: string) => void;
  renameDay: (dayId: string, name: string) => void;
  setDayDate: (dayId: string, date: string | undefined) => void;
  setDayHours: (dayId: string, hours: DayHours) => void;

  setTag: (attractionId: string, tag: Tag | null) => void;

  // Route (operates on the active day)
  addStop: (attractionId: string) => void;
  addCustomStop: (entry: CustomEntry, fixedTime?: string) => void;
  removeStop: (stopId: string) => void;
  moveStop: (stopId: string, dir: -1 | 1) => void;
  setArrival: (stopId: string, arrival: string | undefined) => void;
  setFixedTime: (stopId: string, fixedTime: string | undefined) => void;
  setWaitOverride: (stopId: string, minutes: number | undefined) => void;
  reorderToLandRoute: () => void;

  // Parallel split groups (operate on the active day)
  addSplit: () => void;
  addBranch: (splitId: string) => void;
  removeBranch: (splitId: string, branchId: string) => void;
  renameBranch: (splitId: string, branchId: string, name: string) => void;
  addToBranch: (splitId: string, branchId: string, attractionId: string) => void;
  addCustomToBranch: (splitId: string, branchId: string, entry: CustomEntry) => void;
  removeFromBranch: (splitId: string, branchId: string, stopId: string) => void;
  toggleBranchMember: (splitId: string, branchId: string, userId: string) => void;
  addBranchManualMember: (splitId: string, branchId: string, name: string) => void;
  removeBranchManualMember: (splitId: string, branchId: string, name: string) => void;
  moveWithinBranch: (splitId: string, branchId: string, stopId: string, dir: -1 | 1) => void;

  setPace: (pace: Pace) => void;
  setWaitMode: (mode: WaitMode) => void;
  setStartTime: (time: string) => void;
  setBuffer: (minutes: number) => void;

  // Checklist & group sign-up lists
  addPersonalItem: (text: string, isPrivate?: boolean) => void;
  removePersonalItem: (id: string) => void;
  /** Hide a shared item just for the current user (they didn't add it). */
  hidePersonalItem: (id: string) => void;
  setPersonalItemText: (id: string, text: string) => void;
  setPersonalItemNote: (id: string, note: string) => void;
  setPersonalItemQty: (id: string, qty: number | undefined) => void;
  toggleChecked: (id: string) => void;
  addGroupItem: (text: string) => void;
  removeGroupItem: (id: string) => void;
  setGroupItemText: (id: string, text: string) => void;
  setGroupItemNote: (id: string, note: string) => void;
  toggleGroupDone: (id: string) => void;
  toggleSignup: (id: string) => void;
  addManualSignup: (id: string, name: string) => void;
  removeManualSignup: (id: string, name: string) => void;

  // Meal planner
  setMealHeadcount: (adults: number, kids: number) => void;
  setGlutenFree: (count: number) => void;
  addMealEntry: (date: string, recipeId: string, course?: MealCategory) => void;
  updateMealEntry: (
    id: string,
    patch: Partial<{ date: string; recipeId: string; course: MealCategory }>,
  ) => void;
  removeMealEntry: (id: string) => void;
  addCustomRecipe: (recipe: Recipe) => void;
  removeCustomRecipe: (id: string) => void;
  toggleGrocery: (key: string) => void;
  addGroceryExtra: (text: string, qty?: string) => void;
  setGroceryExtraQty: (id: string, qty: string) => void;
  removeGroceryExtra: (id: string) => void;
  setGroceryQty: (key: string, qty: number) => void;
  removeGroceryLine: (key: string) => void;
  resetGroceryLine: (key: string) => void;
  toggleGroceryClaim: (key: string) => void;
  setGroceryStore: (key: string, store: string) => void;
  /** Add a claimed "from home" grocery item to the claimer's packing list. */
  addHomePackItem: (name: string) => void;

  // Trip info hub
  addInfoItem: (label: string, value: string, category: InfoCategory) => void;
  removeInfoItem: (id: string) => void;

  // Dining reservations
  addDining: (res: Omit<DiningReservation, 'id'>) => void;
  removeDining: (id: string) => void;
  /** Push a reservation's cost to the budget as a split expense ("request split"). */
  splitDiningCost: (id: string, opts: { paidBy?: string; splitAmong?: string[] }) => void;
  /** Undo a requested split: remove the linked expense and mark it "split later". */
  unlinkDiningCost: (id: string) => void;

  // Expenses
  addExpense: (exp: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => void;
  removeExpense: (id: string) => void;

  refreshLive: () => Promise<void>;
}

const provider: SyncProvider = createSyncProvider();

export const useStore = create<StoreState>((set, get) => {
  const commit = (doc: PlanDoc) => {
    set({ doc });
    void provider.save(doc);
  };

  /** Apply a transform to the active day and commit. */
  const updateActiveDay = (fn: (day: Day) => Day) => {
    const doc = get().doc;
    const days = doc.days.map((d) => (d.id === doc.activeDayId ? fn(d) : d));
    commit({ ...doc, days });
  };

  /** Apply a transform to a split stop's branches in the active day. */
  const updateBranches = (
    splitId: string,
    fn: (branches: SplitBranch[]) => SplitBranch[],
  ) => {
    updateActiveDay((day) => ({
      ...day,
      stops: day.stops.map((s) =>
        s.id === splitId && s.kind === 'split'
          ? { ...s, branches: fn(s.branches ?? []) }
          : s,
      ),
    }));
  };

  const me = () => get().meId;

  return {
    doc: emptyDoc(),
    meId: null,
    live: {},
    liveStatus: 'idle',
    ready: false,

    async init() {
      const remote = await provider.load();
      const storedMe = localStorage.getItem(ME_KEY);
      const doc = migrate(remote);
      set({ doc, meId: storedMe, ready: true });

      // Persist a one-time seed merge (e.g. new default group tasks) so it sticks
      // for the whole trip instead of re-merging on every load.
      const rawSeedVersion = (remote as Partial<PlanDoc> | null)?.seededGroupVersion;
      if (typeof rawSeedVersion !== 'number' || rawSeedVersion < SEEDED_GROUP_VERSION) {
        commit(doc);
      }

      // One-time migration: fold any legacy device-local checkmarks into this
      // user's cloud-backed checks, then drop the local copy.
      const legacy = loadLegacyChecked();
      if (storedMe && legacy.length > 0) {
        const existing = doc.personalChecks[storedMe] ?? [];
        const merged = Array.from(new Set([...existing, ...legacy]));
        commit({ ...doc, personalChecks: { ...doc.personalChecks, [storedMe]: merged } });
      }
      localStorage.removeItem(CHECKED_KEY);

      provider.subscribe((d) => set({ doc: migrate(d) }));
      void get().refreshLive();
    },

    join(name) {
      const clean = name.trim() || 'Guest';
      const doc = get().doc;

      // Returning user: same name (case-insensitive) resumes as the same person,
      // keeping all their existing tags — no duplicate collaborator.
      const existing = doc.collaborators.find((c) => nameKey(c.name) === nameKey(clean));
      if (existing) {
        localStorage.setItem(ME_KEY, existing.id);
        set({ meId: existing.id });
        return;
      }

      const id = uid();
      const color = COLORS[doc.collaborators.length % COLORS.length];
      const collaborator: Collaborator = { id, name: clean, color };
      localStorage.setItem(ME_KEY, id);
      set({ meId: id });
      // The very first member to join becomes the schedule owner by default.
      const ownerId = doc.collaborators.length === 0 && !doc.ownerId ? id : doc.ownerId;
      commit({ ...doc, collaborators: [...doc.collaborators, collaborator], ownerId });
    },

    leave() {
      localStorage.removeItem(ME_KEY);
      set({ meId: null });
    },

    dismissOnboarding() {
      const meId = me();
      if (!meId) return;
      const doc = get().doc;
      if (doc.onboardingDismissed[meId] === ONBOARDING_VERSION) return;
      commit({
        ...doc,
        onboardingDismissed: { ...doc.onboardingDismissed, [meId]: ONBOARDING_VERSION },
      });
    },

    removeCollaborator(userId) {
      const doc = get().doc;
      const { [userId]: _removed, ...personalChecks } = doc.personalChecks;
      void _removed;
      const { [userId]: _removedHides, ...personalHides } = doc.personalHides;
      void _removedHides;
      commit({
        ...doc,
        collaborators: doc.collaborators.filter((c) => c.id !== userId),
        personalHides,
        tags: doc.tags.filter((t) => t.userId !== userId),
        groupItems: doc.groupItems.map((i) => ({
          ...i,
          signups: i.signups.filter((u) => u !== userId),
        })),
        days: doc.days.map((d) => ({
          ...d,
          stops: d.stops.map((s) =>
            s.kind === 'split' && s.branches
              ? {
                  ...s,
                  branches: s.branches.map((b) => ({
                    ...b,
                    members: (b.members ?? []).filter((u) => u !== userId),
                  })),
                }
              : s,
          ),
        })),
        personalChecks,
        meals: {
          ...doc.meals,
          groceryMeta: Object.fromEntries(
            Object.entries(doc.meals.groceryMeta).map(([k, m]) =>
              m.assignee === userId ? [k, { ...m, assignee: undefined }] : [k, m],
            ),
          ),
        },
      });
      if (get().meId === userId) {
        localStorage.removeItem(ME_KEY);
        set({ meId: null });
      }
    },

    setActiveDay(dayId) {
      const doc = get().doc;
      if (!doc.days.some((d) => d.id === dayId)) return;
      commit({ ...doc, activeDayId: dayId });
    },

    addDay(park, event, name, date) {
      const doc = get().doc;
      const day = newDay(park, event, name, date);
      commit({ ...doc, days: sortDays([...doc.days, day]), activeDayId: day.id });
    },

    addOtherDay(name, date) {
      const doc = get().doc;
      const day = newOtherDay(name, date);
      commit({ ...doc, days: sortDays([...doc.days, day]), activeDayId: day.id });
    },

    removeDay(dayId) {
      const doc = get().doc;
      if (doc.days.length <= 1) return; // keep at least one day
      const days = doc.days.filter((d) => d.id !== dayId);
      const activeDayId =
        doc.activeDayId === dayId ? days[0].id : doc.activeDayId;
      commit({ ...doc, days, activeDayId });
    },

    renameDay(dayId, name) {
      const doc = get().doc;
      const days = doc.days.map((d) =>
        d.id === dayId ? { ...d, name: name.trim() || d.name } : d,
      );
      commit({ ...doc, days });
    },

    setDayDate(dayId, date) {
      const valid = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
      const doc = get().doc;
      const days = sortDays(doc.days.map((d) => (d.id === dayId ? { ...d, date: valid } : d)));
      commit({ ...doc, days });
    },

    setDayHours(dayId, hours) {
      const h = normalizeHours(hours);
      const hasAny = h.open || h.close || h.earlyEntry || h.extendedEvening;
      const doc = get().doc;
      const days = doc.days.map((d) =>
        d.id === dayId ? { ...d, hours: hasAny ? h : undefined } : d,
      );
      commit({ ...doc, days });
    },

    setTag(attractionId, tag) {
      const meId = me();
      if (!meId) return;
      const doc = get().doc;
      const rest = doc.tags.filter(
        (t) => !(t.attractionId === attractionId && t.userId === meId),
      );
      const tags = tag ? [...rest, { attractionId, userId: meId, tag }] : rest;
      commit({ ...doc, tags });
    },

    addStop(attractionId) {
      updateActiveDay((day) => {
        if (day.stops.some((s) => s.attractionId === attractionId)) return day;
        return {
          ...day,
          stops: [...day.stops, { id: uid(), kind: 'item', attractionId }],
        };
      });
    },

    addCustomStop(entry, fixedTime) {
      updateActiveDay((day) => ({
        ...day,
        stops: [
          ...day.stops,
          { id: uid(), kind: 'custom', custom: entry, ...(fixedTime ? { fixedTime } : {}) },
        ],
      }));
    },

    removeStop(stopId) {
      updateActiveDay((day) => ({
        ...day,
        stops: day.stops.filter((s) => s.id !== stopId),
      }));
    },

    moveStop(stopId, dir) {
      updateActiveDay((day) => {
        const stops = [...day.stops];
        const i = stops.findIndex((s) => s.id === stopId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= stops.length) return day;
        [stops[i], stops[j]] = [stops[j], stops[i]];
        return { ...day, stops };
      });
    },

    setArrival(stopId, arrival) {
      updateActiveDay((day) => ({
        ...day,
        stops: day.stops.map((s) =>
          s.id === stopId ? { ...s, arrival: arrival || undefined } : s,
        ),
      }));
    },

    setFixedTime(stopId, fixedTime) {
      updateActiveDay((day) => ({
        ...day,
        stops: day.stops.map((s) =>
          s.id === stopId ? { ...s, fixedTime: fixedTime || undefined } : s,
        ),
      }));
    },

    setWaitOverride(stopId, minutes) {
      const clean =
        typeof minutes === 'number' && Number.isFinite(minutes) && minutes >= 0
          ? Math.round(minutes)
          : undefined;
      updateActiveDay((day) => ({
        ...day,
        stops: day.stops.map((s) =>
          s.id === stopId ? { ...s, waitOverride: clean } : s,
        ),
      }));
    },

    reorderToLandRoute() {
      updateActiveDay((day) => {
        // Only optimize when every stop is a located item (custom blocks have
        // no coordinates and must keep their place in the timeline).
        const allItems = day.stops.every(
          (s) => s.kind !== 'custom' && s.attractionId && ITEMS_BY_ID[s.attractionId],
        );
        if (!allItems || day.stops.length < 3) return day;

        const remaining = [...day.stops];
        const ordered = [remaining.shift()!];
        while (remaining.length) {
          const last = ITEMS_BY_ID[ordered[ordered.length - 1].attractionId!];
          let best = 0;
          let bestD = Infinity;
          remaining.forEach((s, idx) => {
            const d = distanceMeters(last, ITEMS_BY_ID[s.attractionId!]);
            if (d < bestD) {
              bestD = d;
              best = idx;
            }
          });
          ordered.push(remaining.splice(best, 1)[0]);
        }
        return { ...day, stops: ordered };
      });
    },

    addSplit() {
      const branch = (name: string): SplitBranch => ({ id: uid(), name, stops: [] });
      updateActiveDay((day) => ({
        ...day,
        stops: [
          ...day.stops,
          { id: uid(), kind: 'split', branches: [branch('Group A'), branch('Group B')] },
        ],
      }));
    },

    addBranch(splitId) {
      updateBranches(splitId, (branches) => [
        ...branches,
        { id: uid(), name: `Group ${String.fromCharCode(65 + branches.length)}`, stops: [] },
      ]);
    },

    removeBranch(splitId, branchId) {
      updateBranches(splitId, (branches) =>
        branches.length <= 1 ? branches : branches.filter((b) => b.id !== branchId),
      );
    },

    renameBranch(splitId, branchId, name) {
      updateBranches(splitId, (branches) =>
        branches.map((b) => (b.id === branchId ? { ...b, name: name.trim() || b.name } : b)),
      );
    },

    addToBranch(splitId, branchId, attractionId) {
      updateBranches(splitId, (branches) =>
        branches.map((b) => {
          if (b.id !== branchId) return b;
          if (b.stops.some((s) => s.attractionId === attractionId)) return b;
          return { ...b, stops: [...b.stops, { id: uid(), kind: 'item', attractionId }] };
        }),
      );
    },

    addCustomToBranch(splitId, branchId, entry) {
      updateBranches(splitId, (branches) =>
        branches.map((b) =>
          b.id === branchId
            ? { ...b, stops: [...b.stops, { id: uid(), kind: 'custom', custom: entry }] }
            : b,
        ),
      );
    },

    removeFromBranch(splitId, branchId, stopId) {
      updateBranches(splitId, (branches) =>
        branches.map((b) =>
          b.id === branchId ? { ...b, stops: b.stops.filter((s) => s.id !== stopId) } : b,
        ),
      );
    },

    toggleBranchMember(splitId, branchId, userId) {
      updateBranches(splitId, (branches) =>
        branches.map((b) => {
          if (b.id !== branchId) return b;
          const members = b.members ?? [];
          return {
            ...b,
            members: members.includes(userId)
              ? members.filter((u) => u !== userId)
              : [...members, userId],
          };
        }),
      );
    },

    addBranchManualMember(splitId, branchId, name) {
      const clean = name.trim();
      if (!clean) return;
      updateBranches(splitId, (branches) =>
        branches.map((b) => {
          if (b.id !== branchId) return b;
          const manual = b.manualMembers ?? [];
          if (manual.some((n) => nameKey(n) === nameKey(clean))) return b;
          return { ...b, manualMembers: [...manual, clean] };
        }),
      );
    },

    removeBranchManualMember(splitId, branchId, name) {
      updateBranches(splitId, (branches) =>
        branches.map((b) =>
          b.id === branchId
            ? { ...b, manualMembers: (b.manualMembers ?? []).filter((n) => n !== name) }
            : b,
        ),
      );
    },

    moveWithinBranch(splitId, branchId, stopId, dir) {
      updateBranches(splitId, (branches) =>
        branches.map((b) => {
          if (b.id !== branchId) return b;
          const stops = [...b.stops];
          const i = stops.findIndex((s) => s.id === stopId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= stops.length) return b;
          [stops[i], stops[j]] = [stops[j], stops[i]];
          return { ...b, stops };
        }),
      );
    },

    setPace(pace) {
      updateActiveDay((day) => ({ ...day, settings: { ...day.settings, pace } }));
    },

    setWaitMode(waitMode) {
      updateActiveDay((day) => ({ ...day, settings: { ...day.settings, waitMode } }));
    },

    setStartTime(startTime) {
      updateActiveDay((day) => ({ ...day, settings: { ...day.settings, startTime } }));
    },

    setBuffer(minutes) {
      updateActiveDay((day) => ({
        ...day,
        settings: { ...day.settings, bufferPerStop: Math.max(0, minutes) },
      }));
    },

    addPersonalItem(text, isPrivate) {
      const clean = text.trim();
      if (!clean) return;
      const doc = get().doc;
      commit({
        ...doc,
        personalItems: [
          ...doc.personalItems,
          { id: uid(), text: clean, addedBy: me() ?? undefined, ...(isPrivate ? { private: true } : {}) },
        ],
      });
    },

    removePersonalItem(id) {
      const doc = get().doc;
      commit({ ...doc, personalItems: doc.personalItems.filter((i) => i.id !== id) });
    },

    hidePersonalItem(id) {
      const meId = me();
      if (!meId) return;
      const doc = get().doc;
      const cur = doc.personalHides[meId] ?? [];
      if (cur.includes(id)) return;
      commit({ ...doc, personalHides: { ...doc.personalHides, [meId]: [...cur, id] } });
    },

    setPersonalItemText(id, text) {
      const clean = text.trim();
      if (!clean) return; // don't let an item lose its label
      const doc = get().doc;
      commit({
        ...doc,
        personalItems: doc.personalItems.map((i) => (i.id === id ? { ...i, text: clean } : i)),
      });
    },

    setPersonalItemNote(id, note) {
      const doc = get().doc;
      const clean = note.trim();
      commit({
        ...doc,
        personalItems: doc.personalItems.map((i) =>
          i.id === id ? { ...i, note: clean || undefined } : i,
        ),
      });
    },

    setPersonalItemQty(id, qty) {
      const clean = typeof qty === 'number' && Number.isFinite(qty) && qty > 0 ? Math.round(qty) : undefined;
      const doc = get().doc;
      commit({
        ...doc,
        personalItems: doc.personalItems.map((i) => (i.id === id ? { ...i, qty: clean } : i)),
      });
    },

    toggleChecked(id) {
      const meId = me();
      if (!meId) return;
      const doc = get().doc;
      const current = doc.personalChecks[meId] ?? [];
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      commit({ ...doc, personalChecks: { ...doc.personalChecks, [meId]: next } });
    },

    addGroupItem(text) {
      const clean = text.trim();
      if (!clean) return;
      const doc = get().doc;
      commit({
        ...doc,
        groupItems: [...doc.groupItems, { id: uid(), text: clean, addedBy: me() ?? undefined, signups: [] }],
      });
    },

    removeGroupItem(id) {
      const doc = get().doc;
      commit({ ...doc, groupItems: doc.groupItems.filter((i) => i.id !== id) });
    },

    toggleGroupDone(id) {
      const doc = get().doc;
      commit({
        ...doc,
        groupItems: doc.groupItems.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
      });
    },

    setGroupItemText(id, text) {
      const clean = text.trim();
      if (!clean) return;
      const doc = get().doc;
      commit({
        ...doc,
        groupItems: doc.groupItems.map((i) => (i.id === id ? { ...i, text: clean } : i)),
      });
    },

    setGroupItemNote(id, note) {
      const doc = get().doc;
      const clean = note.trim();
      commit({
        ...doc,
        groupItems: doc.groupItems.map((i) =>
          i.id === id ? { ...i, note: clean || undefined } : i,
        ),
      });
    },

    toggleSignup(id) {
      const meId = me();
      if (!meId) return;
      const doc = get().doc;
      const item = doc.groupItems.find((i) => i.id === id);
      const signingUp = !!item && !item.signups.includes(meId);

      const groupItems = doc.groupItems.map((i) => {
        if (i.id !== id) return i;
        const signed = i.signups.includes(meId);
        return {
          ...i,
          signups: signed ? i.signups.filter((u) => u !== meId) : [...i.signups, meId],
        };
      });

      // Signing up for a task adds it to the shared packing checklist (if not
      // already there) so whoever's responsible remembers it.
      let personalItems = doc.personalItems;
      if (signingUp && item) {
        const exists = personalItems.some(
          (p) => p.text.trim().toLowerCase() === item.text.trim().toLowerCase(),
        );
        if (!exists) {
          personalItems = [...personalItems, { id: uid(), text: item.text, addedBy: meId }];
        }
      }

      commit({ ...doc, groupItems, personalItems });
    },

    addManualSignup(id, name) {
      const clean = name.trim();
      if (!clean) return;
      const doc = get().doc;
      commit({
        ...doc,
        groupItems: doc.groupItems.map((i) => {
          if (i.id !== id) return i;
          const manual = i.manualSignups ?? [];
          if (manual.some((n) => nameKey(n) === nameKey(clean))) return i;
          return { ...i, manualSignups: [...manual, clean] };
        }),
      });
    },

    removeManualSignup(id, name) {
      const doc = get().doc;
      commit({
        ...doc,
        groupItems: doc.groupItems.map((i) =>
          i.id === id
            ? { ...i, manualSignups: (i.manualSignups ?? []).filter((n) => n !== name) }
            : i,
        ),
      });
    },

    setMealHeadcount(adults, kids) {
      const doc = get().doc;
      commit({
        ...doc,
        meals: { ...doc.meals, adults: Math.max(0, adults), kids: Math.max(0, kids) },
      });
    },

    setGlutenFree(count) {
      const doc = get().doc;
      commit({ ...doc, meals: { ...doc.meals, glutenFree: Math.max(0, count) } });
    },

    addMealEntry(date, recipeId, course) {
      if (!recipeId) return;
      const doc = get().doc;
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          entries: [...doc.meals.entries, { id: uid(), date, recipeId, ...(course ? { course } : {}) }],
        },
      });
    },

    addCustomRecipe(recipe) {
      const doc = get().doc;
      commit({
        ...doc,
        meals: { ...doc.meals, customRecipes: [...doc.meals.customRecipes, recipe] },
      });
    },

    removeCustomRecipe(id) {
      const doc = get().doc;
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          customRecipes: doc.meals.customRecipes.filter((r) => r.id !== id),
          entries: doc.meals.entries.filter((e) => e.recipeId !== id),
        },
      });
    },

    updateMealEntry(id, patch) {
      const doc = get().doc;
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          entries: doc.meals.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        },
      });
    },

    removeMealEntry(id) {
      const doc = get().doc;
      commit({
        ...doc,
        meals: { ...doc.meals, entries: doc.meals.entries.filter((e) => e.id !== id) },
      });
    },

    toggleGrocery(key) {
      const doc = get().doc;
      const checked = doc.meals.groceryChecked;
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          groceryChecked: checked.includes(key)
            ? checked.filter((k) => k !== key)
            : [...checked, key],
        },
      });
    },

    addGroceryExtra(text, qty) {
      const clean = text.trim();
      if (!clean) return;
      const cleanQty = qty?.trim();
      const doc = get().doc;
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          extras: [...doc.meals.extras, { id: uid(), text: clean, ...(cleanQty ? { qty: cleanQty } : {}) }],
        },
      });
    },

    setGroceryExtraQty(id, qty) {
      const doc = get().doc;
      const clean = qty.trim();
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          extras: doc.meals.extras.map((x) =>
            x.id === id ? { ...x, qty: clean || undefined } : x,
          ),
        },
      });
    },

    setGroceryQty(key, qty) {
      const doc = get().doc;
      const prev = doc.meals.groceryOverrides[key] ?? {};
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          groceryOverrides: {
            ...doc.meals.groceryOverrides,
            [key]: { ...prev, qty: Math.max(0, qty) },
          },
        },
      });
    },

    removeGroceryLine(key) {
      const doc = get().doc;
      const prev = doc.meals.groceryOverrides[key] ?? {};
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          groceryOverrides: { ...doc.meals.groceryOverrides, [key]: { ...prev, removed: true } },
        },
      });
    },

    resetGroceryLine(key) {
      const doc = get().doc;
      const { [key]: _gone, ...rest } = doc.meals.groceryOverrides;
      void _gone;
      commit({ ...doc, meals: { ...doc.meals, groceryOverrides: rest } });
    },

    toggleGroceryClaim(key) {
      const meId = me();
      if (!meId) return;
      const doc = get().doc;
      const meta = doc.meals.groceryMeta[key] ?? {};
      const assignee = meta.assignee === meId ? undefined : meId;
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          groceryMeta: { ...doc.meals.groceryMeta, [key]: { ...meta, assignee } },
        },
      });
    },

    setGroceryStore(key, store) {
      const doc = get().doc;
      const meta = doc.meals.groceryMeta[key] ?? {};
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          groceryMeta: { ...doc.meals.groceryMeta, [key]: { ...meta, store: store.trim() || undefined } },
        },
      });
    },

    removeGroceryExtra(id) {
      const doc = get().doc;
      commit({
        ...doc,
        meals: { ...doc.meals, extras: doc.meals.extras.filter((x) => x.id !== id) },
      });
    },

    addHomePackItem(name) {
      const meId = me();
      if (!meId) return;
      const clean = name.trim();
      if (!clean) return;
      const text = `Bring from home: ${clean}`;
      const doc = get().doc;
      // Private to the claimer, and deduped so re-claiming never piles up copies.
      const exists = doc.personalItems.some(
        (p) => p.addedBy === meId && p.text.trim().toLowerCase() === text.toLowerCase(),
      );
      if (exists) return;
      commit({
        ...doc,
        personalItems: [
          ...doc.personalItems,
          { id: uid(), text, addedBy: meId, private: true },
        ],
      });
    },

    addInfoItem(label, value, category) {
      const l = label.trim();
      const v = value.trim();
      if (!l || !v) return;
      const doc = get().doc;
      commit({
        ...doc,
        tripInfo: [...doc.tripInfo, { id: uid(), label: l, value: v, category, addedBy: me() ?? undefined }],
      });
    },

    removeInfoItem(id) {
      const doc = get().doc;
      commit({ ...doc, tripInfo: doc.tripInfo.filter((i) => i.id !== id) });
    },

    addDining(res) {
      if (!res.name.trim() || !res.date) return;
      const doc = get().doc;
      commit({ ...doc, dining: [...doc.dining, { ...res, name: res.name.trim(), id: uid() }] });
    },

    removeDining(id) {
      const doc = get().doc;
      const r = doc.dining.find((d) => d.id === id);
      // Also drop any expense this reservation pushed to the budget.
      const expenses = r?.expenseId
        ? doc.expenses.filter((e) => e.id !== r.expenseId)
        : doc.expenses;
      commit({ ...doc, dining: doc.dining.filter((d) => d.id !== id), expenses });
    },

    splitDiningCost(id, opts) {
      const doc = get().doc;
      const r = doc.dining.find((d) => d.id === id);
      if (!r || !(r.cost && r.cost > 0) || r.expenseId) return;
      const allIds = doc.collaborators.map((c) => c.id);
      const chosen = (opts.splitAmong ?? []).filter((cid) => allIds.includes(cid));
      const expenseId = uid();
      const expense: Expense = {
        id: expenseId,
        label: `🍽 ${r.name}`,
        amount: r.cost,
        paidBy: opts.paidBy || undefined,
        // Store a subset only; full selection (or none) means "everyone".
        splitAmong: chosen.length > 0 && chosen.length < allIds.length ? chosen : undefined,
        ...(r.date ? { date: r.date } : {}),
      };
      const dining = doc.dining.map((d) => (d.id === id ? { ...d, expenseId } : d));
      commit({ ...doc, dining, expenses: [...doc.expenses, expense] });
    },

    unlinkDiningCost(id) {
      const doc = get().doc;
      const r = doc.dining.find((d) => d.id === id);
      if (!r) return;
      const expenses = r.expenseId
        ? doc.expenses.filter((e) => e.id !== r.expenseId)
        : doc.expenses;
      const dining = doc.dining.map((d) =>
        d.id === id ? { ...d, expenseId: undefined } : d,
      );
      commit({ ...doc, dining, expenses });
    },

    addExpense(exp) {
      if (!exp.label.trim() || !(exp.amount > 0)) return;
      const doc = get().doc;
      commit({ ...doc, expenses: [...doc.expenses, { ...exp, label: exp.label.trim(), id: uid() }] });
    },

    updateExpense(id, patch) {
      const doc = get().doc;
      const expenses = doc.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e));
      commit({ ...doc, expenses });
    },

    removeExpense(id) {
      const doc = get().doc;
      commit({ ...doc, expenses: doc.expenses.filter((e) => e.id !== id) });
    },

    async refreshLive() {
      set({ liveStatus: 'loading' });
      const live = await fetchLiveWaits();
      const ok = Object.keys(live).length > 0;
      set({ live, liveStatus: ok ? 'ok' : 'unavailable' });
    },
  };
});

/** Selector helper: the currently active day. */
export function useActiveDay(): Day {
  return useStore((s) => s.doc.days.find((d) => d.id === s.doc.activeDayId) ?? s.doc.days[0]);
}
