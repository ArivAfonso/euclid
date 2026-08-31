<template>
  <div class="flex flex-col gap-8 p-8">
    <!-- Format Selection Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
          <div class="w-2 h-2 bg-blue-600 rounded-sm"></div>
          Image Format
        </h3>
        <Badge variant="outline" class="text-xs px-2 py-0.5">Required</Badge>
      </div>
      <RadioGroup v-model="format" class="grid grid-cols-2 gap-3">
        <div class="flex items-center space-x-3 p-3 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer"
          :class="format === 'jpeg' ? 'border-primary bg-primary/10' : ''">
          <RadioGroupItem value="jpeg" id="format-jpeg" />
          <Label for="format-jpeg" class="flex-1 cursor-pointer">
            <div class="text-sm font-semibold">JPEG</div>
            <div class="text-xs text-muted-foreground">Compressed, smaller</div>
          </Label>
        </div>
        <div class="flex items-center space-x-3 p-3 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer"
          :class="format === 'png' ? 'border-primary bg-primary/10' : ''">
          <RadioGroupItem value="png" id="format-png" />
          <Label for="format-png" class="flex-1 cursor-pointer">
            <div class="text-sm font-semibold">PNG</div>
            <div class="text-xs text-muted-foreground">Lossless, transparent</div>
          </Label>
        </div>
      </RadioGroup>
    </div>

    <!-- Export Range Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
          <div class="w-2 h-2 bg-green-600 rounded-sm"></div>
          Export Range
        </h3>
        <Badge variant="secondary" class="text-xs px-2 py-0.5">{{ rangeDisplay }}</Badge>
      </div>
      <RadioGroup v-model="rangeType" class="space-y-2">
        <div class="flex items-center space-x-3 p-3 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer"
          :class="rangeType === 'current' ? 'border-primary bg-primary/10' : ''">
          <RadioGroupItem value="current" id="range-current" />
          <Label for="range-current" class="flex-1 cursor-pointer">
            <div class="text-sm font-semibold">Current Page</div>
            <div class="text-xs text-muted-foreground">Export only active page</div>
          </Label>
        </div>
        <div class="flex items-center space-x-3 p-3 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer"
          :class="rangeType === 'all' ? 'border-primary bg-primary/10' : ''">
          <RadioGroupItem value="all" id="range-all" />
          <Label for="range-all" class="flex-1 cursor-pointer">
            <div class="text-sm font-semibold">All Pages</div>
            <div class="text-xs text-muted-foreground">Export all pages separately</div>
          </Label>
        </div>
        <div class="flex items-center space-x-3 p-3 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer"
          :class="rangeType === 'custom' ? 'border-primary bg-primary/10' : ''">
          <RadioGroupItem value="custom" id="range-custom" />
          <Label for="range-custom" class="flex-1 cursor-pointer">
            <div class="text-sm font-semibold">Custom Range</div>
            <div class="text-xs text-muted-foreground">Select specific pages</div>
          </Label>
        </div>
      </RadioGroup>

      <!-- Custom Range Slider -->
      <Transition name="slide">
        <div v-if="rangeType === 'custom'" class="space-y-2 pt-3 border-t border-border/30 mt-3">
          <div class="flex justify-between items-center">
            <Label class="text-xs font-bold uppercase tracking-wide">Page Range</Label>
            <span class="text-xs font-mono bg-primary/10 px-2 py-1 rounded">{{ range[0] }} - {{ range[1] }}</span>
          </div>
          <Slider v-model="range" :min="1" :max="templates.length" :step="1" class="w-full" />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>Page 1</span>
            <span>Page {{ templates.length }}</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Quality & Resolution Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
        <div class="w-2 h-2 bg-purple-600 rounded-sm"></div>
        Quality & Resolution
      </h3>

      <!-- Quality Slider -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <Label class="text-xs font-bold uppercase tracking-wide">Quality</Label>
          <Badge variant="outline" class="text-xs px-2 py-0.5 font-mono">{{ qualityPercent }}%</Badge>
        </div>
        <Slider v-model="quality" :min="0" :max="1" :step="0.1" class="w-full" />
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <!-- DPI Selection -->
      <div class="space-y-2">
        <Label class="text-xs font-bold uppercase tracking-wide">Resolution (DPI)</Label>
        <RadioGroup v-model.number="dpiType" class="grid grid-cols-3 gap-2">
          <div class="flex items-center space-x-2 p-2 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer text-center"
            :class="dpiType === 72 ? 'border-primary bg-primary/10' : ''">
            <RadioGroupItem :value="72" id="dpi-72" class="sr-only" />
            <Label for="dpi-72" class="flex-1 cursor-pointer text-xs">
              <div class="font-semibold">72</div>
              <div class="text-[10px] text-muted-foreground">Screen</div>
            </Label>
          </div>
          <div class="flex items-center space-x-2 p-2 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer text-center"
            :class="dpiType === 150 ? 'border-primary bg-primary/10' : ''">
            <RadioGroupItem :value="150" id="dpi-150" class="sr-only" />
            <Label for="dpi-150" class="flex-1 cursor-pointer text-xs">
              <div class="font-semibold">150</div>
              <div class="text-[10px] text-muted-foreground">Web</div>
            </Label>
          </div>
          <div class="flex items-center space-x-2 p-2 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer text-center"
            :class="dpiType === 300 ? 'border-primary bg-primary/10' : ''">
            <RadioGroupItem :value="300" id="dpi-300" class="sr-only" />
            <Label for="dpi-300" class="flex-1 cursor-pointer text-xs">
              <div class="font-semibold">300</div>
              <div class="text-[10px] text-muted-foreground">Print</div>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>

    <!-- Advanced Options Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
        <div class="w-2 h-2 bg-amber-600 rounded-sm"></div>
        Advanced Options
      </h3>
      <div class="flex items-center justify-between p-3 rounded border border-border/30 bg-background/50 hover:bg-background transition">
        <div class="flex flex-col gap-1">
          <Label class="text-sm font-semibold cursor-pointer">Ignore Bleeds</Label>
          <span class="text-xs text-muted-foreground">Remove edge marks and bleed areas</span>
        </div>
        <Switch v-model:checked="ignoreClip" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 pt-4">
      <Button class="flex-1 h-10" @click="downloadImage()" :disabled="Exporting">
        <span v-if="Exporting" class="flex items-center gap-2">
          <span class="animate-spin">⏳</span>
          Exporting...
        </span>
        <span v-else>Export Images</span>
      </Button>
      <Button variant="outline" class="h-10 px-6" @click="emit('close')">Close</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplatesStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { ImageFormat } from 'fabric'
import useCanvasExport from '@/hooks/useCanvasExport'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const { templates } = storeToRefs(useTemplatesStore())
const { Exporting, exportImage } = useCanvasExport()

const rangeType = ref<'all' | 'current' | 'custom'>('current')
const dpiType = ref<number>(300)
const range = ref<[number, number]>([1, templates.value.length])
const format = ref<ImageFormat>('jpeg')
const quality = ref<number[]>([1])
const ignoreClip = ref(true)

const qualityPercent = computed(() => Math.round((quality.value[0] ?? 0) * 100))
const rangeDisplay = computed(() => {
  if (rangeType.value === 'custom') return `Pages ${range.value[0]}-${range.value[1]}`
  return rangeType.value === 'all' ? 'All Pages' : 'Current'
})

const downloadImage = () => {
  exportImage(format.value, quality.value[0] ?? 1, dpiType.value, ignoreClip.value)
}
</script>