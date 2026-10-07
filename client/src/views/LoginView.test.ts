import { it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import LoginView from './LoginView.vue'
import { post } from '@/api'
import { renderWithRouter } from '@/test-utils'

vi.mock('@/api', () => ({ post: vi.fn() }))

beforeEach(() => localStorage.clear())

// C12 – fångar att API:ets meddelande byts mot ett generiskt, eller att man skickas vidare ändå.
it('shows the API message and stays on the page on a wrong password', async () => {
  vi.mocked(post).mockResolvedValue({ error: 'fel uppgifter' })

  const { router } = await renderWithRouter(LoginView, '/logga-in')

  await userEvent.type(screen.getByLabelText('E-post'), 'anna@example.com')
  await userEvent.type(screen.getByLabelText('Lösenord'), 'fel')
  await userEvent.click(screen.getByRole('button', { name: 'Logga in' }))

  expect(await screen.findByText('fel uppgifter')).toBeInTheDocument()
  expect(router.currentRoute.value.path).toBe('/logga-in')
})
