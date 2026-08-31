/**
 * PPT Import/Export — Type & Attribute Mapping Tables
 *
 * Maps Euclid (Fabric.js) element types and style values to
 * PowerPoint (pptxgenjs) equivalents, and vice versa.
 */

// ─── Text Alignment ───────────────────────────────────────────

/**
 * Euclid textAlign values → PowerPoint horizontal alignment
 */
export const TEXT_ALIGN_MAP: Record<string, 'left' | 'center' | 'right' | 'justify' | 'distributed'> = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
  'justify-left': 'justify',
  'justify-center': 'justify',
  'justify-right': 'justify',
}

/**
 * PPT horizontal alignment → Euclid textAlign values
 */
export const TEXT_ALIGN_REVERSE_MAP: Record<string, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
  distributed: 'justify',
}

// ─── Font Weight / Style ──────────────────────────────────────

/**
 * Map Euclid fontWeight (number or keyword) to PPT bold flag
 */
export function fontWeightToBold(weight: number | string | undefined): boolean {
  if (weight === undefined) return false
  const num = typeof weight === 'string' ? parseInt(weight, 10) : weight
  return num >= 600
}

/**
 * Map PPT bold flag + italic → Euclid fontWeight / fontStyle
 */
export function boldItalicToFontWeight(bold: boolean): string {
  return bold ? '700' : '400'
}

export function boldItalicToFontStyle(italic: boolean): string {
  return italic ? 'italic' : 'normal'
}

// ─── Shape Type Mapping ───────────────────────────────────────

/**
 * Euclid element type names → pptxgenjs shape types
 * PPT has fewer native shape types; complex shapes get mapped
 * to the closest equivalent or 'rect' as fallback.
 */
export const EUCLID_TO_PPT_SHAPE: Record<string, string> = {
  rect: 'rect',
  circle: 'ellipse',
  triangle: 'triangle',
  line: 'line',
  polygon: 'polygon',
  polyline: 'line',
  path: 'path',
}

/**
 * Mirror: potential PPT shape type names → Euclid types
 */
export const PPT_TO_EUCLID_SHAPE: Record<string, string> = {
  rect: 'rect',
  ellipse: 'circle',
  circle: 'circle',
  triangle: 'triangle',
  line: 'line',
  polygon: 'polygon',
  polyline: 'polyline',
  path: 'path',
}

// ─── Vertical Alignment ───────────────────────────────────────

export const VERTICAL_ALIGN_MAP: Record<string, 'top' | 'middle' | 'bottom'> = {
  top: 'top',
  middle: 'middle',
  center: 'middle',
  bottom: 'bottom',
}

export const VERTICAL_ALIGN_REVERSE_MAP: Record<string, string> = {
  top: 'top',
  middle: 'middle',
  bottom: 'bottom',
}

// ─── Arrowhead / Line End Styles ──────────────────────────────

/**
 * Euclid startStyle/endStyle → PowerPoint arrowhead type.
 * Euclid uses 'arrow-*' or filenames; PPT uses preset types.
 */
export const ARROW_STYLE_MAP: Record<string, string> = {
  'arrow-01': 'arrow',
  'arrow-02': 'arrow',
  'arrow-03': 'arrow',
  'arrow-04': 'arrow',
  'arrow-05': 'arrow',
  'arrow-06': 'stealth',
  'arrow-07': 'stealth',
  'arrow-08': 'diamond',
  'arrow-09': 'oval',
  'arrow-10': 'arrow',
  triangle: 'triangle',
  stealth: 'stealth',
  diamond: 'diamond',
  circle: 'oval',
  oval: 'oval',
  lineArrow: 'arrow',
  openArrow: 'arrow',
  filledArrow: 'arrow',
}

// ─── Underline / Strikethrough ────────────────────────────────

export function underlineToPPT(
  underline: boolean | string | undefined
): boolean {
  return !!underline
}

export function strikethroughToPPT(
  linethrough: boolean | string | undefined
): boolean {
  return !!linethrough
}

// ─── Cap Type ─────────────────────────────────────────────────

export const STROKE_CAP_MAP: Record<string, 'flat' | 'round' | 'square'> = {
  butt: 'flat',
  round: 'round',
  square: 'square',
}
