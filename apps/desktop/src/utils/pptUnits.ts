/**
 * PPT Import/Export — Unit Conversion Utilities
 *
 * Euclid uses pixels at 96 DPI as its native coordinate system.
 * PowerPoint uses inches and EMU (English Metric Units).
 * All conversions use 96 DPI as the standard: 1 inch = 96 px = 914400 EMU.
 */

/** Pixels per inch (screen standard) */
export const PX_PER_INCH = 96

/** Points per inch (typographic standard) */
export const PT_PER_INCH = 72

/** EMU (English Metric Units) per inch — PowerPoint's internal unit */
export const EMU_PER_INCH = 914400

/** EMU per pixel */
export const EMU_PER_PX = EMU_PER_INCH / PX_PER_INCH

/**
 * Convert pixels to typographic points.
 * Fabric.js uses canvas pixels at 96 DPI.
 * PowerPoint/pptxgenjs uses typographic points (72 pt per inch).
 * Formula: 1 px = 72/96 pt = 0.75 pt.
 */
export function pxToPoints(px: number): number {
  return px * (PT_PER_INCH / PX_PER_INCH)
}

/**
 * Convert pixels to inches
 */
export function pxToInches(px: number): number {
  return px / PX_PER_INCH
}

/**
 * Convert inches to pixels
 */
export function inchesToPx(inches: number): number {
  return inches * PX_PER_INCH
}

/**
 * Convert pixels to EMU (PowerPoint internal unit)
 */
export function pxToEMU(px: number): number {
  return Math.round(px * EMU_PER_PX)
}

/**
 * Convert EMU to pixels
 */
export function emuToPx(emu: number): number {
  return emu / EMU_PER_PX
}

/**
 * Normalize a rotation angle to the range [0, 360).
 * PowerPoint and Fabric.js both use degrees, but PowerPoint
 * may interpret negative angles differently.
 */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360
}

/**
 * Convert a hex color string or rgba string to a PowerPoint-compatible
 * hex string (without alpha). Falls back to '000000' for invalid input.
 */
export function parseColorToPPT(color: string | undefined | null): string {
  if (!color) return '000000'

  // If it's a hex color like '#FF0000' or 'FF0000'
  if (typeof color === 'string') {
    // Remove leading '#'
    let hex = color.replace(/^#/, '')

    // Handle rgba/rgb
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      const matches = color.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (matches) {
        const r = parseInt(matches[1], 10)
        const g = parseInt(matches[2], 10)
        const b = parseInt(matches[3], 10)
        hex = [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
      }
    }

    // Ensure 6-char hex
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }

    return hex.length === 6 ? hex : '000000'
  }

  return '000000'
}

/**
 * Convert a hex color to 'rgb(r, g, b)' format for pptxgenjs
 */
export function hexToRgbString(hex: string): string {
  const clean = parseColorToPPT(hex)
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Convert an opacity value (0-1) to a percentage string for PowerPoint
 */
export function opacityToPercent(opacity: number): number {
  return Math.round(Math.max(0, Math.min(1, opacity)) * 100)
}

/**
 * Convert a stroke dash array (e.g., [5, 5]) to a PowerPoint dash style.
 * PowerPoint has limited dash presets, so we map to the closest match.
 */
export function dashArrayToPPTDashStyle(
  dashArray: number[] | null | undefined
): 'solid' | 'dash' | 'dashDot' | 'lgDash' | 'lgDashDot' | 'lgDashDotDot' | 'dot' | 'sysDash' | 'sysDashDot' | 'sysDashDotDot' | 'sysDot' {
  if (!dashArray || dashArray.length === 0) return 'solid'

  // Sum of dash + gap
  const pattern = dashArray.join(',')

  // Map common Fabric dash patterns to PPT styles
  const dashMap: Record<string, 'dash' | 'dashDot' | 'dot' | 'lgDash'> = {
    '5,5': 'dash',
    '3,3': 'dot',
    '10,5': 'lgDash',
    '5,2': 'dash',
    '2,2': 'dot',
    '10,5,2,5': 'dashDot',
    '10,5,5,5': 'dashDot',
  }

  return dashMap[pattern] || 'solid'
}
