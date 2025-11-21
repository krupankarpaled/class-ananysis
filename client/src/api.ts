const base = import.meta.env.VITE_API_URL || 'http://localhost:4000'

let token = ''

export function setToken(t: string) {
  token = t
}

function headers() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

export async function post(path: string, body: any) {
  const r = await fetch(`${base}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) })
  return r.json()
}

export async function get(path: string) {
  const r = await fetch(`${base}${path}`, { headers: headers() })
  return r.json()
}