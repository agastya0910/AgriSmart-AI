import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Activity, Bell, BookOpen, CloudSun, History, LayoutDashboard, Leaf, LogOut, Menu, Search, Settings, Sprout, User, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/monitoring', label: 'Farm Monitoring', icon: Activity },
  { to: '/recommend', label: 'Crop Recommendation', icon: Sprout },
  { to: '/crops', label: 'Crop Information', icon: BookOpen },
  { to: '/weather', label: 'Weather Monitoring', icon: CloudSun },
  { to: '/alerts', label: 'Alerts & Notifications', icon: Bell },
  { to: '/history', label: 'Prediction History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    const load = () => api.get('/api/notifications', { params: { unread_only: true } }).then((r) => alive && setUnread(r.data.length)).catch(() => {})
    load()
    const id = setInterval(load, 30000)
    window.addEventListener('agri:alerts-changed', load)
    return () => { alive = false; clearInterval(id); window.removeEventListener('agri:alerts-changed', load) }
  }, [])

  const doLogout = () => { logout(); nav('/login') }
  const search = (e) => { e.preventDefault(); nav(`/crops?q=${encodeURIComponent(q.trim())}`); setOpen(false) }

  const item = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'}`

  return (
    <div className="min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-forest to-forest-900 p-4 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2 text-white"><Leaf className="h-7 w-7 text-green-300" /><span className="text-lg font-bold">AgriSmart AI</span></div>
          <button className="text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={item} onClick={() => setOpen(false)}>
              <Icon className="h-5 w-5" /> {label}
              {to === '/alerts' && unread > 0 && <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <button onClick={doLogout} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-green-100 hover:bg-white/10 hover:text-white">
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-green-100 bg-white/90 px-4 py-3 backdrop-blur">
          <button className="rounded-lg p-2 text-forest hover:bg-green-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <div className="hidden items-center gap-2 text-forest sm:flex"><Leaf className="h-5 w-5 text-leaf-600" /><span className="font-bold">AgriSmart AI</span></div>
          <form onSubmit={search} className="relative mx-auto w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search crops…" className="input !rounded-full !pl-9" aria-label="Search crops" />
          </form>
          <button className="relative rounded-full p-2 text-forest hover:bg-green-50" onClick={() => nav('/alerts')} aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">{unread}</span>}
          </button>
          <button onClick={() => nav('/profile')} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-green-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{user?.full_name?.[0]?.toUpperCase()}</span>
            <span className="hidden text-sm font-medium text-slate-700 md:block">{user?.full_name}</span>
          </button>
          <button onClick={doLogout} className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-green-50 sm:flex"><LogOut className="h-4 w-4" /> Logout</button>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
