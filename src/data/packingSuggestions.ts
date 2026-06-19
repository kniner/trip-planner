import type { Day, MealPlan } from '../lib/types';

export interface PackingSuggestion {
  label: string;
  reason: string;
}

/**
 * Suggest packing items based on the trip's actual days and headcount: water
 * park, Halloween party, general park days, kids and gluten-free needs. Returns
 * a de-duplicated, reason-tagged list to offer on the packing list.
 */
export function suggestedPacking(days: Day[], meals: MealPlan): PackingSuggestion[] {
  const parkDays = days.filter((d) => d.kind !== 'other');
  const hasPark = parkDays.length > 0;
  const hasWater = parkDays.some((d) => d.park === 'legoland');
  const hasMNSSHP = days.some((d) => d.event === 'mnsshp');
  const hasKids = (meals.kids ?? 0) > 0;
  const hasGF = (meals.glutenFree ?? 0) > 0;

  const out: PackingSuggestion[] = [];
  const add = (label: string, reason: string) => out.push({ label, reason });

  if (hasPark) {
    add('Sunscreen', 'Park day');
    add('Refillable water bottle', 'Park day');
    add('Portable phone charger', 'Park day');
    add('Comfortable walking shoes', 'Park day');
    add('Hat & sunglasses', 'Park day');
    add('Rain poncho', 'Florida storms');
    add('Hand sanitizer / wipes', 'Park day');
  }
  if (hasWater) {
    add('Swimsuit', 'Water park');
    add('Towel', 'Water park');
    add('Water shoes', 'Water park');
    add('Goggles', 'Water park');
    add('Waterproof sunscreen', 'Water park');
    add('Change of clothes', 'Water park');
    add('Waterproof phone pouch', 'Water park');
  }
  if (hasMNSSHP) {
    add('Halloween costume', 'MNSSHP party');
    add('Trick-or-treat bag', 'MNSSHP party');
    add('Glow / light-up accessory', 'MNSSHP party');
  }
  if (hasKids) {
    add('Kids snacks', 'Kids');
    add('Autograph book & pen', 'Kids');
    add('Stroller', 'Kids');
  }
  if (hasGF) add('GF snacks', 'Gluten-free');

  return out;
}
