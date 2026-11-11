import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiGet } from '../api/client'
import { FEATURES } from '../config/features'

function BrowsePage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [styleFilter, setStyleFilter] = useState(searchParams.get('style') || '')
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [budgetFilter, setBudgetFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [myBudgetFilter, setMyBudgetFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState([])
  const [propertyTypes, setPropertyTypes] = useState([])

  useEffect(() => {
    apiGet('/categories/').then(data => {
      setCategories(Array.isArray(data) ? data : data.results || [])
    }).catch(() => {})
    apiGet('/property-types/').then(data => {
      setPropertyTypes(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)

    let url = '/projects/'
    const params = []
    if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`)
    if (styleFilter) params.push(`style=${styleFilter}`)
    if (roomTypeFilter) params.push(`room_type=${roomTypeFilter}`)
    if (categoryFilter) params.push(`category=${encodeURIComponent(categoryFilter)}`)
    if (propertyTypeFilter) params.push(`property_type=${encodeURIComponent(propertyTypeFilter)}`)
    if (myBudgetFilter) params.push(`my_budget=${encodeURIComponent(myBudgetFilter)}`)
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
    if (sortFilter) params.push(`sort=${sortFilter}`)
    if (FEATURES.BROWSE_PAGINATION) {
      params.push(`page=${page}`)
      params.push(`page_size=12`)
    }
    if (params.length) url += '?' + params.join('&')
    apiGet(url).then(data => {
      if (cancelled) return
      if (Array.isArray(data?.results)) {
        setProjects([...data.results].sort((a, b) => a.id - b.id))
        setTotal(data.total || data.results.length)
        setTotalPages(data.total_pages || 1)
      } else if (Array.isArray(data)) {
        setProjects([...data].sort((a, b) => a.id - b.id))
        setTotal(data.length)
        setTotalPages(1)
      } else {
        throw new Error('Invalid project search response')
      }
    }).catch(() => {
      if (!cancelled) setLoadFailed(true)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [searchQuery, styleFilter, roomTypeFilter, budgetFilter, categoryFilter, propertyTypeFilter, myBudgetFilter, sortFilter, page, retryCount])

  const styles = categories.map(c => c.name)
  const [roomTypes, setRoomTypes] = useState([])
  useEffect(() => {
    apiGet('/room-types/').then(data => {
      setRoomTypes(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  const inputStyle = { padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 2rem' }}>
      <h1>Browse Design Projects</h1>
      {FEATURES.SEARCH_FILTER && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Search by keyword..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
            style={{ ...inputStyle, minWidth: '200px' }}
          />
          <select value={styleFilter} onChange={e => { setStyleFilter(e.target.value); setPage(1) }} style={inputStyle}>
            <option value="" style={{ background: '#fff', color: '#000' }}>All Styles</option>
            {styles.map(s => <option key={s} value={s} style={{ background: '#fff', color: '#000' }}>{s}</option>)}
          </select>
          <select value={roomTypeFilter} onChange={e => { setRoomTypeFilter(e.target.value); setPage(1) }} style={inputStyle}>
            <option value="" style={{ background: '#fff', color: '#000' }}>All Room Types</option>
            {roomTypes.map(r => <option key={r.value} value={r.value} style={{ background: '#fff', color: '#000' }}>{r.label}</option>)}
          </select>
          {FEATURES.BROWSE_CATEGORY_FILTER && categories.length > 0 && (
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }} style={inputStyle}>
              <option value="" style={{ background: '#fff', color: '#000' }}>All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name} style={{ background: '#fff', color: '#000' }}>{c.name}</option>)}
            </select>
          )}
          {propertyTypes.length > 0 && (
            <select value={propertyTypeFilter} onChange={e => { setPropertyTypeFilter(e.target.value); setPage(1) }} style={inputStyle}>
              <option value="" style={{ background: '#fff', color: '#000' }}>All Property Types</option>
              {propertyTypes.map(pt => <option key={pt.id} value={pt.name} style={{ background: '#fff', color: '#000' }}>{pt.name}</option>)}
            </select>
          )}
          <input
            type="number"
            placeholder="My Budget ($)"
            value={myBudgetFilter}
            onChange={e => { setMyBudgetFilter(e.target.value); setPage(1) }}
            style={{ ...inputStyle, minWidth: '120px' }}
          />
          <select value={budgetFilter} onChange={e => { setBudgetFilter(e.target.value); setPage(1) }} style={inputStyle}>
            <option value="" style={{ background: '#fff', color: '#000' }}>All Budgets</option>
            <option value="under20k" style={{ background: '#fff', color: '#000' }}>Under $20k</option>
            <option value="20k-40k" style={{ background: '#fff', color: '#000' }}>$20k - $40k</option>
            <option value="41k-80k" style={{ background: '#fff', color: '#000' }}>$41k - $80k</option>
            <option value="over80k" style={{ background: '#fff', color: '#000' }}>Over $80k</option>
          </select>
          {FEATURES.BROWSE_SORT && (
            <select value={sortFilter} onChange={e => { setSortFilter(e.target.value); setPage(1) }} style={inputStyle}>
              <option value="" style={{ background: '#fff', color: '#000' }}>Sort By</option>
              <option value="latest" style={{ background: '#fff', color: '#000' }}>Latest</option>
              <option value="budget_asc" style={{ background: '#fff', color: '#000' }}>Budget (Low to High)</option>
              <option value="budget_desc" style={{ background: '#fff', color: '#000' }}>Budget (High to Low)</option>
            </select>
          )}
        </div>
      )}
      {loading ? <p role="status">Loading projects...</p> : loadFailed ? (
        <div>
          <p role="alert">Could not load projects. Please try again.</p>
          <button type="button" onClick={() => setRetryCount(count => count + 1)}>Retry</button>
        </div>
      ) : projects.length === 0 ? (
        <p role="status">No projects match your search.</p>
      ) : (
        <>
          <div className='card-grid'>
            {projects.map(p => (
              <div key={p.id} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
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
                  {p.designer_property_types && p.designer_property_types.length > 0 && (
                    <p style={{ margin: '0.25rem 0', color: '#aaa', fontSize: '0.8rem' }}>
                      Handles: {p.designer_property_types.join(', ')}
                    </p>
                  )}
                  {p.designer_budget_range && (
                    <p style={{ margin: '0.25rem 0', color: '#aaa', fontSize: '0.8rem' }}>
                      Budget: ${Number(p.designer_budget_range.minimum).toLocaleString()} - ${Number(p.designer_budget_range.maximum).toLocaleString()}
                    </p>
                  )}
                  <p style={{ margin: '0.25rem 0', color: '#fff', fontWeight: 'bold' }}>
                    ${Number(p.budget_min).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {FEATURES.BROWSE_PAGINATION && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', marginBottom: '2rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', color: '#ccc' }}>
                Page {page} of {totalPages} ({total} projects)
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BrowsePage
