const Ingredient = require('../models/Ingredient');

async function getAll(req, res) {
  try {
    const items = await Ingredient.find({ owner: req.userId }).sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch ingredients' });
  }
}

async function create(req, res) {
  try {
    const { name, slug, states } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const slugClean = slug.trim().toLowerCase();

    const existing = await Ingredient.findOne({ slug: slugClean, owner: req.userId });
    if (existing) {
      return res.status(409).json({ error: `An ingredient with slug "${slugClean}" already exists` });
    }

    const ingredient = await Ingredient.create({
      name: name.trim(),
      slug: slugClean,
      states: states || [],
      owner: req.userId,
    });

    res.status(201).json(ingredient);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An ingredient with that slug already exists' });
    }
    res.status(500).json({ error: 'Could not create ingredient' });
  }
}

async function update(req, res) {
  try {
    const { name, states } = req.body;
    const ingredient = await Ingredient.findOne({ _id: req.params.id, owner: req.userId });

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    if (name) ingredient.name = name.trim();
    if (states !== undefined) ingredient.states = states;

    await ingredient.save();
    res.json(ingredient);
  } catch (err) {
    res.status(500).json({ error: 'Could not update ingredient' });
  }
}

async function remove(req, res) {
  try {
    const ingredient = await Ingredient.findOneAndDelete({ _id: req.params.id, owner: req.userId });

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json({ message: 'Ingredient deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete ingredient' });
  }
}

module.exports = { getAll, create, update, remove };
