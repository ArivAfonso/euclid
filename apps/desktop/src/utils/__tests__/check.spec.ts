import { describe, expect, it } from 'vitest'
import { ActiveSelection, Circle, FabricObject, Gradient, Group, Textbox } from 'fabric'
import { check } from '@/utils/check'

describe('utils/check', () => {
  describe('isCollection', () => {
    it('returns true for objects exposing an internal object list', () => {
      const group = new Group([])
      expect(check.isCollection(group)).toBe(true)
    })

    it('returns false for plain objects and empty values', () => {
      expect(check.isCollection({})).toBe(false)
      expect(check.isCollection(null)).toBe(false)
      expect(check.isCollection(undefined)).toBe(false)
      expect(check.isCollection('str')).toBe(false)
    })
  })

  describe('isGroup / isNativeGroup', () => {
    it('identifies fabric Groups', () => {
      const group = new Group([])
      expect(check.isGroup(group)).toBe(true)
      expect(check.isGroup(new Circle())).toBe(false)
      expect(check.isGroup(undefined)).toBe(false)
    })

    it('treats fabric 6 Groups as native groups (both names resolve to the same class)', () => {
      // In fabric 6 the legacy non-native Group no longer exists; `Group` and the
      // "native" Group reference are the same class, so both checks return true.
      expect(check.isNativeGroup(new Group([]))).toBe(true)
      expect(check.isNativeGroup(new Circle())).toBe(false)
    })
  })

  describe('isActiveSelection', () => {
    it('identifies ActiveSelection instances', () => {
      const selection = new ActiveSelection([new Circle(), new Circle()])
      expect(check.isActiveSelection(selection)).toBe(true)
      expect(check.isActiveSelection(new Circle())).toBe(false)
    })
  })

  describe('isTextObject', () => {
    it('detects text-like fabrics objects', () => {
      const textbox = new Textbox('hello')
      expect(check.isTextObject(textbox)).toBe(true)
      expect(check.isTextObject(new Circle())).toBe(false)
      expect(check.isTextObject(undefined)).toBe(false)
    })
  })

  describe('isGradient / isPattern', () => {
    it('detects gradient instances', () => {
      const gradient = new Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 100, y2: 0 },
        colorStops: [
          { offset: 0, color: 'red' },
          { offset: 1, color: 'blue' },
        ],
      })
      expect(check.isGradient(gradient)).toBe(true)
      expect(check.isGradient('not-a-gradient')).toBe(false)
      expect(check.isGradient({})).toBe(false)
    })

    it('returns false for non-pattern values', () => {
      expect(check.isPattern('nope')).toBe(false)
      expect(check.isPattern(null)).toBe(false)
    })
  })

  describe('isCircle', () => {
    it('identifies circles', () => {
      expect(check.isCircle(new Circle())).toBe(true)
      expect(check.isCircle(new FabricObject())).toBe(false)
    })
  })
})
