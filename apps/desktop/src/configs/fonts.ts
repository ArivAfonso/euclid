import fontsPayload from './fonts.json'
import { SystemFont } from "@/types/common"

export interface GoogleFontDefinition {
  family: string
  category: string
  variants: string[]
  subsets: string[]
  files: Record<string, string>
  version: string
  lastModified: string
  kind: string
}

type FontsJson = {
  result: {
    fonts: GoogleFontDefinition[]
  }
}

const fontsJson = fontsPayload as FontsJson
const googleFonts = fontsJson.result.fonts.map((font) => ({
  ...font,
  variants: [...font.variants],
  subsets: [...font.subsets],
  files: { ...font.files },
}))

const fontMap = new Map<string, GoogleFontDefinition>()
googleFonts.forEach((font) => {
  fontMap.set(font.family, font)
})

const normalizeVariant = (variant?: string) => {
  if (!variant || variant === 'regular') return 'regular'
  if (variant === 'italic') return 'italic'
  return variant.toLowerCase()
}

const resolveVariantForFont = (font: GoogleFontDefinition, variant?: string) => {
  const normalized = normalizeVariant(variant)
  const available = new Set(font.variants.map((item) => item.toLowerCase()))

  if (available.has(normalized)) return normalized

  if (normalized.includes('italic')) {
    if (available.has('italic')) return 'italic'
    const weight = normalized.replace('italic', '')
    const italicWeight = `${weight}italic`
    if (weight && available.has(italicWeight)) return italicWeight
  }

  const weightOnly = normalized.replace('italic', '')
  if (weightOnly && available.has(weightOnly)) return weightOnly

  return available.has('regular') ? 'regular' : font.variants[0]
}

export const GOOGLE_FONTS = googleFonts

export const GOOGLE_FONT_OPTIONS: SystemFont[] = GOOGLE_FONTS
  .map((font) => ({
    label: font.family,
    value: font.family,
  }))
  .sort((a, b) => a.label.localeCompare(b.label))

export const GOOGLE_FONT_CATEGORY_MAP = GOOGLE_FONTS.reduce<Record<string, SystemFont[]>>(
  (acc, font) => {
    const label = font.category.trim().length ? font.category : 'unknown'
    if (!acc[label]) {
      acc[label] = []
    }
    acc[label].push({ label: font.family, value: font.family })
    return acc
  },
  {},
)

Object.values(GOOGLE_FONT_CATEGORY_MAP).forEach((options) => {
  options.sort((a, b) => a.label.localeCompare(b.label))
})

export const getGoogleFont = (family: string) => fontMap.get(family)

export const resolveGoogleFontVariant = (family: string, variant = 'regular') => {
  const font = fontMap.get(family)
  if (!font) return undefined
  return resolveVariantForFont(font, variant)
}

export const getGoogleFontFile = (family: string, variant = 'regular') => {
  const font = fontMap.get(family)
  if (!font) return undefined
  const resolvedVariant = resolveVariantForFont(font, variant)
  return font.files[resolvedVariant]
}

// Weight name mapping
const WEIGHT_NAME_MAP: Record<string, string> = {
  '100': 'Thin',
  '200': 'ExtraLight',
  '300': 'Light',
  '400': 'Normal',
  'regular': 'Normal',
  '500': 'Medium',
  '600': 'SemiBold',
  '700': 'Bold',
  '800': 'ExtraBold',
  '900': 'Black',
}

export const getWeightName = (weight: string): string => {
  return WEIGHT_NAME_MAP[weight] || weight
}

// Extract unique font weights from variants (excluding italic variants)
export const getAvailableFontWeights = (family: string): Array<{label: string, value: string}> => {
  const font = fontMap.get(family)
  if (!font) return []

  const weights = new Set<string>()
  
  font.variants.forEach((variant) => {
    // Extract weight from variant (e.g., "300", "700", "regular", "300italic" -> "300")
    const cleanVariant = variant.toLowerCase().replace('italic', '').trim()
    
    if (cleanVariant) {
      weights.add(cleanVariant)
    }
  })

  // Sort weights in ascending order (as numbers, with 'regular' or '400' as the base)
  const sortedWeights = Array.from(weights).sort((a, b) => {
    const aNum = a === 'regular' ? 400 : parseInt(a)
    const bNum = b === 'regular' ? 400 : parseInt(b)
    return aNum - bNum
  })

  return sortedWeights.map((weight) => {
    // Convert 'regular' to '400' for consistent numeric font-weight values
    const numericWeight = weight === 'regular' ? '400' : weight
    return {
      label: getWeightName(weight),
      value: numericWeight,
    }
  })
}