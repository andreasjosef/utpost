import { it, expect, vi } from 'vitest'
import { screen } from '@testing-library/vue'
import GuideDetailView from './GuideDetailView.vue'
import { get } from '@/api'
import { renderWithRouter, makeGuide } from '@/test-utils'

vi.mock('@/api', () => ({ get: vi.fn() }))
// C5 – fångar att sluggen från routen inte når API-anropet.
it('loads the guide for the slug in the route', async () => {
  vi.mocked(get).mockResolvedValue(makeGuide())
  await renderWithRouter(GuideDetailView, '/guider/kebnekaise')

  expect(await screen.findByRole('heading', { name: 'Kebnekaise' })).toBeInTheDocument()
  expect(screen.getByText('Sveriges tak')).toBeInTheDocument()
  expect(get).toHaveBeenCalledWith('/guides/kebnekaise')
})

// C6 – fångar att en 404 lämnar sidan på "Laddar..." för alltid.
it('shows an error instead of loading forever when the guide is missing', async () => {
  vi.mocked(get).mockRejectedValue(new Error('API svarade 404'))
  await renderWithRouter(GuideDetailView, '/guider/finns-inte')

  expect(await screen.findByText('Kunde inte hämta guiden')).toBeInTheDocument()
  expect(screen.queryByText('Laddar...')).not.toBeInTheDocument()
})

// C7 – Debt 7 (#9): redaktionell HTML renderas orenad via v-html (lagrad XSS).
it('strips event handlers from guide HTML', async () => {
  vi.mocked(get).mockResolvedValue(
    makeGuide({ body_html: '<p>Sveriges tak</p><img src="x" onerror="alert(1)">' }),
  )
  const { container } = await renderWithRouter(GuideDetailView, '/guider/kebnekaise')

  expect(await screen.findByText('Sveriges tak')).toBeInTheDocument()
  expect(container.querySelector('[onerror]')).toBeNull()
})
