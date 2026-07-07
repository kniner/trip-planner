import type { Attraction } from '../lib/types';

/**
 * Disney's Blizzard Beach Water Park dataset.
 *
 * IMPORTANT — accuracy caveats (same as the other water parks):
 *  - There is no schematic map; `coords` are only rough relative positions on a
 *    small grid so the walking estimate is non-zero, NOT a real layout.
 *  - Water parks don't post live queue data, so there's no live overlay; avg/max
 *    waits are loose planning guesses that swing hugely with weather/crowds, and
 *    `duration` is "time you'd spend" (climb + ride for slides).
 *  - Line-ups change seasonally — verify against the current official park map.
 */
export const BLIZZARD_BEACH: Attraction[] = [
  // Pools & Rivers
  { id: 'bb-melt-away-bay', name: 'Melt-Away Bay', land: 'Pools & Rivers', park: 'blizzard', kind: 'attraction', avgWait: 0, maxWait: 5, duration: 40, coords: { x: 300, y: 320 } },
  { id: 'bb-cross-country-creek', name: 'Cross Country Creek', land: 'Pools & Rivers', park: 'blizzard', kind: 'attraction', avgWait: 0, maxWait: 5, duration: 30, coords: { x: 220, y: 260 } },

  // Thrill Slides
  { id: 'bb-summit-plummet', name: 'Summit Plummet', land: 'Thrill Slides', park: 'blizzard', kind: 'ride', avgWait: 20, maxWait: 55, duration: 2, coords: { x: 300, y: 120 } },
  { id: 'bb-slush-gusher', name: 'Slush Gusher', land: 'Thrill Slides', park: 'blizzard', kind: 'ride', avgWait: 15, maxWait: 45, duration: 2, coords: { x: 270, y: 140 } },
  { id: 'bb-downhill-double-dipper', name: 'Downhill Double Dipper', land: 'Thrill Slides', park: 'blizzard', kind: 'ride', avgWait: 10, maxWait: 35, duration: 2, coords: { x: 350, y: 170 } },
  { id: 'bb-toboggan-racers', name: 'Toboggan Racers', land: 'Thrill Slides', park: 'blizzard', kind: 'ride', avgWait: 10, maxWait: 35, duration: 2, coords: { x: 240, y: 180 } },
  { id: 'bb-snow-stormers', name: 'Snow Stormers', land: 'Thrill Slides', park: 'blizzard', kind: 'ride', avgWait: 10, maxWait: 30, duration: 2, coords: { x: 210, y: 200 } },
  { id: 'bb-runoff-rapids', name: 'Runoff Rapids', land: 'Thrill Slides', park: 'blizzard', kind: 'ride', avgWait: 10, maxWait: 35, duration: 2, coords: { x: 380, y: 200 } },

  // Family Rafts
  { id: 'bb-teamboat-springs', name: 'Teamboat Springs', land: 'Family Rafts', park: 'blizzard', kind: 'ride', avgWait: 15, maxWait: 40, duration: 3, coords: { x: 360, y: 150 } },
  { id: 'bb-ski-patrol', name: 'Ski Patrol Training Camp', land: 'Family Rafts', park: 'blizzard', kind: 'attraction', avgWait: 5, maxWait: 15, duration: 20, coords: { x: 180, y: 260 } },

  // Kids
  { id: 'bb-tikes-peak', name: "Tike's Peak", land: 'Kids', park: 'blizzard', kind: 'attraction', avgWait: 0, maxWait: 5, duration: 30, coords: { x: 380, y: 360 } },
];
