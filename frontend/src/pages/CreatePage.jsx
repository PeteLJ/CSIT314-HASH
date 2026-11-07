import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'

function CreatePage() {
  const navigate = useNavigate()
  const [roomTypes, setRoomTypes] = useState([])
  useEffect(() => {
    apiGet('/room-types/').then(data => {
      setRoomTypes(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])
  const [form, setForm] = useState({
    title: '',
    description: '',
    style: '',
    budget_min: '',
    budget_max: '',
    status: 'DRAFT',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiPost('/projects/', form)
      navigate('/')
    } catch (err) {
      setError('Failed to create project. Make sure you are logged in.')
    } finally {
      setSubmitting(false)
    }
  }

  const [styles, setStyles] = useState([])
  useEffect(() => {
    apiGet('/categories/').then(data => {
      const list = Array.isArray(data) ? data : data.results || []
      setStyles(list.map(c => c.name))
    }).catch(() => {})
  }, [])
  const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0', boxSizing: 'border-box' }

  return (
    <div style={{ padding: "0 2rem", maxWidth: '600px', margin: '0 auto' }}>
      <h1>Create New Design Project</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Title: </label>
          <input name="title" value={form.title} onChange={handleChange} required style={inputStyle} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Description: </label>
          <textarea name="description" value={form.description} onChange={handleChange} style={inputStyle} rows={4} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Style: </label>
          <select name="style" value={form.style} onChange={handleChange} style={inputStyle}>
            <option value="">Select style</option>
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Room Type: </label>
          <select name="room_type" value={form.room_type || ''} onChange={handleChange} style={inputStyle}>
            <option value="">Select room type</option>
            {roomTypes.map(rt => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Budget Min: </label>
          <input name="budget_min" type="number" value={form.budget_min} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Budget Max: </label>
          <input name="budget_max" type="number" value={form.budget_max} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Status: </label>
          <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{
          padding: '0.75rem 2rem',
          background: '#c4704b',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          fontSize: '1.1rem',
          cursor: 'pointer',
        }}>
          {submitting ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  )
}

export default CreatePage
