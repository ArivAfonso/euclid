<template>
  <div v-if="handleElement" class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Border
      </h3>
    </div>
    
    <div class="space-y-2">
      <!-- Stroke Width -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Minus class="h-2.5 w-2.5" />
              Width</Label>
          <span class="text-[10px] font-mono text-muted-foreground">{{ handleElement.strokeWidth }}px</span>
        </div>
        <SliderWithTicks 
          :model-value="[handleElement.strokeWidth]"
          @update:model-value="(val) => val && (handleElement.strokeWidth = val[0])"
          @value-commit="() => updateStrokeWidth(handleElement.strokeWidth)"
          :min="0"
          :max="40"
          :step="1"
        />
      </div>

      <!-- Stroke Color and Corner Style in a row (Color on left for popover) -->
      <div class="grid grid-cols-2 gap-2">
        <!-- Stroke Color (LEFT) -->
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Palette class="h-2.5 w-2.5" />
              Color</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="w-4 h-4 rounded border border-border" 
                    :style="{ backgroundColor: String(handleElement.stroke || '') }"
                  ></div>
                  <span class="text-xs font-mono">{{ toHex(String(handleElement.stroke || '')) }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker
                :modelValue="String(handleElement.stroke || '')"
                @update:modelValue="(color: string) => updateStrokeColor(color)"
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Corner Style (RIGHT) -->
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Square class="h-2.5 w-2.5" />
              Corner Style</Label>
          <Select 
            :model-value="handleElement.strokeLineJoin" 
            @update:model-value="(val) => val && updateStrokeLineJoin(String(val))"
          >
            <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bevel" class="text-xs py-1">Bevel</SelectItem>
              <SelectItem value="round" class="text-xs py-1">Round</SelectItem>
              <SelectItem value="miter" class="text-xs py-1">Miter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { TextboxElement } from '@/types/canvas'
import useCanvas from '@/views/Canvas/useCanvas'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toHex } from '@/utils/color';
import { Minus, Palette, Square } from 'lucide-vue-next';

defineProps<{ hasStroke: boolean }>()

const [ canvas ] = useCanvas()
const { canvasObject } = storeToRefs(useMainStore())

const handleElement = computed(() => canvasObject.value as TextboxElement)

const updateStrokeColor = (stroke: string) => {
  if (!handleElement.value) return
  handleElement.value.set({ stroke })
  if ((handleElement.value.strokeWidth ?? 0) <= 0) {
    handleElement.value.set({ strokeWidth: 1, paintFirst: 'stroke' })
  }
  canvas.renderAll()
}
</script>
