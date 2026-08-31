import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFabricStore, useTemplatesStore } from '@/store'
import { useElementBounding } from '@vueuse/core'
import { Group, Point } from 'fabric'
import useCanvas from '@/views/Canvas/useCanvas'
import useCenter from '@/views/Canvas/useCenter'
import { WorkSpaceThumbType } from '@/configs/canvas'
import { getObjectsBoundingBox } from '@/extension/util/common'

export default () => {
  const fabricStore = useFabricStore()
  const { zoom, wrapperRef, scalePercentage } = storeToRefs(fabricStore)
  const canvasScalePercentage = computed(() => Math.round(zoom.value * 100) + '%')

  /**
   * Scale canvas by percentage
   * @param command Scale command: zoom in, zoom out
   */
  const scaleCanvas = (command: '+' | '-') => {
    const [ canvas ] = useCanvas()
    let percentage = Math.round(zoom.value * 100)
    const step = 5
    const max = 500
    const min = 10
    if (command === '+' && percentage <= max) percentage += step
    if (command === '-' && percentage >= min) percentage -= step
    const { centerPoint } = useCenter()
    canvas.zoomToPoint(centerPoint, percentage / 100)
    canvas.absolutePan(new Point(centerPoint.x, centerPoint.y).scalarMultiply(canvas.getZoom()).subtract(canvas.getCenterPoint()))
    canvas.renderAll()
    zoom.value = canvas.getZoom()
  }

  /**
   * Set canvas zoom scale
   * Not directly setting the value, but dynamically calculating by setting canvas viewport percentage
   * @param value Target canvas zoom scale
   */
  const setCanvasScalePercentage = (value: number) => {
    const [ canvas ] = useCanvas()
    const { centerPoint } = useCenter()
    canvas.zoomToPoint(centerPoint, value / 100)
    canvas.absolutePan(new Point(centerPoint.x, centerPoint.y).scalarMultiply(canvas.getZoom()).subtract(canvas.getCenterPoint()))
    zoom.value = canvas.getZoom()
    canvas.renderAll()
  }

  const setWorkSpace = (width: number, height: number) => {
    const [ canvas ] = useCanvas()
    if (!canvas) return
    const fabricStore = useFabricStore()
    const templatesStore = useTemplatesStore()
    const { scalePercentage, zoom, clip } = storeToRefs(fabricStore)
    const { currentTemplate } = storeToRefs(templatesStore)
    const scalePercentageVal = scalePercentage.value / 100
    let zoomVal = 1
    const workWidth = currentTemplate.value.width / currentTemplate.value.zoom
    const workHeight = currentTemplate.value.height / currentTemplate.value.zoom
    if (width < workWidth / scalePercentageVal || height < workHeight / scalePercentageVal) {
      // Scale by width
      if (workWidth / width > workHeight / height) {
        zoomVal = workWidth / (width * scalePercentageVal)
      } 
      // Scale by height
      else {  
        zoomVal = workHeight / (height * scalePercentageVal)
      }
    }
    zoom.value = 1 / zoomVal
    clip.value = currentTemplate.value.clip
    canvas.setZoom(zoom.value)
    return {
      workWidth,
      workHeight
    }
  }

  // Update viewport dimensions
  const setCanvasTransform = () => {
    const [ canvas ] = useCanvas()
    if (!canvas) return
    const { zoom } = storeToRefs(fabricStore)
    const objects = canvas.getObjects().filter(ele => !WorkSpaceThumbType.includes(ele.id))
    // const boundingBox = Group.prototype.getObjectsBoundingBox(objects)
    const boundingBox = getObjectsBoundingBox(objects)
    const { width, height, centerPoint } = useCenter()
    if (!boundingBox) return
    zoom.value = Math.min(canvas.getWidth() / width, canvas.getHeight() / height) * scalePercentage.value / 100
    canvas.setZoom(zoom.value)
    canvas.absolutePan(new Point(centerPoint.x, centerPoint.y).scalarMultiply(zoom.value).subtract(canvas.getCenterPoint()))
    canvas.renderAll()
  }

  /**
   * Reset canvas size and position
   */
  const resetCanvas = () => {
    setCanvasTransform()
  }

  const setCanvasSize = () => {
    const [ canvas ] = useCanvas()
    const { width, height } = useElementBounding(wrapperRef.value)
    canvas.setDimensions({width: width.value, height: height.value})
  }

  return {
    canvasScalePercentage,
    setCanvasScalePercentage,
    setCanvasTransform,
    setWorkSpace,
    scaleCanvas,
    resetCanvas,
    setCanvasSize
  }
}