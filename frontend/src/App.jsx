import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch projects from the Django backend API
    fetch('http://127.0.0.1:8000/api/idps/')
      .then(res => res.json())
      .then(data => {
        setProjects(data.results || data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch projects:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="App">
      <h1>Interior Design Matching Platform</h1>
      <p>Customer / Interior Designer / User Admin / Platform Management</p>

      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <div>
          <h2>Design Projects</h2>
          {projects.length === 0 ? (
            <p>No projects found. Create some in the Django admin panel.</p>
          ) : (
            <ul>
              {projects.map(project => (
                <li key={project.id}>
                  <strong>{project.title}</strong> — {project.style} ({project.status})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default App
