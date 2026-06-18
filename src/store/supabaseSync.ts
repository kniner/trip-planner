import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PlanDoc } from '../lib/types';
import type { SyncProvider } from './sync';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
/** Shared trip identifier — everyone with the same code sees the same plan. */
const TRIP_ID = import.meta.env.VITE_TRIP_ID ?? 'family-trip';

const TABLE = 'plans';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Cross-device sync backed by Supabase: the whole plan document lives in a
 * single `plans` row keyed by trip id, with Postgres Realtime fanning changes
 * out to every connected client. Implements the same SyncProvider contract as
 * the local provider, so the store and UI are unchanged — last write wins.
 */
export class SupabaseSyncProvider implements SyncProvider {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }

  async load(): Promise<PlanDoc | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('doc')
      .eq('id', TRIP_ID)
      .maybeSingle();
    if (error || !data) return null;
    return data.doc as PlanDoc;
  }

  async save(doc: PlanDoc): Promise<void> {
    await this.client
      .from(TABLE)
      .upsert({ id: TRIP_ID, doc, updated_at: new Date().toISOString() });
  }

  subscribe(cb: (doc: PlanDoc) => void): () => void {
    const channel = this.client
      .channel(`plan-${TRIP_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${TRIP_ID}` },
        (payload) => {
          const next = (payload.new as { doc?: PlanDoc } | null)?.doc;
          if (next) cb(next);
        },
      )
      .subscribe();

    return () => {
      void this.client.removeChannel(channel);
    };
  }
}
