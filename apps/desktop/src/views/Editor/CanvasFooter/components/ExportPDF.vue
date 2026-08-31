<template>
  <div class="space-y-4">
    <!-- Export Range Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Export Range
        </h3>
        <Badge variant="secondary" class="text-[10px] px-1.5 py-0 select-none">Multi-Page</Badge>
      </div>
      <RadioGroup v-model="rangeType" class="space-y-2">
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="current" id="pdf-current" />
          <Label for="pdf-current" class="flex-1 cursor-pointer text-sm font-medium">
            Current Page Only
            <span class="block text-[10px] text-muted-foreground font-normal">Export only the active page</span>
          </Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="all" id="pdf-all" />
          <Label for="pdf-all" class="flex-1 cursor-pointer text-sm font-medium">
            All Pages
            <span class="block text-[10px] text-muted-foreground font-normal">Export all pages into single PDF</span>
          </Label>
        </div>
      </RadioGroup>
    </div>


    <!-- Advanced Options Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-emerald-600 rounded-sm"></div>
          Advanced Options
        </h3>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between p-2 rounded border border-border/30 bg-background/50 hover:bg-background/80 transition-colors">
          <div class="flex flex-col gap-0.5">
            <Label class="text-xs font-semibold cursor-pointer">Preserve Blank Edges</Label>
            <span class="text-[10px] text-muted-foreground">Add padding around content</span>
          </div>
          <Switch v-model:checked="padding" />
        </div>
      </div>
    </div>

    <!-- Format Info Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
      <div class="text-[10px] space-y-1 text-muted-foreground">
        <div class="flex items-center gap-1.5">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold">ℹ</span>
          <span>PDF format is perfect for printing and document sharing</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[8px] font-bold">✓</span>
          <span>Universal format compatible with all devices</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 pt-2">
      <Button class="flex-1 h-9" @click="expPDF()">Export PDF</Button>
      <Button variant="outline" class="h-9 px-4" @click="emit('close')">Close</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'

import useCanvasExport from '@/hooks/useCanvasExport'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const { exportPDF } = useCanvasExport()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const rangeType = ref<'all' | 'current'>('all')
const padding = ref(false)

const expPDF = () => {
  exportPDF(rangeType.value)
}
</script>

<style lang="scss" scoped>
.config-item {
  flex: 1;
  display: flex;
  align-items: center;
}
</style>