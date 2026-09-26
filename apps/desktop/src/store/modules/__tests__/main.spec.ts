import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { FabricObject } from 'fabric'
import { useMainStore } from '@/store/modules/main'

const darkMediaQuery = () =>
  ({
    matches: true,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

describe('store/main', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.documentElement.classList.remove('dark')
  })

  describe('initial state', () => {
    it('defaults to sensible editor state', () => {
      const store = useMainStore()

      expect(store.poolType).toBe('editor')
      expect(store.rightState).toBe('design')
      expect(store.exportType).toBe('image')
      expect(store.isDarkMode).toBe(false)
      expect(store.imageLoadingTasks).toBe(0)
      expect(store.savingProject).toBe(false)
      expect(store.handleElementId).toBe('')
      expect(store.selectedTemplatesIndex).toEqual([])
    })

    it('hydrates unitMode from localStorage', () => {
      localStorage.setItem('unitMode', '2')
      const store = useMainStore()
      expect(store.unitMode).toBe(2)
    })

    it('falls back to mm (0) for invalid stored unitMode', () => {
      localStorage.setItem('unitMode', 'not-a-number')
      const store = useMainStore()
      expect(store.unitMode).toBe(0)
    })

    it('hydrates dark mode from the stored theme', () => {
      localStorage.setItem('theme', 'dark')
      const store = useMainStore()
      expect(store.isDarkMode).toBe(true)
    })

    it('respects the OS color scheme when no theme is stored', () => {
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        ...darkMediaQuery(),
        matches: query.includes('prefers-color-scheme: dark'),
      }))

      const store = useMainStore()
      expect(store.isDarkMode).toBe(true)
    })
  })

  describe('theme handling', () => {
    it('toggleDarkMode flips state, DOM class, storage and emits an event', () => {
      const store = useMainStore()
      const listener = vi.fn()
      window.addEventListener('theme-changed', listener)

      store.toggleDarkMode()

      expect(store.isDarkMode).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(listener).toHaveBeenCalledTimes(1)

      store.toggleDarkMode()

      expect(store.isDarkMode).toBe(false)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(localStorage.getItem('theme')).toBe('light')
      expect(listener).toHaveBeenCalledTimes(2)

      window.removeEventListener('theme-changed', listener)
    })

    it('setDarkMode can force a mode', () => {
      const store = useMainStore()

      store.setDarkMode(true)
      expect(store.isDarkMode).toBe(true)
      expect(localStorage.getItem('theme')).toBe('dark')

      store.setDarkMode(false)
      expect(store.isDarkMode).toBe(false)
      expect(localStorage.getItem('theme')).toBe('light')
    })
  })

  describe('UI state actions', () => {
    it('stores pool / right panel selections', () => {
      const store = useMainStore()

      store.setPoolType('pages')
      expect(store.poolType).toBe('pages')

      store.setRightState('image')
      expect(store.rightState).toBe('image')

      store.setExportType('pdf' as never)
      expect(store.exportType).toBe('pdf')
    })

    it('tracks focus flags', () => {
      const store = useMainStore()

      store.setDrawAreaFocus(true)
      expect(store.drawAreaFocus).toBe(true)

      store.setThumbnailsFocus(true)
      expect(store.thumbnailsFocus).toBe(true)
    })

    it('tracks selected template indexes', () => {
      const store = useMainStore()
      store.updateSelectedTemplatesIndex([3, 5])
      expect(store.selectedTemplatesIndex).toEqual([3, 5])
    })

    it('toggles saving state', () => {
      const store = useMainStore()
      store.setSavingProject(true)
      expect(store.savingProject).toBe(true)
      store.setSavingProject(false)
      expect(store.savingProject).toBe(false)
    })

    it('counts concurrent image loading tasks without going negative', () => {
      const store = useMainStore()

      store.startImageLoading()
      store.startImageLoading()
      expect(store.imageLoadingTasks).toBe(2)

      store.finishImageLoading()
      expect(store.imageLoadingTasks).toBe(1)

      store.finishImageLoading()
      store.finishImageLoading()
      expect(store.imageLoadingTasks).toBe(0)
    })

    it('stores the active canvas object', () => {
      const store = useMainStore()
      const object = new FabricObject()

      store.setCanvasObject(object)
      // Pinia wraps state reactively, so compare structurally (proxy != raw instance)
      expect(store.canvasObject).toEqual(object)

      store.setCanvasObject(undefined)
      expect(store.canvasObject).toBeUndefined()
    })
  })

  describe('custom fonts', () => {
    const fontRecord = {
      id: 1,
      family: 'Test Family',
      weight: 400,
      style: 'normal' as const,
      format: 'truetype' as const,
      data: new ArrayBuffer(8),
      fileName: 'test-family.ttf',
      createdAt: 1,
      updatedAt: 2,
    }

    it('registers custom font families in font options and groups', () => {
      const store = useMainStore()

      store.updateCustomFonts([fontRecord])

      expect(store.customFonts).toHaveLength(1)
      expect(store.customFonts[0].family).toBe('Test Family')
      expect(store.customFontByFamily('Test Family')).toBeTruthy()
      expect(store.fontOptions[0]).toEqual({ label: 'Test Family', value: 'Test Family' })
      expect(store.fontGroups[0].label).toBe('Custom Fonts')
    })

    it('exposes a reactive lookup for missing families', () => {
      const store = useMainStore()
      expect(store.customFontByFamily('Missing')).toBeUndefined()
    })
  })
})
