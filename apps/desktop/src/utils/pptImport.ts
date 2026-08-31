/**
 * PPT Import/Export — PPTX Import Engine
 *
 * Parses a .pptx file and converts its content into Euclid templates.
 * Uses the `pptxtojson` library (already installed) to extract structured
 * JSON from the PPTX, then maps each slide/element to Euclid's canvas format.
 */

import { nanoid } from 'nanoid'
import type { Template, SerializedObjectProps } from '@/types/canvas'
import { inchesToPx, parseColorToPPT } from './pptUnits'

// ─── Types for pptxtojson output ──────────────────────────────

/** Structure returned by pptxtojson for the entire presentation */
interface PptxToJsonResult {
  slideWidth?: number  // In inches? Or EMU? Depends on library
  slideHeight?: number
  slides: PptxSlide[]
  [key: string]: any
}

interface PptxSlide {
  slideNumber?: number
  slideName?: string
  shapes: PptxShape[]
  background?: PptxBackground
  [key: string]: any
}

interface PptxBackground {
  fill?: string
  color?: string
  type?: string
  [key: string]: any
}

interface PptxShape {
  type: string
  left?: number
  top?: number
  width?: number
  height?: number
  rotation?: number
  name?: string
  [key: string]: any
}

interface PptxTextShape extends PptxShape {
  text?: string
  font?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  color?: string
  align?: string
  verticalAlign?: string
  lineSpacing?: number
  charSpacing?: number
  underline?: boolean
  strikethrough?: boolean
  /** Rich text runs for multi-style text */
  paragraphs?: PptxParagraph[]
  /** Bullet info */
  bullet?: boolean | PptxBullet
}

interface PptxParagraph {
  runs: PptxTextRun[]
  align?: string
  [key: string]: any
}

interface PptxTextRun {
  text: string
  font?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  color?: string
  underline?: boolean
  [key: string]: any
}

interface PptxBullet {
  type?: string
  char?: string
  [key: string]: any
}

interface PptxShapeShape extends PptxShape {
  fill?: string
  stroke?: string
  strokeWidth?: number
  path?: string
  points?: { x: number; y: number }[]
  rx?: number
  ry?: number
  dashStyle?: string
}

interface PptxImageShape extends PptxShape {
  src?: string
  data?: string
  image?: string
  contentType?: string
}

interface PptxGroupShape extends PptxShape {
  shapes?: PptxShape[]
}

// ─── Defaults for created Euclid elements ────────────────────

const EUCLID_DEFAULTS = {
  version: '5.3.0',
  fillType: 0,
  objectCaching: true,
  transparentCorners: false,
  hasBorders: true,
  selectable: true,
  evented: true,
  originX: 'left' as const,
  originY: 'top' as const,
  scaleX: 1,
  scaleY: 1,
  flipX: false,
  flipY: false,
  stroke: '',
  strokeWidth: 0,
  strokeDashArray: null,
  strokeLineCap: 'butt' as const,
  strokeDashOffset: 0,
  strokeLineJoin: 'miter' as const,
  strokeUniform: false,
  strokeMiterLimit: 4,
  shadow: null,
  visible: true,
  backgroundColor: '',
  fillRule: 'nonzero' as const,
  paintFirst: 'fill' as const,
  skewX: 0,
  skewY: 0,
  globalCompositeOperation: 'source-over' as const,
  padding: 0,
}

// ─── Unit conversion ──────────────────────────────────────────

/**
 * Try to detect the unit of a value from pptxtojson.
 * The library may return values in inches, EMU, or points.
 * We assume inches as the most common PPTX output unit.
 */
function pptValueToPx(value: number | undefined | null, fallback: number): number {
  if (value === undefined || value === null) return inchesToPx(1)
  return inchesToPx(value)
}

// ─── Color conversion ─────────────────────────────────────────

function pptColorToEuclid(color: string | undefined): string {
  if (!color) return ''
  // If it already starts with #, return as-is
  if (color.startsWith('#')) return color
  // If it's an rgb string, try to convert
  if (color.startsWith('rgb')) {
    const matches = color.match(/(\d+),\s*(\d+),\s*(\d+)/)
    if (matches) {
      const r = parseInt(matches[1], 10)
      const g = parseInt(matches[2], 10)
      const b = parseInt(matches[3], 10)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }
  }
  // If it's a hex without #, add it
  if (/^[0-9A-Fa-f]{6}$/.test(color)) return `#${color}`
  if (/^[0-9A-Fa-f]{8}$/.test(color)) return `#${color.substring(0, 6)}`
  return color
}

// ─── Shape converters ─────────────────────────────────────────

function convertPPTTextToEuclid(shape: PptxTextShape): SerializedObjectProps | null {
  const text = shape.text || ''
  if (!text.trim()) return null

  const left = pptValueToPx(shape.left, 0)
  const top = pptValueToPx(shape.top, 0)
  const width = pptValueToPx(shape.width, 200)
  const height = pptValueToPx(shape.height, 50)
  const opacity = 1

  // Determine if we need IText (editable) or Textbox
  const useTextbox = width > 50 // Textbox for wider text, IText for single-line

  const result: any = {
    ...EUCLID_DEFAULTS,
    type: useTextbox ? 'Textbox' : 'IText',
    id: nanoid(10),
    name: 'textbox',
    left,
    top,
    width,
    height,
    text,
    fontSize: shape.fontSize || 24,
    fontFamily: shape.font || 'Arial',
    fontWeight: shape.bold ? '700' : '400',
    fontStyle: shape.italic ? 'italic' : 'normal',
    fill: pptColorToEuclid(shape.color) || '#000000',
    color: pptColorToEuclid(shape.color) || '#000000',
    textAlign: mapPPTAlignment(shape.align),
    lineHeight: shape.lineSpacing ? shape.lineSpacing / 100 : 1.2,
    charSpacing: shape.charSpacing || 0,
    underline: !!shape.underline,
    linethrough: !!shape.strikethrough,
    opacity,
    editable: useTextbox,
    fillRepeat: 'no-repeat',
    fillURL: '',
    minWidth: 20,
    splitByGrapheme: false,
  }

  // Handle multi-style text via IText styles array if paragraphs/runs exist
  if (shape.paragraphs && shape.paragraphs.length > 0) {
    const styles: any[] = []
    let textLength = 0

    for (const para of shape.paragraphs) {
      if (!para.runs || para.runs.length === 0) {
        // Empty paragraph = newline
        textLength += 1 // just the newline
        continue
      }

      for (const run of para.runs) {
        if (!run.text) continue
        const start = textLength
        const end = textLength + run.text.length
        textLength = end

        const style: any = { start, end }
        if (run.font) style.fontFamily = run.font
        if (run.fontSize) style.fontSize = run.fontSize
        if (run.bold !== undefined) style.fontWeight = run.bold ? 'bold' : 'normal'
        if (run.italic !== undefined) style.fontStyle = run.italic ? 'italic' : 'normal'
        if (run.color) style.fill = pptColorToEuclid(run.color)
        if (run.underline !== undefined) style.underline = run.underline

        styles.push(style)
      }
    }

    if (styles.length > 0) {
      result.styles = styles
    }
  }

  return result
}

function mapPPTAlignment(align: string | undefined): string {
  const map: Record<string, string> = {
    left: 'left',
    center: 'center',
    right: 'right',
    justify: 'justify',
    distributed: 'justify',
  }
  return map[(align || '').toLowerCase()] || 'left'
}

function convertPPTShapeToEuclid(shape: PptxShapeShape): SerializedObjectProps | null {
  const type = (shape.type || '').toLowerCase()
  const left = pptValueToPx(shape.left, 0)
  const top = pptValueToPx(shape.top, 0)
  const width = pptValueToPx(shape.width, 100)
  const height = pptValueToPx(shape.height, 100)
  const opacity = 1

  let euclidType = 'Rect'
  const path = shape.path

  // Determine Euclid type from PPT shape type
  if (type === 'ellipse' || type === 'circle' || type === 'oval') {
    euclidType = 'Circle'
  } else if (type === 'line') {
    euclidType = 'Line'
  } else if (type === 'triangle') {
    euclidType = 'Triangle'
  } else if (type === 'polygon' || type === 'freeform') {
    euclidType = 'Polygon'
  } else if (type === 'path' || type === 'freeformPath') {
    euclidType = 'Path'
  } else if (type === 'roundRect' || type === 'roundedRect') {
    euclidType = 'Rect'
  } else {
    euclidType = 'Rect'
  }

  const result: any = {
    ...EUCLID_DEFAULTS,
    type: euclidType,
    id: nanoid(10),
    name: euclidType.toLowerCase(),
    left,
    top,
    width,
    height,
    fill: pptColorToEuclid(shape.fill) || '#FFFFFF',
    stroke: pptColorToEuclid(shape.stroke) || '',
    strokeWidth: shape.strokeWidth || 0,
    opacity,
    angle: shape.rotation || 0,
  }

  // Corner radius for rects
  if (euclidType === 'Rect') {
    const rx = shape.rx ? pptValueToPx(shape.rx, 0) : 0
    const ry = shape.ry ? pptValueToPx(shape.ry, 0) : 0
    if (rx > 0) result.rx = rx
    if (ry > 0) result.ry = ry
  }

  // Path data
  if (euclidType === 'Path' && path) {
    // Convert PPT path string (if available) to Fabric path array
    result.path = parsePPTPath(path)
  }

  // Polygon points
  if (euclidType === 'Polygon' && shape.points) {
    result.points = shape.points.map((p: { x: number; y: number }) => ({
      x: pptValueToPx(p.x, 0),
      y: pptValueToPx(p.y, 0),
    }))
  }

  // Line coordinates
  if (euclidType === 'Line') {
    // Lines in PPT have x1/y1 in left/top, x2/y2 in width/height sometimes
    result.x1 = 0
    result.y1 = 0
    result.x2 = width
    result.y2 = height
  }

  return result
}

/**
 * Parse a PPT path string into a Fabric.js path array
 * PPT paths use SVG-like syntax: "M 0 0 L 100 100 Z"
 */
function parsePPTPath(pathStr: string): any[] {
  if (!pathStr) return []
  try {
    // Simple SVG-like path to Fabric path conversion
    const commands = pathStr.match(/[MLQCTZ][^MLQCTZ]*/gi)
    if (!commands) return []

    return commands.map((cmd) => {
      const action = cmd.charAt(0).toUpperCase()
      const coords = cmd
        .substring(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number)
      return [action, ...coords]
    })
  } catch {
    return []
  }
}

function convertPPTImageToEuclid(
  shape: PptxImageShape
): SerializedObjectProps | null {
  const src = shape.data || shape.src || shape.image
  if (!src) return null

  const left = pptValueToPx(shape.left, 0)
  const top = pptValueToPx(shape.top, 0)
  const width = pptValueToPx(shape.width, 100)
  const height = pptValueToPx(shape.height, 100)

  return {
    ...EUCLID_DEFAULTS,
    type: 'Image',
    id: nanoid(10),
    name: 'image',
    left,
    top,
    width,
    height,
    src,
    originSrc: src,
    crossOrigin: 'anonymous',
    opacity: 1,
    angle: shape.rotation || 0,
    filters: [],
    effects: [],
  } as any
}

function convertPPTGroupToEuclid(shape: PptxGroupShape): SerializedObjectProps | null {
  const children = shape.shapes
  if (!children || children.length === 0) return null

  const convertedChildren = children
    .map((child: PptxShape) => convertPPTElement(child))
    .filter(Boolean) as SerializedObjectProps[]

  if (convertedChildren.length === 0) return null

  // Calculate bounds from children
  let minLeft = Infinity
  let minTop = Infinity
  let maxRight = -Infinity
  let maxBottom = -Infinity

  for (const child of convertedChildren) {
    const l = child.left ?? 0
    const t = child.top ?? 0
    const w = child.width ?? 0
    const h = child.height ?? 0
    minLeft = Math.min(minLeft, l)
    minTop = Math.min(minTop, t)
    maxRight = Math.max(maxRight, l + w)
    maxBottom = Math.max(maxBottom, t + h)
  }

  const width = maxRight - minLeft
  const height = maxBottom - minTop

  return {
    ...EUCLID_DEFAULTS,
    type: 'Group',
    id: nanoid(10),
    name: 'group',
    left: minLeft,
    top: minTop,
    width,
    height,
    objects: convertedChildren,
    opacity: 1,
  } as any
}

/**
 * Main dispatch: Convert a single PPT shape to Euclid serialized format
 */
function convertPPTElement(shape: PptxShape): SerializedObjectProps | null {
  const type = (shape.type || '').toLowerCase()

  // Skip non-content shapes
  if (type === 'placeholder' || type === 'slideNumber' || type === 'date' || type === 'footer') {
    return null
  }

  if (type === 'group' || type === 'groupShape') {
    return convertPPTGroupToEuclid(shape as PptxGroupShape)
  }

  // Check for image
  if (type === 'image' || type === 'picture' || type === 'imageShape' || (shape as any).data || (shape as any).image) {
    return convertPPTImageToEuclid(shape as PptxImageShape)
  }

  // Check for text
  if (type === 'text' || type === 'textShape' || (shape as any).text !== undefined) {
    const textResult = convertPPTTextToEuclid(shape as PptxTextShape)
    if (textResult) return textResult
  }

  // Check for shape (rect, ellipse, line, etc.)
  if (
    type === 'shape' ||
    type === 'rect' ||
    type === 'ellipse' ||
    type === 'circle' ||
    type === 'line' ||
    type === 'triangle' ||
    type === 'polygon' ||
    type === 'path' ||
    type === 'roundRect' ||
    type === 'freeform'
  ) {
    return convertPPTShapeToEuclid(shape as PptxShapeShape)
  }

  // Unknown type — try as shape as fallback
  if (shape.width && shape.height) {
    return convertPPTShapeToEuclid(shape as PptxShapeShape)
  }

  return null
}

/**
 * Create a workspace element for the canvas background
 */
function createWorkSpaceElement(
  width: number,
  height: number,
  background: string
): any {
  return {
    rx: 0,
    ry: 0,
    id: 'WorkSpaceDraw',
    name: 'rect',
    color: background || '#ffffff',
    padding: 0,
    fill: background || '#ffffff',
    selectable: false,
    evented: false,
    fillType: 0,
    lockMovementX: false,
    lockMovementY: false,
    objectCaching: true,
    transparentCorners: false,
    hasBorders: true,
    globalCompositeOperation: 'source-over',
    type: 'Rect',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width,
    height,
    stroke: '',
    strokeWidth: 0,
    strokeDashArray: null,
    strokeLineCap: 'butt',
    strokeDashOffset: 0,
    strokeLineJoin: 'miter',
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: null,
    visible: true,
    backgroundColor: '',
    fillRule: 'nonzero',
    paintFirst: 'fill',
    skewX: 0,
    skewY: 0,
  }
}

/**
 * Main entry point: Import a PPTX file buffer and convert to Euclid templates
 *
 * @param pptxBuffer - The raw .pptx file as an ArrayBuffer
 * @returns Array of Euclid Template objects
 */
export async function importFromPPTX(
  pptxBuffer: ArrayBuffer
): Promise<Template[]> {
  // Dynamically import pptxtojson (it's an ESM module)
  let pptxToJson: any
  try {
    pptxToJson = await import('pptxtojson')
  } catch (err) {
    throw new Error(
      'Failed to load pptxtojson library. Ensure it is installed: npm install pptxtojson'
    )
  }

  // Parse the PPTX
  let parsed: PptxToJsonResult
  try {
    // pptxtojson API: it may accept Buffer or Uint8Array
    const uint8Array = new Uint8Array(pptxBuffer)
    parsed = await pptxToJson.default?.(uint8Array) ?? await pptxToJson(uint8Array)
  } catch (err) {
    throw new Error(`Failed to parse PPTX file: ${err}`)
  }

  if (!parsed || !parsed.slides || parsed.slides.length === 0) {
    throw new Error('No slides found in the PPTX file')
  }

  // Determine slide dimensions
  // pptxtojson returns dimensions in inches typically
  const slideWidthPx = parsed.slideWidth
    ? pptValueToPx(parsed.slideWidth, 960)
    : 960 // Default: 10 inches at 96 DPI
  const slideHeightPx = parsed.slideHeight
    ? pptValueToPx(parsed.slideHeight, 540)
    : 540 // Default: 7.5 inches at 96 DPI

  const templates: Template[] = []

  for (const slide of parsed.slides) {
    const shapes = slide.shapes || []
    const bgColor = slide.background?.fill || slide.background?.color || '#FFFFFF'

    // Convert all shapes to Euclid serialized objects
    const convertedObjects: SerializedObjectProps[] = []

    for (const shape of shapes) {
      const converted = convertPPTElement(shape)
      if (converted) {
        convertedObjects.push(converted)
      }
    }

    // Create workspace element
    const workSpace = createWorkSpaceElement(slideWidthPx, slideHeightPx, bgColor)

    // Create template
    const template: Template = {
      id: nanoid(10),
      version: '5.3.0',
      workSpace,
      background: bgColor,
      zoom: 1,
      width: slideWidthPx,
      height: slideHeightPx,
      clip: 0,
      objects: [workSpace as any, ...convertedObjects],
    }

    templates.push(template)
  }

  return templates
}
