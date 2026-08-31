import { storeToRefs } from 'pinia'
import { nanoid } from 'nanoid'
import { useTemplatesStore, useMainStore } from '@/store'
import { createTemplateIdMap, createElementIdMap } from '@/utils/element'
import { CanvasElement, Template } from '@/types/canvas'
import { ElementNames } from '@/types/elements'

export default () => {
  const mainStore = useMainStore()
  const templatesStore = useTemplatesStore()
  const { currentTemplate } = storeToRefs(templatesStore)

  /**
   * Add specified element data (a group)
   * @param elements Element list data
   */
  const addElementsFromData = (elements: CanvasOption[]) => {
    const { groupIdMap, elIdMap } = createElementIdMap(elements)
    const currenttemplateElementIdList = currentTemplate.value.objects.map(el => el.id)
    
    for (const element of elements) {
      const inCurrenttemplate = currenttemplateElementIdList.includes(element.id)
      
      element.id = elIdMap[element.id]

      if (inCurrenttemplate && element.left && element.top) {
        element.left = element.left + 10
        element.top = element.top + 10
      }

      if (element.type === ElementNames.GROUP) element.id = groupIdMap[element.id]
    }
    templatesStore.addElement(elements)
  }

  /**
   * Add specified page data
   * @param template Page data
   */
  const addTemplatesFromData = (templates: Template[]) => {
    const templateIdMap = createTemplateIdMap(templates)
    const newtemplates = templates.map(template => {
      const { groupIdMap, elIdMap } = createElementIdMap(template.objects)

      for (const element of template.objects) {
        element.id = elIdMap[element.id]
      }
      
      return {
        ...template,
        id: templateIdMap[template.id],
      }
    })
    templatesStore.addTemplate(newtemplates)
  }

  return {
    addElementsFromData,
    addTemplatesFromData,
  }
}