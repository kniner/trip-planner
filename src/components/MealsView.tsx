import { useMemo, useState } from 'react';
import { RECIPES } from '../data/recipes';
import { computeGrocery, effectiveServings } from '../lib/grocery';
import { useStore } from '../store/useStore';

/** Home meal planner: assign recipes to nights and auto-build a grocery list. */
export function MealsView() {
  const meals = useStore((s) => s.doc.meals);
  const setMealHeadcount = useStore((s) => s.setMealHeadcount);
  const addMealEntry = useStore((s) => s.addMealEntry);
  const updateMealEntry = useStore((s) => s.updateMealEntry);
  const removeMealEntry = useStore((s) => s.removeMealEntry);
  const toggleGrocery = useStore((s) => s.toggleGrocery);
  const addGroceryExtra = useStore((s) => s.addGroceryExtra);
  const removeGroceryExtra = useStore((s) => s.removeGroceryExtra);
  const setGroceryQty = useStore((s) => s.setGroceryQty);
  const removeGroceryLine = useStore((s) => s.removeGroceryLine);
  const resetGroceryLine = useStore((s) => s.resetGroceryLine);

  const [label, setLabel] = useState('');
  const [recipeId, setRecipeId] = useState(RECIPES[0]?.id ?? '');
  const [extra, setExtra] = useState('');

  const servings = effectiveServings(meals.adults, meals.kids);
  const grocery = useMemo(
    () => computeGrocery(meals.entries, servings),
    [meals.entries, servings],
  );
  const checked = new Set(meals.groceryChecked);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: headcount + meal plan */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">Meal plan</h2>
          <p className="text-xs text-slate-500">
            Pick a meal for each night — the grocery list builds itself, scaled to
            your group.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-3 shadow-sm">
          <label className="text-xs text-slate-500">
            Adults
            <input
              type="number"
              min={0}
              value={meals.adults}
              onChange={(e) => setMealHeadcount(Number(e.target.value), meals.kids)}
              className="mt-0.5 block w-20 rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Kids
            <input
              type="number"
              min={0}
              value={meals.kids}
              onChange={(e) => setMealHeadcount(meals.adults, Number(e.target.value))}
              className="mt-0.5 block w-20 rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <p className="text-[11px] text-slate-400">
            ≈ {servings.toFixed(1)} adult servings (kids count as 60%).
          </p>
        </div>

        <ul className="space-y-2">
          {meals.entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
            >
              <input
                value={entry.label}
                onChange={(e) => updateMealEntry(entry.id, { label: e.target.value })}
                className="w-28 shrink-0 rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <select
                value={entry.recipeId}
                onChange={(e) => updateMealEntry(entry.id, { recipeId: e.target.value })}
                className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
              >
                {RECIPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeMealEntry(entry.id)}
                className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                title="Remove meal"
              >
                ✕
              </button>
            </li>
          ))}
          {meals.entries.length === 0 && (
            <li className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
              No meals planned yet — add one below.
            </li>
          )}
        </ul>

        <form
          className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            addMealEntry(label, recipeId);
            setLabel('');
          }}
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Night (e.g. Mon)"
            className="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            {RECIPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Add meal
          </button>
        </form>
      </section>

      {/* Right: grocery list */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">Grocery list</h2>
          <p className="text-xs text-slate-500">
            Auto-built from your meals · {grocery.length} ingredients. Check items
            off as you shop (shared with everyone).
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
    </div>
  );
}
