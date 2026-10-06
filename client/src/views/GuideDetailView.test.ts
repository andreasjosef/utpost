import { it, expect, vi } from 'vitest'
import { screen } from '@testing-library/vue'
import GuideDetailView from './GuideDetailView.vue'
import { get } from '@/api'
import { renderWithRouter, makeGuide } from '@/test-utils'

vi.mock('@/api', () => ({ get: vi.fn() }))

// Debt 7 (#9): redaktionell HTML renderas orenad via v-html (lagrad XSS).
it('strips event handlers from guide HTML', async () => {
  vi.mocked(get).mockResolvedValue(
    makeGuide({ body_html: '<p>Sveriges tak</p><img src="x" onerror="alert(1)">' }),
  )
  const { container } = await renderWithRouter(GuideDetailView, '/guider/kebnekaise')

  expect(await screen.findByText('Sveriges tak')).toBeInTheDocument()
  expect(container.querySelector('[onerror]')).toBeNull()
})
