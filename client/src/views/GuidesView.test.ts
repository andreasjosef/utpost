import { it, expect, vi } from 'vitest'
import { screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import GuidesView from './GuidesView.vue'
import { get } from '@/api'
import { renderWithRouter, makeGuide } from '@/test-utils'

vi.mock('@/api', () => ({ get: vi.fn() }))

// C1 – fångar fel fältnamn i mallen (t.ex. lengthKm) och fel endpoint.
it('shows the guides from the API', async () => {
  vi.mocked(get).mockResolvedValue([makeGuide()])
  await renderWithRouter(GuidesView)

  expect(await screen.findByRole('link', { name: 'Kebnekaise' })).toBeInTheDocument()
  expect(screen.getByText('Lappland · medel · 10.7 km')).toBeInTheDocument()
  expect(get).toHaveBeenCalledWith('/guides')
})

// C2 – rött tills vyn får ett tomt läge (visar ingenting i dag).
it('says so when there are no guides', async () => {
  vi.mocked(get).mockResolvedValue([])
  await renderWithRouter(GuidesView)

  expect(await screen.findByText('Inga guider hittades')).toBeInTheDocument()
})

// C3 – fångar att ett API-fel ger en tom sida utan förklaring.
it('shows an error when the API fails', async () => {
  vi.mocked(get).mockRejectedValue(new Error('API svarade 500'))
  await renderWithRouter(GuidesView)

  expect(await screen.findByText('Kunde inte hämta guiderna')).toBeInTheDocument()
})

// C4 – fångar att sökningen blir skiftlägeskänslig eller slutar matcha på landskap.
it('filters by region, ignoring case', async () => {
  vi.mocked(get).mockResolvedValue([
    makeGuide({ id: 1, title: 'Kebnekaise', region: 'Lappland' }),
    makeGuide({ id: 2, slug: 'helags', title: 'Helags', region: 'Jämtland' }),
  ])
  await renderWithRouter(GuidesView)

  await screen.findByText('Helags')
  await userEvent.type(screen.getByPlaceholderText('Sök på namn eller landskap'), 'lappland')
  await userEvent.click(screen.getByRole('button', { name: 'Sök' }))

  expect(screen.getByText('Kebnekaise')).toBeInTheDocument()
  expect(screen.queryByText('Helags')).not.toBeInTheDocument()
})

// Debt 7 (#9): utdraget renderas också orenat via v-html (lagrad XSS).
it('strips event handlers from the guide excerpt', async () => {
  vi.mocked(get).mockResolvedValue([
    makeGuide({ body_html: '<p>Sveriges tak</p><img src="x" onerror="alert(1)">' }),
  ])
  const { container } = await renderWithRouter(GuidesView)

  expect(await screen.findByText('Sveriges tak')).toBeInTheDocument()
  expect(container.querySelector('[onerror]')).toBeNull()
})
