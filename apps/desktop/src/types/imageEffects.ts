/**
 * Image Effects Type Definitions
 * These are artistic/stylistic effects for images like pixelate, glitch, posterize, etc.
 */

export type ImageEffectType = 
  | 'pixelize'
  | 'radialPixel'
  | 'crossCut'
  | 'liquid'
  | 'outliner'
  | 'dotPattern'
  | 'posterize'
  | 'tvGlitch'
  | 'halftone'
  | 'mirror'
  | 'vignette'
  | 'duotone'
  | 'rgbShift'
  | 'motionBlur'
  | 'scanlines'

export interface BaseImageEffect {
  type: ImageEffectType
  enabled: boolean
  intensity: number // 0-100
}

export interface PixelizeEffect extends BaseImageEffect {
  type: 'pixelize'
  blockSize: number // 2-50
}

export interface RadialPixelEffect extends BaseImageEffect {
  type: 'radialPixel'
  centerX: number // 0-100 percent
  centerY: number // 0-100 percent
  segments: number // 4-64
  rings: number // 4-32
}

export interface CrossCutEffect extends BaseImageEffect {
  type: 'crossCut'
  slices: number // 2-20
  offset: number // 0-100
  direction: 'horizontal' | 'vertical' | 'both'
}

export interface LiquidEffect extends BaseImageEffect {
  type: 'liquid'
  amplitude: number // 0-100
  frequency: number // 1-20
  speed: number // 0-100
}

export interface OutlinerEffect extends BaseImageEffect {
  type: 'outliner'
  threshold: number // 0-255
  thickness: number // 1-10
  invert: boolean
}

export interface DotPatternEffect extends BaseImageEffect {
  type: 'dotPattern'
  dotSize: number // 1-20
  spacing: number // 1-20
  shape: 'circle' | 'square' | 'diamond'
}

export interface PosterizeEffect extends BaseImageEffect {
  type: 'posterize'
  levels: number // 2-16
}

export interface TvGlitchEffect extends BaseImageEffect {
  type: 'tvGlitch'
  distortion: number // 0-100
  scanlines: boolean
  colorShift: number // 0-50
  noise: number // 0-100
}

export interface HalftoneEffect extends BaseImageEffect {
  type: 'halftone'
  dotSize: number // 1-20
  angle: number // 0-180
  shape: 'circle' | 'ellipse' | 'square' | 'line'
}

export interface MirrorEffect extends BaseImageEffect {
  type: 'mirror'
  axis: 'horizontal' | 'vertical' | 'quad'
  offset: number // 0-100
}

export interface VignetteEffect extends BaseImageEffect {
  type: 'vignette'
  size: number // 0-100
  softness: number // 0-100
  color: string // hex color
}

export interface DuotoneEffect extends BaseImageEffect {
  type: 'duotone'
  highlightColor: string
  shadowColor: string
}

export interface RgbShiftEffect extends BaseImageEffect {
  type: 'rgbShift'
  amount: number // 0-50
  angle: number // 0-360
}

export interface MotionBlurEffect extends BaseImageEffect {
  type: 'motionBlur'
  distance: number // 1-40
  angle: number // 0-360
}

export interface ScanlinesEffect extends BaseImageEffect {
  type: 'scanlines'
  density: number // 1-10
  opacity: number // 0-100
  movement: boolean
}

export type ImageEffect = 
  | PixelizeEffect
  | RadialPixelEffect
  | CrossCutEffect
  | LiquidEffect
  | OutlinerEffect
  | DotPatternEffect
  | PosterizeEffect
  | TvGlitchEffect
  | HalftoneEffect
  | MirrorEffect
  | VignetteEffect
  | DuotoneEffect
  | RgbShiftEffect
  | MotionBlurEffect
  | ScanlinesEffect

export interface ImageEffectConfig {
  id: string
  name: string
  description: string
  type: ImageEffectType
  icon: string
  preview?: string
  category: 'distortion' | 'stylize' | 'color' | 'pattern'
  defaultSettings: Partial<ImageEffect>
}
