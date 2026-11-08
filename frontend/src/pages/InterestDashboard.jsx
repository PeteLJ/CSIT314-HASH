import { useEffect, useMemo, useState } from 'react'

const UPDATE_INTERVAL_MS = 5000

const PROJECT_TITLES = [
  'Coastal Family Retreat',
  'Contemporary City Apartment',
  'Industrial Loft Conversion',
  'Japanese-inspired Studio',
  'Luxury Penthouse Refresh',
  'Minimalist Living Space',
  'Modern Heritage Home',
  'Scandinavian Family Home',
  'Tropical Courtyard House',
  'Warm Neutral Condominium',
]

const DESIGN_STYLES = [
  'Contemporary',
  'Industrial',
  'Japandi',
  'Minimalist',
  'Modern',
  'Scandinavian',
]

const PROJECT_STATUSES = [
  'PUBLISHED',
  'PUBLISHED',
  'PUBLISHED',
  'ARCHIVED',
  'DRAFT',
]

function randomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

function randomItem(items) {
  return items[randomInteger(0, items.length - 1)]
}

function shuffle(items) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInteger(0, index)
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

function rankProjects(projects) {
  return [...projects].sort((first, second) => (
    second.view_count - first.view_count
    || second.shortlist_count - first.shortlist_count
  ))
}

function createRandomProjects() {
  const projectCount = randomInteger(4, 8)
  const generatedAt = Date.now()

  const projects = shuffle(PROJECT_TITLES)
    .slice(0, projectCount)
    .map((title, index) => {
      const status = index === 0
        ? 'PUBLISHED'
        : randomItem(PROJECT_STATUSES)
      const viewCount = status === 'DRAFT' ? 0 : randomInteger(18, 180)
      const maximumShortlists = Math.max(2, Math.floor(viewCount * 0.18))

      return {
        id: `simulation-${generatedAt}-${index}`,
        title,
        style: randomItem(DESIGN_STYLES),
        status,
        view_count: viewCount,
        shortlist_count: status === 'DRAFT'
          ? 0
          : randomInteger(0, maximumShortlists),
      }
    })

  return rankProjects(projects)
}

function simulateEngagement(projects) {
  const updatedProjects = projects.map((project) => {
    if (project.status !== 'PUBLISHED') return project

    const newViews = randomInteger(1, 12)
    const newShortlists = Math.random() < 0.6 ? randomInteger(0, 2) : 0

    return {
      ...project,
      view_count: project.view_count + newViews,
      shortlist_count: project.shortlist_count + newShortlists,
    }
  })

  return rankProjects(updatedProjects)
}

function statusColor(status) {
  if (status === 'PUBLISHED') return '#8bd49c'
  if (status === 'ARCHIVED') return '#ffca80'
  return '#b0bec5'
}

function InterestDashboard() {
  const [designerId, setDesignerId] = useState(
    localStorage.getItem('designer_id') || 'demo',
  )
  const [projects, setProjects] = useState(createRandomProjects)
  const [isRunning, setIsRunning] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const totals = useMemo(() => projects.reduce(
    (summary, project) => ({
      totalViews: summary.totalViews + project.view_count,
      totalShortlists: summary.totalShortlists + project.shortlist_count,
    }),
    { totalViews: 0, totalShortlists: 0 },
  ), [projects])

  useEffect(() => {
    const handleDesignerChange = (event) => {
      const nextDesignerId = (
        event.detail
        || localStorage.getItem('designer_id')
        || 'demo'
      )

      setDesignerId(nextDesignerId)
      setProjects(createRandomProjects())
      setLastUpdated(new Date())
    }

    window.addEventListener('designerChanged', handleDesignerChange)
    return () => window.removeEventListener('designerChanged', handleDesignerChange)
  }, [])

  useEffect(() => {
    if (!isRunning) return undefined

    const interval = window.setInterval(() => {
      setProjects((currentProjects) => simulateEngagement(currentProjects))
      setLastUpdated(new Date())
    }, UPDATE_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [isRunning])

  const regenerateData = () => {
    setProjects(createRandomProjects())
    setLastUpdated(new Date())
  }

  const formattedUpdateTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    : 'Initial dataset'

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem 3rem' }}>
      <h1>Portfolio Interest Overview</h1>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap',
          color: '#aaa',
          fontSize: '0.9rem',
          marginBottom: '1rem',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: isRunning ? '#66bb6a' : '#ffca28',
            boxShadow: isRunning ? '0 0 8px #66bb6a' : 'none',
          }}
        />
        <span>
          Random live simulation for designer {designerId}. Updates every 5 seconds.
          {' '}Last update: {formattedUpdateTime}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setIsRunning((running) => !running)}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '7px',
            border: '1px solid #90caf9',
            background: 'transparent',
            color: '#90caf9',
            cursor: 'pointer',
          }}
        >
          {isRunning ? 'Pause simulation' : 'Resume simulation'}
        </button>
        <button
          type="button"
          onClick={regenerateData}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '7px',
            border: 0,
            background: '#546e7a',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Generate new dataset
        </button>
      </div>

      <div
        aria-live="polite"
        style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#64b5f6' }}>
            {totals.totalViews}
          </div>
          <div style={{ color: '#ccc' }}>Total Views</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>
            {totals.totalShortlists}
          </div>
          <div style={{ color: '#ccc' }}>Total Shortlists</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', minWidth: '150px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c4704b' }}>
            {projects.length}
          </div>
          <div style={{ color: '#ccc' }}>Projects</div>
        </div>
      </div>

      <h2>Live Ranked Projects</h2>
      <div style={{ overflowX: 'auto', borderRadius: '8px' }}>
        <table
          cellPadding="12"
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
              <th>Rank</th>
              <th>Title</th>
              <th>Style</th>
              <th>Status</th>
              <th>Views</th>
              <th>Shortlists</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => (
              <tr
                key={project.id}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <td>{index + 1}</td>
                <td>{project.title}</td>
                <td>{project.style}</td>
                <td>
                  <span style={{ color: statusColor(project.status), fontWeight: 600 }}>
                    {project.status}
                  </span>
                </td>
                <td>{project.view_count}</td>
                <td>{project.shortlist_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InterestDashboard

