import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Droplets, Sprout, Thermometer, Tractor } from 'lucide-react'
import { Banner, Card, ChartCard, Empty, PageHeader, SimBadge, Spinner, StatCard } from '../components/ui'
import api, { errMsg, fmtDateTime } from '../services/api'

const COLORS = ['#166534', '#22c55e', '#86efac', '#0ea5e9', '#f59e0b', '#a3e635', '#14b8a6', '#84cc16']
const SEV = { critical: 'bg-red-100 text-red-700', warning: 'bg-amber-100 text-amber-700', info: 'bg-sky-100 text-sky-700' }

function Trend({ data, k, color, unit }) {
  if (!data.length) return <Empty text="No readings yet" />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2f0e5" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} unit={unit} />
        <Tooltip />
        <Line type="monotone" dataKey={k} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [charts, setCharts] = useState(null)
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/api/dashboard/stats'), api.get('/api/dashboard/charts'), api.get('/api/weather')])
      .then(([s, c, w]) => { setStats(s.data); setCharts(c.data); setWeather(w.data) })
      .catch((e) => setError(errMsg(e)))
  }, [])

  if (error) return <Banner type="error">{error}</Banner>
  if (!stats) return <Spinner />
  const trends = charts.trends
  const hasSim = trends.some((t) => t.simulated)
  const lr = stats.latest_recommendation

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your farm monitoring and recommendations" />
      {stats.monitoring_count === 0 && (
        <Banner type="info" className="mb-4">No readings yet. <Link to="/monitoring" className="font-semibold underline">Add your first monitoring record</Link> to populate the charts.</Banner>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Tractor} label="Total farms" value={stats.total_farms} />
        <StatCard icon={Droplets} tone="sky" label="Avg soil moisture" value={stats.avg_soil_moisture == null ? '—' : `${stats.avg_soil_moisture}%`} sub="last 30 readings" />
        <StatCard icon={Thermometer} tone="amber" label="Avg temperature" value={stats.avg_temperature == null ? '—' : `${stats.avg_temperature}°C`} sub="last 30 readings" />
        <StatCard icon={AlertTriangle} tone={stats.active_alerts ? 'red' : 'green'} label="Active alerts" value={stats.active_alerts} sub="unread" />
        <StatCard icon={Sprout} label="Latest recommendation" value={lr ? lr.crop : '—'} sub={lr ? `${Math.round(lr.confidence * 100)}% confidence` : 'none yet'} />
      </div>
      {hasSim && <p className="mt-3 text-xs text-slate-500"><SimBadge /> Some charted readings were marked as simulated when saved.</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Temperature trend" subtitle="°C, last 20 readings"><Trend data={trends} k="temperature" color="#f59e0b" unit="°" /></ChartCard>
        <ChartCard title="Humidity trend" subtitle="%, last 20 readings"><Trend data={trends} k="humidity" color="#0ea5e9" unit="%" /></ChartCard>
        <ChartCard title="Soil moisture trend" subtitle="%, last 20 readings"><Trend data={trends} k="soil_moisture" color="#166534" unit="%" /></ChartCard>
        <ChartCard title="Crop recommendation distribution" subtitle="Your predictions by crop">
          {charts.crop_distribution.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.crop_distribution} dataKey="count" nameKey="crop" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {charts.crop_distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty text="No recommendations yet" />}
        </ChartCard>
        <ChartCard title="Rainfall statistics" subtitle="mm, last 20 readings">
          {trends.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2f0e5" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="rainfall" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty text="No readings yet" />}
        </ChartCard>
        <Card className="p-5">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-forest">Weather overview</h3>{weather.is_simulated && <SimBadge />}</div>
          <p className="text-xs text-slate-400">{weather.location}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            {[['Temp', `${weather.current.temperature}°C`], ['Humidity', `${weather.current.humidity}%`], ['Rainfall', `${weather.current.rainfall} mm`], ['Condition', weather.current.condition]].map(([a, b]) => (
              <div key={a} className="rounded-xl bg-green-50 p-3"><p className="text-xs text-slate-500">{a}</p><p className="font-bold text-forest">{b}</p></div>
            ))}
          </div>
          <Link to="/weather" className="mt-3 block text-sm font-medium text-green-700 hover:underline">Full forecast →</Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-forest">Recent monitoring activities</h3>
          {stats.recent_activities.length ? <ul className="space-y-3">{stats.recent_activities.map((a, i) => (
            <li key={i} className="flex items-start gap-3 text-sm"><span className={`mt-1.5 h-2 w-2 rounded-full ${a.type === 'monitoring' ? 'bg-sky-500' : 'bg-green-600'}`} /><div><p>{a.text}</p><p className="text-xs text-slate-400">{fmtDateTime(a.at)}</p></div></li>
          ))}</ul> : <Empty text="No activity yet" />}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-forest">Latest crop recommendations</h3>
          {stats.latest_recommendations.length ? <ul className="divide-y divide-green-50">{stats.latest_recommendations.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm"><span className="font-medium">{r.crop}</span><span className="text-xs text-slate-400">{Math.round(r.confidence * 100)}% · {fmtDateTime(r.created_at)}</span></li>
          ))}</ul> : <Empty text="Run your first recommendation" />}
          <Link to="/recommend" className="mt-2 block text-sm font-medium text-green-700 hover:underline">New recommendation →</Link>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-forest">Alerts & notifications</h3>
          {stats.recent_alerts.length ? <ul className="space-y-2">{stats.recent_alerts.map((a) => (
            <li key={a.id} className="rounded-xl border border-green-50 p-3 text-sm"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${SEV[a.severity]}`}>{a.severity}</span><b className={a.is_read ? 'font-medium text-slate-500' : ''}>{a.title}</b></div><p className="mt-1 text-xs text-slate-500">{a.message}</p></li>
          ))}</ul> : <Empty text="No alerts" />}
          <Link to="/alerts" className="mt-2 block text-sm font-medium text-green-700 hover:underline">All alerts →</Link>
        </Card>
      </div>
    </>
  )
}
