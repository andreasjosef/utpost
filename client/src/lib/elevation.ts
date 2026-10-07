import type { TourLog } from '@utpost/shared'

export function elevationGain(logs: Pick<TourLog, 'elevation_m'>[]): number {
  let gain = 0
  let prev: number | null = null

  for (const log of logs) {
    if (log.elevation_m != null) {
      if (prev != null && log.elevation_m > prev) {
        gain += log.elevation_m - prev
      }
      prev = log.elevation_m
    }
  }

  return gain
}
