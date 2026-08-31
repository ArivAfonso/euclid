import tinycolor from 'tinycolor2'

/**
 * Convert any color value to a hex string (e.g. "#ff0000").
 * Falls back to the fallback color if the input is invalid.
 */
export function toHex(color: string | undefined | null, fallback = '#000000'): string {
  if (!color) return fallback
  const tc = tinycolor(color)
  return tc.isValid() ? tc.toHexString() : fallback
}
