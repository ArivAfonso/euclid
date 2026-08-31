/**
 * Individual corner radius clip utility.
 *
 * Stores per-corner radii on Fabric objects and applies a rounded
 * rect clip path in _render() for shapes that don't natively
 * support individual corners (Image, Rect).
 *
 * Properties added:
 *   tlRx, trRx, blRx, brRx — per-corner radii (0 means square)
 */

export interface CornerRadii {
  tl: number
  tr: number
  bl: number
  br: number
}

/**
 * Detect whether an object has any individual corner radii set.
 */
export function hasIndividualCorners(obj: any): boolean {
  return (
    typeof (obj.tlRx) === 'number' && obj.tlRx > 0 ||
    typeof (obj.trRx) === 'number' && obj.trRx > 0 ||
    typeof (obj.blRx) === 'number' && obj.blRx > 0 ||
    typeof (obj.brRx) === 'number' && obj.brRx > 0
  )
}

/**
 * Read the per-corner radii from an object.
 */
export function getCornerRadii(obj: any): CornerRadii {
  return {
    tl: typeof obj.tlRx === 'number' ? obj.tlRx : 0,
    tr: typeof obj.trRx === 'number' ? obj.trRx : 0,
    bl: typeof obj.blRx === 'number' ? obj.blRx : 0,
    br: typeof obj.brRx === 'number' ? obj.brRx : 0,
  }
}

/**
 * Clip the current canvas context with a rounded rect that may have
 * different radii per corner.
 *
 * Origin is assumed to be at the object's center (Fabric convention).
 */
export function applyIndividualCornerClip(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radii: CornerRadii,
): void {
  const x = -width / 2
  const y = -height / 2
  const w = width
  const h = height
  const { tl, tr, bl, br } = radii

  ctx.beginPath()

  if (typeof (ctx as any).roundRect === 'function') {
    // All modern browsers: supports [topLeft, topRight, bottomRight, bottomLeft]
    (ctx as any).roundRect(x, y, w, h, [tl, tr, br, bl])
  } else {
    // Fallback using arcTo
    const rTL = Math.min(tl, w / 2, h / 2)
    const rTR = Math.min(tr, w / 2, h / 2)
    const rBR = Math.min(br, w / 2, h / 2)
    const rBL = Math.min(bl, w / 2, h / 2)

    ctx.moveTo(x + rTL, y)
    ctx.lineTo(x + w - rTR, y)
    if (rTR > 0) ctx.arcTo(x + w, y, x + w, y + rTR, rTR)
    else ctx.lineTo(x + w, y)
    ctx.lineTo(x + w, y + h - rBR)
    if (rBR > 0) ctx.arcTo(x + w, y + h, x + w - rBR, y + h, rBR)
    else ctx.lineTo(x + w, y + h)
    ctx.lineTo(x + rBL, y + h)
    if (rBL > 0) ctx.arcTo(x, y + h, x, y + h - rBL, rBL)
    else ctx.lineTo(x, y + h)
    ctx.lineTo(x, y + rTL)
    if (rTL > 0) ctx.arcTo(x, y, x + rTL, y, rTL)
    else ctx.lineTo(x, y)
    ctx.closePath()
  }

  ctx.clip()
}

/**
 * Clear all individual corner properties from an object,
 * reverting to uniform rx/ry.
 */
export function clearIndividualCorners(obj: any): void {
  delete obj.tlRx
  delete obj.trRx
  delete obj.blRx
  delete obj.brRx
}

/**
 * Set individual corner radii on an object.
 */
export function setIndividualCorners(obj: any, radii: CornerRadii): void {
  obj.tlRx = radii.tl
  obj.trRx = radii.tr
  obj.blRx = radii.bl
  obj.brRx = radii.br
  // Clear uniform rx/ry so they don't conflict
  obj.rx = 0
  obj.ry = 0
}
