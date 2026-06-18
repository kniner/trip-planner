import type { Attraction } from '../lib/types';

/**
 * LEGOLAND Florida Water Park dataset (Winter Haven, FL — part of the LEGOLAND
 * Florida Resort).
 *
 * IMPORTANT — accuracy caveats:
 *  - There is no schematic map for this park; `coords` are only rough relative
 *    positions on a small grid so the walking estimate is non-zero, NOT a real
 *    layout. Don't read precision into them.
 *  - Water parks don't post live queue data, so there's no live overlay here;
 *    avg/max waits are loose planning guesses and vary hugely with weather and
 *    crowds. `duration` is "time you'd spend", climb + ride for slides.
 *  - The attraction list reflects the park's well-known features; verify
 *    against the current official park map, as line-ups change seasonally.
 */
export const LEGOLAND_WATER_PARK: Attraction[] = [
  // Pools & Rivers
  {
    id: 'lego-wave-pool',
    name: 'LEGO Wave Pool',
    land: 'Pools & Rivers',
    park: 'legoland',
    kind: 'attraction',
    avgWait: 0,
    maxWait: 5,
    duration: 30,
    coords: { x: 150, y: 150 },
  },
  {
    id: 'lego-build-a-raft-river',
    name: 'Build-A-Raft River (lazy river)',
    land: 'Pools & Rivers',
    park: 'legoland',
    kind: 'attraction',
    avgWait: 5,
    maxWait: 10,
    duration: 25,
    coords: { x: 120, y: 175 },
    note: 'Lazy river — grab soft LEGO bricks to build a raft as you float.',
  },

  // Water Slides
  {
    id: 'lego-splash-out',
    name: 'Splash Out',
    land: 'Water Slides',
    park: 'legoland',
    kind: 'ride',
    avgWait: 15,
    maxWait: 40,
    duration: 6,
    coords: { x: 210, y: 90 },
    note: 'Trio of ~60ft body slides. Height restriction applies.',
  },
  {
    id: 'lego-twin-chasers',
    name: 'Twin Chasers',
    land: 'Water Slides',
    park: 'legoland',
    kind: 'ride',
    avgWait: 15,
    maxWait: 35,
    duration: 6,
    coords: { x: 235, y: 110 },
    note: 'Side-by-side racing slides (one open, one enclosed). Height restriction applies.',
  },

  // Kids & Family
  {
    id: 'lego-joker-soaker',
    name: 'Joker Soaker',
    land: 'Kids & Family',
    park: 'legoland',
    kind: 'attraction',
    avgWait: 5,
    maxWait: 10,
    duration: 30,
    coords: { x: 95, y: 120 },
    note: 'Interactive play structure with small slides and a giant tipping bucket.',
  },
  {
    id: 'lego-duplo-splash-safari',
    name: 'DUPLO Splash Safari',
    land: 'Kids & Family',
    park: 'legoland',
    kind: 'attraction',
    avgWait: 0,
    maxWait: 5,
    duration: 20,
    coords: { x: 70, y: 180 },
    note: 'Toddler/little-kid zone with gentle slides and shallow water.',
  },

  // LEGO Legends of CHIMA Water Park
  {
    id: 'lego-chima-water-park',
    name: 'LEGO Legends of CHIMA Water Park',
    land: 'LEGO Legends of CHIMA',
    park: 'legoland',
    kind: 'attraction',
    avgWait: 5,
    maxWait: 15,
    duration: 30,
    coords: { x: 205, y: 200 },
    note: 'Interactive water-play zone with water cannons, geysers and slides.',
  },

  // Dining
  {
    id: 'lego-beach-n-brick',
    name: 'Beach-N-Brick Grill',
    land: 'Dining',
    park: 'legoland',
    kind: 'food',
    avgWait: 10,
    maxWait: 20,
    duration: 40,
    coords: { x: 150, y: 235 },
    service: 'quick',
    gf: false,
    note: 'Quick-service grill (burgers, wraps, salads). Ask staff about gluten-free options.',
  },
];
