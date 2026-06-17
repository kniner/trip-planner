import { create } from 'zustand';
import { ATTRACTIONS_BY_ID } from '../data/attractions';
import { distanceMeters } from '../lib/walking';
import type {
  Collaborator,
  LiveWaits,
  Pace,
  PlanDoc,
  Tag,
  WaitMode,
} from '../lib/types';
import { fetchLiveWaits } from '../lib/waitTimes';
import { LocalSyncProvider, type SyncProvider } from './sync';

const COLORS = [
  '#e11d48', '#7c3aed', '#0891b2', '#ea580c',
  '#16a34a', '#db2777', '#ca8a04', '#2563eb',
];

const ME_KEY = 'mk-planner:me';

function emptyDoc(): PlanDoc {
  return {
    collaborators: [],
    tags: [],
    stops: [],
    settings: { pace: 'average', waitMode: 'avg', startTime: '09:00' },
  };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface StoreState {
  doc: PlanDoc;
  /** Id of the collaborator using *this* client (local, not shared). */
  meId: string | null;
  live: LiveWaits;
  liveStatus: 'idle' | 'loading' | 'ok' | 'unavailable';
  ready: boolean;

  init: () => Promise<void>;
  join: (name: string) => void;
  leave: () => void;

  setTag: (attractionId: string, tag: Tag | null) => void;

  addStop: (attractionId: string) => void;
  removeStop: (stopId: string) => void;
  moveStop: (stopId: string, dir: -1 | 1) => void;
  setArrival: (stopId: string, arrival: string | undefined) => void;
  reorderToLandRoute: () => void;

  setPace: (pace: Pace) => void;
  setWaitMode: (mode: WaitMode) => void;
  setStartTime: (time: string) => void;

  refreshLive: () => Promise<void>;
}

const provider: SyncProvider = new LocalSyncProvider();

export const useStore = create<StoreState>((set, get) => {
  /** Persist + broadcast the current doc through the sync provider. */
  const commit = (doc: PlanDoc) => {
    set({ doc });
    void provider.save(doc);
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
      set({ doc: remote ?? emptyDoc(), meId: storedMe, ready: true });

      // Apply remote edits from other tabs/clients in real time.
      provider.subscribe((doc) => set({ doc }));

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
      const doc = get().doc;
      if (doc.stops.some((s) => s.attractionId === attractionId)) return;
      commit({
        ...doc,
        stops: [...doc.stops, { id: uid(), attractionId }],
      });
    },

    removeStop(stopId) {
      const doc = get().doc;
      commit({ ...doc, stops: doc.stops.filter((s) => s.id !== stopId) });
    },

    moveStop(stopId, dir) {
      const doc = get().doc;
      const stops = [...doc.stops];
      const i = stops.findIndex((s) => s.id === stopId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= stops.length) return;
      [stops[i], stops[j]] = [stops[j], stops[i]];
      commit({ ...doc, stops });
    },

    setArrival(stopId, arrival) {
      const doc = get().doc;
      const stops = doc.stops.map((s) =>
        s.id === stopId ? { ...s, arrival: arrival || undefined } : s,
      );
      commit({ ...doc, stops });
    },

    reorderToLandRoute() {
      // Lightweight optimization: order stops by a nearest-neighbour walk from
      // the first stop, minimizing total walking distance.
      const doc = get().doc;
      if (doc.stops.length < 3) return;
      const remaining = [...doc.stops];
      const ordered = [remaining.shift()!];
      while (remaining.length) {
        const last = ATTRACTIONS_BY_ID[ordered[ordered.length - 1].attractionId];
        let best = 0;
        let bestD = Infinity;
        remaining.forEach((s, idx) => {
          const d = distanceMeters(last, ATTRACTIONS_BY_ID[s.attractionId]);
          if (d < bestD) {
            bestD = d;
            best = idx;
          }
        });
        ordered.push(remaining.splice(best, 1)[0]);
      }
      commit({ ...doc, stops: ordered });
    },

    setPace(pace) {
      const doc = get().doc;
      commit({ ...doc, settings: { ...doc.settings, pace } });
    },

    setWaitMode(waitMode) {
      const doc = get().doc;
      commit({ ...doc, settings: { ...doc.settings, waitMode } });
    },

    setStartTime(startTime) {
      const doc = get().doc;
      commit({ ...doc, settings: { ...doc.settings, startTime } });
    },

    async refreshLive() {
      set({ liveStatus: 'loading' });
      const live = await fetchLiveWaits();
      const ok = Object.keys(live).length > 0;
      set({ live, liveStatus: ok ? 'ok' : 'unavailable' });
    },
  };
});
