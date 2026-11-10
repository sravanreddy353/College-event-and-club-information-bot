import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AboutPage from './pages/AboutPage'
import AssistantPage from './pages/AssistantPage'
import ClubsPage from './pages/ClubsPage'
import CompetitionsPage from './pages/CompetitionsPage'
import EventsPage from './pages/EventsPage'
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

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="clubs" element={<ClubsPage />} />
          <Route path="workshops" element={<WorkshopsPage />} />
          <Route path="competitions" element={<CompetitionsPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
