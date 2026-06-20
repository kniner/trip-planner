import type { Attraction } from '../lib/types';

/**
 * EPCOT dataset.
 *
 * `coords` use a per-park ~700x700m grid (origin top-left): the entrance and
 * World Celebration sit to the north (low y), World Discovery to the northeast,
 * World Nature to the northwest, and the World Showcase pavilions wrap the
 * lagoon to the south (high y). Items marked `onlyDuringEvent: 'food-and-wine'`
 * are the seasonal EPCOT International Food & Wine Festival marketplaces and
 * only appear on festival days.
 */
export const EPCOT: Attraction[] = [
  // World Celebration
  { id: 'spaceship-earth', name: 'Spaceship Earth', land: 'World Celebration', park: 'epcot', kind: 'ride', avgWait: 25, maxWait: 55, duration: 16, coords: { x: 300, y: 90 }, liveName: 'Spaceship Earth' },
  { id: 'journey-of-water', name: 'Journey of Water, Inspired by Moana', land: 'World Celebration', park: 'epcot', kind: 'attraction', avgWait: 10, maxWait: 25, duration: 15, coords: { x: 350, y: 150 }, liveName: 'Journey of Water, Inspired by Moana' },

  // World Discovery
  { id: 'cosmic-rewind', name: 'Guardians of the Galaxy: Cosmic Rewind', land: 'World Discovery', park: 'epcot', kind: 'ride', avgWait: 65, maxWait: 140, duration: 4, coords: { x: 470, y: 130 }, liveName: 'Guardians of the Galaxy: Cosmic Rewind' },
  { id: 'test-track', name: 'Test Track', land: 'World Discovery', park: 'epcot', kind: 'ride', avgWait: 45, maxWait: 110, duration: 5, coords: { x: 500, y: 200 }, liveName: 'Test Track' },
  { id: 'mission-space', name: 'Mission: SPACE', land: 'World Discovery', park: 'epcot', kind: 'ride', avgWait: 25, maxWait: 50, duration: 5, coords: { x: 480, y: 170 }, liveName: 'Mission: SPACE' },

  // World Nature
  { id: 'soarin', name: "Soarin' Around the World", land: 'World Nature', park: 'epcot', kind: 'ride', avgWait: 40, maxWait: 90, duration: 5, coords: { x: 160, y: 200 }, liveName: "Soarin' Around the World" },
  { id: 'living-with-the-land', name: 'Living with the Land', land: 'World Nature', park: 'epcot', kind: 'ride', avgWait: 20, maxWait: 40, duration: 14, coords: { x: 150, y: 220 }, liveName: 'Living with the Land' },
  { id: 'the-seas-nemo', name: 'The Seas with Nemo & Friends', land: 'World Nature', park: 'epcot', kind: 'ride', avgWait: 15, maxWait: 35, duration: 4, coords: { x: 140, y: 160 }, liveName: 'The Seas with Nemo & Friends' },
  { id: 'turtle-talk', name: 'Turtle Talk with Crush', land: 'World Nature', park: 'epcot', kind: 'show', avgWait: 15, maxWait: 30, duration: 17, coords: { x: 135, y: 175 }, liveName: 'Turtle Talk With Crush' },
  { id: 'journey-imagination', name: 'Journey Into Imagination with Figment', land: 'World Nature', park: 'epcot', kind: 'ride', avgWait: 15, maxWait: 35, duration: 6, coords: { x: 200, y: 250 }, liveName: 'Journey Into Imagination With Figment' },

  // World Showcase
  { id: 'gran-fiesta', name: 'Gran Fiesta Tour Starring The Three Caballeros', land: 'World Showcase — Mexico', park: 'epcot', kind: 'ride', avgWait: 15, maxWait: 30, duration: 8, coords: { x: 430, y: 380 }, liveName: 'Gran Fiesta Tour Starring The Three Caballeros' },
  { id: 'frozen-ever-after', name: 'Frozen Ever After', land: 'World Showcase — Norway', park: 'epcot', kind: 'ride', avgWait: 55, maxWait: 120, duration: 5, coords: { x: 440, y: 440 }, liveName: 'Frozen Ever After' },
  { id: 'reflections-of-china', name: 'Reflections of China', land: 'World Showcase — China', park: 'epcot', kind: 'show', avgWait: 5, maxWait: 15, duration: 14, coords: { x: 420, y: 500 } },
  { id: 'american-adventure', name: 'The American Adventure', land: 'World Showcase — The American Adventure', park: 'epcot', kind: 'show', avgWait: 10, maxWait: 20, duration: 29, coords: { x: 260, y: 600 } },
  { id: 'remys-ratatouille', name: "Remy's Ratatouille Adventure", land: 'World Showcase — France', park: 'epcot', kind: 'ride', avgWait: 45, maxWait: 95, duration: 5, coords: { x: 200, y: 450 }, liveName: "Remy's Ratatouille Adventure" },
  { id: 'impressions-de-france', name: 'Impressions de France', land: 'World Showcase — France', park: 'epcot', kind: 'show', avgWait: 10, maxWait: 20, duration: 18, coords: { x: 205, y: 455 } },
  { id: 'beauty-beast-sing-along', name: 'Beauty and the Beast Sing-Along', land: 'World Showcase — France', park: 'epcot', kind: 'show', avgWait: 15, maxWait: 30, duration: 13, coords: { x: 210, y: 448 } },
  { id: 'canada-far-and-wide', name: 'Canada Far and Wide', land: 'World Showcase — Canada', park: 'epcot', kind: 'show', avgWait: 5, maxWait: 15, duration: 14, coords: { x: 290, y: 380 } },

  // Character dining (table-service; book in advance). Duration assumes 90 min.
  {
    id: 'epcot-garden-grill',
    name: 'Garden Grill Restaurant',
    land: 'Character Dining',
    park: 'epcot',
    kind: 'dining',
    avgWait: 0,
    maxWait: 0,
    duration: 90,
    coords: { x: 155, y: 210 },
    note: 'Characters: Mickey, Pluto, Chip & Dale • breakfast, lunch & dinner • rotating restaurant in The Land • reservation required',
  },
  {
    id: 'epcot-akershus',
    name: 'Akershus Royal Banquet Hall',
    land: 'Character Dining',
    park: 'epcot',
    kind: 'dining',
    avgWait: 0,
    maxWait: 0,
    duration: 90,
    coords: { x: 445, y: 445 },
    note: 'Characters: Disney Princesses (Belle, Ariel, Aurora, Snow White & more) • breakfast, lunch & dinner • Norway pavilion • reservation required',
  },

  // International Food & Wine Festival — Global Marketplaces (recurring in
  // recent years). Each is a walk-up booth; duration assumes a short stop.
  ...foodAndWineBooth('fw-shimmering-sips', 'Shimmering Sips', 'Champagne & sparkling, near the entrance', 320, 250),
  ...foodAndWineBooth('fw-flavors-from-fire', 'Flavors from Fire', 'Grilled & smoked bites', 430, 300),
  ...foodAndWineBooth('fw-the-noodle-exchange', 'The Noodle Exchange', 'Asian noodle bowls', 300, 330),
  ...foodAndWineBooth('fw-swanky-saucy-swine', 'Swanky Saucy Swine', 'Pork & barbecue', 320, 340),
  ...foodAndWineBooth('fw-earth-eats', 'Earth Eats', 'Sustainable & plant-forward', 350, 320),
  ...foodAndWineBooth('fw-coastal-eats', 'Coastal Eats', 'Seafood', 480, 250),
  ...foodAndWineBooth('fw-brew-wing', 'Brew-Wing Lab', 'Craft beer & wings', 400, 350),
  ...foodAndWineBooth('fw-mexico', 'Mexico Marketplace', 'Tacos & margaritas', 432, 382),
  ...foodAndWineBooth('fw-china', 'China Marketplace', 'Dim sum & bao', 422, 502),
  ...foodAndWineBooth('fw-germany', 'Germany (Bauernmarkt)', 'Bratwurst & beer', 372, 562),
  ...foodAndWineBooth('fw-italy', 'Italy Marketplace', 'Pasta & Italian wines', 322, 592),
  ...foodAndWineBooth('fw-hops-and-barley', 'Hops & Barley', 'American craft beer & lobster roll', 255, 590),
  ...foodAndWineBooth('fw-japan', 'Japan (Hanami)', 'Sushi & sake', 210, 560),
  ...foodAndWineBooth('fw-morocco', 'Tangierine Café', 'Moroccan & Mediterranean', 180, 515),
  ...foodAndWineBooth('fw-france', 'France (Les Halles)', 'French pastries & wine', 200, 460),
  ...foodAndWineBooth('fw-canada', 'Canada (Wine & Dine)', 'Filet & ice wine', 292, 382),
];

/** Build a single Food & Wine marketplace booth entry. */
function foodAndWineBooth(
  id: string,
  name: string,
  note: string,
  x: number,
  y: number,
): Attraction[] {
  return [
    {
      id,
      name,
      land: 'Food & Wine Marketplaces',
      park: 'epcot',
      kind: 'festival',
      avgWait: 10,
      maxWait: 25,
      duration: 20,
      coords: { x, y },
      onlyDuringEvent: 'food-and-wine',
      note,
    },
  ];
}
