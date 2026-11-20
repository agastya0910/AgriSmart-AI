import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api, { tokenStore } from '../services/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    if (!tokenStore.get()) { setLoading(false); return }
    api.get('/api/auth/me')
      .then((r) => alive && setUser(r.data))
      .catch(() => tokenStore.clear())
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const login = useCallback(async (email, password, remember) => {
    const { data } = await api.post('/api/auth/login', { email, password, remember })
    tokenStore.set(data.access_token, remember)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback((payload) => api.post('/api/auth/register', payload), [])

  const logout = useCallback(() => { tokenStore.clear(); setUser(null) }, [])

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>
}
