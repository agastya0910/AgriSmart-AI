import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Banner, Button, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../services/api'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ full_name: '', email: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const er = {}
    if (f.full_name.trim().length < 2) er.full_name = 'Enter your full name'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email address'
    if (f.password.length < 8) er.password = 'At least 8 characters'
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) er.password = 'Include at least one letter and one number'
    if (f.password !== f.confirm_password) er.confirm_password = 'Passwords do not match'
    setErrors(er)
    if (Object.keys(er).length) return
    setLoading(true)
    try {
      await register({ ...f, full_name: f.full_name.trim(), email: f.email.trim() })
      nav('/login', { state: { registered: true } })
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start monitoring your farm with AI">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Banner type="error">{error}</Banner>
        <Input label="Full name" value={f.full_name} onChange={set('full_name')} error={errors.full_name} autoComplete="name" />
        <Input label="Email address" type="email" value={f.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <Input label="Password" type="password" value={f.password} onChange={set('password')} error={errors.password} hint="Min 8 characters, with a letter and a number" autoComplete="new-password" />
        <Input label="Confirm password" type="password" value={f.confirm_password} onChange={set('confirm_password')} error={errors.confirm_password} autoComplete="new-password" />
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-green-700 hover:underline">Sign in</Link></p>
    </AuthShell>
  )
}
