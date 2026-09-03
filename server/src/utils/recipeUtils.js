const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');

// Detects whether adding a component to a recipe would create a cycle.
// We do a depth-first walk starting from the candidate recipe.
async function hasCycle(recipeSlug, newComponentSlug, ownerId) {
  const visited = new Set();

  async function walk(slug) {
    if (slug === recipeSlug) return true; // found a cycle
    if (visited.has(slug)) return false;
    visited.add(slug);

    const recipe = await Recipe.findOne({ slug, owner: ownerId });
    if (!recipe) return false;

    for (const comp of recipe.components) {
      if (comp.refType === 'recipe') {
        if (await walk(comp.refSlug)) return true;
      }
    }
    return false;
  }

  return walk(newComponentSlug);
}

// Recursively flattens a recipe into base ingredient quantities.
// Returns a map like { egg: 3, flour: 200 }
async function flattenRecipe(recipeSlug, ownerId, multiplier = 1, seen = new Set()) {
  if (seen.has(recipeSlug)) {
    throw new Error(`Circular reference detected at "${recipeSlug}"`);
  }
  seen.add(recipeSlug);

  const recipe = await Recipe.findOne({ slug: recipeSlug, owner: ownerId });
  if (!recipe) {
    throw new Error(`Recipe "${recipeSlug}" not found`);
  }

  const totals = {};

  for (const comp of recipe.components) {
    const amount = comp.qty * multiplier;

    if (comp.refType === 'ingredient') {
      totals[comp.refSlug] = (totals[comp.refSlug] || 0) + amount;
    } else {
      // It's a sub-recipe — recurse into it
      const subTotals = await flattenRecipe(comp.refSlug, ownerId, amount, new Set(seen));
      for (const [slug, qty] of Object.entries(subTotals)) {
        totals[slug] = (totals[slug] || 0) + qty;
      }
    }
  }

  return totals;
}

// Validates a single component before saving a recipe.
// Checks: qty, ref existence, and state validity.
async function validateComponent(comp, ownerId) {
  const { refSlug, refType, qty, state } = comp;

  // Check qty
  if (typeof qty !== 'number' || isNaN(qty) || qty <= 0) {
    throw new Error(`Quantity for "${refSlug}" must be a positive number`);
  }

  if (refType === 'ingredient') {
    const ingredient = await Ingredient.findOne({ slug: refSlug, owner: ownerId });
    if (!ingredient) {
      throw new Error(`Ingredient "${refSlug}" does not exist in your collection`);
    }
    if (state && !ingredient.states.includes(state)) {
      throw new Error(
        `State "${state}" is not valid for ingredient "${refSlug}". Valid states: ${ingredient.states.join(', ')}`
      );
    }
  } else if (refType === 'recipe') {
    const recipe = await Recipe.findOne({ slug: refSlug, owner: ownerId });
    if (!recipe) {
      throw new Error(`Recipe "${refSlug}" does not exist in your collection`);
    }
  } else {
    throw new Error(`Unknown reference type: "${refType}"`);
  }
}

module.exports = { hasCycle, flattenRecipe, validateComponent };
