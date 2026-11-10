import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4.2 10h11.6M10 4.2l5.8 5.8-5.8 5.8" />
    </svg>
  )
}

function Brand({ footer = false, onClick }) {
  return (
    <Link
      className={`brand${footer ? ' footer-brand' : ''}`}
      to="/"
      onClick={onClick}
      aria-label="Student Friendly Assistant home"
    >
      <span className="brand-mark" aria-hidden="true">
        <span /><span /><span /><span />
      </span>
      <span>Student Friendly Assistant</span>
    </Link>
  )
}

function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <Brand onClick={closeMenu} />
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
        <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <NavLink to="/events" onClick={closeMenu}>Events</NavLink>
          <NavLink to="/clubs" onClick={closeMenu}>Clubs</NavLink>
          <NavLink to="/workshops" onClick={closeMenu}>Workshops</NavLink>
          <NavLink to="/competitions" onClick={closeMenu}>Competitions</NavLink>
          <NavLink to="/about" onClick={closeMenu}>About</NavLink>
          <Link className="nav-cta" to="/assistant" onClick={closeMenu}>
            Ask Student Friendly Assistant <ArrowIcon />
          </Link>
        </nav>
      </header>

      <main id="home"><Outlet /></main>

      <footer className="site-footer">
        <Brand footer />
        <span>Made for campus life. All the good stuff, in one place.</span>
        <Link to="/">Back to top ↑</Link>
      </footer>
    </div>
  )
}

export default SiteLayout
