import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiDelete, apiPatch } from '../api/client'
import { FEATURES } from '../config/features'

function CategoryManagementUI() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const loadCategories = () => {
    apiGet('/categories/').then(data => {
      const list = Array.isArray(data) ? data : data.results || []
      setCategories(list.sort((a, b) => a.id - b.id))
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

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDesc(cat.description || '')
  }

  const handleRename = async (id) => {
    if (FEATURES.CATEGORY_VALIDATE && !editName.trim()) {
      alert('Category name cannot be empty.')
      return
    }
    try {
      await apiPatch(`/categories/${id}/update/`, { name: editName, description: editDesc })
      setEditingId(null)
      loadCategories()
    } catch (err) {
      alert('Failed to rename category')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditDesc('')
  }

  const inputStyle = { padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0' }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 2rem' }}>
      <h1>Manage Project Categories</h1>
      <form onSubmit={handleCreate} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)} required style={inputStyle} />
        <input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={inputStyle} />
        <button type="submit" style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none', background: '#c4704b', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>Add</button>
      </form>
      {loading ? <p>Loading...</p> : categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', overflow: 'hidden' }}>
          <table cellPadding="12" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: "center", width: "80px" }}>ID</th>
                <th style={{ textAlign: "center" }}>Name</th>
                <th style={{ textAlign: "center" }}>Description</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ textAlign: 'center' }}>{c.id}</td>
                  {editingId === c.id ? (
                    <>
                      <td><input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...inputStyle, width: '100%' }} /></td>
                      <td><input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ ...inputStyle, width: '100%' }} /></td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleRename(c.id)} style={{ color: '#4caf50', background: 'none', border: '1px solid #4caf50', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', marginRight: '0.4rem', fontSize: '0.8rem' }}>Save</button>
                        <button onClick={cancelEdit} style={{ color: '#ccc', background: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.description || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        {FEATURES.CATEGORY_RENAME && (
                          <button onClick={() => startEdit(c)} style={{ color: '#64b5f6', background: 'none', border: '1px solid #64b5f6', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', marginRight: '0.4rem', fontSize: '0.8rem' }}>Rename</button>
                        )}
                        <button onClick={() => handleDelete(c.id)} style={{ color: '#ff6b6b', background: 'none', border: '1px solid #ff6b6b', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CategoryManagementUI