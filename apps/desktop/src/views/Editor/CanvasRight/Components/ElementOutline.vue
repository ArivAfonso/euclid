<template>
  <div v-if="handleElement" class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Border
      </h3>
      <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">{{ handleElement.strokeWidth }}px</Badge>
    </div>
      <div class="space-y-2">
        <!-- Border Color and Style in a row (Color on left for popover) -->
        <div class="grid grid-cols-2 gap-2">
          <!-- Border Color (LEFT) -->
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Palette class="h-2.5 w-2.5" />
              Color</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="w-full h-7 px-2 justify-start transition-all"
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
                  @update:modelValue="(color: string) => updateOutlineColor(color)"
                />
              </PopoverContent>
            </Popover>
          </div>

          <!-- Border Style (RIGHT) -->
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Paintbrush class="h-2.5 w-2.5" />
              Style</Label>
            <Select :model-value="String(outlineStyle)" @update:model-value="(val) => { outlineStyle = Number(val); changeOutlineStyle(); }">
              <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" class="text-xs py-1">Solid Border</SelectItem>
                <SelectItem value="1" class="text-xs py-1">Dashed Border</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Dash Length (only visible for dashed border) -->
        <div v-if="outlineStyle === 1" class="space-y-1">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <SeparatorHorizontal class="h-2.5 w-2.5" />
              Dash Length</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ dashLength }}px</span>
          </div>
          <SliderWithTicks 
            :model-value="[dashLength]"
            @update:model-value="(val) => val && (dashLength = val[0])"
            @value-commit="changeDashLength()"
            :min="2"
            :max="20"
            :step="1"
          />
        </div>

        <!-- Border Thickness -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Weight class="h-2.5 w-2.5" />
              Thickness</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ handleElement.strokeWidth }}px</span>
          </div>
          <SliderWithTicks 
            :model-value="[handleElement.strokeWidth]"
            @update:model-value="(val) => val && (handleElement.strokeWidth = val[0])"
            @value-commit="changeOutlineStyle"
            :min="0"
            :max="40"
            :step="1"
          />
        </div>
      </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useMainStore } from "@/store";
import { CanvasElement } from "@/types/canvas";
import useCanvas from "@/views/Canvas/useCanvas";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Paintbrush, Weight, SeparatorHorizontal } from 'lucide-vue-next';
import { toHex } from '@/utils/color';

const [canvas] = useCanvas();
const { canvasObject } = storeToRefs(useMainStore());
const outlineStyle = ref(0);
const dashLength = ref<number>(6);
const handleElement = computed(() => canvasObject.value as CanvasElement);
const hasOutline = computed(() => {
  if (!handleElement.value) return false;
  return handleElement.value.stroke ? true : false;
});
const openOutline = ref(hasOutline.value);

const toggleOutline = () => {
  if (!handleElement.value) return;
  if (openOutline.value) {
    handleElement.value.stroke = "#555";
    handleElement.value.strokeWidth = 1;
  } else {
    handleElement.value.stroke = "";
  }
  canvas.renderAll();
};

const changeOutlineStyle = () => {
  if (!handleElement.value) return;
  handleElement.value.strokeDashArray = null;
  if (outlineStyle.value === 1) {
    handleElement.value.strokeDashArray = [dashLength.value, dashLength.value];
  }
  canvas.renderAll();
};

const changeDashLength = () => {
  if (!handleElement.value || outlineStyle.value !== 1) return;
  handleElement.value.strokeDashArray = [dashLength.value, dashLength.value];
  canvas.renderAll();
};

const updateOutlineColor = (color: string) => {
  handleElement.value.stroke = color;
  canvas.renderAll();
};
</script>

<style lang="scss" scoped>
</style>
