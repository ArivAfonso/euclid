/**
 * Multi-step (progressive) image downscaling for canvas.
 *
 * A single `drawImage` call that shrinks an image by a large factor samples
 * only a few source pixels per destination pixel (bilinear looks at a 2×2
 * neighbourhood), so most of the source is skipped — producing aliasing,
 * jagged edges and moiré. Halving the image repeatedly keeps every pass at a
 * ratio ≥ 0.5, where bilinear filtering averages every source pixel, and the
 * final pass lands exactly on the requested size.
 */

export interface Size {
  width: number
  height: number
}

export type DownscaleSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas

export interface DownscaleOptions {
  /** Per-pass reduction factor, in (0, 1). 0.5 (halving) is the sweet spot. */
  stepFactor?: number
  /** Canvas factory, overridable for tests / workers. */
  createCanvas?: (width: number, height: number) => HTMLCanvasElement
}

const defaultCreateCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export const getSourceSize = (source: DownscaleSource): Size => {
  const el = source as HTMLImageElement
  return {
    width: el.naturalWidth || el.width,
    height: el.naturalHeight || el.height,
  }
}

/**
 * Compute the intermediate sizes for a progressive downscale, ending with the
 * exact target. Each axis shrinks by `stepFactor` per pass until one more pass
 * would undershoot the target; axes that are already small enough stay put.
 * Upscaling (or equal) targets yield a single step.
 */
export const computeDownscaleSteps = (
  source: Size,
  target: Size,
  stepFactor = 0.5,
): Size[] => {
  if (!(stepFactor > 0 && stepFactor < 1)) {
    throw new RangeError(`stepFactor must be in (0, 1), got ${stepFactor}`)
  }
  const targetW = Math.max(1, Math.round(target.width))
  const targetH = Math.max(1, Math.round(target.height))
  const steps: Size[] = []
  let w = source.width
  let h = source.height

  while (true) {
    const nextW = w * stepFactor >= targetW ? Math.round(w * stepFactor) : w
    const nextH = h * stepFactor >= targetH ? Math.round(h * stepFactor) : h
    if (nextW === w && nextH === h) break
    w = nextW
    h = nextH
    steps.push({ width: w, height: h })
  }

  const last = steps[steps.length - 1]
  if (!last || last.width !== targetW || last.height !== targetH) {
    steps.push({ width: targetW, height: targetH })
  }
  return steps
}

const prepareContext = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

/**
 * Downscale `source` to `target` through successive passes and return a new
 * canvas of exactly the target size. Intermediate passes ping-pong between two
 * scratch canvases (drawing into their top-left region) so memory stays bounded
 * regardless of how many steps are needed.
 */
export const stepDownscale = (
  source: DownscaleSource,
  target: Size,
  options: DownscaleOptions = {},
): HTMLCanvasElement => {
  const { stepFactor = 0.5, createCanvas = defaultCreateCanvas } = options
  const srcSize = getSourceSize(source)
  const steps = computeDownscaleSteps(srcSize, target, stepFactor)
  const final = steps[steps.length - 1]

  const output = createCanvas(final.width, final.height)
  const outCtx = prepareContext(output)

  if (steps.length === 1) {
    outCtx.drawImage(source as CanvasImageSource, 0, 0, srcSize.width, srcSize.height, 0, 0, final.width, final.height)
    return output
  }

  // Scratch buffers are sized to the first (largest) intermediate step.
  const first = steps[0]
  const scratch = [createCanvas(first.width, first.height), createCanvas(first.width, first.height)]
  const scratchCtx = scratch.map(prepareContext)

  let current: CanvasImageSource = source as CanvasImageSource
  let curW = srcSize.width
  let curH = srcSize.height

  for (let i = 0; i < steps.length - 1; i++) {
    const { width, height } = steps[i]
    const buf = i % 2
    scratchCtx[buf].clearRect(0, 0, width, height)
    scratchCtx[buf].drawImage(current, 0, 0, curW, curH, 0, 0, width, height)
    current = scratch[buf]
    curW = width
    curH = height
  }

  outCtx.drawImage(current, 0, 0, curW, curH, 0, 0, final.width, final.height)

  // Release scratch backing stores eagerly; large canvases are slow to GC.
  scratch.forEach(c => {
    c.width = 0
    c.height = 0
  })
  return output
}
