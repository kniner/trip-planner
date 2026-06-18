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
};
