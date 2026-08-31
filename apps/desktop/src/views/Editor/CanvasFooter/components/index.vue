<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent class="sm:max-w-[600px] p-6 max-h-[90vh] overflow-y-auto">
      <div class="space-y-6">
        <!-- Header -->
        <div class="space-y-2">
          <h2 class="text-xl font-bold tracking-tight">Export Your Design</h2>
          <p class="text-sm text-muted-foreground">Choose an export format and configure your options below</p>
        </div>

        <!-- Format Selection Grid -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="selectedTab = tab.key"
            class="relative group"
          >
            <div 
              class="p-3 rounded-lg border-2 transition-all duration-200"
              :class="[
                selectedTab === tab.key
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 bg-muted/40 hover:border-border hover:bg-muted/60'
              ]"
            >
              <div class="text-sm font-semibold text-center">{{ tab.label.split(' ')[1] }}</div>
              <div class="text-xs text-muted-foreground text-center mt-1">{{ getFormatDescription(tab.key) }}</div>
              
              <!-- Active indicator -->
              <div 
                v-if="selectedTab === tab.key"
                class="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
              >
                <svg class="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <!-- Content -->
        <div class="border-t border-border/50 pt-6">
          <component :is="currentDialogComponent" @close="closeExport"></component>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ExportTypes } from '@/types/common'
import { Dialog, DialogContent } from '@/components/ui/dialog'

import ExportImage from './ExportImage.vue'
import ExportSVG from './ExportSVG.vue'
import ExportPDF from './ExportPDF.vue'
import ExportJSON from './ExportJSON.vue'
import ExportPPT from './ExportPPT.vue'

const mainStore = useMainStore()
const { exportType } = storeToRefs(mainStore)
const dialogVisible = ref(false)

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  (event: 'close'): void
}>()

watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

interface TabItem {
  key: ExportTypes
  label: string
}

const tabs: TabItem[] = [
  { key: 'image', label: 'Export Image' },
  { key: 'svg', label: 'Export SVG' },
  { key: 'pdf', label: 'Export PDF' },
  { key: 'pptx', label: 'Export PPT' },
  { key: 'json', label: 'Export JSON' },
]

const formatDescriptions: Record<string, string> = {
  image: 'PNG/JPEG',
  svg: 'Vectors',
  pdf: 'Documents',
  pptx: 'PowerPoint',
  json: 'Data',
  '': '',
}

const getFormatDescription = (key: ExportTypes) => formatDescriptions[key] || ''

const dialogMap = {
  'image': ExportImage,
  'svg': ExportSVG,
  'pdf': ExportPDF,
  'pptx': ExportPPT,
  'json': ExportJSON,
} as const

const selectedTab = computed<ExportTypes>({
  get: () => (exportType.value || 'image') as ExportTypes,
  set: (val) => {
    mainStore.setExportType(val)
  },
})

const currentDialogComponent = computed(() => {
  if (!selectedTab.value) return null
  const component = dialogMap[selectedTab.value as keyof typeof dialogMap]
  return component || null
})

const closeExport = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
/* Grid-based design - styling primarily handled by Tailwind classes */
</style>