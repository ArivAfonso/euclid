import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useKeyboardStore } from '@/store/modules/keyboard'

describe('store/keyboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with all modifier keys released', () => {
    const store = useKeyboardStore()
    expect(store.ctrlKeyState).toBe(false)
    expect(store.shiftKeyState).toBe(false)
    expect(store.spaceKeyState).toBe(false)
  })

  it('tracks ctrl/shift/space key state independently', () => {
    const store = useKeyboardStore()

    store.setCtrlKeyState(true)
    expect(store.ctrlKeyState).toBe(true)
    expect(store.shiftKeyState).toBe(false)

    store.setShiftKeyState(true)
    expect(store.shiftKeyState).toBe(true)

    store.setSpaceKeyState(true)
    expect(store.spaceKeyState).toBe(true)

    store.setCtrlKeyState(false)
    store.setShiftKeyState(false)
    store.setSpaceKeyState(false)
    expect(store.ctrlKeyState).toBe(false)
    expect(store.shiftKeyState).toBe(false)
    expect(store.spaceKeyState).toBe(false)
  })

  describe('ctrlOrShiftKeyActive getter', () => {
    it('is false when neither key is pressed', () => {
      const store = useKeyboardStore()
      expect(store.ctrlOrShiftKeyActive).toBe(false)
    })

    it('is true when ctrl is pressed', () => {
      const store = useKeyboardStore()
      store.setCtrlKeyState(true)
      expect(store.ctrlOrShiftKeyActive).toBe(true)
    })

    it('is true when shift is pressed', () => {
      const store = useKeyboardStore()
      store.setShiftKeyState(true)
      expect(store.ctrlOrShiftKeyActive).toBe(true)
    })

    it('ignores the space key', () => {
      const store = useKeyboardStore()
      store.setSpaceKeyState(true)
      expect(store.ctrlOrShiftKeyActive).toBe(false)
    })
  })
})
