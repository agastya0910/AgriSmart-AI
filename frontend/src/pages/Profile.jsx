import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Banner, Button, Card, Input, PageHeader, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import api, { errMsg, fmtDate } from '../services/api'

export default function Profile() {
  const { setUser } = useAuth()
  const [p, setP] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { api.get('/api/profile').then((r) => setP(r.data)).catch((e) => setError(errMsg(e))) }, [])
  if (!p) return error ? <Banner type="error">{error}</Banner> : <Spinner />
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault(); setError(''); setOk('')
    if (p.full_name.trim().length < 2) return setError('Enter your full name')
    setSaving(true)
    try {
      const body = { ...p, farm_size_acres: p.farm_size_acres === '' || p.farm_size_acres == null ? null : Number(p.farm_size_acres) }
      const { data } = await api.put('/api/profile', body)
      setP(data); setUser((u) => ({ ...u, full_name: data.full_name })); setOk('Profile updated.')
    } catch (err) { setError(errMsg(err)) } finally { setSaving(false) }
  }

  return (
    <>
      <PageHeader title="Profile" subtitle={`${p.email} · member since ${fmtDate(p.created_at)}`} />
      <Card className="max-w-2xl p-6">
        <form onSubmit={save} noValidate className="space-y-4">
          <Banner type="error">{error}</Banner><Banner type="success">{ok}</Banner>
          <Input label="Full name" value={p.full_name} onChange={set('full_name')} />
          <Input label="Email" value={p.email} disabled hint="Email cannot be changed" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" value={p.phone || ''} onChange={set('phone')} />
            <Input label="Location (city)" value={p.location || ''} onChange={set('location')} hint="Used for live weather if configured" />
            <Input label="Farm name" value={p.farm_name || ''} onChange={set('farm_name')} />
            <Input label="Farm size" unit="acres" type="number" min="0" step="0.1" value={p.farm_size_acres ?? ''} onChange={set('farm_size_acres')} />
          </div>
          <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">About</span><textarea rows={3} maxLength={1000} className="input" value={p.bio || ''} onChange={set('bio')} /></label>
          <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save changes</Button>
        </form>
      </Card>
    </>
  )
}
