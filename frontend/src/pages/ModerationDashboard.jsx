import { useEffect, useState } from 'react'
import { apiGet, apiPatch } from '../api/client'

const reasonLabels = {
  INAPPROPRIATE: 'Inappropriate content',
  MISLEADING: 'Misleading information',
  COPYRIGHT: 'Copyright concern',
  OTHER: 'Other',
}

function ModerationDashboard() {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [processingId, setProcessingId] = useState(null)

  const loadFlags = async () => {
    try {
      const data = await apiGet('/project-flags/?status=OPEN')
      setFlags(Array.isArray(data) ? data : data.results || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFlags()
  }, [])

  const handleDecision = async (flag, action) => {
    const removing = action === 'REMOVE'
    const confirmed = window.confirm(
      removing
        ? `Remove “${flag.project_title}” from the platform?`
        : `Keep “${flag.project_title}” and dismiss this report?`,
    )

    if (!confirmed) return

    const moderationNote = window.prompt(
      'Optional moderation note:',
      removing ? 'Confirmed policy violation.' : 'No policy violation found.',
    )

    if (moderationNote === null) return

    setProcessingId(flag.id)
    setError('')
    setNotice('')

    try {
      await apiPatch(`/project-flags/${flag.id}/moderate/`, {
        action,
        moderation_note: moderationNote,
      })
      setNotice(
        removing
          ? 'Project removed and report resolved.'
          : 'Report dismissed and project kept.',
      )
      await loadFlags()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '0 2rem 3rem' }}>
      <h1>Flagged Project Moderation</h1>
      <p style={{ marginBottom: '1.25rem' }}>
        Review customer reports, remove inappropriate projects or dismiss reports that do not violate platform rules.
      </p>

      {error && (
        <p role="alert" style={{ color: '#ff8a80', marginBottom: '1rem' }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: '#9be7a1', marginBottom: '1rem' }}>
          {notice}
        </p>
      )}

      {loading ? <p>Loading moderation queue...</p> : flags.length === 0 ? (
        <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
          <h2>No open reports</h2>
          <p>The moderation queue is currently clear.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {flags.map((flag) => (
            <article
              key={flag.id}
              style={{
                padding: '1.25rem',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ marginBottom: '0.35rem' }}>{flag.project_title}</h2>
                  <p>Designer: {flag.designer_name}</p>
                  <p>Project status: {flag.project_status}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>{reasonLabels[flag.reason] || flag.reason}</strong>
                  <p>Reported by {flag.reporter_name}</p>
                  <p>{new Date(flag.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div style={{ margin: '1rem 0', padding: '0.8rem', background: 'rgba(0,0,0,0.18)', borderRadius: '8px' }}>
                <strong>Customer evidence / details</strong>
                <p style={{ marginTop: '0.35rem' }}>
                  {flag.details || 'No additional details were provided.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={processingId === flag.id}
                  onClick={() => handleDecision(flag, 'DISMISS')}
                  style={{
                    padding: '0.55rem 0.9rem',
                    borderRadius: '6px',
                    border: '1px solid #90caf9',
                    background: 'transparent',
                    color: '#90caf9',
                    cursor: 'pointer',
                  }}
                >
                  Keep project
                </button>
                <button
                  type="button"
                  disabled={processingId === flag.id}
                  onClick={() => handleDecision(flag, 'REMOVE')}
                  style={{
                    padding: '0.55rem 0.9rem',
                    borderRadius: '6px',
                    border: 0,
                    background: '#c62828',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {processingId === flag.id ? 'Processing...' : 'Remove project'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default ModerationDashboard
