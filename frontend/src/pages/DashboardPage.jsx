import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api/client'

// Designer dashboard showing portfolio interest overview\nfunction DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet('/analytics/portfolio/').then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>
  if (!data) return <p>Failed to load portfolio data.</p>

  return (
    <div>
      <h1>Portfolio Interest Overview</h1>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <div><strong>Total Views:</strong> {data.total_views}</div>
        <div><strong>Total Shortlists:</strong> {data.total_shortlists}</div>
        <div><strong>Projects:</strong> {data.project_count}</div>
      </div>
      <h2>Ranked Projects</h2>
      {data.projects.length === 0 ? <p>No projects found.</p> : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Rank</th><th>Title</th><th>Style</th><th>Status</th><th>Views</th><th>Shortlists</th>
            </tr>
          </thead>
          <tbody>
            {data.projects.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td><Link to={`/trend/${p.id}`}>{p.title}</Link></td>
                <td>{p.style}</td>
                <td>{p.status}</td>
                <td>{p.view_count}</td>
                <td>{p.shortlist_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default DashboardPage
