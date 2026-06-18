import type { Recipe } from '../lib/types';

/**
 * Catalog of common home meals with per-adult-serving ingredient quantities.
 * Quantities are rough planning estimates and scale with headcount; kids count
 * as a fraction of an adult serving (see lib/grocery.ts). Ingredients that
 * contain gluten carry a `gfSub` so a gluten-free portion can be split off.
 */
export const RECIPES: Recipe[] = [
  // ---- Breakfast ----
  {
    id: 'pancakes',
    name: 'Pancakes',
    category: 'breakfast',
    ingredients: [
      { name: 'Pancake mix', unit: 'cup', perPerson: 0.4, gfSub: 'GF pancake mix' },
      { name: 'Eggs', unit: 'count', perPerson: 1 },
      { name: 'Syrup', unit: 'tbsp', perPerson: 2 },
      { name: 'Butter', unit: 'tbsp', perPerson: 0.5 },
    ],
  },
  {
    id: 'eggs-toast',
    name: 'Eggs & Toast',
    category: 'breakfast',
    ingredients: [
      { name: 'Eggs', unit: 'count', perPerson: 2 },
      { name: 'Bread', unit: 'slice', perPerson: 2, gfSub: 'GF bread' },
      { name: 'Butter', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'oatmeal',
    name: 'Oatmeal & Berries',
    category: 'breakfast',
    ingredients: [
      { name: 'Oats', unit: 'cup', perPerson: 0.5 },
      { name: 'Milk', unit: 'cup', perPerson: 0.5 },
      { name: 'Berries', unit: 'cup', perPerson: 0.25 },
      { name: 'Honey', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'breakfast-burrito',
    name: 'Breakfast Burritos',
    category: 'breakfast',
    ingredients: [
      { name: 'Tortillas', unit: 'count', perPerson: 1.5, gfSub: 'GF tortillas' },
      { name: 'Eggs', unit: 'count', perPerson: 2 },
      { name: 'Shredded cheese', unit: 'cup', perPerson: 0.25 },
      { name: 'Breakfast sausage', unit: 'count', perPerson: 1 },
      { name: 'Salsa', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'yogurt-granola',
    name: 'Yogurt & Granola',
    category: 'breakfast',
    ingredients: [
      { name: 'Yogurt', unit: 'cup', perPerson: 1 },
      { name: 'Granola', unit: 'cup', perPerson: 0.5, gfSub: 'GF granola' },
      { name: 'Berries', unit: 'cup', perPerson: 0.25 },
    ],
  },

  // ---- Lunch ----
  {
    id: 'sandwiches',
    name: 'Sandwiches',
    category: 'lunch',
    ingredients: [
      { name: 'Bread', unit: 'slice', perPerson: 2, gfSub: 'GF bread' },
      { name: 'Deli meat', unit: 'oz', perPerson: 3 },
      { name: 'Cheese slices', unit: 'count', perPerson: 1 },
      { name: 'Lettuce', unit: 'cup', perPerson: 0.1 },
      { name: 'Mayo', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'quesadillas',
    name: 'Quesadillas',
    category: 'lunch',
    ingredients: [
      { name: 'Tortillas', unit: 'count', perPerson: 2, gfSub: 'GF tortillas' },
      { name: 'Shredded cheese', unit: 'cup', perPerson: 0.4 },
      { name: 'Chicken', unit: 'lb', perPerson: 0.2 },
      { name: 'Salsa', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'soup-grilled-cheese',
    name: 'Soup & Grilled Cheese',
    category: 'lunch',
    ingredients: [
      { name: 'Bread', unit: 'slice', perPerson: 2, gfSub: 'GF bread' },
      { name: 'Cheese slices', unit: 'count', perPerson: 1.5 },
      { name: 'Canned soup', unit: 'can', perPerson: 0.5 },
      { name: 'Butter', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'pasta-salad',
    name: 'Pasta Salad',
    category: 'lunch',
    ingredients: [
      { name: 'Pasta', unit: 'lb', perPerson: 0.2, gfSub: 'GF pasta' },
      { name: 'Mixed vegetables', unit: 'cup', perPerson: 0.5 },
      { name: 'Italian dressing', unit: 'tbsp', perPerson: 1.5 },
    ],
  },

  // ---- Dinner ----
  {
    id: 'tacos',
    name: 'Tacos',
    category: 'dinner',
    ingredients: [
      { name: 'Ground beef', unit: 'lb', perPerson: 0.25 },
      { name: 'Taco shells', unit: 'count', perPerson: 2.5, gfSub: 'GF taco shells' },
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
    category: 'dinner',
    ingredients: [
      { name: 'Spaghetti', unit: 'lb', perPerson: 0.2, gfSub: 'GF spaghetti' },
      { name: 'Meatballs', unit: 'count', perPerson: 4, gfSub: 'GF meatballs' },
      { name: 'Marinara sauce', unit: 'cup', perPerson: 0.5 },
      { name: 'Parmesan', unit: 'tbsp', perPerson: 1 },
      { name: 'Garlic bread', unit: 'slice', perPerson: 1.5, gfSub: 'GF garlic bread' },
    ],
  },
  {
    id: 'burgers',
    name: 'Burgers',
    category: 'dinner',
    ingredients: [
      { name: 'Ground beef', unit: 'lb', perPerson: 0.33 },
      { name: 'Burger buns', unit: 'count', perPerson: 1.2, gfSub: 'GF burger buns' },
      { name: 'Cheese slices', unit: 'count', perPerson: 1 },
      { name: 'Lettuce', unit: 'cup', perPerson: 0.15 },
      { name: 'Tomato', unit: 'count', perPerson: 0.25 },
      { name: 'Ketchup', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'grilled-chicken',
    name: 'Grilled Chicken & Veggies',
    category: 'dinner',
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
    category: 'dinner',
    ingredients: [
      { name: 'Chicken breast', unit: 'count', perPerson: 0.75 },
      { name: 'Stir-fry vegetables', unit: 'cup', perPerson: 1.5 },
      { name: 'Soy sauce', unit: 'tbsp', perPerson: 1.5, gfSub: 'Tamari (GF soy sauce)' },
      { name: 'Rice', unit: 'cup', perPerson: 0.33 },
    ],
  },
  {
    id: 'pizza',
    name: 'Pizza Night',
    category: 'dinner',
    ingredients: [
      { name: 'Pizza', unit: 'count', perPerson: 0.33, gfSub: 'GF pizza' },
      { name: 'Side salad mix', unit: 'cup', perPerson: 0.5 },
    ],
  },
  {
    id: 'chili',
    name: 'Chili',
    category: 'dinner',
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
    category: 'dinner',
    ingredients: [
      { name: 'Rotisserie chicken', unit: 'count', perPerson: 0.25 },
      { name: 'Romaine lettuce', unit: 'cup', perPerson: 1 },
      { name: 'Caesar dressing', unit: 'tbsp', perPerson: 1.5 },
      { name: 'Croutons', unit: 'cup', perPerson: 0.25, gfSub: 'GF croutons' },
      { name: 'Parmesan', unit: 'tbsp', perPerson: 1 },
    ],
  },
  {
    id: 'mac-and-cheese',
    name: 'Mac & Cheese',
    category: 'dinner',
    ingredients: [
      { name: 'Macaroni', unit: 'lb', perPerson: 0.2, gfSub: 'GF macaroni' },
      { name: 'Shredded cheese', unit: 'cup', perPerson: 0.4 },
      { name: 'Milk', unit: 'cup', perPerson: 0.15 },
      { name: 'Butter', unit: 'tbsp', perPerson: 1 },
    ],
  },

  // ---- Eating out / no-cook (no groceries generated) ----
  { id: 'at-the-parks', name: 'At the parks', category: 'out', ingredients: [] },
  { id: 'eating-out', name: 'Eating out / restaurant', category: 'out', ingredients: [] },
  { id: 'leftovers', name: 'Leftovers', category: 'out', ingredients: [] },
];

export const RECIPES_BY_ID: Record<string, Recipe> = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
);

export const CATEGORY_LABELS: Record<Recipe['category'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  out: 'Eating out',
};

export const CATEGORY_ORDER: Recipe['category'][] = ['breakfast', 'lunch', 'dinner', 'out'];
