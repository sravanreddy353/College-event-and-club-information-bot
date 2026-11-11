import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import AboutPage from './pages/AboutPage'
import AssistantPage from './pages/AssistantPage'
import AuthPage from './pages/AuthPage'
import ClubsPage from './pages/ClubsPage'
import CompetitionsPage from './pages/CompetitionsPage'
import EventsPage from './pages/EventsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import WorkshopsPage from './pages/WorkshopsPage'
import SiteLayout from './components/SiteLayout'
import './App.css'

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.querySelector(hash)?.scrollIntoView()
      return
    }

    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

function ProtectedAssistant() {
  const { user, loading, authError, reloadUser } = useAuth()

  if (loading) {
    return <main className="auth-page"><div className="auth-loading">Checking your session…</div></main>
  }
  if (authError) {
    return (
      <main className="auth-page">
        <div className="auth-loading">
          <p>{authError}</p>
          <button className="auth-retry" onClick={reloadUser} type="button">Try again</button>
        </div>
      </main>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <AssistantPage />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="clubs" element={<ClubsPage />} />
            <Route path="workshops" element={<WorkshopsPage />} />
            <Route path="competitions" element={<CompetitionsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="assistant" element={<ProtectedAssistant />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage registering />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
