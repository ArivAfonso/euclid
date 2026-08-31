<template>
  <div class="space-y-4">
    <!-- Format Info Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          PowerPoint Export
        </h3>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">.pptx</Badge>
      </div>
      <p class="text-[11px] text-muted-foreground leading-relaxed">
        Export each page as a native PowerPoint slide. Text, shapes, images, tables, and groups are converted to
        native PPT elements — preserving positioning, styling, fonts, and z-ordering.
      </p>
    </div>

    <!-- Export Range Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Export Range
        </h3>
        <Badge variant="secondary" class="text-[10px] px-1.5 py-0 select-none">
          {{ rangeType === 'all' ? 'All Pages' : rangeType === 'custom' ? `Pages ${range[0]}-${range[1]}` : 'Current Page' }}
        </Badge>
      </div>
      <RadioGroup v-model="rangeType" class="space-y-2">
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="current" id="range-current" />
          <Label for="range-current" class="flex-1 cursor-pointer text-sm font-medium">
            Current Page
            <span class="block text-[10px] text-muted-foreground font-normal">Export only the active page</span>
          </Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="all" id="range-all" />
          <Label for="range-all" class="flex-1 cursor-pointer text-sm font-medium">
            All Pages
            <span class="block text-[10px] text-muted-foreground font-normal">Export every page as slides</span>
          </Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="range-custom" />
          <Label for="range-custom" class="flex-1 cursor-pointer text-sm font-medium">
            Custom Range
            <span class="block text-[10px] text-muted-foreground font-normal">Select specific page range</span>
          </Label>
        </div>
      </RadioGroup>

      <!-- Custom Range Slider -->
      <Transition name="fade">
        <div v-if="rangeType === 'custom'" class="space-y-2 pt-2 border-t border-border/30">
          <div class="flex justify-between items-center">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Page Range</Label>
            <span class="text-xs font-mono bg-primary/10 px-2 py-1 rounded">
              {{ range[0] }} - {{ range[1] }}
            </span>
          </div>
          <Slider v-model="range" :min="1" :max="totalPages" :step="1" class="w-full" />
          <div class="flex justify-between text-[10px] text-muted-foreground">
            <span>Page 1</span>
            <span>Page {{ totalPages }}</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Capabilities Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Capabilities
        </h3>
      </div>

      <div class="text-[10px] space-y-2 text-muted-foreground">
        <div class="flex items-start gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold flex-shrink-0 mt-0.5">✓</span>
          <span>Text boxes with fonts, sizes, colors, bold, italic, and alignment</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold flex-shrink-0 mt-0.5">✓</span>
          <span>Shapes (rectangles, circles, lines, polygons) with fills, strokes, and gradients</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold flex-shrink-0 mt-0.5">✓</span>
          <span>Images, tables, and grouped elements as native PPT objects</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold flex-shrink-0 mt-0.5">✓</span>
          <span>Complex elements (QR codes, math formulas, curved text) rendered as crisp images</span>
        </div>
      </div>
    </div>

    <!-- Progress indicator -->
    <div v-if="exporting" class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium">Exporting...</span>
        <span class="text-xs text-muted-foreground">{{ progress }}%</span>
      </div>
      <div class="w-full bg-muted rounded-full h-2">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-300"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 pt-2">
      <Button class="flex-1 h-9" :disabled="exporting" @click="handleExport">
        {{ exporting ? 'Exporting...' : 'Export PowerPoint' }}
      </Button>
      <Button variant="outline" class="h-9 px-4" :disabled="exporting" @click="emit('close')">Close</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { saveAs } from 'file-saver'
import { useTemplatesStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { exportToPPTXBlob } from '@/utils/pptExport'

const emit = defineEmits<{(event: 'close'): void}>()

const templatesStore = useTemplatesStore()
const { templates, templateIndex } = storeToRefs(templatesStore)

const totalPages = computed(() => templates.value.length)
const rangeType = ref<'current' | 'all' | 'custom'>('all')
const range = ref([1, Math.min(totalPages.value, 10)])
const exporting = ref(false)
const progress = ref(0)

const handleExport = async () => {
  if (exporting.value) return
  exporting.value = true
  progress.value = 0

  try {
    // Sync the live canvas back to the template store BEFORE exporting,
    // so any unsaved edits on the canvas are included in the PPTX.
    templatesStore.syncCanvasToTemplate()

    // Determine which templates to export
    let templatesToExport = templates.value

    if (rangeType.value === 'current') {
      templatesToExport = [templates.value[templateIndex.value]]
    } else if (rangeType.value === 'custom') {
      const [start, end] = range.value
      templatesToExport = templates.value.slice(start - 1, end)
    }

    // Filter out empty
    templatesToExport = templatesToExport.filter(Boolean)

    // Generate PPTX
    const blob = await exportToPPTXBlob(templatesToExport, {
      rasterizeUncommonFonts: localStorage.getItem('pptRasterizeFonts') !== 'false',
      onProgress: (pct) => {
        progress.value = pct
      },
    })

    // Save file
    const timestamp = Date.now()
    saveAs(blob, `euclid-${timestamp}.pptx`)

    progress.value = 100
  } catch (err) {
    console.error('PPT export failed:', err)
    // Could show a toast notification here
  } finally {
    exporting.value = false
  }
}
</script>
