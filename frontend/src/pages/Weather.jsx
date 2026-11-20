import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CloudRain, Droplets, Thermometer, Wind } from 'lucide-react'
import { Banner, Button, Card, ChartCard, Input, PageHeader, SimBadge, Spinner, StatCard } from '../components/ui'
import api, { errMsg } from '../services/api'

export default function Weather() {
  const [data, setData] = useState(null)
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (loc) => {
    setLoading(true); setError('')
    try { const { data } = await api.get('/api/weather', { params: loc ? { location: loc } : {} }); setData(data) }
    catch (e) { setError(errMsg(e)) } finally { setLoading(false) }
    window.dispatchEvent(new Event('agri:alerts-changed'))
  }, [])
  useEffect(() => { load() }, [load])

  if (!data) return error ? <Banner type="error">{error}</Banner> : <Spinner />
  const c = data.current

  return (
    <>
      <PageHeader title="Weather Monitoring" subtitle={`${data.location} · source: ${data.source}`}>
        {data.is_simulated && <SimBadge>SIMULATED — NOT LIVE WEATHER</SimBadge>}
      </PageHeader>
      <form onSubmit={(e) => { e.preventDefault(); load(city.trim()) }} className="mb-4 flex max-w-lg items-end gap-2">
        <Input className="flex-1" label="Location (city)" placeholder="e.g. Hyderabad" value={city} onChange={(e) => setCity(e.target.value)} />
        <Button type="submit" loading={loading}>Check</Button>
      </form>
      <Banner type="error" className="mb-4">{error}</Banner>
      {data.notice && <Banner type="warning" className="mb-4">{data.notice}</Banner>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Thermometer} tone="amber" label="Temperature" value={`${c.temperature}°C`} sub={c.condition} />
        <StatCard icon={Droplets} tone="sky" label="Humidity" value={`${c.humidity}%`} />
        <StatCard icon={CloudRain} label="Rainfall" value={`${c.rainfall} mm`} />
        <StatCard icon={Wind} tone="sky" label="Wind" value={`${c.wind_kmh} km/h`} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Temperature & humidity trend" subtitle="Next hours">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={data.hourly}><CartesianGrid strokeDasharray="3 3" stroke="#e2f0e5" /><XAxis dataKey="hour" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Line dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} name="Temp °C" /><Line dataKey="humidity" stroke="#0ea5e9" strokeWidth={2.5} name="Humidity %" /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Rainfall forecast" subtitle="mm per day">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={data.forecast}><CartesianGrid strokeDasharray="3 3" stroke="#e2f0e5" /><XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="rainfall" fill="#22c55e" radius={[4, 4, 0, 0]} name="Rain mm" /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <Card className="mt-6 overflow-x-auto p-5">
        <h3 className="mb-3 font-semibold text-forest">Forecast</h3>
        <table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-green-100 text-left text-xs uppercase text-slate-400">{['Date', 'Condition', 'High', 'Low', 'Humidity', 'Rain'].map((h) => <th key={h} className="py-2">{h}</th>)}</tr></thead>
          <tbody>{data.forecast.map((d) => <tr key={d.date} className="border-b border-green-50"><td className="py-2">{d.date}</td><td>{d.condition}</td><td>{d.temp_max}°C</td><td>{d.temp_min}°C</td><td>{d.humidity}%</td><td>{d.rainfall} mm</td></tr>)}</tbody></table>
      </Card>
    </>
  )
}
