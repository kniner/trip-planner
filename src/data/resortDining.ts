import type { Attraction } from '../lib/types';

/**
 * Resort character meals — table-service dining at the Walt Disney World hotels
 * (no theme-park admission required). Each `land` is the resort the restaurant
 * sits in; the `note` lists the characters you typically meet and which meals
 * are served. Coordinates are unused (resorts have no schematic map) but the
 * Attraction type requires them.
 *
 * Scope intentionally excludes character meals that need Animal Kingdom or
 * Hollywood Studios admission (e.g. Tusker House, Hollywood & Vine).
 */
const RESERVATION = 'reservation required — book at 60 days out';

export const RESORT_DINING: Attraction[] = [
  {
    id: 'resort-chef-mickeys',
    name: "Chef Mickey's",
    land: "Disney's Contemporary Resort",
    park: 'resort',
    kind: 'dining',
    avgWait: 0,
    maxWait: 0,
    duration: 90,
    coords: { x: 300, y: 300 },
    note: `Characters: Mickey, Minnie, Donald, Goofy & Pluto • breakfast & brunch buffet • ${RESERVATION}`,
  },
  {
    id: 'resort-ohana-breakfast',
    name: "'Ohana Best Friends Breakfast",
    land: "Disney's Polynesian Village Resort",
    park: 'resort',
    kind: 'dining',
    avgWait: 0,
    maxWait: 0,
    duration: 90,
    coords: { x: 300, y: 300 },
    note: `Characters: Lilo, Stitch, Mickey & Pluto • family-style breakfast • ${RESERVATION}`,
  },
  {
    id: 'resort-topolinos',
    name: "Topolino's Terrace – Breakfast à la Art",
    land: "Disney's Riviera Resort",
    park: 'resort',
    kind: 'dining',
    avgWait: 0,
    maxWait: 0,
    duration: 90,
    coords: { x: 300, y: 300 },
    note: `Characters: Mickey, Minnie, Donald & Daisy (in artist outfits) • rooftop breakfast • ${RESERVATION}`,
  },
  {
    id: 'resort-cape-may',
    name: "Cape May Cafe – Minnie's Beach Bash",
    land: "Disney's Beach Club Resort",
    park: 'resort',
    kind: 'dining',
    avgWait: 0,
    maxWait: 0,
    duration: 90,
    coords: { x: 300, y: 300 },
    note: `Characters: Minnie, Goofy & Donald (beach attire) • breakfast buffet • ${RESERVATION}`,
  },
  {
    id: 'resort-1900-park-fare',
    name: '1900 Park Fare – Supercalifragilistic Breakfast',
    land: "Disney's Grand Floridian Resort & Spa",
    park: 'resort',
    kind: 'dining',
    avgWait: 0,
    maxWait: 0,
    duration: 90,
    coords: { x: 300, y: 300 },
    note: `Characters: Mary Poppins, Alice, the Mad Hatter, Winnie the Pooh & Tigger • breakfast buffet • ${RESERVATION}`,
  },
  {
    id: 'resort-garden-grove',
    name: 'Garden Grove Character Breakfast',
    land: 'Walt Disney World Swan',
    park: 'resort',
    kind: 'dining',
    avgWait: 0,
    maxWait: 0,
    duration: 90,
    coords: { x: 300, y: 300 },
    note: `Characters: Goofy & Pluto • breakfast on select mornings • ${RESERVATION}`,
  },
];
