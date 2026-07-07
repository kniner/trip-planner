import type { Attraction } from '../lib/types';

/**
 * Disney's Hollywood Studios dataset.
 *
 * `coords` use a per-park ~600x600m grid (origin top-left): the entrance and
 * Hollywood Boulevard sit to the south (high y) leading north to the Chinese
 * Theater hub; Sunset Boulevard branches southeast, Echo Lake and Grand Avenue
 * lie west, Star Wars: Galaxy's Edge is the far northwest, Toy Story Land is
 * west-central, and Animation Courtyard sits north-central. Schematic only —
 * good enough for relative walking estimates, not a survey.
 *
 * avg/max waits are curated planning figures; `liveName` matches the
 * queue-times.com Hollywood Studios feed (park id 7) where a live wait exists.
 */
export const HOLLYWOOD_STUDIOS: Attraction[] = [
  // Hollywood Boulevard
  { id: 'runaway-railway', name: "Mickey & Minnie's Runaway Railway", land: 'Hollywood Boulevard', park: 'dhs', kind: 'ride', avgWait: 35, maxWait: 80, duration: 5, coords: { x: 300, y: 380 }, liveName: "Mickey & Minnie's Runaway Railway" },

  // Sunset Boulevard
  { id: 'tower-of-terror', name: 'The Twilight Zone Tower of Terror', land: 'Sunset Boulevard', park: 'dhs', kind: 'ride', avgWait: 45, maxWait: 100, duration: 5, coords: { x: 440, y: 560 }, liveName: 'The Twilight Zone Tower of Terror™' },
  { id: 'rock-n-roller', name: "Rock 'n' Roller Coaster Starring Aerosmith", land: 'Sunset Boulevard', park: 'dhs', kind: 'ride', avgWait: 55, maxWait: 120, duration: 3, coords: { x: 470, y: 540 }, liveName: "Rock 'n' Roller Coaster Starring Aerosmith" },
  { id: 'beauty-beast-live', name: 'Beauty and the Beast Live on Stage', land: 'Sunset Boulevard', park: 'dhs', kind: 'show', avgWait: 20, maxWait: 35, duration: 25, coords: { x: 400, y: 520 } },
  { id: 'fantasmic', name: 'Fantasmic!', land: 'Sunset Boulevard', park: 'dhs', kind: 'entertainment', avgWait: 30, maxWait: 60, duration: 30, coords: { x: 490, y: 585 } },

  // Echo Lake
  { id: 'star-tours', name: 'Star Tours – The Adventures Continue', land: 'Echo Lake', park: 'dhs', kind: 'ride', avgWait: 30, maxWait: 65, duration: 7, coords: { x: 205, y: 430 }, liveName: 'Star Tours - The Adventures Continue' },
  { id: 'indiana-jones-stunt', name: 'Indiana Jones Epic Stunt Spectacular!', land: 'Echo Lake', park: 'dhs', kind: 'show', avgWait: 20, maxWait: 35, duration: 30, coords: { x: 160, y: 410 }, liveName: 'Indiana Jones Epic Stunt Spectacular!' },
  { id: 'frozen-sing-along', name: 'For the First Time in Forever: A Frozen Sing-Along Celebration', land: 'Echo Lake', park: 'dhs', kind: 'show', avgWait: 20, maxWait: 35, duration: 25, coords: { x: 185, y: 455 } },

  // Grand Avenue
  { id: 'muppetvision', name: 'Muppet*Vision 3D', land: 'Grand Avenue', park: 'dhs', kind: 'show', avgWait: 15, maxWait: 30, duration: 17, coords: { x: 130, y: 380 }, liveName: 'Muppet*Vision 3D' },

  // Star Wars: Galaxy's Edge
  { id: 'rise-of-resistance', name: 'Star Wars: Rise of the Resistance', land: "Star Wars: Galaxy's Edge", park: 'dhs', kind: 'ride', avgWait: 75, maxWait: 165, duration: 18, coords: { x: 95, y: 250 }, liveName: 'Star Wars: Rise of the Resistance' },
  { id: 'smugglers-run', name: 'Millennium Falcon: Smugglers Run', land: "Star Wars: Galaxy's Edge", park: 'dhs', kind: 'ride', avgWait: 45, maxWait: 95, duration: 5, coords: { x: 145, y: 285 }, liveName: 'Millennium Falcon: Smugglers Run' },

  // Toy Story Land
  { id: 'slinky-dog-dash', name: 'Slinky Dog Dash', land: 'Toy Story Land', park: 'dhs', kind: 'ride', avgWait: 60, maxWait: 130, duration: 2, coords: { x: 205, y: 320 }, liveName: 'Slinky Dog Dash' },
  { id: 'toy-story-mania', name: 'Toy Story Mania!', land: 'Toy Story Land', park: 'dhs', kind: 'ride', avgWait: 40, maxWait: 80, duration: 7, coords: { x: 235, y: 345 }, liveName: 'Toy Story Mania!' },
  { id: 'alien-saucers', name: 'Alien Swirling Saucers', land: 'Toy Story Land', park: 'dhs', kind: 'ride', avgWait: 25, maxWait: 55, duration: 2, coords: { x: 180, y: 345 }, liveName: 'Alien Swirling Saucers' },

  // Animation Courtyard
  { id: 'walt-disney-presents', name: 'Walt Disney Presents', land: 'Animation Courtyard', park: 'dhs', kind: 'attraction', avgWait: 5, maxWait: 15, duration: 20, coords: { x: 350, y: 305 } },
  { id: 'disney-junior', name: 'Disney Junior Play & Dance!', land: 'Animation Courtyard', park: 'dhs', kind: 'show', avgWait: 15, maxWait: 30, duration: 20, coords: { x: 300, y: 295 } },
  { id: 'star-wars-launch-bay', name: 'Star Wars Launch Bay', land: 'Animation Courtyard', park: 'dhs', kind: 'attraction', avgWait: 10, maxWait: 20, duration: 20, coords: { x: 330, y: 285 } },
];
