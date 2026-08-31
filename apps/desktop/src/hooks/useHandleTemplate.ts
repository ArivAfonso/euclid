import { computed } from "vue"
import { DefaultVersion } from "@/configs/size"
import { useMainStore, useTemplatesStore } from "@/store"
import { Template } from "@/types/canvas"
import { nanoid } from "nanoid"
import { storeToRefs } from "pinia"
import { copyText, readClipboard } from "@/utils/clipboard"
import { encrypt } from "@/utils/crypto"
import { toast } from '@/components/ui/toast/use-toast'
import { KEYS } from '@/configs/hotkey'
import { WorkSpaceDrawType, CanvasBackground } from "@/configs/canvas"
import usePasteTextClipboardData from '@/hooks/usePasteTextClipboardData'



export default () => {
  const templatesStore = useTemplatesStore()
  const mainStore = useMainStore()
  const { templates, templateIndex, currentTemplate } = storeToRefs(templatesStore)
  // const mainStore = useMainStore()
  // const slidesStore = useSlidesStore()
  const { selectedTemplatesIndex: _selectedTemplatesIndex } = storeToRefs(mainStore)
  // const { currentSlide, templates, theme, slideIndex } = storeToRefs(templatesStore)

  const selectedTemplatesIndex = computed(() => [..._selectedTemplatesIndex.value, templateIndex.value])
  const selectedTemplates = computed(() => templates.value.filter((item, index) => selectedTemplatesIndex.value.includes(index)))
  const selectedTemplatesId = computed(() => selectedTemplates.value.map(item => item.id))

  const { pasteTextClipboardData } = usePasteTextClipboardData()

  const getEmptyTemplate = (): Template => {
    const emptyTemplate: Template = {
      id: nanoid(10),
      version: DefaultVersion,
      zoom: currentTemplate.value.zoom,
      width: currentTemplate.value.width,
      height: currentTemplate.value.height,
      clip: currentTemplate.value.clip,
      objects: currentTemplate.value.objects.filter(item => item.id === WorkSpaceDrawType),
      workSpace: {
        fillType: 0,
        left: 0,
        top: 0,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
      },
      background: CanvasBackground
    }
    return emptyTemplate
  }

  // // Reset page
  const resetTemplate = async () => {
    templatesStore.setTemplateIndex(0)
    templatesStore.setTemplates([getEmptyTemplate()])
    await templatesStore.renderTemplate()
  }

  /**
   * Move page focus
   * @param command Move page focus command: up, down
   */
  const updateTemplateIndex = async (command: string) => {
    if (command === KEYS.UP && templateIndex.value > 0) {
      templatesStore.setTemplateIndex(templateIndex.value - 1)
    }
    else if (command === KEYS.DOWN && templateIndex.value < templates.value.length - 1) {
      templatesStore.setTemplateIndex(templateIndex.value + 1)
    }
    await templatesStore.renderTemplate()
  }

  // Encrypt current page data and copy to clipboard
  const copyTemplate = () => {
    const text = encrypt(JSON.stringify({
      type: 'slides',
      data: selectedTemplates.value,
    }))
    copyText(text).then(() => {
      mainStore.setThumbnailsFocus(true)
    })
  }

  // Try to decrypt clipboard data and add to next page (paste)
  const pasteTemplate = () => {
    readClipboard().then(text => {
      pasteTextClipboardData(text, { onlySlide: true })
    }).catch(err => toast({
      title: 'Warning',
      description: String(err),
      variant: 'destructive'
    }))
  }

  // Create a blank page and add to next page
  const createTemplate = async () => {
    await templatesStore.addTemplate(getEmptyTemplate())
    templatesStore.setTemplateIndex(templateIndex.value)
    await templatesStore.renderTemplate()
  }

  const addTemplate = async (template: Template) => {
    await templatesStore.addTemplate(template)
    templatesStore.setTemplateIndex(templateIndex.value)
    await templatesStore.renderTemplate()
  }

  // // Create new page from template
  // const createSlideByTemplate = (slides: Slide[]) => {
  //   for (let i = 0; i < slides.length; i++) {
  //     const slide = slides[i]
  //     const { groupIdMap, elIdMap } = createElementIdMap(slide.elements)

  //     for (const element of slide.elements) {
  //       element.id = elIdMap[element.id]
  //       if (element.groupId) element.groupId = groupIdMap[element.groupId]
  //     }
  //     const newSlide = {
  //       ...slide,
  //       id: nanoid(10),
  //     }
  //     slidesStore.addSlide(newSlide)
  //     
  //   }
  // }

  // Duplicate current template to next page
  const copyAndPasteTemplate = async () => {
    const template = JSON.parse(JSON.stringify(currentTemplate.value))
    template.id = nanoid(10)
    // Update all element IDs to avoid conflicts
    template.objects = template.objects.map((obj: any) => ({
      ...obj,
      id: nanoid(10)
    }))
    await addTemplate(template)
  }

  // Delete current page; if all pages will be deleted, execute page reset
  const deleteTemplate = (targetTamplatesId = selectedTemplatesId.value) => {
    if (templates.value.length === targetTamplatesId.length) resetTemplate()
    else templatesStore.deleteTemplate(targetTamplatesId)
    mainStore.updateSelectedTemplatesIndex([])
  }

  // Copy current page then delete (cut)
  // Since copy operation will cause multi-select state to be lost, need to cache page IDs to delete in advance
  const cutTemplate = () => {
    const targetSlidesId = [...selectedTemplatesId.value]
    copyTemplate()
    deleteTemplate(targetSlidesId)
  }

  // Select all pages
  const selectAllSlide = () => {
    const newSelectedSlidesIndex = Array.from(Array(templates.value.length), (item, index) => index)
    mainStore.updateSelectedTemplatesIndex(newSelectedSlidesIndex)
  }

  // Sync data after drag reordering pages
  const sortTemplates = (newIndex: number, oldIndex: number) => {
    if (oldIndex === newIndex) return
  
    const _templates = JSON.parse(JSON.stringify(templates.value))
    const _template = _templates[oldIndex]
    _templates.splice(oldIndex, 1)
    _templates.splice(newIndex, 0, _template)
    templatesStore.setTemplates(_templates)
    templatesStore.setTemplateIndex(newIndex)
    templatesStore.renderElement()
  }

  return {
    resetTemplate,
    updateTemplateIndex,
    copyTemplate,
    pasteTemplate,
    createTemplate,
    copyAndPasteTemplate,
    deleteTemplate,
    cutTemplate,
    addTemplate,
    sortTemplates,
  }
}