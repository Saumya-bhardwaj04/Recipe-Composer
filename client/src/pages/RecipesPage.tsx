import { useEffect, useState } from 'react';
import {
  getRecipes,
  getIngredients,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  resolveRecipe,
} from '../api';

interface Ingredient {
  _id: string;
  name: string;
  slug: string;
  states: string[];
}

interface Component {
  refSlug: string;
  refType: 'ingredient' | 'recipe';
  qty: number;
  state: string | null;
}

interface Recipe {
  _id: string;
  name: string;
  slug: string;
  components: Component[];
}

interface ResolveResult {
  recipe: string;
  ingredients: { slug: string; name: string; qty: number }[];
}

// The row for each component inside the recipe composer
function ComponentRow({
  comp,
  ingredients,
  recipes,
  onChange,
  onRemove,
}: {
  comp: Component;
  ingredients: Ingredient[];
  recipes: Recipe[];
  onChange: (c: Component) => void;
  onRemove: () => void;
}) {
  const matchingIngredient =
    comp.refType === 'ingredient'
      ? ingredients.find((i) => i.slug === comp.refSlug)
      : null;

  const availableStates = matchingIngredient?.states || [];

  return (
    <div className="component-row">
      {/* ID (slug) picker */}
      <select
        value={`${comp.refType}:${comp.refSlug}`}
        onChange={(e) => {
          const [type, slug] = e.target.value.split(':');
          onChange({ ...comp, refType: type as 'ingredient' | 'recipe', refSlug: slug, state: null });
        }}
      >
        <option value="">— pick one —</option>
        {ingredients.length > 0 && (
          <optgroup label="Ingredients">
            {ingredients.map((i) => (
              <option key={i._id} value={`ingredient:${i.slug}`}>
                {i.name} ({i.slug})
              </option>
            ))}
          </optgroup>
        )}
        {recipes.length > 0 && (
          <optgroup label="Recipes">
            {recipes.map((r) => (
              <option key={r._id} value={`recipe:${r.slug}`}>
                {r.name} ({r.slug})
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {/* Qty */}
      <input
        type="number"
        min="0.01"
        step="any"
        placeholder="qty"
        value={comp.qty || ''}
        onChange={(e) => onChange({ ...comp, qty: parseFloat(e.target.value) })}
      />

      {/* State (only shown if ingredient has states) */}
      <select
        value={comp.state || ''}
        onChange={(e) => onChange({ ...comp, state: e.target.value || null })}
        disabled={availableStates.length === 0}
      >
        <option value="">no state</option>
        {availableStates.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [components, setComponents] = useState<Component[]>([]);

  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveData, setResolveData] = useState<ResolveResult | null>(null);
  const [resolveError, setResolveError] = useState('');
  const [resolveId, setResolveId] = useState('');

  async function loadAll() {
    try {
      const [rRes, iRes] = await Promise.all([getRecipes(), getIngredients()]);
      setRecipes(rRes.data);
      setIngredients(iRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setSlug('');
    setComponents([]);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(recipe: Recipe) {
    setEditing(recipe);
    setName(recipe.name);
    setSlug(recipe.slug);
    setComponents([...recipe.components]);
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function addComponent() {
    setComponents((prev) => [
      ...prev,
      { refSlug: '', refType: 'ingredient', qty: 1, state: null },
    ]);
  }

  function updateComponent(index: number, comp: Component) {
    setComponents((prev) => prev.map((c, i) => (i === index ? comp : c)));
  }

  function removeComponent(index: number) {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editing) {
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    // Basic client-side checks
    if (components.length === 0) {
      setFormError('A recipe needs at least one component');
      return;
    }

    const hasEmpty = components.some((c) => !c.refSlug);
    if (hasEmpty) {
      setFormError('Each component must have a selected ingredient or recipe');
      return;
    }

    try {
      if (editing) {
        await updateRecipe(editing._id, { name, components });
      } else {
        await createRecipe({ name, slug, components });
      }
      await loadAll();
      closeModal();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Something went wrong');
    }
  }

  async function handleDelete(id: string, recipeName: string) {
    if (!confirm(`Delete "${recipeName}"?`)) return;
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  }

  async function handleResolve(id: string) {
    setResolveId(id);
    setResolveData(null);
    setResolveError('');
    setResolveLoading(true);
    try {
      const res = await resolveRecipe(id);
      setResolveData(res.data);
    } catch (err: any) {
      setResolveError(err.response?.data?.error || 'Resolve failed');
    } finally {
      setResolveLoading(false);
    }
  }

  // Get display name for a component
  function getCompLabel(comp: Component) {
    if (comp.refType === 'ingredient') {
      const ing = ingredients.find((i) => i.slug === comp.refSlug);
      return ing ? ing.name : comp.refSlug;
    }
    const rec = recipes.find((r) => r.slug === comp.refSlug);
    return rec ? rec.name : comp.refSlug;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Recipes</h1>
          <p>Build dishes from ingredients and other recipes</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Recipe
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📖</div>
          <h3>No recipes yet</h3>
          <p>
            {ingredients.length === 0
              ? 'First add some ingredients, then come back to build recipes'
              : 'Create your first recipe'}
          </p>
          <button className="btn btn-primary" onClick={openCreate}>
            New Recipe
          </button>
        </div>
      ) : (
        <div className="grid grid-2">
          {recipes.map((recipe) => (
            <div className="item-card" key={recipe._id}>
              <div className="item-card-header">
                <div>
                  <div className="item-card-name">{recipe.name}</div>
                  <span className="item-card-slug">{recipe.slug}</span>
                </div>
                <div className="item-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleResolve(recipe._id)}
                    title="Flatten to base ingredients"
                  >
                    🔍 Resolve
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEdit(recipe)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(recipe._id, recipe.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Component list */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {recipe.components.map((c, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    <strong style={{ color: 'var(--text)' }}>{getCompLabel(c)}</strong>
                    {' ×'}{c.qty}
                    {c.state && <span> ({c.state})</span>}
                  </span>
                ))}
              </div>

              {/* Resolve result, shown inline */}
              {resolveId === recipe._id && (
                <div className="resolve-result">
                  {resolveLoading && <div className="spinner" style={{ margin: '0 auto' }} />}
                  {resolveError && (
                    <div className="alert alert-error" style={{ margin: 0 }}>
                      {resolveError}
                    </div>
                  )}
                  {resolveData && (
                    <>
                      <h4>Base ingredients for 1× {resolveData.recipe}</h4>
                      {resolveData.ingredients.map((ing) => (
                        <div className="resolve-row" key={ing.slug}>
                          <span>{ing.name}</span>
                          <span className="qty">{ing.qty}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recipe create / edit modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Recipe' : 'New Recipe'}</h2>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="rec-name">Name</label>
                <input
                  id="rec-name"
                  type="text"
                  placeholder="Egg Sandwich"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              {!editing && (
                <div className="form-group">
                  <label htmlFor="rec-slug">Slug (unique id)</label>
                  <input
                    id="rec-slug"
                    type="text"
                    placeholder="egg-sandwich"
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Components</label>

                {components.length > 0 && (
                  <>
                    <div className="component-row-header">
                      <span>Ingredient / Recipe</span>
                      <span>Qty</span>
                      <span>State</span>
                      <span></span>
                    </div>
                    {components.map((comp, i) => (
                      <ComponentRow
                        key={i}
                        comp={comp}
                        ingredients={ingredients}
                        recipes={
                          editing
                            ? recipes.filter((r) => r._id !== editing._id)
                            : recipes
                        }
                        onChange={(c) => updateComponent(i, c)}
                        onRemove={() => removeComponent(i)}
                      />
                    ))}
                  </>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addComponent}
                  style={{ marginTop: 6 }}
                >
                  + Add component
                </button>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Save changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
