export type CustomFontFormat = 'truetype' | 'opentype' | 'woff' | 'woff2'

export interface CustomFontVariantMeta {
  id: number
  weight: number
  style: 'normal' | 'italic'
  format: CustomFontFormat
  fileName: string
  source: string
  fullName?: string
  createdAt: number
  updatedAt: number
}

export interface CustomFontFamily {
  family: string
  variants: CustomFontVariantMeta[]
  updatedAt: number
}
