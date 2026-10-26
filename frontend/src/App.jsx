import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import BrowsePage from './pages/BrowsePage'
import DetailPage from './pages/DetailPage'
import DashboardPage from './pages/DashboardPage'
import TrendPage from './pages/TrendPage'
import CreatePage from './pages/CreatePage'
import CategoriesPage from './pages/CategoriesPage'
import ModerationPage from './pages/ModerationPage'
import './App.css'

function Nav() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ marginRight: '1rem', width: '40px', height: '40px', border: '2px dashed #999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>
        LOGO
      </div>
      <Link to="/">Browse Projects</Link>
      <Link to="/dashboard" style={{ marginLeft: '1rem' }}>Designer Dashboard</Link>
      <Link to="/create" style={{ marginLeft: '1rem' }}>Create Project</Link>
      <Link to="/categories" style={{ marginLeft: '1rem' }}>Categories</Link>
      <Link to="/moderation" style={{ marginLeft: '1rem' }}>Moderation</Link>
    </nav>
  )
}

function App() {
  return (
    <HashRouter>
      <Nav />
      <div style={{ padding: '0 1rem' }}>
        <Routes>
          <Route path="/" element={<BrowsePage />} />
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