import { ATTRACTIONS } from '../data/attractions';
import type { LiveWaits } from './types';

/** queue-times.com park id for Magic Kingdom. */
const MAGIC_KINGDOM_PARK_ID = 6;
const FEED_URL = `https://queue-times.com/parks/${MAGIC_KINGDOM_PARK_ID}/queue_times.json`;

interface QueueTimesRide {
  name: string;
  is_open: boolean;
  wait_time: number;
}

interface QueueTimesResponse {
  lands?: { rides: QueueTimesRide[] }[];
  rides?: QueueTimesRide[];
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Map normalized live feed names back to our attraction ids.
const LIVE_NAME_TO_ID = new Map<string, string>();
for (const a of ATTRACTIONS) {
  if (a.liveName) LIVE_NAME_TO_ID.set(normalize(a.liveName), a.id);
  LIVE_NAME_TO_ID.set(normalize(a.name), a.id);
}

/**
 * Fetch current wait times from queue-times.com and map them onto our
 * attraction ids. Returns an empty object on any failure (offline, CORS,
 * rate limit) so the rest of the app degrades gracefully to static data.
 */
export async function fetchLiveWaits(signal?: AbortSignal): Promise<LiveWaits> {
  try {
    const res = await fetch(FEED_URL, { signal });
    if (!res.ok) return {};
    const data: QueueTimesResponse = await res.json();

    const rides: QueueTimesRide[] = data.lands
      ? data.lands.flatMap((l) => l.rides)
      : (data.rides ?? []);

    const out: LiveWaits = {};
    for (const ride of rides) {
      const id = LIVE_NAME_TO_ID.get(normalize(ride.name));
      if (!id) continue;
      out[id] = { wait: ride.wait_time ?? 0, isOpen: !!ride.is_open };
    }
    return out;
  } catch {
    return {};
  }
}
