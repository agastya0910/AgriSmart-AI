import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Droplets, Leaf, Search, Sun, Thermometer } from 'lucide-react'
import { Banner, Card, Empty, Input, PageHeader, Spinner } from '../components/ui'
import api, { errMsg } from '../services/api'

const SEASONS = ['All', 'Kharif', 'Rabi', 'Summer', 'Perennial', 'Year-round']
const LABEL = { N: 'Nitrogen', P: 'Phosphorus', K: 'Potassium', temperature: 'Temp (°C)', humidity: 'Humidity (%)', ph: 'pH', rainfall: 'Rainfall (mm)' }

export default function Crops() {
  const [params, setParams] = useSearchParams()
  const [crops, setCrops] = useState(null)
  const [error, setError] = useState('')
  const [season, setSeason] = useState('All')
  const [open, setOpen] = useState(null)
  const q = params.get('q') || ''

  useEffect(() => { api.get('/api/crops').then((r) => setCrops(r.data)).catch((e) => setError(errMsg(e))) }, [])

  const list = useMemo(() => (crops || []).filter((c) => {
    const s = q.toLowerCase()
    const okQ = !s || [c.name, c.soil, c.info].some((t) => t.toLowerCase().includes(s))
    const okS = season === 'All' || c.season.toLowerCase().includes(season.toLowerCase())
    return okQ && okS
  }), [crops, q, season])

  if (error) return <Banner type="error">{error}</Banner>
  if (!crops) return <Spinner />

  return (
    <>
      <PageHeader title="Crop Information" subtitle={`${crops.length} crops supported by the recommendation model`} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-9" placeholder="Search crops…" value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} aria-label="Search crops" /></div>
        <div className="flex flex-wrap gap-2">{SEASONS.map((s) => (
          <button key={s} onClick={() => setSeason(s)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${season === s ? 'bg-forest text-white' : 'bg-white text-forest ring-1 ring-green-200 hover:bg-green-50'}`}>{s}</button>
        ))}</div>
      </div>
      {list.length === 0 ? <Empty text="No crops match your search" /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id} className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3"><div className="rounded-xl bg-green-100 p-2.5 text-green-700"><Leaf className="h-5 w-5" /></div><h3 className="text-lg font-bold text-forest">{c.name}</h3></div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex gap-2"><Leaf className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /><span><b>Soil:</b> {c.soil}</span></li>
                <li className="flex gap-2"><Thermometer className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span><b>Temperature:</b> {c.temperature}</span></li>
                <li className="flex gap-2"><Droplets className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" /><span><b>Water:</b> {c.water}</span></li>
                <li className="flex gap-2"><Sun className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" /><span><b>Season:</b> {c.season}</span></li>
              </ul>
              <p className="mt-3 text-sm text-slate-500">{c.info}</p>
              <button onClick={() => setOpen(open === c.id ? null : c.id)} className="mt-3 text-sm font-semibold text-green-700 hover:underline">{open === c.id ? 'Hide' : 'Show'} model data ranges</button>
              {open === c.id && (
                <div className="mt-2 rounded-xl bg-green-50 p-3 text-xs">
                  <p className="mb-1 text-slate-500">Approximate ranges used to build the development dataset (not agronomic recommendations):</p>
                  <ul className="grid grid-cols-2 gap-x-3">{Object.entries(c.typical_ranges).map(([k, v]) => <li key={k}>{LABEL[k]}: <b>{v.min}–{v.max}</b></li>)}</ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
