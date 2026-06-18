import type { Recipe } from '../lib/types';

/**
 * Catalog of common home meals with per-adult-serving ingredient quantities.
 * Quantities are rough planning estimates and scale with headcount; kids count
 * as a fraction of an adult serving (see lib/grocery.ts).
 */
export const RECIPES: Recipe[] = [
  {
    id: 'tacos',
    name: 'Tacos',
    ingredients: [
      { name: 'Ground beef', unit: 'lb', perPerson: 0.25 },
      { name: 'Taco shells', unit: 'count', perPerson: 2.5 },
      { name: 'Shredded cheese', unit: 'cup', perPerson: 0.3 },
      { name: 'Lettuce', unit: 'cup', perPerson: 0.25 },
      { name: 'Tomato', unit: 'count', perPerson: 0.3 },
      { name: 'Salsa', unit: 'tbsp', perPerson: 2 },
      { name: 'Sour cream', unit: 'tbsp', perPerson: 1 },
      { name: 'Taco seasoning', unit: 'packet', perPerson: 0.2 },
    ],
  },
  {
    id: 'spaghetti',
    name: 'Spaghetti & Meatballs',
    ingredients: [
      { name: 'Spaghetti', unit: 'lb', perPerson: 0.2 },
      { name: 'Meatballs', unit: 'count', perPerson: 4 },
      { name: 'Marinara sauce', unit: 'cup', perPerson: 0.5 },
      { name: 'Parmesan', unit: 'tbsp', perPerson: 1 },
      { name: 'Garlic bread', unit: 'slice', perPerson: 1.5 },
    ],
  },
  {
    id: 'burgers',
    name: 'Burgers',
    ingredients: [
      { name: 'Ground beef', unit: 'lb', perPerson: 0.33 },
      { name: 'Burger buns', unit: 'count', perPerson: 1.2 },
      { name: 'Cheese slices', unit: 'count', perPerson: 1 },
      { name: 'Lettuce', unit: 'cup', perPerson: 0.15 },
      { name: 'Tomato', unit: 'count', perPerson: 0.25 },
      { name: 'Ketchup', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'grilled-chicken',
    name: 'Grilled Chicken & Veggies',
    ingredients: [
      { name: 'Chicken breast', unit: 'count', perPerson: 1 },
      { name: 'Mixed vegetables', unit: 'cup', perPerson: 1 },
      { name: 'Olive oil', unit: 'tbsp', perPerson: 1 },
      { name: 'Rice', unit: 'cup', perPerson: 0.25 },
    ],
  },
  {
    id: 'stir-fry',
    name: 'Chicken Stir Fry',
    ingredients: [
      { name: 'Chicken breast', unit: 'count', perPerson: 0.75 },
      { name: 'Stir-fry vegetables', unit: 'cup', perPerson: 1.5 },
      { name: 'Soy sauce', unit: 'tbsp', perPerson: 1.5 },
      { name: 'Rice', unit: 'cup', perPerson: 0.33 },
    ],
  },
  {
    id: 'pizza',
    name: 'Pizza Night',
    ingredients: [
      { name: 'Pizza', unit: 'count', perPerson: 0.33 },
      { name: 'Side salad mix', unit: 'cup', perPerson: 0.5 },
    ],
  },
  {
    id: 'breakfast-dinner',
    name: 'Breakfast for Dinner',
    ingredients: [
      { name: 'Pancake mix', unit: 'cup', perPerson: 0.4 },
      { name: 'Eggs', unit: 'count', perPerson: 2 },
      { name: 'Bacon', unit: 'strip', perPerson: 2 },
      { name: 'Syrup', unit: 'tbsp', perPerson: 2 },
    ],
  },
  {
    id: 'chili',
    name: 'Chili',
    ingredients: [
      { name: 'Ground beef', unit: 'lb', perPerson: 0.25 },
      { name: 'Canned beans', unit: 'can', perPerson: 0.4 },
      { name: 'Diced tomatoes', unit: 'can', perPerson: 0.4 },
      { name: 'Onion', unit: 'count', perPerson: 0.2 },
      { name: 'Chili seasoning', unit: 'packet', perPerson: 0.25 },
      { name: 'Shredded cheese', unit: 'cup', perPerson: 0.2 },
    ],
  },
  {
    id: 'rotisserie-caesar',
    name: 'Rotisserie Chicken & Caesar Salad',
    ingredients: [
      { name: 'Rotisserie chicken', unit: 'count', perPerson: 0.25 },
      { name: 'Romaine lettuce', unit: 'cup', perPerson: 1 },
      { name: 'Caesar dressing', unit: 'tbsp', perPerson: 1.5 },
      { name: 'Croutons', unit: 'cup', perPerson: 0.25 },
      { name: 'Parmesan', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'mac-and-cheese',
    name: 'Mac & Cheese',
    ingredients: [
      { name: 'Macaroni', unit: 'lb', perPerson: 0.2 },
      { name: 'Shredded cheese', unit: 'cup', perPerson: 0.4 },
      { name: 'Milk', unit: 'cup', perPerson: 0.15 },
      { name: 'Butter', unit: 'tbsp', perPerson: 1 },
    ],
  },
];

export const RECIPES_BY_ID: Record<string, Recipe> = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
);
