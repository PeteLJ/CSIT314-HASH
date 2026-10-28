import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'

// Show full details of a single project and record the view
function DetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewCount, setViewCount] = useState(0)
  const [shortlistCount, setShortlistCount] = useState(0)

  useEffect(() => {
    // Record view on page load
    apiPost(`/projects/${id}/record-view/`, {}).catch(() => {})
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
      <p><strong>Status:</strong> {project.status}</p>
      <p><strong>Budget:</strong> ${project.budget_min} - ${project.budget_max}</p>
      <p><strong>Designer:</strong> {project.designer_name}</p>
      <p>{project.description}</p>
      <hr />
      <p>Views: {viewCount} | Shortlisted: {shortlistCount}</p>
      <p><em>Image placeholder - add project images here</em></p>
    </div>
  )
}

export default DetailPage


