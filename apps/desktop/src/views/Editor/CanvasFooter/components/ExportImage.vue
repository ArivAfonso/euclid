<template>
  <div class="space-y-4">
    <!-- Format Selection Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Image Format
        </h3>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">Required</Badge>
      </div>
      <RadioGroup v-model="format" class="grid grid-cols-2 gap-2">
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="jpeg" id="jpeg-format" />
          <Label for="jpeg-format" class="flex-1 cursor-pointer text-sm font-medium">
            JPEG
            <span class="block text-[10px] text-muted-foreground font-normal">Compressed, smaller files</span>
          </Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="png" id="png-format" />
          <Label for="png-format" class="flex-1 cursor-pointer text-sm font-medium">
            PNG
            <span class="block text-[10px] text-muted-foreground font-normal">Lossless, transparency</span>
          </Label>
        </div>
      </RadioGroup>
    </div>

    <!-- Export Range Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Export Range
        </h3>
        <Badge variant="secondary" class="text-[10px] px-1.5 py-0 select-none">{{ rangeType === 'custom' ? `Pages ${range[0]}-${range[1]}` : 'Current' }}</Badge>
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
            <span class="block text-[10px] text-muted-foreground font-normal">Export every page as separate files</span>
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
          <Slider v-model="range" :min="1" :max="templates.length" :step="1" class="w-full" />
          <div class="flex justify-between text-[10px] text-muted-foreground">
            <span>Page 1</span>
            <span>Page {{ templates.length }}</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Quality & Resolution Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Quality & Resolution
        </h3>
      </div>

      <div class="space-y-3">
        <!-- Quality Slider -->
        <div class="space-y-1">
          <div class="flex justify-between items-center">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Quality</Label>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">{{ (qualityArray[0] / 10).toFixed(1) }}</Badge>
          </div>
          <Slider v-model="qualityArray" :min="0" :max="10" :step="1" class="w-full" />
          <div class="flex justify-between text-[10px] text-muted-foreground">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <!-- DPI Selection -->
        <div class="space-y-2">
          <Label class="text-[10px] font-bold uppercase tracking-wide">Resolution (DPI)</Label>
          <RadioGroup v-model.number="dpiType" class="grid grid-cols-3 gap-2">
            <div class="flex items-center space-x-2">
              <RadioGroupItem :value="72" id="dpi72" />
              <Label for="dpi72" class="flex-1 cursor-pointer text-xs text-center font-medium">
                72 DPI
                <span class="block text-[9px] text-muted-foreground font-normal">Screen</span>
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem :value="150" id="dpi150" />
              <Label for="dpi150" class="flex-1 cursor-pointer text-xs text-center font-medium">
                150 DPI
                <span class="block text-[9px] text-muted-foreground font-normal">Web</span>
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem :value="300" id="dpi300" />
              <Label for="dpi300" class="flex-1 cursor-pointer text-xs text-center font-medium">
                300 DPI
                <span class="block text-[9px] text-muted-foreground font-normal">Print</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>

    <!-- Advanced Options Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Advanced Options
        </h3>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between p-2 rounded border border-border/30 bg-background/50 hover:bg-background/80 transition-colors">
          <div class="flex flex-col gap-0.5">
            <Label class="text-xs font-semibold cursor-pointer">Ignore Bleeds</Label>
            <span class="text-[10px] text-muted-foreground">Remove edge marks and bleed areas</span>
          </div>
          <Switch v-model:checked="ignoreClip" />
        </div>
      </div>
    </div>

    <!-- Export Info & Action -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="text-[10px] space-y-1 text-muted-foreground">
        <div class="flex items-center gap-1.5">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold">ℹ</span>
          <span>Files will be saved with timestamp and format extension</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 pt-2">
      <Button 
        class="flex-1 h-9" 
        @click="downloaImage()" 
        :disabled="Exporting"
      >
        <span v-if="Exporting" class="flex items-center gap-2">
          <span class="animate-spin">⏳</span>
          Exporting...
        </span>
        <span v-else>Export Images</span>
      </Button>
      <Button variant="outline" class="h-9 px-4" @click="emit('close')">Close</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplatesStore } from '@/store'
import { ImageFormat } from 'fabric'
import useCanvasExport from '@/hooks/useCanvasExport'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const { templates } = storeToRefs(useTemplatesStore())
const { Exporting, exportImage } = useCanvasExport()

const rangeType = ref<'all' | 'current' | 'custom'>('current')
const dpiType = ref<number>(300)
const range = ref<[number, number]>([1, templates.value.length])
const format = ref<ImageFormat>("jpeg")
const qualityArray = ref([10])
const quality = computed(() => qualityArray.value[0] / 10)
const ignoreWebfont = ref(false)
const ignoreClip = ref(true)

const downloaImage = () => {
  exportImage(format.value, quality.value, dpiType.value, ignoreClip.value)
}
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
</style>