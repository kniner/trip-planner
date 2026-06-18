import { useMemo } from 'react';
import { CATEGORY_LABELS, RECIPES_BY_ID } from '../data/recipes';
import type { MealCategory, Recipe } from '../lib/types';
import { useStore } from '../store/useStore';

const CATEGORY_BADGE: Record<MealCategory, string> = {
  breakfast: 'bg-amber-100 text-amber-700',
  lunch: 'bg-sky-100 text-sky-700',
  dinner: 'bg-indigo-100 text-indigo-700',
  out: 'bg-slate-100 text-slate-500',
};

const COURSE_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'out'];

/** A meal entry's slot: its explicit course, else the recipe's category. */
function entryCourse(course: MealCategory | undefined, recipe: Recipe | undefined): MealCategory {
  if (course) return course;
  const c = recipe?.category;
  return c && c !== 'out' ? c : 'dinner';
}

/** Default minutes for a meal dropped onto the timeline as a time block. */
const MEAL_BLOCK_MIN: Record<MealCategory, number> = {
  breakfast: 45,
  lunch: 45,
  dinner: 60,
  out: 60,
};

/**
 * Shows the home meals planned for this day's calendar date (from the Meals
 * tab) and lets the owner drop any of them onto the day's timeline as a time
 * block — the bridge between the meal plan and the schedule.
 */
export function DayMealsCard({ date }: { date?: string }) {
  const meals = useStore((s) => s.doc.meals);
  const addCustomStop = useStore((s) => s.addCustomStop);

  const recipesById = useMemo<Record<string, Recipe>>(
    () => ({ ...RECIPES_BY_ID, ...Object.fromEntries(meals.customRecipes.map((r) => [r.id, r])) }),
    [meals.customRecipes],
  );

  const dayMeals = useMemo(() => {
    if (!date) return [];
    return meals.entries
      .filter((e) => e.date === date)
      .map((e) => {
        const recipe = recipesById[e.recipeId];
        return { entry: e, recipe, course: entryCourse(e.course, recipe) };
      })
      .filter((m) => m.recipe)
      .sort((a, b) => COURSE_ORDER.indexOf(a.course) - COURSE_ORDER.indexOf(b.course));
  }, [date, meals.entries, recipesById]);

  if (!date) {
    return (
      <p className="rounded-lg bg-white p-3 text-xs text-slate-400 shadow-sm">
        Set a date for this day to see the meals you've planned for it.
      </p>
    );
  }

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Meals planned this day
      </h3>
      {dayMeals.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">
          No meals planned for this date yet — add them on the Meals tab.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {dayMeals.map(({ entry, recipe, course }) => (
            <li key={entry.id} className="flex items-center gap-2">
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${CATEGORY_BADGE[course]}`}
              >
                {CATEGORY_LABELS[course]}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{recipe!.name}</span>
              <button
                onClick={() =>
                  addCustomStop({
                    name: `${CATEGORY_LABELS[course]}: ${recipe!.name}`,
                    durationMin: MEAL_BLOCK_MIN[course],
                  })
                }
                className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                title="Add this meal to the day's timeline"
              >
                + schedule
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
