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

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(234, 230, 223, 0.8)',
      backdropFilter: 'blur(10px)',
      padding: '0.75rem 1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '40px', height: '40px', border: '2px dashed #999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555' }}>
          LOGO
        </div>
        <span style={{ fontWeight: 'bold', color: '#333' }}>HASH Designs</span>
      </div>

      <div className="desktop-nav" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#333', textDecoration: 'none' }}>Home</Link>
        <Link to="/browse" style={{ color: '#333', textDecoration: 'none' }}>Browse Projects</Link>
        <Link to="/dashboard" style={{ color: '#333', textDecoration: 'none' }}>Designer Dashboard</Link>
        <Link to="/create" style={{ color: '#333', textDecoration: 'none' }}>Create Project</Link>
        <Link to="/categories" style={{ color: '#333', textDecoration: 'none' }}>Categories</Link>
        <Link to="/moderation" style={{ color: '#333', textDecoration: 'none' }}>Moderation</Link>
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
          <Link to="/" style={{ color: '#333', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/browse" style={{ color: '#333', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Browse Projects</Link>
          <Link to="/dashboard" style={{ color: '#333', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Designer Dashboard</Link>
          <Link to="/create" style={{ color: '#333', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Create Project</Link>
          <Link to="/categories" style={{ color: '#333', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Categories</Link>
          <Link to="/moderation" style={{ color: '#333', textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>Moderation</Link>
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