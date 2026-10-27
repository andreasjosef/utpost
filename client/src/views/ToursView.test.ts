import { it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { screen, within } from '@testing-library/vue'
import { useQuery } from '@urql/vue'
import ToursView from './ToursView.vue'
import { renderWithRouter } from '@/test-utils'
import type { TurerQuery } from '@/gql/graphql'

// M5: vyn hämtar via useQuery, så det är useQuery som mockas – den svarar med färdiga refs.
vi.mock('@urql/vue', () => ({ useQuery: vi.fn() }))
const mockedUseQuery = vi.mocked(useQuery)

const svar = (data: TurerQuery | undefined, error?: Error) =>
  ({ data: ref(data), fetching: ref(false), error: ref(error) }) as unknown as ReturnType<
    typeof useQuery
  >

// Typad efter den genererade TurerQuery: ändras schemat eller frågan bryts testdatan i typecheck.
type TurerTour = TurerQuery['tours'][number]
const makeTour = (overrides: Partial<TurerTour> = {}): TurerTour => ({
  id: '1',
  title: 'Fjällvandring',
  distanceM: 1234,
  startedAt: '2026-09-01T08:00:00.000Z',
  user: { displayName: 'Anna' },
  guide: { title: 'Kebnekaise', slug: 'kebnekaise' },
  photos: [],
  ...overrides,
})

// C8 – fångar fel i omräkningen meter → km och att relationerna inte visas.
it('shows each tour with user, guide, distance in km and photo count', async () => {
  mockedUseQuery.mockReturnValue(
    svar({ tours: [makeTour({ photos: [{ id: '1' }, { id: '2' }] })] }),
  )
  await renderWithRouter(ToursView)

  const row = await screen.findByRole('row', { name: /Fjällvandring/ })
  expect(within(row).getByText('Anna')).toBeInTheDocument()
  expect(within(row).getByText('Kebnekaise')).toBeInTheDocument()
  expect(within(row).getByText('1.2 km')).toBeInTheDocument()
  expect(within(row).getByText('2')).toBeInTheDocument()
})

// C9 – guide är valfri i schemat (Guide, inte Guide!). En tur utan guide får inte krascha vyn.
// user är User! i schemat, så GraphQL svarar aldrig utan den – det fallet testas inte längre.
it('still renders a tour without a guide', async () => {
  mockedUseQuery.mockReturnValue(svar({ tours: [makeTour({ guide: null })] }))
  await renderWithRouter(ToursView)

  const row = await screen.findByRole('row', { name: /Fjällvandring/ })
  expect(within(row).getByText('-')).toBeInTheDocument()
})

// C10 – tomt läge i stället för en tom tabell.
it('says so when there are no tours', async () => {
  mockedUseQuery.mockReturnValue(svar({ tours: [] }))
  await renderWithRouter(ToursView)

  expect(await screen.findByText('Inga turer än')).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

// C11 – ett API-fel visar ett fel, inte en tom tabell.
it('shows an error and no table when the API fails', async () => {
  mockedUseQuery.mockReturnValue(svar(undefined, new Error('[Network] Failed to fetch')))
  await renderWithRouter(ToursView)

  expect(await screen.findByRole('alert')).toHaveTextContent('Kunde inte hämta turerna')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})
