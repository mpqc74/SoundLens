export type FrequencyPoint = { hz: number; loss: number }

export function lossAt(hz: number, points: FrequencyPoint[]): number {
  const sorted = [...points].sort((a, b) => a.hz - b.hz)

  // Exact match early exit
  const exact = sorted.find(p => p.hz === hz)
  if (exact) return exact.loss

  let p1: FrequencyPoint
  let p2: FrequencyPoint

  if (hz < sorted[0].hz) {
    p1 = sorted[0]
    p2 = sorted[1]
  } else if (hz > sorted[sorted.length - 1].hz) {
    p1 = sorted[sorted.length - 2]
    p2 = sorted[sorted.length - 1]
  } else {
    let i = 0
    while (sorted[i + 1].hz < hz) i++
    p1 = sorted[i]
    p2 = sorted[i + 1]
  }

  const t = Math.log(hz / p1.hz) / Math.log(p2.hz / p1.hz)
  return p1.loss + t * (p2.loss - p1.loss)
}

export function isExtrapolated(hz: number, points: FrequencyPoint[]): boolean {
  const minHz = Math.min(...points.map(p => p.hz))
  const maxHz = Math.max(...points.map(p => p.hz))
  return hz < minHz || hz > maxHz
}
