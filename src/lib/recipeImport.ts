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
  /** Quantity scaled to the target group, as a string ('' when undetected). */
  qty: string;
  unit: string;
  gfSub: string;
}

/**
 * Convert an imported recipe's free-text ingredients into editor rows whose
 * quantities are scaled from the recipe's yield up to the target group size, so
 * the reviewer sees what they'll actually buy. Undetected quantities are left
 * blank to fill in.
 */
export function toEditorRows(imported: ImportedRecipe, targetServings: number): ImportedRow[] {
  const recipeServings = imported.servings > 0 ? imported.servings : 4;
  const factor = (targetServings > 0 ? targetServings : 1) / recipeServings;
  return (imported.ingredients ?? []).map((line) => {
    const p = parseIngredient(line);
    const qty = p.qty != null ? String(Number((p.qty * factor).toFixed(2))) : '';
    return { name: p.name || line, qty, unit: p.unit, gfSub: '' };
  });
}
