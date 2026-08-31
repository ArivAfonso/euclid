<template>
  <div
    @mousedown="() => setThumbnailsFocus(true)"
    v-click-outside="() => setThumbnailsFocus(false)"
    v-contextmenu="contextMenusThumbnails"  
  >
    <div class="thumb-handle">
      <div class="w-full flex items-center justify-between px-2 gap-2">
        <div class="flex items-center gap-1.5">
          <button 
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent border border-border"
          >
            File
          </button>
          <HomePopover />
        </div>
        
        <button
          @click="createTemplate"
          class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          title="Add New Page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New</span>
        </button>
      </div>
    </div>
    <Draggable
      class="thumb-content"
      :modelValue="templates"
      :animation="300"
      :scroll="true"
      :scrollSensitivity="50"
      :setData="null"
      @end="handleDragEnd"
      itemKey="id"
    >
      <template #item="{ element, index }">
        <div
          :class="{
            'thumbnail-item': true,
            'active': templateIndex === index,
            'selected': selectedTemplatesIndex.includes(index),
          }"
          @mousedown="($event: MouseEvent) => handleClickTemplateThumbnail($event, index)"
          v-contextmenu="contextmenusThumbnailItem"
        >
          <div class="label" :class="{ 'offset-left': index >= 99 }">{{ fillDigit(index + 1, 2) }}</div>
          <ThumbnailTemplate class="thumbnail" :template="element" :size="120" :visible="index < templatesLoadLimit" />
        </div>
      </template>
    </Draggable>

    <div class="thumb-number">Pages{{ templateIndex + 1 }} / {{ templates.length }}</div>
  </div>
</template>

<script lang="ts" setup>
import useLoadTemplates from '@/hooks/useLoadTemplates'
import useHandleTemplate from '@/hooks/useHandleTemplate'
import ThumbnailTemplate from './components/Template.vue'
import Draggable from 'vuedraggable'

import { contextMenusThumbnails } from '@/configs/contextMenu'
import { useMainStore, useTemplatesStore, useKeyboardStore } from '@/store'
import { ContextMenu } from '@/components/Contextmenu/types'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { fillDigit } from '@/utils/common/common'

const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const keyboardStore = useKeyboardStore()

const { templatesLoadLimit } = useLoadTemplates()
const { templates, templateIndex } = storeToRefs(templatesStore)
const { selectedTemplatesIndex: _selectedTemplatesIndex, thumbnailsFocus } = storeToRefs(mainStore)
const { ctrlKeyState, shiftKeyState } = storeToRefs(keyboardStore)
const { createTemplate, deleteTemplate, sortTemplates, cutTemplate, pasteTemplate, copyAndPasteTemplate, copyTemplate } = useHandleTemplate()

const selectedTemplatesIndex = computed(() => [..._selectedTemplatesIndex.value, templateIndex.value])

// Select all templates
const selectAllTemplate = () => {
  const newSelectedTemplatesIndex = Array.from(Array(templates.value.length), (item, index) => index)
  mainStore.updateSelectedTemplatesIndex(newSelectedTemplatesIndex)
}
const contextmenusThumbnailItem = (): ContextMenu[] => {
  return [
    {
      text: 'Cut',
      subText: 'Ctrl + X',
      icon: 'Scissors',
      handler: cutTemplate,
    },
    {
      text: 'Copy',
      subText: 'Ctrl + C',
      icon: 'Copy',
      handler: copyTemplate,
    },
    {
      text: 'Paste',
      subText: 'Ctrl + V',
      icon: 'ClipboardPaste',
      handler: pasteTemplate,
    },
    {
      text: 'Select All',
      subText: 'Ctrl + A',
      icon: 'MousePointer2',
      handler: selectAllTemplate,
    },
    { divider: true },
    {
      text: 'New Page',
      subText: 'Enter',
      icon: 'FilePlus',
      handler: createTemplate,
    },
    {
      text: 'Duplicate Page',
      subText: 'Ctrl + D',
      icon: 'Copy',
      handler: copyAndPasteTemplate,
    },
    {
      text: 'Delete Page',
      subText: 'Delete',
      icon: 'Trash2',
      handler: () => deleteTemplate(),
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

// Set the focus state of the thumbnail toolbar so shortcuts are only active when focused
const setThumbnailsFocus = (focus: boolean) => {
  if (thumbnailsFocus.value === focus) return
  mainStore.setThumbnailsFocus(focus)

  if (!focus) mainStore.updateSelectedTemplatesIndex([])
}

// Sync data after drag-and-drop reordering
const handleDragEnd = (eventData: { newIndex: number; oldIndex: number }) => {
  const { newIndex, oldIndex } = eventData
  sortTemplates(newIndex, oldIndex)
}


// Click thumbnail
const handleClickTemplateThumbnail = (e: MouseEvent, index: number) => {
  const isMultiSelected = selectedTemplatesIndex.value.length > 1

  if (isMultiSelected && selectedTemplatesIndex.value.includes(index) && e.button !== 0) return

  // Hold Ctrl key, click to select page, click again to deselect the selected page
  if (ctrlKeyState.value) {
    if (templateIndex.value === index) {
      if (!isMultiSelected) return

      // const newSelectedSlidesIndex = selectedSlidesIndex.value.filter(item => item !== index)
      // mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      // changeSlideIndex(selectedSlidesIndex.value[0])
    }
    else {
      if (selectedTemplatesIndex.value.includes(index)) {
        const newSelectedSlidesIndex = selectedTemplatesIndex.value.filter(item => item !== index)
        // mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
      }
      else {
        const newSelectedSlidesIndex = [...selectedTemplatesIndex.value, index]
        // mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
        // changeSlideIndex(index)
      }
    }
  }
  // Hold Shift key, select all pages within range
  else if (shiftKeyState.value) {
    if (templateIndex.value === index && !isMultiSelected) return

    let minIndex = Math.min(...selectedTemplatesIndex.value)
    let maxIndex = index

    if (index < minIndex) {
      maxIndex = Math.max(...selectedTemplatesIndex.value)
      minIndex = index
    }

    const newSelectedSlidesIndex = []
    for (let i = minIndex; i <= maxIndex; i++) newSelectedSlidesIndex.push(i)
    // mainStore.updateSelectedSlidesIndex(newSelectedSlidesIndex)
    // changeSlideIndex(index)
  }
  // Normal page switch
  else {
    mainStore.updateSelectedTemplatesIndex([])
    changeSlideIndex(index)
  }
}

// Switch page
const changeSlideIndex = (index: number) => {
  if (templateIndex.value === index) return
  templatesStore.setTemplateIndex(index)
  templatesStore.renderTemplate()
}

</script>

<style lang="scss" scoped>
.thumb-handle {
  height: $headerHeight;
  font-size: 12px;
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid $borderColor;
  background: hsl(var(--background));

  .btn {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      background-color: $lightGray;
    }
  }
  .select-btn {
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-left: 1px solid $borderColor;

    &:hover {
      background-color: $lightGray;
    }
  }

  .icon {
    margin-right: 3px;
    font-size: 14px;
  }
}
.thumb-content {
  padding: 5px 0;
  flex: 1;
  overflow: auto;
  border-left: 1px solid $borderColor;
}
.thumbnail-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px 0;
  transition: all 0.2s ease;

  .thumbnail {
    outline: 1px solid rgba($color: $themeColor, $alpha: .15);
    transition: all 0.2s ease;
  }

  &.active {
    .label {
      color: $themeColor;
      font-weight: 600;
    }
    .thumbnail {
      outline-color: $themeColor;
      outline-width: 2px;
    }
  }
  &.selected {
    .thumbnail {
      outline-color: $themeColor;
      outline-width: 2px;
    }
  }
}
.label {
  font-size: 12px;
  color: #999;
  width: 20px;
  cursor: grab;
  user-select: none;

  &.offset-left {
    position: relative;
    left: -4px;
  }

  &:active {
    cursor: grabbing;
  }
}
.thumb-number {
  height: 40px;
  font-size: 12px;
  border-top: 1px solid $borderColor;
  line-height: 40px;
  text-align: center;
  color: #666;
  background: hsl(var(--background));
}
</style>