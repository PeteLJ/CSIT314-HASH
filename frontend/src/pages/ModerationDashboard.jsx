import { useState, useEffect } from 'react'
import { apiGet, apiPatch } from '../api/client'

// Review and flag inappropriate project content
function ModerationDashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProjects = () => {
    apiGet('/projects/').then(data => {
      const list = Array.isArray(data) ? data : data.results || []
      setProjects(list.sort((a, b) => a.id - b.id))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])

  const handleFlag = async (id) => {
    try {
      await apiPatch(`/projects/${id}/`, { status: 'ARCHIVED' })
      loadProjects()
    } catch (err) {
      alert('Failed to flag project')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED': return '#4caf50'
      case 'DRAFT': return '#ff9800'
      case 'ARCHIVED': return '#f44336'
      default: return '#ccc'
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
      <h1>Moderate Flagged Project Content</h1>
      <p>Review and remove projects that customers have flagged.</p>
      {loading ? <p>Loading...</p> : projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', overflow: 'hidden' }}>
          <table cellPadding="12" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'center' }}>ID</th>
                <th style={{ textAlign: 'center' }}>Title</th>
                <th style={{ textAlign: 'center' }}>Style</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Designer</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td>{p.id}</td>
                  <td>{p.title}</td>
                  <td>{p.style}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: getStatusColor(p.status),
                      color: 'white',
                      fontSize: '0.8rem',
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.designer_name}</td>
                  <td style={{ textAlign: 'center' }}>
                    {p.status !== 'ARCHIVED' && (
                      <button onClick={() => handleFlag(p.id)} style={{
                        color: '#ff6b6b',
                        background: 'rgba(255,107,107,0.1)',
                        border: '1px solid #ff6b6b',
                        borderRadius: '4px',
                        padding: '0.25rem 0.75rem',
                        cursor: 'pointer',
                      }}>
                        Flag & Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ModerationDashboard