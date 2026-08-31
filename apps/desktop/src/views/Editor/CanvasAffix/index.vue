<template>
  <div class="w-full">
    <div data-onboarding="canvas-affix"
      class="fixed bottom-[25px] z-50 transition-all duration-500 ease-linear"
      :style="affixPosition"
    >
      <div class="flex items-center space-x-0.5 p-1.5 bg-background border border-border rounded-md shadow-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="h-7 w-7 p-0"
                :class="{ 'bg-primary text-primary-foreground border-primary': showClip }"
                @click="toggleClipLine"
              >
                <Scissors class="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent class="text-xs px-2 py-1 leading-none whitespace-nowrap">
              <span>{{ showClip ? 'Hide Bloods Line' : 'Show Bloods Line' }}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="h-7 w-7 p-0"
                :class="{ 'bg-primary text-primary-foreground border-primary': isDrag }"
                @click="toggleDragMode"
              >
                <MousePointer2 class="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent class="text-xs px-2 py-1 leading-none whitespace-nowrap">
              <span>Dragging Canvas</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="h-7 w-7 p-0"
                :class="{ 'bg-primary text-primary-foreground border-primary': showSafe }"
                @click="toggleSafeLine"
              >
                <Shield class="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent class="text-xs px-2 py-1 leading-none whitespace-nowrap">
              <span>{{ showSafe ? 'Show Safe Line' : 'Hide Safe Line' }}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { CanvasElement } from '@/types/canvas'
import { WorkSpaceClipType, WorkSpaceSafeType } from '@/configs/canvas'
import { useFabricStore, useKeyboardStore, useMainStore } from '@/store'
import useCanvas from '@/views/Canvas/useCanvas'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'

// Lucide icons
import { 
  Scissors, 
  MousePointer2, 
  Shield 
} from 'lucide-vue-next'

const fabricStore = useFabricStore()
const mainStore = useMainStore()
const keyboardStore = useKeyboardStore()
const { showClip, showSafe } = storeToRefs(fabricStore)
const { poolShow } = storeToRefs(mainStore)

const showWorkLines = ref<string[]>([])
const isDrag = ref(false)

// Calculate dynamic position based on sidebar states
const affixPosition = computed(() => {
  const leftSidebarWidth = poolShow.value ? 350 : 50 // 50px label + 300px menu when open
  const rightSidebarWidth = 260
  const centerOffset = (leftSidebarWidth + rightSidebarWidth) / 2
  
  return {
    left: '50%',
    transform: `translateX(calc(-50% + ${(leftSidebarWidth - rightSidebarWidth) / 2}px))`
  }
})

// Update the ref values based on the store
// This ensures our local refs match the store state
if (showClip.value) showWorkLines.value.push('clip')
if (showSafe.value) showWorkLines.value.push('safe')

// Toggle functions
const toggleClipLine = () => {
  showClip.value = !showClip.value
  updateWorkLinesArray()
  updateCanvasLines()
}

const toggleSafeLine = () => {
  showSafe.value = !showSafe.value
  updateWorkLinesArray()
  updateCanvasLines()
}

const toggleDragMode = () => {
  isDrag.value = !isDrag.value
  keyboardStore.setSpaceKeyState(isDrag.value)
}

// Update the showWorkLines array based on the current state
const updateWorkLinesArray = () => {
  showWorkLines.value = []
  if (showClip.value) showWorkLines.value.push('clip')
  if (showSafe.value) showWorkLines.value.push('safe')
  if (isDrag.value) showWorkLines.value.push('drag')
}

// Update canvas lines visibility
const updateCanvasLines = () => {
  const [ canvas ] = useCanvas()
  const WorkSpaceClip = canvas.getObjects().filter(ele => (ele as CanvasElement).id === WorkSpaceClipType)
  const WorkSpaceSafe = canvas.getObjects().filter(ele => (ele as CanvasElement).id === WorkSpaceSafeType)
  
  if (!WorkSpaceClip && !WorkSpaceSafe) return
  
  WorkSpaceClip.forEach(item => item.set({visible: showClip.value}))
  WorkSpaceSafe.forEach(item => item.set({visible: showSafe.value}))
  canvas.renderAll()
}
</script>

<style scoped>
/* Additional styling if needed */
</style>