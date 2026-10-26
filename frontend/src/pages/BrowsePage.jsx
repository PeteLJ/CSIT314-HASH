import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api/client'

// Browse all published design projects with filters
function BrowsePage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [styleFilter, setStyleFilter] = useState('')
  const [budgetFilter, setBudgetFilter] = useState('')

  useEffect(() => {
    let url = '/projects/'
    const params = []
    if (styleFilter) params.push(`style=${styleFilter}`)
    if (budgetFilter) params.push(`budget=${budgetFilter}`)
    if (params.length) url += '?' + params.join('&')
    apiGet(url).then(data => {
      setProjects(Array.isArray(data) ? data : data.results || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [styleFilter, budgetFilter])

  const styles = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']

  return (
    <div>
      <h1>Browse Design Projects</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label>Style: </label>
        <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)}>
          <option value="">All</option>
          {styles.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label style={{ marginLeft: '1rem' }}>Budget: </label>
        <select value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)}>
          <option value="">All</option>
          <option value="low">Under 20k</option>
          <option value="mid">20k-40k</option>
          <option value="high">Over 40k</option>
        </select>
      </div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {projects.map(p => (
            <li key={p.id} style={{ marginBottom: '0.5rem' }}>
              <Link to={`/project/${p.id}`}>{p.title}</Link> - {p.style} ({p.status})
              {p.designer_name && <span> by {p.designer_name}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BrowsePage

