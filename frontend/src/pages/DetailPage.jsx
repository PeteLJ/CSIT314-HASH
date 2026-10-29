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
    // Record view only once (prevent StrictMode double-execution)
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

  return (
    <div>
      <Link to="/">Back to Browse</Link>
      <h1>{project.title}</h1>
      <p><strong>Style:</strong> {project.style}</p>
      <p><strong>Cost:</strong> ${Number(project.budget_min).toLocaleString()}</p>
      <p><strong>Designer:</strong> {project.designer_name}</p>
      <p><strong>Room Type:</strong> {project.room_type ? project.room_type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') : 'N/A'}</p>
      <p>{project.description}</p>
      <p>Views: {viewCount} | Shortlists: {shortlistCount}</p>
      <p><em>Image placeholder (to be added later)</em></p>
    </div>
  )
}

export default DetailPage