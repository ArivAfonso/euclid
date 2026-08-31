<template>
  <div v-if="handleElement" class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Blend Mode
      </h3>
    </div>
    
    <Select v-model="elementBlend" @update:model-value="changeBlendMode">
      <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
        <SelectValue placeholder="Select blend mode" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="item in BlendModes" :key="item.id" :value="item.key" class="text-xs py-1">
          {{ item.name }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useMainStore } from "@/store";
import { Image } from "fabric";
import { BlendModes } from '@/configs/images';
import useCanvas from "@/views/Canvas/useCanvas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const { canvasObject } = storeToRefs(useMainStore());
const handleElement = computed(() => canvasObject.value as Image);
const imageBlend = computed(() => handleElement.value?.globalCompositeOperation ?? 'source-over')
const elementBlend = ref(imageBlend.value);

const changeBlendMode = (globalCompositeOperation: string) => {
  const [ canvas ] = useCanvas();
  if (!handleElement.value) return
  handleElement.value.set({globalCompositeOperation})
  canvas.renderAll()
}
</script>

<style lang="scss" scoped>
</style>