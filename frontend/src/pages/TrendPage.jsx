import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { apiGet } from '../api/client'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// Trend chart showing views and shortlists over time
function TrendPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('daily')

  useEffect(() => {
    setLoading(true)
    apiGet(`/analytics/trend/${id}/?period=${period}`).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id, period])

  if (loading) return <p>Loading...</p>
  if (!data) return <p>Failed to load trend data.</p>

  const chartData = {
    labels: data.series.map(s => s.period),
    datasets: [
      {
        label: 'Views',
        data: data.series.map(s => s.views),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Shortlists',
        data: data.series.map(s => s.shortlists),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  }

  return (
    <div>
      <Link to="/dashboard">? Back to Dashboard</Link>
      <h1>Interest Trend: {data.project_title}</h1>
      <div style={{ marginBottom: '1rem' }}>
        <label>Period: </label>
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      {data.series.length === 0 ? (
        <p>No interest recorded for this period.</p>
      ) : (
        <Line data={chartData} />
      )}
    </div>
  )
}

export default TrendPage

