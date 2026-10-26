import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '2rem', background: '#f5f5f5', marginBottom: '2rem' }}>
        <h1>Welcome to HASH Designs</h1>
        <p>Find the perfect interior designer for your renovation project.</p>
        <Link to="/browse" style={{ padding: '0.5rem 1rem', background: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Browse All Projects
        </Link>
      </div>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Featured Designs</h2>
        <p><em>Placeholder - Featured projects will be displayed here.</em></p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ border: '1px dashed #ccc', padding: '2rem', width: '200px', textAlign: 'center' }}>
            Featured Project 1
          </div>
          <div style={{ border: '1px dashed #ccc', padding: '2rem', width: '200px', textAlign: 'center' }}>
            Featured Project 2
          </div>
          <div style={{ border: '1px dashed #ccc', padding: '2rem', width: '200px', textAlign: 'center' }}>
            Featured Project 3
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Browse by Style</h2>
        <p><em>Placeholder - Category/style filters will be displayed here.</em></p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {['Modern', 'Scandinavian', 'Industrial', 'Minimalist', 'Classic', 'Contemporary'].map(style => (
            <Link key={style} to={`/browse?style=${style}`} style={{ padding: '0.5rem 1rem', border: '1px solid #ccc', textDecoration: 'none', color: 'black' }}>
              {style}
            </Link>
          ))}
        </div>
      </section>

      <section>
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
