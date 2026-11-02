import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'

function DetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewCount, setViewCount] = useState(0)
  const [shortlistCount, setShortlistCount] = useState(0)
  const viewRecorded = useRef(false)

  useEffect(() => {
    if (!viewRecorded.current) {
      viewRecorded.current = true
      apiPost(`/projects/${id}/record-view/`, {}).catch(() => {})
    }
    apiGet(`/projects/${id}/`).then(data => {
      setProject(data)
      setLoading(false)
    }).catch(() => setLoading(false))
    apiGet(`/projects/${id}/view-count/`).then(data => setViewCount(data.view_count)).catch(() => {})
    apiGet(`/projects/${id}/shortlist-count/`).then(data => setShortlistCount(data.shortlist_count)).catch(() => {})
  }, [id])

  if (loading) return <p>Loading...</p>
  if (!project) return <p>Project not found.</p>

  const roomTypeLabel = project.room_type
    ? project.room_type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    : 'N/A'

  return (
    <div style={{ padding: "0 2rem", maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/browse" style={{ color: '#64b5f6', textDecoration: 'none' }}>Back to Browse</Link>
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginTop: '1rem',
        flexWrap: 'wrap',
      }}>
        {/* Image placeholder */}
        <div style={{
          flex: '1 1 300px',
          aspectRatio: '16 / 9',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          border: '1px dashed rgba(255,255,255,0.3)',
        }}>
          Image placeholder
        </div>
        {/* Details */}
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ marginTop: 0 }}>{project.title}</h1>
          <p><strong>Style:</strong> {project.style}</p>
          <p><strong>Cost:</strong> ${Number(project.budget_min).toLocaleString()}</p>
          <p><strong>Designer:</strong> {project.designer_name}</p>
          <p><strong>Room Type:</strong> {roomTypeLabel}</p>
          <p style={{ marginTop: '1rem' }}>{project.description}</p>
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <span>Views: {viewCount}</span>
            <span style={{ marginLeft: '1.5rem' }}>Shortlists: {shortlistCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailPage
