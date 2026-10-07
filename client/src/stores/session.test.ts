import { it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from './session'
import { post } from '@/api'

vi.mock('@/api', () => ({ post: vi.fn() }))

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

// Fångar: att storen sparar en token, eller sväljer API:ets meddelande, vid fel lösenord.
it('throws the API message and stores nothing on a failed login', async () => {
  vi.mocked(post).mockResolvedValue({ error: 'fel uppgifter' })

  const session = useSessionStore()
  await expect(session.login('anna@example.com', 'fel')).rejects.toThrow('fel uppgifter')

  expect(session.isAuthenticated).toBe(false)
  expect(localStorage.getItem('token')).toBeNull()
})
