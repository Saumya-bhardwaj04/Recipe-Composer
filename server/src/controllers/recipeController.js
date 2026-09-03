const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const { hasCycle, flattenRecipe, validateComponent } = require('../utils/recipeUtils');

async function getAll(req, res) {
  try {
    const recipes = await Recipe.find({ owner: req.userId }).sort({ name: 1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch recipes' });
  }
}

async function create(req, res) {
  try {
    const { name, slug, components } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const slugClean = slug.trim().toLowerCase();

    if (!components || components.length === 0) {
      return res.status(400).json({ error: 'A recipe must have at least one component' });
    }

    const existing = await Recipe.findOne({ slug: slugClean, owner: req.userId });
    if (existing) {
      return res.status(409).json({ error: `A recipe with slug "${slugClean}" already exists` });
    }

    // Validate all components
    for (const comp of components) {
      try {
        await validateComponent(comp, req.userId);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // Check for cycles — each recipe-type component could create one
    for (const comp of components) {
      if (comp.refType === 'recipe') {
        const cycle = await hasCycle(slugClean, comp.refSlug, req.userId);
        if (cycle) {
          return res.status(400).json({
            error: `Adding "${comp.refSlug}" would create a circular reference`,
          });
        }
      }
    }

    const recipe = await Recipe.create({
      name: name.trim(),
      slug: slugClean,
      components,
      owner: req.userId,
    });

    res.status(201).json(recipe);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A recipe with that slug already exists' });
    }
    res.status(500).json({ error: 'Could not create recipe' });
  }
}

async function update(req, res) {
  try {
    const { name, components } = req.body;
    const recipe = await Recipe.findOne({ _id: req.params.id, owner: req.userId });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (components !== undefined) {
      if (components.length === 0) {
        return res.status(400).json({ error: 'A recipe must have at least one component' });
      }

      for (const comp of components) {
        try {
          await validateComponent(comp, req.userId);
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }
      }

      for (const comp of components) {
        if (comp.refType === 'recipe') {
          const cycle = await hasCycle(recipe.slug, comp.refSlug, req.userId);
          if (cycle) {
            return res.status(400).json({
              error: `Adding "${comp.refSlug}" would create a circular reference`,
            });
          }
        }
      }

      recipe.components = components;
    }

    if (name) recipe.name = name.trim();

    await recipe.save();
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: 'Could not update recipe' });
  }
}

async function remove(req, res) {
  try {
    const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, owner: req.userId });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete recipe' });
  }
}

// Flatten a recipe down to its raw base ingredients
async function resolve(req, res) {
  try {
    const recipe = await Recipe.findOne({ _id: req.params.id, owner: req.userId });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const totals = await flattenRecipe(recipe.slug, req.userId);

    // Also attach ingredient names to make the response friendlier
    const result = [];
    for (const [slug, qty] of Object.entries(totals)) {
      const ingredient = await Ingredient.findOne({ slug, owner: req.userId });
      result.push({ slug, name: ingredient ? ingredient.name : slug, qty });
    }

    res.json({ recipe: recipe.name, ingredients: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { getAll, create, update, remove, resolve };
