<template>
  <div class="w-full">
    <div 
      class="group flex items-center justify-between gap-2 h-9 px-2 py-1.5 rounded-md transition-all duration-150 cursor-pointer border border-transparent hover:bg-accent/50 hover:border-border"
      :class="{ 'bg-primary/10 border-primary/30 dark:bg-primary/20 dark:border-primary/40': handleElement && handleElement.id === element.id }"
      @click.stop="selectElement(element.id)"
      @mousemove.stop="mouseoverElement(element.id)"
      @mouseleave.stop="mouseleaveElement(element.id)"
      :style="{ paddingLeft: `${props.index * 12 + 8}px` }"
    >
      <!-- Left Side: Visibility + Expand/Icons + Type + Label -->
      <div class="flex items-center gap-1.5 flex-1 min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="flex items-center justify-center w-6 h-6 rounded hover:bg-accent transition-colors text-foreground/70 hover:text-foreground shrink-0"
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
        
        <div v-if="element.type.toLowerCase() === ElementNames.GROUP" class="shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <button 
                  class="flex items-center justify-center w-6 h-6 rounded hover:bg-accent transition-colors text-foreground/70 hover:text-foreground shrink-0"
                  @click.stop="showElement(element.id)"
                >
                  <IconDownOne v-if="(element as Group).isShow" class="w-3.5 h-3.5" />
                  <IconRightOne v-else class="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                {{ (element as Group).isShow ? 'Collapse group' : 'Expand group' }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div v-else-if="props.index" class="w-6 shrink-0"></div>
        
        <div class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground shrink-0 uppercase tracking-wide">
          {{ element.type }}
        </div>
        
        <TooltipProvider v-if="(element as FabricImage).mask">
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="flex items-center justify-center w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors shrink-0"
                @click.stop="maskElement(element.id)"
              >
                <i class="icon-font iconfont icon-mask text-[10px]"></i>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              Edit mask
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div v-if="(element as FabricImage).mask" class="h-6 w-6 border border-border rounded overflow-hidden shrink-0">
          <img :src="(element as FabricImage).mask?.src" alt="" class="w-full h-full object-cover rounded">
        </div>
        
        <div v-if="element.type === ElementNames.TEXTBOX || element.type === ElementNames.TEXT" class="text-xs truncate max-w-[80px] text-foreground/70 shrink-0">
          {{ (element as TextboxElement).text || 'Text' }}
        </div>
        
        <div class="flex-1 min-w-0 text-xs">
          <Input 
            v-if="element.id == handleElementId" 
            v-model="element.layer" 
            @blur="blurElement" 
            class="h-6 text-xs px-2 py-0"
          />
          <button 
            v-else 
            @dblclick.stop="dbclickElement(element.id)"
            class="w-full text-left truncate px-1 rounded hover:bg-accent transition-colors text-foreground font-medium"
          >
            {{ element.layer || element.id }}
          </button>
        </div>
      </div>
      
      <!-- Right Side: Lock Button -->
      <div 
        class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        :class="{ 'opacity-100': handleElement && handleElement.id === element.id }"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button 
                class="flex items-center justify-center w-6 h-6 rounded hover:bg-accent transition-colors text-foreground/70 hover:text-foreground shrink-0"
                @click.stop="lockElement(element.id, !element.lockMovementX || !element.lockMovementY)"
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
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import useHandleElement from "@/hooks/useHandleElement"
import { useMainStore, useTemplatesStore } from '@/store'
import { TextboxElement } from '@/types/canvas'
import { ElementNames } from '@/types/elements'
import { FabricImage, FabricObject, Group } from 'fabric'
import { storeToRefs } from 'pinia'
import { computed, PropType, ref } from 'vue'
import { Input } from '@/components/ui/input'
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
  maskElement,
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
const templatesStore = useTemplatesStore()
const { canvasObject, handleElementId } = storeToRefs(mainStore)
const { currentTemplate } = storeToRefs(templatesStore)
const handleElement = computed(() => canvasObject.value as FabricObject)

const inputRef = ref<HTMLInputElement | undefined>()

const dbclickElement = (eid: string) => {
  handleElementId.value = eid
}

const blurElement = () => {
  handleElementId.value = ''
}

</script>
