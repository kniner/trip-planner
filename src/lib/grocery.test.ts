import { describe, expect, it } from 'vitest';
import { computeGrocery, effectiveServings, KID_FACTOR } from './grocery';
import type { MealEntry } from './types';

describe('effectiveServings', () => {
  it('counts kids as a fraction of an adult', () => {
    expect(effectiveServings(8, 3)).toBeCloseTo(8 + 3 * KID_FACTOR);
  });
  it('floors negatives at zero', () => {
    expect(effectiveServings(-2, -5)).toBe(0);
  });
});

describe('computeGrocery', () => {
  const tacos: MealEntry = { id: '1', date: '2026-07-01', recipeId: 'tacos' };

  it('scales quantities by servings and rounds count units up', () => {
    const list = computeGrocery([tacos], 4);
    const beef = list.find((l) => l.name === 'Ground beef');
    const shells = list.find((l) => l.name === 'Taco shells');
    expect(beef?.qty).toBe(1); // 0.25 lb * 4
    // 2.5 shells * 4 = 10 (count unit, whole number)
    expect(shells?.qty).toBe(10);
  });

  it('combines the same ingredient across meals', () => {
    const chili: MealEntry = { id: '2', date: '2026-07-02', recipeId: 'chili' };
    const list = computeGrocery([tacos, chili], 4);
    const beef = list.find((l) => l.name === 'Ground beef');
    // tacos 0.25 + chili 0.25 = 0.5 per person * 4 = 2 lb, one combined line.
    expect(beef?.qty).toBe(2);
    expect(list.filter((l) => l.name === 'Ground beef')).toHaveLength(1);
  });

  it('splits gluten-free servings into a substitute line', () => {
    // 4 servings, 1 gluten-free: regular shells for 3, GF shells for 1.
    const list = computeGrocery([tacos], 4, 1);
    const shells = list.find((l) => l.name === 'Taco shells');
    const gfShells = list.find((l) => l.name === 'GF taco shells');
    expect(shells?.qty).toBe(Math.ceil(2.5 * 3)); // 8
    expect(gfShells?.qty).toBe(Math.ceil(2.5 * 1)); // 3
    // Non-gluten items are unaffected.
    expect(list.find((l) => l.name === 'Ground beef')?.qty).toBe(1);
  });

  it('ignores unknown recipes', () => {
    expect(computeGrocery([{ id: 'x', date: '', recipeId: 'nope' }], 4)).toEqual([]);
  });
});
