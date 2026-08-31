<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Mask
      </h3>
    </div>
      <div class="space-y-2">
        <!-- Mask Color and Mode in a row (Color on left for popover) -->
        <div class="grid grid-cols-2 gap-2">
          <!-- Mask Color (LEFT) -->
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
                      :style="{ backgroundColor: maskColor }"
                    ></div>
                    <span class="text-xs font-mono">{{ toHex(maskColor) }}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[256px]" align="end">
                <ColorPicker
                  :modelValue="maskColor"
                  @update:modelValue="(color: string) => updateMaskColor(color)"
                />
              </PopoverContent>
            </Popover>
          </div>

          <!-- Blend Mode (RIGHT) -->
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Paintbrush class="h-2.5 w-2.5" />
              Mode</Label>
            <Select v-model="maskMode" @update:model-value="changeImageFilter">
              <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add" class="text-xs py-1">Add</SelectItem>
                <SelectItem value="difference" class="text-xs py-1">Difference</SelectItem>
                <SelectItem value="subtract" class="text-xs py-1">Subtract</SelectItem>
                <SelectItem value="multiply" class="text-xs py-1">Multiply</SelectItem>
                <SelectItem value="screen" class="text-xs py-1">Screen</SelectItem>
                <SelectItem value="lighten" class="text-xs py-1">Lighten</SelectItem>
                <SelectItem value="darken" class="text-xs py-1">Darken</SelectItem>
                <SelectItem value="overlay" class="text-xs py-1">Overlay</SelectItem>
                <SelectItem value="exclusion" class="text-xs py-1">Exclusion</SelectItem>
                <SelectItem value="tint" class="text-xs py-1">Tint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Opacity -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Blend class="h-2.5 w-2.5" />
              Opacity</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ Math.round(maskAlpha * 100) }}%</span>
          </div>
          <SliderWithTicks 
            :model-value="[maskAlpha]"
            @update:model-value="(val) => val && (maskAlpha = val[0])"
            @value-commit="updateMaskAlpha"
            :min="0"
            :max="1"
            :step="0.01"
            :tick-step="0.2"
            :integer-labels="true"
            :label-multiplier="100"
          />
        </div>
      </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useMainStore } from "@/store";
import { ElementNames } from "@/types/elements";
import { filters, Image } from "fabric";
import useCanvas from "@/views/Canvas/useCanvas";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toHex } from '@/utils/color';
import { Palette, Paintbrush, Blend } from 'lucide-vue-next';

const BlendColorFilter = "BlendColor";
const maskColor = ref("");
const maskMode = ref('add')
const maskAlpha = ref(0.3);
const [canvas] = useCanvas();
const { canvasObject } = storeToRefs(useMainStore());

const handleElement = computed(() => canvasObject.value as Image);
const hasColorMask = computed(() => {
  if (!handleElement.value || handleElement.value.type !== ElementNames.IMAGE) return false;
  const blendColorFilter = handleElement.value.filters.filter((obj) => obj.type === BlendColorFilter)[0] as filters.BlendColor;
  if (blendColorFilter) {
    maskColor.value = blendColorFilter.color;
    maskAlpha.value = blendColorFilter.alpha;
    maskMode.value = blendColorFilter.mode;
    return true;
  }
  return false;
});
const openColorMask = ref(hasColorMask.value);

const updateMaskColor = (color: string) => {
  maskColor.value = color;
  changeImageFilter();
};

const updateMaskAlpha = () => {
  changeImageFilter();
};

const changeImageFilter = () => {
  const blendFilter = new filters.BlendColor({
    color: maskColor.value,
    mode: maskMode.value as any,
    alpha: maskAlpha.value,
  });
  handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== BlendColorFilter);
  handleElement.value.filters.push(blendFilter as any);
  handleElement.value.applyFilters();
  canvas.renderAll();
};

const toggleColorMask = () => {
  if (!handleElement.value) return;
  const [canvas] = useCanvas();
  if (openColorMask.value) {
    const blendColorFilter = handleElement.value.filters.filter(
      (obj) => obj.type === BlendColorFilter
    )[0];
    if (!blendColorFilter) {
      const blendFilter = new filters.BlendColor({
        color: maskColor.value,
        mode: "add",
        alpha: maskAlpha.value,
      });
      handleElement.value.filters.push(blendFilter as any);
      handleElement.value.applyFilters();
    }
  } else {
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== BlendColorFilter
    );
    handleElement.value.applyFilters();
  }
  canvas.renderAll();
};
</script>

<style lang="scss" scoped>
</style>

