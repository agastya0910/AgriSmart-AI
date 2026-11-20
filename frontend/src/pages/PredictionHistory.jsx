import { useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Banner, Card, Empty, PageHeader, Spinner } from '../components/ui'
import api, { errMsg, fmtDateTime } from '../services/api'

export default function PredictionHistory() {
  const [rows, setRows] = useState(null)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(() => {
    const params = {}
    if (search.trim()) params.search = search.trim()
    if (from) params.date_from = from
    if (to) params.date_to = to
    return api.get('/api/recommendations/history', { params }).then((r) => setRows(r.data)).catch((e) => setError(errMsg(e)))
  }, [search, from, to])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  const del = async (id) => {
    if (!window.confirm('Delete this prediction?')) return
    try { await api.delete(`/api/recommendations/${id}`); load() } catch (e) { setError(errMsg(e)) }
  }

  return (
    <>
      <PageHeader title="Prediction History" subtitle="Your previous crop recommendations (private to your account)" />
      <Banner type="error" className="mb-4" onClose={() => setError('')}>{error}</Banner>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Search crop</span><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. rice" /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">From</span><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">To</span><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        {(search || from || to) && <button className="pb-2.5 text-sm font-medium text-green-700 hover:underline" onClick={() => { setSearch(''); setFrom(''); setTo('') }}>Clear filters</button>}
      </div>
      {!rows ? <Spinner /> : (
        <Card className="overflow-x-auto p-5">
          {rows.length === 0 ? <Empty text="No predictions found" /> : (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="border-b border-green-100 text-xs uppercase text-slate-400">{['Date', 'Crop', 'Confidence', 'N', 'P', 'K', 'Temp', 'Hum.', 'pH', 'Rain', ''].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id} className="border-b border-green-50 hover:bg-green-50/50">
                  <td className="whitespace-nowrap px-2 py-2">{fmtDateTime(r.created_at)}</td>
                  <td className="px-2 font-semibold text-forest">{r.crop_name}</td>
                  <td className="px-2">{Math.round(r.confidence * 100)}%</td>
                  <td className="px-2">{r.inputs.nitrogen}</td><td className="px-2">{r.inputs.phosphorus}</td><td className="px-2">{r.inputs.potassium}</td>
                  <td className="px-2">{r.inputs.temperature}°C</td><td className="px-2">{r.inputs.humidity}%</td><td className="px-2">{r.inputs.ph}</td><td className="px-2">{r.inputs.rainfall}</td>
                  <td className="px-2"><button onClick={() => del(r.id)} className="text-slate-400 hover:text-red-600" aria-label="Delete prediction"><Trash2 className="h-4 w-4" /></button></td>
                </tr>))}</tbody>
            </table>
          )}
        </Card>
      )}
    </>
  )
}
