import type { Ingredient } from './types';
import { parseIngredient } from './parseIngredient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface ImportedRecipe {
  name: string;
  /** Servings the source recipe yields (0 if undetected). */
  servings: number;
  ingredients: string[];
}

/** Call the recipe-import Edge Function to fetch + parse a recipe URL. */
export async function importRecipeFromUrl(recipeUrl: string): Promise<ImportedRecipe> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Recipe import needs cloud sync configured.');
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/recipe-import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ url: recipeUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Import failed (${res.status})`);
  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    throw new Error(
      "Couldn't find recipe ingredients on that page. Try a major recipe site, or add the meal manually.",
    );
  }
  return {
    name: typeof data.name === 'string' ? data.name : 'Imported recipe',
    servings: Number(data.servings) || 0,
    ingredients: data.ingredients.map(String),
  };
}

export interface ImportedRow {
  name: string;
  /** Per-adult-serving quantity as a string, or '' when undetected. */
  perPerson: string;
  unit: string;
  gfSub: string;
}

/**
 * Convert an imported recipe's free-text ingredients into per-serving editor
 * rows, dividing each parsed quantity by the recipe's yield so it scales to any
 * headcount. Undetected quantities are left blank for the user to fill in.
 */
export function toEditorRows(imported: ImportedRecipe): ImportedRow[] {
  const servings = imported.servings > 0 ? imported.servings : 4;
  return (imported.ingredients ?? []).map((line) => {
    const p = parseIngredient(line);
    const perPerson = p.qty != null ? String(Number((p.qty / servings).toFixed(3))) : '';
    return { name: p.name || line, perPerson, unit: p.unit, gfSub: '' };
  });
}

/** Build editor rows directly into Ingredient[] (used by tests/util). */
export function rowsToIngredients(rows: ImportedRow[]): Ingredient[] {
  return rows
    .filter((r) => r.name.trim() && Number(r.perPerson) > 0)
    .map((r) => ({
      name: r.name.trim(),
      unit: r.unit.trim() || 'count',
      perPerson: Number(r.perPerson),
      ...(r.gfSub.trim() ? { gfSub: r.gfSub.trim() } : {}),
    }));
}
