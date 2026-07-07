import type { Attraction } from '../lib/types';

/**
 * Disney's Typhoon Lagoon Water Park dataset.
 *
 * IMPORTANT — accuracy caveats (same as the other water park):
 *  - There is no schematic map; `coords` are only rough relative positions on a
 *    small grid so the walking estimate is non-zero, NOT a real layout.
 *  - Water parks don't post live queue data, so there's no live overlay; avg/max
 *    waits are loose planning guesses that swing hugely with weather/crowds, and
 *    `duration` is "time you'd spend" (climb + ride for slides).
 *  - Line-ups change seasonally — verify against the current official park map.
 */
export const TYPHOON_LAGOON: Attraction[] = [
  // Pools & Rivers
  { id: 'tl-surf-pool', name: 'Typhoon Lagoon Surf Pool', land: 'Pools & Rivers', park: 'typhoon', kind: 'attraction', avgWait: 0, maxWait: 5, duration: 40, coords: { x: 300, y: 300 } },
  { id: 'tl-castaway-creek', name: 'Castaway Creek', land: 'Pools & Rivers', park: 'typhoon', kind: 'attraction', avgWait: 0, maxWait: 5, duration: 30, coords: { x: 220, y: 240 } },

  // Thrill Slides
  { id: 'tl-crush-n-gusher', name: "Crush 'n' Gusher", land: 'Thrill Slides', park: 'typhoon', kind: 'ride', avgWait: 15, maxWait: 45, duration: 3, coords: { x: 420, y: 220 } },
  { id: 'tl-humunga-kowabunga', name: 'Humunga Kowabunga', land: 'Thrill Slides', park: 'typhoon', kind: 'ride', avgWait: 15, maxWait: 40, duration: 2, coords: { x: 180, y: 180 } },
  { id: 'tl-storm-slides', name: 'Storm Slides', land: 'Thrill Slides', park: 'typhoon', kind: 'ride', avgWait: 10, maxWait: 35, duration: 2, coords: { x: 210, y: 160 } },

  // Family Rafts
  { id: 'tl-miss-adventure-falls', name: 'Miss Adventure Falls', land: 'Family Rafts', park: 'typhoon', kind: 'ride', avgWait: 10, maxWait: 30, duration: 3, coords: { x: 380, y: 320 } },
  { id: 'tl-gangplank-falls', name: 'Gangplank Falls', land: 'Family Rafts', park: 'typhoon', kind: 'ride', avgWait: 10, maxWait: 35, duration: 3, coords: { x: 160, y: 140 } },
  { id: 'tl-mayday-falls', name: 'Mayday Falls', land: 'Family Rafts', park: 'typhoon', kind: 'ride', avgWait: 10, maxWait: 30, duration: 2, coords: { x: 130, y: 160 } },

  // Kids
  { id: 'tl-ketchakiddee-creek', name: 'Ketchakiddee Creek', land: 'Kids', park: 'typhoon', kind: 'attraction', avgWait: 0, maxWait: 5, duration: 30, coords: { x: 380, y: 380 } },
];
