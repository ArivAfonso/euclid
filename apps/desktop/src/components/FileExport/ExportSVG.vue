<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Format Info Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
          <div class="w-2 h-2 bg-orange-600 rounded-sm"></div>
          SVG Export
        </h3>
        <Badge variant="outline" class="text-xs px-2 py-0.5">Vector Format</Badge>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed">
        SVG (Scalable Vector Graphics) is a vector format that scales to any size without quality loss. Perfect for web, print, and further editing.
      </p>
    </div>

    <!-- Preview Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
          <div class="w-2 h-2 bg-cyan-600 rounded-sm"></div>
          Preview
        </h3>
        <Badge variant="secondary" class="text-xs px-2 py-0.5">Live</Badge>
      </div>
      <div class="svg-preview rounded border border-border/50 bg-background overflow-auto min-h-[200px] max-h-[300px]">
        <div v-html="svgHtml" class="w-full h-full flex items-center justify-center p-4"></div>
      </div>
    </div>

    <!-- Benefits Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
        <div class="w-2 h-2 bg-emerald-600 rounded-sm"></div>
        Benefits
      </h3>
      <div class="text-xs space-y-2 text-muted-foreground">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[10px] font-bold">✓</span>
          <span>Infinitely scalable without quality loss</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[10px] font-bold">✓</span>
          <span>Fully editable in design tools and code</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[10px] font-bold">✓</span>
          <span>Lightweight file format</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 pt-4">
      <Button class="flex-1 h-10" @click="exportSVG()">Export SVG</Button>
      <Button variant="outline" class="h-10 px-6" @click="emit('close')">Close</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useCanvasExport from '@/hooks/useCanvasExport'

const emit = defineEmits<{
  (event: 'close'): void
}>()

const { exportSVG, getSVGData } = useCanvasExport()

const svgHtml = computed(() => getSVGData())
</script>