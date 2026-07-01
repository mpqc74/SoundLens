import { describe, it, expect } from 'vitest'
import { computeSpreads } from '../../src/core/spread'

describe('computeSpreads — warning and cappedCorrection per band', () => {
  // corrections = [0, 9, 10, 11, 15, 16, 20], referenceIndex = 0
  const corrections = [0, 9, 10, 11, 15, 16, 20]
  const results = () => computeSpreads(corrections, 0)

  it.each([
    { index: 0, spread: 0,  warning: 'none',   capped: undefined },
    { index: 1, spread: 9,  warning: 'none',   capped: undefined },
    { index: 2, spread: 10, warning: 'none',   capped: undefined }, // boundary: ≤ 10 is normal
    { index: 3, spread: 11, warning: 'yellow', capped: undefined },
    { index: 4, spread: 15, warning: 'yellow', capped: undefined }, // boundary: ≤ 15 is yellow
    { index: 5, spread: 16, warning: 'red',    capped: 15        }, // reference (0) + 15
    { index: 6, spread: 20, warning: 'red',    capped: 15        }, // reference (0) + 15
  ])('spread $spread → $warning, cappedCorrection $capped', ({ index, warning, capped }) => {
    const result = results()[index]
    expect(result.warning).toBe(warning)
    expect(result.cappedCorrection).toBe(capped)
  })
})

describe('computeSpreads — cappedCorrection respects reference offset', () => {
  // reference band correction = 5; cap = 5 + 15 = 20
  it('red band cappedCorrection = reference (5) + 15 = 20', () => {
    const results = computeSpreads([5, 26], 0) // spread = 21 → red
    expect(results[1].cappedCorrection).toBe(20)
  })
})

describe('computeSpreads — spread values', () => {
  it('reports correct spread for each band', () => {
    expect(computeSpreads([3, 3, 10, 20], 0).map(r => r.spread)).toEqual([0, 0, 7, 17])
  })
})
