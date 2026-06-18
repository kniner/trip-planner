import { describe, expect, it } from 'vitest';
import { parseIngredient } from './parseIngredient';

describe('parseIngredient', () => {
  it('parses whole numbers with units', () => {
    expect(parseIngredient('2 cups flour')).toEqual({ qty: 2, unit: 'cup', name: 'flour' });
  });

  it('parses decimals and plural units', () => {
    expect(parseIngredient('1.5 tablespoons olive oil')).toEqual({
      qty: 1.5,
      unit: 'tbsp',
      name: 'olive oil',
    });
  });

  it('parses simple fractions', () => {
    expect(parseIngredient('1/2 tsp salt')).toEqual({ qty: 0.5, unit: 'tsp', name: 'salt' });
  });

  it('parses mixed unicode fractions', () => {
    const r = parseIngredient('1 ½ cups sugar');
    expect(r.qty).toBeCloseTo(1.5);
    expect(r.unit).toBe('cup');
    expect(r.name).toBe('sugar');
  });

  it('averages ranges', () => {
    const r = parseIngredient('2-3 cloves garlic');
    expect(r.qty).toBeCloseTo(2.5);
    expect(r.unit).toBe('clove');
    expect(r.name).toBe('garlic');
  });

  it('handles no unit', () => {
    expect(parseIngredient('3 eggs')).toEqual({ qty: 3, unit: '', name: 'eggs' });
  });

  it('handles no quantity', () => {
    expect(parseIngredient('salt to taste')).toEqual({ qty: null, unit: '', name: 'salt to taste' });
  });

  it('drops trailing notes after a comma', () => {
    expect(parseIngredient('1 onion, finely chopped')).toEqual({
      qty: 1,
      unit: '',
      name: 'onion',
    });
  });
});
