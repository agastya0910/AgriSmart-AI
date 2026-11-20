import { useCallback, useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RefreshCw, Save, Trash2 } from 'lucide-react'
import { Banner, Button, Card, Empty, Input, PageHeader, SimBadge, Spinner } from '../components/ui'
import api, { errMsg, fmtDateTime } from '../services/api'
import { ENV_FIELDS, MOISTURE_FIELD, SOIL_FIELDS, toNumbers, validate } from '../services/fields'

const ALL = [...SOIL_FIELDS, MOISTURE_FIELD, ...ENV_FIELDS]
const EMPTY = Object.fromEntries(ALL.map((f) => [f.key, '']))

function flags(r, p) {
  if (!r || !p) return {}
  return {
    soil_moisture: r.soil_moisture < p.min_soil_moisture ? `Below your minimum (${p.min_soil_moisture}%)` : null,
    temperature: r.temperature > p.max_temperature ? `Above your limit (${p.max_temperature}°C)` : null,
    ph: r.ph < p.min_ph || r.ph > p.max_ph ? `Outside your range (${p.min_ph}–${p.max_ph})` : null,
  }
}

export default function Monitoring() {
  const [profile, setProfile] = useState(null)
  const [rows, setRows] = useState(null)
  const [farm, setFarm] = useState('')
  const [vals, setVals] = useState(EMPTY)
  const [simulated, setSimulated] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => api.get('/api/monitoring', { params: { limit: 100 } }).then((r) => setRows(r.data)).catch((e) => setError(errMsg(e))), [])
  useEffect(() => {
    load()
    api.get('/api/profile').then((r) => { setProfile(r.data); setFarm((f) => f || r.data.farm_name || 'My Farm') }).catch(() => {})
  }, [load])

  const edit = (k) => (e) => { setVals({ ...vals, [k]: e.target.value }); setSimulated(false) }

  const simulate = async () => {
    setError(''); setOk('')
    try {
      const { data } = await api.get('/api/monitoring/simulate')
      const { is_simulated, ...v } = data
      setVals(Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x)])))
      setSimulated(true); setErrors({})
    } catch (e) { setError(errMsg(e)) }
  }

  const save = async (e) => {
    e.preventDefault()
    setError(''); setOk('')
    const er = validate(ALL, vals)
    if (!farm.trim()) er.farm = 'Required'
    setErrors(er)
    if (Object.keys(er).length) return
    setSaving(true)
    try {
      await api.post('/api/monitoring', { farm_name: farm.trim(), ...toNumbers(ALL, vals), is_simulated: simulated })
      setOk('Reading saved.'); setVals(EMPTY); setSimulated(false)
      await load()
      window.dispatchEvent(new Event('agri:alerts-changed'))
    } catch (err) { setError(errMsg(err)) } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!window.confirm('Delete this record?')) return
    try { await api.delete(`/api/monitoring/${id}`); load() } catch (e) { setError(errMsg(e)) }
  }

  if (!rows) return <Spinner />
  const latest = rows[0]
  const fl = flags(latest, profile)
  const chart = [...rows].slice(0, 30).reverse().map((r) => ({ ...r, label: fmtDateTime(r.recorded_at).replace(/, \d{4}/, '') }))

  const Field = (f) => <Input key={f.key} label={f.label} unit={f.unit} type="number" step={f.step} min={f.min} max={f.max} value={vals[f.key]} onChange={edit(f.key)} error={errors[f.key]} />

  return (
    <>
      <PageHeader title="Farm Monitoring" subtitle="Record soil and environmental readings. Architecture is ready for future IoT sensors.">
        <Button variant="outline" onClick={simulate}><RefreshCw className="h-4 w-4" /> Generate simulated reading</Button>
      </PageHeader>
      <Banner type="error" className="mb-4">{error}</Banner>
      <Banner type="success" className="mb-4" onClose={() => setOk('')}>{ok}</Banner>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-forest">New reading</h2>{simulated && <SimBadge>SIMULATED VALUES</SimBadge>}</div>
          <form onSubmit={save} noValidate className="space-y-5">
            <Input label="Farm / field name" value={farm} onChange={(e) => setFarm(e.target.value)} error={errors.farm} maxLength={100} />
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Soil</p><div className="grid gap-4 sm:grid-cols-3">{[...SOIL_FIELDS, MOISTURE_FIELD].map(Field)}</div></div>
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Environment</p><div className="grid gap-4 sm:grid-cols-3">{ENV_FIELDS.map(Field)}</div></div>
            <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save reading</Button>
          </form>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-forest">Current readings</h2>{latest?.is_simulated && <SimBadge />}</div>
          {latest ? (
            <>
              <p className="text-xs text-slate-400">{latest.farm_name} · {fmtDateTime(latest.recorded_at)}</p>
              <ul className="mt-3 space-y-2">
                {[['Nitrogen', latest.nitrogen, 'mg/kg'], ['Phosphorus', latest.phosphorus, 'mg/kg'], ['Potassium', latest.potassium, 'mg/kg'], ['Soil pH', latest.ph, '', 'ph'], ['Soil moisture', latest.soil_moisture, '%', 'soil_moisture'], ['Temperature', latest.temperature, '°C', 'temperature'], ['Humidity', latest.humidity, '%'], ['Rainfall', latest.rainfall, 'mm']].map(([l, v, u, key]) => (
                  <li key={l} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{l}</span>
                    <span className={`rounded-full px-2.5 py-0.5 font-semibold ${key && fl[key] ? 'bg-red-100 text-red-700' : 'bg-green-50 text-forest'}`} title={key && fl[key] ? fl[key] : 'Within your thresholds'}>{v} {u}</span>
                  </li>
                ))}
              </ul>
              {Object.values(fl).some(Boolean) ? <Banner type="warning" className="mt-4">{Object.values(fl).filter(Boolean).join(' · ')}</Banner> : <p className="mt-4 text-xs text-green-700">All monitored values are within your configured thresholds.</p>}
            </>
          ) : <Empty text="No readings saved yet" />}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[['Soil nutrients (N, P, K) & moisture', [['nitrogen', '#166534'], ['phosphorus', '#22c55e'], ['potassium', '#f59e0b'], ['soil_moisture', '#0ea5e9']]], ['Environment', [['temperature', '#ef4444'], ['humidity', '#0ea5e9'], ['rainfall', '#22c55e'], ['ph', '#8b5cf6']]]].map(([title, lines]) => (
          <Card key={title} className="p-5"><h3 className="font-semibold text-forest">{title}</h3>
            <div className="mt-3 h-64">{chart.length ? (
              <ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#e2f0e5" /><XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />{lines.map(([k, c]) => <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={{ r: 2 }} />)}</LineChart></ResponsiveContainer>
            ) : <Empty text="No data" />}</div></Card>
        ))}
      </div>

      <Card className="mt-6 overflow-x-auto p-5">
        <h3 className="mb-3 font-semibold text-forest">Historical monitoring data</h3>
        {rows.length ? (
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead><tr className="border-b border-green-100 text-xs uppercase text-slate-400">{['Date', 'Farm', 'N', 'P', 'K', 'pH', 'Moist.', 'Temp', 'Hum.', 'Rain', 'Source', ''].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b border-green-50 hover:bg-green-50/50">
                <td className="px-2 py-2 whitespace-nowrap">{fmtDateTime(r.recorded_at)}</td><td className="px-2">{r.farm_name}</td>
                <td className="px-2">{r.nitrogen}</td><td className="px-2">{r.phosphorus}</td><td className="px-2">{r.potassium}</td><td className="px-2">{r.ph}</td>
                <td className="px-2">{r.soil_moisture}%</td><td className="px-2">{r.temperature}°C</td><td className="px-2">{r.humidity}%</td><td className="px-2">{r.rainfall}</td>
                <td className="px-2">{r.is_simulated ? <SimBadge /> : <span className="text-xs text-slate-500">manual</span>}</td>
                <td className="px-2"><button onClick={() => del(r.id)} className="text-slate-400 hover:text-red-600" aria-label="Delete record"><Trash2 className="h-4 w-4" /></button></td>
              </tr>))}</tbody>
          </table>
        ) : <Empty text="No history yet" />}
      </Card>
    </>
  )
}
