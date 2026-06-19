/**
 * One-line, plain-language explanations of what each ride/attraction is, keyed
 * by attraction id. Merged onto attractions in data/index.ts. Kept here (rather
 * than inline) so the big park datasets stay readable. Dining/festival items
 * already carry their own `note`, so they're not duplicated here.
 *
 * These are general descriptions written from common knowledge — not official
 * copy. Thrill/height specifics can change; the ride safety key is the source
 * of truth for restrictions.
 */
export const DESCRIPTIONS: Record<string, string> = {
  // Magic Kingdom
  'wdw-railroad': 'Steam-train loop around the park — a relaxing way to cross it or rest your feet.',
  'jungle-cruise': 'Guided jungle boat tour led by a pun-cracking skipper. Indoors-ish, shaded, all ages.',
  pirates: 'Slow indoor boat ride through scenes of swashbuckling pirates. One small drop.',
  'tiki-room': 'Air-conditioned sit-down show of singing audio-animatronic tropical birds.',
  'magic-carpets': 'Dumbo-style spinner — fly carpets up and down (watch for the spitting camel).',
  'swiss-treehouse': 'Self-paced walk-through treehouse of the Swiss Family Robinson. Lots of stairs.',
  'big-thunder': 'Family-friendly runaway-mine-train coaster through the Old West. Mild thrill.',
  tianas: 'Gentle log-flume boat ride with one big drop, themed to The Princess and the Frog.',
  'country-bears': 'Sit-down show with banjo-strumming animatronic bears. Good A/C break.',
  'tom-sawyer': 'Raft to an island to explore caves, bridges and forts at your own pace.',
  'haunted-mansion': 'Spooky-but-not-really-scary slow ride through a ghostly mansion.',
  'hall-of-presidents': 'Air-conditioned sit-down show with audio-animatronic U.S. presidents.',
  riverboat: 'Leisurely paddle-wheel steamboat cruise around the Rivers of America.',
  'seven-dwarfs': "Swaying family coaster through the diamond mine — the park's hardest reservation.",
  'peter-pan': 'Classic suspended dark ride soaring over London and Neverland.',
  'small-world': 'Gentle indoor boat ride past hundreds of singing dolls from around the world.',
  'winnie-pooh': 'Whimsical dark ride bouncing through the Hundred Acre Wood. Great for little ones.',
  'mad-tea-party': 'Spinning teacups — crank the wheel to spin faster (or not).',
  carrousel: 'Classic carousel on hand-painted horses. Gentle, all ages.',
  'little-mermaid': "Clamshell dark ride retelling Ariel's story. Low wait, all ages.",
  philharmagic: '4D animated film with Donald Duck and Disney music. Crowd-pleaser, all ages.',
  dumbo: 'Iconic gentle spinner — fly Dumbo up and down. Play area in the queue.',
  'space-mountain': 'Indoor roller coaster in near-total darkness. Real thrill, height limit.',
  buzz: 'Interactive dark ride — blast targets with laser cannons and rack up points.',
  peoplemover: 'Breezy, relaxing elevated tour of Tomorrowland. Almost never a wait.',
  'astro-orbiter': 'High-flying rockets you pilot up and down above Tomorrowland.',
  'carousel-progress': 'Rotating-theater sit-down show on a century of home life. Big A/C break.',
  speedway: 'Drive a gas-powered car around a track on a guide rail. Kids love it.',
  'laugh-floor': 'Interactive comedy show — Monsters, Inc. characters joke with the audience live.',

  // EPCOT
  'spaceship-earth': 'Slow dark ride inside the giant silver ball, tracing the story of communication.',
  'journey-of-water': 'Self-guided interactive walking trail with playful, splashy water effects.',
  'cosmic-rewind': 'Indoor spinning roller coaster (launches, reverse) themed to the Guardians. Thrill.',
  'test-track': 'Design a virtual car, then test it at speed on an outdoor track. Thrill, height limit.',
  'mission-space': 'Space-flight simulator — pick the spinning (intense) Orange or gentler Green side.',
  soarin: 'Hang-glider simulator that soars over world landmarks with wind and scents.',
  'living-with-the-land': 'Gentle boat ride through real working greenhouses and fish farms.',
  'the-seas-nemo': 'Slow clamshell ride into a huge aquarium, starring Nemo and friends.',
  'turtle-talk': 'Live interactive show — Crush the sea turtle chats with the audience in real time.',
  'journey-imagination': 'Quirky, low-key dark ride with Figment the purple dragon.',
  'gran-fiesta': 'Calm indoor boat ride through Mexico with the Three Caballeros.',
  'frozen-ever-after': 'Boat ride through Arendelle with Elsa, Anna and Olaf. One backwards drop.',
  'reflections-of-china': '360° panoramic film tour of China. You stand; no seats.',
  'american-adventure': 'Patriotic sit-down show with audio-animatronic historical figures.',
  'remys-ratatouille': "Trackless 4D ride that shrinks you mouse-size in Gusteau's kitchen.",
  'impressions-de-france': 'Sit-down wide-screen film tour of France set to classical music.',
  'beauty-beast-sing-along': 'Sit-down animated sing-along retelling Beauty and the Beast.',
  'canada-far-and-wide': '360° panoramic film celebrating Canada. You stand; no seats.',
};
