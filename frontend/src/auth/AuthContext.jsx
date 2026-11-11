import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './useAuth'
import { apiRequest } from '../lib/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const loadUser = useCallback(async () => {
    try {
      setUser(await apiRequest('/auth/me'))
    } catch (error) {
      if (error instanceof Error && error.status === 401) {
        setUser(null)
      } else {
        setAuthError(error instanceof Error ? error.message : 'Unable to reach the sign-in service.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) loadUser()
    })
    return () => { active = false }
  }, [loadUser])

  const reloadUser = useCallback(() => {
    setLoading(true)
    setAuthError('')
    return loadUser()
  }, [loadUser])

  const value = useMemo(
    () => ({ user, setUser, loading, authError, reloadUser }),
    [user, loading, authError, reloadUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
