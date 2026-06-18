import type { ParkId } from '../lib/types';

/**
 * Park amenities shown as an optional map layer (not taggable/schedulable).
 * Positions are approximate, on the same per-park grid as attractions.
 */
export interface Amenity {
  id: string;
  park: ParkId;
  type: 'restroom' | 'water';
  /** Area label for the tap caption. */
  land: string;
  coords: { x: number; y: number };
}

export const AMENITIES: Amenity[] = [
  // Magic Kingdom — restrooms
  { id: 'mk-wc-main', park: 'mk', type: 'restroom', land: 'Main Street, U.S.A.', coords: { x: 320, y: 440 } },
  { id: 'mk-wc-adv', park: 'mk', type: 'restroom', land: 'Adventureland', coords: { x: 155, y: 385 } },
  { id: 'mk-wc-front', park: 'mk', type: 'restroom', land: 'Frontierland', coords: { x: 120, y: 255 } },
  { id: 'mk-wc-lib', park: 'mk', type: 'restroom', land: 'Liberty Square', coords: { x: 195, y: 215 } },
  { id: 'mk-wc-fan', park: 'mk', type: 'restroom', land: 'Fantasyland', coords: { x: 325, y: 168 } },
  { id: 'mk-wc-tom', park: 'mk', type: 'restroom', land: 'Tomorrowland', coords: { x: 445, y: 295 } },
  // Magic Kingdom — water fountains
  { id: 'mk-h2o-main', park: 'mk', type: 'water', land: 'Main Street, U.S.A.', coords: { x: 285, y: 445 } },
  { id: 'mk-h2o-adv', park: 'mk', type: 'water', land: 'Adventureland', coords: { x: 178, y: 358 } },
  { id: 'mk-h2o-front', park: 'mk', type: 'water', land: 'Frontierland', coords: { x: 138, y: 248 } },
  { id: 'mk-h2o-fan', park: 'mk', type: 'water', land: 'Fantasyland', coords: { x: 305, y: 178 } },
  { id: 'mk-h2o-tom', park: 'mk', type: 'water', land: 'Tomorrowland', coords: { x: 432, y: 298 } },

  // EPCOT — restrooms
  { id: 'ep-wc-cel', park: 'epcot', type: 'restroom', land: 'World Celebration', coords: { x: 305, y: 110 } },
  { id: 'ep-wc-disc', park: 'epcot', type: 'restroom', land: 'World Discovery', coords: { x: 485, y: 185 } },
  { id: 'ep-wc-nat', park: 'epcot', type: 'restroom', land: 'World Nature', coords: { x: 160, y: 235 } },
  { id: 'ep-wc-ws-e', park: 'epcot', type: 'restroom', land: 'World Showcase (Norway/China)', coords: { x: 440, y: 470 } },
  { id: 'ep-wc-ws-s', park: 'epcot', type: 'restroom', land: 'World Showcase (American Adventure)', coords: { x: 262, y: 590 } },
  { id: 'ep-wc-ws-w', park: 'epcot', type: 'restroom', land: 'World Showcase (France/UK)', coords: { x: 212, y: 458 } },
  // EPCOT — water fountains
  { id: 'ep-h2o-cel', park: 'epcot', type: 'water', land: 'World Celebration', coords: { x: 312, y: 122 } },
  { id: 'ep-h2o-nat', park: 'epcot', type: 'water', land: 'World Nature', coords: { x: 168, y: 218 } },
  { id: 'ep-h2o-ws', park: 'epcot', type: 'water', land: 'World Showcase (American Adventure)', coords: { x: 255, y: 583 } },
];

export function amenitiesForPark(park: ParkId): Amenity[] {
  return AMENITIES.filter((a) => a.park === park);
}
