export const Formula = {
  Ideal:        'ideal',
  HalfGain:     'half-gain',
  LossAdjusted: 'loss-adjusted',
} as const
export type Formula = typeof Formula[keyof typeof Formula]

export function averageEars(left: number, right: number): number {
  return (left + right) / 2
}

export function applyFormula(formula: Formula | string, loss: number): number {
  switch (formula) {
    case Formula.Ideal:        return loss
    case Formula.HalfGain:     return loss * 0.5
    case Formula.LossAdjusted: return applyLossAdjusted(loss)
    default: throw new Error(`Unknown formula: ${formula}`)
  }
}

function applyLossAdjusted(loss: number): number {
  if (loss <= 20) return 0
  if (loss <= 40) return loss * 0.5
  if (loss <= 60) return loss * 0.4
  if (loss <= 80) return loss * 0.3
  return loss * 0.25
}
