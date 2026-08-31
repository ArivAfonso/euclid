import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Canvas, FabricObject, Textbox, Group, Point, IText, Line, ModifiedEvent } from 'fabric'
import { WorkSpaceThumbType, WorkSpaceDrawType, propertiesToInclude } from "@/configs/canvas"
import { useFabricStore } from '@/store/modules/fabric'
import { useElementBounding } from '@vueuse/core'
import { FabricTool } from '@/app/fabricTool'
import { FabricGuide } from '@/app/fabricGuide'
import { FabricDistanceGuide } from '@/app/fabricDistanceGuide'
import { HoverBorders } from '@/app/hoverBorders'
import { WheelScroll } from '@/app/wheelScroll'
import { FabricRuler } from '@/app/fabricRuler'
import { FabricTouch } from '@/app/fabricTouch'
import { isMobile } from '@/utils/common'
import { FabricCanvas } from '@/app/fabricCanvas'
import { Keybinding } from '@/app/keybinding'
import { defaultControls, textboxControls } from '@/app/fabricControls'
import { getObjectsBoundingBox } from '@/extension/util/common'
import { useMainStore, useTemplatesStore } from '@/store'
import useCommon from './useCommon'
import { SnapshotType, Snapshot } from '@/types/history'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'




let canvas: null | FabricCanvas = null
let eventCanvas: FabricCanvas | null = null
const editorDisposables: Array<{ dispose: () => void }> = []

// Initialize configuration
const initConf = () => {
  FabricObject.ownDefaults.objectCaching = true // Enable caching for better performance
  FabricObject.ownDefaults.borderColor = 'rgb(59, 130, 246)'
  FabricObject.ownDefaults.cornerColor = 'rgb(59, 130, 246)'
  FabricObject.ownDefaults.cornerStrokeColor = 'rgb(255, 255, 255)'
  FabricObject.ownDefaults.borderOpacityWhenMoving = 1
  FabricObject.ownDefaults.borderScaleFactor = 2
  FabricObject.ownDefaults.cornerSize = 10
  FabricObject.ownDefaults.cornerStyle = 'circle'
  FabricObject.ownDefaults.centeredScaling = false
  FabricObject.ownDefaults.centeredRotation = true
  FabricObject.ownDefaults.transparentCorners = false
  FabricObject.ownDefaults.noScaleCache = false // Enable scale caching
  // FabricObject.ownDefaults.rotatingPointOffset = 1
  // FabricObject.ownDefaults.lockUniScaling = true
  // FabricObject.ownDefaults.hasRotatingPoint = false
  FabricObject.ownDefaults.controls = defaultControls()

  Object.assign(Textbox.ownDefaults, { controls: textboxControls() })
  Object.assign(IText.ownDefaults, { controls: textboxControls() })

  const mixin = {
    getWidthHeight(noFixed = false): Point {
      const objScale = (this as FabricObject).getObjectScaling()
      const point = (this as FabricObject)._getTransformedDimensions({
        scaleX: objScale.x,
        scaleY: objScale.y,
      })
      if (!noFixed) {
        point.setX(point.x)
        point.setY(point.y)
      }
      return point
    },
    getHeight() {
      return this.getWidthHeight().y
    },
    getWidth() {
      return this.getWidthHeight().x
    },
  }

  Object.assign(FabricObject.prototype, mixin)
}

// Update viewport dimensions
const setCanvasTransform = () => {
  if (!canvas) return
  const fabricStore = useFabricStore()
  const { zoom, wrapperRef, scalePercentage } = storeToRefs(fabricStore)
  const { width, height } = useElementBounding(wrapperRef.value)
  canvas.setDimensions({width: width.value, height: height.value})
  const objects = canvas.getObjects().filter(ele => !WorkSpaceThumbType.includes(ele.id))
  const boundingBox = getObjectsBoundingBox(objects)
  if (!boundingBox) return
  let boxWidth = boundingBox.width, boxHeight = boundingBox.height
  let centerX = boundingBox.centerX, centerY = boundingBox.centerY
  const workSpaceDraw = canvas.getObjects().filter(item => item.id === WorkSpaceDrawType)[0]
  if (workSpaceDraw) {
    boxWidth = workSpaceDraw.width
    boxHeight = workSpaceDraw.height
    centerX = workSpaceDraw.left + workSpaceDraw.width / 2
    centerY = workSpaceDraw.top + workSpaceDraw.height / 2 
  }
  zoom.value = Math.min(canvas.getWidth() / boxWidth, canvas.getHeight() / boxHeight) * scalePercentage.value / 100
  canvas.setZoom(zoom.value)
  canvas.absolutePan(new Point(centerX, centerY).scalarMultiply(zoom.value).subtract(canvas.getCenterPoint()), true)
}

const initCanvas = () => {
  const fabricStore = useFabricStore()
  const { canvasRef } = storeToRefs(fabricStore)
  const fabricWidth = fabricStore.getWidth()
  const fabricHeight = fabricStore.getHeight()
  if (!canvasRef.value) return
  canvas = new FabricCanvas(canvasRef.value, {
    width: fabricWidth,
    height: fabricHeight,
    selectionColor: 'rgba(34, 197, 94, 0.1)',
    selectionBorderColor: 'rgb(34, 197, 94)',
    selectionLineWidth: 2,
    selectionDashArray: [5, 5],
    selectionFullyContained: false,
    freeDrawingCursor: 'crosshair'
  })
  // const keybinding = new Keybinding()
  editorDisposables.push(
    new FabricTool(canvas),
    new FabricGuide(canvas),
    new FabricDistanceGuide(canvas),
    new HoverBorders(canvas),
    new WheelScroll(canvas),
    new FabricRuler(canvas),
    new FabricTouch(canvas),
  )
  canvas.preserveObjectStacking = true
  canvas.renderAll()

  // Custom controls read theme settings while they render. Re-render the
  // active controls immediately when the theme changes instead of waiting for
  // the next canvas interaction.
  const handleThemeChanged = () => canvas?.requestRenderAll()
  window.addEventListener('theme-changed', handleThemeChanged)
  editorDisposables.push({
    dispose: () => window.removeEventListener('theme-changed', handleThemeChanged),
  })
}

/**
 * Normalize text object scale into fontSize and width.
 * When the user resizes text via transformer handles, fabric changes scaleX/scaleY
 * but keeps fontSize and width unchanged. This bakes the scale into the actual
 * fontSize and width so the right sidebar displays the correct values and the
 * serialized state is consistent.
 */
const normalizeTextScale = (obj: FabricObject) => {
  const textTypes = ['textbox', 'text', 'i-text', 'itext', 'ArcText', 'VerticalText']
  if (!textTypes.includes(obj.type as string)) return

  const { scaleX, scaleY } = obj

  if (scaleX === 1 && scaleY === 1) return

  // Bake scaleY into fontSize (height) and scaleX into width (if the object has one)
  const currentFontSize = (obj as any).fontSize as number
  const newFontSize = Math.round(currentFontSize * scaleY)

  if (newFontSize <= 0 || isNaN(newFontSize)) return

  const updates: Record<string, any> = {
    fontSize: newFontSize,
    scaleX: 1,
    scaleY: 1,
  }

  // Bake scaleX into width for text objects that have an explicit width
  const objWidth = (obj as any).width as number | null | undefined
  if (objWidth != null && objWidth > 0 && scaleX !== 1) {
    updates.width = Math.round(objWidth * scaleX)
  }

  obj.set(updates)
  obj.setCoords()
}

const initEvent = () => {
  if (!canvas || eventCanvas === canvas) return
  const currentCanvas = canvas
  const fabricStore = useFabricStore()
  const templatesStore = useTemplatesStore()
  const { templateId } = storeToRefs(templatesStore)
  currentCanvas.on('mouse:move', (e: any) => {
    const pointer = currentCanvas.getPointer(e.e, true)
    fabricStore.mouseX = Math.round(pointer.x)
    fabricStore.mouseY = Math.round(pointer.y)
  })

  currentCanvas.on('object:modified', (e: ModifiedEvent) => {
    const { transform, action } = e; 
    const activeObject = currentCanvas._activeObject
    if (!activeObject) return

    const { addHistorySnapshot } = useHistorySnapshot()

    if (activeObject.type === 'activeSelection') {
      const activeSelection = activeObject as any
      if (!activeSelection._objects) return

      activeSelection._objects.forEach((obj: any) => {
        normalizeTextScale(obj)
        const target = obj.toObject(propertiesToInclude)
        const index = currentCanvas._objects.findIndex(item => item.id === target.id)
        if (index === -1) return

        const data: Snapshot = {
          type: SnapshotType.MODIFY,
          index,
          target,
          transform,
          action,
          tid: templateId.value
        };
        addHistorySnapshot(data)
      })
      return
    }
    
    normalizeTextScale(activeObject)
    const target = activeObject.toObject(propertiesToInclude)
    const index = currentCanvas._objects.findIndex(item => item.id === target.id)
    if (index === -1) return
    const data: Snapshot = {
      type: SnapshotType.MODIFY,
      index,
      target,
      transform,
      action,
      tid: templateId.value
    };
    addHistorySnapshot(data)
  })
  eventCanvas = currentCanvas
}

// Initialize template
const initTemplate = async (templateId?: number) => {
  if (!canvas) return
  const { initCommon } = useCommon()
  const templatesStore = useTemplatesStore()
  const { currentTemplate } = storeToRefs(templatesStore)
  if (templateId && Number(templateId) > 0) return
  await canvas.loadFromJSON(currentTemplate.value)
  setCanvasTransform()
  initCommon()
  initEvent()
}

export const initEditor = async (templateId?: number, loadInitialTemplate = true) => {
  const fabricStore = useFabricStore()
  const { wrapperRef } = storeToRefs(fabricStore)
  initConf()
  await disposeEditor()
  initCanvas()
  if (loadInitialTemplate) {
    await initTemplate(templateId)
  } else {
    // Project data is loaded immediately after initialization, but the
    // canvas event handlers must already be attached for edits and history.
    initEvent()
  }
  const { width, height } = useElementBounding(wrapperRef.value)
  watch([width, height], () => {
    setCanvasTransform()
  })
}

export const disposeEditor = async () => {
  const oldCanvas = canvas
  canvas = null
  eventCanvas = null

  while (editorDisposables.length) {
    editorDisposables.pop()?.dispose()
  }

  if (oldCanvas) {
    await oldCanvas.dispose()
  }

  useMainStore().setCanvasObject(undefined)
}

export default (): [FabricCanvas] => [canvas as FabricCanvas]
