import { describe, it, expect } from 'vitest'
import { averageEars, applyFormula } from '../../src/core/formulas'

describe('averageEars', () => {
  it.each([
    [0,  0,   0 ],
    [20, 20,  20],
    [30, 50,  40],
    [0,  100, 50],
  ] as const)('averageEars(%i, %i) → %i', (left, right, expected) => {
    expect(averageEars(left, right)).toBe(expected)
  })
})

describe('applyFormula — ideal', () => {
  it.each([
    [0,  0 ],
    [10, 10],
    [50, 50],
    [80, 80],
  ] as const)('%i dB → %i', (loss, expected) => {
    expect(applyFormula('ideal', loss)).toBe(expected)
  })
})

describe('applyFormula — half-gain', () => {
  it.each([
    [0,  0 ],
    [20, 10],
    [40, 20],
    [80, 40],
  ] as const)('%i dB → %i', (loss, expected) => {
    expect(applyFormula('half-gain', loss)).toBe(expected)
  })
})

describe('applyFormula — loss-adjusted (tier boundaries)', () => {
  it.each([
    { loss: 0,   expected: 0,     tier: '0–20 (0%)'           },
    { loss: 10,  expected: 0,     tier: '0–20 (0%)'           },
    { loss: 20,  expected: 0,     tier: '0–20 boundary'       },
    { loss: 21,  expected: 10.5,  tier: '21–40 (50%) starts'  },
    { loss: 30,  expected: 15,    tier: '21–40 (50%)'         },
    { loss: 40,  expected: 20,    tier: '21–40 boundary'      },
    { loss: 41,  expected: 16.4,  tier: '41–60 (40%) starts'  },
    { loss: 50,  expected: 20,    tier: '41–60 (40%)'         },
    { loss: 60,  expected: 24,    tier: '41–60 boundary'      },
    { loss: 61,  expected: 18.3,  tier: '61–80 (30%) starts'  },
    { loss: 70,  expected: 21,    tier: '61–80 (30%)'         },
    { loss: 80,  expected: 24,    tier: '61–80 boundary'      },
    { loss: 81,  expected: 20.25, tier: '81+ (25%) starts'    },
    { loss: 100, expected: 25,    tier: '81+ (25%)'           },
  ])('$loss dB → $expected ($tier)', ({ loss, expected }) => {
    expect(applyFormula('loss-adjusted', loss)).toBeCloseTo(expected)
  })
})
