
import { ref } from 'vue'
import { saveAs } from 'file-saver'
import { storeToRefs } from 'pinia'
import { useFabricStore, useTemplatesStore } from '@/store'
import { WorkSpaceThumbType, WorkSpaceClipType, WorkSpaceCommonType, WorkSpaceSafeType, propertiesToInclude } from '@/configs/canvas'
import { ImageFormat } from 'fabric'
import { downloadSVGFile } from '@/utils/download'
import { changeDpiDataUrl } from 'changedpi'
import useCanvas from '@/views/Canvas/useCanvas'
import useCenter from '@/views/Canvas/useCenter'
import { ElementNames } from '@/types/elements'

export default () => {
  
  const Exporting = ref(false)
  const { showClip, showSafe } = storeToRefs(useFabricStore())
  const { currentTemplate, templateCanvas, templates } = storeToRefs(useTemplatesStore())
  // Helper: find objects hidden from export
  // Helper: find objects hidden from export and save their original visibility
  const getExportHiddenObjects = (canvas: any) => {
    const objects = canvas.getObjects().filter((obj: any) => obj.showInExport === false)
    return objects.map((obj: any) => {
      // Save original visible state so we can restore it properly
      const origVisible = obj.visible
      return { obj, origVisible }
    })
  }

  // Export image
  const exportImage = (format: ImageFormat, quality: number, dpi: number, ignoreClip = true) => {
    Exporting.value = true
    const [ canvas ] = useCanvas()
    const { left, top, width, height } = useCenter()
    const zoom = canvas.getZoom()
    const viewportTransform = canvas.viewportTransform
    const activeObject = canvas.getActiveObject()
    // Keep workspace background visible for both PNG and JPEG exports.
    let ignoreObjects = canvas.getObjects().filter(obj => WorkSpaceThumbType.includes(obj.id))
    // Hide elements marked as "don't show in export"
    const hiddenExportObjects = getExportHiddenObjects(canvas)
    if (ignoreClip) {
      ignoreObjects.map(item => item.set({visible: false}))
    }
    hiddenExportObjects.forEach(({ obj }) => obj.set({visible: false}))
    if (ignoreClip) {
      canvas.renderAll()
    }
    if (activeObject) canvas.discardActiveObject()
    canvas.getObjects().filter(item => item.type === ElementNames.REFERENCELINE && item.visible === true).map(item => item.set({visible: false}))
    canvas.renderAll()
    let result = canvas.toDataURL({
      multiplier: 1 / zoom,
      // multiplier: 2,
      quality: quality,
      format: format,
      width: width * zoom,
      height: height * zoom,
      left: left * zoom + viewportTransform[4],
      top: top * zoom + viewportTransform[5]
    })
    result = changeDpiDataUrl(result, dpi)
    saveAs(result, `euclid-${Date.now()}.${format}`)
    Exporting.value = false
    ignoreObjects.map(item => item.set({visible: true}))
    hiddenExportObjects.forEach(({ obj, origVisible }) => obj.set({visible: origVisible}))
    canvas.getObjects().filter(obj => obj.id === WorkSpaceClipType).map(item => item.set({visible: showClip.value}))
    canvas.getObjects().filter(obj => obj.id === WorkSpaceSafeType).map(item => item.set({visible: showSafe.value}))
    if (activeObject) canvas.setActiveObject(activeObject)
    canvas.getObjects().filter(item => item.type === ElementNames.REFERENCELINE && item.visible === false).map(item => item.set({visible: true}))
    canvas.renderAll()
  }

  const getSVGData = () => {
    const [ canvas ] = useCanvas()
    const { left, top, width, height } = useCenter()
    const hiddenExportObjects = getExportHiddenObjects(canvas)
    hiddenExportObjects.forEach(({ obj }) => obj.set({visible: false}))
    canvas.getObjects().filter(item => item.type === ElementNames.REFERENCELINE && item.visible === true).map(item => item.set({visible: false}))
    canvas.renderAll()
    const data = canvas.toSVG({
      viewBox: {
        x: left,
        y: top,
        width: width,
        height: height,
      },
      width: width + 'px',
      height: height + 'px'
    }, (element) => element)
    hiddenExportObjects.forEach(({ obj, origVisible }) => obj.set({visible: origVisible}))
    canvas.getObjects().filter(item => item.type === ElementNames.REFERENCELINE && item.visible === false).map(item => item.set({visible: true}))
    canvas.renderAll()
    return data
  }

  const getJSONData = () => {
    const [ canvas ] = useCanvas()
    // Temporarily hide elements marked as "don't show in export"
    const hiddenExportObjects = getExportHiddenObjects(canvas)
    hiddenExportObjects.forEach(({ obj }) => obj.set({visible: false}))
    canvas.renderAll()
    const serializer = canvas.toObject(propertiesToInclude)
    serializer.workSpace = currentTemplate.value.workSpace
    serializer.zoom = currentTemplate.value.zoom
    serializer.width = currentTemplate.value.width
    serializer.height = currentTemplate.value.height
    // Restore hidden objects
    hiddenExportObjects.forEach(({ obj, origVisible }) => obj.set({visible: origVisible}))
    canvas.renderAll()
    // console.log(JSON.stringify(serializer));
    
    return serializer
  }

  const exportSVG = () => {
    const [ canvas ] = useCanvas()
    const ignoreObjects = canvas.getObjects().filter(obj => WorkSpaceThumbType.includes(obj.id))
    const hiddenExportObjects = getExportHiddenObjects(canvas)
    ignoreObjects.map(item => item.set({visible: false}))
    hiddenExportObjects.forEach(({ obj }) => obj.set({visible: false}))
    canvas.renderAll()
    const data = getSVGData()
    downloadSVGFile(data, `euclid-${Date.now()}.svg`)
    ignoreObjects.map(item => item.set({visible: true}))
    hiddenExportObjects.forEach(({ obj, origVisible }) => obj.set({visible: origVisible}))
    canvas.getObjects().filter(obj => obj.id === WorkSpaceClipType).map(item => item.set({visible: showClip.value}))
    canvas.getObjects().filter(obj => obj.id === WorkSpaceSafeType).map(item => item.set({visible: showSafe.value}))
    canvas.renderAll()
  }

  // Export PDF
  const exportPDF = async (rangeType: string) => {
    Exporting.value = true
    try {
      const templatesStore = useTemplatesStore()
      templatesStore.syncCanvasToTemplate()

      let templatesToExport = templates.value
      if (rangeType === 'current') {
        templatesToExport = [templates.value[templatesStore.templateIndex]].filter(Boolean)
      }

      const { exportToPDFBlob } = await import('@/utils/pdfExport')
      const blob = await exportToPDFBlob(templatesToExport)
      saveAs(blob, `euclid-${Date.now()}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      Exporting.value = false
    }
  }

  // Export JSON
  const exportJSON = () => {
    const serializer = getJSONData()
    const blob = new Blob([JSON.stringify(serializer)])
    saveAs(blob, `euclid-${Date.now()}.json`)
  }

  return {
    exportImage,
    exportPDF,
    exportJSON,
    exportSVG,
    getJSONData,
    getSVGData,
    Exporting
  }
}