import { describe, expect, it, vi } from 'vitest'
import { computeDownscaleSteps, stepDownscale } from '@/utils/downscale'

const fakeCanvasFactory = () => {
  const draws: { canvas: any; args: number[] }[] = []
  const created: any[] = []
  const createCanvas = (width: number, height: number) => {
    const canvas: any = { width, height }
    canvas.getContext = () => ({
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
      clearRect: vi.fn(),
      drawImage: (_src: unknown, ...args: number[]) => draws.push({ canvas, args }),
    })
    created.push(canvas)
    return canvas as HTMLCanvasElement
  }
  return { createCanvas, draws, created }
}

describe('utils/downscale', () => {
  describe('computeDownscaleSteps', () => {
    it('halves until the next halving would undershoot, then lands on the target', () => {
      expect(computeDownscaleSteps({ width: 2000, height: 2000 }, { width: 200, height: 200 })).toEqual([
        { width: 1000, height: 1000 },
        { width: 500, height: 500 },
        { width: 250, height: 250 },
        { width: 200, height: 200 },
      ])
    })

    it('keeps every pass at a ratio of at least the step factor', () => {
      const steps = computeDownscaleSteps({ width: 4032, height: 3024 }, { width: 37, height: 91 })
      let prev = { width: 4032, height: 3024 }
      for (const step of steps) {
        expect(step.width / prev.width).toBeGreaterThanOrEqual(0.5 - 1e-3)
        expect(step.height / prev.height).toBeGreaterThanOrEqual(0.5 - 1e-3)
        prev = step
      }
      expect(prev).toEqual({ width: 37, height: 91 })
    })

    it('shrinks each axis independently', () => {
      const steps = computeDownscaleSteps({ width: 1000, height: 100 }, { width: 100, height: 80 })
      expect(steps.every(s => s.height === 100 || s.height === 80)).toBe(true)
      expect(steps.at(-1)).toEqual({ width: 100, height: 80 })
    })

    it('uses a single pass for mild reductions and upscales', () => {
      expect(computeDownscaleSteps({ width: 100, height: 100 }, { width: 60, height: 60 })).toEqual([{ width: 60, height: 60 }])
      expect(computeDownscaleSteps({ width: 100, height: 100 }, { width: 300, height: 300 })).toEqual([{ width: 300, height: 300 }])
    })

    it('honours a custom step factor and rejects invalid ones', () => {
      expect(computeDownscaleSteps({ width: 1000, height: 1000 }, { width: 100, height: 100 }, 0.25)).toEqual([
        { width: 250, height: 250 },
        { width: 100, height: 100 },
      ])
      expect(() => computeDownscaleSteps({ width: 1, height: 1 }, { width: 1, height: 1 }, 1)).toThrow(RangeError)
    })

    it('clamps the target to at least 1px', () => {
      expect(computeDownscaleSteps({ width: 4, height: 4 }, { width: 0, height: 0.2 }).at(-1)).toEqual({ width: 1, height: 1 })
    })
  })

  describe('stepDownscale', () => {
    it('draws through each intermediate step and returns a canvas of the exact target size', () => {
      const { createCanvas, draws, created } = fakeCanvasFactory()
      const source = { width: 2000, height: 1000 } as HTMLCanvasElement

      const out = stepDownscale(source, { width: 200, height: 100 }, { createCanvas })

      expect(out.width).toBe(200)
      expect(out.height).toBe(100)
      // 2000→1000→500→250→200: three intermediate passes + final pass
      expect(draws.map(d => d.args.slice(-2))).toEqual([[1000, 500], [500, 250], [250, 125], [200, 100]])
      expect(draws.at(-1)!.canvas).toBe(out)
      // scratch buffers are released
      expect(created.filter(c => c !== out).every(c => c.width === 0 && c.height === 0)).toBe(true)
    })

    it('uses a single draw when no intermediate step is needed', () => {
      const { createCanvas, draws, created } = fakeCanvasFactory()
      stepDownscale({ width: 100, height: 100 } as HTMLCanvasElement, { width: 70, height: 70 }, { createCanvas })
      expect(draws).toHaveLength(1)
      expect(created).toHaveLength(1)
    })
  })
})
