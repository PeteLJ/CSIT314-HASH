import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'

function DetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewCount, setViewCount] = useState(0)
  const [shortlistCount, setShortlistCount] = useState(0)
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [flagReason, setFlagReason] = useState('INAPPROPRIATE')
  const [flagDetails, setFlagDetails] = useState('')
  const [flagMessage, setFlagMessage] = useState('')
  const [flagError, setFlagError] = useState('')
  const [submittingFlag, setSubmittingFlag] = useState(false)
  const viewRecorded = useRef(false)
  const isCustomer = (localStorage.getItem('role') || 'Customer') === 'Customer'

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

  return (
    <div style={{ padding: '0 2rem 3rem', maxWidth: '850px', margin: '0 auto' }}>
      <Link to="/browse">Back to Browse</Link>
      <h1>{project.title}</h1>
      <p><strong>Style:</strong> {project.style}</p>
      <p><strong>Cost:</strong> ${Number(project.budget_min).toLocaleString()}</p>
      <p><strong>Designer:</strong> {project.designer_name}</p>
      <p><strong>Room Type:</strong> {project.room_type ? project.room_type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') : 'N/A'}</p>
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

export default DetailPage
