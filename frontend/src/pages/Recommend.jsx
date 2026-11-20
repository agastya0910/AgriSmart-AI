import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Sprout } from 'lucide-react'
import { Banner, Button, Card, Input, PageHeader } from '../components/ui'
import api, { errMsg } from '../services/api'
import { ENV_FIELDS, SOIL_FIELDS, toNumbers, validate } from '../services/fields'

const FIELDS = [...SOIL_FIELDS, ...ENV_FIELDS]
const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.key, '']))

export default function Recommend() {
  const [vals, setVals] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState(null)

  const fillLatest = async () => {
    setError('')
    try {
      const { data: r } = await api.get('/api/monitoring/latest')
      setVals({ nitrogen: r.nitrogen, phosphorus: r.phosphorus, potassium: r.potassium, ph: r.ph, temperature: r.temperature, humidity: r.humidity, rainfall: r.rainfall })
    } catch (e) { setError(e.response?.status === 404 ? 'No monitoring records yet. Add one in Farm Monitoring first.' : errMsg(e)) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const er = validate(FIELDS, vals)
    setErrors(er)
    if (Object.keys(er).length) return
    setLoading(true)
    try {
      const { data } = await api.post('/api/recommendations/predict', toNumbers(FIELDS, vals))
      setRes(data)
    } catch (err) { setError(errMsg(err)) } finally { setLoading(false) }
  }

  const Field = (f) => <Input key={f.key} label={f.label} unit={f.unit} type="number" step={f.step} min={f.min} max={f.max} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} error={errors[f.key]} />

  return (
    <>
      <PageHeader title="AI Crop Recommendation" subtitle="A Random Forest model suggests the most suitable crop for your conditions">
        <Button variant="outline" onClick={fillLatest}><Download className="h-4 w-4" /> Use latest monitoring reading</Button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <form onSubmit={submit} noValidate className="space-y-4">
            <Banner type="error">{error}</Banner>
            {FIELDS.map(Field)}
            <Button type="submit" loading={loading} className="w-full"><Sprout className="h-4 w-4" /> Recommend Crop</Button>
          </form>
        </Card>
        <div className="space-y-4 lg:col-span-3">
          {!res ? (
            <Card className="flex h-full min-h-64 flex-col items-center justify-center p-8 text-center text-slate-400"><Sprout className="mb-3 h-10 w-10 text-green-300" />Enter your soil and weather values, then click “Recommend Crop”.</Card>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-forest to-forest-700 p-6 text-white">
                <p className="text-sm text-green-200">Recommended crop</p>
                <h2 className="mt-1 text-4xl font-bold">{res.crop_name}</h2>
                <p className="mt-2 text-green-100">Model confidence: <b>{Math.round(res.confidence * 100)}%</b> <span className="text-xs">(share of tree votes, not a guarantee)</span></p>
                <p className="mt-3 text-xs text-green-200">Saved to your <Link to="/history" className="underline">prediction history</Link>.</p>
              </Card>
              <Card className="p-5">
                <h3 className="mb-3 font-semibold text-forest">Top 3 predictions</h3>
                {res.top_predictions.map((t, i) => (
                  <div key={t.crop} className="mb-3 last:mb-0">
                    <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{i + 1}. {t.name}</span><span className="text-slate-500">{(t.probability * 100).toFixed(1)}%</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-green-100"><div className="h-full rounded-full bg-leaf-600" style={{ width: `${Math.max(t.probability * 100, 1)}%` }} /></div>
                  </div>
                ))}
              </Card>
              <Card className="p-5">
                <h3 className="mb-3 font-semibold text-forest">Growing information — {res.crop_info.name}</h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {[['Soil', res.crop_info.soil], ['Temperature', res.crop_info.temperature], ['Water', res.crop_info.water], ['Season', res.crop_info.season]].map(([a, b]) => <div key={a} className="rounded-xl bg-green-50 p-3"><dt className="text-xs font-semibold uppercase text-slate-400">{a}</dt><dd className="mt-0.5">{b}</dd></div>)}
                </dl>
                <p className="mt-3 text-sm text-slate-600">{res.crop_info.info}</p>
              </Card>
              <Banner type={res.model.dataset_kind === 'synthetic' ? 'warning' : 'info'}>{res.model.disclaimer}</Banner>
            </>
          )}
        </div>
      </div>
    </>
  )
}
