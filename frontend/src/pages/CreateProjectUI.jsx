import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../api/client'

// US-21: Create Interior Design Project
function CreatePage() {

  // Project form data
  const [form, setForm] = useState({
    title: '',
    description: '',
    style: '',
    room_type: '',
    budget_min: '',
    budget_max: '',
    category: '',
  })

  // Category data
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoryError, setCategoryError] = useState('')

  // Form submission states
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Available design styles
  const styles = [
    'Modern',
    'Scandinavian',
    'Industrial',
    'Minimalist',
    'Classic',
    'Contemporary',
  ]

  // Load project categories from Django backend
  useEffect(() => {
    let active = true

    const loadCategories = async () => {
      try {
        const data = await apiGet('/categories/')

        const list = Array.isArray(data)
          ? data
          : data.results || []

        if (active) {
          setCategories(list)
          setCategoryError('')
        }

      } catch (err) {
        if (active) {
          setCategoryError('Failed to load project categories.')
          console.error('Failed to load categories:', err)
        }

      } finally {
        if (active) {
          setLoadingCategories(false)
        }
      }
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [])

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

    const budgetMin = form.budget_min === ''
      ? null
      : Number(form.budget_min)

    const budgetMax = form.budget_max === ''
      ? null
      : Number(form.budget_max)

    if (
      budgetMin !== null &&
      (!Number.isFinite(budgetMin) || budgetMin < 0)
    ) {
      return 'Minimum budget must be a valid non-negative number.'
    }

    if (
      budgetMax !== null &&
      (!Number.isFinite(budgetMax) || budgetMax < 0)
    ) {
      return 'Maximum budget must be a valid non-negative number.'
    }

    if (
      budgetMin !== null &&
      budgetMax !== null &&
      budgetMax < budgetMin
    ) {
      return 'Maximum budget cannot be lower than minimum budget.'
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
        room_type: form.room_type,
        budget_min: form.budget_min === ''
          ? null
          : form.budget_min,
        budget_max: form.budget_max === ''
          ? null
          : form.budget_max,
        category: form.category || null,
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
        category: '',
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
    <div style={{ padding: '0 2rem' }}>

      <h1>Create New Design Project</h1>

      <p>
        Enter your project details below.
        New projects will be saved as Draft.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: '600px' }}
      >

        {/* Project Title */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title">Title: </label>

          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={255}
            style={{ width: '100%' }}
          />
        </div>

        {/* Project Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description">Description: </label>

          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%' }}
          />
        </div>

        {/* Design Style */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="style">Style: </label>

          <select
            id="style"
            name="style"
            value={form.style}
            onChange={handleChange}
            style={{ width: '100%' }}
          >
            <option value="">Select style</option>

            {styles.map(style => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>

        {/* Project Category */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="category">Project Category: </label>

          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            disabled={loadingCategories}
            style={{ width: '100%' }}
          >
            <option value="">
              {loadingCategories
                ? 'Loading categories...'
                : 'Select category'}
            </option>

            {categories.map(category => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>

          {categoryError && (
            <p style={{ color: 'red' }}>
              {categoryError}
            </p>
          )}
        </div>

        {/* Room Type */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="room_type">Room Type: </label>

          <select
            id="room_type"
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

        {/* Minimum Renovation Budget */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="budget_min">Budget Min: </label>

          <input
            id="budget_min"
            name="budget_min"
            type="number"
            min="0"
            step="0.01"
            value={form.budget_min}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </div>

        {/* Maximum Renovation Budget */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="budget_max">Budget Max: </label>

          <input
            id="budget_max"
            name="budget_max"
            type="number"
            min="0"
            step="0.01"
            value={form.budget_max}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </div>

        {/* Submission Error */}
        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}

        {/* Create Project Button */}
        <button
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Creating...' : 'Create Project'}
        </button>

        {/* Creation Success Message */}
        {success && (
          <p role="status" style={{ color: 'green' }}>
            {success}
          </p>
        )}

      </form>
    </div>
  )
}

export default CreatePage
