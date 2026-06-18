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
  out: 'bg-slate-100 text-slate-500',
};

/** Selectable meal slots (the recipe's own 'out' category isn't a slot). */
const COURSES: MealCategory[] = ['breakfast', 'lunch', 'dinner'];

/** A meal entry's slot: its explicit course, else the recipe's category. */
function entryCourse(course: MealCategory | undefined, recipe: Recipe | undefined): MealCategory {
  if (course) return course;
  const c = recipe?.category;
  return c && c !== 'out' ? c : 'dinner';
}

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
        <Num label="Gluten-free (of adults)" value={meals.glutenFree} onChange={setGlutenFree} />
        <p className="text-[11px] text-slate-400">
          ≈ {servings.toFixed(1)} adult servings (kids = 60%).{' '}
          {meals.glutenFree > 0
            ? `${meals.glutenFree} of the adults above eat GF — their portions use GF substitutes (not extra people).`
            : 'Gluten-free eaters are counted within the adults above, not added on top.'}
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
  const [course, setCourse] = useState<MealCategory>(entryCourse(undefined, RECIPES[0]));

  const pickRecipe = (id: string) => {
    setRecipeId(id);
    const cat = allRecipes.find((r) => r.id === id)?.category;
    if (cat && cat !== 'out') setCourse(cat); // auto-match slot for normal recipes
  };

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
            COURSES.indexOf(entryCourse(x.course, recipesById[x.recipeId])) -
            COURSES.indexOf(entryCourse(y.course, recipesById[y.recipeId])),
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
              const course = entryCourse(entry.course, recipe);
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
                >
                  <select
                    value={course}
                    onChange={(e) => updateMealEntry(entry.id, { course: e.target.value as MealCategory })}
                    className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold uppercase ${CATEGORY_BADGE[course]}`}
                    title="Meal slot"
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c].slice(0, 3)}
                      </option>
                    ))}
                  </select>
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
          addMealEntry(date, recipeId, course);
        }}
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value as MealCategory)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          title="Meal slot"
        >
          {COURSES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          value={recipeId}
          onChange={(e) => pickRecipe(e.target.value)}
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
  const adults = useStore((s) => s.doc.meals.adults);
  const kids = useStore((s) => s.doc.meals.kids);
  const servings = effectiveServings(adults, kids);
  const safeServings = servings > 0 ? servings : 1;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MealCategory>('dinner');
  const [rows, setRows] = useState<{ name: string; qty: string; unit: string; gfSub: string }[]>([
    { name: '', qty: '', unit: '', gfSub: '' },
  ]);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteName, setPasteName] = useState('');
  const [pasteServings, setPasteServings] = useState('4');
  const [pasteText, setPasteText] = useState('');

  const runPaste = () => {
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const name = pasteName.trim() || 'Pasted recipe';
    setName(name);
    setRows(toEditorRows({ name, servings: Number(pasteServings) || 0, ingredients: lines }, servings));
    setOpen(true);
    setPasteOpen(false);
    setPasteText('');
    setPasteName('');
    setImportMsg(
      `Scaled from ${Number(pasteServings) || 4} servings to your group (~${servings.toFixed(0)}). Review & adjust below.`,
    );
  };

  const setRow = (i: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const runImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportMsg('');
    try {
      const imported = await importRecipeFromUrl(importUrl.trim());
      setName(imported.name);
      setRows(toEditorRows(imported, servings));
      setOpen(true);
      setImportUrl('');
      setImportMsg(
        imported.servings > 0
          ? `Scaled from ${imported.servings} servings to your group (~${servings.toFixed(0)}). Review below.`
          : `Imported (source servings not detected — assumed 4) and scaled to ~${servings.toFixed(0)}. Review below.`,
      );
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const save = () => {
    // The editor works in "amount for your group"; store per-serving so the
    // recipe rescales if headcount changes or it's reused on another day.
    const ingredients: Ingredient[] = rows
      .filter((r) => r.name.trim() && Number(r.qty) > 0)
      .map((r) => ({
        name: r.name.trim(),
        unit: r.unit.trim() || 'count',
        perPerson: Number(r.qty) / safeServings,
        ...(r.gfSub.trim() ? { gfSub: r.gfSub.trim() } : {}),
      }));
    if (!name.trim() || ingredients.length === 0) return;
    addCustomRecipe({ id: newId(), name: name.trim(), category, ingredients, custom: true });
    setName('');
    setCategory('dinner');
    setRows([{ name: '', qty: '', unit: '', gfSub: '' }]);
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
        <div className="mb-2 flex gap-2">
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
      )}

      {!pasteOpen ? (
        <button
          onClick={() => setPasteOpen(true)}
          className="mb-2 block text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          📋 Paste a recipe's ingredients (works for any site)
        </button>
      ) : (
        <div className="mb-2 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
          <div className="flex flex-wrap gap-2">
            <input
              value={pasteName}
              onChange={(e) => setPasteName(e.target.value)}
              placeholder="Recipe name (optional)"
              className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <label className="flex items-center gap-1 text-xs text-slate-500">
              Serves
              <input
                type="number"
                min={1}
                value={pasteServings}
                onChange={(e) => setPasteServings(e.target.value)}
                className="w-16 rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            placeholder={'Paste the ingredient list, one per line:\n2 cups flour\n1 tsp salt\n3 eggs'}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={runPaste}
              disabled={!pasteText.trim()}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Parse & scale
            </button>
            <button onClick={() => setPasteOpen(false)} className="text-sm text-slate-400">
              Cancel
            </button>
            <span className="text-[11px] text-slate-400">
              Scales to your group; review before saving.
            </span>
          </div>
        </div>
      )}

      {importMsg && <p className="mb-2 text-[11px] text-slate-500">{importMsg}</p>}

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

          <p className="text-[11px] text-slate-400">
            Ingredients — quantity is the amount for your whole group (~{servings.toFixed(0)}{' '}
            servings):
          </p>
          {rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1">
              <input
                value={r.name}
                onChange={(e) => setRow(i, { name: e.target.value })}
                placeholder="Ingredient"
                className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
              />
              <input
                value={r.qty}
                onChange={(e) => setRow(i, { qty: e.target.value })}
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
              onClick={() => setRows((rs) => [...rs, { name: '', qty: '', unit: '', gfSub: '' }])}
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

interface GItem {
  key: string;
  name: string;
  unit?: string;
  baseQty?: number;
  isExtra: boolean;
  /** Free-text quantity for manual extras. */
  extraQty?: string;
}

type GroupBy = 'none' | 'store' | 'person';

function Grocery({ grocery }: { grocery: ReturnType<typeof computeGrocery> }) {
  const meals = useStore((s) => s.doc.meals);
  const collaborators = useStore((s) => s.doc.collaborators);
  const addGroceryExtra = useStore((s) => s.addGroceryExtra);
  const resetGroceryLine = useStore((s) => s.resetGroceryLine);
  const [extra, setExtra] = useState('');
  const [extraQty, setExtraQty] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  const items = useMemo<GItem[]>(() => {
    const list: GItem[] = [];
    for (const line of grocery) {
      if (meals.groceryOverrides[line.key]?.removed) continue;
      list.push({ key: line.key, name: line.name, unit: line.unit, baseQty: line.qty, isExtra: false });
    }
    for (const x of meals.extras)
      list.push({ key: x.id, name: x.text, isExtra: true, extraQty: x.qty });
    return list;
  }, [grocery, meals.extras, meals.groceryOverrides]);

  const stores = useMemo(
    () =>
      Array.from(
        new Set(Object.values(meals.groceryMeta).map((m) => m.store).filter(Boolean)),
      ) as string[],
    [meals.groceryMeta],
  );

  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ label: null as string | null, items }];
    const fallback = groupBy === 'store' ? '' : '';
    const nameFor = (it: GItem) => {
      const meta = meals.groceryMeta[it.key];
      if (groupBy === 'store') return meta?.store ?? '';
      const id = meta?.assignee;
      return id ? collaborators.find((c) => c.id === id)?.name ?? '' : '';
    };
    const empty = groupBy === 'store' ? 'No store assigned' : 'Unclaimed';
    const map = new Map<string, GItem[]>();
    for (const it of items) {
      const key = nameFor(it) || fallback;
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
      .map(([k, its]) => ({ label: k || empty, items: its }));
  }, [groupBy, items, meals.groceryMeta, collaborators]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Grocery list</h2>
          <p className="text-xs text-slate-500">
            Auto-built from your meals · {grocery.length} ingredients. Claim items,
            assign a store, edit quantities, check off as you shop.
          </p>
        </div>
        <label className="flex items-center gap-1 text-[11px] text-slate-500">
          Group by
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded border border-slate-300 px-1.5 py-0.5 text-[11px]"
          >
            <option value="none">Nothing</option>
            <option value="store">Store</option>
            <option value="person">Person signed up</option>
          </select>
        </label>
      </div>

      <datalist id="grocery-stores">
        {stores.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {items.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
          Add meals to generate the grocery list, or add your own staples below.
        </p>
      ) : (
        groups.map((g) => (
          <div key={g.label ?? '__none'}>
            {groupBy !== 'none' && (
              <h3 className="mb-1 mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {g.label}
              </h3>
            )}
            <ul className="space-y-1.5">
              {g.items.map((it) => (
                <GroceryRow key={it.key} item={it} />
              ))}
            </ul>
          </div>
        ))
      )}

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
          addGroceryExtra(extra, extraQty);
          setExtra('');
          setExtraQty('');
        }}
      >
        <input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Add a staple (milk, coffee, paper towels…)"
          className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
        <input
          value={extraQty}
          onChange={(e) => setExtraQty(e.target.value)}
          placeholder="qty"
          className="w-20 shrink-0 rounded border border-slate-300 px-2 py-1.5 text-sm"
          title="Optional quantity (e.g. 2 gallons)"
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

function GroceryRow({ item }: { item: GItem }) {
  const meals = useStore((s) => s.doc.meals);
  const collaborators = useStore((s) => s.doc.collaborators);
  const meId = useStore((s) => s.meId);
  const toggleGrocery = useStore((s) => s.toggleGrocery);
  const setGroceryQty = useStore((s) => s.setGroceryQty);
  const removeGroceryLine = useStore((s) => s.removeGroceryLine);
  const resetGroceryLine = useStore((s) => s.resetGroceryLine);
  const removeGroceryExtra = useStore((s) => s.removeGroceryExtra);
  const setGroceryExtraQty = useStore((s) => s.setGroceryExtraQty);
  const toggleGroceryClaim = useStore((s) => s.toggleGroceryClaim);
  const setGroceryStore = useStore((s) => s.setGroceryStore);

  const isChecked = meals.groceryChecked.includes(item.key);
  const override = item.isExtra ? undefined : meals.groceryOverrides[item.key];
  const qty = override?.qty ?? item.baseQty ?? 0;
  const adjusted = !item.isExtra && override?.qty !== undefined;
  const meta = meals.groceryMeta[item.key] ?? {};
  const claimer = collaborators.find((c) => c.id === meta.assignee);
  const mine = meta.assignee === meId;

  return (
    <li className="space-y-1.5 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => toggleGrocery(item.key)}
          className="h-4 w-4 shrink-0 accent-emerald-600"
        />
        <span className={`flex-1 text-sm ${isChecked ? 'text-slate-400 line-through' : ''}`}>
          {item.name}
        </span>
        {!item.isExtra && (
          <>
            <input
              type="number"
              min={0}
              step="0.25"
              value={qty}
              onChange={(e) => setGroceryQty(item.key, Number(e.target.value))}
              className={`w-16 shrink-0 rounded border px-1.5 py-0.5 text-right text-xs ${
                adjusted ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
              }`}
              title={adjusted ? 'Manually adjusted' : 'Auto-estimated — edit to override'}
            />
            <span className="w-10 shrink-0 text-xs text-slate-500">{item.unit}</span>
          </>
        )}
        {item.isExtra && (
          <input
            value={item.extraQty ?? ''}
            onChange={(e) => setGroceryExtraQty(item.key, e.target.value)}
            placeholder="qty"
            className="w-20 shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-right text-xs"
            title="Quantity"
          />
        )}
        {adjusted ? (
          <button
            onClick={() => resetGroceryLine(item.key)}
            className="shrink-0 text-xs text-slate-300 hover:text-slate-600"
            title="Reset to estimate"
          >
            ↺
          </button>
        ) : (
          <button
            onClick={() => (item.isExtra ? removeGroceryExtra(item.key) : removeGroceryLine(item.key))}
            className="shrink-0 text-xs text-slate-300 hover:text-red-500"
            title="Remove from list"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 pl-6">
        <input
          list="grocery-stores"
          value={meta.store ?? ''}
          onChange={(e) => setGroceryStore(item.key, e.target.value)}
          placeholder="store"
          className="w-28 rounded border border-slate-200 px-1.5 py-0.5 text-[11px]"
        />
        <button
          onClick={() => toggleGroceryClaim(item.key)}
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            mine
              ? 'bg-emerald-600 text-white'
              : claimer
                ? 'border text-slate-600'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
          style={claimer && !mine ? { borderColor: claimer.color, color: claimer.color } : undefined}
          title="Sign up to get this item"
        >
          {mine ? "✓ You've got it" : claimer ? `${claimer.name} — tap to take` : "I'll get it"}
        </button>
      </div>
    </li>
  );
}
