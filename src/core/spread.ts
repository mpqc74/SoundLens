export type WarningLevel = 'none' | 'yellow' | 'red'

export type SpreadResult = {
  spread: number
  warning: WarningLevel
  cappedCorrection?: number
}

export function computeSpreads(corrections: number[], referenceIndex: number): SpreadResult[] {
  const refCorrection = corrections[referenceIndex]
  return corrections.map(correction => {
    const spread = correction - refCorrection
    if (spread > 15) {
      return { spread, warning: 'red', cappedCorrection: refCorrection + 15 }
    }
    if (spread > 10) {
      return { spread, warning: 'yellow' }
    }
    return { spread, warning: 'none' }
  })
}
