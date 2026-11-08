import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'
import { FEATURES } from '../config/features'

function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewCount, setViewCount] = useState(0)
  const [shortlistCount, setShortlistCount] = useState(0)
  const [designerProfile, setDesignerProfile] = useState(null)
  const [companyProfile, setCompanyProfile] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
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

  const handleViewDesignerProfile = () => {
    if (!project || !project.designer) return
    if (showProfile) {
      setShowProfile(false)
      return
    }
    apiGet(`/users/${project.designer}/`).then(data => {
      setDesignerProfile(data)
      setShowProfile(true)
    }).catch(() => {})
    apiGet(`/company/settings/?designer_id=${project.designer}`).then(data => {
      setCompanyProfile(data)
    }).catch(() => {})
  }

  if (loading) return <p>Loading...</p>
  if (!project) return <p>Project not found.</p>

  const roomTypeLabel = project.room_type
    ? project.room_type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    : 'N/A'

  return (
    <div style={{ padding: "0 2rem" }}>
      <Link to="/">Back to Browse</Link>
      <h1>{project.title}</h1>
      <p><strong>Style:</strong> {project.style}</p>
      <p><strong>Cost:</strong> ${Number(project.budget_min).toLocaleString()}</p>
      <p><strong>Designer:</strong> {project.designer_name}
        {FEATURES.DETAIL_DESIGNER_PROFILE && (
          <button onClick={handleViewDesignerProfile} style={{
            marginLeft: '0.75rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            border: '1px solid #64b5f6',
            background: 'none',
            color: '#64b5f6',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}>
            {showProfile ? 'Hide Profile' : 'View Designer Profile'}
          </button>
        )}
      </p>
      {showProfile && designerProfile && (
        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <p style={{ margin: '0.25rem 0' }}><strong>Username:</strong> {designerProfile.username}</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Company:</strong> {companyProfile ? companyProfile.name : (designerProfile.company || 'N/A')}</p>
            {companyProfile && (
              <>
                <p style={{ margin: '0.25rem 0' }}><strong>Supported Property Types:</strong> {companyProfile.property_types && companyProfile.property_types.length > 0 ? companyProfile.property_types.map(t => t.name).join(', ') : 'None set'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Budget Range:</strong> {companyProfile.budget && companyProfile.budget.minimum ? `$${Number(companyProfile.budget.minimum).toLocaleString()} - $${Number(companyProfile.budget.maximum).toLocaleString()}` : 'Not set'}</p>
              </>
            )}
        </div>
      )}
      <p><strong>Room Type:</strong> {roomTypeLabel}</p>
      <p>{project.description}</p>
      <p>Views: {viewCount} | Shortlists: {shortlistCount}</p>
      <p><em>Image placeholder (to be added later)</em></p>
    </div>
  )
}

export default ProjectDetailPage