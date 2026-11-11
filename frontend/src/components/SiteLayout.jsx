import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { apiRequest } from '../lib/api'

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
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  function closeMenu() {
    setMenuOpen(false)
  }

  async function handleLogout() {
    setLogoutError('')
    setLoggingOut(true)
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
      setUser(null)
      closeMenu()
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof Error && error.status === 401) {
        setUser(null)
        navigate('/', { replace: true })
      } else {
        setLogoutError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
      }
    } finally {
      setLoggingOut(false)
    }
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
        {user && (
          <div className="site-account">
            <span className="site-account-avatar" aria-hidden="true">
              {user.name?.trim().charAt(0).toUpperCase() || 'S'}
            </span>
            <span className="site-account-details">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <button
              aria-label="Sign out"
              className="site-account-logout"
              disabled={loggingOut}
              onClick={handleLogout}
              title={logoutError || 'Sign out'}
              type="button"
            >
              <span aria-hidden="true">↪</span>
              <span>Sign out</span>
            </button>
          </div>
        )}
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
