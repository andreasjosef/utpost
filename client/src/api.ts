// Relativ adress: browsern frågar samma server som skickade sidan. I containern är det nginx
// (client/nginx.conf), i utveckling Vites dev-server (proxy i vite.config.js). Båda skickar vidare till API:et.
export const API_URL = '/api'

// Generisk: anroparen säger vilken typ svaret har, t.ex. get<Guide[]>('/guides').
export const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API svarade ${res.status}`)
  return res.json() as Promise<T>
}

// No Throw vid 4xx: API svarar { error: '...' } och anroparen hanterar.
// T behöver inkludera ApiError, t.ex. post<LoginResponse | ApiError>(...).
export const post = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}
