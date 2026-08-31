<template>
  <div class="flex max-h-[70vh] w-[320px] flex-col overflow-hidden rounded-md border border-border/60 bg-background">
    <div class="border-b border-border/50 px-2.5 py-2">
      <div class="flex items-center justify-between gap-2">
        <Select v-model="selectedTabString">
          <SelectTrigger class="h-6 w-24 text-[10px] border border-input">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent class="min-w-[80px]">
            <SelectItem v-for="tab in tabs" :key="tab.key" :value="tab.key" class="text-[10px] h-6">
              {{ tab.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" class="h-6 px-2 text-[10px]" @click="emit('close')">Close</Button>
      </div>
    </div>

    <div class="overflow-y-auto px-2.5 py-2">
      <div v-if="selectedTab === 'image'" class="space-y-2">
        <div class="grid grid-cols-2 gap-1">
          <Button size="sm" :variant="format === 'jpeg' ? 'default' : 'outline'" class="h-6 text-[10px]" @click="format = 'jpeg'">JPG</Button>
          <Button size="sm" :variant="format === 'png' ? 'default' : 'outline'" class="h-6 text-[10px]" @click="format = 'png'">PNG</Button>
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Quality</span>
            <span class="font-mono">{{ qualityPercent }}%</span>
          </div>
          <div class="w-32">
            <Slider v-model="quality" :min="0" :max="1" :step="0.1" class="py-0.5" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[10px] uppercase tracking-wide">DPI</Label>
            <Select v-model="dpiTypeString">
              <SelectTrigger class="h-7 text-xs border border-input">
                <SelectValue placeholder="DPI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="72">72 (Screen)</SelectItem>
                <SelectItem value="150">150 (Web)</SelectItem>
                <SelectItem value="300">300 (Print)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-end justify-between rounded-md border border-border/50 bg-muted/20 px-2 py-1.5">
            <div class="text-[10px] uppercase tracking-wide text-muted-foreground">Ignore Bleed</div>
            <Switch v-model:checked="ignoreClip" />
          </div>
        </div>
        <Button class="h-7 w-full text-xs" :disabled="Exporting" @click="downloadImage">Export Image</Button>
      </div>

      <div v-else-if="selectedTab === 'pdf'" class="space-y-2">
        <div class="grid grid-cols-2 gap-1">
          <Button size="sm" :variant="pdfRangeType === 'current' ? 'default' : 'outline'" class="h-6 text-[10px]" @click="pdfRangeType = 'current'">Current</Button>
          <Button size="sm" :variant="pdfRangeType === 'all' ? 'default' : 'outline'" class="h-6 text-[10px]" @click="pdfRangeType = 'all'">All Pages</Button>
        </div>
        <Button class="h-7 w-full text-xs" :disabled="Exporting" @click="downloadPDF">Export PDF</Button>
      </div>

      <div v-else-if="selectedTab === 'svg'" class="space-y-2">
        <div class="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
          Vector export with editable paths.
        </div>
        <Button class="h-7 w-full text-xs" :disabled="Exporting" @click="downloadSVG">Export SVG</Button>
      </div>

      <div v-else-if="selectedTab === 'pptx'" class="space-y-2">
        <div class="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
          Export each page as a native PowerPoint slide with text, shapes, images, and tables.
        </div>
        <div class="grid grid-cols-2 gap-1">
          <Button size="sm" :variant="pptRangeType === 'current' ? 'default' : 'outline'" class="h-6 text-[10px]" @click="pptRangeType = 'current'">Current</Button>
          <Button size="sm" :variant="pptRangeType === 'all' ? 'default' : 'outline'" class="h-6 text-[10px]" @click="pptRangeType = 'all'">All Pages</Button>
        </div>
        <div v-if="pptExporting" class="space-y-1">
          <div class="flex justify-between text-[10px]">
            <span>Exporting...</span>
            <span>{{ pptProgress }}%</span>
          </div>
          <div class="w-full bg-muted rounded-full h-1.5">
            <div class="bg-primary h-1.5 rounded-full transition-all" :style="{ width: pptProgress + '%' }"></div>
          </div>
        </div>
        <Button class="h-7 w-full text-xs" :disabled="pptExporting" @click="downloadPPTX">Export PPTX</Button>
      </div>

      <div v-else class="space-y-2">
        <div class="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5 text-[10px] text-muted-foreground">
          Save full document data for backup and transfer.
        </div>
        <Button class="h-7 w-full text-xs" :disabled="Exporting" @click="downloadJSON">Export JSON</Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useTemplatesStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ExportTypes } from '@/types/common'
import type { ImageFormat } from 'fabric'
import useCanvasExport from '@/hooks/useCanvasExport'
import { exportToPPTXBlob } from '@/utils/pptExport'
import { saveAs } from 'file-saver'
const emit = defineEmits<{
  (event: 'close'): void
}>()

const mainStore = useMainStore()
const { exportType } = storeToRefs(mainStore)
const { Exporting, exportImage, exportPDF, exportJSON, exportSVG } = useCanvasExport()

const tabs: Array<{ key: ExportTypes; label: string }> = [
  { key: 'image', label: 'Image' },
  { key: 'svg', label: 'SVG' },
  { key: 'pdf', label: 'PDF' },
  { key: 'pptx', label: 'PPT' },

  { key: 'json', label: 'JSON' },
]

const selectedTab = computed<ExportTypes>({
  get: () => (exportType.value || 'image') as ExportTypes,
  set: (val) => mainStore.setExportType(val),
})

const selectedTabString = computed<string>({
  get: () => selectedTab.value,
  set: (val) => {
    selectedTab.value = val as ExportTypes
  },
})

const format = ref<ImageFormat>('jpeg')
const quality = ref<number[]>([1])
const ignoreClip = ref(true)
const dpiTypeString = ref('300')
const pdfRangeType = ref<'current' | 'all'>('current')
const pptRangeType = ref<'current' | 'all'>('all')
const pptExporting = ref(false)
const pptProgress = ref(0)

const qualityPercent = computed(() => Math.round((quality.value[0] ?? 1) * 100))

const downloadImage = () => {
  exportImage(format.value, quality.value[0] ?? 1, Number(dpiTypeString.value), ignoreClip.value)
}

const downloadPDF = () => {
  exportPDF(pdfRangeType.value)
}

const downloadJSON = () => {
  exportJSON()
}

const downloadSVG = () => {
  exportSVG()
}

const templatesStore = useTemplatesStore()
const { templates, templateIndex } = storeToRefs(templatesStore)

const downloadPPTX = async () => {
  if (pptExporting.value) return
  pptExporting.value = true
  pptProgress.value = 0

  try {
    // Sync the live canvas back to the template store BEFORE exporting,
    // so any unsaved edits on the canvas are included in the PPTX.
    templatesStore.syncCanvasToTemplate()

    let templatesToExport = templates.value
    if (pptRangeType.value === 'current') {
      templatesToExport = [templates.value[templateIndex.value]].filter(Boolean)
    }

    const blob = await exportToPPTXBlob(templatesToExport, {
      rasterizeUncommonFonts: localStorage.getItem('pptRasterizeFonts') !== 'false',
      onProgress: (pct) => { pptProgress.value = pct },
    })

    saveAs(blob, `euclid-${Date.now()}.pptx`)
    pptProgress.value = 100
  } catch (err) {
    console.error('PPTX export failed:', err)
  } finally {
    pptExporting.value = false
  }
}
</script>