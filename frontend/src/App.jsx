import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Monitoring from './pages/Monitoring'
import Recommend from './pages/Recommend'
import Crops from './pages/Crops'
import Weather from './pages/Weather'
import Alerts from './pages/Alerts'
import PredictionHistory from './pages/PredictionHistory'
import Profile from './pages/Profile'
import SettingsPage from './pages/Settings'

function Protected({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Spinner label="Checking session…" />
  return user ? children : <Navigate to="/login" replace state={{ from: loc.pathname }} />
}

function Public({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner label="Checking session…" />
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/register" element={<Public><Register /></Public>} />
      <Route path="/forgot-password" element={<Public><ForgotPassword /></Public>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/recommend" element={<Recommend />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/history" element={<PredictionHistory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
