import type { ParkId } from '../lib/types';

/**
 * Park amenities shown as an optional map layer (not taggable/schedulable).
 * Positions are approximate, on the same per-park grid as attractions.
 */
export type AmenityType =
  | 'restroom'
  | 'water'
  | 'photopass'
  | 'photospot'
  | 'landmark'
  | 'kids';

export interface Amenity {
  id: string;
  park: ParkId;
  type: AmenityType;
  /** Area label for the tap caption. */
  land: string;
  coords: { x: number; y: number };
  /** Extra description (e.g. why a personal photo spot is good). */
  note?: string;
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

  // Magic Kingdom — PhotoPass photographer locations
  { id: 'mk-pp-castle', park: 'mk', type: 'photopass', land: 'Cinderella Castle forecourt', coords: { x: 300, y: 320 }, note: 'Classic castle photographers (magic shots)' },
  { id: 'mk-pp-partners', park: 'mk', type: 'photopass', land: 'Hub / Partners statue', coords: { x: 300, y: 360 }, note: 'Walt & Mickey with the castle behind' },
  { id: 'mk-pp-entrance', park: 'mk', type: 'photopass', land: 'Main Street entrance', coords: { x: 300, y: 478 }, note: 'Floral Mickey & train station' },
  { id: 'mk-pp-tom', park: 'mk', type: 'photopass', land: 'Tomorrowland', coords: { x: 415, y: 285 }, note: 'Tomorrowland entrance photographer' },

  // Magic Kingdom — great personal photo spots (blog-sourced; good views, fewer crowds)
  { id: 'mk-ps-wishingwell', park: 'mk', type: 'photospot', land: 'Cinderella Wishing Well', coords: { x: 325, y: 305 }, note: 'Right of the castle — charming, much quieter castle backdrop' },
  { id: 'mk-ps-castle-back', park: 'mk', type: 'photospot', land: 'Fantasyland side of the castle', coords: { x: 300, y: 205 }, note: 'Castle from the back — just as pretty, far less crowded' },
  { id: 'mk-ps-town-square', park: 'mk', type: 'photospot', land: 'Town Square Theater garden', coords: { x: 330, y: 470 }, note: 'SE corner by the entrance — shaded, flowery, almost no traffic' },
  { id: 'mk-ps-tl-purplewall', park: 'mk', type: 'photospot', land: 'Tomorrowland purple wall', coords: { x: 400, y: 300 }, note: 'Past the bridge near Tomorrowland Terrace — colorful & uncrowded' },
  { id: 'mk-ps-peachwalls', park: 'mk', type: 'photospot', land: 'Fantasyland peach walls', coords: { x: 330, y: 190 }, note: 'By Castle Couture / Sir Mickey’s — pretty windows & architecture' },
  { id: 'mk-ps-haunted', park: 'mk', type: 'photospot', land: 'Haunted Mansion grounds', coords: { x: 205, y: 178 }, note: 'In front of the mansion and the family tombs' },

  // EPCOT — PhotoPass locations
  { id: 'ep-pp-ssE', park: 'epcot', type: 'photopass', land: 'Spaceship Earth', coords: { x: 300, y: 100 }, note: 'The icon shot at the entrance' },
  { id: 'ep-pp-ws-fountain', park: 'epcot', type: 'photopass', land: 'World Showcase Lagoon', coords: { x: 300, y: 400 }, note: 'Lagoon-side photographers' },

  // EPCOT — great personal photo spots (blog-sourced)
  { id: 'ep-ps-morocco', park: 'epcot', type: 'photospot', land: 'Morocco fountain', coords: { x: 182, y: 515 }, note: 'The fountain here is the least crowded in World Showcase' },
  { id: 'ep-ps-norway-church', park: 'epcot', type: 'photospot', land: 'Norway Stave Church', coords: { x: 448, y: 448 }, note: 'Step to the rock past the main area for the best church view' },
  { id: 'ep-ps-mexico-aztec', park: 'epcot', type: 'photospot', land: 'Mexico Aztec wall', coords: { x: 432, y: 388 }, note: 'Just past the main building — often empty when Donald isn’t meeting' },
  { id: 'ep-ps-germany', park: 'epcot', type: 'photospot', land: 'Germany courtyard', coords: { x: 372, y: 562 }, note: 'Charming courtyard — go early before it fills up' },
  { id: 'ep-ps-japan', park: 'epcot', type: 'photospot', land: 'Japan pagoda garden', coords: { x: 210, y: 545 }, note: 'Pagoda & koi garden — serene and scenic' },

  // Landmarks (always shown)
  { id: 'mk-landmark-castle', park: 'mk', type: 'landmark', land: 'Cinderella Castle', coords: { x: 300, y: 300 }, note: 'Cinderella Castle — park center' },
  { id: 'ep-landmark-sse', park: 'epcot', type: 'landmark', land: 'Spaceship Earth', coords: { x: 300, y: 90 }, note: 'Spaceship Earth — park icon' },

  // Interactive spots for kids
  { id: 'mk-kids-sirmickeys', park: 'mk', type: 'kids', land: "Sir Mickey's (Fantasyland)", coords: { x: 335, y: 188 }, note: 'Pixie dusting — kids get sprinkled with pixie dust' },
  { id: 'mk-kids-sword', park: 'mk', type: 'kids', land: 'Sword in the Stone (Fantasyland)', coords: { x: 295, y: 188 }, note: 'Try to pull the sword from the stone' },
  { id: 'mk-kids-pirates-adv', park: 'mk', type: 'kids', land: "A Pirate's Adventure (Adventureland)", coords: { x: 172, y: 372 }, note: 'Interactive treasure-hunt game stations' },
  { id: 'mk-kids-sorcerers', park: 'mk', type: 'kids', land: 'Sorcerers of the Magic Kingdom (Firehouse)', coords: { x: 290, y: 460 }, note: 'Free trading-card spell game with portals park-wide' },
  { id: 'mk-kids-tom-sawyer', park: 'mk', type: 'kids', land: 'Tom Sawyer Island (Frontierland)', coords: { x: 130, y: 210 }, note: 'Caves, bridges & a fort to explore (raft over)' },
  { id: 'ep-kids-ducktales', park: 'epcot', type: 'kids', land: 'World Showcase Adventure', coords: { x: 300, y: 430 }, note: 'DuckTales interactive phone game around the pavilions' },
];

export function amenitiesForPark(park: ParkId): Amenity[] {
  return AMENITIES.filter((a) => a.park === park);
}
