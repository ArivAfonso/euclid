<template>
  <div class="flex h-full flex-col  bg-white dark:bg-[hsl(0,0%,9%)]" @click.stop="cancelElement">
    <div class="border-b border-border px-3 py-2.5">
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="keywords"
          placeholder="Search layers"
          class="h-8 pl-9 text-xs"
        />
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-2 py-2.5">
      <LayerDraggableSelf :elements="layerObjects" :index="0" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, unref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

import { Input } from '@/components/ui/input'
import { useTemplatesStore } from '@/store'
import { ElementNames } from '@/types/elements'
import { WorkSpaceThumbType } from '@/configs/canvas'
import LayerDraggableSelf from './LayerComponents/LayerDraggableSelf.vue'
import useHandleElement from '@/hooks/useHandleElement'
import useCanvas from '@/views/Canvas/useCanvas'
import { FabricObject } from 'fabric'

const keywords = ref('')

const templatesStore = useTemplatesStore()
const { currentTemplate } = storeToRefs(templatesStore)
const { cancelElement } = useHandleElement()
const [ canvas ] = useCanvas()

// Track canvas object changes to force reactivity
const canvasVersion = ref(0)

// Listen to canvas events to trigger updates
if (canvas) {
  const updateLayers = () => {
    canvasVersion.value++
  }
  
  canvas.on('object:added', updateLayers)
  canvas.on('object:removed', updateLayers)
  canvas.on('object:modified', updateLayers)
}

const layerObjects = computed(() => {
  // Access canvasVersion to trigger reactivity
  canvasVersion.value
  
  if (!canvas) return []
  
  // Get objects directly from canvas
  const canvasObjects = canvas.getObjects() as FabricObject[]
  
  const normalized = unref(keywords).trim().toLowerCase()
  return canvasObjects.filter((item) => {
    const shouldShow = !WorkSpaceThumbType.includes(item.id)
      && item.type.toLowerCase() !== ElementNames.REFERENCELINE
    if (!shouldShow)
      return false
    if (!normalized)
      return true
    return item.type.toLowerCase().includes(normalized) || 
           (item.layer && item.layer.toLowerCase().includes(normalized))
  })
})
</script>
