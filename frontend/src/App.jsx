import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { FEATURES } from './config/features'
import { apiGet } from './api/client'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import InterestDashboard from './pages/InterestDashboard'
import TrendPage from './pages/TrendPage'
import CreateProjectUI from './pages/CreateProjectUI'
import CategoryManagementUI from './pages/CategoryManagementUI'
import ModerationDashboard from './pages/ModerationDashboard'
import PublicationManagementUI from './pages/PublicationManagementUI'
import CompanySettingsPage from './pages/CompanySettingsPage'
import './App.css'

const ROLES = ['Customer', 'Interior Designer', 'Platform Manager']

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState(null)
  const [role, setRole] = useState(localStorage.getItem('role') || 'Customer')
  const [designers, setDesigners] = useState([])
  const [selectedDesigner, setSelectedDesigner] = useState(localStorage.getItem('designer_id') || '')

  useEffect(() => {
    if (role === 'Interior Designer') {
      apiGet('/users/').then(data => {
        const list = Array.isArray(data) ? data : data.results || []
        const designerList = list.filter(u => u.role === 'INTERIOR_DESIGNER')
        setDesigners(designerList)
        if (!selectedDesigner && designerList.length > 0) {
          setSelectedDesigner(String(designerList[0].id))
          localStorage.setItem('designer_id', String(designerList[0].id))
        }
      }).catch(err => console.error('Failed to load designers:', err))
    }
  }, [role])

  const handleRoleChange = (e) => {
    setRole(e.target.value)
    localStorage.setItem('role', e.target.value)
    if (e.target.value !== 'Interior Designer') {
      setSelectedDesigner('')
      localStorage.removeItem('designer_id')
      window.dispatchEvent(new CustomEvent('designerChanged', { detail: '' }))
    }
  }

  const handleDesignerChange = (e) => {
    setSelectedDesigner(e.target.value)
    localStorage.setItem('designer_id', e.target.value)
    window.dispatchEvent(new CustomEvent('designerChanged', { detail: e.target.value }))
  }

  const allLinks = [
    { to: '/', label: 'Home', feature: null, roles: ['Customer', 'Interior Designer', 'Platform Manager'] },
    { to: '/browse', label: 'Browse Projects', feature: 'BROWSE_PROJECTS', roles: ['Customer', 'Interior Designer', 'Platform Manager'] },
    { to: '/dashboard', label: 'Designer Dashboard', feature: 'PORTFOLIO_DASHBOARD', roles: ['Interior Designer'] },
    { to: '/create', label: 'Create Project', feature: 'CREATE_PROJECT', roles: ['Interior Designer'] },
    { to: '/publication', label: 'Manage Publication', feature: 'PUBLICATION_STATUS', roles: ['Interior Designer'] },
    { to: '/company-settings', label: 'Company Settings', feature: 'COMPANY_SETTINGS', roles: ['Interior Designer'] },
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
      padding: '0.15rem 0.75rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="HASH Designs" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="desktop-nav" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                color: '#333',
                textDecoration: 'none',
                padding: '0.2rem 0.3rem',
                borderRadius: '4px',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
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

        <select
          value={role}
          onChange={handleRoleChange}
          style={{
            padding: '0.2rem 0.3rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: 'rgba(255,255,255,0.8)',
            color: '#333',
            cursor: 'pointer',
            fontSize: '0.75rem',
            maxWidth: '145px',
          }}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {role === 'Interior Designer' && designers.length > 0 && (
          <select
            value={selectedDesigner}
            onChange={handleDesignerChange}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: 'rgba(255,255,255,0.8)',
              color: '#333',
              cursor: 'pointer',
              maxWidth: '140px',
              fontSize: '0.75rem',
            }}
          >
            {designers.map(d => (
              <option key={d.id} value={d.id}>{d.username}</option>
            ))}
          </select>
        )}

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
      <div style={{ paddingTop: '60px', width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {FEATURES.BROWSE_PROJECTS && <Route path="/browse" element={<BrowsePage />} />}
          {FEATURES.PROJECT_DETAIL && <Route path="/project/:id" element={<ProjectDetailPage />} />}
          {FEATURES.PORTFOLIO_DASHBOARD && <Route path="/dashboard" element={<InterestDashboard />} />}
          {FEATURES.TREND_CHART && <Route path="/trend/:id" element={<TrendPage />} />}
          {FEATURES.CREATE_PROJECT && <Route path="/create" element={<CreateProjectUI />} />}
          {FEATURES.PUBLICATION_STATUS && <Route path="/publication" element={<PublicationManagementUI />} />}
          {FEATURES.COMPANY_SETTINGS && <Route path="/company-settings" element={<CompanySettingsPage />} />}
          {FEATURES.CATEGORIES && <Route path="/categories" element={<CategoryManagementUI />} />}
          {FEATURES.MODERATION && <Route path="/moderation" element={<ModerationDashboard />} />}
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App