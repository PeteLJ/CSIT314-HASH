import { useEffect, useState } from 'react'
import { apiGet, apiPatch } from '../api/client'

function PublicationManagementUI() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const loadProjects = async () => {
    try {
      const designerId = localStorage.getItem('designer_id') || ''
      const url = designerId ? `/projects/mine/?designer_id=${designerId}` : '/projects/mine/'
      const data = await apiGet(url)
      const list = Array.isArray(data) ? data : data.results || []
      setProjects(list.sort((a, b) => a.id - b.id))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const updateStatus = async (projectId, newStatus) => {
    setUpdatingId(projectId)
    setError('')
    setMessage('')

    try {
      const designerId = localStorage.getItem('designer_id') || ''
      await apiPatch(
        `/projects/${projectId}/publish/`,
        { status: newStatus, designer_id: designerId }
      )

      setMessage('Project status updated successfully.')
      await loadProjects()

    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <p>Loading projects...</p>
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
      <h1>Manage Project Publication Status</h1>

      {error && (
        <p style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{error}</p>
      )}

      {message && (
        <p style={{ color: '#4caf50', fontSize: '0.9rem' }}>{message}</p>
      )}

      {projects.length === 0 && (
        <p>No projects found.</p>
      )}

      {projects.map(project => (
        <div
          key={project.id}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            marginBottom: '1rem',
            border: '1px solid rgba(255,255,255,0.15)',
            maxWidth: '600px',
            margin: '0 auto 1rem auto',
          }}
        >
          <h2 style={{ margin: '0 0 0.5rem 0', textAlign: 'left' }}>{project.title}</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: '#ccc', textAlign: 'left' }}>
              Current Status: <strong style={{ color: '#fff' }}>{project.status}</strong>
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {project.status === 'DRAFT' && (
                <button
                  disabled={updatingId === project.id}
                  onClick={() => updateStatus(project.id, 'PUBLISHED')}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#c4704b',
                    color: 'white',
                    cursor: updatingId === project.id ? 'not-allowed' : 'pointer',
                    opacity: updatingId === project.id ? 0.6 : 1,
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                  }}
                >
                  Publish
                </button>
              )}

              {project.status === 'PUBLISHED' && (
                <button
                  disabled={updatingId === project.id}
                  onClick={() => updateStatus(project.id, 'UNPUBLISHED')}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #ff9800',
                    background: 'rgba(255,152,0,0.1)',
                    color: '#ff9800',
                    cursor: updatingId === project.id ? 'not-allowed' : 'pointer',
                    opacity: updatingId === project.id ? 0.6 : 1,
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                  }}
                >
                  Unpublish
                </button>
              )}

              {project.status === 'UNPUBLISHED' && (
                <>
                  <button
                    disabled={updatingId === project.id}
                    onClick={() => updateStatus(project.id, 'PUBLISHED')}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#c4704b',
                      color: 'white',
                      cursor: updatingId === project.id ? 'not-allowed' : 'pointer',
                      opacity: updatingId === project.id ? 0.6 : 1,
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                    }}
                  >
                    Publish Again
                  </button>

                  <button
                    disabled={updatingId === project.id}
                    onClick={() => updateStatus(project.id, 'DRAFT')}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#ccc',
                      cursor: updatingId === project.id ? 'not-allowed' : 'pointer',
                      opacity: updatingId === project.id ? 0.6 : 1,
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                    }}
                  >
                    Save as Draft
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PublicationManagementUI