import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiDelete } from '../api/client'

// Manage project categories (add/delete)
function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const loadCategories = () => {
    apiGet('/categories/').then(data => {
      setCategories(Array.isArray(data) ? data : data.results || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadCategories() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await apiPost('/categories/', { name: newName, description: newDesc })
      setNewName('')
      setNewDesc('')
      loadCategories()
    } catch (err) {
      alert('Failed to create category')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await apiDelete(`/categories/${id}/`)
      loadCategories()
    } catch (err) {
      alert('Failed to delete category')
    }
  }

  return (
    <div>
      <h1>Manage Project Categories</h1>
      <form onSubmit={handleCreate} style={{ marginBottom: '1rem' }}>
        <input placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)} required />
        <input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ marginLeft: '0.5rem' }} />
        <button type="submit" style={{ marginLeft: '0.5rem' }}>Add</button>
      </form>
      {loading ? <p>Loading...</p> : (
        <ul>
          {categories.map(c => (
            <li key={c.id}>
              <strong>{c.name}</strong> - {c.description}
              <button onClick={() => handleDelete(c.id)} style={{ marginLeft: '1rem', color: 'red' }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default CategoriesPage
