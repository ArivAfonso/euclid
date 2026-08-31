import { Canvas, FabricObject, Point, TBBox, util } from 'fabric'
import { Disposable } from '@/utils/lifecycle'
import { px2inch, px2mm } from '@/utils/image'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'

type DistancePoint = { target: Point; xPoint: Point; yPoint: Point }

type DistanceMap = {
  origin: TBBox
  target: TBBox
  points: DistancePoint[]
}

export class FabricDistanceGuide extends Disposable {
  private readonly color = 'rgba(239, 68, 68, 0.95)'
  private readonly lineWidth = 1.5
  private readonly lineDash = [6, 2]
  private readonly fontSize = 11
  private readonly fontFamily = 'sans-serif'
  private readonly padding = 4
  private readonly space = 5
  private readonly margin = 8
  private altMap?: DistanceMap
  private hoveredTarget?: FabricObject
  private readonly canvasEvents

  constructor(private readonly canvas: Canvas) {
    super()
    this.mouseOver = this.mouseOver.bind(this)
    this.mouseOut = this.mouseOut.bind(this)
    this.mouseDown = this.mouseDown.bind(this)
    this.beforeRender = this.beforeRender.bind(this)
    this.afterRender = this.afterRender.bind(this)
    this.keydown = this.keydown.bind(this)
    this.keyup = this.keyup.bind(this)

    this.canvasEvents = {
      'mouse:over': this.mouseOver,
      'mouse:out': this.mouseOut,
      'mouse:down': this.mouseDown,
      'before:render': this.beforeRender,
      'after:render': this.afterRender,
    }
    canvas.on(this.canvasEvents as any)
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
  }

  private mouseOver({ target, e }: any) {
    this.hoveredTarget = target?.selectable ? target : undefined
    if (e?.altKey) this.setAltMap()
    this.canvas.requestRenderAll()
  }

  private mouseOut({ target, e }: any) {
    if (!target || target === this.hoveredTarget) this.hoveredTarget = undefined
    if (!e?.altKey) delete this.altMap
    this.canvas.requestRenderAll()
  }

  private mouseDown() {
    delete this.altMap
    this.canvas.once('mouse:up', () => this.canvas.requestRenderAll())
  }

  private keydown(e: KeyboardEvent) {
    if (e.key !== 'Alt') return
    this.setAltMap()
    this.canvas.requestRenderAll()
  }

  private keyup(e: KeyboardEvent) {
    if (e.key !== 'Alt') return
    delete this.altMap
    this.canvas.requestRenderAll()
  }

  private setAltMap() {
    const origin = this.canvas.getActiveObject()
    const target = this.hoveredTarget
    if (!origin || !target || origin === target || !target.visible) {
      delete this.altMap
      return
    }

    const originBox = util.makeBoundingBoxFromPoints(origin.getCoords())
    const targetBox = util.makeBoundingBoxFromPoints(target.getCoords())
    const points = this.getDistancePoints(originBox, targetBox)
    this.altMap = { origin: originBox, target: targetBox, points }
  }

  private getDistancePoints(origin: TBBox, target: TBBox): DistancePoint[] {
    const originEdges = {
      top: new Point(origin.left + origin.width / 2, origin.top),
      right: new Point(origin.left + origin.width, origin.top + origin.height / 2),
      bottom: new Point(origin.left + origin.width / 2, origin.top + origin.height),
      left: new Point(origin.left, origin.top + origin.height / 2),
    }
    const corners = [
      new Point(target.left, target.top),
      new Point(target.left + target.width, target.top),
      new Point(target.left + target.width, target.top + target.height),
      new Point(target.left, target.top + target.height),
    ]
    const points = corners.map((point, index) => {
      const horizontal = index === 0 || index === 3
      const vertical = index < 2
      let xPoint = horizontal ? originEdges.right : originEdges.left
      let xDistance = horizontal ? point.x - xPoint.x : xPoint.x - point.x
      if (xDistance < 0) {
        xPoint = horizontal ? originEdges.left : originEdges.right
        xDistance = horizontal ? point.x - xPoint.x : xPoint.x - point.x
      }
      let yPoint = vertical ? originEdges.bottom : originEdges.top
      let yDistance = vertical ? point.y - yPoint.y : yPoint.y - point.y
      if (yDistance < 0) {
        yPoint = vertical ? originEdges.top : originEdges.bottom
        yDistance = vertical ? point.y - yPoint.y : yPoint.y - point.y
      }
      return { target: point, xPoint, yPoint, xDistance, yDistance }
    })

    const separated = points.filter((point) => point.xDistance >= 0 && point.yDistance >= 0)
    const candidates = separated.length ? separated : points.filter((point) => point.xDistance >= 0 || point.yDistance >= 0)
    return candidates.map(({ target, xPoint, yPoint }) => ({ target, xPoint, yPoint }))
  }

  private getUnit(value: number) {
    const { unitMode } = storeToRefs(useMainStore())
    if (unitMode.value === 0) return px2mm(value)
    if (unitMode.value === 2) return px2inch(value)
    return value
  }

  private formatDistance(value: number) {
    const { unitMode } = storeToRefs(useMainStore())
    return Math.abs(this.getUnit(value)).toFixed(unitMode.value === 1 ? 0 : 1)
  }

  private drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, scale: number) {
    const padding = this.padding * scale
    const boxWidth = width + padding * 2
    const boxHeight = height + padding * 2
    const radius = 5 * scale
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

    ctx.beginPath()
    ctx.roundRect(x, y, boxWidth, boxHeight, radius)
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(255, 255, 255, 0.96)'
    ctx.fill()
    ctx.strokeStyle = 'rgb(239, 68, 68)'
    ctx.lineWidth = 1.25 * scale
    ctx.stroke()

    ctx.fillStyle = this.color
    ctx.fillText(text, x + padding, y + padding + height / 2)
  }

  private drawDistance(ctx: CanvasRenderingContext2D, point: DistancePoint, scale: number) {
    const xDistance = point.target.x - point.xPoint.x
    const yDistance = point.target.y - point.yPoint.y
    const lineDash = this.lineDash.map((value) => value * scale)
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(point.xPoint.x, point.xPoint.y)
    ctx.lineTo(point.target.x, point.xPoint.y)
    ctx.moveTo(point.yPoint.x, point.yPoint.y)
    ctx.lineTo(point.yPoint.x, point.target.y)
    ctx.stroke()
    ctx.setLineDash(lineDash)
    ctx.beginPath()
    ctx.moveTo(point.target.x, point.xPoint.y)
    ctx.lineTo(point.target.x, point.target.y)
    ctx.lineTo(point.yPoint.x, point.target.y)
    ctx.stroke()

    const height = this.fontSize * scale
    ctx.font = `${this.fontSize * scale}px ${this.fontFamily}`
    const xText = this.formatDistance(xDistance)
    const yText = this.formatDistance(yDistance)
    const xWidth = ctx.measureText(xText).width
    const yWidth = ctx.measureText(yText).width
    if (xDistance) this.drawText(ctx, xText, (point.xPoint.x + point.target.x - xWidth) / 2, point.xPoint.y + this.space * scale, xWidth, height, scale)
    if (yDistance) this.drawText(ctx, yText, point.yPoint.x + this.space * scale, (point.yPoint.y + point.target.y - height) / 2, yWidth, height, scale)
  }

  private beforeRender() {
    this.canvas.clearContext(this.canvas.getTopContext())
  }

  private afterRender() {
    if (!this.altMap) return
    const ctx = this.canvas.getTopContext()
    const scale = 1 / this.canvas.getZoom()
    const viewportTransform = this.canvas.viewportTransform
    ctx.save()
    ctx.transform(...viewportTransform)
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.lineWidth * scale
    ctx.textBaseline = 'middle'
    for (const point of this.altMap.points) this.drawDistance(ctx, point, scale)
    ctx.restore()
  }

  public dispose() {
    super.dispose()
    this.canvas.off(this.canvasEvents as any)
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
  }
}
