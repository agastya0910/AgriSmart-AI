import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { Banner, Button, Input } from '../components/ui'
import api, { errMsg } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email })
      setMsg(data.message)
    } catch (err) { setError(errMsg(err)) } finally { setLoading(false) }
  }

  return (
    <AuthShell title="Forgot password" subtitle="Password recovery">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Banner type="error">{error}</Banner>
        <Banner type="info">{msg}</Banner>
        <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" loading={loading} className="w-full">Request recovery</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-green-700 hover:underline">Back to sign in</Link></p>
    </AuthShell>
  )
}
