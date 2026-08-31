<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Compact Header -->
    <div class="flex-shrink-0 border-b border-border px-2.5 py-2">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          <button 
            class="px-2 py-1 text-[10px] font-medium rounded border border-border hover:bg-accent transition-colors"
          >
            File
          </button>
          <HomePopover />
          
          <Badge variant="secondary" class="text-[9px] px-1.5 py-0 ml-auto">
            {{ templateIndex + 1 }}/{{ templates.length }}
          </Badge>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                @click="createTemplate"
                size="sm"
                class="h-6 w-6 p-0"
                title="Add New Page"
              >
                <Plus class="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" class="text-xs">
              <p>New Page</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Compact Pages Grid -->
    <div class="flex-1 overflow-y-auto px-2 py-2">
      <Draggable
        :modelValue="templates"
        :animation="200"
        :scroll="true"
        :scrollSensitivity="50"
        :setData="null"
        @end="handleDragEnd"
        itemKey="id"
        class="grid grid-cols-2 gap-1.5"
      >
        <template #item="{ element, index }">
          <div
            :class="{
              'relative group cursor-pointer overflow-hidden transition-all duration-200': true,
              'ring-2 ring-primary ring-offset-1 ring-offset-background': templateIndex === index,
              'hover:ring-1 hover:ring-border': templateIndex !== index,
            }"
            @mousedown="($event: MouseEvent) => handleClickTemplateThumbnail($event, index)"
            v-contextmenu="contextmenusThumbnailItem"
            class="rounded-md border border-border/50 bg-muted/20"
          >
            <!-- Compact Page Number -->
            <div :class="{
              'absolute top-1 left-1 z-10 px-1 py-0.5 text-[9px] font-bold rounded border backdrop-blur-sm': true,
              'bg-primary text-primary-foreground border-primary shadow-sm': templateIndex === index,
              'bg-background/80 text-muted-foreground border-border': templateIndex !== index,
            }">
              {{ index + 1 }}
            </div>

            <!-- Selected Indicator -->
            <div 
              v-if="selectedTemplatesIndex.includes(index) && templateIndex !== index"
              class="absolute top-1 right-1 z-10 w-3 h-3 bg-primary rounded-full border border-background shadow-sm"
            />

            <!-- Thumbnail with aspect ratio -->
            <div class="aspect-[4/3] p-1.5">
              <ThumbnailTemplate 
                class="w-full h-full rounded overflow-hidden" 
                :template="element" 
                :size="100" 
                :visible="index < templatesLoadLimit" 
              />
            </div>

            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-md" />
          </div>
        </template>
      </Draggable>
    </div>

    <!-- Compact Footer Actions -->
    <div class="flex-shrink-0 border-t border-border/60 bg-gradient-to-t from-muted/40 to-transparent">
      <div class="flex items-stretch divide-x divide-border/40">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-150 active:scale-95"
                @click="selectAllTemplate"
              >
                <CheckSquare class="h-3 w-3" />
                All
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Select All (Ctrl+A)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-150 active:scale-95"
                @click="copyAndPasteTemplate"
              >
                <Copy class="h-3 w-3" />
                Duplicate
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Duplicate Page (Ctrl+D)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 active:scale-95"
                @click="() => deleteTemplate()"
                :disabled="templates.length <= 1"
                :class="templates.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''"
              >
                <Trash2 class="h-3 w-3" />
                Delete
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Delete Page (Delete)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-150 active:scale-95"
                @click="startPresentation"
              >
                <Maximize class="h-3 w-3" />
                Present
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Fullscreen Presentation (F5)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Presentation Mode Component -->
    <PresentationMode 
      v-model="isPresentationActive" 
      :start-index="templateIndex"
      @slide-change="handleSlideChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, Copy, Trash2, CheckSquare, Maximize } from 'lucide-vue-next'
import Draggable from 'vuedraggable'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import HomePopover from '@/components/HomePopover.vue'
import ThumbnailTemplate from '../../Thumb/components/Template.vue'
import PresentationMode from '@/components/PresentationMode.vue'

import { contextMenusThumbnails } from '@/configs/contextMenu'
import { useMainStore, useTemplatesStore, useKeyboardStore } from '@/store'
import { ContextMenu } from '@/components/Contextmenu/types'
import { fillDigit } from '@/utils/common/common'

import useLoadTemplates from '@/hooks/useLoadTemplates'
import useHandleTemplate from '@/hooks/useHandleTemplate'

const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const keyboardStore = useKeyboardStore()

const { templatesLoadLimit } = useLoadTemplates()
const { templates, templateIndex } = storeToRefs(templatesStore)
const { selectedTemplatesIndex: _selectedTemplatesIndex, thumbnailsFocus } = storeToRefs(mainStore)
const { ctrlKeyState, shiftKeyState } = storeToRefs(keyboardStore)
const { createTemplate, deleteTemplate, sortTemplates, cutTemplate, pasteTemplate, copyAndPasteTemplate, copyTemplate } = useHandleTemplate()

const selectedTemplatesIndex = computed(() => [..._selectedTemplatesIndex.value, templateIndex.value])
const isPresentationActive = ref(false)

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
      handler: () => startPresentation(),
    },
  ]
}

// Set the focus state of the thumbnail toolbar
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

  // Hold Ctrl key
  if (ctrlKeyState.value) {
    if (templateIndex.value === index) {
      if (!isMultiSelected) return
    }
    else {
      if (selectedTemplatesIndex.value.includes(index)) {
        const newSelectedSlidesIndex = selectedTemplatesIndex.value.filter(item => item !== index)
      }
      else {
        const newSelectedSlidesIndex = [...selectedTemplatesIndex.value, index]
      }
    }
  }
  // Hold Shift key
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

// Start presentation mode
const startPresentation = () => {
  templatesStore.syncCanvasToTemplate()
  isPresentationActive.value = true
}

// Handle slide change in presentation
const handleSlideChange = (index: number) => {
  // Update the current template index in the store
  templatesStore.setTemplateIndex(index)
}
</script>
