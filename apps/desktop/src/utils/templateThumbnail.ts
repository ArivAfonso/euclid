import { StaticCanvas, util, type FabricObject } from 'fabric'
import { WorkSpaceDrawType, WorkSpaceThumbType } from '@/configs/canvas'
import type { Template } from '@/types/canvas'
import { getTemplateArtboardSize, normalizeProjectTemplate } from '@/utils/projectImport'

/**
 * Renders a project thumbnail straight from a serialized template, without the
 * editor canvas. The Projects page has no live canvas, so bulk-imported
 * projects used to stay blank until each one was opened in the editor.
 */

/** Same sizing rules as the editor's thumbnail (see `generateThumbnail`). */
export const TARGET_THUMBNAIL_WIDTH = 400
export const MIN_THUMBNAIL_SCALE = 0.3
/** Very tall/wide artboards would otherwise produce enormous bitmaps. */
export const MAX_THUMBNAIL_SIDE = 1600
/** A single image that never loads must not stall the whole thumbnail. */
export const OBJECT_LOAD_TIMEOUT_MS = 8000
export const THUMBNAIL_QUALITY = 0.55

export interface ThumbnailBounds {
  left: number
  top: number
  width: number
  height: number
}

export interface ThumbnailGeometry {
  scale: number
  width: number
  height: number
}

/** The artboard region of a template (the workspace rect, in object space). */
export const getTemplateBounds = (template: Partial<Template>): ThumbnailBounds => {
  const workspace = ((template.objects ?? []) as any[]).find((obj) => obj?.id === WorkSpaceDrawType)
  const size = getTemplateArtboardSize(template)
  return {
    left: Number(workspace?.left) || 0,
    top: Number(workspace?.top) || 0,
    width: size.width,
    height: size.height,
  }
}

/** Output bitmap size for an artboard: ≥ ~400px wide, bounded on the long side. */
export const getThumbnailGeometry = (bounds: Pick<ThumbnailBounds, 'width' | 'height'>): ThumbnailGeometry => {
  const wanted = Math.max(MIN_THUMBNAIL_SCALE, TARGET_THUMBNAIL_WIDTH / bounds.width)
  const longSide = Math.max(bounds.width, bounds.height)
  const scale = Math.min(wanted, MAX_THUMBNAIL_SIDE / longSide)
  return {
    scale,
    width: Math.max(1, Math.round(bounds.width * scale)),
    height: Math.max(1, Math.round(bounds.height * scale)),
  }
}

/**
 * Hydrates one serialized object. Failures (broken image URL, unknown class,
 * CORS rejection, timeout) resolve to `null` so the rest of the design still
 * renders instead of the whole thumbnail failing.
 */
const enlivenObject = async (serialized: unknown, timeoutMs: number): Promise<FabricObject | null> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const [instance] = await util.enlivenObjects<FabricObject>([serialized], { signal: controller.signal })
    return instance ?? null
  } catch (error) {
    console.warn('Thumbnail: skipped an object that failed to load', error)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export interface RenderThumbnailOptions {
  timeoutMs?: number
}

/**
 * Returns a JPEG data URL of the template's artboard, or `''` when it cannot be
 * rendered (callers keep the placeholder avatar in that case).
 *
 * Fonts must already be loaded: text is measured while it is hydrated.
 */
export const renderTemplateThumbnail = async (
  source: Partial<Template>,
  options: RenderThumbnailOptions = {},
): Promise<string> => {
  const { timeoutMs = OBJECT_LOAD_TIMEOUT_MS } = options
  let canvas: StaticCanvas | null = null

  try {
    // Bounds come from the source: normalization injects a workspace rect
    // sized from the zoomed template width when an export lost its own.
    const bounds = getTemplateBounds(source)
    const template = normalizeProjectTemplate(source)
    if (!(bounds.width > 0 && bounds.height > 0)) return ''

    const { scale, width, height } = getThumbnailGeometry(bounds)

    const serialized = (template.objects as any[]).filter(
      (obj) => obj && !WorkSpaceThumbType.includes(obj.id),
    )
    const hydrated = await Promise.all(serialized.map((obj) => enlivenObject(obj, timeoutMs)))

    canvas = new StaticCanvas(undefined, {
      width,
      height,
      renderOnAddRemove: false,
      enableRetinaScaling: false,
      skipOffscreen: true,
    })

    // Match the editor thumbnail: paint the artboard colour behind everything
    // so JPEG encoding never turns transparent regions black.
    const fill = template.workSpace?.fill
    canvas.backgroundColor = typeof fill === 'string' && fill ? fill : '#ffffff'
    canvas.setViewportTransform([scale, 0, 0, scale, -bounds.left * scale, -bounds.top * scale])

    hydrated.forEach((obj) => obj && canvas!.add(obj))
    canvas.renderAll()

    return canvas.toDataURL({
      format: 'jpeg',
      quality: THUMBNAIL_QUALITY,
      multiplier: 1,
      enableRetinaScaling: false,
    })
  } catch (error) {
    // Tainted canvas (cross-origin image without CORS), exhausted memory, ...
    console.error('Error rendering template thumbnail:', error)
    return ''
  } finally {
    // dispose() returns a promise; a failed cleanup must not surface as an
    // unhandled rejection.
    void canvas?.dispose().catch(() => undefined)
  }
}
