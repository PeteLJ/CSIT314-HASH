import { useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'

const inputStyle = {
  padding: '0.55rem 0.7rem',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
}

const buttonStyle = {
  padding: '0.2rem 0.5rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
}

function CategoryManagementUI() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadCategories = async () => {
    try {
      const data = await apiGet('/categories/')
      setCategories(Array.isArray(data) ? data : data.results || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    try {
      await apiPost('/categories/', {
        name: newName.trim(),
        description: newDesc.trim(),
      })
      setNewName('')
      setNewDesc('')
      setNotice('Category created successfully.')
      await loadCategories()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEditing = (category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditDesc(category.description || '')
    setError('')
    setNotice('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
    setEditDesc('')
  }

  const handleRename = async (categoryId) => {
    setError('')
    setNotice('')

    try {
      await apiPatch(`/categories/${categoryId}/`, {
        name: editName.trim(),
        description: editDesc.trim(),
      })
      cancelEditing()
      setNotice('Category updated successfully.')
      await loadCategories()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (category) => {
    const projectCount = category.project_count || 0
    if (projectCount > 0) {
      setError(
        `“${category.name}” is used by ${projectCount} project(s). ` +
        'Reassign them before deleting the category.',
      )
      return
    }

    if (!window.confirm(`Delete the “${category.name}” category?`)) return

    setError('')
    setNotice('')

    try {
      await apiDelete(`/categories/${category.id}/`)
      setNotice('Category deleted successfully.')
      await loadCategories()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 2rem 3rem' }}>
      <h1>Manage Project Categories</h1>
      <p style={{ marginBottom: '1.25rem' }}>
        Create, rename and safely delete the categories customers use to browse projects.
      </p>

      <form
        onSubmit={handleCreate}
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.6rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <input
          aria-label="New category name"
          placeholder="Category name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          required
          style={inputStyle}
        />
        <input
          aria-label="New category description"
          placeholder="Description"
          value={newDesc}
          onChange={(event) => setNewDesc(event.target.value)}
          style={{ ...inputStyle, minWidth: '280px' }}
        />
        <button
          type="submit"
          style={{
            ...buttonStyle,
            border: 'none',
            background: '#c4704b',
            color: 'white',
          }}
        >
          Create category
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: '#ff8a80', marginBottom: '1rem' }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: '#9be7a1', marginBottom: '1rem' }}>
          {notice}
        </p>
      )}

      {loading ? <p>Loading...</p> : categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            cellPadding="12"
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                <th>Name</th>
                <th>Description</th>
                <th>Projects</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const isEditing = editingId === category.id
                return (
                  <tr
                    key={category.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    <td>
                      {isEditing ? (
                        <input
                          aria-label={`Rename ${category.name}`}
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          style={inputStyle}
                        />
                      ) : <strong>{category.name}</strong>}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          aria-label={`Description for ${category.name}`}
                          value={editDesc}
                          onChange={(event) => setEditDesc(event.target.value)}
                          style={{ ...inputStyle, width: '100%' }}
                        />
                      ) : category.description || '—'}
                    </td>
                    <td>{category.project_count || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center' }}>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRename(category.id)}
                              style={{ ...buttonStyle, border: 0, background: '#4caf50', color: '#fff' }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              style={{ ...buttonStyle, border: '1px solid #aaa', background: 'transparent', color: '#ddd' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(category)}
                              style={{ ...buttonStyle, border: '1px solid #90caf9', background: 'transparent', color: '#90caf9' }}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category)}
                              style={{ ...buttonStyle, border: '1px solid #ff8a80', background: 'transparent', color: '#ff8a80' }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CategoryManagementUI
