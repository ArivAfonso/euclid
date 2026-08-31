import { pasteCustomClipboardString } from '@/utils/clipboard'
import useHandleCreate from '@/hooks/useHandleCreate'
import useAddTemplateElement from '@/hooks/useAddTemplateElement'

interface PasteTextClipboardDataOptions {
  onlySlide?: boolean
  onlyElements?: boolean
}

export default () => {
  const { createTextElement } = useHandleCreate()
  const { addElementsFromData, addTemplatesFromData } = useAddTemplateElement()

  /**
   * Parse clipboard content and choose the appropriate paste method based on the result
   * @param text Clipboard content
   * @param options Configuration: onlySlide -- only handle slide paste; onlyElements -- only handle element paste;
   */
  const pasteTextClipboardData = (text: string, options?: PasteTextClipboardDataOptions) => {
    const onlySlide = options?.onlySlide || false
    const onlyElements = options?.onlyElements || false

    const clipboardData = pasteCustomClipboardString(text)

    // Elements or pages
    if (typeof clipboardData === 'object') {
      const { type, data } = clipboardData

      if (type === 'elements' && !onlySlide) addElementsFromData(data)
      else if (type === 'templates' && !onlyElements) addTemplatesFromData(data)
    }

    // Plain text
    else if (!onlyElements && !onlySlide) {
      createTextElement(36)
    }
  }

  return {
    pasteTextClipboardData,
  }
}