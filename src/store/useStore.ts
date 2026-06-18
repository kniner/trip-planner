import { create } from 'zustand';
import { ITEMS_BY_ID, PARKS } from '../data';
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
    settings: { pace: 'average', waitMode: 'avg', startTime: '09:00' },
  };
}

function emptyDoc(): PlanDoc {
  const day = newDay('mk', 'regular', 'Magic Kingdom — Day 1');
  return { collaborators: [], tags: [], days: [day], activeDayId: day.id };
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

  setPace: (pace: Pace) => void;
  setWaitMode: (mode: WaitMode) => void;
  setStartTime: (time: string) => void;

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
      set({ doc: migrate(remote), meId: storedMe, ready: true });

      provider.subscribe((doc) => set({ doc: migrate(doc) }));
      void get().refreshLive();
    },

    join(name) {
      const id = uid();
      const doc = get().doc;
      const color = COLORS[doc.collaborators.length % COLORS.length];
      const collaborator: Collaborator = { id, name: name.trim() || 'Guest', color };
      localStorage.setItem(ME_KEY, id);
      set({ meId: id });
      commit({ ...doc, collaborators: [...doc.collaborators, collaborator] });
    },

    leave() {
      localStorage.removeItem(ME_KEY);
      set({ meId: null });
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

    setPace(pace) {
      updateActiveDay((day) => ({ ...day, settings: { ...day.settings, pace } }));
    },

    setWaitMode(waitMode) {
      updateActiveDay((day) => ({ ...day, settings: { ...day.settings, waitMode } }));
    },

    setStartTime(startTime) {
      updateActiveDay((day) => ({ ...day, settings: { ...day.settings, startTime } }));
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
