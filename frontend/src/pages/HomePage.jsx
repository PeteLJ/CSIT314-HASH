import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef(null)

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 10)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to current slide
  useEffect(() => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth
      carouselRef.current.scrollTo({
        left: currentSlide * slideWidth,
        behavior: 'smooth',
      })
    }
  }, [currentSlide])

  const styles = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']

  const featuredProjects = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Featured Design ${i + 1}`,
    style: styles[i % styles.length],
  }))

  return (
    <div style={{ width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Hero section */}
      <div style={{
        textAlign: 'center',
        padding: '4rem 1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        marginBottom: '2rem',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to HASH Designs</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#ffffff' }}>
          Find the perfect interior designer for your renovation project.
        </p>
        <Link to="/browse" style={{
          padding: '0.75rem 2rem',
          background: '#1976d2',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '24px',
          fontSize: '1.1rem',
        }}>
          Browse All Projects
        </Link>
      </div>

      {/* Featured Designs carousel */}
      <section style={{ marginBottom: '2rem', padding: '0 1rem' }}>
        <h2>Featured Designs</h2>
        <div
          ref={carouselRef}
          style={{
            display: 'flex',
            overflow: 'hidden',
            scrollSnapType: 'x mandatory',
            width: '100%',
          }}
        >
          {featuredProjects.map((project, i) => (
            <div
              key={project.id}
              style={{
                minWidth: '100%',
                scrollSnapAlign: 'start',
                border: '1px dashed rgba(255,255,255,0.3)',
                padding: '3rem',
                textAlign: 'center',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
              }}
            >
              <h3>{project.title}</h3>
              <p>Style: {project.style}</p>
              <p><em>Image placeholder - add interior design image here</em></p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          {featuredProjects.map((_, i) => (
            <span
              key={i}
              onClick={() => setCurrentSlide(i)}
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: i === currentSlide ? '#1976d2' : '#ccc',
                margin: '0 4px',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </section>

      {/* Browse by Style - centered */}
      <section style={{ marginBottom: '2rem', padding: '0 1rem', textAlign: 'center' }}>
        <h2>Browse by Style</h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
          {styles.map(style => (
            <Link key={style} to={`/browse?style=${style}`} style={{
              padding: '0.5rem 1.5rem',
              border: '1px solid rgba(255,255,255,0.3)',
              textDecoration: 'none',
              color: '#e0e0e0',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.05)',
            }}>
              {style}
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '0 1rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h2>How It Works</h2>
        <ol style={{ listStyle: 'none', padding: 0, display: 'inline-block', textAlign: 'left' }}>
          <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 'bold', marginRight: '0.75rem', color: '#1976d2', minWidth: '24px' }}>1.</span>
            <span>Browse design projects by style, budget, and room type</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 'bold', marginRight: '0.75rem', color: '#1976d2', minWidth: '24px' }}>2.</span>
            <span>View project details and save your favourites</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 'bold', marginRight: '0.75rem', color: '#1976d2', minWidth: '24px' }}>3.</span>
            <span>Find interior designers that match your needs</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 'bold', marginRight: '0.75rem', color: '#1976d2', minWidth: '24px' }}>4.</span>
            <span>Track interest in your own projects (for designers)</span>
          </li>
        </ol>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        color: '#888',
        fontSize: '0.9rem',
      }}>
        <p>Placeholder footer text - for future edits</p>
        <p style={{ marginTop: '0.5rem' }}>HASH Designs &copy; 2026</p>
      </footer>
    </div>
  )
}

export default HomePage