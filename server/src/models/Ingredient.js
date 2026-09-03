const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  // The user-facing name, e.g. "Egg"
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  // Short URL-safe id that the user picks, e.g. "egg"
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    trim: true,
    lowercase: true,
  },
  // Optional list of states, e.g. ["raw", "boiled", "fried"]
  states: {
    type: [String],
    default: [],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Slug must be unique per user (two different users can both have "egg")
ingredientSchema.index({ slug: 1, owner: 1 }, { unique: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);
