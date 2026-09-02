const mongoose = require('mongoose');

// Each component inside a recipe points to either an ingredient or another recipe
const componentSchema = new mongoose.Schema({
  // The slug of the ingredient or recipe being referenced
  refSlug: {
    type: String,
    required: [true, 'Component id (slug) is required'],
    trim: true,
    lowercase: true,
  },
  // "ingredient" or "recipe"
  refType: {
    type: String,
    enum: ['ingredient', 'recipe'],
    required: true,
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
  },
  // Only relevant when the referenced item is an ingredient with states
  state: {
    type: String,
    default: null,
  },
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    trim: true,
    lowercase: true,
  },
  components: {
    type: [componentSchema],
    default: [],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

recipeSchema.index({ slug: 1, owner: 1 }, { unique: true });

module.exports = mongoose.model('Recipe', recipeSchema);
