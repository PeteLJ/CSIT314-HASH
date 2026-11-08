import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { apiGet, apiPost } from '../api/client'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function TrendPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('daily')

  const fetchData = () => {
    apiGet(`/analytics/trend/${id}/?period=${period}`).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [id, period])

  // Poll for new data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      apiPost('/analytics/generate-event/', {}).catch(() => {})
      fetchData()
    }, 10000)
    return () => clearInterval(interval)
  }, [id, period])

  if (loading) return <p>Loading...</p>
  if (!data) return <p>Failed to load trend data.</p>

  const chartData = {
    labels: data.series.map(s => s.period),
    datasets: [
      {
        label: 'Views',
        data: data.series.map(s => s.view_count),
        borderColor: 'rgb(100, 181, 246)',
        backgroundColor: 'rgba(100, 181, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointStyle: 'line',
      },
      {
        label: 'Shortlists',
        data: data.series.map(s => s.shortlist_count),
        borderColor: 'rgb(196, 112, 75)',
        backgroundColor: 'rgba(196, 112, 75, 0.1)',
        tension: 0.3,
        fill: true,
        pointStyle: 'line',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#e0e0e0',
          usePointStyle: true,
          pointStyle: 'line',
          boxWidth: 40,
          padding: 10,
        },
        align: 'center',
      },
      title: { display: true, text: `Interest Trend: ${data.project_title}`, color: '#ffffff' },
    },
    scales: {
      x: { ticks: { color: '#ccc', maxRotation: 45, autoSkip: false, callback: function(value, index, ticks) { if (index % 3 === 0 || index === ticks.length - 1) { return this.getLabelForValue(value) } return '' } }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#ccc', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' }, beginAtZero: true },
    },
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
      <Link to="/dashboard" style={{ color: '#64b5f6', textDecoration: 'none' }}>Back to Dashboard</Link>
      <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
        <label>Period: </label>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}>
          <option value="daily" style={{ background: '#fff', color: '#000' }}>Daily</option>
          <option value="weekly" style={{ background: '#fff', color: '#000' }}>Weekly</option>
          <option value="monthly" style={{ background: '#fff', color: '#000' }}>Monthly</option>
        </select>
      </div>
      <p style={{ color: '#888', fontSize: '0.9rem' }}>Designer: {data.designer_name}</p>
      <p style={{ color: '#888', fontSize: '0.8rem' }}>Auto-updating every 10 seconds</p>
      {data.series.length === 0 ? (
        <p>No interest recorded for this period.</p>
      ) : (
        <Line data={chartData} options={chartOptions} />
      )}
    </div>
  )
}

export default TrendPage