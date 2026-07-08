import { describe, it, expect } from 'vitest'
import { computeHeadroomPivot } from '../../src/core/pipeline'

describe('computeHeadroomPivot', () => {
  describe('no overflow — spread fits within |rangeMin|', () => {
    it('spread < |rangeMin|: anchors highest at 0', () => {
      // spread = 10, |rangeMin| = 12 → no overflow
      const pivot = computeHeadroomPivot(40, 30, -12)
      expect(pivot).toBe(40)
      expect(40 - pivot).toBe(0)   // highest sits at 0
      expect(30 - pivot).toBe(-10) // lowest well above rangeMin
    })

    it('spread = |rangeMin| (boundary): still anchors highest at 0', () => {
      // spread = 12, |rangeMin| = 12 → exact boundary; no overflow
      const pivot = computeHeadroomPivot(42, 30, -12)
      expect(pivot).toBe(42)
      expect(42 - pivot).toBe(0)   // highest at 0
      expect(30 - pivot).toBe(-12) // lowest exactly at rangeMin
    })

    it('single band (spread = 0): anchors highest at 0', () => {
      const pivot = computeHeadroomPivot(20, 20, -12)
      expect(pivot).toBe(20)
      expect(20 - pivot).toBe(0)
    })
  })

  describe('overflow — spread exceeds |rangeMin|; lowest rescued to rangeMin', () => {
    it('spread just above |rangeMin|: lowest sits at rangeMin, highest floats above 0', () => {
      // spread = 13, |rangeMin| = 12 → overflow by 1
      const pivot = computeHeadroomPivot(43, 30, -12)
      expect(pivot).toBe(42)        // = rawMin - rangeMin = 30 - (-12) = 42
      expect(30 - pivot).toBe(-12) // lowest at rangeMin
      expect(43 - pivot).toBe(1)   // highest at +1 (floats above 0)
    })

    it('large spread on tight range (Tesla ±8 dB): lowest rescued to rangeMin', () => {
      // spread = 20, |rangeMin| = 8 → overflow
      const pivot = computeHeadroomPivot(30, 10, -8)
      expect(pivot).toBe(18)       // = 10 - (-8) = 18
      expect(10 - pivot).toBe(-8) // lowest at rangeMin
      expect(30 - pivot).toBe(12) // highest at +12 (clips above rangeMax, unavoidable)
    })

    it('spread exceeds full EQ range: lowest still rescued to rangeMin', () => {
      // spread = 60, full range = 16 dB (±8) → impossible to fit all bands
      const pivot = computeHeadroomPivot(70, 10, -8)
      expect(pivot).toBe(18)       // = 10 - (-8) = 18
      expect(10 - pivot).toBe(-8) // lowest at rangeMin
      expect(70 - pivot).toBe(52) // highest clips heavily — unavoidable
    })
  })
})
