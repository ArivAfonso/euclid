import { Point, Canvas } from 'fabric'
import { watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Disposable } from '@/utils/lifecycle'
import useCanvasSwipe from '@/hooks/useCanvasSwipe'
import { useKeyboardStore } from '@/store'
import { useActiveElement, toValue } from '@vueuse/core'

type ToolOption = {
  defaultCursor: string
  skipTargetFind: boolean
  selection: boolean
}

type ToolType = 'move' | 'handMove' | 'shape'


export class FabricTool extends Disposable {

  private options: Record<ToolType, ToolOption> = {
    move: {
      defaultCursor: 'default',
      skipTargetFind: false,
      selection: true,
    },
    handMove: {
      defaultCursor: 'grab',
      skipTargetFind: true,
      selection: false,
    },
    shape: {
      defaultCursor: 'crosshair',
      skipTargetFind: true,
      selection: false,
    },
  }

  private _handMoveActivate = false

  private get handMoveActivate() {
    return this._handMoveActivate
  }

  private set handMoveActivate(value) {
    this._handMoveActivate = value
  }

  constructor(private readonly canvas: Canvas) {
    super()
    this.initHandMove()
  }

  private applyOption(tool: ToolType) {
    const { defaultCursor, skipTargetFind, selection } = this.options[tool]

    this.canvas.defaultCursor = defaultCursor
    this.canvas.setCursor(defaultCursor)
    this.canvas.skipTargetFind = skipTargetFind
    this.canvas.selection = selection
  }

  // private switchShape(shape: 'board' | 'rect' | 'ellipse' | 'triangle' | 'text') {
  //   const { canvas } = this
  //   let coordsStart: Point | undefined
  //   let tempObject: FabricObject | undefined
  //   const { stop, isSwiping } = useFabricSwipe({
  //     onSwipeStart: (e) => {
  //       if (e.button !== 1 || this.space.value) return
  //       /*
  //        * isSwiping only becomes true during mouseMove
  //        * mouseUp checks isSwiping value to decide whether to execute onSwipeEnd
  //        * Force set to true here so clicks can also execute onSwipeEnd
  //        */
  //       isSwiping.value = true
  //       // Get coordinates
  //       coordsStart = e.pointer
  //       // Create shape
  //       switch (shape) {
  //         case 'board':
  //           tempObject = new Board([], {
  //             fill: '',
  //           })
  //           break
  //         case 'rect':
  //           tempObject = new Rect({})
  //           break
  //         case 'ellipse':
  //           tempObject = new Ellipse({
  //             rx: 50,
  //             ry: 50,
  //           })
  //           break
  //         case 'triangle':
  //           tempObject = new Triangle({})
  //           break
  //         case 'text':
  //           tempObject = new Textbox('', {})
  //           break
  //       }
  //       tempObject.set({
  //         left: coordsStart.x,
  //         top: coordsStart.y,
  //         width: 100,
  //         height: 100,
  //         scaleX: 0.01,
  //         scaleY: 0.01,
  //         hideOnLayer: true,
  //       })
  //       // Don't send ObjectAdded event
  //       tempObject.noEventObjectAdded = true
  //       // Add object to canvas
  //       const board = this.canvas._searchPossibleTargets(
  //         this.canvas.getObjects('Board'),
  //         e.absolutePointer,
  //       ) as Board | undefined
  //       const parent = board || canvas
  //       parent.add(tempObject)
  //       // Cancel no send
  //       tempObject.noEventObjectAdded = false
  //       // Set active object
  //       canvas.setActiveObject(tempObject)
  //       tempObject.__corner = 'br'
  //       canvas._setupCurrentTransform(e.e, tempObject, true)
  //     },
  //     onSwipeEnd: (e) => {
  //       if (!tempObject) return
  //       console.log('onSwipeEnd:', tempObject)
  //       // If clicking canvas without moving, set default width/height
  //       if (tempObject.scaleX <= 0.01 && tempObject.scaleY <= 0.01) {
  //         tempObject.set({
  //           left: tempObject.left - 50,
  //           top: tempObject.top - 50,
  //           scaleX: 1,
  //           scaleY: 1,
  //         })
  //       }
  //       // Set width/height scaling
  //       tempObject.set({
  //         width: tempObject.getScaledWidth(),
  //         height: tempObject.getScaledHeight(),
  //         scaleX: 1,
  //         scaleY: 1,
  //         hideOnLayer: false,
  //       })
  //       // Special shape handling
  //       if (tempObject instanceof Board) {
  //         tempObject.set({
  //           fill: '#ffffff',
  //         })
  //       } else if (tempObject instanceof Ellipse) {
  //         tempObject.set({
  //           rx: tempObject.width / 2,
  //           ry: tempObject.height / 2,
  //         })
  //       } else if (tempObject instanceof Textbox) {
  //         tempObject.set({
  //           text: 'Enter text',
  //         })
  //         canvas.defaultCursor = 'default'
  //         tempObject.enterEditing(e.e)
  //         tempObject.selectAll()
  //       }
  //       // Notify event
  //       if (!tempObject.group) {
  //         canvas._onObjectAdded(tempObject)
  //       }
  //       canvas.fire('selection:updated')
  //       canvas.requestRenderAll()
  //       tempObject = undefined
  //       useAppStore().activeTool = 'move'
  //     },
  //   })
  //   this.toolStop = stop
  // }


  /**
   * Drag viewport with middle mouse button
   */
  private initHandMove() {
    const canvas = this.canvas

    /** vpt at mouse move start */
    let vpt = canvas.viewportTransform
    const { spaceKeyState } = storeToRefs(useKeyboardStore())
    const { lengthX, lengthY, isSwiping } = useCanvasSwipe({
      onSwipeStart: (e: any) => {
        if (e.e.buttons === 2 || (spaceKeyState.value && e.e.buttons === 1)) {
          isSwiping.value = true
          vpt = canvas.viewportTransform
          this.handMoveActivate = true
          this.applyOption('handMove')
          canvas.setCursor('grab')
        }
      },
      onSwipe: () => {
        if (!this.handMoveActivate) return

        canvas.setCursor('grab')

        requestAnimationFrame(() => {
          const deltaPoint = new Point(lengthX.value, lengthY.value).scalarDivide(canvas.getZoom()).transform(vpt).scalarMultiply(-1)
          canvas.absolutePan(deltaPoint, true)
        })
      },
      onSwipeEnd: () => {
        // Restore mouse cursor
        this.applyOption(spaceKeyState.value ? 'handMove' : 'move')
        if (!this.handMoveActivate) return
        // Close handMove
        if (!spaceKeyState.value) {
          this.handMoveActivate = false
        }
      },
    })

    // Space key to toggle move tool
    const activeElement = useActiveElement()
    const activeElementHasInput = computed(() => activeElement.value?.tagName !== 'INPUT' && activeElement.value?.tagName !== 'TEXTAREA')
    
    
    watch(
      computed(() => [spaceKeyState.value, activeElementHasInput.value].every((i) => toValue(i))),
      (space) => {
        this.applyOption(space ? 'handMove' : 'move')
        if (isSwiping.value) return
        this.handMoveActivate = space
      },
    )
  }
}
