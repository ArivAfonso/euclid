import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PiBy180,
  checkPointsEquals,
  clamp,
  clampAngle,
  getRandomNum,
  halfPI,
  isExternal,
  isMobile,
  nonid,
  toFixed,
} from '@/utils/common'

describe('utils/common', () => {
  describe('getRandomNum', () => {
    it('scales Math.random() by the given span', () => {
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      expect(getRandomNum(10, 20)).toBe(5) // 0.5 * (20 - 10)
      randomSpy.mockRestore()
    })

    it('stays within [0, max - min)', () => {
      for (let i = 0; i < 100; i++) {
        const value = getRandomNum(10, 20)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(10)
      }
    })
  })

  describe('nonid', () => {
    it('produces an id of the requested length using the alphanumeric alphabet', () => {
      const id = nonid(12)
      expect(id).toHaveLength(12)
      expect(id).toMatch(/^[0-9A-Za-z]{12}$/)
    })

    it('produces distinct values across calls', () => {
      const ids = new Set(Array.from({ length: 50 }, () => nonid(16)))
      expect(ids.size).toBe(50)
    })
  })

  describe('checkPointsEquals', () => {
    it('returns true for equal point lists', () => {
      expect(checkPointsEquals([{ x: 1, y: 2 }, { x: 3, y: 4 }], [{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe(true)
    })

    it('returns false when lengths differ', () => {
      expect(checkPointsEquals([{ x: 1, y: 2 }], [{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe(false)
    })

    it('returns false when any coordinate differs', () => {
      expect(checkPointsEquals([{ x: 1, y: 2 }], [{ x: 1, y: 3 }])).toBe(false)
    })

    it('returns false for a missing value', () => {
      expect(checkPointsEquals(undefined as never, [{ x: 1, y: 2 }])).toBe(false)
    })
  })

  describe('isExternal', () => {
    it.each([
      ['https://example.com', true],
      ['http://example.com', true],
      ['mailto:test@example.com', true],
      ['tel:+123456', true],
      ['/relative/path', false],
      ['file:///tmp/file.txt', false],
      ['ftp://example.com', false],
    ])('isExternal(%s) -> %s', (path, expected) => {
      expect(isExternal(path)).toBe(expected)
    })
  })

  describe('clamp', () => {
    it('returns the value when inside the range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('clamps to the lower bound', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('clamps to the upper bound', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('supports inverted bounds by normalizing them', () => {
      expect(clamp(5, 10, 0)).toBe(5)
      expect(clamp(-1, 10, 0)).toBe(0)
      expect(clamp(100, 10, 0)).toBe(10)
    })
  })

  describe('isMobile', () => {
    const setUserAgent = (ua: string) => {
      Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
    }

    afterEach(() => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) jsdom')
    })

    it.each([
      ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', true],
      ['Mozilla/5.0 (Linux; Android 14; Pixel 8)', true],
      ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', true],
      ['Mozilla/5.0 (Linux; Android 10; HarmonyOS)', true],
      ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', false],
      ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605', false],
    ])('detects "%s" -> %s', (ua, expected) => {
      setUserAgent(ua)
      expect(isMobile()).toBe(expected)
    })
  })

  describe('clampAngle', () => {
    it.each([
      [0, 0],
      [90, 90],
      [180, 180],
      [190, -170],
      [360, 0],
      [450, 90],
      [-90, -90],
      [-190, 170],
    ])('clampAngle(%s) -> %s', (input, expected) => {
      expect(clampAngle(input)).toBe(expected)
    })
  })

  describe('toFixed', () => {
    it('rounds to two decimals by default', () => {
      expect(toFixed(3.14159)).toBe(3.14)
      expect(toFixed(2.71828)).toBe(2.72)
    })

    it('supports a custom precision', () => {
      expect(toFixed(3.14159, 4)).toBe(3.1416)
      expect(toFixed(3.14159, 0)).toBe(3)
    })

    it('leaves integers unchanged', () => {
      expect(toFixed(42)).toBe(42)
    })
  })

  describe('constants', () => {
    it('exposes common angle conversions', () => {
      expect(PiBy180).toBeCloseTo(Math.PI / 180, 10)
      expect(halfPI).toBeCloseTo(Math.PI / 2, 10)
    })
  })
})
