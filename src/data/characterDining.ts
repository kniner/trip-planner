import type { Attraction } from '../lib/types';

/**
 * All Walt Disney World character meals in one place — the in-park table-service
 * spots (Magic Kingdom, EPCOT) and the resort hotel breakfasts, grouped under a
 * single "Character Dining" wishlist tab so they can be compared together.
 *
 * `land` is the location (park or resort) the restaurant sits in; the `note`
 * lists the characters you typically meet and which meals are served.
 * Coordinates are unused (this tab has no schematic map) but the Attraction
 * type requires them.
 *
 * Scope intentionally excludes character meals that need Animal Kingdom or
 * Hollywood Studios admission (e.g. Tusker House, Hollywood & Vine).
 */
const RESERVATION = 'reservation required';
const meal = (
  id: string,
  name: string,
  land: string,
  note: string,
  coords: { x: number; y: number } = { x: 300, y: 300 },
): Attraction => ({
  id,
  name,
  land,
  park: 'resort',
  kind: 'dining',
  avgWait: 0,
  maxWait: 0,
  duration: 90,
  coords,
  note,
});

export const CHARACTER_DINING: Attraction[] = [
  // In-park character meals (no separate admission beyond the park you're in).
  meal(
    'mk-cinderellas-royal-table',
    "Cinderella's Royal Table",
    'Magic Kingdom',
    `Characters: Disney Princesses (Cinderella, Ariel, Aurora, Jasmine & Snow White) • breakfast, lunch & dinner inside the castle • ${RESERVATION}`,
    { x: 300, y: 270 },
  ),
  meal(
    'mk-crystal-palace',
    'The Crystal Palace',
    'Magic Kingdom',
    `Characters: Winnie the Pooh, Tigger, Piglet & Eeyore • breakfast, lunch & dinner buffet • ${RESERVATION}`,
    { x: 250, y: 350 },
  ),
  meal(
    'epcot-garden-grill',
    'Garden Grill Restaurant',
    'EPCOT',
    `Characters: Mickey, Pluto, Chip & Dale • breakfast, lunch & dinner • rotating restaurant in The Land • ${RESERVATION}`,
    { x: 155, y: 210 },
  ),
  meal(
    'epcot-akershus',
    'Akershus Royal Banquet Hall',
    'EPCOT',
    `Characters: Disney Princesses (Belle, Ariel, Aurora, Snow White & more) • breakfast, lunch & dinner • Norway pavilion • ${RESERVATION}`,
    { x: 445, y: 445 },
  ),

  // Resort hotel character breakfasts (no theme-park admission required).
  meal(
    'resort-chef-mickeys',
    "Chef Mickey's",
    "Disney's Contemporary Resort",
    `Characters: Mickey, Minnie, Donald, Goofy & Pluto • breakfast & brunch buffet • ${RESERVATION}`,
  ),
  meal(
    'resort-ohana-breakfast',
    "'Ohana Best Friends Breakfast",
    "Disney's Polynesian Village Resort",
    `Characters: Lilo, Stitch, Mickey & Pluto • family-style breakfast • ${RESERVATION}`,
  ),
  meal(
    'resort-topolinos',
    "Topolino's Terrace – Breakfast à la Art",
    "Disney's Riviera Resort",
    `Characters: Mickey, Minnie, Donald & Daisy (in artist outfits) • rooftop breakfast • ${RESERVATION}`,
  ),
  meal(
    'resort-cape-may',
    "Cape May Cafe – Minnie's Beach Bash",
    "Disney's Beach Club Resort",
    `Characters: Minnie, Goofy & Donald (beach attire) • breakfast buffet • ${RESERVATION}`,
  ),
  meal(
    'resort-1900-park-fare',
    '1900 Park Fare – Supercalifragilistic Breakfast',
    "Disney's Grand Floridian Resort & Spa",
    `Characters: Mary Poppins, Alice, the Mad Hatter, Winnie the Pooh & Tigger • breakfast buffet • ${RESERVATION}`,
  ),
  meal(
    'resort-garden-grove',
    'Garden Grove Character Breakfast',
    'Walt Disney World Swan',
    `Characters: Goofy & Pluto • breakfast on select mornings • ${RESERVATION}`,
  ),
];
