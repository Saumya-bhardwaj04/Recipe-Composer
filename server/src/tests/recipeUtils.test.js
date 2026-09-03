const { hasCycle, flattenRecipe } = require('../utils/recipeUtils');

// We'll mock the Recipe model for unit tests
jest.mock('../models/Recipe');
jest.mock('../models/Ingredient');

const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');

describe('hasCycle()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('no cycle when adding a simple ingredient', async () => {
    Recipe.findOne.mockResolvedValue(null); // sub-recipe doesn't exist as a recipe
    const result = await hasCycle('pasta', 'tomato', 'user1');
    expect(result).toBe(false);
  });

  test('detects direct cycle: A includes A', async () => {
    // pasta trying to include pasta
    const result = await hasCycle('pasta', 'pasta', 'user1');
    expect(result).toBe(true);
  });

  test('detects indirect cycle: A → B → A', async () => {
    // sandwich tries to include wrap, and wrap already includes sandwich
    Recipe.findOne.mockImplementation(({ slug }) => {
      if (slug === 'wrap') {
        return Promise.resolve({
          components: [{ refType: 'recipe', refSlug: 'sandwich' }],
        });
      }
      return Promise.resolve(null);
    });

    const result = await hasCycle('sandwich', 'wrap', 'user1');
    expect(result).toBe(true);
  });
});

describe('flattenRecipe()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('flattens a simple recipe', async () => {
    Recipe.findOne.mockImplementation(({ slug }) => {
      if (slug === 'omelette') {
        return Promise.resolve({
          slug: 'omelette',
          components: [
            { refType: 'ingredient', refSlug: 'egg', qty: 2 },
            { refType: 'ingredient', refSlug: 'butter', qty: 1 },
          ],
        });
      }
      return Promise.resolve(null);
    });

    const totals = await flattenRecipe('omelette', 'user1');
    expect(totals).toEqual({ egg: 2, butter: 1 });
  });

  test('flattens nested recipes', async () => {
    Recipe.findOne.mockImplementation(({ slug }) => {
      if (slug === 'sandwich') {
        return Promise.resolve({
          slug: 'sandwich',
          components: [
            { refType: 'ingredient', refSlug: 'bread', qty: 2 },
            { refType: 'recipe', refSlug: 'omelette', qty: 1 },
          ],
        });
      }
      if (slug === 'omelette') {
        return Promise.resolve({
          slug: 'omelette',
          components: [
            { refType: 'ingredient', refSlug: 'egg', qty: 2 },
            { refType: 'ingredient', refSlug: 'butter', qty: 1 },
          ],
        });
      }
      return Promise.resolve(null);
    });

    const totals = await flattenRecipe('sandwich', 'user1');
    expect(totals).toEqual({ bread: 2, egg: 2, butter: 1 });
  });

  test('multiplies quantities for nested recipes', async () => {
    Recipe.findOne.mockImplementation(({ slug }) => {
      if (slug === 'double-omelette') {
        return Promise.resolve({
          slug: 'double-omelette',
          components: [{ refType: 'recipe', refSlug: 'omelette', qty: 2 }],
        });
      }
      if (slug === 'omelette') {
        return Promise.resolve({
          slug: 'omelette',
          components: [{ refType: 'ingredient', refSlug: 'egg', qty: 3 }],
        });
      }
      return Promise.resolve(null);
    });

    const totals = await flattenRecipe('double-omelette', 'user1');
    expect(totals).toEqual({ egg: 6 }); // 2 omelettes × 3 eggs each
  });

  test('throws on circular reference', async () => {
    Recipe.findOne.mockImplementation(({ slug }) => {
      if (slug === 'a') {
        return Promise.resolve({
          slug: 'a',
          components: [{ refType: 'recipe', refSlug: 'b', qty: 1 }],
        });
      }
      if (slug === 'b') {
        return Promise.resolve({
          slug: 'b',
          components: [{ refType: 'recipe', refSlug: 'a', qty: 1 }],
        });
      }
      return Promise.resolve(null);
    });

    await expect(flattenRecipe('a', 'user1')).rejects.toThrow('Circular reference');
  });
});
