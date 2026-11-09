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
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [flagReason, setFlagReason] = useState('INAPPROPRIATE')
  const [flagDetails, setFlagDetails] = useState('')
  const [flagMessage, setFlagMessage] = useState('')
  const [flagError, setFlagError] = useState('')
  const [submittingFlag, setSubmittingFlag] = useState(false)
  const recordedProjectId = useRef(null)
  const activeProjectId = useRef(null)
  const isCustomer = (localStorage.getItem('role') || 'Customer') === 'Customer'

  useEffect(() => {
    activeProjectId.current = id

    const recordViewAndLoadLatestCount = async () => {
      try {
        // Record each project once per detail-page visit. Waiting for the POST
        // prevents the following GET from returning the old count.
        if (recordedProjectId.current !== id) {
          recordedProjectId.current = id
          await apiPost(`/projects/${id}/record-view/`, {})
        }

        const data = await apiGet(`/projects/${id}/view-count/?_=${Date.now()}`)
        if (activeProjectId.current === id) setViewCount(data.view_count)
      } catch (error) {
        console.error('Unable to record or refresh the project view:', error)
      }
    }

    recordViewAndLoadLatestCount()
    apiGet(`/projects/${id}/`).then(data => {
      setProject(data)
      setLoading(false)
    }).catch(() => setLoading(false))
    apiGet(`/projects/${id}/shortlist-count/`).then(data => setShortlistCount(data.shortlist_count)).catch(() => {})

    return () => {
      if (activeProjectId.current === id) activeProjectId.current = null
    }
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

  const handleFlagSubmit = async (event) => {
    event.preventDefault()
    setSubmittingFlag(true)
    setFlagError('')
    setFlagMessage('')

    try {
      await apiPost('/project-flags/', {
        project: Number(id),
        reason: flagReason,
        details: flagDetails.trim(),
      })
      setFlagMessage('Thank you. Your report has been sent for review.')
      setFlagDetails('')
      setShowFlagForm(false)
    } catch (err) {
      setFlagError(err.message)
    } finally {
      setSubmittingFlag(false)
    }
  }

  const roomTypeLabel = project.room_type
    ? project.room_type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
    : 'N/A'

  return (
    <div style={{ padding: '0 2rem 3rem', maxWidth: '850px', margin: '0 auto' }}>
      <Link to="/browse">Back to Browse</Link>
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

      {isCustomer && (
        <section style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <button
            type="button"
            onClick={() => setShowFlagForm((visible) => !visible)}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #ff8a80',
              background: 'transparent',
              color: '#ff8a80',
              cursor: 'pointer',
            }}
          >
            {showFlagForm ? 'Cancel report' : 'Report this project'}
          </button>

          {showFlagForm && (
            <form
              onSubmit={handleFlagSubmit}
              style={{ display: 'grid', gap: '0.75rem', maxWidth: '560px', margin: '1rem auto 0' }}
            >
              <label htmlFor="flag-reason">Reason</label>
              <select
                id="flag-reason"
                value={flagReason}
                onChange={(event) => setFlagReason(event.target.value)}
                style={{ padding: '0.55rem', borderRadius: '6px' }}
              >
                <option value="INAPPROPRIATE">Inappropriate content</option>
                <option value="MISLEADING">Misleading information</option>
                <option value="COPYRIGHT">Copyright concern</option>
                <option value="OTHER">Other</option>
              </select>

              <label htmlFor="flag-details">Details</label>
              <textarea
                id="flag-details"
                rows="4"
                value={flagDetails}
                onChange={(event) => setFlagDetails(event.target.value)}
                required={flagReason === 'OTHER'}
                placeholder="Explain what the Platform Manager should review."
                style={{ padding: '0.55rem', borderRadius: '6px' }}
              />

              <button
                type="submit"
                disabled={submittingFlag}
                style={{ padding: '0.55rem', borderRadius: '6px', border: 0, background: '#c62828', color: '#fff', cursor: 'pointer' }}
              >
                {submittingFlag ? 'Submitting...' : 'Submit report'}
              </button>
            </form>
          )}

          {flagMessage && (
            <p role="status" style={{ color: '#9be7a1', marginTop: '0.8rem' }}>
              {flagMessage}
            </p>
          )}
          {flagError && (
            <p role="alert" style={{ color: '#ff8a80', marginTop: '0.8rem' }}>
              {flagError}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default ProjectDetailPage
