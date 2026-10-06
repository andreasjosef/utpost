import { it, expect, vi } from 'vitest'
import { screen } from '@testing-library/vue'
import GuidesView from './GuidesView.vue'
import { get } from '@/api'
import { renderWithRouter, makeGuide } from '@/test-utils'

vi.mock('@/api', () => ({ get: vi.fn() }))

// Debt 7 (#9): utdraget renderas också orenat via v-html (lagrad XSS).
it('strips event handlers from the guide excerpt', async () => {
  vi.mocked(get).mockResolvedValue([
    makeGuide({ body_html: '<p>Sveriges tak</p><img src="x" onerror="alert(1)">' }),
  ])
  const { container } = await renderWithRouter(GuidesView)

  expect(await screen.findByText('Sveriges tak')).toBeInTheDocument()
  expect(container.querySelector('[onerror]')).toBeNull()
})
