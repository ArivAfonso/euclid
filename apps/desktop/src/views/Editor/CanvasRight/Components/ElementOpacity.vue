<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Opacity
      </h3>
    </div>
    
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <SliderWithTicks 
          :model-value="[opacity]" 
          @update:model-value="(val) => opacity = val[0]"
          @value-commit="updateOpacity"
          :min="0" 
          :max="1" 
          :step="0.01"
          :tick-step="0.2"
          :integer-labels="true"
          :label-multiplier="100"
          class="flex-1"
        />
        <span class="text-xs font-mono text-muted-foreground min-w-[3rem] text-right">{{ Math.round(opacity * 100) }}%</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import useCanvas from '@/views/Canvas/useCanvas'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue';
import { Badge } from '@/components/ui/badge';

const { canvasObject } = storeToRefs(useMainStore())

const opacity = ref<number>(canvasObject.value ? canvasObject.value.opacity : 1)

const updateOpacity = () => {
  const [ canvas ] = useCanvas()
  if (!canvasObject.value) return
  canvasObject.value.opacity = opacity.value
  canvas.renderAll()
}
</script>

<style lang="scss" scoped>
</style>