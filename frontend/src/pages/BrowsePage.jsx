import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiGet } from '../api/client'
import { FEATURES } from '../config/features'

const ROOM_TYPE_LABELS = {
  'LIVING_ROOM': 'Living Room',
  'BEDROOM': 'Bedroom',
  'KITCHEN': 'Kitchen',
  'BATHROOM': 'Bathroom',
  'WHOLE_UNIT': 'Whole Unit',
}

function BrowsePage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [styleFilter, setStyleFilter] = useState(searchParams.get('style') || '')
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [budgetFilter, setBudgetFilter] = useState('')

  useEffect(() => {
    let url = '/projects/'
    const params = []
    if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`)
    if (styleFilter) params.push(`style=${styleFilter}`)
    if (roomTypeFilter) params.push(`room_type=${roomTypeFilter}`)
    if (budgetFilter === 'under20k') {
      params.push('budget_min=0')
      params.push('budget_max=20000')
    } else if (budgetFilter === '20k-40k') {
      params.push('budget_min=20000')
      params.push('budget_max=40000')
    } else if (budgetFilter === '41k-80k') {
      params.push('budget_min=41000')
      params.push('budget_max=80000')
    } else if (budgetFilter === 'over80k') {
      params.push('budget_min=80000')
    }
    if (params.length) url += '?' + params.join('&')
    apiGet(url).then(data => {
      setProjects(Array.isArray(data) ? data : data.results || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [searchQuery, styleFilter, roomTypeFilter, budgetFilter])

  const styles = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']
  const roomTypes = ['LIVING_ROOM', 'BEDROOM', 'KITCHEN', 'BATHROOM', 'WHOLE_UNIT']

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 2rem' }}>
      <h1>Browse Design Projects</h1>
      {FEATURES.SEARCH_FILTER && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Search by keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', minWidth: '200px', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}
          />
          <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}>
            <option value="">All Styles</option>
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}>
            <option value="">All Room Types</option>
            {roomTypes.map(r => <option key={r} value={r}>{r.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</option>)}
          </select>
          <select value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}>
            <option value="">All Budgets</option>
            <option value="under20k">Under $20k</option>
            <option value="20k-40k">$20k - $40k</option>
            <option value="41k-80k">$41k - $80k</option>
            <option value="over80k">Over $80k</option>
          </select>
        </div>
      )}
      {loading ? <p>Loading...</p> : projects.length === 0 ? (
        <p>No projects found. Make sure the backend is running.</p>
      ) : (
        <div className='card-grid'>
          {projects.map(p => (
            <div key={p.id} style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              {/* Image placeholder */}
              <div style={{
                width: '100%',
                aspectRatio: '16 / 9',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888',
                fontSize: '0.9rem',
              }}>
                Image placeholder
              </div>
              {/* Details */}
              <div style={{ padding: '1rem' }}>
                <Link to={`/project/${p.id}`} style={{ color: '#64b5f6', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {p.title}
                </Link>
                <p style={{ margin: '0.25rem 0', color: '#ccc', fontSize: '0.9rem' }}>
                  {p.style} {p.room_type && `| ${p.room_type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}`}
                </p>
                <p style={{ margin: '0.25rem 0', color: '#ccc', fontSize: '0.9rem' }}>
                  by {p.designer_name}
                </p>
                <p style={{ margin: '0.25rem 0', color: '#fff', fontWeight: 'bold' }}>
                  ${Number(p.budget_min).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BrowsePage