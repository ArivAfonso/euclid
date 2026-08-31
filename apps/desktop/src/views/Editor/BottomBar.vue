<template>
  <div data-onboarding="bottom-bar" class="h-[18px] flex items-center justify-between px-2.5 border-t border-border bg-background text-muted-foreground text-[11px] leading-none select-none">
    <div class="flex items-center gap-3 whitespace-nowrap">
      <span class="flex items-center gap-1">
        <span class="inline-block size-1.5 rounded-full bg-green-500"></span>
        {{ objectCount }} {{ objectCount === 1 ? 'object' : 'objects' }}
      </span>
      <span>X: {{ mouseX }}  Y: {{ mouseY }}</span>
      <span v-if="selectedObject">
        {{ selectedObject.type }}
        {{ Math.round(selectedObject.width * selectedObject.scaleX) }}×{{ Math.round(selectedObject.height * selectedObject.scaleY) }}
      </span>
    </div>
    <div class="flex items-center gap-3 whitespace-nowrap">
      <span>{{ unitLabel }}</span>
      <span>Zoom: {{ zoomPercent }}</span>
      <span>{{ canvasWidth }}×{{ canvasHeight }} {{ unitLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFabricStore, useMainStore, useTemplatesStore } from '@/store'
import { WorkSpaceDrawType } from '@/configs/canvas'
import { DesignUnitMode } from '@/configs/background'
import { px2inch, px2mm } from '@/utils/image'

const fabricStore = useFabricStore()
const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const { mouseX, mouseY, zoom } = storeToRefs(fabricStore)
const { canvasObject, unitMode } = storeToRefs(mainStore)
const { currentTemplate } = storeToRefs(templatesStore)

const selectedObject = computed(() => {
  const obj = canvasObject.value
  if (!obj) return null
  return { type: obj.type, width: obj.width || 0, height: obj.height || 0, scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1 }
})

const unitLabel = computed(() => DesignUnitMode.find(u => u.id === unitMode.value)?.name ?? 'px')

const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`)

const formatDim = (val: number) => {
  if (unitMode.value === 0) return px2mm(val).toFixed(1)
  if (unitMode.value === 2) return px2inch(val).toFixed(1)
  return Math.round(val)
}

const canvasWidth = computed(() => {
  const t = currentTemplate.value
  return t ? formatDim(t.width) : '—'
})

const canvasHeight = computed(() => {
  const t = currentTemplate.value
  return t ? formatDim(t.height) : '—'
})

const objectCount = computed(() => {
  const t = currentTemplate.value
  if (!t || !Array.isArray(t.objects)) return 0
  return t.objects.filter((obj: any) => obj.id !== WorkSpaceDrawType).length
})
</script>
