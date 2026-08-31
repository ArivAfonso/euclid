import { noop } from '@vueuse/core'
import { TControlSet } from '@/types/fabric'
import { PolygonElement } from '@/types/canvas'
import { PiBy180, toFixed } from '@/utils/common'
import { px2mm } from '@/utils/image'
import { Control, Object as FabricObject, controlsUtils, Point, Polygon, TPointerEvent, Transform, TDegree, util,TransformActionHandler, Textbox, IText } from 'fabric'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ArcText } from '@/extension/object/ArcText'

// ─── Shared visible control renderers (uniform across all elements) ───

/** Corner resize handle — small filled circle */
function renderCornerControl(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
) {
  const radius = 5
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(left, top, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

/** Edge resize handle — elongated pill, rotated with object */
function renderPillControl(
  key: string,
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: any,
  fabricObject: any,
) {
  const pillLength = 28
  const pillThickness = 6
  const cornerRadius = pillThickness / 2

  // Hide the pill when the object's rendered edge is smaller than the pill
  // so tiny transformers aren't cluttered with overlapping side anchors.
  const zoom = fabricObject.canvas?.getZoom?.() || 1
  const isVertical = key === 'ml' || key === 'mr'
  const renderedEdge = isVertical
    ? (fabricObject.height || 0) * (fabricObject.scaleY || 1) * zoom
    : (fabricObject.width || 0) * (fabricObject.scaleX || 1) * zoom
  if (renderedEdge < pillLength * 1.4) return

  ctx.save()
  const angle = (fabricObject.angle || 0) * (Math.PI / 180)
  ctx.translate(left, top)
  ctx.rotate(angle)
  ctx.translate(-left, -top)
  const w = isVertical ? pillThickness : pillLength
  const h = isVertical ? pillLength : pillThickness
  const r = cornerRadius
  const rx = left - w / 2
  const ry = top - h / 2

  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.moveTo(rx + r, ry)
  ctx.lineTo(rx + w - r, ry)
  ctx.arcTo(rx + w, ry, rx + w, ry + r, r)
  ctx.lineTo(rx + w, ry + h - r)
  ctx.arcTo(rx + w, ry + h, rx + w - r, ry + h, r)
  ctx.lineTo(rx + r, ry + h)
  ctx.arcTo(rx, ry + h, rx, ry + h - r, r)
  ctx.lineTo(rx, ry + r)
  ctx.arcTo(rx, ry, rx + r, ry, r)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}


export const changeObjectHeight: TransformActionHandler = (eventData: TPointerEvent, transform: Transform, x: number, y: number) => {
  const localPoint = controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y);
  
  //  make sure the control changes width ONLY from it's side of target
  const { target } = transform
  if ((transform.originY === 'top' && localPoint.y > 0) || (transform.originY === 'bottom' && localPoint.y < 0)) {
    
    const strokeWidth = target.strokeWidth ? target.strokeWidth : 0
    if (!target.scaleY) return false
    const strokePadding = strokeWidth / (target.strokeUniform ? target.scaleY : 1)
    const oldHeight = target.height
    const newHeight = Math.ceil(Math.abs((localPoint.y * 1) / target.scaleY) - strokePadding)
    target.set('height', Math.max(newHeight, 0))
    return oldHeight !== target.height;
  }
  return false;
};

export const changeObjectCurvature: TransformActionHandler = (eventData: TPointerEvent, transform: Transform, x: number, y: number) => {
  const target = transform.target as ArcText
  let localPoint = controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y),
    strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleX : 1),
    multiplier = transform.originY === 'center' ? 2 : 1,
    cy = (localPoint.y + target.controls[transform.corner].offsetY - target.height / 2 + target._contentOffsetY ) * multiplier / target.scaleY - strokePadding;

  let textHeight = target.calcTextHeight();

  let radius;
  if (Math.abs(cy) <= textHeight / 2) {
    radius = 0;
  }
  else{
    radius = cy > 0 ? cy - textHeight / 2 : cy + textHeight / 2;
  }

  target.set(radius)
  return false
}

// define a function that can locate the controls.
// this function will be used both for drawing and for interaction.
export function polygonPositionHandler(dim: Point, finalMatrix: number[], fabricObject: any) {
  // @ts-ignore
  const pointIndex = this.pointIndex

  if (!fabricObject.points[pointIndex]) return new Point(0, 0)

  const x = (fabricObject.points[pointIndex].x - fabricObject.pathOffset.x)
  const y = (fabricObject.points[pointIndex].y - fabricObject.pathOffset.y)
  // console.log('fabricObject:', fabricObject.canvas?.viewportTransform)
  const canvasTransform = fabricObject.canvas?.viewportTransform ? fabricObject.canvas?.viewportTransform : [1, 0, 0, 1, 0, 0]
  const point = util.transformPoint(
    { x, y } as Point,
    util.multiplyTransformMatrices(
      // fabricObject.canvas?.viewportTransform,
      canvasTransform,
      fabricObject.calcTransformMatrix()
    )
  )
  const snapPoint = fabricObject.pointMoving(pointIndex, point)
  // console.log('Point:', point, 'x:', x, 'y:', y, snapPoint)
  return point
}

const getObjectSizeWithStroke = (object: FabricObject) => {
  const scaleX = object.scaleX, scaleY = object.scaleY, strokeWidth = object.strokeWidth
  const width = object.width, height = object.height
  const stroke = new Point(
    object.strokeUniform ? 1 / scaleX : 1, 
    object.strokeUniform ? 1 / scaleY : 1
  ).scalarMultiply(strokeWidth);
  return new Point(width + stroke.x, height + stroke.y);
}

// define a function that can keep the polygon in the same position when we change its
// width/height/top/left.
export const anchorWrapper = (anchorIndex: number, fn: Function) => {

  return function(eventData: MouseEvent, transform: any, x: number, y: number) {

    const fabricObject = transform.target as Polygon
    const safeIndex = Math.min(anchorIndex, fabricObject.points.length - 1)
    if (!fabricObject.points[safeIndex]) return false
    const pointX = fabricObject.points[safeIndex].x, pointY = fabricObject.points[safeIndex].y
    const handlePoint = new Point({x: (pointX - fabricObject.pathOffset.x), y: (pointY - fabricObject.pathOffset.y)})
    const absolutePoint = util.transformPoint(handlePoint, fabricObject.calcTransformMatrix()),
        actionPerformed = fn(eventData, transform, x, y),
        newDim = fabricObject.setDimensions(),
        polygonBaseSize = getObjectSizeWithStroke(fabricObject),
        newX = (pointX - fabricObject.pathOffset.x) / polygonBaseSize.x,
        newY = (pointY - fabricObject.pathOffset.y) / polygonBaseSize.y
    fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5)
    return actionPerformed
  }
}

export const actionHandler = (eventData: TPointerEvent, transform: any, x: number, y: number) => {
  const polygon = transform.target as PolygonElement
  if (!polygon.__corner) return
  const currentControl = polygon.controls[polygon.__corner]
  const mouseLocalPosition = controlsUtils.getLocalPoint(transform, 'center', 'center', x, y)
  // const mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center')
  const polygonBaseSize = getObjectSizeWithStroke(polygon)

  const size = polygon._getTransformedDimensions(0)
  const finalPointPosition = {
    x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
    y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
  } as Point
  polygon.points[currentControl.pointIndex as number] = finalPointPosition
  return true
}

/**
 * Calculate current control position
 */
const positionHandler: Control['positionHandler'] = (dim, finalMatrix, fabricObject, currentControl) => {
  return new Point(
    currentControl.x * dim.x + currentControl.offsetX,
    currentControl.y * dim.y + currentControl.offsetY,
  ).transform(finalMatrix)
}

export const getWidthHeight = (fabricObject: FabricObject, noFixed = false) => {
  const objScale = fabricObject.getObjectScaling()
  const point = fabricObject._getTransformedDimensions({
    scaleX: objScale.x,
    scaleY: objScale.y,
  })
  if (!noFixed) {
    point.setX(toFixed(point.x))
    point.setY(toFixed(point.y))
  }
  return point
}

/**
 * Check if the object is a text-type (textbox or itext).
 * Text transformers keep full-side touch areas; others use compact pill touch areas.
 */
const isTextType = (object: FabricObject): boolean => {
  return object instanceof Textbox || object instanceof IText
}

/**
 * Update ml, mr, mt, mb control sizes.
 * For text objects: expand touch areas to span the entire side.
 * For element/image objects: keep touch areas compact (just the pill anchor UI).
 */
const setCornersSize = (object: FabricObject) => {
  if (!object.canvas) return
  const zoom = object.canvas.getZoom()
  const controls = object.controls

  if (isTextType(object)) {
    const size = getWidthHeight(object).scalarMultiply(zoom)
    const cornersH = ['ml', 'mr']
    cornersH.forEach((corner) => {
      controls[corner].sizeX = object.cornerSize
      controls[corner].sizeY = size.y
      controls[corner].touchSizeX = object.touchCornerSize
      controls[corner].touchSizeY = size.y
    })
    const cornersV = ['mt', 'mb']
    cornersV.forEach((corner) => {
      controls[corner].sizeX = size.x
      controls[corner].sizeY = object.cornerSize
      controls[corner].touchSizeX = size.x
      controls[corner].touchSizeY = object.touchCornerSize
    })
  } else {
    const pillSize = object.cornerSize
    const cornersH = ['ml', 'mr']
    cornersH.forEach((corner) => {
      controls[corner].sizeX = pillSize
      controls[corner].sizeY = pillSize
      controls[corner].touchSizeX = pillSize
      controls[corner].touchSizeY = pillSize
    })
    const cornersV = ['mt', 'mb']
    cornersV.forEach((corner) => {
      controls[corner].sizeX = pillSize
      controls[corner].sizeY = pillSize
      controls[corner].touchSizeX = pillSize
      controls[corner].touchSizeY = pillSize
    })
  }
}

/**
 * Rotation icon
 */
const rotateIcon = (angle: number) => {
  return `url("data:image/svg+xml,<svg height='20' width='20' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'><g fill='none' transform='rotate(${angle} 16 16)'><path fill='white' d='M18.24 5.37C11.41 6.04 5.98 11.46 5.32 18.26L0 18.26L7.8 26L15.61 18.27L10.6 18.27C11.21 14.35 14.31 11.25 18.24 10.64L18.24 15.55L26 7.78L18.24 0L18.24 5.37Z'></path><path fill='black' d='M19.5463 6.61441C12.4063 6.68441 6.61632 12.4444 6.56632 19.5644L3.17632 19.5644L7.80632 24.1444L12.4363 19.5644L9.18632 19.5644C9.24632 13.8844 13.8563 9.28441 19.5463 9.22441L19.5463 12.3844L24.1463 7.78441L19.5463 3.16441L19.5463 6.61441Z'></path></g></svg>") 12 12,auto`
}

/**
 * Threshold (in degrees) within which an angle snaps to a cardinal direction.
 * Small value = magnetic & refined; large = jarring. 4° feels just right.
 */
const CARDINAL_SNAP_THRESHOLD = 3

/**
 * Snap an arbitrary angle to the nearest cardinal (0/90/180/270) if it is
 * within `CARDINAL_SNAP_THRESHOLD`. Preserves the original sign/direction
 * (e.g. -93° → -90°, 361° → 0°) by calculating the delta in normalised
 * space and applying it back to the original angle.
 *
 * NOTE: This is a pure utility. The live rotation snapping below does NOT
 * post-process the angle (that breaks `wrapWithFixedAnchor`'s position
 * compensation and makes the object drift). Instead it sets Fabric's own
 * `snapAngle = 90` + `snapThreshold`, so snapping happens *inside* the
 * rotation pipeline and the anchor is preserved correctly.
 */
export function snapToCardinalAngle(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360

  let nearest = 0
  let minDist = 360
  for (const cardinal of [0, 90, 180, 270]) {
    const dist = Math.min(
      Math.abs(normalized - cardinal),
      360 - Math.abs(normalized - cardinal),
    )
    if (dist < minDist) {
      minDist = dist
      nearest = cardinal
    }
  }

  if (minDist > CARDINAL_SNAP_THRESHOLD) return angle

  const delta = nearest - normalized
  const snapped = angle + delta
  return Number(snapped.toFixed(4))
}

/**
 * Rotation snapping — hold Shift to snap at 15° increments; otherwise the
 * angle snaps to cardinals (0/90/180/270) when within 4°.
 *
 * Both snapping layers are applied by setting Fabric's `snapAngle` /
 * `snapThreshold` BEFORE calling Fabric's handler, so snapping runs INSIDE
 * `wrapWithFixedAnchor` and the object's anchor position is preserved
 * (no drift while rotating).
 */
const rotationWithSnapping = (eventData: TPointerEvent, transform: Transform, x: number, y: number) => {
  const { shiftKey } = eventData
  const { target } = transform
  const { rotationWithSnapping } = controlsUtils
  const originalSnapAngle = target.snapAngle
  const originalSnapThreshold = target.snapThreshold
  if (shiftKey) {
    target.snapAngle = 15
  } else {
    // Cardinal snapping handled natively by Fabric: snapAngle=90 yields
    // snap points at 0/90/180/270, and the small threshold keeps it
    // magnetic & refined rather than jarring.
    target.snapAngle = 90
    target.snapThreshold = CARDINAL_SNAP_THRESHOLD
  }
  const res = rotationWithSnapping(eventData, transform, x, y)
  target.snapAngle = originalSnapAngle
  target.snapThreshold = originalSnapThreshold
  return res
}

/**
 * Get rotation control
 */
const getRotateControl = (angle: number): Partial<Control> => ({
  sizeX: 16,
  sizeY: 16,
  actionHandler: (eventData, transformData, x, y) => {
    transformData.target.canvas?.setCursor(rotateIcon(transformData.target.angle + angle))
    return rotationWithSnapping(eventData, transformData, x, y)
  },
  cursorStyleHandler: (eventData, control, fabricObject) => {
    return rotateIcon(fabricObject.angle + angle)
  },
  render: noop,
  actionName: 'rotate',
})

/**
 * Get general control properties
 */
const getHornControl = {
  cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
  actionHandler: controlsUtils.scalingEqually,
  actionName: 'scaling',
}

const changeWidth = controlsUtils.wrapWithFireEvent(
  'scaling',
  controlsUtils.wrapWithFixedAnchor(controlsUtils.changeWidth),
)

const changeHeight = controlsUtils.wrapWithFireEvent(
  'scaling',
  controlsUtils.wrapWithFixedAnchor(changeObjectHeight)
)

const changeCurvature = controlsUtils.wrapWithFireEvent(
  'scaling',
  controlsUtils.wrapWithFixedAnchor(changeObjectCurvature)
)


export const defaultControls = (): TControlSet => ({
  size: new Control({
    x: 0,
    y: 0.5,
    cursorStyleHandler: () => '',
    offsetY: 18,
    sizeX: 0.0001,
    sizeY: 0.0001,
    touchSizeX: 0.0001,
    touchSizeY: 0.0001,
    render: (ctx, left, top, styleOverride, fabricObject: FabricObject) => {
      if (typeof window !== 'undefined' && window.localStorage.getItem('showDimensionLabel') === 'false') return

      // todo: support objects reversed within a group
      ctx.save()
      ctx.translate(left, top)

      const calcRotate = () => {
        const objectAngle = fabricObject.group ? fabricObject.getTotalAngle() : fabricObject.angle
        const angleInRadians = objectAngle * PiBy180
        const x = Math.sin(angleInRadians)
        const y = Math.cos(angleInRadians)
        const angle = Math.abs(x) > Math.abs(y) ? Math.sign(x) * 90 : Math.sign(y) * 90 - 90
        return (objectAngle - angle) * PiBy180
      }

      ctx.rotate(calcRotate())

      const fontSize = 11
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const { x, y } = getWidthHeight(fabricObject)
      const { unitMode } = storeToRefs(useMainStore())
      let text = unitMode.value === 0 ? `${toFixed(px2mm(x))} × ${toFixed(px2mm(y))}` : `${x} × ${y}`
      const width = ctx.measureText(text).width + 18
      const height = fontSize + 12
      const radius = 5
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

      // Border
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(0, 0, 0, 0.42)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(-width / 2, -height / 2, width, height, radius)
      ctx.stroke()
      
      // Soft, theme-aware background
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(255, 255, 255, 0.96)'
      ctx.beginPath()
      ctx.roundRect(-width / 2, -height / 2, width, height, radius)
      ctx.fill()

      // Text
      ctx.fillStyle = isDark ? '#d4d4d8' : '#000000'
      ctx.fillText(text, 0, 0.5)
      ctx.restore()
    },
    positionHandler: (dim, finalMatrix, fabricObject: FabricObject, currentControl) => {
      const activeObject = fabricObject.canvas?.getActiveObject instanceof Function ? fabricObject.canvas?.getActiveObject() : null
      
      if (activeObject && activeObject === fabricObject) {
        const angle = fabricObject.getTotalAngle()

        const angleInRadians = angle * PiBy180

        const x = Math.sin(angleInRadians)
        const y = Math.cos(angleInRadians)

        if (Math.abs(x) >= Math.abs(y)) {
          const sign = Math.sign(x)
          currentControl.x = sign / 2
          currentControl.y = 0
          currentControl.offsetX = sign * 18
          currentControl.offsetY = 0
        } else {
          const sign = Math.sign(y)
          currentControl.x = 0
          currentControl.y = sign / 2
          currentControl.offsetX = 0
          currentControl.offsetY = sign * 18
        }

        // Update other corner sizes together here to prevent multiple runs
        setCornersSize(fabricObject)
      }

      return positionHandler(dim, finalMatrix, fabricObject, currentControl)
    },
  }),

  tlr: new Control({
    x: -0.5,
    y: -0.5,
    offsetX: -4,
    offsetY: -4,
    ...getRotateControl(0),
  }),

  trr: new Control({
    x: 0.5,
    y: -0.5,
    offsetX: 4,
    offsetY: -4,
    ...getRotateControl(90),
  }),

  brr: new Control({
    x: 0.5,
    y: 0.5,
    offsetX: 4,
    offsetY: 4,
    ...getRotateControl(180),
  }),

  blr: new Control({
    x: -0.5,
    y: 0.5,
    offsetX: -4,
    offsetY: 4,
    ...getRotateControl(270),
  }),

  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: controlsUtils.scalingXOrSkewingY,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    actionName: 'scaling',
    render: (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) =>
      renderPillControl('ml', ctx, left, top, styleOverride, fabricObject),
    // Don't set positionHandler here, update together with size's positionHandler
    // positionHandler: positionHandlerH,
  }),

  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: controlsUtils.scalingXOrSkewingY,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    actionName: 'scaling',
    render: (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) =>
      renderPillControl('mr', ctx, left, top, styleOverride, fabricObject),
    // positionHandler: positionHandlerH,
  }),

  mb: new Control({
    x: 0,
    y: 0.5,
    actionHandler: controlsUtils.scalingYOrSkewingX,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    actionName: 'scaling',
    render: (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) =>
      renderPillControl('mb', ctx, left, top, styleOverride, fabricObject),
    // positionHandler: positionHandlerV,
  }),

  mt: new Control({
    x: 0,
    y: -0.5,
    actionHandler: controlsUtils.scalingYOrSkewingX,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    actionName: 'scaling',
    render: (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) =>
      renderPillControl('mt', ctx, left, top, styleOverride, fabricObject),
    // positionHandler: positionHandlerV,
  }),

  tl: new Control({
    x: -0.5,
    y: -0.5,
    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
    actionHandler: controlsUtils.scalingEqually,
    actionName: 'scaling',
    render: renderCornerControl,
  }),

  tr: new Control({
    x: 0.5,
    y: -0.5,
    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
    actionHandler: controlsUtils.scalingEqually,
    actionName: 'scaling',
    render: renderCornerControl,
  }),

  bl: new Control({
    x: -0.5,
    y: 0.5,
    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
    actionHandler: controlsUtils.scalingEqually,
    actionName: 'scaling',
    render: renderCornerControl,
  }),

  br: new Control({
    x: 0.5,
    y: 0.5,
    cursorStyleHandler: controlsUtils.scaleCursorStyleHandler,
    actionHandler: controlsUtils.scalingEqually,
    actionName: 'scaling',
    render: renderCornerControl,
  }),
})

export const resizeControls = (): TControlSet => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    render: noop,
    // positionHandler: positionHandlerH,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    render: noop,
    // positionHandler: positionHandlerH,
  }),
  mt: new Control({
    x: 0,
    y: -0.5,
    actionHandler: changeHeight,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    render: noop,
    // positionHandler: positionHandlerH,
  }),
  mb: new Control({
    x: 0,
    y: 0.5,
    actionHandler: changeHeight,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
    render: noop,
    // positionHandler: positionHandlerH,
  }),
})

export const arcTextControls = (): TControlSet => ({
  c: new Control({
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    // render (ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: ArcText) {
    //   if(fabricObject.canvas!.showControlsGuidlines){
    //     ctx.save()
    //     ctx.strokeStyle = fabricObject.borderColor
    //     ctx.lineWidth = fabricObject.borderWidth
    //     // let cx = -fabricObject._contentOffsetX * fabricObject.scaleX
    //     // let cy = (fabricObject._curvingCenter.y - fabricObject._contentOffsetY) * fabricObject.scaleY
    //     ctx.beginPath()
    //     ctx.ellipse(left, top, Math.abs(fabricObject.radius) * fabricObject.scaleX, Math.abs(fabricObject.radius) * fabricObject.scaleY, 0, 0, 2 * Math.PI);
    //     ctx.stroke();
    //     ctx.restore()
    //   }
    // },
    actionHandler: changeCurvature,
    cursorStyle: 'pointer',
    actionName: 'resizing',
  }),
  ...defaultControls(),
  ...resizeControls(),
})

export const lineControls = (): TControlSet => ({
  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
  }),
  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: controlsUtils.scaleSkewCursorStyleHandler,
  }),
})

export const textboxControls = (): TControlSet => ({
  ...defaultControls(),
  ...resizeControls(),
})
