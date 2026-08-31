/**
 * Image Effects Processor
 * Applies various artistic effects to images using canvas manipulation
 */

import type { 
  ImageEffect, 
  PixelizeEffect, 
  RadialPixelEffect,
  CrossCutEffect,
  LiquidEffect,
  OutlinerEffect,
  DotPatternEffect,
  PosterizeEffect,
  TvGlitchEffect,
  HalftoneEffect,
  MirrorEffect,
  VignetteEffect,
  DuotoneEffect,
  RgbShiftEffect,
  MotionBlurEffect,
  ScanlinesEffect
} from '@/types/imageEffects'

/**
 * Main processor class for image effects
 */
export class ImageEffectsProcessor {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private originalImageData: ImageData | null = null

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
  }

  /**
   * Apply a single effect to an image
   */
  async applyEffect(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageData,
    effect: ImageEffect
  ): Promise<ImageData> {
    this.loadImage(imageSource)
    
    if (!this.originalImageData) {
      throw new Error('Failed to load image data')
    }

    const imageData = new ImageData(
      new Uint8ClampedArray(this.originalImageData.data),
      this.originalImageData.width,
      this.originalImageData.height
    )

    switch (effect.type) {
      case 'pixelize':
        return this.applyPixelize(imageData, effect as PixelizeEffect)
      case 'radialPixel':
        return this.applyRadialPixel(imageData, effect as RadialPixelEffect)
      case 'crossCut':
        return this.applyCrossCut(imageData, effect as CrossCutEffect)
      case 'liquid':
        return this.applyLiquid(imageData, effect as LiquidEffect)
      case 'outliner':
        return this.applyOutliner(imageData, effect as OutlinerEffect)
      case 'dotPattern':
        return this.applyDotPattern(imageData, effect as DotPatternEffect)
      case 'posterize':
        return this.applyPosterize(imageData, effect as PosterizeEffect)
      case 'tvGlitch':
        return this.applyTvGlitch(imageData, effect as TvGlitchEffect)
      case 'halftone':
        return this.applyHalftone(imageData, effect as HalftoneEffect)
      case 'mirror':
        return this.applyMirror(imageData, effect as MirrorEffect)
      case 'vignette':
        return this.applyVignette(imageData, effect as VignetteEffect)
      case 'duotone':
        return this.applyDuotone(imageData, effect as DuotoneEffect)
      case 'rgbShift':
        return this.applyRgbShift(imageData, effect as RgbShiftEffect)
      case 'motionBlur':
        return this.applyMotionBlur(imageData, effect as MotionBlurEffect)
      case 'scanlines':
        return this.applyScanlines(imageData, effect as ScanlinesEffect)
      default:
        return imageData
    }
  }

  /**
   * Apply multiple effects in sequence
   */
  async applyEffects(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageData,
    effects: ImageEffect[]
  ): Promise<ImageData> {
    this.loadImage(imageSource)
    
    if (!this.originalImageData) {
      throw new Error('Failed to load image data')
    }

    let imageData = new ImageData(
      new Uint8ClampedArray(this.originalImageData.data),
      this.originalImageData.width,
      this.originalImageData.height
    )

    for (const effect of effects) {
      if (effect.enabled) {
        imageData = await this.applyEffect(imageData, effect)
      }
    }

    return imageData
  }

  /**
   * Load image into the canvas
   */
  private loadImage(source: HTMLImageElement | HTMLCanvasElement | ImageData) {
    if (source instanceof ImageData) {
      this.canvas.width = source.width
      this.canvas.height = source.height
      this.ctx.putImageData(source, 0, 0)
    } else {
      this.canvas.width = source.width
      this.canvas.height = source.height
      this.ctx.drawImage(source, 0, 0)
    }
    this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Get pixel at position
   */
  private getPixel(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number, number] {
    const i = (y * width + x) * 4
    return [data[i], data[i + 1], data[i + 2], data[i + 3]]
  }

  /**
   * Set pixel at position
   */
  private setPixel(data: Uint8ClampedArray, width: number, x: number, y: number, r: number, g: number, b: number, a: number) {
    const i = (y * width + x) * 4
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = a
  }

  /**
   * Pixelize effect - classic pixel art style
   */
  private applyPixelize(imageData: ImageData, effect: PixelizeEffect): ImageData {
    const { width, height, data } = imageData
    const blockSize = Math.max(2, Math.round(effect.blockSize * (effect.intensity / 100)))
    const result = new Uint8ClampedArray(data)

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let r = 0, g = 0, b = 0, a = 0, count = 0

        // Sample the block
        for (let by = 0; by < blockSize && y + by < height; by++) {
          for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
            const [pr, pg, pb, pa] = this.getPixel(data, width, x + bx, y + by)
            r += pr; g += pg; b += pb; a += pa
            count++
          }
        }

        // Average color
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)
        a = Math.round(a / count)

        // Fill the block
        for (let by = 0; by < blockSize && y + by < height; by++) {
          for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
            this.setPixel(result, width, x + bx, y + by, r, g, b, a)
          }
        }
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Radial Pixel effect - pixelate in a circular pattern
   */
  private applyRadialPixel(imageData: ImageData, effect: RadialPixelEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data)
    
    const centerX = width * (effect.centerX / 100)
    const centerY = height * (effect.centerY / 100)
    const maxRadius = Math.sqrt(width * width + height * height) / 2
    const segments = Math.round(effect.segments * (effect.intensity / 100)) || 8
    const rings = Math.round(effect.rings * (effect.intensity / 100)) || 8
    const ringWidth = maxRadius / rings

    for (let ring = 0; ring < rings; ring++) {
      const innerRadius = ring * ringWidth
      const outerRadius = (ring + 1) * ringWidth
      const segmentAngle = (Math.PI * 2) / segments

      for (let seg = 0; seg < segments; seg++) {
        const startAngle = seg * segmentAngle
        const endAngle = (seg + 1) * segmentAngle

        // Sample center of segment
        const sampleRadius = (innerRadius + outerRadius) / 2
        const sampleAngle = (startAngle + endAngle) / 2
        const sampleX = Math.round(centerX + Math.cos(sampleAngle) * sampleRadius)
        const sampleY = Math.round(centerY + Math.sin(sampleAngle) * sampleRadius)

        let r = 0, g = 0, b = 0, a = 255
        if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
          [r, g, b, a] = this.getPixel(data, width, sampleX, sampleY)
        }

        // Fill segment
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dx = x - centerX
            const dy = y - centerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            let angle = Math.atan2(dy, dx)
            if (angle < 0) angle += Math.PI * 2

            if (dist >= innerRadius && dist < outerRadius && 
                angle >= startAngle && angle < endAngle) {
              this.setPixel(result, width, x, y, r, g, b, a)
            }
          }
        }
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Cross Cut effect - slice and offset image strips
   */
  private applyCrossCut(imageData: ImageData, effect: CrossCutEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data.length)
    const slices = effect.slices
    const maxOffset = Math.round((effect.offset / 100) * width * (effect.intensity / 100))

    if (effect.direction === 'horizontal' || effect.direction === 'both') {
      const sliceHeight = Math.ceil(height / slices)
      
      for (let slice = 0; slice < slices; slice++) {
        const offset = (slice % 2 === 0 ? 1 : -1) * Math.round(maxOffset * Math.sin(slice * 0.5))
        const startY = slice * sliceHeight
        const endY = Math.min(startY + sliceHeight, height)

        for (let y = startY; y < endY; y++) {
          for (let x = 0; x < width; x++) {
            let srcX = (x - offset + width) % width
            const [r, g, b, a] = this.getPixel(data, width, srcX, y)
            this.setPixel(result, width, x, y, r, g, b, a)
          }
        }
      }
    } else {
      // Copy original first
      result.set(data)
    }

    if (effect.direction === 'vertical' || effect.direction === 'both') {
      const sourceData = effect.direction === 'both' ? new Uint8ClampedArray(result) : data
      const sliceWidth = Math.ceil(width / slices)
      
      for (let slice = 0; slice < slices; slice++) {
        const offset = (slice % 2 === 0 ? 1 : -1) * Math.round(maxOffset * Math.sin(slice * 0.5))
        const startX = slice * sliceWidth
        const endX = Math.min(startX + sliceWidth, width)

        for (let x = startX; x < endX; x++) {
          for (let y = 0; y < height; y++) {
            let srcY = (y - offset + height) % height
            const [r, g, b, a] = this.getPixel(sourceData, width, x, srcY)
            this.setPixel(result, width, x, y, r, g, b, a)
          }
        }
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Liquid effect - wavy distortion
   */
  private applyLiquid(imageData: ImageData, effect: LiquidEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data.length)
    
    const amplitude = (effect.amplitude / 100) * 50 * (effect.intensity / 100)
    const frequency = effect.frequency / 10

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offsetX = Math.sin(y * frequency * 0.1) * amplitude
        const offsetY = Math.cos(x * frequency * 0.1) * amplitude
        
        let srcX = Math.round(x + offsetX)
        let srcY = Math.round(y + offsetY)
        
        srcX = Math.max(0, Math.min(width - 1, srcX))
        srcY = Math.max(0, Math.min(height - 1, srcY))
        
        const [r, g, b, a] = this.getPixel(data, width, srcX, srcY)
        this.setPixel(result, width, x, y, r, g, b, a)
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Outliner effect - edge detection
   */
  private applyOutliner(imageData: ImageData, effect: OutlinerEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data.length)
    
    const threshold = effect.threshold * (effect.intensity / 100)
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gxR = 0, gxG = 0, gxB = 0
        let gyR = 0, gyG = 0, gyB = 0
        
        // Apply Sobel filter
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ki = (ky + 1) * 3 + (kx + 1)
            const [r, g, b] = this.getPixel(data, width, x + kx, y + ky)
            
            gxR += r * sobelX[ki]
            gxG += g * sobelX[ki]
            gxB += b * sobelX[ki]
            gyR += r * sobelY[ki]
            gyG += g * sobelY[ki]
            gyB += b * sobelY[ki]
          }
        }
        
        const magnitude = Math.sqrt(gxR * gxR + gyR * gyR + gxG * gxG + gyG * gyG + gxB * gxB + gyB * gyB) / 3
        
        let value = magnitude > threshold ? 255 : 0
        if (effect.invert) value = 255 - value
        
        this.setPixel(result, width, x, y, value, value, value, 255)
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Dot Pattern effect
   */
  private applyDotPattern(imageData: ImageData, effect: DotPatternEffect): ImageData {
    const { width, height, data } = imageData
    
    // Create a white background
    const result = new Uint8ClampedArray(data.length)
    for (let i = 0; i < result.length; i += 4) {
      result[i] = 255
      result[i + 1] = 255
      result[i + 2] = 255
      result[i + 3] = 255
    }
    
    const dotSize = Math.max(1, Math.round(effect.dotSize * (effect.intensity / 100)))
    const spacing = Math.max(dotSize + 1, effect.spacing)

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        // Sample brightness at this point
        const [r, g, b] = this.getPixel(data, width, Math.min(x, width - 1), Math.min(y, height - 1))
        const brightness = (r + g + b) / 3 / 255
        const radius = dotSize * (1 - brightness)
        
        // Draw dot
        for (let dy = -dotSize; dy <= dotSize; dy++) {
          for (let dx = -dotSize; dx <= dotSize; dx++) {
            const px = x + dx
            const py = y + dy
            if (px >= 0 && px < width && py >= 0 && py < height) {
              let inShape = false
              
              if (effect.shape === 'circle') {
                inShape = Math.sqrt(dx * dx + dy * dy) <= radius
              } else if (effect.shape === 'square') {
                inShape = Math.abs(dx) <= radius && Math.abs(dy) <= radius
              } else if (effect.shape === 'diamond') {
                inShape = Math.abs(dx) + Math.abs(dy) <= radius
              }
              
              if (inShape) {
                this.setPixel(result, width, px, py, 0, 0, 0, 255)
              }
            }
          }
        }
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Posterize effect - reduce color levels
   */
  private applyPosterize(imageData: ImageData, effect: PosterizeEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data)
    
    const levels = Math.max(2, Math.round(effect.levels * (effect.intensity / 100)))
    const step = 255 / (levels - 1)

    for (let i = 0; i < data.length; i += 4) {
      result[i] = Math.round(Math.round(data[i] / step) * step)
      result[i + 1] = Math.round(Math.round(data[i + 1] / step) * step)
      result[i + 2] = Math.round(Math.round(data[i + 2] / step) * step)
      result[i + 3] = data[i + 3]
    }

    return new ImageData(result, width, height)
  }

  /**
   * TV Glitch effect - analog TV distortion
   */
  private applyTvGlitch(imageData: ImageData, effect: TvGlitchEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data)
    
    // Boost intensity for heavier effect
    const intensityBoost = 2.5
    const distortion = Math.min(1, (effect.distortion / 100) * (effect.intensity / 100) * intensityBoost)
    const colorShift = Math.round(effect.colorShift * (effect.intensity / 100) * 2)
    const noiseAmount = Math.min(1, (effect.noise / 100) * 1.5)

    // Create large glitch blocks for heavy distortion
    const numGlitchBlocks = Math.floor(distortion * 15) + 3
    const glitchBlocks: { startY: number; endY: number; offset: number; colorCorrupt: boolean }[] = []
    
    for (let i = 0; i < numGlitchBlocks; i++) {
      const startY = Math.floor(Math.random() * height)
      const blockHeight = Math.floor(Math.random() * height * 0.15) + 5
      const offset = Math.round((Math.random() - 0.5) * width * distortion * 0.8)
      glitchBlocks.push({
        startY,
        endY: Math.min(height - 1, startY + blockHeight),
        offset,
        colorCorrupt: Math.random() < 0.5
      })
    }

    // Apply horizontal distortion with heavy glitch blocks
    for (let y = 0; y < height; y++) {
      // Check if this row is in a glitch block
      let rowOffset = 0
      let colorCorrupt = false
      
      for (const block of glitchBlocks) {
        if (y >= block.startY && y <= block.endY) {
          rowOffset = block.offset
          colorCorrupt = block.colorCorrupt
          break
        }
      }
      
      // Add random jitter for heavy effect
      const jitter = Math.random() < distortion * 0.6 
        ? Math.round((Math.random() - 0.5) * 30 * distortion)
        : 0
      
      const totalOffset = rowOffset + jitter
      
      for (let x = 0; x < width; x++) {
        const srcX = ((x + totalOffset) % width + width) % width
        
        // Heavy RGB channel separation
        const rSrcX = ((srcX - colorShift) % width + width) % width
        const gSrcX = srcX
        const bSrcX = ((srcX + colorShift) % width + width) % width
        
        // Also add vertical RGB shift for extra glitchiness
        const rSrcY = Math.min(height - 1, Math.max(0, y - Math.round(colorShift * 0.3)))
        const bSrcY = Math.min(height - 1, Math.max(0, y + Math.round(colorShift * 0.3)))
        
        let [r] = this.getPixel(data, width, rSrcX, rSrcY)
        let [, g] = this.getPixel(data, width, gSrcX, y)
        let [, , b] = this.getPixel(data, width, bSrcX, bSrcY)
        
        // Color corruption in glitch blocks
        if (colorCorrupt) {
          const corruptChance = distortion * 0.4
          if (Math.random() < corruptChance) {
            const mode = Math.floor(Math.random() * 4)
            if (mode === 0) { const temp = r; r = b; b = temp }
            else if (mode === 1) { r = Math.min(255, r * 1.8) }
            else if (mode === 2) { g = Math.min(255, g * 1.5) }
            else if (mode === 3) { b = Math.min(255, b * 2) }
          }
        }
        
        // Heavy static noise
        const staticNoise = (Math.random() - 0.5) * 255 * noiseAmount * 1.2
        
        // Occasional bright/dark pixel glitches
        let pixelGlitch = 0
        if (Math.random() < distortion * 0.08) {
          pixelGlitch = Math.random() < 0.5 ? 200 : -150
        }
        
        this.setPixel(result, width, x, y,
          Math.max(0, Math.min(255, r + staticNoise + pixelGlitch)),
          Math.max(0, Math.min(255, g + staticNoise * 0.8 + pixelGlitch)),
          Math.max(0, Math.min(255, b + staticNoise + pixelGlitch)),
          255
        )
      }
    }

    // Add heavy scanlines with variation
    if (effect.scanlines) {
      for (let y = 0; y < height; y++) {
        const scanlineStrength = (y % 3 === 0) ? 0.5 : (y % 2 === 0) ? 0.75 : 1.0
        const bandEffect = Math.sin(y * 0.02) * 0.1 + 0.9
        
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          const multiplier = scanlineStrength * bandEffect
          result[i] = Math.round(result[i] * multiplier)
          result[i + 1] = Math.round(result[i + 1] * multiplier)
          result[i + 2] = Math.round(result[i + 2] * multiplier)
        }
      }
    }

    // Add horizontal tear lines
    const numTears = Math.floor(distortion * 8)
    for (let t = 0; t < numTears; t++) {
      const tearY = Math.floor(Math.random() * height)
      const tearWidth = Math.floor(Math.random() * 3) + 1
      const brightness = Math.random() < 0.5 ? 255 : 0
      
      for (let dy = 0; dy < tearWidth && tearY + dy < height; dy++) {
        for (let x = 0; x < width; x++) {
          if (Math.random() < 0.7) {
            const i = ((tearY + dy) * width + x) * 4
            result[i] = brightness
            result[i + 1] = brightness
            result[i + 2] = brightness
          }
        }
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Halftone effect - print-style dots
   */
  private applyHalftone(imageData: ImageData, effect: HalftoneEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data.length)
    
    // Fill with white
    for (let i = 0; i < result.length; i += 4) {
      result[i] = 255
      result[i + 1] = 255
      result[i + 2] = 255
      result[i + 3] = 255
    }
    
    const dotSize = effect.dotSize * (effect.intensity / 100)
    const spacing = dotSize * 2.5
    const angle = effect.angle * Math.PI / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    for (let gy = -height; gy < height * 2; gy += spacing) {
      for (let gx = -width; gx < width * 2; gx += spacing) {
        // Rotate grid position
        const x = Math.round(gx * cos - gy * sin)
        const y = Math.round(gx * sin + gy * cos)
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const [r, g, b] = this.getPixel(data, width, x, y)
          const brightness = (r + g + b) / 3 / 255
          const radius = dotSize * (1 - brightness)
          
          // Draw dot
          for (let dy = -Math.ceil(dotSize); dy <= Math.ceil(dotSize); dy++) {
            for (let dx = -Math.ceil(dotSize); dx <= Math.ceil(dotSize); dx++) {
              const px = x + dx
              const py = y + dy
              if (px >= 0 && px < width && py >= 0 && py < height) {
                let inShape = false
                
                if (effect.shape === 'circle' || effect.shape === 'ellipse') {
                  inShape = Math.sqrt(dx * dx + dy * dy) <= radius
                } else if (effect.shape === 'square') {
                  inShape = Math.abs(dx) <= radius && Math.abs(dy) <= radius
                } else if (effect.shape === 'line') {
                  inShape = Math.abs(dy) <= radius * 0.3
                }
                
                if (inShape) {
                  this.setPixel(result, width, px, py, 0, 0, 0, 255)
                }
              }
            }
          }
        }
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Mirror effect - reflection/kaleidoscope
   */
  private applyMirror(imageData: ImageData, effect: MirrorEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data)

    if (effect.axis === 'horizontal') {
      const splitX = Math.round(width * (effect.offset / 100))
      for (let y = 0; y < height; y++) {
        for (let x = splitX; x < width; x++) {
          const mirrorX = splitX - (x - splitX)
          if (mirrorX >= 0) {
            const [r, g, b, a] = this.getPixel(data, width, mirrorX, y)
            this.setPixel(result, width, x, y, r, g, b, a)
          }
        }
      }
    } else if (effect.axis === 'vertical') {
      const splitY = Math.round(height * (effect.offset / 100))
      for (let y = splitY; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const mirrorY = splitY - (y - splitY)
          if (mirrorY >= 0) {
            const [r, g, b, a] = this.getPixel(data, width, x, mirrorY)
            this.setPixel(result, width, x, y, r, g, b, a)
          }
        }
      }
    } else if (effect.axis === 'quad') {
      const halfW = width / 2
      const halfH = height / 2
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcX = x < halfW ? x : width - 1 - x
          const srcY = y < halfH ? y : height - 1 - y
          const [r, g, b, a] = this.getPixel(data, width, srcX, srcY)
          this.setPixel(result, width, x, y, r, g, b, a)
        }
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Vignette effect - dark border fade
   */
  private applyVignette(imageData: ImageData, effect: VignetteEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data)
    
    const centerX = width / 2
    const centerY = height / 2
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
    const size = effect.size / 100
    const softness = effect.softness / 100
    
    // Parse vignette color
    const color = this.hexToRgb(effect.color)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - centerX) / centerX
        const dy = (y - centerY) / centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        let vignette = 1
        if (dist > size) {
          vignette = 1 - Math.min(1, (dist - size) / (1 - size + softness))
        }
        
        vignette = Math.pow(vignette, 1 + (1 - softness))
        vignette = vignette * (effect.intensity / 100) + (1 - effect.intensity / 100)
        
        const i = (y * width + x) * 4
        result[i] = Math.round(data[i] * vignette + color.r * (1 - vignette))
        result[i + 1] = Math.round(data[i + 1] * vignette + color.g * (1 - vignette))
        result[i + 2] = Math.round(data[i + 2] * vignette + color.b * (1 - vignette))
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Duotone effect - two-color gradient
   */
  private applyDuotone(imageData: ImageData, effect: DuotoneEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data)
    
    const highlight = this.hexToRgb(effect.highlightColor)
    const shadow = this.hexToRgb(effect.shadowColor)
    const intensity = effect.intensity / 100

    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
      
      const r = shadow.r + (highlight.r - shadow.r) * gray
      const g = shadow.g + (highlight.g - shadow.g) * gray
      const b = shadow.b + (highlight.b - shadow.b) * gray
      
      result[i] = Math.round(data[i] * (1 - intensity) + r * intensity)
      result[i + 1] = Math.round(data[i + 1] * (1 - intensity) + g * intensity)
      result[i + 2] = Math.round(data[i + 2] * (1 - intensity) + b * intensity)
    }

    return new ImageData(result, width, height)
  }

  /**
   * RGB Shift effect - chromatic aberration
   */
  private applyRgbShift(imageData: ImageData, effect: RgbShiftEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data)
    
    const amount = Math.round(effect.amount * (effect.intensity / 100))
    const angle = effect.angle * Math.PI / 180
    const offsetX = Math.round(Math.cos(angle) * amount)
    const offsetY = Math.round(Math.sin(angle) * amount)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Red channel offset
        const rX = Math.max(0, Math.min(width - 1, x - offsetX))
        const rY = Math.max(0, Math.min(height - 1, y - offsetY))
        
        // Blue channel offset
        const bX = Math.max(0, Math.min(width - 1, x + offsetX))
        const bY = Math.max(0, Math.min(height - 1, y + offsetY))
        
        const [r] = this.getPixel(data, width, rX, rY)
        const [, g] = this.getPixel(data, width, x, y)
        const [, , b] = this.getPixel(data, width, bX, bY)
        
        this.setPixel(result, width, x, y, r, g, b, 255)
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Motion Blur effect - directional blur along a line
   */
  private applyMotionBlur(imageData: ImageData, effect: MotionBlurEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data.length)

    const distance = Math.max(1, Math.round(effect.distance * (effect.intensity / 100)))
    const angle = effect.angle * Math.PI / 180
    const offsetX = Math.cos(angle)
    const offsetY = Math.sin(angle)
    const steps = Math.max(1, distance)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0

        for (let i = -steps; i <= steps; i++) {
          const sampleX = Math.round(x + offsetX * i)
          const sampleY = Math.round(y + offsetY * i)

          if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
            const [sr, sg, sb, sa] = this.getPixel(data, width, sampleX, sampleY)
            r += sr
            g += sg
            b += sb
            a += sa
            count++
          }
        }

        if (count === 0) {
          const [sr, sg, sb, sa] = this.getPixel(data, width, x, y)
          this.setPixel(result, width, x, y, sr, sg, sb, sa)
          continue
        }

        this.setPixel(
          result,
          width,
          x,
          y,
          Math.round(r / count),
          Math.round(g / count),
          Math.round(b / count),
          Math.round(a / count)
        )
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Scanlines effect - CRT monitor lines
   */
  private applyScanlines(imageData: ImageData, effect: ScanlinesEffect): ImageData {
    const { width, height, data } = imageData
    const result = new Uint8ClampedArray(data)
    
    const density = effect.density
    const opacity = effect.opacity / 100 * (effect.intensity / 100)

    for (let y = 0; y < height; y++) {
      const isScanline = y % (density * 2) < density
      
      if (isScanline) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          result[i] = Math.round(data[i] * (1 - opacity))
          result[i + 1] = Math.round(data[i + 1] * (1 - opacity))
          result[i + 2] = Math.round(data[i + 2] * (1 - opacity))
        }
      }
    }

    return new ImageData(result, width, height)
  }

  /**
   * Helper: Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }

  /**
   * Convert ImageData to base64 data URL
   */
  toDataURL(imageData: ImageData, mimeType: string = 'image/png'): string {
    this.canvas.width = imageData.width
    this.canvas.height = imageData.height
    this.ctx.putImageData(imageData, 0, 0)
    return this.canvas.toDataURL(mimeType)
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
}

// Export singleton instance
export const imageEffectsProcessor = new ImageEffectsProcessor()
