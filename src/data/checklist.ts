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
  // Pre-trip prep
  { id: 'gsug-tickets', text: 'Buy & link park tickets in My Disney Experience', signups: [] },
  { id: 'gsug-mde', text: 'Set up My Disney Experience & link everyone', signups: [] },
  { id: 'gsug-dining', text: 'Make dining reservations', signups: [] },
  { id: 'gsug-character-meals', text: 'Book character meals (60-day window)', signups: [] },
  { id: 'gsug-grocery', text: 'Grocery / Amazon order for the rental', signups: [] },
  { id: 'gsug-budget', text: 'Collect money / manage the group budget', signups: [] },
  { id: 'gsug-transport', text: 'Coordinate transportation to parks', signups: [] },
  { id: 'gsug-firstaid', text: 'Pack a shared first-aid kit', signups: [] },
  // Day-of roles
  { id: 'gsug-mobileorder', text: 'Mobile-order point person for meals', signups: [] },
  { id: 'gsug-photos', text: 'PhotoPass / group photographer', signups: [] },
  { id: 'gsug-snackbag', text: 'Backpack & snack carrier', signups: [] },
  { id: 'gsug-stroller', text: 'Stroller wrangler', signups: [] },
  { id: 'gsug-meetingspot', text: 'Meeting-spot lead & headcount keeper', signups: [] },
];
