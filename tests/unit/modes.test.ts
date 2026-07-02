import { describe, it, expect } from 'vitest'
import { applyMode, DisplayMode } from '../../src/core/modes'

// Raw formula outputs before mode shift.
// Index 0 is the reference band (least loss, lowest gain = 3).
// Index 3 is the highest-loss band (highest gain = 23).
// Neither is zero, so both modes must perform a non-trivial shift.
const corrections = [3, 8, 18, 23]

describe('applyMode — mode shift', () => {
  it.each([
    [DisplayMode.Boost,        [0, 5, 15, 20]   ],
    [DisplayMode.HeadroomSafe, [-20, -15, -5, 0]],
  ] as const)('%s mode shifts all values correctly', (mode, expected) => {
    expect(applyMode(corrections, mode)).toEqual(expected)
  })
})

describe('applyMode — spread invariance between modes', () => {
  const boost = applyMode(corrections, DisplayMode.Boost)
  const headroom = applyMode(corrections, DisplayMode.HeadroomSafe)

  it('spread between every pair of bands is identical in both modes', () => {
    for (let i = 0; i < corrections.length; i++) {
      for (let j = 0; j < corrections.length; j++) {
        expect(boost[i] - boost[j]).toBe(headroom[i] - headroom[j])
      }
    }
  })
})

describe('applyMode — uniform loss (all bands equal)', () => {
  it.each([
    [DisplayMode.Boost],
    [DisplayMode.HeadroomSafe],
  ] as const)('%s mode: all bands at 0', (mode) => {
    expect(applyMode([12, 12, 12, 12], mode)).toEqual([0, 0, 0, 0])
  })
})
