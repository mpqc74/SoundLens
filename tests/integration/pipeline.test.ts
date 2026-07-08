import { describe, it, expect } from 'vitest'
import { computeBands } from '../../src/core/pipeline'
import type { Audiogram } from '../../src/core/pipeline'
import { Formula } from '../../src/core/formulas'
import { DisplayMode } from '../../src/core/modes'

const ISO_10_BANDS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
const ISO_RANGE_MIN = -12  // ±12 dB for 10-band ISO and Sony-style presets
const TESLA_RANGE_MIN = -8 // ±8 dB for Tesla preset

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
    [Formula.Ideal,        DisplayMode.Boost        ],
    [Formula.Ideal,        DisplayMode.HeadroomSafe ],
    [Formula.HalfGain,     DisplayMode.Boost        ],
    [Formula.HalfGain,     DisplayMode.HeadroomSafe ],
    [Formula.LossAdjusted, DisplayMode.Boost        ],
    [Formula.LossAdjusted, DisplayMode.HeadroomSafe ],
  ] as const)('%s × %s', (formula, mode) => {
    expect(computeBands(audiogramA, ISO_10_BANDS, formula, mode, ISO_RANGE_MIN)).toMatchObject(expected)
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
      expect(computeBands(audiogramB, ISO_10_BANDS, Formula.Ideal, DisplayMode.Boost, ISO_RANGE_MIN)).toMatchObject([
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
    // Ideal corrections: [12.5, 17.5, 27.5, 37.5, 57.5, 72.5]. spread=60 > 12 → overflow.
    // pivot = min(72.5, 12.5−(−12)) = min(72.5, 24.5) = 24.5
    // Corrections: 250→−12, 500→−7, 1000→3, 2000→13, 4000→33, 8000→48
    // Reference: 250 Hz (correction −12). Spreads: 0, 5, 15→yellow, 25→red, 45→red, 60→red
    // cappedCorrection = reference(−12) + 15 = 3
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, Formula.Ideal, DisplayMode.HeadroomSafe, ISO_RANGE_MIN)).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5, -12, 'none',   true),
        band(500,  17.5,  -7, 'none',   false),
        band(1000, 27.5,   3, 'yellow', false),
        band(2000, 37.5,  13, 'red',    false, 3),
        band(4000, 57.5,  33, 'red',    false, 3),
        band(8000, 72.5,  48, 'red',    false, 3),
        ext(16000),
      ])
    })
  })

  describe('half-gain × boost', () => {
    // Half-gain = loss × 0.5. Gains: 250→6.25, 500→8.75, 1k→13.75, 2k→18.75, 4k→28.75, 8k→36.25
    // Reference: 250 Hz. Mode shift: subtract 6.25.
    // Corrections: 250→0, 500→2.5, 1000→7.5, 2000→12.5, 4000→22.5, 8000→30
    // Spreads:     0      2.5      7.5        12.5→yellow 22.5→red   30→red
    // cappedCorrection = reference(0) + 15 = 15
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, Formula.HalfGain, DisplayMode.Boost, ISO_RANGE_MIN)).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5,  0,   'none',   true),
        band(500,  17.5,  2.5, 'none',   false),
        band(1000, 27.5,  7.5, 'none',   false),
        band(2000, 37.5, 12.5, 'yellow', false),
        band(4000, 57.5, 22.5, 'red',  false, 15),
        band(8000, 72.5, 30,   'red',  false, 15),
        ext(16000),
      ])
    })
  })

  describe('half-gain × headroom-safe', () => {
    // Half-gain corrections: [6.25, 8.75, 13.75, 18.75, 28.75, 36.25]. spread=30 > 12 → overflow.
    // pivot = min(36.25, 6.25−(−12)) = min(36.25, 18.25) = 18.25
    // Corrections: 250→−12, 500→−9.5, 1000→−4.5, 2000→0.5, 4000→10.5, 8000→18
    // Reference: 250 Hz (correction −12). Spreads: 0, 2.5, 7.5, 12.5→yellow, 22.5→red, 30→red
    // cappedCorrection = reference(−12) + 15 = 3
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, Formula.HalfGain, DisplayMode.HeadroomSafe, ISO_RANGE_MIN)).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5, -12,   'none',   true),
        band(500,  17.5,  -9.5, 'none',   false),
        band(1000, 27.5,  -4.5, 'none',   false),
        band(2000, 37.5,   0.5, 'yellow', false),
        band(4000, 57.5,  10.5, 'red',  false, 3),
        band(8000, 72.5,  18,   'red',  false, 3),
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
      expect(computeBands(audiogramB, ISO_10_BANDS, Formula.LossAdjusted, DisplayMode.Boost, ISO_RANGE_MIN)).toMatchObject([
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
    // Loss-adjusted corrections: [0, 0, 13.75, 18.75, 23, 21.75]. spread=23 > 12 → overflow.
    // pivot = min(23, 0−(−12)) = min(23, 12) = 12
    // Corrections: 250→−12, 500→−12, 1000→1.75, 2000→6.75, 4000→11, 8000→9.75
    // Reference: 250 Hz (correction −12). Spreads: 0, 0, 13.75→yellow, 18.75→red, 23→red, 21.75→red
    // cappedCorrection = reference(−12) + 15 = 3
    it('produces correct output for all 10 bands', () => {
      expect(computeBands(audiogramB, ISO_10_BANDS, Formula.LossAdjusted, DisplayMode.HeadroomSafe, ISO_RANGE_MIN)).toMatchObject([
        ext(31), ext(62), ext(125),
        band(250,  12.5, -12,   'none',   true),
        band(500,  17.5, -12,   'none',   false),
        band(1000, 27.5,  1.75, 'yellow', false),
        band(2000, 37.5,  6.75, 'red',    false, 3),
        band(4000, 57.5, 11,    'red',    false, 3),
        band(8000, 72.5,  9.75, 'red',    false, 3),
        ext(16000),
      ])
    })
  })
})

// ── HeadroomSafe overflow rescue ──────────────────────────────────────────────

describe('HeadroomSafe overflow rescue (Tesla ±8 dB range)', () => {
  // Wide-spread audiogram: spread = 40 dB > 8 dB → overflow rescue kicks in.
  // Losses: 500→5, 4000→45. Ideal corrections: [5, 45].
  // pivot = min(45, 5−(−8)) = min(45, 13) = 13
  // Shifted: 500→−8, 4000→32. Lowest sits at rangeMin, highest floats above 0.
  const wideSpread: Audiogram = {
    500:  { left: 5, right: 5 },
    4000: { left: 45, right: 45 },
  }

  it('lowest band correction equals rangeMin when spread overflows', () => {
    const results = computeBands(wideSpread, [500, 4000], Formula.Ideal, DisplayMode.HeadroomSafe, TESLA_RANGE_MIN)
    const corrections = results.map(r => r.correction)
    expect(Math.min(...corrections)).toBeCloseTo(-8)
  })

  it('highest band correction is above 0 when overflow rescue raises anchor', () => {
    const results = computeBands(wideSpread, [500, 4000], Formula.Ideal, DisplayMode.HeadroomSafe, TESLA_RANGE_MIN)
    const corrections = results.map(r => r.correction)
    expect(Math.max(...corrections)).toBeGreaterThan(0)
  })

  // Narrow-spread audiogram: spread = 5 dB ≤ 8 dB → no overflow, current behavior preserved.
  // Losses: 500→5, 4000→10. Ideal corrections: [5, 10].
  // pivot = min(10, 5−(−8)) = min(10, 13) = 10
  // Shifted: 500→−5, 4000→0. Highest at 0 (standard headroom-safe).
  const narrowSpread: Audiogram = {
    500:  { left: 5, right: 5 },
    4000: { left: 10, right: 10 },
  }

  it('highest band correction stays at 0 when spread fits within range', () => {
    const results = computeBands(narrowSpread, [500, 4000], Formula.Ideal, DisplayMode.HeadroomSafe, TESLA_RANGE_MIN)
    const corrections = results.map(r => r.correction)
    expect(Math.max(...corrections)).toBeCloseTo(0)
  })

  it('pairwise spread is identical between Boost and HeadroomSafe even with overflow', () => {
    const boost    = computeBands(wideSpread, [500, 4000], Formula.Ideal, DisplayMode.Boost,         TESLA_RANGE_MIN)
    const headroom = computeBands(wideSpread, [500, 4000], Formula.Ideal, DisplayMode.HeadroomSafe,  TESLA_RANGE_MIN)
    for (let i = 0; i < boost.length; i++) {
      for (let j = 0; j < boost.length; j++) {
        expect(boost[i].correction - boost[j].correction)
          .toBeCloseTo(headroom[i].correction - headroom[j].correction)
      }
    }
  })
})

// ── Cross-cutting pipeline tests ──────────────────────────────────────────────

describe('left/right averaging', () => {
  it('asymmetric inputs produce the correct averaged loss', () => {
    const asymmetric: Audiogram = { 1000: { left: 10, right: 30 } }
    const symmetric: Audiogram  = { 1000: { left: 20, right: 20 } }
    const rA = computeBands(asymmetric, [1000], Formula.Ideal, DisplayMode.Boost, ISO_RANGE_MIN)
    const rS = computeBands(symmetric,  [1000], Formula.Ideal, DisplayMode.Boost, ISO_RANGE_MIN)
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
    expect(computeBands(notch, [500, 1000, 2000], Formula.Ideal, DisplayMode.Boost, ISO_RANGE_MIN)).toMatchObject([
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
    expect(computeBands(tied, [500, 1000, 2000], Formula.Ideal, DisplayMode.Boost, ISO_RANGE_MIN)).toMatchObject([
      { hz: 500,  isReference: true  },
      { hz: 1000, isReference: true  },
      { hz: 2000, isReference: false },
    ])
  })
})

describe('cappedCorrection invariant', () => {
  it('cappedCorrection is defined only on red-warning bands', () => {
    const results = computeBands(audiogramB, ISO_10_BANDS, Formula.Ideal, DisplayMode.Boost, ISO_RANGE_MIN)
    results.forEach(r => {
      if (r.warning !== 'red') expect(r.cappedCorrection).toBeUndefined()
      else expect(r.cappedCorrection).toBeDefined()
    })
  })
})

describe('formula switch', () => {
  it('changes corrections but not loss values', () => {
    const rIdeal = computeBands(audiogramB, ISO_10_BANDS, Formula.Ideal,    DisplayMode.Boost, ISO_RANGE_MIN)
    const rHalf  = computeBands(audiogramB, ISO_10_BANDS, Formula.HalfGain, DisplayMode.Boost, ISO_RANGE_MIN)
    rIdeal.forEach((band, i) => expect(band.loss).toBeCloseTo(rHalf[i].loss))
    const i1000 = ISO_10_BANDS.indexOf(1000)
    expect(rIdeal[i1000].correction).not.toBeCloseTo(rHalf[i1000].correction)
  })
})

describe('mode switch', () => {
  it('shifts all corrections vertically but preserves pairwise spread', () => {
    const boost    = computeBands(audiogramB, ISO_10_BANDS, Formula.Ideal, DisplayMode.Boost,        ISO_RANGE_MIN)
    const headroom = computeBands(audiogramB, ISO_10_BANDS, Formula.Ideal, DisplayMode.HeadroomSafe, ISO_RANGE_MIN)
    for (let i = 0; i < boost.length; i++) {
      for (let j = 0; j < boost.length; j++) {
        expect(boost[i].correction - boost[j].correction)
          .toBeCloseTo(headroom[i].correction - headroom[j].correction)
      }
    }
  })
})
