import { useMainStore } from '@/store'
import { check } from '@/utils/check'
import { nonid } from '@/utils/common'
import { Canvas, FabricImage, FabricObject, Point, TMat2D } from 'fabric'
import { shallowRef } from 'vue'
import { toRef } from './attribute/toRef'
import type { FabricRuler } from './fabricRuler'
import { WorkSpaceDrawType } from '@/configs/canvas'

export class FabricCanvas extends Canvas {
  public rulerInstance?: FabricRuler
  public loading?: FabricImage
  public activeObject = shallowRef<FabricObject>()

  constructor(el: string | HTMLCanvasElement, options?: any) {
    super(el, options)
  }

  // @ts-ignore
  public get _activeObject() {
    return this.activeObject ? this.activeObject.value : undefined
  }

  public set _activeObject(value) {
    const mainStore = useMainStore()
    mainStore.setCanvasObject(value as FabricObject)
    this.activeObject.value = value
  }

  // @ts-ignore
  override _isSelectionKeyPressed(e: any) {
    return e.shiftKey || e.ctrlKey || e.metaKey;
  }

  override add(...objects: FabricObject[]): number {
    return super.add(
      ...objects.map((obj) => {
        this.setDefaultAttr(obj)
        return toRef(obj)
      }),
    )
  }

  override insertAt(index: number, ...objects: FabricObject[]): number {
    return super.insertAt(
      index,
      ...objects.map((obj) => {
        this.setDefaultAttr(obj)
        return toRef(obj)
      }),
    )
  }

  private setDefaultAttr(target: FabricObject) {
    // Add name
    if (!target.name) {
      target.set({name: target.type})
    }
    // Add id
    if (!target.id) {
      target.set({id: nonid(8)})
    }
    if (check.isTextObject(target)) {
      target.set({color: target.fill})
    }
    if (check.isCollection(target)) {
      target._objects.forEach((obj) => {
        this.setDefaultAttr(obj)
      })
    }
  }

  /**
   * Get the workspace object boundaries for pan limiting
   * Returns the allowed pan boundaries based on workspace size and canvas viewport
   */
  private getPanBounds(): { minX: number; maxX: number; minY: number; maxY: number } | null {
    const workspace = this.getObjects().find(obj => obj.id === WorkSpaceDrawType)
    if (!workspace) return null

    const zoom = this.getZoom()
    const canvasWidth = this.getWidth()
    const canvasHeight = this.getHeight()
    
    // Get workspace dimensions and position in screen coordinates
    const wsWidth = (workspace.width || 0) * zoom
    const wsHeight = (workspace.height || 0) * zoom
    const wsLeft = (workspace.left || 0) * zoom
    const wsTop = (workspace.top || 0) * zoom
    
    // Calculate the workspace center in screen space
    const wsCenterX = wsLeft + wsWidth / 2
    const wsCenterY = wsTop + wsHeight / 2
    
    // Allow panning so that workspace stays at least 20% visible in viewport
    // This means the workspace center can move at most (canvas dimension + workspace dimension / 2) from viewport center
    const maxOffsetX = canvasWidth * 0.8 + wsWidth / 2
    const maxOffsetY = canvasHeight * 0.8 + wsHeight / 2
    
    // vpt[4] and vpt[5] are the translation values
    // The workspace appears at position (wsLeft + vpt[4], wsTop + vpt[5]) on screen
    // We want: wsCenterX + vpt[4] to stay within [-maxOffsetX + canvasWidth/2, maxOffsetX + canvasWidth/2]
    // Solving for vpt[4]: vpt[4] should be within [canvasWidth/2 - maxOffsetX - wsCenterX, canvasWidth/2 + maxOffsetX - wsCenterX]
    
    const minX = canvasWidth / 2 - maxOffsetX - wsCenterX
    const maxX = canvasWidth / 2 + maxOffsetX - wsCenterX
    const minY = canvasHeight / 2 - maxOffsetY - wsCenterY
    const maxY = canvasHeight / 2 + maxOffsetY - wsCenterY
    
    return { minX, maxX, minY, maxY }
  }

  /**
   * Clamp pan position within allowed bounds
   */
  private clampPan(vpt: TMat2D): TMat2D {
    const bounds = this.getPanBounds()
    if (!bounds) return vpt
    
    // Ensure min <= max (swap if needed due to calculation edge cases)
    const actualMinX = Math.min(bounds.minX, bounds.maxX)
    const actualMaxX = Math.max(bounds.minX, bounds.maxX)
    const actualMinY = Math.min(bounds.minY, bounds.maxY)
    const actualMaxY = Math.max(bounds.minY, bounds.maxY)
    
    const clampedVpt: TMat2D = [...vpt]
    clampedVpt[4] = Math.max(actualMinX, Math.min(actualMaxX, vpt[4]))
    clampedVpt[5] = Math.max(actualMinY, Math.min(actualMaxY, vpt[5]))
    
    return clampedVpt
  }

  override absolutePan(point: Point, skipSetCoords?: boolean) {
    const vpt: TMat2D = [...this.viewportTransform]
    vpt[4] = -point.x
    vpt[5] = -point.y
    
    // Apply pan bounds
    const clampedVpt = this.clampPan(vpt)
    
    if (skipSetCoords) {
      this.viewportTransform = clampedVpt
      this.requestRenderAll()
      return
    }
    this.setViewportTransform(clampedVpt)
  }

  override relativePan(point: Point, skipSetCoords?: boolean) {
    return this.absolutePan(
      new Point(
        -point.x - this.viewportTransform[4],
        -point.y - this.viewportTransform[5]
      ),
      skipSetCoords
    )
  }
}
