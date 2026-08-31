
import { CanvasEvents, Canvas, Point, TPointerEvent, TPointerEventInfo } from 'fabric'
import { useIntervalFn } from '@vueuse/core'
import { Disposable, toDisposable } from '@/utils/lifecycle'

/**
 * Canvas default wheel behavior — scrolls the canvas view vertically instead of zooming.
 * Use the topbar zoom buttons for zooming.
 */
export class WheelScroll extends Disposable {
  private edgeMoveStatus = true

  constructor(private readonly canvas: Canvas) {
    super()
    this.initWheelScroll()
    this.initEdgeMove()
  }

  /**
   * Mouse wheel handling — scrolls canvas up/down.
   */
  private initWheelScroll() {
    const mouseWheel = (e: CanvasEvents['mouse:wheel']) => {
      e.e.preventDefault()
      e.e.stopPropagation()
      const { deltaY } = e.e
      // Normalize deltaY for consistent scroll speed across browsers/devices
      const factor = Math.abs(deltaY) < 10 ? deltaY * 2 : deltaY
      // Scroll canvas vertically — negate deltaY so scroll direction matches natural scrolling
      this.canvas.relativePan(new Point(0, -factor))
    }

    this.canvas.on('mouse:wheel', mouseWheel)
    this._register(
      toDisposable(() => {
        this.canvas.off('mouse:wheel', mouseWheel)
      }),
    )
  }

  /**
   * Edge auto-pan.
   */
  private initEdgeMove() {
    let event: TPointerEventInfo<TPointerEvent> | undefined

    /** Whether we need to run setCoords. */
    let needSetCoords = false

    const { pause, resume } = useIntervalFn(() => {
        if (!event) return

        const A = new Point(24, 24)
        const B = new Point(this.canvas.width, this.canvas.height).subtract(A)
        const [pos, distance] = this.judgePosition(event.absolutePointer, A, B)
        if (pos === 0) return

        let deltaPoint = new Point()
        const amount = Math.min(distance, 20)
        if (pos & 1) deltaPoint.x = amount
        if (pos & 2) deltaPoint.x = -amount
        if (pos & 4) deltaPoint.y = amount
        if (pos & 8) deltaPoint.y = -amount

        // Slow down when moving diagonally to corners.
        if (deltaPoint.x !== 0 && deltaPoint.y !== 0) {
          deltaPoint = deltaPoint.scalarDivide(1.5)
        }

        this.canvas.relativePan(deltaPoint)
        this.canvas._onMouseMove(event.e)
        needSetCoords = true
      },
      16, // 1000 / 60
      {
        immediate: false,
      },
    )

    // const { isSwiping } = useFabricSwipe({
    //   onSwipeStart: () => {
    //     if (!this.edgeMoveStatus) return
    //     isSwiping.value = true
    //     resume()
    //   },
    //   onSwipe: (e) => {
    //     if (!this.edgeMoveStatus) return
    //     event = e
    //   },
    //   onSwipeEnd: () => {
    //     pause()
    //     event = undefined
    //     if (needSetCoords) {
    //       this.setCoords()
    //       needSetCoords = false
    //     }
    //   },
    // })

    // this.eventbus.on('setEdgeMoveStatus', (value) => {
    //   this.edgeMoveStatus = value
    // })
  }

  /**
   * Determine T position relative to the rectangle and distance.
   * @param {Point} T - Point to check.
   * @param {Point} A - Top-left corner of the rectangle.
   * @param {Point} B - Bottom-right corner of the rectangle.
   * @returns {[number, number]} The position flags and distance.
   */
  private judgePosition(T: Point, A: Point, B: Point): [number, number] {
    let pos = 0
    let distance = 0
    if (T.x < A.x) (pos |= 1), (distance += A.x - T.x)
    else if (T.x > B.x) (pos |= 2), (distance += T.x - B.x)
    if (T.y < A.y) (pos |= 4), (distance += A.y - T.y)
    else if (T.y > B.y) (pos |= 8), (distance += T.y - B.y)
    return [pos, distance]
  }
}
