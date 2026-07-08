import { averageEars, applyFormula, type Formula } from './formulas'
import { lossAt, isExtrapolated, type FrequencyPoint } from './frequency'
import { DisplayMode } from './modes'
import { computeSpreads } from './spread'

export type Audiogram = { [hz: number]: { left: number; right: number } }

export type BandResult = {
  hz: number
  loss: number
  correction: number
  warning: 'none' | 'yellow' | 'red'
  isReference: boolean
  isExtrapolated: boolean
  cappedCorrection?: number
}

// Returns the pivot for HeadroomSafe mode.
// Normally the highest correction sits at 0 dB. When the spread exceeds range,
// the anchor floats up just enough to keep the lowest band at -range.
export function computeHeadroomPivot(
  rawMax: number,
  rawMin: number,
  range: number,
): number {
  return Math.min(rawMax, rawMin + range)
}

export function computeBands(
  audiogram: Audiogram,
  bandHzList: number[],
  formula: Formula,
  mode: DisplayMode,
  range: number,
): BandResult[] {
  const audiogramPoints: FrequencyPoint[] = Object.entries(audiogram)
    .map(([hz, ears]) => ({ hz: Number(hz), loss: averageEars(ears.left, ears.right) }))
    .sort((a, b) => a.hz - b.hz)

  const losses      = bandHzList.map(hz => lossAt(hz, audiogramPoints))
  const extrapolated = bandHzList.map(hz => isExtrapolated(hz, audiogramPoints))
  const rawCorrections = losses.map(loss => applyFormula(formula, loss))

  // Mode shift anchor is derived from non-extrapolated bands only
  const inRangeCorrections = rawCorrections.filter((_, i) => !extrapolated[i])
  const pivot = mode === DisplayMode.HeadroomSafe
    ? computeHeadroomPivot(Math.max(...inRangeCorrections), Math.min(...inRangeCorrections), range)
    : Math.min(...inRangeCorrections)
  const shifted = rawCorrections.map(c => c - pivot)

  // Reference: non-extrapolated band with minimum raw hearing loss
  const minLoss = Math.min(...losses.filter((_, i) => !extrapolated[i]))
  const refIdx  = losses.findIndex((l, i) => !extrapolated[i] && l === minLoss)

  const spreads = computeSpreads(shifted, refIdx)

  return bandHzList.map((hz, i) => {
    const band: BandResult = {
      hz,
      loss: losses[i],
      correction: shifted[i],
      warning: spreads[i].warning,
      isReference: !extrapolated[i] && losses[i] === minLoss,
      isExtrapolated: extrapolated[i],
    }
    if (spreads[i].cappedCorrection !== undefined) {
      band.cappedCorrection = spreads[i].cappedCorrection
    }
    return band
  })
}
