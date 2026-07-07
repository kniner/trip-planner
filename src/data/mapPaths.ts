import type { ParkId } from '../lib/types';

/**
 * Approximate main walkways per park, as polylines in the same grid coordinates
 * as attractions. Schematic only — drawn as background "paths" on the map to
 * orient the hub-and-spoke (MK) and lagoon-loop (EPCOT) layouts.
 */
export const PARK_PATHS: Record<ParkId, { x: number; y: number }[][]> = {
  mk: [
    // Main Street: entrance → castle hub
    [
      { x: 300, y: 478 },
      { x: 300, y: 330 },
    ],
    // Hub → Adventureland → Frontierland → Liberty Square → back of castle
    [
      { x: 300, y: 330 },
      { x: 210, y: 355 },
      { x: 160, y: 360 },
      { x: 125, y: 300 },
      { x: 120, y: 250 },
      { x: 170, y: 210 },
      { x: 215, y: 205 },
      { x: 260, y: 195 },
      { x: 300, y: 200 },
    ],
    // Castle hub straight back through the castle to Fantasyland
    [
      { x: 300, y: 330 },
      { x: 300, y: 205 },
    ],
    // Hub → Tomorrowland
    [
      { x: 300, y: 330 },
      { x: 370, y: 300 },
      { x: 425, y: 285 },
      { x: 430, y: 230 },
    ],
    // Fantasyland ↔ Tomorrowland connector
    [
      { x: 320, y: 160 },
      { x: 400, y: 250 },
      { x: 425, y: 285 },
    ],
  ],
  epcot: [
    // Entrance / Spaceship Earth → central plaza
    [
      { x: 300, y: 90 },
      { x: 300, y: 300 },
    ],
    // Plaza → World Nature (west)
    [
      { x: 300, y: 300 },
      { x: 190, y: 240 },
      { x: 160, y: 200 },
    ],
    // Plaza → World Discovery (east)
    [
      { x: 300, y: 300 },
      { x: 460, y: 200 },
      { x: 485, y: 180 },
    ],
    // World Showcase lagoon loop
    [
      { x: 300, y: 340 },
      { x: 360, y: 360 },
      { x: 430, y: 380 },
      { x: 440, y: 440 },
      { x: 420, y: 500 },
      { x: 370, y: 560 },
      { x: 320, y: 590 },
      { x: 260, y: 600 },
      { x: 210, y: 560 },
      { x: 180, y: 510 },
      { x: 200, y: 450 },
      { x: 240, y: 410 },
      { x: 290, y: 380 },
      { x: 300, y: 340 },
    ],
  ],
  dhs: [
    // Hollywood Boulevard: entrance → Chinese Theater hub
    [
      { x: 300, y: 560 },
      { x: 300, y: 400 },
    ],
    // Hub → Sunset Boulevard (Tower of Terror / Rock 'n' Roller / Fantasmic)
    [
      { x: 300, y: 430 },
      { x: 380, y: 500 },
      { x: 440, y: 540 },
      { x: 490, y: 585 },
    ],
    // Hub → Echo Lake → Grand Avenue (west)
    [
      { x: 300, y: 400 },
      { x: 205, y: 430 },
      { x: 160, y: 410 },
      { x: 130, y: 380 },
    ],
    // Echo Lake → Toy Story Land → Star Wars: Galaxy's Edge (northwest)
    [
      { x: 205, y: 430 },
      { x: 205, y: 320 },
      { x: 145, y: 285 },
      { x: 95, y: 250 },
    ],
    // Hub → Animation Courtyard
    [
      { x: 300, y: 400 },
      { x: 320, y: 300 },
    ],
  ],
  dak: [
    // Oasis: entrance → Discovery Island / Tree of Life
    [
      { x: 300, y: 560 },
      { x: 300, y: 320 },
    ],
    // Discovery Island → Pandora (northwest)
    [
      { x: 300, y: 320 },
      { x: 200, y: 240 },
      { x: 130, y: 160 },
    ],
    // Discovery Island → Africa → Rafiki's Planet Watch (north)
    [
      { x: 300, y: 320 },
      { x: 200, y: 275 },
      { x: 150, y: 280 },
      { x: 200, y: 120 },
    ],
    // Discovery Island → Asia (east)
    [
      { x: 300, y: 320 },
      { x: 430, y: 290 },
      { x: 470, y: 240 },
    ],
    // Discovery Island → DinoLand U.S.A. (southeast)
    [
      { x: 300, y: 340 },
      { x: 400, y: 430 },
      { x: 430, y: 470 },
    ],
  ],
  // No schematic maps for the water parks.
  typhoon: [],
  blizzard: [],
  // No schematic map for the LEGOLAND water park.
  legoland: [],
  resort: [],
};
