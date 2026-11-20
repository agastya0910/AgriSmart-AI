import { useCallback, useEffect, useState } from 'react'
import { Check, CheckCheck, Trash2 } from 'lucide-react'
import { Banner, Button, Card, Empty, PageHeader, Spinner } from '../components/ui'
import api, { errMsg, fmtDateTime } from '../services/api'

const SEV = { critical: 'border-red-200 bg-red-50', warning: 'border-amber-200 bg-amber-50', info: 'border-sky-200 bg-sky-50' }
const BADGE = { critical: 'bg-red-600', warning: 'bg-amber-500', info: 'bg-sky-500' }

export default function Alerts() {
  const [items, setItems] = useState(null)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  const load = useCallback(() => api.get('/api/notifications').then((r) => setItems(r.data)).catch((e) => setError(errMsg(e))), [])
  useEffect(() => { load() }, [load])
  const changed = () => window.dispatchEvent(new Event('agri:alerts-changed'))

  const act = async (fn) => { try { await fn(); await load(); changed() } catch (e) { setError(errMsg(e)) } }
  if (!items) return error ? <Banner type="error">{error}</Banner> : <Spinner />
  const shown = items.filter((n) => (filter === 'unread' ? !n.is_read : filter === 'read' ? n.is_read : true))
  const unread = items.filter((n) => !n.is_read).length

  return (
    <>
      <PageHeader title="Alerts & Notifications" subtitle={`${unread} unread · ${items.length} total (alert history)`}>
        <Button variant="outline" onClick={() => act(() => api.patch('/api/notifications/read-all'))} disabled={!unread}><CheckCheck className="h-4 w-4" /> Mark all read</Button>
      </PageHeader>
      <Banner type="error" className="mb-4" onClose={() => setError('')}>{error}</Banner>
      <div className="mb-4 flex gap-2">{['all', 'unread', 'read'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${filter === f ? 'bg-forest text-white' : 'bg-white text-forest ring-1 ring-green-200 hover:bg-green-50'}`}>{f}</button>)}</div>
      {shown.length === 0 ? <Card><Empty text="No notifications here. Alerts appear when saved readings cross your thresholds (Settings)." /></Card> : (
        <div className="space-y-3">{shown.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 rounded-2xl border p-4 ${n.is_read ? 'border-green-100 bg-white opacity-75' : SEV[n.severity]}`}>
            <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white ${BADGE[n.severity]}`}>{n.severity}</span>
            <div className="flex-1"><p className="font-semibold text-slate-800">{n.title}</p><p className="text-sm text-slate-600">{n.message}</p><p className="mt-1 text-xs text-slate-400">{fmtDateTime(n.created_at)}</p></div>
            {!n.is_read && <button title="Mark as read" onClick={() => act(() => api.patch(`/api/notifications/${n.id}/read`))} className="rounded-lg p-2 text-green-700 hover:bg-white" aria-label="Mark as read"><Check className="h-4 w-4" /></button>}
            <button title="Delete" onClick={() => act(() => api.delete(`/api/notifications/${n.id}`))} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}</div>
      )}
    </>
  )
}
