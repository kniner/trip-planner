import { useMemo, useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_ORDER, RECIPES, RECIPES_BY_ID } from '../data/recipes';
import { computeGrocery, effectiveServings } from '../lib/grocery';
import { importRecipeFromUrl, toEditorRows } from '../lib/recipeImport';
import { isSupabaseConfigured } from '../store/sync';
import type { Ingredient, MealCategory, Recipe } from '../lib/types';
import { useStore } from '../store/useStore';

const CAN_IMPORT = isSupabaseConfigured();

const newId = () => Math.random().toString(36).slice(2, 10);

function fmtDate(d: string): string {
  if (!d) return 'Unscheduled';
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const CATEGORY_BADGE: Record<MealCategory, string> = {
  breakfast: 'bg-amber-100 text-amber-700',
  lunch: 'bg-sky-100 text-sky-700',
  dinner: 'bg-indigo-100 text-indigo-700',
};

export function MealsView() {
  const meals = useStore((s) => s.doc.meals);
  const setMealHeadcount = useStore((s) => s.setMealHeadcount);
  const setGlutenFree = useStore((s) => s.setGlutenFree);

  const allRecipes = useMemo(() => [...RECIPES, ...meals.customRecipes], [meals.customRecipes]);
  const recipesById = useMemo<Record<string, Recipe>>(
    () => ({ ...RECIPES_BY_ID, ...Object.fromEntries(meals.customRecipes.map((r) => [r.id, r])) }),
    [meals.customRecipes],
  );

  const servings = effectiveServings(meals.adults, meals.kids);
  const grocery = useMemo(
    () => computeGrocery(meals.entries, servings, meals.glutenFree, recipesById),
    [meals.entries, servings, meals.glutenFree, recipesById],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-3 shadow-sm">
        <Num label="Adults" value={meals.adults} onChange={(n) => setMealHeadcount(n, meals.kids)} />
        <Num label="Kids" value={meals.kids} onChange={(n) => setMealHeadcount(meals.adults, n)} />
        <Num label="Gluten-free" value={meals.glutenFree} onChange={setGlutenFree} />
        <p className="text-[11px] text-slate-400">
          ≈ {servings.toFixed(1)} adult servings (kids = 60%).{' '}
          {meals.glutenFree > 0 && `GF substitutes split off for ${meals.glutenFree}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MealPlan allRecipes={allRecipes} recipesById={recipesById} />
        <Grocery grocery={grocery} />
      </div>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="text-xs text-slate-500">
      {label}
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-0.5 block w-20 rounded border border-slate-300 px-2 py-1 text-sm"
      />
    </label>
  );
}

function recipeOptions(allRecipes: Recipe[]) {
  const groups: { label: string; recipes: Recipe[] }[] = CATEGORY_ORDER.map((cat) => ({
    label: CATEGORY_LABELS[cat],
    recipes: allRecipes.filter((r) => !r.custom && r.category === cat),
  }));
  const custom = allRecipes.filter((r) => r.custom);
  if (custom.length) groups.push({ label: 'My meals', recipes: custom });
  return groups.map((g) =>
    g.recipes.length === 0 ? null : (
      <optgroup key={g.label} label={g.label}>
        {g.recipes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </optgroup>
    ),
  );
}

function MealPlan({ allRecipes, recipesById }: { allRecipes: Recipe[]; recipesById: Record<string, Recipe> }) {
  const meals = useStore((s) => s.doc.meals);
  const addMealEntry = useStore((s) => s.addMealEntry);
  const updateMealEntry = useStore((s) => s.updateMealEntry);
  const removeMealEntry = useStore((s) => s.removeMealEntry);

  const [date, setDate] = useState('');
  const [recipeId, setRecipeId] = useState(RECIPES[0].id);

  // Group entries by date (unscheduled last), then by meal category.
  const groups = useMemo(() => {
    const byDate = new Map<string, typeof meals.entries>();
    for (const e of meals.entries) {
      const list = byDate.get(e.date) ?? [];
      list.push(e);
      byDate.set(e.date, list);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
      .map(([d, list]) => ({
        date: d,
        entries: [...list].sort(
          (x, y) =>
            CATEGORY_ORDER.indexOf(recipesById[x.recipeId]?.category ?? 'dinner') -
            CATEGORY_ORDER.indexOf(recipesById[y.recipeId]?.category ?? 'dinner'),
        ),
      }));
  }, [meals.entries, recipesById]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Meal plan</h2>
        <p className="text-xs text-slate-500">
          Add breakfast, lunch & dinner by date — the grocery list builds itself.
        </p>
      </div>

      {groups.map((g) => (
        <div key={g.date || 'none'}>
          <h3 className="mb-1 mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {fmtDate(g.date)}
          </h3>
          <ul className="space-y-1.5">
            {g.entries.map((entry) => {
              const recipe = recipesById[entry.recipeId];
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
                >
                  {recipe && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${CATEGORY_BADGE[recipe.category]}`}
                    >
                      {CATEGORY_LABELS[recipe.category].slice(0, 1)}
                    </span>
                  )}
                  <select
                    value={entry.recipeId}
                    onChange={(e) => updateMealEntry(entry.id, { recipeId: e.target.value })}
                    className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
                  >
                    {recipeOptions(allRecipes)}
                  </select>
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateMealEntry(entry.id, { date: e.target.value })}
                    className="shrink-0 rounded border border-slate-200 px-1.5 py-1 text-xs"
                  />
                  <button
                    onClick={() => removeMealEntry(entry.id)}
                    className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                    title="Remove meal"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {meals.entries.length === 0 && (
        <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
          No meals planned yet — add one below.
        </p>
      )}

      <form
        className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          addMealEntry(date, recipeId);
        }}
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <select
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
          className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          {recipeOptions(allRecipes)}
        </select>
        <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
          Add meal
        </button>
      </form>

      <CustomRecipeBuilder />
    </section>
  );
}

function CustomRecipeBuilder() {
  const addCustomRecipe = useStore((s) => s.addCustomRecipe);
  const removeCustomRecipe = useStore((s) => s.removeCustomRecipe);
  const customRecipes = useStore((s) => s.doc.meals.customRecipes);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MealCategory>('dinner');
  const [rows, setRows] = useState<{ name: string; perPerson: string; unit: string; gfSub: string }[]>([
    { name: '', perPerson: '', unit: '', gfSub: '' },
  ]);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const setRow = (i: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const runImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportMsg('');
    try {
      const imported = await importRecipeFromUrl(importUrl.trim());
      setName(imported.name);
      setRows(toEditorRows(imported));
      setOpen(true);
      setImportUrl('');
      setImportMsg(
        imported.servings > 0
          ? `Imported & scaled from a recipe of ${imported.servings}. Review below.`
          : 'Imported (servings not detected — assumed 4). Review quantities below.',
      );
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const save = () => {
    const ingredients: Ingredient[] = rows
      .filter((r) => r.name.trim() && Number(r.perPerson) > 0)
      .map((r) => ({
        name: r.name.trim(),
        unit: r.unit.trim() || 'count',
        perPerson: Number(r.perPerson),
        ...(r.gfSub.trim() ? { gfSub: r.gfSub.trim() } : {}),
      }));
    if (!name.trim() || ingredients.length === 0) return;
    addCustomRecipe({ id: newId(), name: name.trim(), category, ingredients, custom: true });
    setName('');
    setCategory('dinner');
    setRows([{ name: '', perPerson: '', unit: '', gfSub: '' }]);
    setOpen(false);
  };

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      {customRecipes.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {customRecipes.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px]"
            >
              {r.name}
              <button onClick={() => removeCustomRecipe(r.id)} className="text-slate-300 hover:text-red-500">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {CAN_IMPORT && (
        <div className="mb-2">
          <div className="flex gap-2">
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Paste a recipe link to import & scale…"
              className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <button
              onClick={runImport}
              disabled={importing || !importUrl.trim()}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
          {importMsg && <p className="mt-1 text-[11px] text-slate-500">{importMsg}</p>}
        </div>
      )}

      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm font-medium text-slate-600 hover:text-slate-900">
          + Create your own meal
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meal name (e.g. Grandma's lasagna)"
              className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MealCategory)}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-slate-400">Ingredients (quantity is per adult serving):</p>
          {rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1">
              <input
                value={r.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
                placeholder="Ingredient"
                className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
              />
              <input
                value={r.perPerson}
                onChange={(e) => setRow(i, { perPerson: e.target.value })}
                placeholder="qty"
                inputMode="decimal"
                className="w-16 rounded border border-slate-200 px-2 py-1 text-xs"
              />
              <input
                value={r.unit}
                onChange={(e) => setRow(i, { unit: e.target.value })}
                placeholder="unit"
                className="w-20 rounded border border-slate-200 px-2 py-1 text-xs"
              />
              <input
                value={r.gfSub}
                onChange={(e) => setRow(i, { gfSub: e.target.value })}
                placeholder="GF sub (optional)"
                className="w-32 rounded border border-slate-200 px-2 py-1 text-xs"
              />
              {rows.length > 1 && (
                <button
                  onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  className="text-xs text-slate-300 hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRows((rs) => [...rs, { name: '', perPerson: '', unit: '', gfSub: '' }])}
              className="text-xs text-slate-500 underline"
            >
              + ingredient
            </button>
            <button
              onClick={save}
              className="ml-auto rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              Save meal
            </button>
            <button onClick={() => setOpen(false)} className="text-sm text-slate-400">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Grocery({ grocery }: { grocery: ReturnType<typeof computeGrocery> }) {
  const meals = useStore((s) => s.doc.meals);
  const toggleGrocery = useStore((s) => s.toggleGrocery);
  const addGroceryExtra = useStore((s) => s.addGroceryExtra);
  const removeGroceryExtra = useStore((s) => s.removeGroceryExtra);
  const setGroceryQty = useStore((s) => s.setGroceryQty);
  const removeGroceryLine = useStore((s) => s.removeGroceryLine);
  const resetGroceryLine = useStore((s) => s.resetGroceryLine);
  const [extra, setExtra] = useState('');

  const checked = new Set(meals.groceryChecked);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Grocery list</h2>
        <p className="text-xs text-slate-500">
          Auto-built from your meals · {grocery.length} ingredients. Edit any
          quantity, remove lines, or check off as you shop.
        </p>
      </div>

      <ul className="space-y-1.5">
        {grocery.map((line) => {
          const override = meals.groceryOverrides[line.key];
          if (override?.removed) return null;
          const isChecked = checked.has(line.key);
          const qty = override?.qty ?? line.qty;
          const adjusted = override?.qty !== undefined;
          return (
            <li
              key={line.key}
              className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleGrocery(line.key)}
                className="h-4 w-4 shrink-0 accent-emerald-600"
              />
              <span className={`flex-1 text-sm ${isChecked ? 'text-slate-400 line-through' : ''}`}>
                {line.name}
              </span>
              <input
                type="number"
                min={0}
                step="0.25"
                value={qty}
                onChange={(e) => setGroceryQty(line.key, Number(e.target.value))}
                className={`w-16 shrink-0 rounded border px-1.5 py-0.5 text-right text-xs ${
                  adjusted ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
                }`}
                title={adjusted ? 'Manually adjusted' : 'Auto-estimated — edit to override'}
              />
              <span className="w-12 shrink-0 text-xs text-slate-500">{line.unit}</span>
              {adjusted ? (
                <button
                  onClick={() => resetGroceryLine(line.key)}
                  className="shrink-0 text-xs text-slate-300 hover:text-slate-600"
                  title="Reset to estimate"
                >
                  ↺
                </button>
              ) : (
                <button
                  onClick={() => removeGroceryLine(line.key)}
                  className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                  title="Remove from list"
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}

        {meals.extras.map((x) => {
          const isChecked = checked.has(x.id);
          return (
            <li
              key={x.id}
              className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleGrocery(x.id)}
                className="h-4 w-4 shrink-0 accent-emerald-600"
              />
              <span className={`flex-1 text-sm ${isChecked ? 'text-slate-400 line-through' : ''}`}>
                {x.text}
              </span>
              <button
                onClick={() => removeGroceryExtra(x.id)}
                className="shrink-0 text-xs text-slate-300 hover:text-red-500"
              >
                ✕
              </button>
            </li>
          );
        })}

        {grocery.length === 0 && meals.extras.length === 0 && (
          <li className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
            Add meals to generate the grocery list, or add your own staples below.
          </li>
        )}
      </ul>

      {grocery.some((l) => meals.groceryOverrides[l.key]?.removed) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
          <span>Removed:</span>
          {grocery
            .filter((l) => meals.groceryOverrides[l.key]?.removed)
            .map((l) => (
              <button
                key={l.key}
                onClick={() => resetGroceryLine(l.key)}
                className="rounded-full border border-slate-200 px-2 py-0.5 text-slate-500 hover:bg-slate-50"
                title="Restore"
              >
                {l.name} ↺
              </button>
            ))}
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addGroceryExtra(extra);
          setExtra('');
        }}
      >
        <input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Add a staple (milk, coffee, paper towels…)"
          className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={!extra.trim()}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </section>
  );
}
