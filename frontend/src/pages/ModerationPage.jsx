import { useState, useEffect } from 'react'
import { apiGet, apiPatch } from '../api/client'

// Review and flag inappropriate project content\nfunction ModerationPage() {
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
    <div>
      <h1>Moderate Flagged Project Content</h1>
      <p>Review and remove projects that customers have flagged.</p>
      {loading ? <p>Loading...</p> : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
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
                    <button onClick={() => handleFlag(p.id)} style={{ color: 'red' }}>Flag & Archive</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ModerationPage

