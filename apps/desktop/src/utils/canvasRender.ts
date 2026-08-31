import { FabricCanvas } from '@/app/fabricCanvas'

let renderScheduled = false
let canvas: FabricCanvas | null = null

/**
 * Throttled render using requestAnimationFrame
 * Prevents multiple renders in the same frame
 */
export const throttledRender = (canvasInstance: FabricCanvas) => {
  canvas = canvasInstance
  
  if (renderScheduled) return
  
  renderScheduled = true
  requestAnimationFrame(() => {
    if (canvas) {
      canvas.renderAll()
    }
    renderScheduled = false
  })
}

/**
 * Debounced render for less critical updates
 */
let renderTimeout: ReturnType<typeof setTimeout> | null = null

export const debouncedRender = (canvasInstance: FabricCanvas, delay = 16) => {
  if (renderTimeout) {
    clearTimeout(renderTimeout)
  }
  
  renderTimeout = setTimeout(() => {
    canvasInstance.renderAll()
    renderTimeout = null
  }, delay)
}

/**
 * Batch multiple operations and render once
 */
export const batchRender = (canvasInstance: FabricCanvas, operations: (() => void)[]) => {
  // Disable rendering during batch operations
  canvasInstance.renderOnAddRemove = false
  
  operations.forEach(op => op())
  
  // Re-enable and render once
  canvasInstance.renderOnAddRemove = true
  throttledRender(canvasInstance)
}
