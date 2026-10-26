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
        background: '#f5f5f5',
        marginBottom: '2rem',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to HASH Designs</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#555' }}>
          Find the perfect interior designer for your renovation project.
        </p>
        <Link to="/browse" style={{
          padding: '0.75rem 2rem',
          background: '#1976d2',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '1.1rem',
        }}>
          Browse All Projects
        </Link>
      </div>

      {/* Featured Designs carousel */}
      <section style={{ marginBottom: '2rem', padding: '0 1rem' }}>
        <h2>Featured Designs</h2>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>Auto-scrolling every 5 seconds</p>
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
                border: '1px dashed #ccc',
                padding: '3rem',
                textAlign: 'center',
                boxSizing: 'border-box',
                background: '#fafafa',
              }}
            >
              <h3>{project.title}</h3>
              <p>Style: {project.style}</p>
              <p><em>Image placeholder - add project image here</em></p>
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

      {/* Browse by Style */}
      <section style={{ marginBottom: '2rem', padding: '0 1rem' }}>
        <h2>Browse by Style</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {styles.map(style => (
            <Link key={style} to={`/browse?style=${style}`} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', textDecoration: 'none', color: 'black', borderRadius: '4px' }}>
              {style}
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '0 1rem', marginBottom: '2rem' }}>
        <h2>How It Works</h2>
        <ol>
          <li>Browse design projects by style, budget, and room type</li>
          <li>View project details and save your favourites</li>
          <li>Find interior designers that match your needs</li>
          <li>Track interest in your own projects (for designers)</li>
        </ol>
      </section>
    </div>
  )
}

export default HomePage