import type { PlanDoc } from '../lib/types';
import { isSupabaseConfigured, SupabaseSyncProvider } from './supabaseSync';

/**
 * Transport-agnostic seam for the shared plan document.
 *
 * The app talks to a SyncProvider, never to storage directly, so the local
 * implementation below can be swapped for a real backend (Supabase realtime,
 * Firebase, a WebSocket server, a CRDT) without touching the store or UI.
 *
 * Contract:
 *  - load(): return the current shared doc, or null if none exists yet.
 *  - save(doc): persist + broadcast the doc to other clients.
 *  - subscribe(cb): call cb whenever a *remote* change arrives. Returns an
 *    unsubscribe function.
 */
export interface SyncProvider {
  load(): Promise<PlanDoc | null>;
  save(doc: PlanDoc): Promise<void>;
  subscribe(cb: (doc: PlanDoc) => void): () => void;
}

const STORAGE_KEY = 'mk-planner:doc';
const CHANNEL = 'mk-planner:sync';

/**
 * Local-first provider: persists to localStorage and fans out live updates to
 * other tabs/windows via BroadcastChannel. Multiple people on the same machine
 * (or one person testing collaboration across tabs) see each other's edits in
 * real time. Cross-device sync is a backend swap away — implement this same
 * interface against Supabase/Firebase and the UI is unchanged.
 */
export class LocalSyncProvider implements SyncProvider {
  private channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;

  async load(): Promise<PlanDoc | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PlanDoc) : null;
    } catch {
      return null;
    }
  }

  async save(doc: PlanDoc): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {
      /* ignore quota errors */
    }
    this.channel?.postMessage(doc);
  }

  subscribe(cb: (doc: PlanDoc) => void): () => void {
    const onMessage = (e: MessageEvent<PlanDoc>) => cb(e.data);
    this.channel?.addEventListener('message', onMessage);

    // Fallback for environments without BroadcastChannel: storage events.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          cb(JSON.parse(e.newValue) as PlanDoc);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      this.channel?.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    };
  }
}

/**
 * Pick the sync backend: shared Supabase when it's configured (cross-device
 * collaboration), otherwise local-first (cross-tab on this device only).
 */
export function createSyncProvider(): SyncProvider {
  return isSupabaseConfigured() ? new SupabaseSyncProvider() : new LocalSyncProvider();
}

/** True when cross-device Supabase sync is active. */
export { isSupabaseConfigured } from './supabaseSync';
