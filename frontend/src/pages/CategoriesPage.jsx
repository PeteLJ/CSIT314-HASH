import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiDelete } from '../api/client'

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

  const inputStyle = { padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }

  return (
    <div style={{ padding: "0 2rem", maxWidth: '600px', margin: '0 auto' }}>
      <h1>Manage Project Categories</h1>
      <form onSubmit={handleCreate} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)} required style={inputStyle} />
        <input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={inputStyle} />
        <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#c4704b', color: 'white', cursor: 'pointer' }}>Add</button>
      </form>
      {loading ? <p>Loading...</p> : (
        <div style={{ padding: 0 }}>
          {categories.map(c => (
            <div key={c.id} style={{ marginBottom: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{c.name}</strong> - {c.description}
              </div>
              <button onClick={() => handleDelete(c.id)} style={{ color: '#ff6b6b', background: 'none', border: '1px solid #ff6b6b', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
