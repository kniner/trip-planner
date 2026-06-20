import type { Attraction, EventType, ParkId } from '../lib/types';
import { CHARACTER_DINING } from './characterDining';
import { DESCRIPTIONS } from './descriptions';
import { EPCOT } from './epcot';
import { LEGOLAND_WATER_PARK } from './legolandWaterPark';
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
      'Food & Wine Marketplaces',
    ],
  },
  legoland: {
    id: 'legoland',
    name: 'LEGOLAND Water Park (Florida)',
    shortName: 'LEGOLAND',
    queueTimesId: 0, // no live wait feed for the water park; see waitTimes.ts
    lands: [
      'Pools & Rivers',
      'Water Slides',
      'Kids & Family',
      'LEGO Legends of CHIMA',
      'Dining',
    ],
  },
  resort: {
    id: 'resort',
    name: 'Character Dining',
    shortName: 'Character Dining',
    queueTimesId: 0, // no live wait feed for character meals
    lands: [
      'Magic Kingdom',
      'EPCOT',
      "Disney's Contemporary Resort",
      "Disney's Polynesian Village Resort",
      "Disney's Grand Floridian Resort & Spa",
      "Disney's Riviera Resort",
      "Disney's Beach Club Resort",
      'Walt Disney World Swan',
    ],
  },
};

/** Parks you can schedule a day at (excludes resort dining). */
export const PARK_IDS: ParkId[] = ['mk', 'epcot', 'legoland'];

/** Parks shown in the wishlist picker (adds resort character meals). */
export const WISHLIST_PARK_IDS: ParkId[] = ['mk', 'epcot', 'resort', 'legoland'];

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

export const ITEMS: Attraction[] = [
  ...MAGIC_KINGDOM,
  ...EPCOT,
  ...LEGOLAND_WATER_PARK,
  ...CHARACTER_DINING,
].map((a) => (DESCRIPTIONS[a.id] ? { ...a, description: DESCRIPTIONS[a.id] } : a));

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
