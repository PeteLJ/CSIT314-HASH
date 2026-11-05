import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'

// Form to create a new design project
function CreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    style: '',
    room_type: '',
    budget_min: '',
    budget_max: '',
    category: '',
  })
  const [categories, setCategories] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  useEffect(() => {
    apiGet('/categories/')
      .then(data => {
        const list = Array.isArray(data)
          ? data
          : data.results || []
  
        setCategories(list)
      })
      .catch(err => {
        console.error('Failed to load categories:', err)
      })
  }, [])
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
  
    setSubmitting(true)
    setError('')
    setSuccess('')
  
    try {
      const payload = {
        ...form,
        category: form.category || null,
        budget_min: form.budget_min === ''
          ? null
          : form.budget_min,
        budget_max: form.budget_max === ''
          ? null
          : form.budget_max,
      }
  
      const project = await apiPost('/projects/', payload)
  
      setSuccess(
        `Project "${project.title}" created successfully as Draft.`
      )
  
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }


  const styles = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']

  return (
    <div style={{ padding: "0 2rem" }}>
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
          <label>Project Category: </label>
        
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={{ width: '100%' }}
          >
            <option value="">Select category</option>
        
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
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
          <label>Room Type: </label>
          <select
            name="room_type"
            value={form.room_type}
            onChange={handleChange}
            style={{ width: '100%' }}
          >
            <option value="">Select room type</option>
            <option value="LIVING_ROOM">Living Room</option>
            <option value="BEDROOM">Bedroom</option>
            <option value="KITCHEN">Kitchen</option>
            <option value="BATHROOM">Bathroom</option>
            <option value="WHOLE_UNIT">Whole Unit</option>
          </select>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Project'}
        </button>
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  )
}

export default CreatePage


