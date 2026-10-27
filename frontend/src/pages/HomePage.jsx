import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const carouselRef = useRef(null)

  const styles = ['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary']
  const featuredProjects = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Featured Design ${i + 1}`,
    style: styles[i % styles.length],
  }))

  // 10 slides + 1 clone of first slide at the end for smooth wrap
  const slides = [...featuredProjects, featuredProjects[0]]

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= 9) {
          // Go to clone (index 10), then reset to 0
          setIsTransitioning(true)
          return 10
        }
        return prev + 1
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Handle transition reset after reaching clone
  useEffect(() => {
    if (currentSlide === 10) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setCurrentSlide(0)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentSlide])

  // Scroll to current slide
  useEffect(() => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth
      carouselRef.current.scrollTo({
        left: currentSlide * slideWidth,
        behavior: isTransitioning ? 'smooth' : 'auto',
      })
    }
  }, [currentSlide, isTransitioning])

  return (
    <div style={{ width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Hero section - sticky parallax */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 0,
        textAlign: 'center',
        padding: '6rem 1rem',
        background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a, #1a1a1a)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ffffff' }}>Welcome to HASH Designs</h1>
        <p style={{ fontSize: '1.3rem', marginBottom: '2rem', color: '#ffffff' }}>
          Find the perfect interior designer for your renovation project.
        </p>
        <Link to="/browse" style={{
          padding: '0.75rem 2rem',
          background: '#c4704b',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '24px',
          fontSize: '1.1rem',
        }}>
          Browse All Projects
        </Link>
      </div>

      {/* Content section - slides over hero */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(135deg, #2c2c2c, #4a4a4a, #1a1a1a)',
        minHeight: '100vh',
      }}>
        {/* Featured Designs carousel */}
        <section style={{ marginBottom: '2rem', padding: '2rem 1rem' }}>
          <h2 style={{ textAlign: 'center' }}>Featured Designs</h2>
          <p style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center' }}>Auto-scrolling every 5 seconds</p>
          <div
            ref={carouselRef}
            style={{
              display: 'flex',
              overflow: 'hidden',
              scrollSnapType: 'x mandatory',
              width: '100%',
              aspectRatio: '16 / 9',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            {slides.map((project, i) => (
              <div
                key={i}
                style={{
                  minWidth: '100%',
                  scrollSnapAlign: 'start',
                  border: '1px dashed rgba(255,255,255,0.3)',
                  padding: '2rem',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
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
                  background: i === (currentSlide % 10) ? '#c4704b' : '#ccc',
                  margin: '0 4px',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </section>

        {/* Browse by Style */}
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
              <span style={{ fontWeight: 'bold', marginRight: '0.75rem', color: '#c4704b', minWidth: '24px' }}>1.</span>
              <span>Browse design projects by style, budget, and room type</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 'bold', marginRight: '0.75rem', color: '#c4704b', minWidth: '24px' }}>2.</span>
              <span>View project details and save your favourites</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 'bold', marginRight: '0.75rem', color: '#c4704b', minWidth: '24px' }}>3.</span>
              <span>Find interior designers that match your needs</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 'bold', marginRight: '0.75rem', color: '#c4704b', minWidth: '24px' }}>4.</span>
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
          <p>Placeholder footer text - add your content here</p>
          <p style={{ marginTop: '0.5rem' }}>HASH Designs &copy; 2026</p>
        </footer>
      </div>
    </div>
  )
}

export default HomePage