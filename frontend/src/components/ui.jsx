import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react'

export const Card = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-green-100 bg-white shadow-sm ${className}`}>{children}</div>
)

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-forest">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-green-700">
    <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">{label}</span>
  </div>
)

const TONES = {
  error: ['border-red-200 bg-red-50 text-red-800', AlertTriangle],
  success: ['border-green-200 bg-green-50 text-green-800', CheckCircle2],
  info: ['border-sky-200 bg-sky-50 text-sky-800', Info],
  warning: ['border-amber-200 bg-amber-50 text-amber-800', AlertTriangle],
}
export function Banner({ type = 'info', children, onClose, className = '' }) {
  if (!children) return null
  const [cls, Icon] = TONES[type]
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${cls} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
      {onClose && <button onClick={onClose} aria-label="Dismiss"><X className="h-4 w-4" /></button>}
    </div>
  )
}

export function Button({ variant = 'primary', loading = false, className = '', children, ...props }) {
  const styles = {
    primary: 'bg-forest text-white hover:bg-forest-900 shadow-sm',
    leaf: 'bg-leaf-600 text-white hover:bg-green-700 shadow-sm',
    outline: 'border border-green-300 text-forest hover:bg-green-50',
    danger: 'border border-red-200 text-red-600 hover:bg-red-50',
    ghost: 'text-forest hover:bg-green-50',
  }[variant]
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Input({ label, error, unit, hint, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}{unit && <span className="ml-1 text-xs text-slate-400">({unit})</span>}</span>}
      <input {...props} className={`input ${error ? '!border-red-400 !ring-red-100' : ''}`} />
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export const SimBadge = ({ children = 'SIMULATED' }) => (
  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-800">{children}</span>
)

export function StatCard({ icon: Icon, label, value, sub, tone = 'green' }) {
  const tones = { green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-600', sky: 'bg-sky-100 text-sky-700' }
  return (
    <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`rounded-xl p-3 ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="truncate text-2xl font-bold text-forest">{value}</p>
          {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
        </div>
      </div>
    </Card>
  )
}

export const Empty = ({ text }) => <p className="py-10 text-center text-sm text-slate-400">{text}</p>

export const ChartCard = ({ title, subtitle, children }) => (
  <Card className="p-5">
    <h3 className="font-semibold text-forest">{title}</h3>
    {subtitle && <p className="mb-2 text-xs text-slate-400">{subtitle}</p>}
    <div className="mt-2 h-56">{children}</div>
  </Card>
)
