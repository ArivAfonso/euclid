<template>
  <div class="layer-item-wrapper">
    <div 
      class="layer-item group"
      :class="{ 'layer-item-active': handleElement && handleElement.id === element.id }"
      @click.stop="selectElement(element.id)"
      @mousemove.stop="mouseoverElement(element.id)"
      @mouseleave.stop="mouseleaveElement(element.id)"
      :style="{ paddingLeft: `${props.index * 12 + 8}px` }"
    >
      <!-- Left Side: Expand/Drag Icon + Type + Label -->
      <div class="layer-item-info">
        <div class="layer-icon-container">
          <TooltipProvider v-if="element.type.toLowerCase() === ElementNames.GROUP">
            <Tooltip>
              <TooltipTrigger as-child>
                <button 
                  class="layer-action-btn"
                  @click.stop="showElement(element.id)"
                >
                  <IconExpandDownOne v-if="(element as Group).isShow" class="w-3.5 h-3.5" />
                  <IconFoldUpOne v-else class="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                {{ (element as Group).isShow ? 'Collapse' : 'Expand' }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider v-else>
            <Tooltip>
              <TooltipTrigger as-child>
                <div class="layer-drag-handle">
                  <IconApplicationMenu class="w-3.5 h-3.5 opacity-60" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                Drag to reorder
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div class="layer-type-badge">
          {{ element.type }}
        </div>
        
        <div class="layer-label">
          <span v-if="element.type === ElementNames.TEXTBOX || element.type === ElementNames.TEXT" class="layer-text-preview">
            {{ (element as TextboxElement).text || 'Text' }}
          </span>
          <span v-else-if="element.layer" class="layer-name">
            {{ element.layer }}
          </span>
          <span v-else class="layer-name-fallback">
            {{ element.type }}
          </span>
        </div>
      </div>
      
      <!-- Right Side: Action Buttons -->
      <div class="layer-actions">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="layer-action-btn"
                @click.stop="visibleElement(element.id)"
              >
                <IconPreviewOpen v-if="element.visible" class="w-3.5 h-3.5" />
                <IconPreviewClose v-else class="w-3.5 h-3.5 opacity-50" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              {{ element.visible ? 'Hide layer' : 'Show layer' }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="layer-action-btn"
                @click.stop="lockElement(element.id, !(element.lockMovementX && element.lockMovementY))"
              >
                <IconLock v-if="element.lockMovementX && element.lockMovementY" class="w-3.5 h-3.5" />
                <IconUnlock v-else class="w-3.5 h-3.5 opacity-50" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              {{ element.lockMovementX && element.lockMovementY ? 'Unlock layer' : 'Lock layer' }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider v-if="element.type.toLowerCase() === ElementNames.TEXTBOX || element.type.toLowerCase() === ElementNames.ITEXT">
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="layer-action-btn"
                @click.stop="checkElement(element.id)"
              >
                <IconCheckOne v-if="(element as TextboxElement).editable" class="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                <IconRound v-else class="w-3.5 h-3.5 opacity-50" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              {{ (element as TextboxElement).editable ? 'Text is editable' : 'Text is locked' }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="layer-action-btn layer-delete-btn"
                @click.stop="deleteElement(element.id)"
              >
                <IconDelete class="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              Delete layer
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { CanvasElement, TextboxElement } from '@/types/canvas'
import { ElementNames } from '@/types/elements'

import { useMainStore } from '@/store'
import { storeToRefs } from 'pinia'
import useHandleElement from "@/hooks/useHandleElement"
import { Group, Object as FabricObject } from 'fabric'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const { 
  selectElement, 
  visibleElement, 
  lockElement, 
  deleteElement, 
  showElement, 
  mouseoverElement, 
  mouseleaveElement,
  checkElement,
} = useHandleElement()

const props = defineProps({
  element: {
    type: Object as PropType<FabricObject>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  }
})

const mainStore = useMainStore()
const { canvasObject } = storeToRefs(mainStore)

const handleElement = computed(() => canvasObject.value as FabricObject)
</script>

<style scoped>
.layer-item-wrapper {
  @apply w-full;
}

.layer-item {
  @apply flex items-center justify-between gap-2 h-9 px-2 py-1.5 
         rounded-md transition-all duration-150 cursor-pointer
         border border-transparent
         hover:bg-accent/50 hover:border-border;
}

.layer-item-active {
  @apply bg-primary/10 border-primary/30 
         dark:bg-primary/20 dark:border-primary/40;
}

.layer-item-info {
  @apply flex items-center gap-2 flex-1 min-w-0;
}

.layer-icon-container {
  @apply flex items-center justify-center shrink-0;
}

.layer-drag-handle {
  @apply flex items-center justify-center w-5 h-5 rounded 
         hover:bg-accent transition-colors cursor-grab active:cursor-grabbing;
}

.layer-action-btn {
  @apply flex items-center justify-center w-6 h-6 rounded 
         hover:bg-accent transition-colors
         text-foreground/70 hover:text-foreground;
}

.layer-delete-btn {
  @apply hover:bg-destructive/10 hover:text-destructive;
}

.layer-type-badge {
  @apply px-1.5 py-0.5 text-[10px] font-medium rounded 
         bg-muted text-muted-foreground
         shrink-0 uppercase tracking-wide;
}

.layer-label {
  @apply flex-1 min-w-0 text-xs font-medium truncate;
}

.layer-text-preview {
  @apply truncate text-foreground/80;
}

.layer-name {
  @apply truncate text-foreground;
}

.layer-name-fallback {
  @apply truncate text-muted-foreground italic;
}

.layer-actions {
  @apply flex items-center gap-0.5 shrink-0 
         opacity-0 group-hover:opacity-100 transition-opacity;
}

.layer-item-active .layer-actions {
  @apply opacity-100;
}
</style>