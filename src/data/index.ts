import type { Attraction, EventType, ParkId } from '../lib/types';
import { EPCOT } from './epcot';
import { MAGIC_KINGDOM } from './magicKingdom';

export interface ParkMeta {
  id: ParkId;
  name: string;
  shortName: string;
  /** queue-times.com park id, for live wait overlays. */
  queueTimesId: number;
  /** Land display order for grouping in the attraction list. */
  lands: string[];
}

export const PARKS: Record<ParkId, ParkMeta> = {
  mk: {
    id: 'mk',
    name: 'Magic Kingdom',
    shortName: 'Magic Kingdom',
    queueTimesId: 6,
    lands: [
      'Main Street, U.S.A.',
      'Adventureland',
      'Frontierland',
      'Liberty Square',
      'Fantasyland',
      'Tomorrowland',
      'Dining & Snacks',
      'Character Dining',
      'Experiences',
      'MNSSHP — Party Exclusive',
    ],
  },
  epcot: {
    id: 'epcot',
    name: 'EPCOT',
    shortName: 'EPCOT',
    queueTimesId: 5,
    lands: [
      'World Celebration',
      'World Discovery',
      'World Nature',
      'World Showcase — Mexico',
      'World Showcase — Norway',
      'World Showcase — China',
      'World Showcase — The American Adventure',
      'World Showcase — France',
      'World Showcase — Canada',
      'Character Dining',
      'Food & Wine Marketplaces',
    ],
  },
};

export const PARK_IDS: ParkId[] = ['mk', 'epcot'];

export const EVENT_LABELS: Record<EventType, string> = {
  regular: 'Regular day',
  mnsshp: "Mickey's Not-So-Scary Halloween Party",
  'food-and-wine': 'Food & Wine Festival',
};

/** Short label used on day tabs/badges. */
export const EVENT_SHORT: Record<EventType, string> = {
  regular: 'Regular',
  mnsshp: 'MNSSHP',
  'food-and-wine': 'Food & Wine',
};

export const ITEMS: Attraction[] = [...MAGIC_KINGDOM, ...EPCOT];

export const ITEMS_BY_ID: Record<string, Attraction> = Object.fromEntries(
  ITEMS.map((a) => [a.id, a]),
);

/**
 * Items visible for a given park + event day. Always includes the park's
 * regular items; event-exclusive items appear only when their event matches.
 */
export function itemsForDay(park: ParkId, event: EventType): Attraction[] {
  return ITEMS.filter((item) => {
    if (item.park !== park) return false;
    if (item.onlyDuringEvent) return item.onlyDuringEvent === event;
    return true;
  });
}

/** Every item in a park, regardless of event (used by the tagging page). */
export function itemsForPark(park: ParkId): Attraction[] {
  return ITEMS.filter((item) => item.park === park);
}

/** The lands (in display order) that actually contain items for this day. */
export function landsForDay(park: ParkId, event: EventType): string[] {
  const present = new Set(itemsForDay(park, event).map((i) => i.land));
  return PARKS[park].lands.filter((l) => present.has(l));
}

/** The lands (in display order) that contain any item in this park. */
export function landsForPark(park: ParkId): string[] {
  const present = new Set(itemsForPark(park).map((i) => i.land));
  return PARKS[park].lands.filter((l) => present.has(l));
}
