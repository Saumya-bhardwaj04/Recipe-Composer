import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIngredients, getRecipes, exportCollection, importCollection } from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [ingredientCount, setIngredientCount] = useState(0);
  const [recipeCount, setRecipeCount] = useState(0);
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    getIngredients().then((r) => setIngredientCount(r.data.length)).catch(() => {});
    getRecipes().then((r) => setRecipeCount(r.data.length)).catch(() => {});
  }, []);

  async function handleExport() {
    try {
      const res = await exportCollection();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recipe-book.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    setImportMsg('');
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await importCollection(data);
      setImportMsg(res.data.message);
      getIngredients().then((r) => setIngredientCount(r.data.length));
      getRecipes().then((r) => setRecipeCount(r.data.length));
    } catch (err: any) {
      setImportError(err.response?.data?.error || 'Import failed — check your JSON format');
    }
    e.target.value = '';
  }

  return (
    <div>
      <div className="dashboard-hero">
        <h1>Hey {user?.email?.split('@')[0]} 👋</h1>
        <p>
          This is your personal recipe book. Create ingredients, build recipes that combine
          them, and explore how your dishes break down into their raw parts.
        </p>

        <div className="stats-row">
          <div className="stat-box">
            <div className="num">{ingredientCount}</div>
            <div className="label">Ingredients</div>
          </div>
          <div className="stat-box">
            <div className="num">{recipeCount}</div>
            <div className="label">Recipes</div>
          </div>
        </div>
      </div>

      <div className="io-panel">
        <h3>📦 Import / Export</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 14 }}>
          Export your whole collection as JSON, or import from a file to merge into your book.
        </p>

        {importMsg && <div className="alert alert-success">{importMsg}</div>}
        {importError && <div className="alert alert-error">{importError}</div>}

        <div className="io-row">
          <button className="btn btn-secondary" onClick={handleExport}>
            ⬇ Export JSON
          </button>

          <label className="file-input-label">
            ⬆ Import JSON
            <input type="file" accept=".json" onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="grid grid-2">
        <Link to="/ingredients" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🥚</div>
            <h3 style={{ fontWeight: 800, marginBottom: 6 }}>Ingredients</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Add base ingredients like eggs, flour, or salt. Assign optional states like
              "raw", "boiled", or "fried".
            </p>
          </div>
        </Link>

        <Link to="/recipes" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📖</div>
            <h3 style={{ fontWeight: 800, marginBottom: 6 }}>Recipes</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Build recipes from ingredients or other recipes. Resolve any recipe into
              its complete list of raw ingredients.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
