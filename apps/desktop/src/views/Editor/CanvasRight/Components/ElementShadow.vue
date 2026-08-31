<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Shadow
      </h3>
    </div>
    
    <div class="space-y-2">
      <!-- Horizontal Shadow -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <MoveHorizontal class="h-2.5 w-2.5" />
              Horizontal</Label>
          <span class="text-[10px] font-mono text-muted-foreground">{{ offsetX }}px</span>
        </div>
        <SliderWithTicks 
          :model-value="[offsetX ?? 0]"
          @update:model-value="(val) => val && (offsetX = val[0])"
          @value-commit="changeOffsetX"
          :min="-100"
          :max="100"
          :step="1"
          :tick-step="25"
          :integer-labels="true"
        />
      </div>

      <!-- Vertical Shadow -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <MoveVertical class="h-2.5 w-2.5" />
              Vertical</Label>
          <span class="text-[10px] font-mono text-muted-foreground">{{ offsetY }}px</span>
        </div>
        <SliderWithTicks 
          :model-value="[offsetY ?? 0]"
          @update:model-value="(val) => val && (offsetY = val[0])"
          @value-commit="changeOffsetY"
          :min="-100"
          :max="100"
          :step="1"
          :tick-step="25"
          :integer-labels="true"
        />
      </div>

      <!-- Blur Distance -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Droplets class="h-2.5 w-2.5" />
              Blur</Label>
          <span class="text-[10px] font-mono text-muted-foreground">{{ blur }}px</span>
        </div>
        <SliderWithTicks 
          :model-value="[blur ?? 0]"
          @update:model-value="(val) => val && (blur = val[0])"
          @value-commit="changeBlur"
          :min="0"
          :max="100"
          :step="1"
          :tick-step="10"
        />
      </div>

      <!-- Shadow Color -->
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
                  :style="{ backgroundColor: shadowColor }"
                ></div>
                <span class="text-xs font-mono">{{ toHex(shadowColor) }}</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[256px]" align="end">
            <ColorPicker
              :modelValue="shadowColor"
              @update:modelValue="(color: string) => updateShadowColor(color)"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useMainStore } from "@/store";
import * as fabric from "fabric";
import useCanvas from "@/views/Canvas/useCanvas";
import { CanvasElement } from "@/types/canvas";
import { Button } from '@/components/ui/button';
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toHex } from '@/utils/color';
import { MoveHorizontal, MoveVertical, Droplets, Palette } from 'lucide-vue-next';

defineProps<{ hasShadow: boolean }>();

const [canvas] = useCanvas();
const { canvasObject } = storeToRefs(useMainStore());

const offsetX = ref<number>(0);
const offsetY = ref<number>(0);
const blur = ref<number>(0);
const shadowColor = ref("#000000");

const handleElement = computed(() => canvasObject.value as CanvasElement);

const initializeShadowState = () => {
  const shadow = handleElement.value?.shadow as fabric.Shadow | null | undefined;
  offsetX.value = typeof shadow?.offsetX === "number" ? shadow.offsetX : 0;
  offsetY.value = typeof shadow?.offsetY === "number" ? shadow.offsetY : 0;
  blur.value = typeof shadow?.blur === "number" ? shadow.blur : 0;
  shadowColor.value = typeof shadow?.color === "string" ? shadow.color : "#000000";
};

watch(
  () => handleElement.value,
  (element) => {
    if (!element) return;
    initializeShadowState();
  },
  { immediate: true }
);

const updateShadowColor = (color: string) => {
  shadowColor.value = color;
  updateShadowElement();
};

const changeOffsetX = () => {
  updateShadowElement();
};

const changeOffsetY = () => {
  updateShadowElement();
};

const changeBlur = () => {
  updateShadowElement();
};

const updateShadowElement = () => {
  if (!handleElement.value) return;
  handleElement.value.shadow = new fabric.Shadow({
    color: shadowColor.value,
    offsetX: offsetX.value ?? 0,
    offsetY: offsetY.value ?? 0,
    blur: blur.value ?? 0,
  });
  canvas.renderAll();
};
</script>

<style lang="scss" scoped>
</style>
