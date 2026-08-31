/**
 * PPT Import/Export — Element Classifier
 *
 * Determines whether a Euclid (Fabric.js) canvas element has a
 * native PowerPoint equivalent or must be rasterized as a fallback image.
 */

// Element types that have direct PPT equivalents.
// NOTE: All shape types (lines, circles, squares, rectangles, triangles, paths,
// polygons, polylines) are rasterized as transparent PNG images because
// the cross-format rendering of stroke colours, corner radii, dashes, and
// complex geometry is unreliable in pptxgenjs native shapes.
const PPT_NATIVE_TEXT = new Set(['textbox', 'i-text', 'text'])
const PPT_NATIVE_SHAPES: Set<string> = new Set()
const PPT_NATIVE_IMAGE = new Set(['image'])
const GROUP_TYPES = new Set(['group', 'activeselection'])

// Element types that must be rasterized (no native PPT equivalent)
const FALLBACK_TYPES = new Set([
  'arctext',
  'verticaltext',
  'curvedtext',
  'qrcode',
  'barcode',
  'math',
  'gif',
  'gifimage',
  'svgimage',
  'icons',
  'color',
  'referenceline',
  'polygon',
  'polyline',
  'path',
  'line',
  'rect',
  'circle',
  'triangle',
  'ellipse',
])

/**
 * Check if an element has a native PPT text box equivalent
 */
export function isPPTNativeText(type: string): boolean {
  return PPT_NATIVE_TEXT.has(type.toLowerCase())
}

/**
 * Check if an element has a native PPT shape equivalent
 */
export function isPPTNativeShape(type: string): boolean {
  return PPT_NATIVE_SHAPES.has(type.toLowerCase())
}

/**
 * Check if an element has a native PPT image equivalent
 */
export function isPPTNativeImage(type: string): boolean {
  return PPT_NATIVE_IMAGE.has(type.toLowerCase())
}

/**
 * Check if an element is a group (needs recursive handling)
 */
export function isGroupObject(type: string): boolean {
  return GROUP_TYPES.has(type.toLowerCase())
}

/**
 * Check if an element has no native PPT equivalent and must be fallback-rendered as an image
 */
export function needsImageFallback(type: string): boolean {
  return FALLBACK_TYPES.has(type.toLowerCase())
}

/**
 * Classify a Euclid element type into a PPT conversion strategy
 */
export type PPTConversionStrategy =
  | 'text'
  | 'shape'
  | 'image'
  | 'group'
  | 'fallback'
  | 'skip'

/**
 * Determine the conversion strategy for a given element type
 */
export function classifyElement(type: string): PPTConversionStrategy {
  const lower = type.toLowerCase()

  if (isPPTNativeText(lower)) return 'text'
  if (isPPTNativeShape(lower)) return 'shape'
  if (isPPTNativeImage(lower)) return 'image'
  if (isGroupObject(lower)) return 'group'
  if (needsImageFallback(lower)) return 'fallback'
  return 'skip'
}
