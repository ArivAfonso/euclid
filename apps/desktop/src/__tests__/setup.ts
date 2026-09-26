/**
 * Global setup for Vitest (unit + component tests).
 *
 * jsdom is missing a handful of browser APIs the app relies on (FontFaceSet,
 * ResizeObserver, 2D canvas contexts, ...). This file installs lightweight
 * stand-ins so application modules can run unmodified under Node.
 */
import 'fake-indexeddb/auto'
import { beforeEach } from 'vitest'

// ─────────────────────────────────────────────────────────────
// localStorage: start every test from a clean slate
// ─────────────────────────────────────────────────────────────
beforeEach(() => {
  localStorage.clear()
})

// ─────────────────────────────────────────────────────────────
// window.matchMedia (used by responsive components / dark mode)
// ─────────────────────────────────────────────────────────────
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// ─────────────────────────────────────────────────────────────
// Observers (jsdom does not implement them)
// ─────────────────────────────────────────────────────────────
class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', { writable: true, value: MockObserver })
}
if (!('IntersectionObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'IntersectionObserver', { writable: true, value: MockObserver })
}

// ─────────────────────────────────────────────────────────────
// requestIdleCallback (deferred localStorage writes in useProjects)
// ─────────────────────────────────────────────────────────────
if (!('requestIdleCallback' in window)) {
  Object.defineProperty(window, 'requestIdleCallback', {
    writable: true,
    value: (cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) =>
      setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0),
  })
  Object.defineProperty(window, 'cancelIdleCallback', {
    writable: true,
    value: (id: number) => clearTimeout(id),
  })
}

// requestAnimationFrame — jsdom provides it via pretendToBeVisual, but keep a
// fallback so yieldToPaint() (double-rAF) can never hang the suite.
if (typeof window.requestAnimationFrame !== 'function') {
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16),
  })
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    value: (id: number) => clearTimeout(id),
  })
}

// ─────────────────────────────────────────────────────────────
// document.fonts (FontFaceSet) — main store loads fonts eagerly
// ─────────────────────────────────────────────────────────────
if (!('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      ready: Promise.resolve(),
      size: 0,
      add: () => {},
      delete: () => {},
      check: () => true,
      clear: () => {},
      forEach: () => {},
      load: () => Promise.resolve([]),
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Canvas 2D context — jsdom returns null, fabric.js needs *something*
// ─────────────────────────────────────────────────────────────
const createMockContext2D = () => {
  const state: Record<string, unknown> = {}

  const noop = () => undefined

  return new Proxy(state, {
    get(target, prop: string) {
      switch (prop) {
        case 'measureText':
          return (text: string) => ({
            width: String(text).length * 8,
            actualBoundingBoxAscent: 8,
            actualBoundingBoxDescent: 2,
          })
        case 'getImageData':
        case 'createImageData':
          return (w: number, h: number) => ({
            data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
            width: w,
            height: h,
          })
        case 'createLinearGradient':
        case 'createRadialGradient':
          return () => ({ addColorStop: noop })
        case 'getLineDash':
          return () => []
        case 'isPointInPath':
        case 'isPointInStroke':
          return () => false
        default:
          return prop in target ? target[prop] : noop
      }
    },
    set(target, prop: string, value) {
      target[prop] = value
      return true
    },
  })
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: function getContext(this: HTMLCanvasElement) {
    return createMockContext2D()
  },
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  configurable: true,
  writable: true,
  value: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
})

// ─────────────────────────────────────────────────────────────
// Misc browser APIs used by export / clipboard helpers
// ─────────────────────────────────────────────────────────────
if (!('clipboard' in navigator)) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: () => Promise.resolve(),
      readText: () => Promise.resolve(''),
      write: () => Promise.resolve(),
      read: () => Promise.resolve([]),
    },
  })
}

if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: () => 'blob:mock-url',
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: () => {},
  })
}

if (typeof window.scrollTo !== 'function') {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} })
}
