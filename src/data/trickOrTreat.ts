/**
 * Approximate Mickey's Not-So-Scary Halloween Party trick-or-treat trail for
 * Magic Kingdom: candy stations spread across the lands, plus a suggested loop
 * connecting them. Schematic/illustrative — exact station locations vary by
 * year; follow the party map you get at the gate.
 */
export interface CandyStation {
  id: string;
  land: string;
  coords: { x: number; y: number };
}

export const TOT_STATIONS: CandyStation[] = [
  { id: 'tot-main', land: 'Main Street, U.S.A.', coords: { x: 300, y: 445 } },
  { id: 'tot-adv', land: 'Adventureland', coords: { x: 165, y: 368 } },
  { id: 'tot-front', land: 'Frontierland', coords: { x: 125, y: 255 } },
  { id: 'tot-lib', land: 'Liberty Square', coords: { x: 200, y: 210 } },
  { id: 'tot-fan', land: 'Fantasyland', coords: { x: 300, y: 162 } },
  { id: 'tot-circus', land: 'Storybook Circus', coords: { x: 360, y: 125 } },
  { id: 'tot-tom', land: 'Tomorrowland', coords: { x: 432, y: 292 } },
];

/** Suggested loop through the stations (grid coords). */
export const TOT_PATH: { x: number; y: number }[] = [
  { x: 300, y: 445 },
  { x: 165, y: 368 },
  { x: 125, y: 255 },
  { x: 200, y: 210 },
  { x: 300, y: 162 },
  { x: 360, y: 125 },
  { x: 432, y: 292 },
  { x: 360, y: 340 },
  { x: 300, y: 445 },
];
