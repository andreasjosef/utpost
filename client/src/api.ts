export const API_URL = 'http://localhost:4000/api'

// Generisk: anroparen säger vilken typ svaret har, t.ex. get<Guide[]>('/guides').
export const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API svarade ${res.status}`)
  return res.json() as Promise<T>
}
