import { Keybinding } from './keybinding'
import { Disposable } from '@/utils/lifecycle'
import { computed, watchEffect } from 'vue'
// import { useThemes } from '@/hooks/useThemes'
import { DesignUnitMode } from '@/configs/background'
import { PiBy180, isMobile } from '@/utils/common'
import { TAxis, Point, Rect as fabricRect, Object as FabricObject, TPointerEventInfo, TPointerEvent } from 'fabric'
import { useMainStore, useTemplatesStore } from '@/store'
import { storeToRefs } from 'pinia'
import { px2mm, px2inch, mm2px, inch2px } from '@/utils/image'
import { ElementNames } from '@/types/elements'
import type { FabricCanvas } from './fabricCanvas'
import { ReferenceLine } from '@/extension/object/ReferenceLine'
import { WorkSpaceDrawType } from '@/configs/canvas'

type Rect = { left: number; top: number; width: number; height: number }

/**
 * Configuration
 */
export interface RulerOptions {
  /**
   * Ruler width and height
   * @default 10
   */
  ruleSize?: number

  /**
   * Font size
   * @default 10
   */
  fontSize?: number

  /**
   * Whether ruler is enabled
   * @default false
   */
  enabled?: boolean

  /**
   * Background color
   */
  backgroundColor?: string

  /**
   * Text color
   */
  textColor?: string

  /**
   * Border color
   */
  borderColor?: string

  /**
   * Highlight color
   */
  highlightColor?: string
  /**
   * Highlight color
   */
  unitName: string

}

export type HighlightRect = {skip?: TAxis} & Rect

export class FabricRuler extends Disposable {
  private canvasEvents
  public lastCursor: string
  public workSpaceDraw?: fabricRect
  public options: Required<RulerOptions>
  public tempReferenceLine?: ReferenceLine
  private activeOn: string = "up"
  private objectRect: undefined | { 
    x: HighlightRect[],
    y: HighlightRect[]
  }

  constructor(private readonly canvas: FabricCanvas) {
    super()
    this.lastCursor = this.canvas.defaultCursor
    // Merge default config
    this.options = Object.assign({
      ruleSize: 20,
      fontSize: 8,
      enabled: isMobile() ? false : true,
    })

    const mainStore = useMainStore()
    const { unitMode, isDarkMode } = storeToRefs(mainStore)
    
    watchEffect(() => {
      const unitName = DesignUnitMode.filter(ele => ele.id === unitMode.value)[0].name
      this.options = {
        ...this.options,
        ...(isDarkMode.value 
          ? {
              backgroundColor: 'hsl(0, 0%, 9%)',
              borderColor: 'hsl(0, 0%, 18%)',
              highlightColor: 'hsla(0, 0%, 45%, 0.15)',
              textColor: 'hsl(0, 0%, 65%)',
              unitName: unitName,
            }
          : {
              backgroundColor: '#ffffff',
              borderColor: 'hsl(0, 0%, 85%)',
              highlightColor: 'hsla(0, 0%, 0%, 0.08)',
              textColor: 'hsl(0, 0%, 30%)',
              unitName: unitName,
            }),
      }
      this.render({ ctx: this.canvas.contextContainer })
    })
    
    this.canvasEvents = {
      'after:render': this.render.bind(this),
      'mouse:move': this.mouseMove.bind(this),
      'mouse:down': this.mouseDown.bind(this),
      'mouse:up': this.mouseUp.bind(this),
      'referenceline:moving': this.referenceLineMoving.bind(this),
      'referenceline:mouseup': this.referenceLineMouseup.bind(this),
    }
    this.enabled = this.options.enabled
    canvas.rulerInstance = this
  }

  public getPointHover(point: Point): 'vertical' | 'horizontal' | '' {
    if (
      new fabricRect({
        left: 0,
        top: 0,
        width: this.options.ruleSize,
        height: this.canvas.height,
        absolutePositioned: true,
      }).containsPoint(point)
    ) {
      return 'vertical';
    } else if (
      new fabricRect({
        left: 0,
        top: 0,
        width: this.canvas.width, 
        height: this.options.ruleSize,
        absolutePositioned: true,
      }).containsPoint(point)
    ) {
      return 'horizontal';
    }
    return '';
  }

  private mouseMove(e: TPointerEventInfo<TPointerEvent>) {
    if (!e.viewportPoint) return
    if (this.tempReferenceLine && e.scenePoint) {
      const pos: Partial<ReferenceLine> = {};
      if (this.tempReferenceLine.axis === 'horizontal') {
        pos.top = e.scenePoint.y;
      } 
      else {
        pos.left = e.scenePoint.x;
      }
      this.tempReferenceLine.set({ ...pos, visible: true });
      this.canvas.renderAll();
      const event = this.getCommonEventInfo(e) as any;
      this.canvas.fire('object:moving', event);
      this.tempReferenceLine.fire('moving', event);
    }
    const status = this.getPointHover(e.viewportPoint)
    this.canvas.defaultCursor = this.lastCursor
    if (!status) return
    this.lastCursor = this.canvas.defaultCursor
    this.canvas.defaultCursor = status === 'horizontal' ? 'ns-resize' : 'ew-resize';
  }

  private mouseDown(e: TPointerEventInfo<TPointerEvent>) {
    const pointHover = this.getPointHover(e.viewportPoint)
    if (!pointHover) return
    if (this.activeOn === 'up') {
      this.canvas.selection = false
      this.activeOn = 'down'
      const point = pointHover === 'horizontal' ? e.viewportPoint.y : e.viewportPoint.x
      this.tempReferenceLine = new ReferenceLine(
        point,
        {
          type: 'ReferenceLine',
          axis: pointHover,
          visible: false,
          name: 'ReferenceLine',
          hasControls: false,
          hasBorders: false,
          stroke: 'pink',
          fill: 'pink',
          originX: 'center',
          originY: 'center',
          padding: 4,
          globalCompositeOperation: 'difference',
        }
      );
      this.canvas.add(this.tempReferenceLine)
      const templatesStore = useTemplatesStore()
      templatesStore.addElement(this.tempReferenceLine)
      this.canvas.setActiveObject(this.tempReferenceLine)
      this.canvas._setupCurrentTransform(e.e, this.tempReferenceLine, true)
      this.tempReferenceLine.fire('down', this.getCommonEventInfo(e));
    }
  }

  private getCommonEventInfo(e: TPointerEventInfo<TPointerEvent>) {
    if (!this.tempReferenceLine || !e.scenePoint) return;
    return {
      e: e.e,
      transform: this.tempReferenceLine.get('transform'),
      pointer: {
        x: e.scenePoint.x,
        y: e.scenePoint.y,
      },
      target: this.tempReferenceLine,
    };
  }

  private mouseUp(e: TPointerEventInfo<TPointerEvent>) {
    if (this.activeOn !== 'down') return;
    this.canvas.selection = true
    this.tempReferenceLine!.selectable = false
    this.canvas.renderAll()
    this.activeOn = 'up';
    // @ts-ignore
    this.tempReferenceLine?.fire('up', this.getCommonEventInfo(e));
    this.tempReferenceLine = undefined;
  }

  public setWorkSpaceDraw() {
    this.workSpaceDraw = this.canvas.getObjects().filter(item => item.id === WorkSpaceDrawType)[0] as fabricRect
  }

  public isRectOut(object: FabricObject, target: ReferenceLine): boolean {
    // const { top, height, left, width } = object;

    // if (top === undefined || height === undefined || left === undefined || width === undefined) {
    //   return false;
    // }

    // const targetRect = target.getBoundingRect(true, true);
    // const {
    //   top: targetTop,
    //   height: targetHeight,
    //   left: targetLeft,
    //   width: targetWidth,
    // } = targetRect;

    // if (target.isHorizontal() && (top > targetTop + 1 || top + height < targetTop + targetHeight - 1)) {
    //   return true;
    // } 
    // else if (!target.isHorizontal() && (left > targetLeft + 1 || left + width < targetLeft + targetWidth - 1)) {
    //   return true;
    // }

    return false;
  };

  referenceLineMoving(e: any) {
    if (!this.workSpaceDraw) {
      this.setWorkSpaceDraw();
      return;
    }
    const { target } = e;
    if (this.isRectOut(this.workSpaceDraw, target)) {
      target.moveCursor = 'not-allowed';
    }
  } 

  referenceLineMouseup(e: any) {
    if (!this.workSpaceDraw) {
      this.setWorkSpaceDraw();
      return;
    }
    const { target } = e;
    if (this.isRectOut(this.workSpaceDraw, target)) {
      this.canvas.remove(target);
      this.canvas.setCursor(this.canvas.defaultCursor ?? '');
    }
  }

  public get enabled() {
    return this.options.enabled
  }

  public set enabled(value) {
    this.options.enabled = value
    if (value) {
      this.canvas.on(this.canvasEvents)
      this.render({ ctx: this.canvas.contextContainer })
    } else {
      this.canvas.off(this.canvasEvents)
      this.canvas.requestRenderAll()
    }
  }

  /**
   * Get canvas dimensions
   */
  private getSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    }
  }

  private render({ ctx }: { ctx: CanvasRenderingContext2D }) {
    if (ctx !== this.canvas.contextContainer) return
    if (!this.enabled) return
    const { viewportTransform: vpt } = this.canvas

    // Calculate element rectangle
    this.calcObjectRect()

    // Draw ruler
    this.draw({
      ctx,
      isHorizontal: true,
      rulerLength: this.getSize().width,
      startCalibration: -(vpt[4] / vpt[0]),
    })
    this.draw({
      ctx,
      isHorizontal: false,
      rulerLength: this.getSize().height,
      startCalibration: -(vpt[5] / vpt[3]),
    })

    const { borderColor, backgroundColor, ruleSize } = this.options

    this.darwRect(ctx, {
      left: 0,
      top: 0,
      width: ruleSize,
      height: ruleSize,
      fill: backgroundColor,
      stroke: borderColor,
    })
  }

  private draw(opt: {ctx: CanvasRenderingContext2D, isHorizontal: boolean, rulerLength: number, startCalibration: number}) {
    const { ctx, isHorizontal, rulerLength, startCalibration } = opt
    const zoom = this.canvas.getZoom()

    // The major tick must be anchored in the selected unit, not in the
    // previous pixel position. Otherwise panning makes mm/in labels drift
    // away from their actual unit boundaries.
    const { gap, displayGap, toDisplay, fromDisplay } = this.getRulerMetrics(zoom)
    const unitLength = Math.ceil(rulerLength / zoom)
    const startDisplay = Math.floor((toDisplay(startCalibration) + Number.EPSILON) / displayGap) * displayGap
    const startValue = fromDisplay(startDisplay)
    const startOffset = startValue - startCalibration

    const canvasSize = this.getSize()

    const { textColor, borderColor, ruleSize, highlightColor } = this.options

    // Text top offset
    const padding = 2.5

    // Background
    this.darwRect(ctx, {
      left: 0,
      top: 0,
      width: isHorizontal ? canvasSize.width : ruleSize,
      height: isHorizontal ? ruleSize : canvasSize.height,
      fill: this.options.backgroundColor,
      stroke: this.options.borderColor,
    })

    // Ruler tick marks display
    for (let pos = 0; pos + startOffset <= unitLength; pos += gap) {
      for (let index = 0; index < 10; index++) {
        const position = Math.round((startOffset + pos + (gap * index) / 10) * zoom)
        const isMajorLine = index === 0
        const [left, top] = isHorizontal ? [position, isMajorLine ? 0 : ruleSize - 8] : [isMajorLine ? 0 : ruleSize - 8, position]
        const [width, height] = isHorizontal ? [0, ruleSize - top] : [ruleSize - left, 0]
        this.darwLine(ctx, {
          left,
          top,
          width,
          height,
          stroke: borderColor,
        })
      }
    }

    // Ruler blue overlay
    if (this.objectRect) {
      const axis = isHorizontal ? 'x' : 'y'
      this.objectRect[axis].forEach((rect) => {
        // Skip specified rectangle
        if (rect.skip === axis) return

        const [left, top, width, height] = isHorizontal ? [(rect.left - startCalibration) * zoom, 0, rect.width * zoom, ruleSize] : [0, (rect.top - startCalibration) * zoom, ruleSize, rect.height * zoom]

        // Highlight overlay
        // ctx.save()
        this.darwRect(ctx, {
          left,
          top,
          width,
          height,
          fill: highlightColor,
        })
        // ctx.restore()
      })
    }

    // Ruler text display
    for (let pos = 0; pos + startOffset <= unitLength; pos += gap) {
      const position = (startOffset + pos) * zoom
      const displayValue = startDisplay + (pos / gap) * displayGap
      let textValue = displayValue.toString()
      if (this.options.unitName === 'mm') textValue = this.formatRulerValue(displayValue, 0)
      if (this.options.unitName === 'inch') textValue = this.formatRulerValue(displayValue, 2)
      const [left, top, angle] = isHorizontal ? [position + 6, padding, 0] : [padding, position - 6, -90]

      this.darwText(ctx, {
        text: textValue,
        left,
        top,
        fill: textColor,
        angle,
      })
    }
    // draw end
  }

  private getRulerMetrics(zoom: number) {
    const pixelGap = this.getGap(zoom)
    const unitName = this.options.unitName

    if (unitName === 'mm') {
      const displayGap = this.getDisplayGap(pixelGap, [1, 2, 5, 10, 20, 50, 100], mm2px)
      return {
        gap: mm2px(displayGap),
        displayGap,
        toDisplay: px2mm,
        fromDisplay: mm2px,
      }
    }

    if (unitName === 'inch') {
      const displayGap = this.getDisplayGap(pixelGap, [0.1, 0.2, 0.5, 1, 2, 5, 10], inch2px)
      return {
        gap: inch2px(displayGap),
        displayGap,
        toDisplay: px2inch,
        fromDisplay: inch2px,
      }
    }

    return {
      gap: pixelGap,
      displayGap: pixelGap,
      toDisplay: (value: number) => value,
      fromDisplay: (value: number) => value,
    }
  }

  private getDisplayGap(pixelGap: number, candidates: number[], fromDisplay: (value: number) => number) {
    return candidates.find((candidate) => fromDisplay(candidate) >= pixelGap) ?? candidates[candidates.length - 1]
  }

  private formatRulerValue(value: number, decimals: number) {
    const normalized = Math.abs(value) < 1e-8 ? 0 : value
    return normalized.toFixed(decimals)
  }

  private getGap(zoom: number) {
    const zooms = [0.02, 0.03, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
    const gaps = [5000, 2500, 1000, 500, 200, 100, 50, 20, 10]

    let i = 0
    while (i < zooms.length && zooms[i] < zoom) {
      i++
    }

    return gaps[i - 1] || 10000
  }

  private darwRect(
    ctx: CanvasRenderingContext2D,
    {
      left,
      top,
      width,
      height,
      fill,
      stroke,
      strokeWidth,
    }: {
      left: number
      top: number
      width: number
      height: number
      fill?: string | CanvasGradient | CanvasPattern
      stroke?: string
      strokeWidth?: number
    },
  ) {
    ctx.save()
    ctx.beginPath()
    fill && (ctx.fillStyle = fill)
    ctx.rect(left, top, width, height)
    ctx.fill()
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = strokeWidth ?? 1
      ctx.stroke()
    }
    ctx.restore()
  }

  private darwText(
    ctx: CanvasRenderingContext2D,
    {
      left,
      top,
      text,
      fill,
      align,
      angle,
      fontSize,
      baseline,
    }: {
      left: number
      top: number
      text: string
      fill?: string | CanvasGradient | CanvasPattern
      align?: CanvasTextAlign
      baseline?: CanvasTextBaseline
      angle?: number
      fontSize?: number
    },
  ) {
    ctx.save()
    fill && (ctx.fillStyle = fill)
    ctx.textAlign = align ?? 'left'
    ctx.textBaseline = baseline ?? 'top'
    ctx.font = `${fontSize ?? 12}px Helvetica`
    if (angle) {
      ctx.translate(left, top)
      ctx.rotate(PiBy180 * angle)
      ctx.translate(-left, -top)
    }
    ctx.fillText(text, left, top)
    ctx.restore()
  }

  private darwLine(
    ctx: CanvasRenderingContext2D,
    {
      left,
      top,
      width,
      height,
      stroke,
      lineWidth,
    }: {
      left: number
      top: number
      width: number
      height: number
      stroke?: string | CanvasGradient | CanvasPattern
      lineWidth?: number
    },
  ) {
    ctx.save()
    ctx.beginPath()
    stroke && (ctx.strokeStyle = stroke)
    ctx.lineWidth = lineWidth ?? 1
    ctx.moveTo(left, top)
    ctx.lineTo(left + width, top + height)
    ctx.stroke()
    ctx.restore()
  }

  private calcObjectRect() {
    const activeObjects = this.canvas.getActiveObjects()
    if (activeObjects.length === 0) {
      this.objectRect = undefined
      return
    }
    if (activeObjects[0].name.toLowerCase() === ElementNames.REFERENCELINE) {
      this.objectRect = undefined
      return
    }
    const allRect = activeObjects.reduce((rects, obj) => {
      const rect: HighlightRect = obj.getBoundingRect()
      rects.push(rect)
      return rects
    }, [] as HighlightRect[])
    if (allRect.length === 0) return
    this.objectRect = {
      x: this.mergeLines(allRect, true),
      y: this.mergeLines(allRect, false),
    }
  }

  private mergeLines(rect: Rect[], isHorizontal: boolean) {
    const axis = isHorizontal ? 'left' : 'top'
    const length = isHorizontal ? 'width' : 'height'
    // Sort by axis value first
    rect.sort((a, b) => a[axis] - b[axis])
    const mergedLines = []
    let currentLine = Object.assign({}, rect[0])
    for (let i = 1; i < rect.length; i++) {
      const line = Object.assign({}, rect[i])
      if (currentLine[axis] + currentLine[length] >= line[axis]) {
        // Current line segment intersects with the next, merge width
        currentLine[length] =
          Math.max(currentLine[axis] + currentLine[length], line[axis] + line[length]) -
          currentLine[axis]
      } else {
        // Current line segment does not intersect with the next, add current to results and update to next
        mergedLines.push(currentLine)
        currentLine = Object.assign({}, line)
      }
    }
    // Add to array
    mergedLines.push(currentLine)
    return mergedLines
  }

  public dispose(): void {
    super.dispose()
    this.enabled = false
  }
}
