import { useWebHaptics } from 'web-haptics/react'
import './Me.css'

function Me() {
  const { trigger } = useWebHaptics({ debug: true })

  return (
    <div className="me-page">
      <div className="texture-overlay me-texture" />
      <nav className="me-nav">
        <a
          href={window.location.hostname === 'localhost' ? '/' : 'https://craftedbysol.dev'}
          className="me-nav-link"
          onClick={() => trigger('success')}
        >Home</a>
        <span className="me-nav-sep">|</span>
        <a
          href={window.location.hostname === 'localhost' ? '/projects' : 'https://projects.craftedbysol.dev'}
          className="me-nav-link"
          onClick={() => trigger('success')}
        >Projects</a>
        <span className="me-nav-sep">|</span>
        <a href="https://www.linkedin.com/in/andres-sol/" className="me-nav-link" onClick={() => trigger('success')}>Socials</a>
      </nav>
      <h1 className="me-title">Andrés Martinez</h1>
      <div className="me-section">
        <div className="me-section-label">About</div>
        <p className="me-section-text">
          Software engineer based in the US. I build things for the web and beyond,
          from elegant interfaces to scalable backend systems.
        </p>
      </div>
      <hr className="me-divider" />
      <div className="me-section">
        <div className="me-section-label">Links</div>
        <div className="me-links">
          <a href="https://github.com/TheOneWhoBurns" target="_blank" rel="noopener noreferrer" className="me-link" onClick={() => trigger('medium')}>GitHub</a>
          <a href="https://www.linkedin.com/in/andres-sol/" target="_blank" rel="noopener noreferrer" className="me-link" onClick={() => trigger('medium')}>LinkedIn</a>
        </div>
      </div>
    </div>
  )
}

export default Me
