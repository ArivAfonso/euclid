import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_THUMBNAIL_SIDE,
  getTemplateBounds,
  getThumbnailGeometry,
  renderTemplateThumbnail,
} from '@/utils/templateThumbnail'

// jsdom has no 2D canvas, so fabric is replaced by a recording fake. The real
// rendering is covered by the Playwright bulk-import spec.
const fabric = vi.hoisted(() => {
  const canvases: any[] = []
  return {
    canvases,
    enlivenObjects: vi.fn(),
    toDataURL: vi.fn((_options?: unknown) => 'data:image/jpeg;base64,FAKE'),
  }
})

vi.mock('fabric', () => {
  class StaticCanvas {
    options: any
    objects: any[] = []
    backgroundColor = ''
    viewportTransform: number[] | null = null
    disposed = false
    renderAll = vi.fn()
    constructor(_el: unknown, options: any) {
      this.options = options
      fabric.canvases.push(this)
    }
    setViewportTransform(vpt: number[]) {
      this.viewportTransform = vpt
    }
    add(obj: any) {
      this.objects.push(obj)
    }
    toDataURL(options: any) {
      return fabric.toDataURL(options)
    }
    dispose() {
      this.disposed = true
      return Promise.resolve(true)
    }
  }
  return { StaticCanvas, util: { enlivenObjects: fabric.enlivenObjects } }
})

const workspace = (overrides: Record<string, unknown> = {}) => ({
  id: 'WorkSpaceDrawType',
  type: 'Rect',
  left: 0,
  top: 0,
  width: 1080,
  height: 1080,
  fill: '#ffffff',
  ...overrides,
})

const template = (overrides: Record<string, unknown> = {}) => ({
  version: '6.7.1',
  id: 't1',
  background: 'rgba(255,255,255,0)',
  objects: [workspace()],
  workSpace: { fillType: 0, left: 0, top: 0, angle: 0, scaleX: 1, scaleY: 1, fill: '#ffffff' },
  zoom: 1,
  width: 1080,
  height: 1080,
  ...overrides,
})

describe('utils/templateThumbnail', () => {
  describe('getTemplateBounds', () => {
    it('uses the workspace rect', () => {
      const bounds = getTemplateBounds(
        template({ objects: [workspace({ left: 10, top: 20, width: 500, height: 300 })] }) as never,
      )
      expect(bounds).toEqual({ left: 10, top: 20, width: 500, height: 300 })
    })

    it('accounts for the workspace scale', () => {
      const bounds = getTemplateBounds(
        template({ objects: [workspace({ width: 100, height: 50, scaleX: 2, scaleY: 3 })] }) as never,
      )
      expect(bounds).toMatchObject({ width: 200, height: 150 })
    })

    it('falls back to the template size without a workspace rect', () => {
      const bounds = getTemplateBounds(template({ objects: [], width: 640, height: 480 }) as never)
      expect(bounds).toEqual({ left: 0, top: 0, width: 640, height: 480 })
    })

    it('divides the editor zoom out of the template size', () => {
      const bounds = getTemplateBounds(
        template({ objects: [], width: 540, height: 1220, zoom: 0.5 }) as never,
      )
      expect(bounds.width).toBeCloseTo(1080)
      expect(bounds.height).toBeCloseTo(2440)
    })
  })

  describe('getThumbnailGeometry', () => {
    it('targets ~400px wide for typical artboards', () => {
      expect(getThumbnailGeometry({ width: 1080, height: 1080 })).toMatchObject({ width: 400, height: 400 })
      // 400/1920 < 0.3, so the editor's 30% floor applies
      expect(getThumbnailGeometry({ width: 1920, height: 1080 })).toMatchObject({ width: 576, height: 324 })
    })

    it('upscales small artboards instead of leaving tiny thumbnails', () => {
      const geometry = getThumbnailGeometry({ width: 200, height: 100 })
      expect(geometry.width).toBe(400)
      expect(geometry.height).toBe(200)
    })

    it('keeps large artboards at 30% scale', () => {
      // 400/4000 < 0.3, so the 30% floor applies (and 1600px cap is not hit)
      expect(getThumbnailGeometry({ width: 4000, height: 2000 })).toMatchObject({
        scale: 0.3,
        width: 1200,
        height: 600,
      })
    })

    it('bounds the long side for very tall artboards', () => {
      const geometry = getThumbnailGeometry({ width: 1000, height: 20000 })
      expect(geometry.height).toBeLessThanOrEqual(MAX_THUMBNAIL_SIDE)
      expect(geometry.width).toBeGreaterThanOrEqual(1)
    })
  })

  describe('renderTemplateThumbnail', () => {
    beforeEach(() => {
      fabric.canvases.length = 0
      fabric.enlivenObjects.mockReset()
      fabric.enlivenObjects.mockImplementation(async ([obj]: any[]) => [{ hydrated: obj.id }])
      fabric.toDataURL.mockClear()
    })

    it('renders the artboard region into a JPEG data URL', async () => {
      const url = await renderTemplateThumbnail(
        template({
          width: 1920,
          height: 1080,
          objects: [workspace({ left: 100, top: 50, width: 1920, height: 1080 })],
        }) as never,
      )

      expect(url).toBe('data:image/jpeg;base64,FAKE')
      const [canvas] = fabric.canvases
      expect(canvas.options).toMatchObject({ width: 576, height: 324 })
      // Artboard origin maps to the thumbnail's top-left
      const scale = 0.3
      expect(canvas.viewportTransform).toEqual([scale, 0, 0, scale, -100 * scale, -50 * scale])
      expect(canvas.backgroundColor).toBe('#ffffff')
      expect(canvas.renderAll).toHaveBeenCalled()
      expect(fabric.toDataURL).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'jpeg', multiplier: 1 }),
      )
      expect(canvas.disposed).toBe(true)
    })

    it('draws objects in order and skips editor-only guide objects', async () => {
      await renderTemplateThumbnail(
        template({
          objects: [
            workspace(),
            { id: 'a', type: 'Rect' },
            { id: 'WorkSpaceSafeType', type: 'Rect' },
            { id: 'b', type: 'Textbox' },
          ],
        }) as never,
      )

      const [canvas] = fabric.canvases
      expect(canvas.objects.map((o: any) => o.hydrated)).toEqual(['WorkSpaceDrawType', 'a', 'b'])
    })

    it('still renders when one object fails to load', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      fabric.enlivenObjects.mockImplementation(async ([obj]: any[]) => {
        if (obj.id === 'broken-image') throw new Error('image 404')
        return [{ hydrated: obj.id }]
      })

      const url = await renderTemplateThumbnail(
        template({
          objects: [workspace(), { id: 'broken-image', type: 'Image' }, { id: 'ok', type: 'Rect' }],
        }) as never,
      )

      expect(url).toBe('data:image/jpeg;base64,FAKE')
      const [canvas] = fabric.canvases
      expect(canvas.objects.map((o: any) => o.hydrated)).toEqual(['WorkSpaceDrawType', 'ok'])
      expect(warn).toHaveBeenCalled()
    })

    it('abandons an object that never finishes loading', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      fabric.enlivenObjects.mockImplementation(
        ([obj]: any[], { signal }: { signal: AbortSignal }) =>
          obj.id === 'slow'
            ? new Promise((_resolve, reject) => signal.addEventListener('abort', reject))
            : Promise.resolve([{ hydrated: obj.id }]),
      )

      const url = await renderTemplateThumbnail(
        template({ objects: [workspace(), { id: 'slow', type: 'Image' }] }) as never,
        { timeoutMs: 10 },
      )

      expect(url).toBe('data:image/jpeg;base64,FAKE')
      expect(fabric.canvases[0].objects.map((o: any) => o.hydrated)).toEqual(['WorkSpaceDrawType'])
    })

    it('returns an empty string when the canvas cannot be exported', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      fabric.toDataURL.mockImplementationOnce(() => {
        throw new Error('Tainted canvases may not be exported')
      })

      const url = await renderTemplateThumbnail(template() as never)

      expect(url).toBe('')
      expect(error).toHaveBeenCalled()
      // The offscreen canvas is still released
      expect(fabric.canvases[0].disposed).toBe(true)
    })

    it('falls back to a white backdrop for non-colour workspace fills', async () => {
      await renderTemplateThumbnail(
        template({
          workSpace: { fillType: 1, fill: { type: 'linear' } },
        }) as never,
      )

      expect(fabric.canvases[0].backgroundColor).toBe('#ffffff')
    })
  })
})
