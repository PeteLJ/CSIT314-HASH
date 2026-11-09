import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../api/client'

// US-21: Create Interior Design Project
function CreateProjectUI() {
  const [roomTypes, setRoomTypes] = useState([])

  useEffect(() => {
    apiGet('/room-types/').then(data => {
      setRoomTypes(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  // Project form data
  const [form, setForm] = useState({
    title: '',
    description: '',
    style: '',
    category: '',
    room_type: '',
    cost: '',
  })

  // Category data

  // Form submission states
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Load project categories from Django backend (used as Style options)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    let active = true
    const loadCategories = async () => {
      try {
        const data = await apiGet('/categories/')
        const list = Array.isArray(data) ? data : data.results || []
        if (active) setCategories(list)
      } catch (err) {
        console.error('Failed to load categories:', err)
      } finally {
        if (active) setLoadingCategories(false)
      }
    }
    loadCategories()
    return () => { active = false }
  }, [])

  // Available design styles (from categories)
  const styles = categories.map(c => c.name)

  // Update form data when the user changes an input
  const handleChange = (e) => {
    const { name, value } = e.target

    setForm(prevForm => ({
      ...prevForm,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  // Validate form data before submitting
  const validateForm = () => {

    if (!form.title.trim()) {
      return 'Project title is required.'
    }

    const cost = form.cost === ''
      ? null
      : Number(form.cost)

    if (
      cost !== null &&
      (!Number.isFinite(cost) || cost < 0)
    ) {
      return 'Cost must be a valid non-negative number.'
    }

    return ''
  }

  // Submit new project to Django backend
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (submitting) {
      return
    }

    setError('')
    setSuccess('')

    // Client-side validation
    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)

    try {
      // Prepare data for InteriorDesignProjectSerializer
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        style: form.style,
        category: form.category || null,
        room_type: form.room_type,
        budget_min: form.cost === ''
          ? null
          : form.cost,
        budget_max: form.cost === ''
          ? null
          : form.cost,
        designer_id: localStorage.getItem('designer_id') || '',
      }

      // Create the project through ProjectController
      const project = await apiPost('/projects/', payload)

      // Display successful creation message
      setSuccess(
        `Project "${project.title || form.title}" created successfully as Draft.`
      )

      // Clear the form after successful creation
      setForm({
        title: '',
        description: '',
        style: '',
        room_type: '',
        budget_min: '',
        budget_max: '',
          })

    } catch (err) {
      setError(
        err.message || 'Failed to create project. Please try again.'
      )

    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 2rem', textAlign: 'left' }}>

      <h1 style={{ textAlign: 'center' }}>Create New Design Project</h1>

      <p style={{ color: '#ccc' }}>
        Enter your project details below.
        New projects will be saved as Draft.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >

        {/* Project Title */}
        <div>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '0.25rem', color: '#e0e0e0' }}>Title: </label>

          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={255}
            style={{ width: '50%', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}
          />
        </div>

        {/* Project Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '0.25rem', color: '#e0e0e0' }}>Description: </label>

          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="(optional)"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}
          />
        </div>

        {/* Design Style */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="style" style={{ display: 'block', marginBottom: '0.25rem', color: '#e0e0e0' }}>Style: </label>

          <select
            id="style"
            name="style"
            value={form.style}
            onChange={(e) => {
              const selected = categories.find(c => c.name === e.target.value)
              setForm(prev => ({ ...prev, style: e.target.value, category: selected ? selected.id : '' }))
            }}
            disabled={loadingCategories}
            style={{ width: '25%', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}
          >
            <option value="">
              {loadingCategories ? 'Loading...' : 'Select style'}
            </option>

            {styles.map(style => (
              <option key={style} value={style} style={{ background: '#fff', color: '#000' }}>
                {style}
              </option>
            ))}
          </select>
        </div>

        {/* Room Type */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="room_type" style={{ display: 'block', marginBottom: '0.25rem', color: '#e0e0e0' }}>Room Type: </label>

          <select
            id="room_type"
            name="room_type"
            value={form.room_type}
            onChange={handleChange}
            style={{ width: '25%', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}
          >
            <option value="" style={{ background: '#fff', color: '#000' }}>Select room type</option>
            {roomTypes.map(rt => (
              <option key={rt.value} value={rt.value} style={{ background: '#fff', color: '#000' }}>{rt.label}</option>
            ))}
          </select>
        </div>

        {/* Cost */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="cost" style={{ display: 'block', marginBottom: '0.25rem', color: '#e0e0e0' }}>Cost: </label>

          <input
            id="cost"
            name="cost"
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={handleChange}
            style={{ width: '25%', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }}
          />
        </div>

        {error && (
          <p role="alert" style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}

        {/* Create Project Button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: '#c4704b',
            color: 'white',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            fontWeight: 'bold',
          }}
        >
          {submitting ? 'Creating...' : 'Create Project'}
        </button>

        {/* Creation Success Message */}
        {success && (
          <p role="status" style={{ color: '#4caf50', fontSize: '0.9rem' }}>
            {success}
          </p>
        )}

      </form>
    </div>
  )
}

export default CreateProjectUI
