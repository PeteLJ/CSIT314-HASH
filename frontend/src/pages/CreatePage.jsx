import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'

// Form to create a new design project
function CreatePage() {
  const navigate = useNavigate()
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

  const styles = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']

  return (
    <div>
      <h1>Create New Design Project</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Title: </label>
          <input name="title" value={form.title} onChange={handleChange} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Description: </label>
          <textarea name="description" value={form.description} onChange={handleChange} style={{ width: '100%' }} rows={4} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Style: </label>
          <select name="style" value={form.style} onChange={handleChange} style={{ width: '100%' }}>
            <option value="">Select style</option>
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Budget Min: </label>
          <input name="budget_min" type="number" value={form.budget_min} onChange={handleChange} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Budget Max: </label>
          <input name="budget_max" type="number" value={form.budget_max} onChange={handleChange} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Status: </label>
          <select name="status" value={form.status} onChange={handleChange} style={{ width: '100%' }}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  )
}

export default CreatePage

