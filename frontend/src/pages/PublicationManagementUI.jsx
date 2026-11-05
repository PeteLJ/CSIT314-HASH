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
      const data = await apiGet('/projects/mine/')
      setProjects(
        Array.isArray(data) ? data : data.results || []
      )
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
      await apiPatch(
        `/projects/${projectId}/publish/`,
        { status: newStatus }
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
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <h1>Manage Project Publication Status</h1>

      {error && (
        <p style={{ color: 'red' }}>{error}</p>
      )}

      {message && (
        <p style={{ color: 'green' }}>{message}</p>
      )}

      {projects.length === 0 && (
        <p>No projects found.</p>
      )}

      {projects.map(project => (
        <div
          key={project.id}
          style={{
            border: '1px solid #ccc',
            padding: '1.5rem',
            marginBottom: '1rem',
            borderRadius: '8px'
          }}
        >
          <h2>{project.title}</h2>

          <p>
            Current Status: <strong>{project.status}</strong>
          </p>

          {project.status === 'DRAFT' && (
            <button
              disabled={updatingId === project.id}
              onClick={() =>
                updateStatus(project.id, 'PUBLISHED')
              }
            >
              Publish
            </button>
          )}

          {project.status === 'PUBLISHED' && (
            <button
              disabled={updatingId === project.id}
              onClick={() =>
                updateStatus(project.id, 'UNPUBLISHED')
              }
            >
              Unpublish
            </button>
          )}

          {project.status === 'UNPUBLISHED' && (
            <>
              <button
                disabled={updatingId === project.id}
                onClick={() =>
                  updateStatus(project.id, 'PUBLISHED')
                }
              >
                Publish Again
              </button>

              <button
                disabled={updatingId === project.id}
                onClick={() =>
                  updateStatus(project.id, 'DRAFT')
                }
                style={{ marginLeft: '1rem' }}
              >
                Save as Draft
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default PublicationManagementUI

