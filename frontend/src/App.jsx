import { useState } from 'react'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import DetailPage from './pages/DetailPage'
import DashboardPage from './pages/DashboardPage'
import TrendPage from './pages/TrendPage'
import CreatePage from './pages/CreatePage'
import CategoriesPage from './pages/CategoriesPage'
import ModerationPage from './pages/ModerationPage'
import './App.css'

const logoUrl = `${import.meta.env.BASE_URL}logo.png`

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState(null)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Browse Projects' },
    { to: '/dashboard', label: 'Designer Dashboard' },
    { to: '/create', label: 'Create Project' },
    { to: '/categories', label: 'Categories' },
    { to: '/moderation', label: 'Moderation' },
  ]

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
        <img src={logoUrl} alt="HASH Designs" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
      </div>

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
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/project/:id" element={<DetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trend/:id" element={<TrendPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/moderation" element={<ModerationPage />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App

