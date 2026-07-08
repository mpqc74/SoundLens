import { describe, it, expect } from 'vitest'
import {
  OCTAVE_FREQUENCIES,
  DEFAULT_FREQUENCIES,
  INTEROCTAVE_FREQUENCIES,
  ALL_FREQUENCIES,
  DB_MIN,
  DB_MAX,
  DB_SNAP,
  GRID_WIDTH,
  GRID_HEIGHT,
  hzToX,
  dbToY,
  yToDb,
  snapDb,
  isOctave,
  buildAudiogram,
  segmentStyle,
} from '../../src/core/audiogramGrid'

// ── frequency constants ──────────────────────────────────────────────────────

describe('frequency constants', () => {
  it('OCTAVE_FREQUENCIES is the standard clinical octave set', () => {
    expect(OCTAVE_FREQUENCIES).toEqual([125, 250, 500, 1000, 2000, 4000, 8000])
  })

  it('DEFAULT_FREQUENCIES excludes 125 Hz', () => {
    expect(DEFAULT_FREQUENCIES).toEqual([250, 500, 1000, 2000, 4000, 8000])
    expect(DEFAULT_FREQUENCIES).not.toContain(125)
  })

  it('ALL_FREQUENCIES is octave + interoctave, sorted ascending', () => {
    expect(ALL_FREQUENCIES).toEqual(
      [...OCTAVE_FREQUENCIES, ...INTEROCTAVE_FREQUENCIES].sort((a, b) => a - b),
    )
    for (let i = 1; i < ALL_FREQUENCIES.length; i++) {
      expect(ALL_FREQUENCIES[i]).toBeGreaterThan(ALL_FREQUENCIES[i - 1])
    }
  })
})

// ── hzToX ─────────────────────────────────────────────────────────────────────
// Log-scale mapping across the full 125 Hz - 8 kHz domain.

describe('hzToX', () => {
  it('maps the domain boundaries to 0 and GRID_WIDTH', () => {
    expect(hzToX(125)).toBeCloseTo(0)
    expect(hzToX(8000)).toBeCloseTo(GRID_WIDTH)
  })

  it('is monotonically increasing across all frequencies', () => {
    for (let i = 1; i < ALL_FREQUENCIES.length; i++) {
      expect(hzToX(ALL_FREQUENCIES[i])).toBeGreaterThan(hzToX(ALL_FREQUENCIES[i - 1]))
    }
  })

  it('gives equal pixel gaps for equal octave jumps (log-scale correctness)', () => {
    const gapLow = hzToX(250) - hzToX(125)   // 125 -> 250: one octave
    const gapHigh = hzToX(8000) - hzToX(4000) // 4000 -> 8000: one octave
    expect(gapLow).toBeCloseTo(gapHigh, 5)
  })

  it.each([
    { hz: 750,  lo: 500,  hi: 1000, label: '750 Hz between 500 and 1000' },
    { hz: 1500, lo: 1000, hi: 2000, label: '1500 Hz between 1000 and 2000' },
    { hz: 3000, lo: 2000, hi: 4000, label: '3000 Hz between 2000 and 4000' },
    { hz: 6000, lo: 4000, hi: 8000, label: '6000 Hz between 4000 and 8000' },
  ])('$label', ({ hz, lo, hi }) => {
    expect(hzToX(hz)).toBeGreaterThan(hzToX(lo))
    expect(hzToX(hz)).toBeLessThan(hzToX(hi))
  })
})

// ── dbToY / yToDb ─────────────────────────────────────────────────────────────
// Linear mapping, increasing dB moves DOWN (clinical convention), clamped to [DB_MIN, DB_MAX].

describe('dbToY', () => {
  it('maps DB_MIN to 0 (top) and DB_MAX to GRID_HEIGHT (bottom)', () => {
    expect(dbToY(DB_MIN)).toBeCloseTo(0)
    expect(dbToY(DB_MAX)).toBeCloseTo(GRID_HEIGHT)
  })

  it('maps the midpoint dB to the midpoint pixel', () => {
    const mid = (DB_MIN + DB_MAX) / 2 // 50
    expect(dbToY(mid)).toBeCloseTo(GRID_HEIGHT / 2)
  })

  it('is monotonically increasing (higher dB = further down)', () => {
    expect(dbToY(0)).toBeLessThan(dbToY(10))
    expect(dbToY(-10)).toBeLessThan(dbToY(0))
  })

  it.each([
    { db: -50, expected: 0, label: 'below DB_MIN clamps to top' },
    { db: 200, expected: GRID_HEIGHT, label: 'above DB_MAX clamps to bottom' },
  ])('$label', ({ db, expected }) => {
    expect(dbToY(db)).toBeCloseTo(expected)
  })
})

describe('yToDb', () => {
  it('maps pixel boundaries back to DB_MIN / DB_MAX', () => {
    expect(yToDb(0)).toBe(DB_MIN)
    expect(yToDb(GRID_HEIGHT)).toBe(DB_MAX)
  })

  it('round-trips exactly through dbToY at every 5 dB multiple', () => {
    for (let db = DB_MIN; db <= DB_MAX; db += DB_SNAP) {
      expect(yToDb(dbToY(db))).toBe(db)
    }
  })

  it.each([
    { y: -50, expected: DB_MIN, label: 'pixel below top clamps to DB_MIN' },
    { y: 99999, expected: DB_MAX, label: 'pixel below bottom clamps to DB_MAX' },
  ])('$label', ({ y, expected }) => {
    expect(yToDb(y)).toBe(expected)
  })
})

// ── snapDb ────────────────────────────────────────────────────────────────────

describe('snapDb', () => {
  it.each([
    { db: 0, expected: 0 },
    { db: 5, expected: 5 },
    { db: -10, expected: -10 },
    { db: 110, expected: 110 },
  ])('exact multiples of 5 pass through unchanged: snapDb($db) -> $expected', ({ db, expected }) => {
    expect(snapDb(db)).toBe(expected)
  })

  it.each([
    { db: 3, expected: 5 },
    { db: 2, expected: 0 },
    { db: -3, expected: -5 },
  ])('mid-range rounding: snapDb($db) -> $expected', ({ db, expected }) => {
    expect(snapDb(db)).toBe(expected)
  })

  it.each([
    { db: 2.5, label: 'positive .5 tie' },
    { db: -2.5, label: 'negative .5 tie (asymmetric Math.round boundary)' },
  ])('tie-break at $db ($label) snaps to a multiple of 5', ({ db }) => {
    expect(snapDb(db) % 5).toBe(0)
  })

  it.each([
    { db: 115, expected: 110, label: 'snaps then clamps above DB_MAX' },
    { db: -15, expected: -10, label: 'snaps then clamps below DB_MIN' },
  ])('$label: snapDb($db) -> $expected', ({ db, expected }) => {
    expect(snapDb(db)).toBe(expected)
  })
})

// ── isOctave ──────────────────────────────────────────────────────────────────

describe('isOctave', () => {
  it.each([
    { hz: 125, expected: true },
    { hz: 1000, expected: true },
    { hz: 8000, expected: true },
    { hz: 1500, expected: false },
    { hz: 750, expected: false },
  ])('isOctave($hz) -> $expected', ({ hz, expected }) => {
    expect(isOctave(hz)).toBe(expected)
  })
})

// ── buildAudiogram ────────────────────────────────────────────────────────────
// Only includes an hz entry when BOTH ears are non-null — mirrors the old
// AudiogramInput's both-ears-required rule, generalized over whatever keys exist.

describe('buildAudiogram', () => {
  it('includes an hz when both ears are set', () => {
    const result = buildAudiogram({ 1000: { left: 20, right: 25 } })
    expect(result).toEqual({ 1000: { left: 20, right: 25 } })
  })

  it('excludes an hz when only one ear is set', () => {
    const result = buildAudiogram({ 1000: { left: 20, right: null } })
    expect(result).toEqual({})
  })

  it('excludes an interoctave hz entirely absent from input', () => {
    const result = buildAudiogram({ 1000: { left: 20, right: 25 } })
    expect(result).not.toHaveProperty('750')
  })

  it('returns {} for empty input', () => {
    expect(buildAudiogram({})).toEqual({})
  })

  it('includes all 6 DEFAULT_FREQUENCIES at {left:0,right:0}, with 125 Hz absent', () => {
    const rows = Object.fromEntries(
      DEFAULT_FREQUENCIES.map(hz => [hz, { left: 0, right: 0 }]),
    )
    const result = buildAudiogram(rows)
    for (const hz of DEFAULT_FREQUENCIES) {
      expect(result[hz]).toEqual({ left: 0, right: 0 })
    }
    expect(result).not.toHaveProperty('125')
  })
})

// ── segmentStyle ──────────────────────────────────────────────────────────────
// Pixel-space geometry for the "rotated div" connecting-line technique.

describe('segmentStyle', () => {
  it('positions the segment origin at p1, not a midpoint', () => {
    const { left, top } = segmentStyle({ x: 10, y: 20 }, { x: 50, y: 20 })
    expect(left).toBe(10)
    expect(top).toBe(20)
  })

  it('a horizontal segment has angle 0 and width equal to |dx|', () => {
    const { width, angleDeg } = segmentStyle({ x: 10, y: 20 }, { x: 50, y: 20 })
    expect(width).toBeCloseTo(40)
    expect(angleDeg).toBeCloseTo(0)
  })

  it('a vertical segment has angle +/-90 and width equal to |dy|', () => {
    const down = segmentStyle({ x: 10, y: 10 }, { x: 10, y: 50 })
    expect(down.width).toBeCloseTo(40)
    expect(Math.abs(down.angleDeg)).toBeCloseTo(90)

    const up = segmentStyle({ x: 10, y: 50 }, { x: 10, y: 10 })
    expect(up.width).toBeCloseTo(40)
    expect(Math.abs(up.angleDeg)).toBeCloseTo(90)
  })

  it('a 3-4-5 triangle segment has width exactly 5 (Pythagorean check)', () => {
    const { width } = segmentStyle({ x: 0, y: 0 }, { x: 3, y: 4 })
    expect(width).toBeCloseTo(5)
  })
})
