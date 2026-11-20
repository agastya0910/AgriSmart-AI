import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { Banner, Button, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address')
    if (!form.password) return setError('Enter your password')
    setLoading(true)
    try {
      await login(form.email.trim(), form.password, form.remember)
      nav(loc.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your AgriSmart AI account">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {loc.state?.registered && <Banner type="success">Account created. Please sign in.</Banner>}
        {params.get('expired') && <Banner type="warning">Your session expired. Please sign in again.</Banner>}
        <Banner type="error">{error}</Banner>
        <Input label="Email address" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <div className="relative">
          <Input label="Password" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={set('password')} />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-9 text-slate-400 hover:text-forest" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={form.remember} onChange={set('remember')} className="accent-green-700" /> Remember me (7 days)</label>
          <Link to="/forgot-password" className="font-medium text-green-700 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">New here? <Link to="/register" className="font-semibold text-green-700 hover:underline">Create an account</Link></p>
    </AuthShell>
  )
}
