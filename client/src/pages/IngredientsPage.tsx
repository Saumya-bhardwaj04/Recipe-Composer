import { useEffect, useState } from 'react';
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from '../api';

interface Ingredient {
  _id: string;
  name: string;
  slug: string;
  states: string[];
}

function StatesEditor({
  states,
  onChange,
}: {
  states: string[];
  onChange: (s: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function add() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || states.includes(trimmed)) return;
    onChange([...states, trimmed]);
    setInput('');
  }

  function remove(s: string) {
    onChange(states.filter((x) => x !== s));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="e.g. fried"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={add}>
          Add
        </button>
      </div>
      <div className="tags">
        {states.map((s) => (
          <span
            key={s}
            className="tag"
            style={{ cursor: 'pointer', gap: 4 }}
            onClick={() => remove(s)}
            title="Click to remove"
          >
            {s} ✕
          </span>
        ))}
      </div>
    </div>
  );
}

export default function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [states, setStates] = useState<string[]>([]);

  async function loadAll() {
    try {
      const res = await getIngredients();
      setItems(res.data);
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
    setStates([]);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(item: Ingredient) {
    setEditing(item);
    setName(item.name);
    setSlug(item.slug);
    setStates([...item.states]);
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    try {
      if (editing) {
        await updateIngredient(editing._id, { name, states });
      } else {
        await createIngredient({ name, slug, states });
      }
      await loadAll();
      closeModal();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Something went wrong');
    }
  }

  async function handleDelete(id: string, itemName: string) {
    if (!confirm(`Delete "${itemName}"? This can't be undone.`)) return;
    try {
      await deleteIngredient(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  }

  function handleNameChange(val: string) {
    setName(val);
    if (!editing) {
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Ingredients</h1>
          <p>Base items that recipes are built from</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Ingredient
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🥚</div>
          <h3>No ingredients yet</h3>
          <p>Add your first ingredient to get started</p>
          <button className="btn btn-primary" onClick={openCreate}>
            Add Ingredient
          </button>
        </div>
      ) : (
        <div className="grid grid-2">
          {items.map((item) => (
            <div className="item-card" key={item._id}>
              <div className="item-card-header">
                <div>
                  <div className="item-card-name">{item.name}</div>
                  <span className="item-card-slug">{item.slug}</span>
                </div>
                <div className="item-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(item._id, item.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {item.states.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-dim)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 5,
                    }}
                  >
                    States
                  </div>
                  <div className="tags">
                    {item.states.map((s) => (
                      <span className="tag" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Ingredient' : 'New Ingredient'}</h2>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="ing-name">Name</label>
                <input
                  id="ing-name"
                  type="text"
                  placeholder="Egg"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              {!editing && (
                <div className="form-group">
                  <label htmlFor="ing-slug">Slug (unique id)</label>
                  <input
                    id="ing-slug"
                    type="text"
                    placeholder="egg"
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>States (optional)</label>
                <StatesEditor states={states} onChange={setStates} />
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
