import { it, expect } from 'vitest'
import { elevationGain } from './elevation'

const points = (...m: (number | null)[]) => m.map((elevation_m) => ({ elevation_m }))

// U1 – fångar att nedförsbackar dras av eller att första punkten räknas.
it('sums only the climbs', () => {
  expect(elevationGain(points(100, 110, 105, 108))).toBe(13)
})

// U2 – regressionen från labben: null räknas som 0 och ger en fiktiv stigning.
it('skips points without elevation', () => {
  expect(elevationGain(points(100, null, 120))).toBe(20)
})
