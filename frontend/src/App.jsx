import { useState } from 'react'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { FEATURES } from './config/features'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import DetailPage from './pages/DetailPage'
import DashboardPage from './pages/DashboardPage'
import TrendPage from './pages/TrendPage'
import CreatePage from './pages/CreatePage'
import CategoriesPage from './pages/CategoriesPage'
import ModerationPage from './pages/ModerationPage'
import './App.css'

const ROLES = ['Customer', 'Interior Designer', 'Platform Manager']

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState(null)
  const [role, setRole] = useState(localStorage.getItem('role') || 'Customer')

  const handleRoleChange = (e) => {
    setRole(e.target.value)
    localStorage.setItem('role', e.target.value)
  }

  const allLinks = [
    { to: '/', label: 'Home', feature: null, roles: ['Customer', 'Interior Designer', 'Platform Manager'] },
    { to: '/browse', label: 'Browse Projects', feature: 'BROWSE_PROJECTS', roles: ['Customer', 'Interior Designer', 'Platform Manager'] },
    { to: '/dashboard', label: 'Designer Dashboard', feature: 'PORTFOLIO_DASHBOARD', roles: ['Interior Designer'] },
    { to: '/create', label: 'Create Project', feature: 'CREATE_PROJECT', roles: ['Interior Designer'] },
    { to: '/categories', label: 'Categories', feature: 'CATEGORIES', roles: ['Platform Manager'] },
    { to: '/moderation', label: 'Moderation', feature: 'MODERATION', roles: ['Platform Manager'] },
  ]

  const navLinks = allLinks.filter(link =>
    (link.feature === null || FEATURES[link.feature]) && link.roles.includes(role)
  )

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(234, 230, 223, 0.8)',
      backdropFilter: 'blur(10px)',
      padding: '0.25rem 1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="HASH Designs" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="desktop-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                color: '#333',
                textDecoration: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                background: hoveredLink === link.to ? 'rgba(0,0,0,0.1)' : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseEnter={() => setHoveredLink(link.to)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Role switcher dropdown */}
        <select
          value={role}
          onChange={handleRoleChange}
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: 'rgba(255,255,255,0.8)',
            color: '#333',
            cursor: 'pointer',
            marginLeft: '1rem',
          }}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#333',
          }}
        >
          {menuOpen ? 'X' : '\u2630'}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu" style={{
          display: 'none',
          width: '100%',
          flexDirection: 'column',
          gap: '0.5rem',
          paddingTop: '0.5rem',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{ color: '#333', textDecoration: 'none' }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}

function App() {
  return (
    <HashRouter>
      <Nav />
      <div style={{ paddingTop: '70px', width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {FEATURES.BROWSE_PROJECTS && <Route path="/browse" element={<BrowsePage />} />}
          {FEATURES.PROJECT_DETAIL && <Route path="/project/:id" element={<DetailPage />} />}
          {FEATURES.PORTFOLIO_DASHBOARD && <Route path="/dashboard" element={<DashboardPage />} />}
          {FEATURES.TREND_CHART && <Route path="/trend/:id" element={<TrendPage />} />}
          {FEATURES.CREATE_PROJECT && <Route path="/create" element={<CreatePage />} />}
          {FEATURES.CATEGORIES && <Route path="/categories" element={<CategoriesPage />} />}
          {FEATURES.MODERATION && <Route path="/moderation" element={<ModerationPage />} />}
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App