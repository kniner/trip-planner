import { RECIPES_BY_ID } from '../data/recipes';
import type { MealEntry, Recipe } from './types';

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
 *
 * `gfCount` gluten-free eaters get the gluten-free substitute instead of the
 * regular item for any ingredient that defines a `gfSub`: that many servings
 * are split off into a separate substitute line.
 */
export function computeGrocery(
  entries: MealEntry[],
  servings: number,
  gfCount = 0,
  recipesById: Record<string, Recipe> = RECIPES_BY_ID,
): GroceryLine[] {
  const map = new Map<string, GroceryLine>();
  const add = (name: string, unit: string, qty: number) => {
    if (qty <= 0) return;
    const key = `${name.toLowerCase()}|${unit}`;
    const existing = map.get(key);
    if (existing) existing.qty += qty;
    else map.set(key, { key, name, unit, qty });
  };

  // GF eaters consume regular adult servings of the substitute; clamp so we
  // never subtract more than the total servings.
  const gf = Math.max(0, Math.min(gfCount, servings));

  for (const entry of entries) {
    const recipe = recipesById[entry.recipeId];
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      if (ing.gfSub && gf > 0) {
        add(ing.name, ing.unit, ing.perPerson * (servings - gf));
        add(ing.gfSub, ing.unit, ing.perPerson * gf);
      } else {
        add(ing.name, ing.unit, ing.perPerson * servings);
      }
    }
  }

  return [...map.values()]
    .map((l) => ({ ...l, qty: roundQty(l.qty, l.unit) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
