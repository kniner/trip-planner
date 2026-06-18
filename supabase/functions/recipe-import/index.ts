// Supabase Edge Function: fetch a recipe URL and extract its schema.org Recipe
// data (name, yield, ingredients). Deploy with:
//   supabase functions deploy recipe-import
// The browser app can't fetch arbitrary sites (CORS), so this runs server-side.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// deno-lint-ignore no-explicit-any
function findRecipe(node: any): any | null {
  if (!node || typeof node !== 'object') return null;
  const type = node['@type'];
  const isRecipe = type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
  if (isRecipe) return node;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n);
      if (r) return r;
    }
  }
  if (node['@graph']) return findRecipe(node['@graph']);
  return null;
}

// deno-lint-ignore no-explicit-any
function parseYield(y: any): number {
  if (Array.isArray(y)) {
    const num = y.find((x) => typeof x === 'number');
    if (typeof num === 'number') return num;
    y = y[0];
  }
  if (typeof y === 'number') return y;
  if (typeof y === 'string') {
    const m = y.match(/\d+/);
    if (m) return Number(m[0]);
  }
  return 0;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    let url = new URL(req.url).searchParams.get('url');
    if (!url && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      url = body.url;
    }
    if (!url) return json({ error: 'Missing recipe url' }, 400);

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WDWPlanner RecipeImport)' },
    });
    if (!res.ok) return json({ error: `Could not fetch page (${res.status})` }, 502);
    const html = await res.text();

    const blocks = [
      ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
    ];
    let recipe = null;
    for (const b of blocks) {
      try {
        recipe = findRecipe(JSON.parse(b[1].trim()));
        if (recipe) break;
      } catch {
        // skip malformed JSON-LD blocks
      }
    }
    if (!recipe) return json({ error: 'No recipe data found on that page' }, 404);

    const ingredients = (recipe.recipeIngredient ?? recipe.ingredients ?? [])
      .map((x: unknown) => String(x).trim())
      .filter(Boolean);

    return json({
      name: typeof recipe.name === 'string' ? recipe.name : 'Imported recipe',
      servings: parseYield(recipe.recipeYield),
      ingredients,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
