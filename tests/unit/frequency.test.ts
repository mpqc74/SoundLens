import { describe, it, expect } from 'vitest'
import { lossAt, isExtrapolated } from '../../src/core/frequency'

// ── lossAt ────────────────────────────────────────────────────────────────────
// Derives hearing loss at any equalizer frequency from the audiogram's known
// data points using log-frequency linear projection. The same algorithm applies
// whether the target frequency falls between known points (interpolation) or
// beyond them (extrapolation).

describe('lossAt — values at and between tested points', () => {
  // 500 Hz → 20 dB, 2000 Hz → 40 dB
  // Log midpoint: √(500 × 2000) = 1000 Hz → expected loss = 30 dB
  const points = [
    { hz: 500, loss: 20 },
    { hz: 2000, loss: 40 },
  ]

  it.each([
    { hz: 500,  expected: 20, precision: 2, label: 'lower tested point'               },
    { hz: 2000, expected: 40, precision: 2, label: 'upper tested point'               },
    { hz: 1000, expected: 30, precision: 2, label: 'log midpoint'                     },
    { hz: 707,  expected: 25, precision: 0, label: 'log-quarter point (lower precision)' },
    // t = log(707/500) / log(2000/500) ≈ 0.25 → loss = 20 + 0.25 × 20 = 25
  ])('$label: lossAt($hz) → ~$expected', ({ hz, expected, precision }) => {
    expect(lossAt(hz, points)).toBeCloseTo(expected, precision)
  })
})

describe('lossAt — values beyond the tested range (extrapolation)', () => {
  // 500 Hz → 20 dB, 1000 Hz → 30 dB — slope: 10 dB per octave
  const points = [
    { hz: 500, loss: 20 },
    { hz: 1000, loss: 30 },
  ]

  it.each([
    { hz: 2000, expected: 40, label: 'one octave above upper tested point'  },
    { hz: 4000, expected: 50, label: 'two octaves above upper tested point' },
    { hz: 250,  expected: 10, label: 'one octave below lower tested point'  },
  ])('$label: lossAt($hz) → ~$expected', ({ hz, expected }) => {
    expect(lossAt(hz, points)).toBeCloseTo(expected)
  })
})

// ── isExtrapolated ────────────────────────────────────────────────────────────
// Determines whether a given equalizer band frequency falls outside the tested
// audiogram range, so the UI can apply the dimmed / question-mark treatment.

describe('isExtrapolated', () => {
  const points = [
    { hz: 500, loss: 20 },
    { hz: 2000, loss: 40 },
  ]

  it.each([
    { hz: 1000, expected: false, label: 'between tested points' },
    { hz: 500,  expected: false, label: 'at lower boundary'     },
    { hz: 2000, expected: false, label: 'at upper boundary'     },
    { hz: 250,  expected: true,  label: 'below tested range'    },
    { hz: 4000, expected: true,  label: 'above tested range'    },
  ])('$hz Hz ($label) → $expected', ({ hz, expected }) => {
    expect(isExtrapolated(hz, points)).toBe(expected)
  })
})
