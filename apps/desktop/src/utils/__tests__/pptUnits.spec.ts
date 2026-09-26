import { describe, expect, it } from 'vitest'
import {
  EMU_PER_INCH,
  EMU_PER_PX,
  PT_PER_INCH,
  PX_PER_INCH,
  dashArrayToPPTDashStyle,
  emuToPx,
  hexToRgbString,
  inchesToPx,
  normalizeAngle,
  opacityToPercent,
  parseColorToPPT,
  pxToEMU,
  pxToInches,
  pxToPoints,
} from '@/utils/pptUnits'

describe('utils/pptUnits', () => {
  describe('constants', () => {
    it('uses the 96 DPI screen standard', () => {
      expect(PX_PER_INCH).toBe(96)
      expect(PT_PER_INCH).toBe(72)
      expect(EMU_PER_INCH).toBe(914400)
      expect(EMU_PER_PX).toBe(9525)
    })
  })

  describe('pxToPoints', () => {
    it('converts 96 px to 72 pt (0.75 ratio)', () => {
      expect(pxToPoints(96)).toBe(72)
      expect(pxToPoints(16)).toBe(12)
      expect(pxToPoints(1)).toBe(0.75)
      expect(pxToPoints(0)).toBe(0)
    })
  })

  describe('pxToInches / inchesToPx', () => {
    it('converts between pixels and inches', () => {
      expect(pxToInches(96)).toBe(1)
      expect(pxToInches(1920)).toBe(20)
      expect(inchesToPx(1)).toBe(96)
      expect(inchesToPx(8.5)).toBeCloseTo(816, 10)
    })

    it('round-trips', () => {
      expect(inchesToPx(pxToInches(500))).toBeCloseTo(500, 10)
    })
  })

  describe('pxToEMU / emuToPx', () => {
    it('converts pixels to EMU with rounding', () => {
      expect(pxToEMU(1)).toBe(9525)
      expect(pxToEMU(96)).toBe(914400)
      expect(pxToEMU(0.5)).toBe(4763) // Math.round(4762.5)
      expect(pxToEMU(0)).toBe(0)
    })

    it('converts EMU back to pixels', () => {
      expect(emuToPx(914400)).toBe(96)
      expect(emuToPx(9525)).toBe(1)
    })

    it('round-trips within rounding tolerance', () => {
      expect(emuToPx(pxToEMU(1920))).toBeCloseTo(1920, 6)
    })
  })

  describe('normalizeAngle', () => {
    it.each([
      [0, 0],
      [90, 90],
      [360, 0],
      [450, 90],
      [-90, 270],
      [-450, 270],
      [720, 0],
    ])('normalizeAngle(%s) -> %s', (input, expected) => {
      expect(normalizeAngle(input)).toBe(expected)
    })
  })

  describe('parseColorToPPT', () => {
    it('strips the leading # from 6-digit hex colors', () => {
      expect(parseColorToPPT('#FF0000')).toBe('FF0000')
      expect(parseColorToPPT('FF0000')).toBe('FF0000')
    })

    it('expands 3-digit hex colors', () => {
      expect(parseColorToPPT('#F00')).toBe('FF0000')
      expect(parseColorToPPT('abc')).toBe('aabbcc')
    })

    it('converts rgb()/rgba() strings to hex', () => {
      expect(parseColorToPPT('rgb(255, 0, 0)')).toBe('ff0000')
      expect(parseColorToPPT('rgba(0, 128, 255, 0.5)')).toBe('0080ff')
    })

    it('falls back to 000000 for invalid input', () => {
      expect(parseColorToPPT('')).toBe('000000')
      expect(parseColorToPPT(null)).toBe('000000')
      expect(parseColorToPPT(undefined)).toBe('000000')
      expect(parseColorToPPT('not-a-color')).toBe('000000')
      expect(parseColorToPPT('#12345')).toBe('000000')
    })
  })

  describe('hexToRgbString', () => {
    it('converts hex to an rgb() string', () => {
      expect(hexToRgbString('#0080ff')).toBe('rgb(0, 128, 255)')
      expect(hexToRgbString('000000')).toBe('rgb(0, 0, 0)')
      expect(hexToRgbString('#ffffff')).toBe('rgb(255, 255, 255)')
    })
  })

  describe('opacityToPercent', () => {
    it.each([
      [0, 0],
      [0.5, 50],
      [1, 100],
      [0.123, 12],
      [0.126, 13],
    ])('opacityToPercent(%s) -> %s', (input, expected) => {
      expect(opacityToPercent(input)).toBe(expected)
    })

    it('clamps out-of-range values', () => {
      expect(opacityToPercent(-0.5)).toBe(0)
      expect(opacityToPercent(1.5)).toBe(100)
    })
  })

  describe('dashArrayToPPTDashStyle', () => {
    it.each([
      [undefined, 'solid'],
      [null, 'solid'],
      [[], 'solid'],
      [[5, 5], 'dash'],
      [[5, 2], 'dash'],
      [[3, 3], 'dot'],
      [[2, 2], 'dot'],
      [[10, 5], 'lgDash'],
      [[10, 5, 2, 5], 'dashDot'],
      [[10, 5, 5, 5], 'dashDot'],
      [[1, 2, 3], 'solid'],
      [[7], 'solid'],
    ] as const)('maps %j -> %s', (input, expected) => {
      expect(dashArrayToPPTDashStyle(input as number[] | null | undefined)).toBe(expected)
    })
  })
})
