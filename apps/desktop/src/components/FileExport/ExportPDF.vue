<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Export Range Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
          <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
          Export Range
        </h3>
        <Badge variant="secondary" class="text-xs px-2 py-0.5">Multi-Page</Badge>
      </div>
      <RadioGroup v-model="rangeType" class="space-y-2">
        <div class="flex items-center space-x-3 p-3 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer"
          :class="rangeType === 'current' ? 'border-primary bg-primary/10' : ''">
          <RadioGroupItem value="current" id="pdf-current" />
          <Label for="pdf-current" class="flex-1 cursor-pointer">
            <div class="text-sm font-semibold">Current Page Only</div>
            <div class="text-xs text-muted-foreground">Export only the active page</div>
          </Label>
        </div>
        <div class="flex items-center space-x-3 p-3 rounded border border-border/50 hover:border-border hover:bg-background/50 transition cursor-pointer"
          :class="rangeType === 'all' ? 'border-primary bg-primary/10' : ''">
          <RadioGroupItem value="all" id="pdf-all" />
          <Label for="pdf-all" class="flex-1 cursor-pointer">
            <div class="text-sm font-semibold">All Pages</div>
            <div class="text-xs text-muted-foreground">Export all pages into single PDF</div>
          </Label>
        </div>
      </RadioGroup>
    </div>



    <!-- Advanced Options Section -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
        <div class="w-2 h-2 bg-emerald-600 rounded-sm"></div>
        Advanced Options
      </h3>
      <div class="flex items-center justify-between p-3 rounded border border-border/30 bg-background/50 hover:bg-background transition">
        <div class="flex flex-col gap-1">
          <Label class="text-sm font-semibold cursor-pointer">Preserve Blank Edges</Label>
          <span class="text-xs text-muted-foreground">Add padding around content</span>
        </div>
        <Switch v-model:checked="padding" />
      </div>
    </div>

    <!-- Format Benefits -->
    <div class="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/20">
      <h3 class="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
        <div class="w-2 h-2 bg-pink-600 rounded-sm"></div>
        Benefits
      </h3>
      <div class="text-xs space-y-2 text-muted-foreground">
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[10px] font-bold">ℹ</span>
          <span>Perfect for printing and document sharing</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 flex items-center justify-center bg-primary/10 rounded text-[10px] font-bold">✓</span>
          <span>Universal format compatible with all devices</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 pt-4">
      <Button class="flex-1 h-10" @click="exportPDF(rangeType)">Export PDF</Button>
      <Button variant="outline" class="h-10 px-6" @click="emit('close')">Close</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import useCanvasExport from '@/hooks/useCanvasExport'

const { exportPDF } = useCanvasExport()
const emit = defineEmits<{
  (event: 'close'): void
}>()

const rangeType = ref<'all' | 'current'>('all')
const padding = ref(false)
</script>