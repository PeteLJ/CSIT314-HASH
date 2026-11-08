import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api/client'

function InterestDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [designerId, setDesignerId] = useState(localStorage.getItem('designer_id') || '')

  const fetchData = (id) => {
    const url = id ? `/analytics/portfolio/?designer_id=${id}` : '/analytics/portfolio/'
    apiGet(url).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(designerId)
  }, [designerId])

  // Listen for designer changes from navbar (immediate update)
  useEffect(() => {
    const handleDesignerChange = (e) => {
      const newId = e.detail || localStorage.getItem('designer_id') || ''
      if (newId !== designerId) {
        setDesignerId(newId)
        setLoading(true)
      }
    }
    window.addEventListener('designerChanged', handleDesignerChange)
    return () => window.removeEventListener('designerChanged', handleDesignerChange)
  }, [designerId])

  // Poll for data updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const currentId = localStorage.getItem('designer_id') || ''
      if (currentId !== designerId) {
        setDesignerId(currentId)
        setLoading(true)
      } else {
        fetchData(currentId)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [designerId])

  if (loading) return <p>Loading...</p>
  if (!data) return <p>Failed to load portfolio data.</p>

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
      <h1>Portfolio Interest Overview</h1>
      <p style={{ color: '#888', fontSize: '0.9rem' }}>Showing stats for selected designer. Auto-updating every 5 seconds.</p>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#64b5f6' }}>{data.total_views}</div>
          <div style={{ color: '#ccc' }}>Total Views</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>{data.total_shortlists}</div>
          <div style={{ color: '#ccc' }}>Total Shortlists</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c4704b' }}>{data.project_count}</div>
          <div style={{ color: '#ccc' }}>Projects</div>
        </div>
      </div>
      <h2>Ranked Projects</h2>
      {data.projects.length === 0 ? <p>No projects found for this designer.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table cellPadding="12" style={{ borderCollapse: 'collapse', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                <th>Rank</th><th>Title</th><th>Style</th><th>Status</th><th>Views</th><th>Shortlists</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td><Link to={`/trend/${p.id}`} style={{ textDecoration: 'none' }}>{p.title}</Link></td>
                  <td>{p.style}</td>
                  <td>{p.status}</td>
                  <td>{p.view_count}</td>
                  <td>{p.shortlist_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default InterestDashboard
