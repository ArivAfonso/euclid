import { ContextMenu } from '@/components/Contextmenu/types'
import { ElementNames, AlignCommand, LayerCommand } from '@/types/elements'
import { storeToRefs } from 'pinia'
import { useMainStore, useTemplatesStore } from '@/store'
import useHandleElement from '@/hooks/useHandleElement'
import useHandleTool from '@/hooks/useHandleTool'
export const contextMenuThumbnails = (): ContextMenu[] => {
  const { pasteElement } = useHandleElement()
  return [
    {
      text: 'Paste',
      subText: 'Ctrl+V',
      icon: 'ClipboardPaste',
      handler: pasteElement,
    },
    {
      text: 'Select All',
      subText: 'Ctrl+A',
      icon: 'MousePointer2',
      // handler: selectAllSlide,
    },
    {
      text: 'New Page',
      subText: 'Enter',
      icon: 'FilePlus',
      // handler: createSlide,
    },
    {
      text: 'Preview Slides',
      subText: 'F5',
      icon: 'Play',
      // handler: enterScreeningFromStart,
    },
  ]
}

export const contextMenus = (): ContextMenu[] => {
  const { lockElement, deleteElement, cutElement, copyElement, pasteElement, duplicateElement, downloadElement, downloadElementAsFormat, uncombineElements, combineElements, resetElements, setElementGlobally, unsetElementGlobally } = useHandleElement()
  const { alignElement, layerElement } = useHandleTool()
  const templatesStore = useTemplatesStore()
  const { canvasObject } = storeToRefs(useMainStore())
  const element = canvasObject.value
  if (!element) {
    return [
      {
        text: 'Paste',
        subText: 'Ctrl+V',
        icon: 'ClipboardPaste',
        handler: pasteElement,
      },
      {
        text: 'Select All',
        subText: 'Ctrl+A',
        icon: 'MousePointer2',
      },
      {
        text: 'Toggle Rulers',
        icon: 'Ruler',
      },
      {
        text: 'Toggle Grid',
        icon: 'Grid3x3',
      },
      {
        text: 'Reset',
        icon: 'RotateCcw',
        handler: resetElements,
      },
    ]
  }
  if (element.lockMovementX && element.lockMovementY) {
    return [{
      text: 'Unlock',
      icon: 'Unlock',
      handler: () => lockElement(element.id, false),
    }]
  }

  const baseMenuItems: ContextMenu[] = [
    {
      text: 'Cut',
      subText: 'Ctrl+X',
      icon: 'Scissors',
      handler: cutElement,
    },
    {
      text: 'Copy',
      subText: 'Ctrl+C',
      icon: 'Copy',
      handler: copyElement,
    },
    {
      text: 'Paste',
      subText: 'Ctrl+V',
      icon: 'ClipboardPaste',
      handler: pasteElement,
    },
    {
      text: 'Duplicate',
      subText: 'Ctrl+D',
      icon: 'CopyPlus',
      handler: duplicateElement,
    },
    { divider: true },
  ]

  if (element.type === ElementNames.IMAGE) {
    baseMenuItems.push({
      text: 'Download',
      icon: 'Download',
      children: [
        { text: 'PNG', icon: 'FileImage', handler: () => downloadElementAsFormat('png') },
        { text: 'JPEG', icon: 'FileImage', handler: () => downloadElementAsFormat('jpeg') },
        { text: 'SVG', icon: 'FileImage', handler: () => downloadElementAsFormat('svg') },
      ],
    })
    baseMenuItems.push({ divider: true })
  } else {
    baseMenuItems.push({
      text: 'Download',
      icon: 'Download',
      children: [
        { text: 'PNG', icon: 'FileImage', handler: () => downloadElementAsFormat('png') },
        { text: 'JPEG', icon: 'FileImage', handler: () => downloadElementAsFormat('jpeg') },
        { text: 'SVG', icon: 'FileImage', handler: () => downloadElementAsFormat('svg') },
      ],
    })
    baseMenuItems.push({ divider: true })
  }

  return [
    ...baseMenuItems,
    {
      text: 'Align',
      icon: 'AlignCenterHorizontal',
      children: [
        { text: 'Left', icon: 'AlignStartHorizontal', handler: () => alignElement(AlignCommand.LEFT) },
        { text: 'Center Horizontally', icon: 'AlignCenterHorizontal', handler: () => alignElement(AlignCommand.HORIZONTAL) },
        { text: 'Right', icon: 'AlignEndHorizontal', handler: () => alignElement(AlignCommand.RIGHT) },
        { text: 'Top', icon: 'AlignStartVertical', handler: () => alignElement(AlignCommand.TOP) },
        { text: 'Center Vertically', icon: 'AlignCenterVertical', handler: () => alignElement(AlignCommand.VERTICAL) },
        { text: 'Bottom', icon: 'AlignEndVertical', handler: () => alignElement(AlignCommand.BOTTOM) },
      ],
    },
    {
      text: 'Layer Order',
      icon: 'Layers',
      children: [
        { text: 'Bring to Front', icon: 'BringToFront', handler: () => layerElement(LayerCommand.TOP) },
        { text: 'Bring Forward', icon: 'MoveUp', handler: () => layerElement(LayerCommand.UP) },
        { text: 'Send Backward', icon: 'MoveDown', handler: () => layerElement(LayerCommand.DOWN) },
        { text: 'Send to Back', icon: 'SendToBack', handler: () => layerElement(LayerCommand.BOTTOM) },
      ],
    },
    { divider: true },
    {
      text: element.type === ElementNames.GROUP ? 'Ungroup' : 'Group',
      subText: 'Ctrl+G',
      icon: element.type === ElementNames.GROUP ? 'Ungroup' : 'Group',
      handler: element.type === ElementNames.GROUP ? uncombineElements : combineElements,
    },
    {
      text: 'Select All',
      subText: 'Ctrl+A',
      icon: 'MousePointer2',
    },
    {
      text: 'Lock',
      subText: 'Ctrl+L',
      icon: 'Lock',
      handler: () => lockElement(element.id, true),
    },
    {
      text: templatesStore.isGlobalObject(element.id) ? 'Unset Globally' : 'Set Globally',
      icon: templatesStore.isGlobalObject(element.id) ? 'GlobeLock' : 'Globe',
      handler: templatesStore.isGlobalObject(element.id) ? unsetElementGlobally : setElementGlobally,
    },
    {
      text: 'Delete',
      subText: 'Delete',
      icon: 'Trash2',
      handler: () => deleteElement(element.id),
    },
  ]
}

export const contextMenusThumbnails = (): ContextMenu[] => {
  return [
    {
      text: 'Cut',
      subText: 'Ctrl+X',
      icon: 'Scissors',
      // handler: cutSlide,
    },
    {
      text: 'Copy',
      subText: 'Ctrl+C',
      icon: 'Copy',
      // handler: copySlide,
    },
    {
      text: 'Paste',
      subText: 'Ctrl+V',
      icon: 'ClipboardPaste',
      // handler: pasteSlide,
    },
    {
      text: 'Select All',
      subText: 'Ctrl+A',
      icon: 'MousePointer2',
      // handler: selectAllSlide,
    },
    { divider: true },
    {
      text: 'New Page',
      subText: 'Enter',
      icon: 'FilePlus',
      // handler: createSlide,
    },
    {
      text: 'Duplicate Page',
      subText: 'Ctrl+D',
      icon: 'Copy',
      // handler: copyAndPasteSlide,
    },
    {
      text: 'Delete Page',
      subText: 'Delete',
      icon: 'Trash2',
      // handler: () => deleteSlide(),
    },
    { divider: true },
    {
      text: 'Preview from Current',
      subText: 'Shift + F5',
      icon: 'Play',
      // handler: enterScreening,
    },
  ]
}