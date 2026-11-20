import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Banner, Button, Card, Input, PageHeader, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import api, { errMsg } from '../services/api'

export default function Settings() {
  const { logout } = useAuth()
  const nav = useNavigate()
  const [p, setP] = useState(null)
  const [model, setModel] = useState(null)
  const [t, setT] = useState({ ok: '', err: '', saving: false })
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwS, setPwS] = useState({ ok: '', err: '', saving: false })

  useEffect(() => {
    api.get('/api/profile').then((r) => setP(r.data)).catch((e) => setT((s) => ({ ...s, err: errMsg(e) })))
    api.get('/api/recommendations/model-info').then((r) => setModel(r.data)).catch(() => {})
  }, [])
  if (!p) return <Spinner />

  const saveThresholds = async (e) => {
    e.preventDefault()
    const n = ['min_soil_moisture', 'max_temperature', 'min_ph', 'max_ph'].map((k) => Number(p[k]))
    if (n.some(Number.isNaN)) return setT({ ok: '', err: 'All thresholds must be numbers', saving: false })
    if (n[2] >= n[3]) return setT({ ok: '', err: 'Minimum pH must be lower than maximum pH', saving: false })
    setT({ ok: '', err: '', saving: true })
    try {
      const { data } = await api.put('/api/profile', { ...p, min_soil_moisture: n[0], max_temperature: n[1], min_ph: n[2], max_ph: n[3] })
      setP(data); setT({ ok: 'Thresholds saved.', err: '', saving: false })
    } catch (err) { setT({ ok: '', err: errMsg(err), saving: false }) }
  }

  const changePw = async (e) => {
    e.preventDefault()
    if (pw.new_password !== pw.confirm_password) return setPwS({ ok: '', err: 'New passwords do not match', saving: false })
    setPwS({ ok: '', err: '', saving: true })
    try {
      await api.post('/api/auth/change-password', pw)
      setPw({ current_password: '', new_password: '', confirm_password: '' })
      setPwS({ ok: 'Password changed.', err: '', saving: false })
    } catch (err) { setPwS({ ok: '', err: errMsg(err), saving: false }) }
  }

  const set = (k) => (e) => setP({ ...p, [k]: e.target.value })

  return (
    <>
      <PageHeader title="Settings" subtitle="Alert thresholds, password and account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-forest">Alert thresholds</h2>
          <p className="mb-4 text-xs text-slate-500">Defaults are generic starting points. Different crops need different limits, so set values appropriate to what you grow.</p>
          <form onSubmit={saveThresholds} noValidate className="space-y-4">
            <Banner type="error">{t.err}</Banner><Banner type="success">{t.ok}</Banner>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Minimum soil moisture" unit="%" type="number" step="0.1" value={p.min_soil_moisture} onChange={set('min_soil_moisture')} />
              <Input label="Maximum temperature" unit="°C" type="number" step="0.1" value={p.max_temperature} onChange={set('max_temperature')} />
              <Input label="Minimum soil pH" type="number" step="0.1" value={p.min_ph} onChange={set('min_ph')} />
              <Input label="Maximum soil pH" type="number" step="0.1" value={p.max_ph} onChange={set('max_ph')} />
            </div>
            <Button type="submit" loading={t.saving}>Save thresholds</Button>
          </form>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold text-forest">Change password</h2>
          <form onSubmit={changePw} noValidate className="space-y-4">
            <Banner type="error">{pwS.err}</Banner><Banner type="success">{pwS.ok}</Banner>
            <Input label="Current password" type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
            <Input label="New password" type="password" autoComplete="new-password" hint="Min 8 characters, with a letter and a number" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm_password} onChange={(e) => setPw({ ...pw, confirm_password: e.target.value })} />
            <Button type="submit" loading={pwS.saving}>Update password</Button>
          </form>
        </Card>
        <Card className="p-6">
          <h2 className="mb-3 font-semibold text-forest">About the AI model</h2>
          {model ? (
            <div className="space-y-2 text-sm text-slate-600">
              <p>{model.algorithm} · {model.rows} training rows · {model.classes.length} crops</p>
              <p>Dataset: <b>{model.dataset_kind}</b> ({model.dataset_file}) · hold-out accuracy {(model.holdout_accuracy * 100).toFixed(1)}%</p>
              <Banner type={model.dataset_kind === 'synthetic' ? 'warning' : 'info'}>{model.disclaimer}</Banner>
            </div>
          ) : <Spinner />}
        </Card>
        <Card className="p-6">
          <h2 className="mb-3 font-semibold text-forest">Account</h2>
          <Button variant="danger" onClick={() => { logout(); nav('/login') }}><LogOut className="h-4 w-4" /> Log out</Button>
        </Card>
      </div>
    </>
  )
}
