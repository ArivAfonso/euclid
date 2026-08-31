/**
 * PPT Import/Export — PPTX Export Engine
 *
 * Converts Euclid canvas templates (from Pinia store) into a
 * native .pptx presentation using pptxgenjs.
 *
 * Each template → one slide.
 * Each canvas object → native PPT element (shape, text box, image, table).
 * Complex elements (ArcText, QRCode, Math, etc.) → rasterized PNG fallback.
 */

import PptxGenJS from 'pptxgenjs'
import { StaticCanvas } from 'fabric'
import type { Template, SerializedObjectProps } from '@/types/canvas'
import type { EffectItem } from '@/types/common'
import { classifyElement } from './pptClassifier'
import {
  pxToInches,
  pxToPoints,
  normalizeAngle,
  parseColorToPPT,
  opacityToPercent,
} from './pptUnits'
import {
  TEXT_ALIGN_MAP,
  fontWeightToBold,
  underlineToPPT,
  strikethroughToPPT,
  VERTICAL_ALIGN_MAP,
} from './pptMappings'

/**
 * Options for PPTX export
 */
export interface PPTOptions {
  /** Output filename (without extension) */
  fileName?: string
  /** Author name for document metadata */
  author?: string
  /** Whether to rasterize complex elements as images */
  rasterizeFallbacks?: boolean
  /** DPI for rasterized fallback images */
  rasterizeDPI?: number
  /** Callback for progress updates (0-100) */
  onProgress?: (percent: number) => void
  /**
   * When true, text using custom/Google fonts (non-system fonts) will be
   * rasterized as images so they appear correctly on systems missing the
   * font. When false, all text is kept as native PPT text boxes.
   * @default true
   */
  rasterizeUncommonFonts?: boolean
}

/**
 * Default export options
 */
const DEFAULT_OPTIONS: PPTOptions = {
  fileName: 'euclid-presentation',
  author: 'Euclid',
  rasterizeFallbacks: true,
  rasterizeDPI: 96,
  rasterizeUncommonFonts: true,
}

/**
 * Standard fonts that are guaranteed to be available on every Windows/macOS
 * Office installation. Any font NOT in this set will be rasterized as an
 * image so that the exported PPTX shows the correct typeface even when the
 * viewer lacks the font.
 */
const SYSTEM_FONTS = new Set([
  'arial',
  'arial black',
  'arial narrow',
  'arial rounded mt bold',
  'bahnschrift',
  'baskerville old face',
  'bauhaus 93',
  'bell mt',
  'berlin sans fb',
  'bernard mt condensed',
  'bodoni mt',
  'book antiqua',
  'bookman old style',
  'bradley hand itc',
  'britannic bold',
  'broadway',
  'brush script mt',
  'calibri',
  'calibri light',
  'californian fb',
  'cambria',
  'cambria math',
  'candara',
  'castellar',
  'centaur',
  'century',
  'century gothic',
  'century schoolbook',
  'colonna mt',
  'comic sans ms',
  'consolas',
  'constantia',
  'cooper black',
  'copperplate gothic bold',
  'copperplate gothic light',
  'corbel',
  'courier new',
  'curlz mt',
  'elephant',
  'engravers mt',
  'eras bold itc',
  'eras demi itc',
  'eras light itc',
  'eras medium itc',
  'felix titling',
  'footlight mt light',
  'forte',
  'franklin gothic heavy',
  'franklin gothic medium',
  'franklin gothic medium cond',
  'freestyle script',
  'french script mt',
  'garamond',
  'georgia',
  'gigi',
  'gill sans mt',
  'gill sans mt condensed',
  'gill sans ultra bold',
  'gill sans ultra bold condensed',
  'gloucester mt extra condensed',
  'goudy old style',
  'goudy stout',
  'haettenschweiler',
  'harlow solid italic',
  'harrington',
  'high tower text',
  'impact',
  'imprint mt shadow',
  'informal roman',
  'jokerman',
  'juice itc',
  'kristen itc',
  'kunstler script',
  'lucida blackletter',
  'lucida bright',
  'lucida calligraphy',
  'lucida console',
  'lucida fax',
  'lucida handwriting',
  'lucida sans',
  'lucida sans typewriter',
  'lucida sans unicode',
  'magneto',
  'maiandra gd',
  'marlett',
  'matura mt script capitals',
  'microsoft himalaya',
  'microsoft jhenghei',
  'microsoft new tai lue',
  'microsoft phagspa',
  'microsoft sans serif',
  'microsoft tai le',
  'microsoft yahei',
  'microsoft yi baiti',
  'mingliu',
  'mistral',
  'modern no 20',
  'mongolian baiti',
  'monotype corsiva',
  'ms outlook',
  'ms reference sans serif',
  'ms reference specialty',
  'mt extra',
  'niagara engraved',
  'niagara solid',
  'old english text mt',
  'onyx',
  'palace script mt',
  'palatino linotype',
  'papyrus',
  'parchment',
  'perpetua',
  'perpetua titling mt',
  'playbill',
  'poor richard',
  'pristina',
  'rage italic',
  'ravie',
  'rockwell',
  'rockwell condensed',
  'rockwell extra bold',
  'script mt bold',
  'segoe print',
  'segoe script',
  'segoe ui',
  'segoe ui black',
  'segoe ui emoji',
  'segoe ui historic',
  'segoe ui light',
  'segoe ui semibold',
  'segoe ui semilight',
  'segoe ui symbol',
  'showcard gothic',
  'simsun',
  'sitka banner',
  'sitka display',
  'sitka heading',
  'sitka small',
  'sitka subheading',
  'sitka text',
  'snap itc',
  'stencil',
  'sylfaen',
  'symbol',
  'tahoma',
  'tempus sans itc',
  'times new roman',
  'trebuchet ms',
  'tw cen mt',
  'tw cen mt condensed',
  'tw cen mt condensed extra bold',
  'verdana',
  'viner hand itc',
  'vivaldi',
  'vladimir script',
  'webdings',
  'wingdings',
  'wingdings 2',
  'wingdings 3',
])

/**
 * Check whether a font is a system-installed font that PowerPoint can
 * render natively without embedding.
 */
function isStandardSystemFont(fontFamily: string): boolean {
  if (!fontFamily) return true // default to Calibri
  return SYSTEM_FONTS.has(fontFamily.toLowerCase().trim())
}

/**
 * Resolve a Fabric object's effective fill color.
 * Euclid mirrors `fill` into `color` for text objects, but `fill` may be
 * null or empty when only `color` is set. Fall back to `color` if needed.
 */
function resolveFillColor(obj: SerializedObjectProps): string | undefined {
  const fill = (obj as any).fill
  if (typeof fill === 'string' && fill.trim() && fill !== 'null') return fill
  const color = (obj as any).color
  if (typeof color === 'string' && color.trim() && color !== 'null') return color
  return undefined
}

/**
 * Convert a Fabric serialized fill into pptxgenjs color hex (6-digit, no #).
 * Returns a string color OR undefined (for transparent/no fill).
 */
function fillToPPTColor(fill: any, opacity: number): { color: string; transparency?: number } | undefined {
  if (!fill) return undefined
  if (typeof fill === 'string') {
    if (!fill.trim() || fill === 'null') return undefined
    // Treat 'rgba(...,0)' as transparent
    if (/^rgba?\([^,]+,[^,]+,[^,]+,\s*0\s*\)/.test(fill)) return undefined
    return { color: parseColorToPPT(fill), transparency: opacityToPercent(1 - opacity) }
  }
  // Gradients / patterns — approximate with first color stop
  if (typeof fill === 'object' && Array.isArray(fill.colorStops) && fill.colorStops.length > 0) {
    const first = fill.colorStops[0]
    const color = first?.color || '#000000'
    return { color: parseColorToPPT(color), transparency: opacityToPercent(1 - opacity) }
  }
  return undefined
}

/**
 * Rasterize a single Fabric object to a PNG data URL
 * This is used for complex elements that have no native PPT equivalent.
 */
async function rasterizeObject(
  obj: SerializedObjectProps,
  width: number,
  height: number,
  dpi: number
): Promise<string | null> {
  try {
    // Use Fabric's native JSON deserialisation (`loadFromJSON`) so that
    // every custom class (Path, Polygon, Line, Circle, etc.) is properly
    // reconstructed — including async handlers like `fromObject()`.
    // A plain `new Klass(serializedObj)` does not work for complex types.
    const scale = dpi / 96
    const strokePad = Math.max((obj as any).strokeWidth ?? 0, 8) * scale
    const canvasW = Math.max(1, Math.ceil(width * scale + strokePad * 2))
    const canvasH = Math.max(1, Math.ceil(height * scale + strokePad * 2))

    const canvas = new StaticCanvas(undefined, {
      width: canvasW,
      height: canvasH,
      backgroundColor: 'transparent',
    })

    // Normalise the object: set top-left anchor, apply scale, and offset by
    // the stroke padding so nothing gets clipped.
    const placementObj = {
      ...obj,
      left: strokePad,
      top: strokePad,
      scaleX: ((obj as any).scaleX ?? 1) * scale,
      scaleY: ((obj as any).scaleY ?? 1) * scale,
      originX: 'left',
      originY: 'top',
    }

    // loadFromJSON is async on the subclass chain (e.g. Image, SVGImage).
    await canvas.loadFromJSON({
      version: '5.3.0',
      objects: [placementObj],
    })

    canvas.renderAll()

    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 1,
    })

    canvas.dispose()
    return dataUrl
  } catch (err) {
    console.warn('Failed to rasterize object for PPT fallback:', err)
    return null
  }
}

/**
 * Convert a shadow EffectItem to a pptxgenjs shadow object
 */
function convertShadow(effect: EffectItem | undefined | null): object | undefined {
  if (!effect || !effect.visible) return undefined
  if (!effect.shadowColor && !effect.blur) return undefined

  return {
    type: 'outer' as const,
    color: parseColorToPPT(effect.shadowColor || '#000000'),
    blur: effect.blur || 6,
    offset: effect.offsetX || 0,
    // pptxgenjs only supports a single offset, use Y if non-zero, else X
    // In practice, PPT shadow offsets are simplified
    opacity: 0.5,
  }
}

/**
 * Convert a text object to a PPT text box
 */
function addTextToSlide(
  slide: PptxGenJS.Slide,
  obj: SerializedObjectProps,
  slideWidthIn: number,
  slideHeightIn: number
): void {
  const text = (obj as any).text || ''
  const fontSizePx = ((obj as any).fontSize || 24) * ((obj as any).scaleY ?? 1)
  const fontFamily = (obj as any).fontFamily || 'Calibri'
  const fontWeight = (obj as any).fontWeight
  const fontStyle = (obj as any).fontStyle
  const fillRaw = resolveFillColor(obj) || '#000000'
  const backgroundColor = (obj as any).backgroundColor
  const textAlign = (obj as any).textAlign || 'left'
  const lineHeight = (obj as any).lineHeight || 1.2
  const charSpacingPx = (obj as any).charSpacing || 0
  const underline = (obj as any).underline
  const linethrough = (obj as any).linethrough
  const opacity = (obj as any).opacity ?? 1

  // Convert font metrics from canvas pixels → typographic points
  // Fabric.js uses px at 96 DPI; pptxgenjs uses pt (72 pt/inch).
  // 1 px = 72/96 pt = 0.75 pt
  const fontSizePt = pxToPoints(fontSizePx)

  const leftIn = pxToInches(obj.left ?? 0)
  const topIn = pxToInches(obj.top ?? 0)
  const widthIn = pxToInches((obj.width ?? 100) * ((obj as any).scaleX ?? 1))
  const heightIn = pxToInches((obj.height ?? 30) * ((obj as any).scaleY ?? 1))
  const angle = normalizeAngle(obj.angle ?? 0)

  // Build text options
  const colorOpts = fillToPPTColor(fillRaw, opacity)
  const textOpts: any = {
    x: leftIn,
    y: topIn,
    w: widthIn,
    h: heightIn,
    fontSize: fontSizePt,
    fontFace: fontFamily,
    bold: fontWeightToBold(fontWeight),
    italic: fontStyle === 'italic',
    align: TEXT_ALIGN_MAP[textAlign] || 'left',
    valign: VERTICAL_ALIGN_MAP[(obj as any).verticalAlign] || 'top',
    lineSpacing: Math.round(fontSizePt * lineHeight),
    charSpacing: Math.round((charSpacingPx / 1000) * fontSizePt),
    underline: underlineToPPT(underline),
    strike: strikethroughToPPT(linethrough),
    rotate: angle,
    wrap: true,
    margin: [7.2, 7.2, 7.2, 7.2],
  }
  if (colorOpts) {
    textOpts.color = colorOpts.color
    if (colorOpts.transparency) textOpts.transparency = colorOpts.transparency
  }

  // Background color for text box
  if (backgroundColor) {
    const bgOpts = fillToPPTColor(backgroundColor, 1)
    if (bgOpts) {
      textOpts.fill = { color: bgOpts.color }
    }
  }

  // Shadow
  const effects = (obj as any).effects as EffectItem[] | undefined
  if (effects) {
    const shadowEffect = effects.find((e: EffectItem) => e.type === 1 && e.visible !== false)
    const shadow = convertShadow(shadowEffect)
    if (shadow) {
      textOpts.shadow = shadow
    }
  }

  slide.addText(text, textOpts)
}

/**
 * Convert an image object to a PPT image
 */
async function addImageToSlide(
  slide: PptxGenJS.Slide,
  obj: SerializedObjectProps
): Promise<void> {
  const src = (obj as any).src || (obj as any).originSrc
  if (!src) return

  const leftIn = pxToInches(obj.left ?? 0)
  const topIn = pxToInches(obj.top ?? 0)
  const widthIn = pxToInches((obj.width ?? 100) * ((obj as any).scaleX ?? 1))
  const heightIn = pxToInches((obj.height ?? 100) * ((obj as any).scaleY ?? 1))
  const angle = normalizeAngle(obj.angle ?? 0)
  const opacity = (obj as any).opacity ?? 1

  const imgOpts: any = {
    x: leftIn,
    y: topIn,
    w: widthIn,
    h: heightIn,
    rotate: angle,
    transparency: opacityToPercent(1 - opacity),
  }

  // Handle cropping (basic — PPTX supports cropping)
  const cropPath = (obj as any).cropPath
  const cropSize = (obj as any).cropSize
  if (cropPath && cropSize) {
    imgOpts.cropping = {
      left: pxToInches(cropPath.x || 0),
      top: pxToInches(cropPath.y || 0),
      right: pxToInches(cropSize.width - (obj.width ?? 0) - (cropPath.x || 0)),
      bottom: pxToInches(cropSize.height - (obj.height ?? 0) - (cropPath.y || 0)),
    }
  }

  try {
    const isDataUrl = typeof src === 'string' && src.startsWith('data:')
    if (isDataUrl) {
      slide.addImage({ ...imgOpts, data: src })
    } else {
      slide.addImage({ ...imgOpts, path: src })
    }
  } catch (err) {
    console.warn('Failed to add image to PPT, using placeholder:', err)
    slide.addShape('rect', {
      x: leftIn,
      y: topIn,
      w: widthIn,
      h: heightIn,
      color: 'E0E0E0',
    })
  }
}

/**
 * Convert a group object — recursively iterate and add children to slide
 */
async function addGroupToSlide(
  slide: PptxGenJS.Slide,
  obj: SerializedObjectProps,
  slideWidthIn: number,
  slideHeightIn: number,
  dpi: number,
  rasterizeUncommonFonts: boolean
): Promise<void> {
  const children = (obj as any).objects as SerializedObjectProps[] | undefined
  if (!children || !Array.isArray(children)) return

  // Groups in PPT are just individual elements placed at their absolute positions.
  // We add each child individually.
  for (const child of children) {
    await addElementToSlide(slide, child, slideWidthIn, slideHeightIn, dpi, rasterizeUncommonFonts)
  }
}

/**
 * Add a fallback rasterized image for complex elements
 */
async function addFallbackToSlide(
  slide: PptxGenJS.Slide,
  obj: SerializedObjectProps,
  dpi: number
): Promise<void> {
  const scaleX = (obj as any).scaleX ?? 1
  const scaleY = (obj as any).scaleY ?? 1
  const width = (obj.width ?? 100) * scaleX
  const height = (obj.height ?? 100) * scaleY

  // Stroke/shadow padding (must match the padding used inside rasterizeObject)
  const strokePadPx = Math.max((obj as any).strokeWidth ?? 0, 8)
  const paddedWidth = width + strokePadPx * 2
  const paddedHeight = height + strokePadPx * 2

  const dataUrl = await rasterizeObject(obj, width, height, dpi)

  if (!dataUrl) {
    // If rasterization fails, add a placeholder shape
    slide.addShape('rect', {
      x: pxToInches(obj.left ?? 0),
      y: pxToInches(obj.top ?? 0),
      w: pxToInches(width),
      h: pxToInches(height),
      color: 'F0F0F0',
      line: { color: 'CCCCCC', width: 1 },
    })
    return
  }

  // Place the padded image so the original object bounds align with obj.left/top.
  // The padding is centered around the object, so we offset by -strokePadPx.
  const leftIn = pxToInches((obj.left ?? 0) - strokePadPx)
  const topIn = pxToInches((obj.top ?? 0) - strokePadPx)
  const widthIn = pxToInches(paddedWidth)
  const heightIn = pxToInches(paddedHeight)

  slide.addImage({
    x: leftIn,
    y: topIn,
    w: widthIn,
    h: heightIn,
    data: dataUrl,
    transparency: opacityToPercent(1 - (obj.opacity ?? 1)),
  })
}

/**
 * Dispatch a single serialized object to its appropriate PPT converter
 */
async function addElementToSlide(
  slide: PptxGenJS.Slide,
  obj: SerializedObjectProps,
  slideWidthIn: number,
  slideHeightIn: number,
  dpi: number,
  rasterizeUncommonFonts: boolean
): Promise<void> {
  // Skip workspace overlay objects
  const id = (obj as any).id || ''
  if (
    id.startsWith('WorkSpace') ||
    (obj as any).name === 'referenceline' ||
    (obj.type || '').toLowerCase() === 'referenceline'
  ) {
    return
  }

  const strategy = classifyElement(obj.type || '')

  switch (strategy) {
    case 'text':
      // Text using Google Fonts or custom uploaded fonts cannot be rendered
      // natively by PowerPoint without font embedding (which pptxgenjs does
      // not support). When rasterizeUncommonFonts is enabled, those text
      // elements are rasterized as images so the correct typeface is preserved.
      if (rasterizeUncommonFonts && !isStandardSystemFont((obj as any).fontFamily)) {
        await addFallbackToSlide(slide, obj, dpi)
      } else {
        addTextToSlide(slide, obj, slideWidthIn, slideHeightIn)
      }
      break
    case 'shape':
      // All shapes are rasterized as transparent PNGs because the
      // cross-format rendering of strokes, dashes, geometry, and corner
      // radii is unreliable in pptxgenjs native shapes.
      await addFallbackToSlide(slide, obj, dpi)
      break
    case 'image':
      await addImageToSlide(slide, obj)
      break
    case 'group':
      await addGroupToSlide(slide, obj, slideWidthIn, slideHeightIn, dpi, rasterizeUncommonFonts)
      break
    case 'fallback':
      await addFallbackToSlide(slide, obj, dpi)
      break
    case 'skip':
    default:
      break
  }
}

/**
 * Main entry point: Convert Euclid templates to a PPTX Blob
 *
 * @param templates - Array of Euclid templates (each becomes a slide)
 * @param options  - Export options
 * @returns The generated PPTX file as an ArrayBuffer
 */
export async function exportToPPTX(
  templates: Template[],
  options: PPTOptions = {}
): Promise<ArrayBuffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const pres = new PptxGenJS()

  if (!templates || templates.length === 0) {
    throw new Error('No templates to export')
  }

  // Set presentation metadata
  pres.author = opts.author || 'Euclid'
  pres.title = opts.fileName || 'Euclid Presentation'

  const dpi = opts.rasterizeDPI || 96
  const totalSlides = templates.length

  // Define a custom layout matching the first template's workspace dimensions.
  // Euclid stores `template.width` as logical units; the actual canvas-pixel
  // workspace is `template.width / template.zoom`. We use the canvas-pixel size
  // because object coordinates are also in canvas pixels.
  const firstTemplate = templates[0]
  const firstZoom = firstTemplate.zoom || 1
  const canvasWidthPx = firstTemplate.width / firstZoom
  const canvasHeightPx = firstTemplate.height / firstZoom
  const slideWidthIn = pxToInches(canvasWidthPx)
  const slideHeightIn = pxToInches(canvasHeightPx)
  const layoutName = 'EUCLID_CUSTOM'

  pres.defineLayout({ name: layoutName, width: slideWidthIn, height: slideHeightIn })
  pres.layout = layoutName

  for (let i = 0; i < totalSlides; i++) {
    const template = templates[i]

    // Determine slide background color
    let bgColor = ''
    if (template.background && typeof template.background === 'string') {
      bgColor = parseColorToPPT(template.background)
    } else if (template.workSpace?.fill && typeof template.workSpace.fill === 'string') {
      bgColor = parseColorToPPT(template.workSpace.fill)
    }

    const slideOpts: any = {}
    if (bgColor) {
      slideOpts.bkgd = bgColor
    }

    const slide = pres.addSlide(slideOpts)

    // Iterate objects in order (they are already in z-order from canvas)
    const objects = template.objects || []
    for (const obj of objects) {
      await addElementToSlide(slide, obj, slideWidthIn, slideHeightIn, dpi, opts.rasterizeUncommonFonts ?? true)
    }

    // Progress callback
    if (opts.onProgress) {
      opts.onProgress(Math.round(((i + 1) / totalSlides) * 100))
    }
  }

  // Generate the PPTX file
  const buffer = await pres.write({ outputType: 'arraybuffer' })
  return buffer
}

/**
 * Generate a PPTX and return it as a Blob suitable for file-saving
 */
export async function exportToPPTXBlob(
  templates: Template[],
  options: PPTOptions = {}
): Promise<Blob> {
  const buffer = await exportToPPTX(templates, options)
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
}

/**
 * Get the PPTX MIME type
 */
export const PPTX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
