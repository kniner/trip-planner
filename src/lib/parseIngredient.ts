/**
 * Best-effort parser for free-text recipe ingredient lines like
 * "1 ½ cups all-purpose flour" → { qty: 1.5, unit: 'cup', name: 'all-purpose flour' }.
 * Imperfect by nature — imported recipes are shown in the editor for review.
 */

const UNICODE_FRACTIONS: Record<string, string> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};

// Known measurement units → normalized singular form.
const UNIT_MAP: Record<string, string> = {
  cup: 'cup', cups: 'cup', c: 'cup',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg',
  ml: 'ml', l: 'l',
  quart: 'quart', quarts: 'quart', qt: 'quart',
  pint: 'pint', pints: 'pint',
  gallon: 'gallon', gallons: 'gallon',
  clove: 'clove', cloves: 'clove',
  can: 'can', cans: 'can',
  package: 'package', packages: 'package', pkg: 'package', pkgs: 'package',
  bag: 'bag', bags: 'bag',
  box: 'box', boxes: 'box',
  jar: 'jar', jars: 'jar',
  bottle: 'bottle', bottles: 'bottle',
  container: 'container', containers: 'container',
  sleeve: 'sleeve', sleeves: 'sleeve',
  bunch: 'bunch', bunches: 'bunch',
  stalk: 'stalk', stalks: 'stalk',
  ear: 'ear', ears: 'ear',
  loaf: 'loaf', loaves: 'loaf',
  dozen: 'dozen',
  slice: 'slice', slices: 'slice',
  stick: 'stick', sticks: 'stick',
  head: 'head', heads: 'head',
  pinch: 'pinch',
};

export interface ParsedIngredient {
  /** Quantity, or null when none could be detected (e.g. "salt to taste"). */
  qty: number | null;
  unit: string;
  name: string;
}

/** Evaluate "1", "1.5", "1/2", or "1 1/2" into a number. */
function evalNumber(token: string): number {
  const parts = token.trim().split(/\s+/);
  let total = 0;
  for (const p of parts) {
    if (p.includes('/')) {
      const [a, b] = p.split('/').map(Number);
      if (b) total += a / b;
    } else {
      total += Number(p);
    }
  }
  return total;
}

export function parseIngredient(raw: string): ParsedIngredient {
  let str = raw.trim();
  // Normalize unicode fractions: "1½" → "1 1/2", "½" → "1/2".
  str = str.replace(/(\d)\s*([½⅓⅔¼¾⅛⅜⅝⅞])/g, (_, d, f) => `${d} ${UNICODE_FRACTIONS[f]}`);
  str = str.replace(/[½⅓⅔¼¾⅛⅜⅝⅞]/g, (f) => UNICODE_FRACTIONS[f]);

  const numToken = '\\d+/\\d+|\\d+(?:\\.\\d+)?(?:\\s+\\d+/\\d+)?';
  const m = str.match(
    new RegExp(`^(${numToken})(?:\\s*(?:-|–|to)\\s*(${numToken}))?`),
  );

  let qty: number | null = null;
  if (m) {
    const a = evalNumber(m[1]);
    const b = m[2] ? evalNumber(m[2]) : null;
    qty = b != null ? (a + b) / 2 : a; // ranges → midpoint
    str = str.slice(m[0].length).trim();
  }

  // Drop parenthetical size notes like "(10 1/2 ounce)" that confuse parsing.
  str = str.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();

  // Optional unit as the next word.
  let unit = '';
  const words = str.split(/\s+/);
  if (words.length > 0) {
    const head = words[0].toLowerCase().replace(/\.$/, '');
    if (UNIT_MAP[head]) {
      unit = UNIT_MAP[head];
      str = words.slice(1).join(' ');
    }
  }

  // Tidy the remaining name.
  const name = str.replace(/^of\s+/i, '').replace(/,.*$/, '').trim();
  return { qty, unit, name };
}
