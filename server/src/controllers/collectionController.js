const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');

// Export: Build the JSON shape described in the brief
async function exportCollection(req, res) {
  try {
    const ingredients = await Ingredient.find({ owner: req.userId });
    const recipes = await Recipe.find({ owner: req.userId });

    const output = {};

    for (const ing of ingredients) {
      output[ing.slug] = {
        name: ing.name,
        ...(ing.states.length > 0 && { states: ing.states }),
      };
    }

    for (const rec of recipes) {
      output[rec.slug] = {
        name: rec.name,
        components: rec.components.map((c) => ({
          id: c.refSlug,
          qty: c.qty,
          ...(c.state && { state: c.state }),
        })),
      };
    }

    res.setHeader('Content-Disposition', 'attachment; filename="recipe-book.json"');
    res.json(output);
  } catch (err) {
    res.status(500).json({ error: 'Could not export collection' });
  }
}

// Import: Merge uploaded JSON into the user's collection
async function importCollection(req, res) {
  try {
    const data = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    // Check for duplicates first
    const duplicates = [];

    for (const slug of Object.keys(data)) {
      const ingExists = await Ingredient.findOne({ slug, owner: req.userId });
      const recExists = await Recipe.findOne({ slug, owner: req.userId });
      if (ingExists || recExists) {
        duplicates.push(slug);
      }
    }

    if (duplicates.length > 0) {
      return res.status(409).json({
        error: `These slugs already exist in your collection: ${duplicates.join(', ')}. Remove them from the import or delete the existing ones first.`,
      });
    }

    // Separate ingredients from recipes — ingredients have no "components" field
    const ingredientEntries = [];
    const recipeEntries = [];

    for (const [slug, value] of Object.entries(data)) {
      if (value.components) {
        recipeEntries.push({ slug, ...value });
      } else {
        ingredientEntries.push({ slug, ...value });
      }
    }

    // Insert ingredients first so recipes can reference them
    for (const ing of ingredientEntries) {
      await Ingredient.create({
        name: ing.name,
        slug: ing.slug,
        states: ing.states || [],
        owner: req.userId,
      });
    }

    for (const rec of recipeEntries) {
      const components = rec.components.map((c) => ({
        refSlug: c.id,
        // We'll guess the type — we'll check ingredients first
        refType: ingredientEntries.find((i) => i.slug === c.id) ? 'ingredient' : 'recipe',
        qty: c.qty,
        state: c.state || null,
      }));

      await Recipe.create({
        name: rec.name,
        slug: rec.slug,
        components,
        owner: req.userId,
      });
    }

    res.json({ message: `Imported ${ingredientEntries.length} ingredients and ${recipeEntries.length} recipes` });
  } catch (err) {
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
}

module.exports = { exportCollection, importCollection };
