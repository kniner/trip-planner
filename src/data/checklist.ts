import type { ChecklistItem, GroupItem } from '../lib/types';

/**
 * Seeded suggestions so the lists are useful out of the box. Ids are stable so
 * a person's local checked status survives reloads. Anyone can add more, and
 * added personal items become suggestions for the whole group.
 */
export const SUGGESTED_PERSONAL: ChecklistItem[] = [
  { id: 'sug-tickets', text: 'Park tickets / MagicBand' },
  { id: 'sug-shoes', text: 'Comfortable walking shoes' },
  { id: 'sug-sunscreen', text: 'Sunscreen' },
  { id: 'sug-water', text: 'Refillable water bottle' },
  { id: 'sug-charger', text: 'Portable phone charger' },
  { id: 'sug-poncho', text: 'Rain poncho' },
  { id: 'sug-hat', text: 'Hat & sunglasses' },
  { id: 'sug-meds', text: 'Medications / pain reliever' },
  { id: 'sug-sanitizer', text: 'Hand sanitizer & wipes' },
  { id: 'sug-cash', text: 'Cash & cards' },
  { id: 'sug-autograph', text: 'Autograph book & pen' },
  { id: 'sug-snacks', text: 'Snacks' },
];

export const SUGGESTED_GROUP: GroupItem[] = [
  { id: 'gsug-dining', text: 'Make dining reservations', signups: [] },
  { id: 'gsug-genie', text: 'Set up Lightning Lane / Genie+', signups: [] },
  { id: 'gsug-transport', text: 'Coordinate transportation to parks', signups: [] },
  { id: 'gsug-firstaid', text: 'Pack a shared first-aid kit', signups: [] },
];
