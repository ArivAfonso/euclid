/**
 * Image Effects Configuration
 * Defines all available image effects with their metadata and default settings
 */

import type { ImageEffectType } from '@/types/imageEffects'

export interface ImageEffectConfig {
  id: string
  name: string
  description: string
  type: ImageEffectType
  icon: string
  preview: string
  category: 'distortion' | 'stylize' | 'color' | 'pattern'
  defaultSettings: Record<string, any>
}

export const IMAGE_EFFECT_CATEGORIES = {
  distortion: {
    label: 'Distortion',
    description: 'Effects that distort or transform the image'
  },
  stylize: {
    label: 'Stylize',
    description: 'Artistic and stylistic effects'
  },
  color: {
    label: 'Color',
    description: 'Color manipulation effects'
  },
  pattern: {
    label: 'Pattern',
    description: 'Pattern-based effects'
  }
} as const

export const IMAGE_EFFECTS: ImageEffectConfig[] = [
  {
    id: 'pixelize',
    name: 'Pixelize',
    description: 'Create a classic pixel art effect by reducing image resolution',
    type: 'pixelize',
    icon: 'IconGridFour',
    preview: './img/previews/effects/pixelize.png',
    category: 'stylize',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      blockSize: 8
    }
  },
  {
    id: 'radialPixel',
    name: 'Radial Pixel',
    description: 'Pixelate in a radial pattern from a center point',
    type: 'radialPixel',
    icon: 'IconRadar',
    preview: './img/previews/effects/radial-pixel.png',
    category: 'distortion',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      centerX: 50,
      centerY: 50,
      segments: 16,
      rings: 12
    }
  },
  {
    id: 'crossCut',
    name: 'Cross Cut',
    description: 'Slice and offset the image in horizontal or vertical strips',
    type: 'crossCut',
    icon: 'IconCut',
    preview: './img/previews/effects/cross-cut.png',
    category: 'distortion',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      slices: 8,
      offset: 20,
      direction: 'horizontal'
    }
  },
  {
    id: 'liquid',
    name: 'Liquid',
    description: 'Apply a wavy liquid distortion effect',
    type: 'liquid',
    icon: 'IconDroplet',
    preview: './img/previews/effects/liquid.png',
    category: 'distortion',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      amplitude: 30,
      frequency: 5,
      speed: 50
    }
  },
  {
    id: 'outliner',
    name: 'Outliner',
    description: 'Extract edges and outlines from the image',
    type: 'outliner',
    icon: 'IconBorderStyle',
    preview: './img/previews/effects/outliner.png',
    category: 'stylize',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      threshold: 128,
      thickness: 2,
      invert: false
    }
  },
  {
    id: 'dotPattern',
    name: 'Dot Pattern',
    description: 'Convert image to a dot/stipple pattern',
    type: 'dotPattern',
    icon: 'IconDotGrid',
    preview: './img/previews/effects/dot-pattern.png',
    category: 'pattern',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      dotSize: 4,
      spacing: 6,
      shape: 'circle'
    }
  },
  {
    id: 'posterize',
    name: 'Posterize',
    description: 'Reduce color levels for a poster-like effect',
    type: 'posterize',
    icon: 'IconColorFilter',
    preview: './img/previews/effects/posterize.png',
    category: 'color',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      levels: 4
    }
  },
  {
    id: 'tvGlitch',
    name: 'TV Glitch',
    description: 'Simulate analog TV glitch and distortion',
    type: 'tvGlitch',
    icon: 'IconTv',
    preview: './img/previews/effects/tv-glitch.png',
    category: 'distortion',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      distortion: 30,
      scanlines: true,
      colorShift: 10,
      noise: 20
    }
  },
  {
    id: 'halftone',
    name: 'Halftone',
    description: 'Create a print-style halftone pattern',
    type: 'halftone',
    icon: 'IconCircleDotted',
    preview: './img/previews/effects/halftone.png',
    category: 'pattern',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      dotSize: 4,
      angle: 45,
      shape: 'circle'
    }
  },
  {
    id: 'mirror',
    name: 'Mirror',
    description: 'Create mirror/kaleidoscope reflections',
    type: 'mirror',
    icon: 'IconFlipHorizontal',
    preview: './img/previews/effects/mirror.png',
    category: 'distortion',
    defaultSettings: {
      enabled: true,
      intensity: 100,
      axis: 'horizontal',
      offset: 50
    }
  },
  {
    id: 'vignette',
    name: 'Vignette',
    description: 'Add a dark or colored border fade effect',
    type: 'vignette',
    icon: 'IconCircle',
    preview: './img/previews/effects/vignette.png',
    category: 'stylize',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      size: 70,
      softness: 50,
      color: '#000000'
    }
  },
  {
    id: 'duotone',
    name: 'Duotone',
    description: 'Apply a two-color gradient effect',
    type: 'duotone',
    icon: 'IconPalette',
    preview: './img/previews/effects/duotone.png',
    category: 'color',
    defaultSettings: {
      enabled: true,
      intensity: 100,
      highlightColor: '#FFD700',
      shadowColor: '#1E3A5F'
    }
  },
  {
    id: 'rgbShift',
    name: 'RGB Shift',
    description: 'Offset RGB color channels for a chromatic effect',
    type: 'rgbShift',
    icon: 'IconColorSwatch',
    preview: './img/previews/effects/rgb-shift.png',
    category: 'color',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      amount: 10,
      angle: 0
    }
  },
  {
    id: 'motionBlur',
    name: 'Motion Blur',
    description: 'Blur the image along a direction for a motion effect',
    type: 'motionBlur',
    icon: 'IconAdjustmentsHorizontal',
    preview: './img/previews/effects/motion-blur.png',
    category: 'stylize',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      distance: 12,
      angle: 0
    }
  },
  {
    id: 'scanlines',
    name: 'Scanlines',
    description: 'Add retro CRT monitor scanlines',
    type: 'scanlines',
    icon: 'IconAdjustmentsHorizontal',
    preview: './img/previews/effects/scanlines.png',
    category: 'pattern',
    defaultSettings: {
      enabled: true,
      intensity: 50,
      density: 2,
      opacity: 50,
      movement: false
    }
  }
]

export const getEffectsByCategory = (category: string) => {
  return IMAGE_EFFECTS.filter(effect => effect.category === category)
}

export const getEffectById = (id: string) => {
  return IMAGE_EFFECTS.find(effect => effect.id === id)
}

export const getEffectByType = (type: ImageEffectType) => {
  return IMAGE_EFFECTS.find(effect => effect.type === type)
}
