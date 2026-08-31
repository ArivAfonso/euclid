import { defineStore } from 'pinia'
import { Templates } from '@/mocks/templates'
import { Template, CanvasElement, ImageElement, GroupElement, RectElement, SerializedObjectProps } from '@/types/canvas'
import { FabricObject, SerializedImageProps, FabricImage, Group, StaticCanvas } from 'fabric'
import { WorkSpaceDrawType, WorkSpaceThumbType, propertiesToInclude } from '@/configs/canvas'
import { nanoid } from 'nanoid'
import { useMainStore } from './main'
import { ElementNames } from '@/types/elements'
import { Snapshot, SnapshotType } from '@/types/history'
import useCanvasScale from '@/hooks/useCanvasScale'
import useCanvas from '@/views/Canvas/useCanvas'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useCommon from '@/views/Canvas/useCommon'

declare const usePixi: () => [Worker]

type FontStyle = 'normal' | 'italic'

const FONT_WEIGHT_KEYWORDS: Record<string, number> = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  normal: 400,
  regular: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
  heavy: 900,
}

const normalizeFontWeight = (weight: unknown): number => {
  if (typeof weight === 'number') return weight
  if (typeof weight === 'string') {
    const normalized = weight.trim().toLowerCase().replace(/\s+/g, '')
    const numeric = Number.parseInt(normalized, 10)
    if (!Number.isNaN(numeric)) return numeric
    return FONT_WEIGHT_KEYWORDS[normalized] ?? 400
  }
  return 400
}

const normalizeFontStyle = (style: unknown): FontStyle => (
  typeof style === 'string' && style.toLowerCase() === 'italic' ? 'italic' : 'normal'
)

const clampFontWeight = (weight: number): number => {
  if (!Number.isFinite(weight)) return 400
  const rounded = Math.round(weight / 100) * 100
  return Math.min(900, Math.max(100, rounded))
}

const collectTemplateFonts = (templates: Template[]) => {
  const fonts = new Map<string, { family: string; weight: number; style: FontStyle }>()

  const collectFromObjects = (objects: Template['objects']) => {
    if (!Array.isArray(objects)) return

    objects.forEach((obj) => {
      if (!obj) return
      const type = typeof obj.type === 'string' ? obj.type.toLowerCase() : ''

      if (type === 'group' && Array.isArray((obj as any).objects)) {
        collectFromObjects((obj as any).objects as Template['objects'])
      }

      if (type === 'textbox' || type === 'text' || type === 'i-text') {
        const family = (obj as any).fontFamily as string | undefined
        if (!family) return

        const weight = normalizeFontWeight((obj as any).fontWeight)
        const style = normalizeFontStyle((obj as any).fontStyle)
        const key = `${family}::${weight}::${style}`

        if (!fonts.has(key)) {
          fonts.set(key, { family, weight, style })
        }
      }
    })
  }

  templates.forEach((template) => {
    collectFromObjects(template.objects)
  })

  return Array.from(fonts.values())
}

const ensureTemplateFonts = async (templates: Template[]) => {
  const mainStore = useMainStore()
  const fontRequests = collectTemplateFonts(templates)

  if (!fontRequests.length) return

  fontRequests.forEach(({ family, weight, style }) => {
    const safeWeight = clampFontWeight(weight)
    const variant = style === 'italic'
      ? (safeWeight === 400 ? 'italic' : `${safeWeight}italic`)
      : (safeWeight === 400 ? 'regular' : `${safeWeight}`)
    mainStore.ensureFontLoaded(family, variant)
  })

  if (typeof document === 'undefined' || !('fonts' in document)) return

  const fontLoadPromises = fontRequests.map(({ family, weight, style }) => {
    const safeWeight = clampFontWeight(weight)
    const descriptor = `${style} ${safeWeight} 16px "${family.replace(/"/g, '\\"')}"`

    try {
      return (document.fonts as FontFaceSet).load(descriptor)
    } catch {
      return Promise.resolve([])
    }
  })

  await Promise.allSettled(fontLoadPromises)
}


interface UpdateElementData {
  id: string | string[]
  left?: number
  top?: number
  props: Partial<CanvasElement>
}

export interface TemplatesState {
  templateId: string
  templates: Template[]
  templateIndex: number
  templateCanvas: Map<string, StaticCanvas>
  globalObjects: SerializedObjectProps[]
}

// Fabric's loadFromJSON is asynchronous. Serialize template renders so a
// slower load from an old project cannot finish after the active project.
let templateRenderQueue: Promise<void> = Promise.resolve()
let latestTemplateRenderRequest = 0

export const useTemplatesStore = defineStore('Templates', {
  state: (): TemplatesState => ({
    // theme: theme, // Theme style
    templateId: '',
    templates: Templates, // Page data
    templateIndex: 0, // Current page index
    templateCanvas: new Map(),
    globalObjects: [],
    // fixedRatio: false, // Fixed ratio
    // slideUnit: 'mm', // Dimension unit
    // slideName: '', // Template name
    // slideId: '', // Template id
  }),

  getters: {
    currentTemplate(state) {
      return state.templates[state.templateIndex] as Template
    },

    currentTemplateWidth(state) {
      const currentTemplate = state.templates[state.templateIndex]
      return currentTemplate.width / currentTemplate.zoom
    },

    currentTemplateHeight(state) {
      const currentTemplate = state.templates[state.templateIndex]
      return currentTemplate.height / currentTemplate.zoom
    },

    // currentTemplateElement(state) {
    //   const currentTemplate = state.templates[state.templateIndex]
    //   const [ canvas ] = useCanvas()
    //   const activeObject = canvas.getActiveObject() as CanvasElement
    //   return currentTemplate.objects.filter(ele => ele.id === activeObject.id)[0]
    // }
  },

  actions: {
    /**
     * Sync current canvas objects back to the template store so that
     * loadFromJSON reloads the correct state.
     */
    syncCanvasToTemplate() {
      const [canvas] = useCanvas()
      if (!canvas) return

      const liveObjects = canvas.getObjects()
        .filter(obj => !WorkSpaceThumbType.includes(obj.id))
        .map(obj => obj.toObject(propertiesToInclude as any[]))

      // Keep the WorkSpaceDraw object from the existing template (it is a
      // non-persisted UI object) and prepend it so the draw order is preserved.
      const workSpaceObj = this.currentTemplate.objects.find(
        (obj: any) => obj.id === WorkSpaceDrawType
      )
      if (workSpaceObj) {
        this.currentTemplate.objects = [workSpaceObj, ...liveObjects]
      } else {
        this.currentTemplate.objects = liveObjects
      }
    },

    async renderTemplate() {
      const [requestedCanvas] = useCanvas()
      const requestId = ++latestTemplateRenderRequest

      const render = async () => {
        const [activeCanvas] = useCanvas()
        if (!requestedCanvas || requestedCanvas !== activeCanvas || requestId !== latestTemplateRenderRequest) {
          return
        }

        const { initCommon } = useCommon()
        const { setCanvasSize, setCanvasTransform } = useCanvasScale()

        await requestedCanvas.loadFromJSON(this.currentTemplate)

        // The route or project may have changed while Fabric was loading.
        // Do not apply stale post-load state to the active canvas.
        const [currentCanvas] = useCanvas()
        if (requestedCanvas !== currentCanvas || requestId !== latestTemplateRenderRequest) {
          return
        }

        this.setObjectFilter(this.currentTemplate.objects as CanvasElement[])
        setCanvasSize()
        setCanvasTransform()
        initCommon()
        requestedCanvas.renderAll()
      }

      const nextRender = templateRenderQueue.then(render, render)
      templateRenderQueue = nextRender.catch(() => undefined)
      await nextRender
    },

    invalidateTemplateRender() {
      latestTemplateRenderRequest++
    },

    async renderElement() {
      const [canvas] = useCanvas()
      const {initCommon} = useCommon()
      const {setCanvasSize} = useCanvasScale()
      const mainStore = useMainStore()
      canvas.discardActiveObject()
      mainStore.setCanvasObject(undefined)

      // Ensure the template store reflects the live canvas state before reloading
      this.syncCanvasToTemplate()

      await canvas.loadFromJSON(this.currentTemplate)
      setCanvasSize()
      initCommon()
    },

    modifedElement(target: FabricObject, options: Record<string, any>,) {
      const [ canvas ] = useCanvas()
      const { addHistorySnapshot } = useHistorySnapshot()
      const index = canvas._objects.findIndex(item => item.id === target.id)
      
      const original: Record<string, any> = {}
      Object.keys(options).forEach(key => {
        original[key] = target[key as keyof FabricObject]
      })

      target.set({...options});
      target.setCoords()

      const data: Snapshot = {
        type: SnapshotType.MODIFY,
        index,
        target: target.toObject(propertiesToInclude),
        transform: { original } as any,
        tid: this.templateId
      }
      const proxyEl: any = this.currentTemplate.objects.find(i => i.id === target.id)
      addHistorySnapshot(data)
      
      // Update target and template object simultaneously
      if (proxyEl) {
        Object.keys(options).forEach((key) => {
          proxyEl[key] = options[key]
        })
      }
      if (options.filters) {
        (target as FabricImage).applyFilters();
      }
      canvas.setActiveObject(target)
      canvas.renderAll()
    },

    addElement(target: FabricObject) {
      const [ canvas ] = useCanvas()
      const { addHistorySnapshot } = useHistorySnapshot()
      const serialized = target.toObject(propertiesToInclude)
      const data: Snapshot = {
        type: SnapshotType.ADD,
        index: canvas._objects.indexOf(target),
        target: serialized,
        tid: this.templateId
      }
      // Sync to template objects so the element survives canvas reloads
      this.currentTemplate.objects.push(serialized)
      addHistorySnapshot(data)
    },

    groupElement(target: FabricObject, objects: FabricObject[]) {
      const [ canvas ] = useCanvas()
      const { addHistorySnapshot } = useHistorySnapshot()
      const data: Snapshot = {
        type: SnapshotType.GROUP,
        index: canvas._objects.indexOf(target),
        target: target.toObject(propertiesToInclude),
        objects: objects.map(item => item.toObject(propertiesToInclude)),
        tid: this.templateId
      }
      addHistorySnapshot(data)
    },

    ungroupElement() {

    },

    deleteElement(target: FabricObject) {
      const [ canvas ] = useCanvas()
      const { addHistorySnapshot } = useHistorySnapshot()
      const data: Snapshot = {
        type: SnapshotType.DELETE,
        index: canvas._objects.indexOf(target),
        target: target.toObject(propertiesToInclude),
        tid: this.templateId
      }
      canvas.remove(target)
      canvas.renderAll()
      // Sync removal to template objects
      const templateIdx = this.currentTemplate.objects.findIndex((i: any) => i.id === target.id)
      if (templateIdx !== -1) this.currentTemplate.objects.splice(templateIdx, 1)
      addHistorySnapshot(data)
    },

    setClip(clip: number) {
      const { addHistorySnapshot } = useHistorySnapshot()
      this.templates.forEach(template => {
        template.clip = clip
      })
      // addHistorySnapshot()
    },

    setSize(width: number, height: number, zoom: number) {
      const { initCommon } = useCommon()
      const { addHistorySnapshot } = useHistorySnapshot()
      this.templates.forEach(template => {
        template.width = width
        template.height = height
        template.zoom = zoom
        template.objects.filter(item => item.id === WorkSpaceDrawType).map(ele => {
          ele.width = width / zoom
          ele.height = height / zoom
        })
      })
      initCommon()
      // addHistorySnapshot()
    },

    setObjectFilter(objects: CanvasElement[]) {
      objects.forEach(ele => {
        if (ele.type.toLowerCase() === ElementNames.IMAGE) {
          this.setImageFilter(ele as ImageElement)
          // this.setImageMask(ele as ImageElement)
        }
        if (ele.type.toLowerCase() === ElementNames.GROUP) {
          this.setObjectFilter(((ele as GroupElement).objects) as CanvasElement[])
        }
      })
    },

    setImageFilter(image: ImageElement) {
      if (!image.pixiFilters) return
      const [ pixi ] = usePixi()
      pixi.postMessage({
        id: image.id,
        type: "filter", 
        src: image.src, 
        pixiFilters: JSON.stringify(image.pixiFilters), 
        width: image.width, 
        height: image.height
      });
    },

    setImageMask(image: ImageElement) {
      if (!image.mask) return
      const [ pixi ] = usePixi()
      pixi.postMessage({
        id: image.id,
        type: "mask", 
        src: image.src,
        mask: JSON.stringify(image.mask), 
        width: image.width, 
        height: image.height
      });
    },

    async changeTemplate(template: Template | Template[]) {
      const { setCanvasTransform } = useCanvasScale()
      const templates = Array.isArray(template) ? template : [template]
      this.templates = templates
      this.templateIndex = 0
      await ensureTemplateFonts(templates)
      await this.renderTemplate()
      setCanvasTransform()
    },

    setTemplates(templates: Template[]) {
      this.templates = templates
    },

    // Replace all project-scoped editor state without synchronizing the
    // previous live canvas into the incoming project.
    replaceProjectTemplates(templates: Template[]) {
      this.invalidateTemplateRender()
      this.templates = templates
      this.templateIndex = 0
      this.templateId = ''
      this.templateCanvas.clear()
      this.globalObjects = []

      const mainStore = useMainStore()
      mainStore.updateSelectedTemplatesIndex([])
      mainStore.setCanvasObject(undefined)
    },

    setTemplateId(templateId: string) {
      this.templateId = templateId
    },

    /**
     * Switch the active template (page) index.
     *
     * CRITICAL: Before changing the index, sync the live canvas state back
     * into the CURRENT template's `objects` array. Otherwise the edits made
     * on the current page are lost — they live only on the Fabric canvas and
     * `renderTemplate()` will overwrite them with the next page's data.
     *
     * A guard prevents syncing during the very first render (when the canvas
     * is empty / not yet initialized) and when the index isn't actually
     * changing.
     */
    setTemplateIndex(index: number) {
      if (index === this.templateIndex) return

      const [canvas] = useCanvas()

      // Only sync if a canvas exists and has real (non-workspace) objects.
      // On the first mount the canvas is null or empty, so we must skip.
      if (canvas) {
        const hasUserObjects = canvas.getObjects().some(
          (obj: any) => !WorkSpaceThumbType.includes(obj.id) && obj.id !== WorkSpaceDrawType
        )
        if (hasUserObjects) {
          this.syncCanvasToTemplate()
        }
      }

      this.templateIndex = index
    },

    async addTemplate(template: Template | Template[]) {
      const templates = Array.isArray(template) ? template : [template]
      const addIndex = this.templateIndex + 1

      if (this.globalObjects.length > 0) {
        templates.forEach(t => {
          this.globalObjects.forEach(obj => {
            const clone = { ...obj, id: nanoid(10), globalParentId: obj.id }
            t.objects = [...t.objects, clone as any]
          })
        })
      }

      this.templates.splice(addIndex, 0, ...templates)
      this.templateIndex = addIndex
      await ensureTemplateFonts(templates)
      await this.renderTemplate()
    },

    removeGlobalObject(objectId: string) {
      const objIndex = this.globalObjects.findIndex(obj => obj.id === objectId)
      if (objIndex === -1) return
      this.globalObjects.splice(objIndex, 1)

      // Remove cloned copies from all templates (tagged with globalParentId)
      this.templates.forEach(template => {
        template.objects = template.objects.filter(obj => {
          const srcObj = obj as any
          return srcObj.globalParentId !== objectId
        })
      })
    },

    isGlobalObject(objectId: string): boolean {
      return this.globalObjects.some(obj => obj.id === objectId)
    },

    updateTemplate(props: Partial<Template>) {
      const { addHistorySnapshot } = useHistorySnapshot()
      const templateIndex = this.templateIndex
      this.templates[templateIndex] = { ...this.templates[templateIndex], ...props }
      // addHistorySnapshot()
    },

    deleteTemplate(templateId: string | string[]) {
      const { addHistorySnapshot } = useHistorySnapshot()
      const templateIds = Array.isArray(templateId) ? templateId : [templateId]
  
      const deleteTemplatesIndex = []
      for (let i = 0; i < templateIds.length; i++) {
        const index = this.templates.findIndex(item => item.id === templateIds[i])
        deleteTemplatesIndex.push(index)
      }
      let newIndex = Math.min(...deleteTemplatesIndex)
  
      const maxIndex = this.templates.length - templateIds.length - 1
      if (newIndex > maxIndex) newIndex = maxIndex
  
      this.templateIndex = newIndex
      this.templates = this.templates.filter(item => !templateIds.includes(item.id))
      // addHistorySnapshot()
    },

    clearTemplate() {
      const objects = this.templates[this.templateIndex].objects.filter(item => item.id === WorkSpaceDrawType)
      this.templates[this.templateIndex].objects = objects
      this.renderTemplate()
    },

    updateWorkSpace(props: Partial<Template>) {
      const templateIndex = this.templateIndex
      this.templates[templateIndex] = { ...this.templates[templateIndex], ...props }
    },

    updateElement(data: UpdateElementData) {
      const { addHistorySnapshot } = useHistorySnapshot()
      const { id, props } = data
      const elementIds = typeof id === 'string' ? [id] : id
      if (!elementIds) return
      const template = this.templates[this.templateIndex]
      const elements = template.objects.map(el => elementIds.includes(el.id) ? { ...el, ...props }: el)
      this.templates[this.templateIndex].objects = elements as FabricObject[]
      // addHistorySnapshot()
    },

    // addElement(element: FabricObject | FabricObject[]) {
    //   const { addHistorySnapshot } = useHistorySnapshot()
    //   const elements = Array.isArray(element) ? element : [element]
    //   const currentTemplateElements = this.templates[this.templateIndex].objects
    //   const newElements = [...currentTemplateElements, ...elements]
    //   this.templates[this.templateIndex].objects = newElements as FabricObject[]
    //   addHistorySnapshot()
    // },

    // deleteElement(elementId: string | string[]) {
    //   const { addHistorySnapshot } = useHistorySnapshot()
    //   const elementIds = Array.isArray(elementId) ? elementId : [elementId]
    //   const currentTemplateElements = this.templates[this.templateIndex].objects
    //   const newElements = currentTemplateElements.filter(item => !elementIds.includes(item.id))
    //   this.templates[this.templateIndex].objects = newElements
    //   addHistorySnapshot()
    // },

    setBackgroundImage(props: SerializedImageProps) {
      this.currentTemplate.backgroundImage = props
    },

  }
})
