import { useState, useEffect } from 'react'
import { apiGet, apiPatch } from '../api/client'

function ModerationPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProjects = () => {
    apiGet('/projects/').then(data => {
      setProjects(Array.isArray(data) ? data : data.results || [])
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

  return (
    <div style={{ padding: "0 2rem" }}>
      <h1>Moderate Flagged Project Content</h1>
      <p>Review and remove projects that customers have flagged.</p>
      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', borderColor: 'rgba(255,255,255,0.3)' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                <th>ID</th><th>Title</th><th>Style</th><th>Status</th><th>Designer</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.title}</td>
                  <td>{p.style}</td>
                  <td>{p.status}</td>
                  <td>{p.designer_name}</td>
                  <td>
                    {p.status !== 'ARCHIVED' && (
                      <button onClick={() => handleFlag(p.id)} style={{ color: '#ff6b6b', background: 'none', border: '1px solid #ff6b6b', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Flag & Archive</button>
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

export default ModerationPage
