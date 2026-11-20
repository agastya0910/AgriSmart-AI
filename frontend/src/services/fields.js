export const SOIL_FIELDS = [
  { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'mg/kg', min: 0, max: 300, step: 1 },
  { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'mg/kg', min: 0, max: 300, step: 1 },
  { key: 'potassium', label: 'Potassium (K)', unit: 'mg/kg', min: 0, max: 300, step: 1 },
  { key: 'ph', label: 'Soil pH', unit: 'pH', min: 0, max: 14, step: 0.1 },
]
export const ENV_FIELDS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', min: -10, max: 60, step: 0.1 },
  { key: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, step: 0.1 },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 1000, step: 0.1 },
]
export const MOISTURE_FIELD = { key: 'soil_moisture', label: 'Soil moisture', unit: '%', min: 0, max: 100, step: 0.1 }

export function validate(fields, values) {
  const errors = {}
  for (const f of fields) {
    const raw = values[f.key]
    if (raw === '' || raw === undefined || raw === null) { errors[f.key] = 'Required'; continue }
    const n = Number(raw)
    if (Number.isNaN(n)) errors[f.key] = 'Enter a number'
    else if (n < f.min || n > f.max) errors[f.key] = `Must be between ${f.min} and ${f.max}`
  }
  return errors
}
export const toNumbers = (fields, values) => Object.fromEntries(fields.map((f) => [f.key, Number(values[f.key])]))
