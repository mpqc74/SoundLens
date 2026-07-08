import { describe, it, expect } from 'vitest'
import { computeHeadroomPivot } from '../../src/core/pipeline'

describe('computeHeadroomPivot', () => {
  describe('no overflow — spread fits within range', () => {
    it('spread < range: anchors highest at 0', () => {
      // spread = 10, range = 12 → no overflow
      const pivot = computeHeadroomPivot(40, 30, 12)
      expect(pivot).toBe(40)
      expect(40 - pivot).toBe(0)   // highest sits at 0
      expect(30 - pivot).toBe(-10) // lowest well above -range
    })

    it('spread = range (boundary): still anchors highest at 0', () => {
      // spread = 12, range = 12 → exact boundary; no overflow
      const pivot = computeHeadroomPivot(42, 30, 12)
      expect(pivot).toBe(42)
      expect(42 - pivot).toBe(0)   // highest at 0
      expect(30 - pivot).toBe(-12) // lowest exactly at -range
    })

    it('single band (spread = 0): anchors highest at 0', () => {
      const pivot = computeHeadroomPivot(20, 20, 12)
      expect(pivot).toBe(20)
      expect(20 - pivot).toBe(0)
    })
  })

  describe('overflow — spread exceeds range; lowest rescued to -range', () => {
    it('spread just above range: lowest sits at -range, highest floats above 0', () => {
      // spread = 13, range = 12 → overflow by 1
      const pivot = computeHeadroomPivot(43, 30, 12)
      expect(pivot).toBe(42)        // = rawMin + range = 30 + 12 = 42
      expect(30 - pivot).toBe(-12) // lowest at -range
      expect(43 - pivot).toBe(1)   // highest at +1 (floats above 0)
    })

    it('large spread on tight range (Tesla ±8 dB): lowest rescued to -range', () => {
      // spread = 20, range = 8 → overflow
      const pivot = computeHeadroomPivot(30, 10, 8)
      expect(pivot).toBe(18)       // = rawMin + range = 10 + 8 = 18
      expect(10 - pivot).toBe(-8) // lowest at -range
      expect(30 - pivot).toBe(12) // highest at +12 (clips above range, unavoidable)
    })

    it('spread exceeds full EQ range: lowest still rescued to -range', () => {
      // spread = 60, full range = 16 dB (±8) → impossible to fit all bands
      const pivot = computeHeadroomPivot(70, 10, 8)
      expect(pivot).toBe(18)       // = rawMin + range = 10 + 8 = 18
      expect(10 - pivot).toBe(-8) // lowest at -range
      expect(70 - pivot).toBe(52) // highest clips heavily — unavoidable
    })
  })
})
