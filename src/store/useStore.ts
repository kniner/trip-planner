import { create } from 'zustand';
import { ITEMS_BY_ID, PARKS } from '../data';
import { SUGGESTED_GROUP, SUGGESTED_PERSONAL } from '../data/checklist';
import { distanceMeters } from '../lib/walking';
import type {
  Collaborator,
  CustomEntry,
  Day,
  EventType,
  LiveWaits,
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

function newDay(park: ParkId, event: EventType, name?: string): Day {
  return {
    id: uid(),
    name: name ?? defaultDayName(park, event),
    park,
    event,
    stops: [],
    settings: { pace: 'average', waitMode: 'avg', startTime: '09:00', bufferPerStop: 0 },
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
    groupItems: [...SUGGESTED_GROUP],
    meals: emptyMealPlan(),
  };
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
  let days = doc.days;
  if (!days || days.length === 0) {
    const legacy = newDay('mk', 'regular', 'Magic Kingdom — Day 1');
    if (doc.stops) legacy.stops = doc.stops;
    if (doc.settings) legacy.settings = doc.settings;
    days = [legacy];
  }
  const activeDayId = days.some((d) => d.id === doc.activeDayId)
    ? doc.activeDayId!
    : days[0].id;
  return {
    collaborators: doc.collaborators ?? [],
    tags: doc.tags ?? [],
    days,
    activeDayId,
    personalItems: doc.personalItems ?? [...SUGGESTED_PERSONAL],
    personalChecks: doc.personalChecks ?? {},
    groupItems: doc.groupItems ?? [...SUGGESTED_GROUP],
    meals: doc.meals ? { ...emptyMealPlan(), ...doc.meals } : emptyMealPlan(),
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
  removeCollaborator: (userId: string) => void;

  // Days
  setActiveDay: (dayId: string) => void;
  addDay: (park: ParkId, event: EventType, name?: string) => void;
  removeDay: (dayId: string) => void;
  renameDay: (dayId: string, name: string) => void;

  setTag: (attractionId: string, tag: Tag | null) => void;

  // Route (operates on the active day)
  addStop: (attractionId: string) => void;
  addCustomStop: (entry: CustomEntry) => void;
  removeStop: (stopId: string) => void;
  moveStop: (stopId: string, dir: -1 | 1) => void;
  setArrival: (stopId: string, arrival: string | undefined) => void;
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
  addPersonalItem: (text: string) => void;
  removePersonalItem: (id: string) => void;
  toggleChecked: (id: string) => void;
  addGroupItem: (text: string) => void;
  removeGroupItem: (id: string) => void;
  toggleSignup: (id: string) => void;
  addManualSignup: (id: string, name: string) => void;
  removeManualSignup: (id: string, name: string) => void;

  // Meal planner
  setMealHeadcount: (adults: number, kids: number) => void;
  setGlutenFree: (count: number) => void;
  addMealEntry: (date: string, recipeId: string) => void;
  updateMealEntry: (id: string, patch: Partial<{ date: string; recipeId: string }>) => void;
  removeMealEntry: (id: string) => void;
  addCustomRecipe: (recipe: Recipe) => void;
  removeCustomRecipe: (id: string) => void;
  toggleGrocery: (key: string) => void;
  addGroceryExtra: (text: string) => void;
  removeGroceryExtra: (id: string) => void;
  setGroceryQty: (key: string, qty: number) => void;
  removeGroceryLine: (key: string) => void;
  resetGroceryLine: (key: string) => void;

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
      commit({ ...doc, collaborators: [...doc.collaborators, collaborator] });
    },

    leave() {
      localStorage.removeItem(ME_KEY);
      set({ meId: null });
    },

    removeCollaborator(userId) {
      const doc = get().doc;
      const { [userId]: _removed, ...personalChecks } = doc.personalChecks;
      void _removed;
      commit({
        ...doc,
        collaborators: doc.collaborators.filter((c) => c.id !== userId),
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

    addDay(park, event, name) {
      const doc = get().doc;
      const day = newDay(park, event, name);
      commit({ ...doc, days: [...doc.days, day], activeDayId: day.id });
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

    addCustomStop(entry) {
      updateActiveDay((day) => ({
        ...day,
        stops: [...day.stops, { id: uid(), kind: 'custom', custom: entry }],
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

    addPersonalItem(text) {
      const clean = text.trim();
      if (!clean) return;
      const doc = get().doc;
      commit({
        ...doc,
        personalItems: [...doc.personalItems, { id: uid(), text: clean, addedBy: me() ?? undefined }],
      });
    },

    removePersonalItem(id) {
      const doc = get().doc;
      commit({ ...doc, personalItems: doc.personalItems.filter((i) => i.id !== id) });
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

    toggleSignup(id) {
      const meId = me();
      if (!meId) return;
      const doc = get().doc;
      commit({
        ...doc,
        groupItems: doc.groupItems.map((i) => {
          if (i.id !== id) return i;
          const signed = i.signups.includes(meId);
          return {
            ...i,
            signups: signed ? i.signups.filter((u) => u !== meId) : [...i.signups, meId],
          };
        }),
      });
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

    addMealEntry(date, recipeId) {
      if (!recipeId) return;
      const doc = get().doc;
      commit({
        ...doc,
        meals: {
          ...doc.meals,
          entries: [...doc.meals.entries, { id: uid(), date, recipeId }],
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

    addGroceryExtra(text) {
      const clean = text.trim();
      if (!clean) return;
      const doc = get().doc;
      commit({
        ...doc,
        meals: { ...doc.meals, extras: [...doc.meals.extras, { id: uid(), text: clean }] },
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

    removeGroceryExtra(id) {
      const doc = get().doc;
      commit({
        ...doc,
        meals: { ...doc.meals, extras: doc.meals.extras.filter((x) => x.id !== id) },
      });
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
