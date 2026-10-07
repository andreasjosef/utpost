import { it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/vue'
import ToursView from './ToursView.vue'
import { get } from '@/api'
import { renderWithRouter, makeTour } from '@/test-utils'

vi.mock('@/api', () => ({ get: vi.fn() }))

// C8 – fångar fel i omräkningen meter → km och att relationerna inte visas.
it('shows each tour with user, guide, distance in km and photo count', async () => {
  vi.mocked(get).mockResolvedValue([
    makeTour({
      photos: [
        {
          id: 1,
          tour_id: 1,
          filename: 'a.jpg',
          width: 800,
          height: 600,
          created_at: '2026-09-01T09:00:00Z',
        },
        {
          id: 2,
          tour_id: 1,
          filename: 'b.jpg',
          width: 800,
          height: 600,
          created_at: '2026-09-01T09:05:00Z',
        },
      ],
    }),
  ])
  await renderWithRouter(ToursView)

  const row = await screen.findByRole('row', { name: /Fjällvandring/ })
  expect(within(row).getByText('Anna')).toBeInTheDocument()
  expect(within(row).getByText('Kebnekaise')).toBeInTheDocument()
  expect(within(row).getByText('1.2 km')).toBeInTheDocument()
  expect(within(row).getByText('2')).toBeInTheDocument()
})

// C9 – Debt 10 (#12): utan foreign keys kan user saknas. Vyn får inte krascha.
it('still renders a tour without user or guide', async () => {
  vi.mocked(get).mockResolvedValue([makeTour({ user: undefined, guide: null })])
  await renderWithRouter(ToursView)

  const row = await screen.findByRole('row', { name: /Fjällvandring/ })
  expect(within(row).getByText('-')).toBeInTheDocument()
})

// C10 – rött tills vyn får ett tomt läge (visar en tom tabell i dag).
it('says so when there are no tours', async () => {
  vi.mocked(get).mockResolvedValue([])
  await renderWithRouter(ToursView)

  expect(await screen.findByText('Inga turer än')).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

// C11 – fångar att ett API-fel visar en tom tabell istället för ett fel.
it('shows an error and no table when the API fails', async () => {
  vi.mocked(get).mockRejectedValue(new Error('API svarade 500'))
  await renderWithRouter(ToursView)

  expect(await screen.findByText('Kunde inte hämta turerna')).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})
