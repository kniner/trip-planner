import { itemsForDay } from '../data';
import type { Attraction, Collaborator, Day, LiveWaits, TagEntry } from './types';
import { summarizeTags } from './tags';
import { waitFor } from './estimator';
import { walkMinutes } from './walking';

export interface Suggestion {
  item: Attraction;
  /** Walking minutes from the current location (0 if no location). */
  walk: number;
  /** Modeled wait minutes under the day's wait mode. */
  wait: number;
  /** Group priority tag (must/nice/null); 'avoid' items are excluded. */
  priority: 'must' | 'nice' | null;
  /** Lower is better. */
  score: number;
}

/** Priority bonus subtracted from the score (must-dos rank higher). */
const PRIORITY_BONUS: Record<'must' | 'nice', number> = { must: 30, nice: 12 };

/** Kinds worth suggesting as a "next thing to do" while touring. */
const SUGGESTABLE = new Set<Attraction['kind']>(['ride', 'show', 'attraction', 'entertainment']);

interface Ctx {
  day: Day;
  live: LiveWaits;
  tags: TagEntry[];
  collaborators: Collaborator[];
  meId: string | null;
}

/** Item ids already scheduled in the day (main route + split branches). */
function scheduledIds(day: Day): Set<string> {
  const ids = new Set<string>();
  for (const s of day.stops) {
    if (s.kind === 'split' && s.branches) {
      for (const b of s.branches) for (const bs of b.stops) if (bs.attractionId) ids.add(bs.attractionId);
    } else if (s.attractionId) {
      ids.add(s.attractionId);
    }
  }
  return ids;
}

/**
 * Suggest the best next things to do, scoring each candidate by walking time
 * from the current location, modeled wait, and group priority. Excludes items
 * already in the route and anything the group tagged "avoid".
 *
 * @param fromItem  Where you are now (defaults handled by the caller).
 */
export function suggestNext(
  ctx: Ctx,
  fromItem: Attraction | undefined,
  limit = 5,
): Suggestion[] {
  const { day, live, tags, collaborators, meId } = ctx;
  const done = scheduledIds(day);

  const out: Suggestion[] = [];
  for (const item of itemsForDay(day.park, day.event)) {
    if (!SUGGESTABLE.has(item.kind)) continue;
    if (done.has(item.id)) continue;
    if (fromItem && item.id === fromItem.id) continue;

    const consensus = summarizeTags(item.id, tags, collaborators, meId).consensus;
    if (consensus === 'avoid') continue;
    const priority = consensus === 'must' || consensus === 'nice' ? consensus : null;

    const walk = fromItem ? walkMinutes(fromItem, item, day.settings.pace) : 0;
    const wait = waitFor(item.id, day.settings.waitMode, live);
    const score = walk + wait - (priority ? PRIORITY_BONUS[priority] : 0);

    out.push({ item, walk, wait, priority, score });
  }

  return out.sort((a, b) => a.score - b.score).slice(0, limit);
}
