<template>
  <div class="space-y-4">
    <!-- Format Info Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          SVG Export
        </h3>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">Vector Format</Badge>
      </div>
      <p class="text-[11px] text-muted-foreground leading-relaxed">
        SVG (Scalable Vector Graphics) is a vector format that scales to any size without quality loss. Perfect for web, print, and further editing.
      </p>
    </div>

    <!-- Preview Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20 overflow-hidden">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Preview
        </h3>
        <Badge variant="secondary" class="text-[10px] px-1.5 py-0 select-none">Live Preview</Badge>
      </div>
      <div class="svg-preview rounded border border-border/50 bg-background overflow-auto">
        <div v-html="svgHtml" class="w-full h-full flex items-center justify-center p-4"></div>
      </div>
    </div>

    <!-- Export Info & Action -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="text-[10px] space-y-1 text-muted-foreground">
        <div class="flex items-center gap-1.5">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold">✓</span>
          <span>Vector format - scales infinitely without quality loss</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold">✓</span>
          <span>Fully editable in design tools and code editors</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 pt-2">
      <Button class="flex-1 h-9" @click="exportSVG()">Export SVG</Button>
      <Button variant="outline" class="h-9 px-4" @click="emit('close')">Close</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import useCanvasExport from '@/hooks/useCanvasExport'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const emit = defineEmits<{(event: 'close'): void}>()

const { exportSVG, getSVGData } = useCanvasExport()

const svgHtml = computed(() => getSVGData())

</script>

<style lang="scss" scoped>
.svg-preview {
  min-height: 200px;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, transparent 0%, rgba(var(--primary), 0.02) 100%);
  
  :deep(svg) {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>