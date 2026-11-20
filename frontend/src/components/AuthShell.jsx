import { Leaf } from 'lucide-react'

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-forest via-forest-700 to-leaf-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-xl font-bold"><Leaf className="h-8 w-8 text-green-200" /> AgriSmart AI</div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Smarter decisions,<br />healthier harvests.</h2>
          <p className="mt-4 max-w-md text-green-100">Monitor soil and weather, get machine-learning crop suggestions, and keep a history of every reading on your farm.</p>
        </div>
        <p className="text-xs text-green-200">Recommendations are decision support, not agronomic advice. Consult a local expert.</p>
      </div>
      <div className="flex items-center justify-center bg-[#f4faf5] p-6">
        <div className="w-full max-w-md rounded-2xl border border-green-100 bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-2 text-forest lg:hidden"><Leaf className="h-6 w-6 text-leaf-600" /><b>AgriSmart AI</b></div>
          <h1 className="text-2xl font-bold text-forest">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
