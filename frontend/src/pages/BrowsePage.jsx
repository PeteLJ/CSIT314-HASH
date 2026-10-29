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
    <div>
      <h1>Browse Design Projects</h1>
      {FEATURES.SEARCH_FILTER && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Search by keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
          />
          <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)}>
            <option value="">All Styles</option>
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)}>
            <option value="">All Room Types</option>
            {roomTypes.map(r => <option key={r} value={r}>{r.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</option>)}
          </select>
          <select value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)}>
            <option value="">All Budgets</option>
            <option value="under20k">Under $20k</option>
            <option value="20k-40k">$20k - $40k</option>
            <option value="41k-80k">$41k - $80k</option>
            <option value="over80k">Over $80k</option>
          </select>
        </div>
      )}
      {loading ? <p>Loading...</p> : (
        <ul>
          {projects.map(p => (
            <li key={p.id} style={{ marginBottom: '0.5rem' }}>
              <Link to={`/project/${p.id}`}>{p.title}</Link> - {p.style} by {p.designer_name}
              {p.room_type && <span> | {ROOM_TYPE_LABELS[p.room_type] || p.room_type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BrowsePage
