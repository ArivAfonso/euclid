import { propertiesToInclude, WorkSpaceCommonType, WorkSpaceThumbType } from "@/configs/canvas"
import { KEYS } from '@/configs/hotkey'
import { useFabricStore, useMainStore, useTemplatesStore } from "@/store"
import { CanvasElement, GroupElement, TextboxElement } from "@/types/canvas"
import { ElementNames } from "@/types/elements"
import { clipperPath } from '@/utils/clipper'
import useCanvas from "@/views/Canvas/useCanvas"
import { useActiveElement } from '@vueuse/core'
import { FabricObject, Group, Path } from 'fabric'
import { saveAs } from 'file-saver'
import { nanoid } from "nanoid"
import { storeToRefs } from "pinia"
import useCanvasZindex from "./useCanvasZindex"

export default () => {
  const templatesStore = useTemplatesStore()
  const mainStore = useMainStore()
  const { currentTemplate } = storeToRefs(templatesStore)
  const { isChecked } = storeToRefs(useFabricStore())
  const { canvasObject, clonedObject, currentPoint } = storeToRefs(mainStore)
  const { setZindex } = useCanvasZindex()

  /**
   * Handle drag-and-drop reorder from vuedraggable @change event.
   * layerObjects provides objects in canvas z-order (bottom→top).
   * vuedraggable renders them in the same order (first in array = first in DOM).
   * So oldIndex/newIndex directly index into liveObjects — no reversal needed.
   */
  const sortElement = async (eventData: any) => {
    const change = eventData.moved
    if (!change) return

    const { newIndex, oldIndex, element } = change
    if (WorkSpaceCommonType.includes(element.id)) return
    if (oldIndex === newIndex) return

    const [canvas] = useCanvas()
    const allObjects = [...canvas._objects]

    const workspaceObjs = allObjects.filter(
      obj =>
        WorkSpaceThumbType.includes(obj.id) ||
        (obj as any).type?.toLowerCase() === ElementNames.REFERENCELINE,
    )

    const liveObjects = allObjects.filter(
      obj =>
        !WorkSpaceThumbType.includes(obj.id) &&
        (obj as any).type?.toLowerCase() !== ElementNames.REFERENCELINE,
    )

    // vuedraggable renders liveObjects in array order (bottom→top z-order = first→last in DOM)
    // so oldIndex/newIndex map directly to liveObjects indices
    const movedObj = liveObjects[oldIndex]
    if (!movedObj) return

    liveObjects.splice(oldIndex, 1)
    liveObjects.splice(newIndex, 0, movedObj)

    // Rebuild canvas._objects: workspace objects at bottom, then user objects in new order
    canvas._objects = [...workspaceObjs, ...liveObjects] as FabricObject[]

    templatesStore.syncCanvasToTemplate()
    canvas.requestRenderAll()
    canvas.fire('object:modified', { target: element })
  }

  const layerElement = (e: any, _originalEvent: any) => {
    if (WorkSpaceCommonType.includes(e.draggedContext.element.id)) return false
    return true
  }

  const lockElement = (eid: string, status: boolean) => {
    const [ canvas ] = useCanvas()
    const element = queryElement(eid)
    if (!element) return
    const options = {
      lockMovementX: status,
      lockMovementY: status,
      selectable: false
    }
    if (status ) {
      element.hoverCursor = 'not-allowed';
      if (canvasObject.value && canvasObject.value.id == element.id) {
        canvas.discardActiveObject();
      }
    }
    canvas.renderAll()
    templatesStore.modifedElement(element, options)
  }

  const copyElement = async () => {
    if (!canvasObject.value) return
    clonedObject.value = await canvasObject.value.clone(propertiesToInclude) as any
    navigator.clipboard.writeText('')
  }

  const pasteElement = async () => {
    const [ canvas ] = useCanvas()
    if (!clonedObject.value) return
    const clonedObj = await clonedObject.value.clone(propertiesToInclude) as FabricObject
    let left = clonedObject.value.left + 10, top = clonedObject.value.top + 10
    if (currentPoint.value) {
      left = currentPoint.value.x, top = currentPoint.value.y
    }
    canvas.discardActiveObject()
    mainStore.setCanvasObject(undefined)
    clonedObj.set({left, top, evented: true, id: nanoid(10)})
    if (clonedObj.type === ElementNames.ACTIVE) {
      clonedObj.canvas = canvas
      const groupObject = clonedObj as GroupElement
      groupObject.forEachObject(item => {
        item.set({id: nanoid(10)})
        canvas.add(item as FabricObject)
        setZindex(canvas)
        templatesStore.addElement(item)
      })
      clonedObj.setCoords()
    }
    else {
      canvas.add(clonedObj as FabricObject)
      setZindex(canvas)
      templatesStore.addElement(clonedObj)
    }
    clonedObject.value.top = top
    clonedObject.value.left = left
    canvas.setActiveObject(clonedObj as FabricObject)
    canvas.renderAll()
  }

  const duplicateElement = async () => {
    if (!canvasObject.value) return
    const clonedObj = await canvasObject.value.clone(propertiesToInclude) as FabricObject
    const [ canvas ] = useCanvas()
    canvas.discardActiveObject()
    mainStore.setCanvasObject(undefined)
    const offset = 20
    clonedObj.set({
      left: (clonedObj.left ?? 0) + offset,
      top: (clonedObj.top ?? 0) + offset,
      evented: true,
      id: nanoid(10),
    })
    if (clonedObj.type === ElementNames.ACTIVE) {
      clonedObj.canvas = canvas
      const groupObject = clonedObj as GroupElement
      groupObject.forEachObject(item => {
        item.set({ id: nanoid(10) })
        canvas.add(item as FabricObject)
        setZindex(canvas)
        templatesStore.addElement(item)
      })
      clonedObj.setCoords()
    } else {
      canvas.add(clonedObj as FabricObject)
      setZindex(canvas)
      templatesStore.addElement(clonedObj)
    }
    canvas.setActiveObject(clonedObj as FabricObject)
    canvas.renderAll()
  }

  const deleteTextbox = (element: TextboxElement): boolean => {
    const [ canvas ] = useCanvas()
    if (element.isEditing) {
      const textboxElement = element as TextboxElement
      const selectedText = textboxElement.getSelectedText()
      if (selectedText) {
        textboxElement.removeChars(textboxElement.selectionStart, textboxElement.selectionEnd)
      } 
      else {
        textboxElement.removeChars(textboxElement.selectionStart, textboxElement.selectionStart + 1)
      }
      canvas.renderAll()
      return true
    } 
    return false
  }

  const deleteElement = (eid: string) => {
    const [ canvas ] = useCanvas()
    const element = queryElement(eid)
    if (!element) return
    if (element.group) {
      if ((element.group as GroupElement)._objects.length === 1) {
        const groupElement = element.group as GroupElement
        deleteElement(groupElement.id)
      }
      else {
        if (element.type === ElementNames.TEXTBOX && deleteTextbox(element as TextboxElement)) return
        element.group.remove(element as FabricObject)
      }
    }
    if (element.type === ElementNames.TEXTBOX && deleteTextbox(element as TextboxElement)) return
    canvas.discardActiveObject()
    mainStore.setCanvasObject(undefined)
    canvas.remove(element as FabricObject)
    canvas.renderAll()
    templatesStore.deleteElement(element)
  }

  const moveElement = (command: string, step = 2) => {
    const [ canvas ] = useCanvas()
    const activeObject = canvas.getActiveObject() as FabricObject
    if (!activeObject || !activeObject.left || !activeObject.top) return
    const activeElement = useActiveElement()
    if (activeElement.value) {
      const tagName = activeElement.value.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTARE') return
    }
    const left = activeObject.left, top = activeObject.top
    switch (command) {
      case KEYS.LEFT: 
        activeObject.set('left', left - step)
        activeObject.setCoords()
        canvas.renderAll()
        break
      case KEYS.RIGHT: 
        activeObject.set('left', left + step)
        activeObject.setCoords()
        canvas.renderAll()
        break
      case KEYS.UP: 
        activeObject.set('top', top - step)
        activeObject.setCoords()
        canvas.renderAll()
        break
      case KEYS.DOWN: 
        activeObject.set('top', top + step)
        activeObject.setCoords()
        canvas.renderAll()
        break
      default: break
    }
    templatesStore.updateElement({ id: activeObject.id, props: activeObject.toObject(propertiesToInclude as any[]) })
  }

  const cutElement = () => {
    if (!canvasObject.value) return
    copyElement()
    deleteElement(canvasObject.value.id)
  }

  const downloadElement = () => {
    downloadElementAsFormat('png')
  }

  const downloadElementAsFormat = (format: string) => {
    const activeObject = canvasObject.value
    if (!activeObject || typeof activeObject.toDataURL !== 'function') return

    const baseName = (activeObject.name || activeObject.type || 'element').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase()

    if (format === 'svg') {
      if (typeof activeObject.toSVG !== 'function') return
      const svgString = activeObject.toSVG()
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      saveAs(blob, `${baseName}.svg`)
      return
    }

    const quality = format === 'jpeg' ? 1 : undefined
    const dataURL = activeObject.toDataURL({
      format: format === 'jpeg' ? 'jpeg' : 'png',
      quality,
      multiplier: 2,
      enableRetinaScaling: true,
    })
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    saveAs(dataURL, `${baseName}.${ext}`)
  }

  const combineElements = async () => {
    const [ canvas ] = useCanvas()
    const activeObjects = canvas.getActiveObjects()
    if (!activeObjects) return
    canvas.discardActiveObject()
    const group = new Group(activeObjects, { 
      id: nanoid(10),
      name: ElementNames.GROUP, 
      interactive: false, 
      subTargetCheck: true,
    })
    canvas.remove(...activeObjects)
    canvas.add(group)
    templatesStore.addElement(group)
    templatesStore.renderElement()
  }

  const intersectElements = (val: number) => {
    const [ canvas ] = useCanvas()
    let activeObjects = canvas.getActiveObjects()
    if (!activeObjects) return
    if (activeObjects.length === 1 && activeObjects[0].type === ElementNames.GROUP) {
      activeObjects = (activeObjects[0] as Group)._objects
    }
    const res = clipperPath(activeObjects, val)
    const path = new Path(res)
    canvas.add(path)
    canvas.renderAll()
  }

  const uncombineElements = () => {
    const [ canvas ] = useCanvas()
    const activeObject = canvas.getActiveObject() as GroupElement
    if (!activeObject) return
    const objects = activeObject.removeAll() as FabricObject[]
    canvas.discardActiveObject()
    mainStore.setCanvasObject(undefined)
    if (activeObject.group) {
      activeObject.group.add(...objects)
      activeObject.group.remove(activeObject as FabricObject)
    }
    else {
      canvas.add(...objects)
      canvas.remove(activeObject as FabricObject)
    }
    // templatesStore.modifedElement()
    setZindex(canvas)
    canvas.renderAll()
  }

  const findElement = (eid: string, elements: FabricObject[] | undefined): FabricObject | undefined => {
    if (!elements) return
    for (let i = 0; i < elements.length; i++) {
      const item = elements[i] as FabricObject
      if (item.id === eid) {
        return item
      }
      if (item.type === ElementNames.GROUP) {
        const element = findElement(eid, (item as GroupElement)._objects)
        if (element) return element
      }
    }
    return
  }

  const queryElement = (eid: string): FabricObject | undefined => {
    const [ canvas ] = useCanvas()
    const elements = canvas.getObjects().filter(item => !WorkSpaceCommonType.includes((item as FabricObject).id))
    const element = elements.filter(obj => (obj as FabricObject).id === eid)[0] as FabricObject
    if (!element) {
      return findElement(eid, elements as FabricObject[])
    }
    return element
  }

  const findOption = (eid: string, options: FabricObject[]): FabricObject | undefined => {
    for (let i = 0; i < options.length; i++) {
      const item = options[i] as FabricObject | Group
      if (item.id === eid) return item
      if (item.isType('Group')) {
        const option = findOption(eid, (item as Group)._objects)
        if (option) return option
      }
    }
    return
  }

  const queryOption = (eid: string): FabricObject | undefined => {
    const options = currentTemplate.value.objects as FabricObject[]
    const option = options.filter(obj => obj.id === eid)[0] as FabricObject
    if (option) return option
    return findOption(eid, options)
  }

  const selectElement = (eid: string) => {
    const [ canvas ] = useCanvas()
    const element = queryElement(eid)
    if (!element) return
    canvas.setActiveObject(element as FabricObject)
    canvas.renderAll()
  }

  const visibleElement = (eid: string) => {
    const [ canvas ] = useCanvas()
    const element = queryElement(eid)
    if (!element) return
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    templatesStore.modifedElement(element, {visible: !element.visible})
  }

  const showElement = (eid: string) => {
    const element = queryElement(eid) as GroupElement
    if (!element) return 
    templatesStore.modifedElement(element, {isShow: !element.isShow})
  }

  const mouseoverElement = (eid: string) => {
    const activeObject = canvasObject.value as CanvasElement
    if (activeObject && activeObject.id === eid) return
    const element = queryElement(eid)
    if (!element) return
    mainStore.setHoveredObject(element as FabricObject)
  }

  const mouseleaveElement = (eid: string) => {
    mainStore.setHoveredObject(undefined)
    const activeObject = canvasObject.value as CanvasElement
    if (activeObject && activeObject.id === eid) return
    const element = queryElement(eid)
    if (!element) return
    mainStore.setLeaveddObject(element as FabricObject)
  }

  const cancelElement = () => {
    const [ canvas ] = useCanvas()
    mainStore.setCanvasObject(undefined)
    canvas.discardActiveObject()
    canvas.renderAll()
  }

  const forwardElement = () => {
    const [ canvas ] = useCanvas()
    if (!canvasObject.value) return
    setZindex(canvas)
    canvas.renderAll()
    // templatesStore.modifedElement()
  }

  const backwardElement = () => {
    const [ canvas ] = useCanvas()
    if (!canvasObject.value) return
    setZindex(canvas)
    canvas.renderAll()
    // templatesStore.modifedElement()
  }

  const queryTextboxChecked = (elements: FabricObject[]): boolean => {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      if (element.type === ElementNames.TEXTBOX && (element as TextboxElement).editable) {
        return true
      }
      if (element.type === ElementNames.GROUP) {
        const group = element as GroupElement
        const isChecked = queryTextboxChecked(group.objects)
        if (isChecked) return true
      }
    }
    return false
  }

  const checkElement = (eid: string) => {
    const [ canvas ] = useCanvas()
    const element = queryElement(eid) as FabricObject
    // element.isSelected = true
    canvas.renderAll()
    // templatesStore.modifedElement()
    // const elements = canvas.getObjects().filter(item => !WorkSpaceCommonType.includes((item as CanvasElement).id)) as FabricObject[]
    // isChecked.value = queryTextboxChecked(elements)
  }

  const maskElement = (eid: string) => {

  }

  const resetElements = () => {
    const [ canvas ] = useCanvas()
    if (confirm('Reset the canvas?')) {
      templatesStore.clearTemplate()
    }
  }

  const setElementGlobally = async () => {
    if (!canvasObject.value) return
    const serialized = canvasObject.value.toObject(propertiesToInclude)
    const sourceId = serialized.id

    // Register as global so future slides also get it
    templatesStore.globalObjects.push({ ...serialized } as any)

    // Add to all existing slides with globalParentId tag
    templatesStore.templates.forEach((template, index) => {
      if (index === templatesStore.templateIndex) return

      const serializedCopy = { ...serialized, id: nanoid(10), globalParentId: sourceId }
      template.objects = [...template.objects, serializedCopy as any]
    })
  }

  const unsetElementGlobally = async () => {
    if (!canvasObject.value) return
    const sourceId = canvasObject.value.id
    templatesStore.removeGlobalObject(sourceId)
  }

  return {
    // createElement,
    layerElement,
    sortElement,
    lockElement,
    copyElement,
    cutElement,
    pasteElement,
    duplicateElement,
    downloadElement,
    downloadElementAsFormat,
    deleteElement,
    moveElement,
    combineElements,
    uncombineElements,
    queryElement,
    selectElement,
    visibleElement,
    showElement,
    mouseoverElement,
    mouseleaveElement,
    cancelElement,
    forwardElement,
    backwardElement,
    checkElement,
    intersectElements,
    maskElement,
    resetElements,
    setElementGlobally,
    unsetElementGlobally
  }
}