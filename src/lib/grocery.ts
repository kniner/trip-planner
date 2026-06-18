import { RECIPES_BY_ID } from '../data/recipes';
import type { MealEntry } from './types';

/** A kid is estimated to eat this fraction of an adult serving. */
export const KID_FACTOR = 0.6;

export function effectiveServings(adults: number, kids: number): number {
  return Math.max(0, adults) + Math.max(0, kids) * KID_FACTOR;
}

export interface GroceryLine {
  key: string;
  name: string;
  qty: number;
  unit: string;
}

// Units that only make sense as whole numbers — always rounded up.
const COUNT_UNITS = new Set([
  'count',
  'can',
  'packet',
  'slice',
  'strip',
  'leaf',
  'head',
]);

function roundQty(qty: number, unit: string): number {
  if (COUNT_UNITS.has(unit)) return Math.ceil(qty);
  // Round to the nearest quarter for weights/volumes.
  return Math.round(qty * 4) / 4;
}

/**
 * Aggregate every planned meal's ingredients into a single grocery list,
 * scaled by servings and combining identical ingredients (same name + unit).
 */
export function computeGrocery(entries: MealEntry[], servings: number): GroceryLine[] {
  const map = new Map<string, GroceryLine>();
  for (const entry of entries) {
    const recipe = RECIPES_BY_ID[entry.recipeId];
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit}`;
      const add = ing.perPerson * servings;
      const existing = map.get(key);
      if (existing) existing.qty += add;
      else map.set(key, { key, name: ing.name, unit: ing.unit, qty: add });
    }
  }
  return [...map.values()]
    .map((l) => ({ ...l, qty: roundQty(l.qty, l.unit) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
