import { describe, expect, it } from 'vitest'
import { HOTKEY_DOC, KEYS } from '@/configs/hotkey'

describe('configs/hotkey', () => {
  describe('KEYS map', () => {
    it('maps every shortcut key to its KeyboardEvent.key name', () => {
      expect(KEYS.C).toBe('C')
      expect(KEYS.V).toBe('V')
      expect(KEYS.X).toBe('X')
      expect(KEYS.Z).toBe('Z')
      expect(KEYS.Y).toBe('Y')
      expect(KEYS.DELETE).toBe('DELETE')
      expect(KEYS.BACKSPACE).toBe('BACKSPACE')
      expect(KEYS.ESC).toBe('ESCAPE')
      expect(KEYS.UP).toBe('ARROWUP')
      expect(KEYS.DOWN).toBe('ARROWDOWN')
      expect(KEYS.LEFT).toBe('ARROWLEFT')
      expect(KEYS.RIGHT).toBe('ARROWRIGHT')
      expect(KEYS.PAGEUP).toBe('PAGEUP')
      expect(KEYS.PAGEDOWN).toBe('PAGEDOWN')
      expect(KEYS.SPACE).toBe(' ')
      expect(KEYS.ENTER).toBe('ENTER')
      expect(KEYS.TAB).toBe('TAB')
      expect(KEYS.MINUS).toBe('-')
      expect(KEYS.EQUAL).toBe('=')
    })
  })

  describe('HOTKEY_DOC', () => {
    it('contains non-empty groups with documented labels', () => {
      expect(HOTKEY_DOC.length).toBeGreaterThan(0)

      for (const group of HOTKEY_DOC) {
        expect(group.type.length).toBeGreaterThan(0)
        expect(group.children.length).toBeGreaterThan(0)

        for (const child of group.children) {
          expect(child.label.length).toBeGreaterThan(0)
          expect(child.value.length).toBeGreaterThan(0)
        }
      }
    })

    it('has no duplicate label/value pairs inside a group', () => {
      // NOTE: a label may intentionally appear more than once with different
      // bindings (e.g. "Next Page" -> "↓ / → / PgDown" and "Enter / Space"),
      // but the same label must never document the same binding twice.
      for (const group of HOTKEY_DOC) {
        const pairs = group.children.map((child) => `${child.label}::${child.value}`)
        expect(new Set(pairs).size).toBe(pairs.length)
      }
    })

    it('documents the core editing shortcuts', () => {
      const allValues = HOTKEY_DOC.flatMap((group) => group.children.map((child) => child.value))

      for (const expected of ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + Z', 'Ctrl + Y', 'Ctrl + G']) {
        expect(allValues).toContain(expected)
      }
    })

    it('documents page and zoom shortcuts', () => {
      const allValues = HOTKEY_DOC.flatMap((group) => group.children.map((child) => child.value))

      expect(allValues.some((value) => value.includes('Ctrl + ='))).toBe(true)
      expect(allValues.some((value) => value.includes('Ctrl + -'))).toBe(true)
      expect(allValues.some((value) => value.includes('Enter'))).toBe(true)
      expect(allValues.some((value) => value.includes('F5'))).toBe(true)
    })
  })
})
