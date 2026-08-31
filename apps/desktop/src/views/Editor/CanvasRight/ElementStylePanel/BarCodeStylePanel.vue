<template>
  <div class="space-y-3">
    <ElementPosition />
    
    <!-- Barcode Format -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Format
        </h3>
      </div>
      
      <Select v-model="handleElement.codeOption.format" @update:model-value="generateBarCode">
        <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="item in BarCodeStyleLibs"
            :key="item.index"
            :value="item.name"
            class="text-xs py-1"
          >
            {{ item.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Barcode Content -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Content
        </h3>
      </div>
      
      <Input 
        v-model="handleElement.codeContent" 
        @change="generateBarCode"
        @keydown.stop
        placeholder="Enter barcode value"
        class="h-8 text-xs"
      />
    </div>

    <!-- Dimensions -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Dimensions
        </h3>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <Label class="text-[10px] text-muted-foreground flex items-center gap-1"><Minus class="h-2.5 w-2.5" />Width</Label>
          <Input 
            v-model="handleElement.codeOption.width" 
            @change="generateBarCode"
            @keydown.stop
            type="number"
            class="h-8 text-xs"
          />
        </div>
        <div class="space-y-1">
          <Label class="text-[10px] text-muted-foreground flex items-center gap-1"><ArrowUpDown class="h-2.5 w-2.5" />Height</Label>
          <Input 
            v-model="handleElement.codeOption.height" 
            @change="generateBarCode"
            @keydown.stop
            type="number"
            class="h-8 text-xs"
          />
        </div>
      </div>
    </div>

    <!-- Colors -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Colors
        </h3>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <Label class="text-[10px] text-muted-foreground flex items-center gap-1"><Square class="h-2.5 w-2.5" />Background</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-8 w-full justify-start text-xs font-normal px-2"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="w-4 h-4 rounded border border-border"
                    :style="{ backgroundColor: handleElement.codeOption.background || '#fff' }"
                  ></div>
                  <span class="text-xs font-mono">{{ toHex(handleElement.codeOption.background || '#fff') }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker
                :modelValue="handleElement.codeOption.background"
                @update:modelValue="(value: string) => updateBackgroundColor(value)"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div class="space-y-1">
          <Label class="text-[10px] text-muted-foreground flex items-center gap-1"><Palette class="h-2.5 w-2.5" />Bar Color</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-8 w-full justify-start text-xs font-normal px-2"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="w-4 h-4 rounded border border-border"
                    :style="{ backgroundColor: handleElement.codeOption.lineColor || '#000' }"
                  ></div>
                  <span class="text-xs font-mono">{{ toHex(handleElement.codeOption.lineColor || '#000') }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker
                :modelValue="handleElement.codeOption.lineColor"
                @update:modelValue="(value: string) => updateLineColor(value)"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>

    <ElementOutline />
    <ElementShadow :hasShadow="hasShadow" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useMainStore, useTemplatesStore } from "@/store";
import { BarCodeStyleLibs } from "@/configs/codeStyles";
import { BarCodeElement } from "@/types/canvas";
import JsBarCode from "jsbarcode";
import useCanvas from "@/views/Canvas/useCanvas";
import ElementPosition from "../Components/ElementPosition.vue";
import ElementOutline from "../Components/ElementOutline.vue";
import ElementShadow from "../Components/ElementShadow.vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ColorPicker from "@/components/ColorPicker/index.vue";
import { toHex } from "@/utils/color";
import { Minus, ArrowUpDown, Square, Palette } from 'lucide-vue-next';

const mainStore = useMainStore();
const templatesStore = useTemplatesStore();
const [canvas] = useCanvas();
const { canvasObject } = storeToRefs(mainStore);

const handleElement = computed(() => canvasObject.value as BarCodeElement);
const hasShadow = computed(() => (handleElement.value.shadow ? true : false));

// Update background color
const updateBackgroundColor = (color: string) => {
  handleElement.value.codeOption.background = color;
  generateBarCode();
};

// Update barcode line color
const updateLineColor = (color: string) => {
  handleElement.value.codeOption.lineColor = color;
  generateBarCode();
};

const generateBarCode = async () => {
  JsBarCode(
    "#barcode",
    handleElement.value.codeContent,
    handleElement.value.codeOption
  );
  const barcode = document.getElementById("barcode");
  if (!barcode) return;
  const src = `data:image/svg+xml;base64,` + btoa(new XMLSerializer().serializeToString(barcode));
  await handleElement.value.setSrc(src);
  templatesStore.modifedElement(handleElement.value, { src });
  canvas.renderAll();
};
</script>

<style lang="scss" scoped>
// Compact shadcn styling - minimal custom styles needed
</style>