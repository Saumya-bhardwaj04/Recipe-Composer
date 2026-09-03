import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api';

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setUser(null);
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand">
          🍳 <span>Recipe Composer</span>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/ingredients"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Ingredients
          </NavLink>
          <NavLink
            to="/recipes"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Recipes
          </NavLink>

          <span style={{ marginLeft: 8, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
            {user?.email}
          </span>

          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
