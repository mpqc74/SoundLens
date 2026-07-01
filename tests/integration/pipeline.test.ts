import { describe, it, expect } from 'vitest'
import { computeBands } from '../../src/core/pipeline'
import type { Audiogram } from '../../src/core/pipeline'

const ISO_10_BANDS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

// ── Test audiograms ───────────────────────────────────────────────────────────

// Audiogram A: flat 25 dB HL loss at every tested frequency, both ears.
// Tested range: 250–8000 Hz. Extrapolated: 31, 62, 125, 16000 Hz.
const audiogramA: Audiogram = {
  250:  { left: 25, right: 25 },
  500:  { left: 25, right: 25 },
  1000: { left: 25, right: 25 },
  2000: { left: 25, right: 25 },
  4000: { left: 25, right: 25 },
  8000: { left: 25, right: 25 },
}

// Audiogram B: ski-slope loss (typical age-related).
// Averaged losses: 250→12.5, 500→17.5, 1000→27.5, 2000→37.5, 4000→57.5, 8000→72.5 dB HL
const audiogramB: Audiogram = {
  250:  { left: 10, right: 15 },
  500:  { left: 15, right: 20 },
  1000: { left: 25, right: 30 },
  2000: { left: 35, right: 40 },
  4000: { left: 55, right: 60 },
  8000: { left: 70, right: 75 },
}

// ── Expected output builders ──────────────────────────────────────────────────

// Extrapolated band: exact correction not asserted here — covered by frequency.test.ts
const ext = (hz: number) => ({ hz, isExtrapolated: true })

// In-range band: all fields asserted.
// cappedCorrection is included only for red-warning bands.
function band(
  hz: number,
  loss: number,
  correction: number,
  warning: string,
  isReference: boolean,
  cappedCorrection?: number,
) {
  return {
    hz,
    loss,
    correction: expect.closeTo(correction),
    warning,
    isReference,
    isExtrapolated: false,
    ...(cappedCorrection !== undefined && { cappedCorrection: expect.closeTo(cappedCorrection) }),
  }
}

// ── Audiogram A — flat 25 dB HL loss ─────────────────────────────────────────

describe('Audiogram A (flat 25 dB HL, tested 250–8000 Hz)', () => {
  // All losses equal → formula outputs equal → mode shift produces 0 everywhere.
  // No spread → no warnings. All tested-range bands tied as reference.
  // This holds for every formula × mode combination.
  const expected = [
    ext(31), ext(62), ext(125),
    band(250,  25, 0, 'none', true),
    band(500,  25, 0, 'none', true),
    band(1000, 25, 0, 'none', true),
    band(2000, 25, 0, 'none', true),
    band(4000, 25, 0, 'none', true),
    band(8000, 25, 0, 'none', true),
    ext(16000),
  ]

  it.each([
    ['ideal',         'boost'        ],
    ['ideal',         'headroom-safe'],
    ['half-gain',     'boost'        ],
    ['half-gain',     'headroom-safe'],
    ['loss-adjusted', 'boost'        ],
    ['loss-adjusted', 'headroom-safe'],
  ] as const)('%s × %s', (formula, mode) => {
    expect(computeBands(audiogramA, ISO_10_BANDS, formula, mode)).toMatchObject(expected)
  })
})

// ── Audiogram B — ski-slope loss ──────────────────────────────────────────────

describe('Audiogram B (ski-slope, tested 250–8000 Hz)', () => {
  describe('ideal × boost', () => {
    // Ideal gain = full dB HL loss. Reference: 250 Hz (loss 12.5). Mode shift: subtract 12.5.
    // Corrections: 250→0, 500→5, 1000→15, 2000→25, 4000→45, 8000→60
    // Spreads:     0      5      15→yellow 25→red   45→red   60→red
    // cappedCorrection = reference(0) + 15 = 15
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, 'ideal', 'boost')).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5,  0, 'none',   true),
        band(500,  17.5,  5, 'none',   false),
        band(1000, 27.5, 15, 'yellow', false),
        band(2000, 37.5, 25, 'red',    false, 15),
        band(4000, 57.5, 45, 'red',    false, 15),
        band(8000, 72.5, 60, 'red',    false, 15),
        ext(16000),
      ])
    })
  })

  describe('ideal × headroom-safe', () => {
    // Mode shift: subtract max gain (72.5). Reference: 250 Hz (correction −60).
    // Corrections: 250→−60, 500→−55, 1000→−45, 2000→−35, 4000→−15, 8000→0
    // Spreads:     0        5        15→yellow  25→red    45→red    60→red
    // cappedCorrection = reference(−60) + 15 = −45
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, 'ideal', 'headroom-safe')).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5, -60, 'none',   true),
        band(500,  17.5, -55, 'none',   false),
        band(1000, 27.5, -45, 'yellow', false),
        band(2000, 37.5, -35, 'red',    false, -45),
        band(4000, 57.5, -15, 'red',    false, -45),
        band(8000, 72.5,   0, 'red',    false, -45),
        ext(16000),
      ])
    })
  })

  describe('half-gain × boost', () => {
    // Half-gain = loss × 0.5. Gains: 250→6.25, 500→8.75, 1k→13.75, 2k→18.75, 4k→28.75, 8k→36.25
    // Reference: 250 Hz. Mode shift: subtract 6.25.
    // Corrections: 250→0, 500→2.5, 1000→7.5, 2000→12.5, 4000→22.5, 8000→30
    // Spreads:     0      2.5      7.5        12.5        22.5→red   30→red
    // cappedCorrection = reference(0) + 15 = 15
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, 'half-gain', 'boost')).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5,  0,   'none', true),
        band(500,  17.5,  2.5, 'none', false),
        band(1000, 27.5,  7.5, 'none', false),
        band(2000, 37.5, 12.5, 'none', false),
        band(4000, 57.5, 22.5, 'red',  false, 15),
        band(8000, 72.5, 30,   'red',  false, 15),
        ext(16000),
      ])
    })
  })

  describe('half-gain × headroom-safe', () => {
    // Mode shift: subtract max gain (36.25). Reference: 250 Hz (correction −30).
    // Corrections: 250→−30, 500→−27.5, 1000→−22.5, 2000→−17.5, 4000→−7.5, 8000→0
    // Spreads:     0        2.5         7.5           12.5         22.5→red   30→red
    // cappedCorrection = reference(−30) + 15 = −15
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, 'half-gain', 'headroom-safe')).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5, -30,   'none', true),
        band(500,  17.5, -27.5, 'none', false),
        band(1000, 27.5, -22.5, 'none', false),
        band(2000, 37.5, -17.5, 'none', false),
        band(4000, 57.5,  -7.5, 'red',  false, -15),
        band(8000, 72.5,    0,  'red',  false, -15),
        ext(16000),
      ])
    })
  })

  describe('loss-adjusted × boost', () => {
    // Loss-adjusted gains: 250→0(0%), 500→0(0%), 1k→13.75(50%), 2k→18.75(50%), 4k→23(40%), 8k→21.75(30%)
    // Reference: 250 Hz (loss 12.5). Mode shift: subtract min gain (0) — no-op.
    // Corrections: 250→0, 500→0, 1000→13.75, 2000→18.75, 4000→23,   8000→21.75
    // Spreads:     0      0      13.75→yellow 18.75→red   23→red     21.75→red
    // cappedCorrection = reference(0) + 15 = 15
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, 'loss-adjusted', 'boost')).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5,  0,     'none',   true),
        band(500,  17.5,  0,     'none',   false),
        band(1000, 27.5, 13.75,  'yellow', false),
        band(2000, 37.5, 18.75,  'red',    false, 15),
        band(4000, 57.5, 23,     'red',    false, 15),
        band(8000, 72.5, 21.75,  'red',    false, 15),
        ext(16000),
      ])
    })
  })

  describe('loss-adjusted × headroom-safe', () => {
    // Mode shift: subtract max gain (23, at 4000 Hz).
    // Corrections: 250→−23, 500→−23, 1000→−9.25, 2000→−4.25, 4000→0, 8000→−1.25
    // Reference: 250 Hz (correction −23).
    // Spreads:     0        0        13.75→yellow 18.75→red   23→red  21.75→red
    // cappedCorrection = reference(−23) + 15 = −8
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, 'loss-adjusted', 'headroom-safe')).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5, -23,   'none',   true),
        band(500,  17.5, -23,   'none',   false),
        band(1000, 27.5, -9.25, 'yellow', false),
        band(2000, 37.5, -4.25, 'red',    false, -8),
        band(4000, 57.5,  0,    'red',    false, -8),
        band(8000, 72.5, -1.25, 'red',    false, -8),
        ext(16000),
      ])
    })
  })
})

// ── Cross-cutting pipeline tests ──────────────────────────────────────────────

describe('left/right averaging', () => {
  it('asymmetric inputs produce the correct averaged loss', () => {
    const asymmetric: Audiogram = { 1000: { left: 10, right: 30 } }
    const symmetric: Audiogram  = { 1000: { left: 20, right: 20 } }
    const rA = computeBands(asymmetric, [1000], 'ideal', 'boost')
    const rS = computeBands(symmetric,  [1000], 'ideal', 'boost')
    expect(rA[0].loss).toBeCloseTo(20)
    expect(rA[0].correction).toBeCloseTo(rS[0].correction)
  })
})

describe('reference band identification', () => {
  it('notch loss: the middle band (least loss) is the reference', () => {
    const notch: Audiogram = {
      500:  { left: 40, right: 40 },
      1000: { left: 10, right: 10 },
      2000: { left: 40, right: 40 },
    }
    expect(computeBands(notch, [500, 1000, 2000], 'ideal', 'boost')).toMatchObject([
      { hz: 500,  isReference: false },
      { hz: 1000, isReference: true  },
      { hz: 2000, isReference: false },
    ])
  })

  it('tied least loss: all tied bands are marked isReference', () => {
    const tied: Audiogram = {
      500:  { left: 10, right: 10 },
      1000: { left: 10, right: 10 },
      2000: { left: 40, right: 40 },
    }
    expect(computeBands(tied, [500, 1000, 2000], 'ideal', 'boost')).toMatchObject([
      { hz: 500,  isReference: true  },
      { hz: 1000, isReference: true  },
      { hz: 2000, isReference: false },
    ])
  })
})

describe('cappedCorrection invariant', () => {
  it('cappedCorrection is defined only on red-warning bands', () => {
    const results = computeBands(audiogramB, ISO_10_BANDS, 'ideal', 'boost')
    results.forEach(r => {
      if (r.warning !== 'red') expect(r.cappedCorrection).toBeUndefined()
      else expect(r.cappedCorrection).toBeDefined()
    })
  })
})

describe('formula switch', () => {
  it('changes corrections but not loss values', () => {
    const rIdeal = computeBands(audiogramB, ISO_10_BANDS, 'ideal',     'boost')
    const rHalf  = computeBands(audiogramB, ISO_10_BANDS, 'half-gain', 'boost')
    rIdeal.forEach((band, i) => expect(band.loss).toBeCloseTo(rHalf[i].loss))
    const i1000 = ISO_10_BANDS.indexOf(1000)
    expect(rIdeal[i1000].correction).not.toBeCloseTo(rHalf[i1000].correction)
  })
})

describe('mode switch', () => {
  it('shifts all corrections vertically but preserves pairwise spread', () => {
    const boost    = computeBands(audiogramB, ISO_10_BANDS, 'ideal', 'boost')
    const headroom = computeBands(audiogramB, ISO_10_BANDS, 'ideal', 'headroom-safe')
    for (let i = 0; i < boost.length; i++) {
      for (let j = 0; j < boost.length; j++) {
        expect(boost[i].correction - boost[j].correction)
          .toBeCloseTo(headroom[i].correction - headroom[j].correction)
      }
    }
  })
})
