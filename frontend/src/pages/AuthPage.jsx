import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { apiRequest } from '../lib/api'

function AuthPage({ registering = false }) {
  const { user, setUser, loading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  if (loading) {
    return <main className="auth-page"><div className="auth-loading">Checking your session…</div></main>
  }
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const path = registering ? '/auth/register' : '/auth/login'
      const body = registering ? { name, email, password } : { email, password }
      setUser(await apiRequest(path, { method: 'POST', body: JSON.stringify(body) }))
      navigate('/', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" to="/" aria-label="Student Friendly Assistant home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>Student Friendly Assistant</span>
        </Link>
        <div className="auth-intro">
          <span className="eyebrow section-eyebrow">YOUR CAMPUS, YOUR SPACE</span>
          <h1 id="auth-title">{registering ? 'Create your account' : 'Welcome back'}</h1>
          <p>{registering
            ? 'Sign up to start asking questions and keep your conversations in one place.'
            : 'Sign in to continue your campus conversations.'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {registering && (
            <label>
              <span>Name</span>
              <input
                autoComplete="name"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
                value={name}
              />
            </label>
          )}
          <label>
            <span>Email address</span>
            <input
              autoComplete="email"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>Password</span>
            <span className="password-input-wrap">
              <input
                autoComplete={registering ? 'new-password' : 'current-password'}
                maxLength={128}
                minLength={registering ? 8 : undefined}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={registering ? 'At least 8 characters' : 'Enter your password'}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
          {!registering && (
            <div className="auth-form-options">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {registering ? 'Already have an account?' : 'New to Student Friendly Assistant?'}{' '}
          <Link to={registering ? '/login' : '/register'}>
            {registering ? 'Sign in' : 'Create account'}
          </Link>
        </p>
        <p className="auth-footnote">
          Passwords are securely hashed. Google sign-in and email verification are not configured.
        </p>
      </section>
    </main>
  )
}

export default AuthPage
