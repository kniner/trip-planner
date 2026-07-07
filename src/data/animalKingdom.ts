import type { Attraction } from '../lib/types';

/**
 * Disney's Animal Kingdom dataset.
 *
 * `coords` use a per-park ~600x600m grid (origin top-left): the Oasis entrance
 * sits to the south (high y) leading to Discovery Island and the Tree of Life
 * at the center; Pandora – The World of Avatar is the northwest, Africa is west,
 * Rafiki's Planet Watch is the far north (reached by the Wildlife Express Train),
 * Asia is east, and DinoLand U.S.A. is the southeast. Schematic only.
 *
 * avg/max waits are curated planning figures; `liveName` matches the
 * queue-times.com Animal Kingdom feed (park id 8) where a live wait exists.
 */
export const ANIMAL_KINGDOM: Attraction[] = [
  // Discovery Island
  { id: 'tree-of-life-bug', name: "It's Tough to be a Bug!", land: 'Discovery Island', park: 'dak', kind: 'show', avgWait: 10, maxWait: 25, duration: 8, coords: { x: 300, y: 320 }, liveName: "It's Tough to be a Bug!" },
  { id: 'discovery-island-trails', name: 'Discovery Island Trails', land: 'Discovery Island', park: 'dak', kind: 'attraction', avgWait: 0, maxWait: 5, duration: 20, coords: { x: 320, y: 350 } },

  // Pandora – The World of Avatar
  { id: 'flight-of-passage', name: 'Avatar Flight of Passage', land: 'Pandora – The World of Avatar', park: 'dak', kind: 'ride', avgWait: 75, maxWait: 165, duration: 5, coords: { x: 130, y: 160 }, liveName: 'Avatar Flight of Passage' },
  { id: 'navi-river', name: "Na'vi River Journey", land: 'Pandora – The World of Avatar', park: 'dak', kind: 'ride', avgWait: 45, maxWait: 90, duration: 5, coords: { x: 170, y: 200 }, liveName: "Na'vi River Journey" },

  // Africa
  { id: 'kilimanjaro-safaris', name: 'Kilimanjaro Safaris', land: 'Africa', park: 'dak', kind: 'ride', avgWait: 35, maxWait: 80, duration: 22, coords: { x: 150, y: 280 }, liveName: 'Kilimanjaro Safaris' },
  { id: 'gorilla-falls', name: 'Gorilla Falls Exploration Trail', land: 'Africa', park: 'dak', kind: 'attraction', avgWait: 5, maxWait: 15, duration: 25, coords: { x: 200, y: 270 } },
  { id: 'festival-lion-king', name: 'Festival of the Lion King', land: 'Africa', park: 'dak', kind: 'show', avgWait: 25, maxWait: 40, duration: 30, coords: { x: 170, y: 330 } },

  // Rafiki's Planet Watch
  { id: 'conservation-station', name: "Rafiki's Planet Watch & Conservation Station", land: "Rafiki's Planet Watch", park: 'dak', kind: 'attraction', avgWait: 5, maxWait: 15, duration: 30, coords: { x: 200, y: 120 } },

  // Asia
  { id: 'expedition-everest', name: 'Expedition Everest – Legend of the Forbidden Mountain', land: 'Asia', park: 'dak', kind: 'ride', avgWait: 40, maxWait: 90, duration: 3, coords: { x: 470, y: 240 }, liveName: 'Expedition Everest - Legend of the Forbidden Mountain' },
  { id: 'kali-river', name: 'Kali River Rapids', land: 'Asia', park: 'dak', kind: 'ride', avgWait: 30, maxWait: 70, duration: 5, coords: { x: 440, y: 300 }, liveName: 'Kali River Rapids' },
  { id: 'maharajah-trek', name: 'Maharajah Jungle Trek', land: 'Asia', park: 'dak', kind: 'attraction', avgWait: 5, maxWait: 15, duration: 25, coords: { x: 495, y: 300 } },
  { id: 'feathered-friends', name: 'Feathered Friends in Flight!', land: 'Asia', park: 'dak', kind: 'show', avgWait: 20, maxWait: 35, duration: 25, coords: { x: 450, y: 335 } },

  // DinoLand U.S.A.
  { id: 'dinosaur', name: 'DINOSAUR', land: 'DinoLand U.S.A.', park: 'dak', kind: 'ride', avgWait: 30, maxWait: 65, duration: 4, coords: { x: 430, y: 470 }, liveName: 'DINOSAUR' },
  { id: 'triceratop-spin', name: 'TriceraTop Spin', land: 'DinoLand U.S.A.', park: 'dak', kind: 'ride', avgWait: 15, maxWait: 35, duration: 2, coords: { x: 390, y: 440 }, liveName: 'TriceraTop Spin' },
  { id: 'the-boneyard', name: 'The Boneyard', land: 'DinoLand U.S.A.', park: 'dak', kind: 'attraction', avgWait: 0, maxWait: 5, duration: 20, coords: { x: 410, y: 420 } },
];
