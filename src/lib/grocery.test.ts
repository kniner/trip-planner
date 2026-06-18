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
  const tacos: MealEntry = { id: '1', label: 'Mon', recipeId: 'tacos' };

  it('scales quantities by servings and rounds count units up', () => {
    const list = computeGrocery([tacos], 4);
    const beef = list.find((l) => l.name === 'Ground beef');
    const shells = list.find((l) => l.name === 'Taco shells');
    expect(beef?.qty).toBe(1); // 0.25 lb * 4
    // 2.5 shells * 4 = 10 (count unit, whole number)
    expect(shells?.qty).toBe(10);
  });

  it('combines the same ingredient across meals', () => {
    const chili: MealEntry = { id: '2', label: 'Tue', recipeId: 'chili' };
    const list = computeGrocery([tacos, chili], 4);
    const beef = list.find((l) => l.name === 'Ground beef');
    // tacos 0.25 + chili 0.25 = 0.5 per person * 4 = 2 lb, one combined line.
    expect(beef?.qty).toBe(2);
    expect(list.filter((l) => l.name === 'Ground beef')).toHaveLength(1);
  });

  it('ignores unknown recipes', () => {
    expect(computeGrocery([{ id: 'x', label: '', recipeId: 'nope' }], 4)).toEqual([]);
  });
});
