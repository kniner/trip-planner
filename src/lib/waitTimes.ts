import { ITEMS, PARKS } from '../data';
import type { LiveWaits } from './types';

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

// Map normalized live feed names back to our item ids.
const LIVE_NAME_TO_ID = new Map<string, string>();
for (const a of ITEMS) {
  if (a.liveName) LIVE_NAME_TO_ID.set(normalize(a.liveName), a.id);
  LIVE_NAME_TO_ID.set(normalize(a.name), a.id);
}

async function fetchPark(queueTimesId: number, signal?: AbortSignal): Promise<LiveWaits> {
  const res = await fetch(`https://queue-times.com/parks/${queueTimesId}/queue_times.json`, {
    signal,
  });
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
}

/**
 * Fetch current wait times from queue-times.com for every park we cover and
 * map them onto our item ids. Returns an empty object on total failure
 * (offline, CORS, rate limit) so the app degrades gracefully to static data.
 */
export async function fetchLiveWaits(signal?: AbortSignal): Promise<LiveWaits> {
  try {
    const parks = Object.values(PARKS);
    const results = await Promise.all(
      parks.map((p) => fetchPark(p.queueTimesId, signal).catch(() => ({}) as LiveWaits)),
    );
    return Object.assign({}, ...results) as LiveWaits;
  } catch {
    return {};
  }
}
