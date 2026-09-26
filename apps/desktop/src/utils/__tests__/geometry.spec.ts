import { describe, expect, it } from 'vitest'
import { AngularDiffSigned, AnglesInClockwiseSequence, sectorBoundingBox } from '@/utils/geometry'

const TWO_PI = 2 * Math.PI

describe('utils/geometry', () => {
  describe('AngularDiffSigned', () => {
    it('returns the positive angular difference in (0, 2π]', () => {
      expect(AngularDiffSigned(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2, 10)
      expect(AngularDiffSigned(0, Math.PI)).toBeCloseTo(Math.PI, 10)
    })

    it('wraps backwards differences into the positive range', () => {
      expect(AngularDiffSigned(Math.PI / 2, 0)).toBeCloseTo((3 * Math.PI) / 2, 10)
      expect(AngularDiffSigned(0, -Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 10)
    })

    it('normalizes equal angles to a full turn', () => {
      expect(AngularDiffSigned(0, 0)).toBeCloseTo(TWO_PI, 10)
      expect(AngularDiffSigned(0, TWO_PI)).toBeCloseTo(TWO_PI, 10)
    })

    it('handles angles beyond one turn', () => {
      expect(AngularDiffSigned(0, 2 * TWO_PI + Math.PI)).toBeCloseTo(Math.PI, 10)
    })
  })

  describe('AnglesInClockwiseSequence', () => {
    it('is true for clockwise ordered angles', () => {
      expect(AnglesInClockwiseSequence(0, Math.PI / 2, Math.PI)).toBe(true)
    })

    it('is false for counter-clockwise ordered angles', () => {
      expect(AnglesInClockwiseSequence(Math.PI, Math.PI / 2, 0)).toBe(false)
    })
  })

  describe('sectorBoundingBox', () => {
    it('returns a box spanning both endpoints plus the swept circle extremity', () => {
      // Half-circle arc on the right-hand side of a circle centered at the origin.
      const box = sectorBoundingBox({ x: 0, y: -10 }, { x: 0, y: 10 }, { x: 0, y: 0 }, 10)

      expect(box.x).toBeCloseTo(0, 10)
      expect(box.y).toBeCloseTo(-10, 10)
      expect(box.width).toBeCloseTo(10, 10)
      expect(box.height).toBeCloseTo(20, 10)
    })

    it('includes endpoints even without additional extremities', () => {
      // Small arc fully contained in one quadrant: only endpoints matter for x/y bounds
      const box = sectorBoundingBox(
        { x: 5, y: 5 },
        { x: 7, y: 7 },
        { x: 0, y: 0 },
        10,
      )

      expect(box.x).toBeLessThanOrEqual(5)
      expect(box.y).toBeLessThanOrEqual(5)
      expect(box.x + box.width).toBeGreaterThanOrEqual(7)
      expect(box.y + box.height).toBeGreaterThanOrEqual(7)
    })
  })
})
