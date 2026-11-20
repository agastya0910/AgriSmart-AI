import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const KEY = 'agri_token'

// "Remember me" -> localStorage (persists); otherwise sessionStorage (cleared when the tab closes).
// Note: any token in web storage can be read by injected scripts (XSS). Keep dependencies updated and
// consider httpOnly cookies for high-security deployments.
export const tokenStore = {
  get: () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY),
  set: (t, remember) => {
    tokenStore.clear()
    ;(remember ? localStorage : sessionStorage).setItem(KEY, t)
  },
  clear: () => { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) },
}

const api = axios.create({ baseURL: API_URL, timeout: 20000 })

api.interceptors.request.use((cfg) => {
  const t = tokenStore.get()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || ''
    if (err.response?.status === 401 && !url.includes('/auth/login') && tokenStore.get()) {
      tokenStore.clear()
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login?expired=1')
    }
    return Promise.reject(err)
  }
)

export function errMsg(err) {
  if (!err.response) return 'Cannot reach the server. Is the backend running on ' + API_URL + '?'
  const d = err.response.data?.detail
  if (Array.isArray(d)) return d.map((x) => (x.msg || '').replace(/^Value error, /, '') + (x.loc?.length > 1 ? ` (${x.loc[x.loc.length - 1]})` : '')).join('. ')
  return typeof d === 'string' ? d : 'Something went wrong. Please try again.'
}

// Backend sends naive UTC timestamps; treat them as UTC.
export const toDate = (s) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z')
export const fmtDateTime = (s) => toDate(s).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
export const fmtDate = (s) => toDate(s).toLocaleDateString([], { dateStyle: 'medium' })

export default api
