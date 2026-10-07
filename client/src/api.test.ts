import { it, expect, vi, afterEach } from 'vitest'
import { get } from './api'

afterEach(() => vi.unstubAllGlobals())

// Fångar: om get slutar kasta vid fel visar vyerna { error } som om det vore data.
it('throws when the API answers with an error status', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'boom' }), { status: 500 })),
  )

  await expect(get('/guides')).rejects.toThrow('API svarade 500')
})
