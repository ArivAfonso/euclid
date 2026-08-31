import tinycolor from 'tinycolor2'
import { nanoid } from 'nanoid'
import { Template, CanvasElement } from '@/types/canvas'
import { ElementNames } from '@/types/elements'
// import { PPTElement, PPTLineElement, Slide } from '@/types/slides'

interface RotatedElementData {
  left: number
  top: number
  width: number
  height: number
  rotate: number
}

export interface AlignLine {
  value: number
  range: [number, number]
}

/**
 * Generate new IDs for each page based on page list, and create a dictionary mapping old IDs to new ones
 * Mainly used when copying page elements to maintain the original relationship of page IDs
 * @param slides Page list
 */

export const createTemplateIdMap = (templates: Template[]) => {
  const templateIdMap = {}
  for (const template of templates) {
    templateIdMap[template.id] = nanoid(10)
  }
  return templateIdMap
}

/**
   * Generate new IDs for each element based on element list, and create a dictionary mapping old IDs to new ones
   * Mainly used when copying elements to maintain the original relationship of element IDs
   * For example: two grouped elements originally share the same groupId, after copying they will still share another identical groupId
   * @param elements Element list data
   */
export const createElementIdMap = (elements: CanvasOption[]) => {
  const groupIdMap = {}
  const elIdMap = {}
  for (const element of elements) {
    const groupId = element.type === ElementNames.GROUP ? element.id : ''
    if (groupId && !groupIdMap[groupId]) {
      groupIdMap[groupId] = nanoid(10)
    }
    elIdMap[element.id] = nanoid(10)
  }
  return {
    groupIdMap,
    elIdMap,
  }
}

// /**
//  * Get line element path string
//  * @param element Line element
//  */
// export const getLineElementPath = (element: PPTLineElement) => {
//   const start = element.start.join(',')
//   const end = element.end.join(',')
//   if (element.broken) {
//     const mid = element.broken.join(',')
//     return `M${start} L${mid} L${end}`
//   }
//   else if (element.curve) {
//     const mid = element.curve.join(',')
//     return `M${start} Q${mid} ${end}`
//   }
//   else if (element.cubic) {
//     const [c1, c2] = element.cubic
//     const p1 = c1.join(',')
//     const p2 = c2.join(',')
//     return `M${start} C${p1} ${p2} ${end}`
//   }
//   return `M${start} L${end}`
// }