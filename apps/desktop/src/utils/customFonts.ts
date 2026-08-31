import JSZip from 'jszip'
import opentype, { Font } from 'opentype.js'
import { nanoid } from 'nanoid'
import type { CustomFontFamily, CustomFontFormat, CustomFontVariantMeta } from '@/types/fonts'
import type { StoredCustomFont } from '@/utils/customFontStorage'

export interface ParsedFontSource {
  buffer: ArrayBuffer
  family: string
  fullName?: string
  weight: number
  style: 'normal' | 'italic'
  format: CustomFontFormat
  fileName: string
}

const FONT_EXTENSION_MAP: Record<string, CustomFontFormat> = {
  '.ttf': 'truetype',
  '.otf': 'opentype',
  '.woff': 'woff',
  '.woff2': 'woff2',
}

const WEIGHT_KEYWORDS: Record<string, number> = {
  thin: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  book: 350,
  regular: 400,
  normal: 400,
  plain: 400,
  medium: 500,
  demibold: 600,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  heavy: 800,
  black: 900,
  ultrablack: 950,
}

const ENGLISH_KEYS = ['en', 'en-US', 'en-us', 'en-GB', 'English']

const getFontFormat = (fileName: string): CustomFontFormat | undefined => {
  const lower = fileName.toLowerCase()
  const extension = Object.keys(FONT_EXTENSION_MAP).find((ext) => lower.endsWith(ext))
  return extension ? FONT_EXTENSION_MAP[extension] : undefined
}

const getEnglishName = (fontName?: Record<string, string>): string | undefined => {
  if (!fontName) return undefined
  for (const key of ENGLISH_KEYS) {
    if (fontName[key]) return fontName[key]
  }
  const first = Object.values(fontName)[0]
  return typeof first === 'string' ? first : undefined
}

const normalizeFamilyName = (input: string): string => {
  return input.replace(/[-_]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

const deriveWeightFromName = (fileName: string): number => {
  const lower = fileName.toLowerCase()
  for (const [keyword, weight] of Object.entries(WEIGHT_KEYWORDS)) {
    if (lower.includes(keyword)) return weight
  }
  return 400
}

const isLikelyItalic = (font: Font): boolean => {
  const italicAngle = font.tables?.post?.italicAngle ?? 0
  if (italicAngle !== 0) return true
  const selection = font.tables?.os2?.fsSelection
  if (typeof selection === 'number') {
    return (selection & 0x01) === 0x01
  }
  return false
}

const getWeightFromFont = (font: Font, fallbackFileName: string): number => {
  const weight = font.tables?.os2?.usWeightClass
  if (typeof weight === 'number' && weight > 0) {
    return Math.min(900, Math.max(100, weight))
  }
  return deriveWeightFromName(fallbackFileName)
}

const parseOpentypeFont = (buffer: ArrayBuffer, fileName: string): ParsedFontSource | null => {
  const format = getFontFormat(fileName)
  if (!format) return null

  try {
    const font = opentype.parse(buffer)
    const names = font.names as Record<string, any>
    const preferredFamily = names?.preferredFamily as Record<string, string> | undefined
    const fontFamily = names?.fontFamily as Record<string, string> | undefined
    const fullNameRecord = names?.fullName as Record<string, string> | undefined

    const familyName = getEnglishName(preferredFamily) ||
      getEnglishName(fontFamily) ||
      getEnglishName(fullNameRecord)

    const fullName = getEnglishName(fullNameRecord)

    const family = normalizeFamilyName(familyName || fileName.replace(/\.[^.]+$/, ''))
    const weight = getWeightFromFont(font, fileName)
    const style: 'normal' | 'italic' = isLikelyItalic(font) ? 'italic' : 'normal'

    return {
      buffer,
      family,
      fullName: fullName || family,
      weight,
      style,
      format,
      fileName,
    }
  } catch (error) {
    console.warn(`Failed to parse font metadata for ${fileName}`, error)
    const fallbackFamily = normalizeFamilyName(fileName.replace(/\.[^.]+$/, '')) || `Font-${nanoid(6)}`
    return {
      buffer,
      family: fallbackFamily,
      fullName: fallbackFamily,
      weight: deriveWeightFromName(fileName),
      style: /italic|oblique/i.test(fileName) ? 'italic' : 'normal',
      format: format,
      fileName,
    }
  }
}

export const parseFontBuffer = async (buffer: ArrayBuffer, fileName: string): Promise<ParsedFontSource | null> => {
  const format = getFontFormat(fileName)
  if (!format) return null

  // opentype.js currently does not parse woff2 reliably; attempt parse and fall back
  if (format === 'woff2') {
    try {
      // Attempt parsing via opentype; if it fails, we still continue with fallback naming
      return parseOpentypeFont(buffer, fileName)
    } catch (error) {
      console.warn(`WOFF2 parsing fallback for ${fileName}`, error)
      const fallbackFamily = normalizeFamilyName(fileName.replace(/\.[^.]+$/, '')) || `Font-${nanoid(6)}`
      return {
        buffer,
        family: fallbackFamily,
        fullName: fallbackFamily,
        weight: deriveWeightFromName(fileName),
        style: /italic|oblique/i.test(fileName) ? 'italic' : 'normal',
        format,
        fileName,
      }
    }
  }

  return parseOpentypeFont(buffer, fileName)
}

export const extractFontsFromZip = async (file: File): Promise<ParsedFontSource[]> => {
  const zip = await JSZip.loadAsync(file)
  const fonts: ParsedFontSource[] = []

  const entries = Object.keys(zip.files)
  for (const name of entries) {
    const entry = zip.files[name]
    if (!entry || entry.dir) continue
    const format = getFontFormat(entry.name)
    if (!format) continue
    const buffer = await entry.async('arraybuffer')
    const parsed = await parseFontBuffer(buffer, entry.name)
    if (parsed) fonts.push(parsed)
  }

  return fonts
}

export const isSupportedFontFile = (fileName: string): boolean => {
  return Boolean(getFontFormat(fileName))
}

export const isZipFile = (fileName: string): boolean => fileName.toLowerCase().endsWith('.zip')

export const fontMimeType = (format: CustomFontFormat): string => {
  switch (format) {
    case 'truetype':
      return 'font/ttf'
    case 'opentype':
      return 'font/otf'
    case 'woff':
      return 'font/woff'
    case 'woff2':
      return 'font/woff2'
    default:
      return 'application/octet-stream'
  }
}

const objectUrlCache = new Map<number, string>()

export const recordsToFamilies = (records: StoredCustomFont[]): CustomFontFamily[] => {
  const grouped = new Map<string, CustomFontFamily>()

  for (const record of records) {
    if (typeof record.id !== 'number') continue
    let family = grouped.get(record.family)
    if (!family) {
      family = {
        family: record.family,
        variants: [],
        updatedAt: record.updatedAt,
      }
      grouped.set(record.family, family)
    }

    const existingUrl = objectUrlCache.get(record.id)
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl)
      objectUrlCache.delete(record.id)
    }

    const blob = new Blob([record.data], { type: fontMimeType(record.format) })
    const sourceUrl = URL.createObjectURL(blob)
    objectUrlCache.set(record.id, sourceUrl)

    const variant: CustomFontVariantMeta = {
      id: record.id,
      weight: record.weight,
      style: record.style,
      format: record.format,
      fileName: record.fileName,
      source: sourceUrl,
      fullName: record.fullName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }

    family.variants.push(variant)
    family.updatedAt = Math.max(family.updatedAt, record.updatedAt)
  }

  const result = Array.from(grouped.values())
  result.forEach((family) => {
    family.variants.sort((a, b) => {
      if (a.weight === b.weight) {
        return a.style.localeCompare(b.style)
      }
      return a.weight - b.weight
    })
  })

  return result.sort((a, b) => a.family.localeCompare(b.family))
}

export const revokeFontObjectUrls = (ids: number[]) => {
  ids.forEach((id) => {
    const url = objectUrlCache.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      objectUrlCache.delete(id)
    }
  })
}

export const revokeAllFontObjectUrls = () => {
  objectUrlCache.forEach((url) => URL.revokeObjectURL(url))
  objectUrlCache.clear()
}

export const createParsedFontSourcesFromFiles = async (files: File[]): Promise<ParsedFontSource[]> => {
  const results: ParsedFontSource[] = []

  for (const file of files) {
    if (isZipFile(file.name)) {
      const zipFonts = await extractFontsFromZip(file)
      results.push(...zipFonts)
      continue
    }

    if (!isSupportedFontFile(file.name)) continue
    const buffer = await file.arrayBuffer()
    const parsed = await parseFontBuffer(buffer, file.name)
    if (parsed) {
      results.push(parsed)
    }
  }

  return results
}

export const findMatchingVariant = (
  variants: CustomFontVariantMeta[],
  weight: number,
  style: 'normal' | 'italic'
): CustomFontVariantMeta | undefined => {
  return variants.find((variant) => variant.weight === weight && variant.style === style)
}

export const normalizeVariantDescriptor = (descriptor?: string): { weight: number; style: 'normal' | 'italic' } => {
  if (!descriptor || descriptor === 'regular') {
    return { weight: 400, style: 'normal' }
  }
  const lower = descriptor.toLowerCase()
  const style: 'normal' | 'italic' = lower.includes('italic') ? 'italic' : 'normal'
  const numeric = lower.replace('italic', '').trim()
  const parsed = Number.parseInt(numeric, 10)
  const weight = Number.isFinite(parsed) ? parsed : 400
  return { weight, style }
}
