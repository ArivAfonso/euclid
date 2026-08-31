<template>
  <div class="space-y-4">
    <!-- Format Info Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          JSON Export
        </h3>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">Data Format</Badge>
      </div>
      <p class="text-[11px] text-muted-foreground leading-relaxed">
        Export your design data as JSON format. This file contains all project information including layers, properties, and settings.
      </p>
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
          <span>Complete project structure with all layer data</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold flex-shrink-0 mt-0.5">✓</span>
          <span>Import/export for backup and version control</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold flex-shrink-0 mt-0.5">✓</span>
          <span>Compatible with external tools and scripts</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold flex-shrink-0 mt-0.5">✓</span>
          <span>Full layer hierarchy and property information</span>
        </div>
      </div>
    </div>

    <!-- File Info Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          File Information
        </h3>
      </div>

      <div class="grid grid-cols-2 gap-2 text-[10px]">
        <div class="p-2 rounded bg-background/50 border border-border/30">
          <div class="font-semibold text-foreground">Format</div>
          <div class="text-muted-foreground">JSON (.json)</div>
        </div>
        <div class="p-2 rounded bg-background/50 border border-border/30">
          <div class="font-semibold text-foreground">Compression</div>
          <div class="text-muted-foreground">Standard</div>
        </div>
      </div>
    </div>

    <!-- Warning Section -->
    <div class="space-y-2 border border-amber-600/50 rounded-md p-3 bg-amber-600/5">
      <div class="text-[10px] space-y-1 text-amber-700 dark:text-amber-500">
        <div class="flex items-start gap-1.5">
          <span class="font-bold mt-0.5">⚠</span>
          <span>Large projects may create large JSON files. Preview has been disabled to prevent performance issues.</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 pt-2">
      <Button class="flex-1 h-9" @click="exportJSON()">Export JSON</Button>
      <Button variant="outline" class="h-9 px-4" @click="emit('close')">Close</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useCanvasExport from '@/hooks/useCanvasExport'

const emit = defineEmits<{(event: 'close'): void}>()

const { exportJSON } = useCanvasExport()
</script>

<style lang="scss" scoped>
/* Minimal styles - content driven by Tailwind classes */
</style>