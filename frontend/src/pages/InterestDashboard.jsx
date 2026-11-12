import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api/client'

function InterestDashboard() {
  const [designerId, setDesignerId] = useState(localStorage.getItem('designer_id') || '')
  const [period, setPeriod] = useState('all')
  const [retry, setRetry] = useState(0)
  const [report, setReport] = useState({ key: null, data: null, error: '' })
  const reportKey = `${designerId}/${period}/${retry}`
  const data = report.key === reportKey ? report.data : null
  const error = report.key === reportKey ? report.error : ''
  const loading = Boolean(designerId) && report.key !== reportKey

  // Listen for designer changes from navbar (immediate update)
  useEffect(() => {
    const handleDesignerChange = (e) => {
      setDesignerId(String(e.detail ?? localStorage.getItem('designer_id') ?? ''))
    }
    window.addEventListener('designerChanged', handleDesignerChange)
    return () => window.removeEventListener('designerChanged', handleDesignerChange)
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer

    const fetchData = async () => {
      const currentId = localStorage.getItem('designer_id') || ''
      if (currentId !== designerId) {
        setDesignerId(currentId)
        return
      }
      if (!designerId) return

      try {
        const params = new URLSearchParams({ designer_id: designerId, period, _: Date.now().toString() })
        const result = await apiGet(`/analytics/portfolio/?${params}`)
        if (!cancelled) {
          setReport({ key: reportKey, data: result, error: '' })
        }
      } catch {
        if (!cancelled) {
          setReport({ key: reportKey, data: null, error: 'Failed to load portfolio data. Please try again.' })
        }
      } finally {
        if (!cancelled) {
          // Schedule after completion so polling requests cannot overtake each other.
          timer = setTimeout(fetchData, 5000)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [designerId, period, reportKey])

  const hasProjects = data && data.projects.length > 0
  const noInterest = hasProjects && data.total_views === 0 && data.total_shortlists === 0

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
      <h1>Portfolio Interest Overview</h1>
      <p style={{ color: '#888', fontSize: '0.9rem' }}>Showing stats for selected designer. Auto-updating every 5 seconds.</p>
      <div style={{ margin: '1rem 0' }}>
        <label htmlFor="reporting-period">Reporting period: </label>
        <select id="reporting-period" value={period} onChange={e => setPeriod(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '8px', background: '#fff', color: '#333' }}>
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>
      {!designerId && <p role="status">Select an interior designer to view project interest.</p>}
      {loading && <p role="status">Loading portfolio data...</p>}
      {error && <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button>
      </div>}
      {!loading && data && <>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#64b5f6' }}>{data.total_views}</div>
            <div style={{ color: '#ccc' }}>Total Views</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>{data.total_shortlists}</div>
            <div style={{ color: '#ccc' }}>Total Shortlists</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c4704b' }}>{data.project_count}</div>
            <div style={{ color: '#ccc' }}>Projects</div>
          </div>
        </div>
        {!hasProjects ? (
          <div role="status" style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <h2>No projects available</h2>
            <p>This designer does not own any projects yet. Create a project to start tracking interest.</p>
            <Link to="/create">Create a project</Link>
          </div>
        ) : <>
          {noInterest && <p role="status" style={{ marginBottom: '1rem' }}>No interest recorded for this reporting period. Views and shortlists are shown as 0.</p>}
          <h2>Ranked Projects</h2>
          <div style={{ overflowX: 'auto' }}>
            <table cellPadding="12" style={{ borderCollapse: 'collapse', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <th>Rank</th><th>Title</th><th>Style</th><th>Status</th><th>Views</th><th>Shortlists</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td><Link to={`/trend/${p.id}`} style={{ textDecoration: 'none' }}>{p.title}</Link></td>
                    <td>{p.style}</td>
                    <td>{p.status}</td>
                    <td>{p.view_count}</td>
                    <td>{p.shortlist_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}
      </>}
    </div>
  )
}

export default InterestDashboard
