<template>
  <div class="canvas-design-panel space-y-3">
    <!-- Canvas Size Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Canvas Size
        </h3>
      </div>
      
      <div class="grid grid-cols-5 gap-1.5 items-center">
        <div class="col-span-2">
          <div class="relative group">
            <Input
              v-model="canvasWidth"
              :value="Math.round(canvasWidth * 100) / 100"
              @change="changeTemplateWidth"
              oninput="value=value.replace(/[^\d.]/g,'')"
              class="pl-7 pr-2 text-xs h-7 font-mono border-input"
              placeholder="Width"
            />
            <div class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/70 group-hover:text-primary">W</div>
          </div>
        </div>
        
        <div class="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  :class="[
                    'h-7 w-7 transition-all',
                    isFixed ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-muted'
                  ]"
                  @click="changeFixedRatio(!isFixed)"
                >
                  <IconLock class="h-3.5 w-3.5" v-if="isFixed" />
                  <IconUnlock class="h-3.5 w-3.5" v-else />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>{{ isFixed ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio' }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div class="col-span-2">
          <div class="relative group">
            <Input
              v-model="canvasHeight"
              :value="Math.round(canvasHeight * 100) / 100"
              @change="changeTemplateHeight"
              oninput="value=value.replace(/[^\d.]/g,'')"
              class="pl-7 pr-2 text-xs h-7 font-mono border-input"
              placeholder="Height"
            />
            <div class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/70 group-hover:text-primary">H</div>
          </div>
        </div>
      </div>
      
      <!-- Bleeding and Safety Lines -->
      <div class="grid grid-cols-5 gap-1.5 items-center mt-1.5">
        <div class="col-span-2">
          <div class="relative group">
            <Input
              v-model="clip"
              @change="changeTemplateClip"
              oninput="value=value.replace(/[^\d]/g,'')"
              :disabled="unitMode === 1"
              class="pl-7 pr-2 text-xs h-7 font-mono border-destructive/20 focus:border-destructive/50"
              placeholder="Bleed"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="absolute left-2 top-1/2 -translate-y-1/2">
                    <IconCuttingOne class="h-3 w-3 text-destructive/70 group-hover:text-destructive" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Bleeding Line</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div class="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  :class="[
                    'h-7 w-7 transition-all',
                    isRound ? 'bg-accent text-accent-foreground hover:bg-accent/80' : 'hover:bg-muted'
                  ]"
                  @click="changeWorkRound(!isRound)"
                >
                  <IconRound class="h-3.5 w-3.5" v-if="isRound" />
                  <IconRightAngle class="h-3.5 w-3.5" v-else />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>{{ isRound ? 'Fillet' : 'Right Angle' }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div class="col-span-2">
          <div class="relative group">
            <Input
              v-model="safe"
              @change="changeTemplateSafe"
              oninput="value=value.replace(/[^\d]/g,'')"
              :disabled="unitMode === 1"
              class="pl-7 pr-2 text-xs h-7 font-mono border-green-500/20 focus:border-green-500/50"
              placeholder="Safety"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="absolute left-2 top-1/2 -translate-y-1/2">
                    <IconShield class="h-3 w-3 text-green-600/70 group-hover:text-green-600" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Safety Line</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      <!-- Unit and Size Mode Selectors -->
      <div class="grid grid-cols-2 gap-2 mt-2">
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
            <IconRuler class="h-2.5 w-2.5" />
            Unit
          </Label>
          <Select v-model="unitMode">
            <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="item in DesignUnitMode"
                :key="item.id"
                :value="item.id"
                class="text-xs py-1"
              >
                {{ item.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <Separator class="my-2" />

    <!-- Canvas Fill Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
           
      <Backgrounds />
    </div>

    <Separator class="my-2" />

    <!-- Canvas Mask Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Canvas Mask
        </h3>
      </div>
      
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[10px] px-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
            <Blend class="h-2.5 w-2.5" />
            Opacity</Label>
          <div class="font-mono text-primary">{{ Math.round(opacity * 100) }}%</div>
        </div>
        
        <div class="px-1">
          <SliderWithTicks 
            :model-value="[opacity]" 
            @update:model-value="(value) => { if (value) { opacity = value[0]; changeMaskOpacity(); } }"
            :min="0.1" 
            :max="1" 
            :step="0.01"
            :tick-step="0.1"
            :integer-labels="true"
            :label-multiplier="100"
            class="w-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Rect } from "fabric";
import { storeToRefs } from "pinia";
import { toast } from '@/components/ui/toast/use-toast'
import { ref, watch, onMounted, computed } from "vue";
import { mm2px, px2mm } from "@/utils/image";
import { useFabricStore, useMainStore, useTemplatesStore } from "@/store";
import {
  WorkSpaceClipType,
  WorkSpaceDrawType,
  WorkSpaceMaskType,
} from "@/configs/canvas";
import {
  DesignUnitMode,
  DesignSizeMode,
  MinSize,
  MaxSize,
} from "@/configs/background";
import useCanvas from "@/views/Canvas/useCanvas";
import useCommon from "@/views/Canvas/useCommon";
import Backgrounds from "../Backgrounds/index.vue";
import useHistorySnapshot from "@/hooks/useHistorySnapshot";
import useCanvasScale from '@/hooks/useCanvasScale'

// shadcn/ui components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import SliderWithTicks from "@/components/ui/slider/SliderWithTicks.vue";
// Import icons
import { Blend } from 'lucide-vue-next';

const mainStore = useMainStore();
const templatesStore = useTemplatesStore();
const fabricStore = useFabricStore();
const { addHistorySnapshot } = useHistorySnapshot();
const { sizeMode, unitMode } = storeToRefs(mainStore);
const { currentTemplate } = storeToRefs(templatesStore);
const { clip, safe, zoom, opacity } = storeToRefs(fabricStore);
const { setCanvasSize, resetCanvas } = useCanvasScale()

const templateWidth = computed(() => {
  // const [ canvas ] = useCanvas()
  // if (!canvas) return 0
  const workWidth = currentTemplate.value.width / currentTemplate.value.zoom;
  return unitMode.value === 0 ? px2mm(workWidth) : workWidth;
});

const templateHeight = computed(() => {
  // const [ canvas ] = useCanvas()
  // if (!canvas) return 0
  const workHeight = currentTemplate.value.height / currentTemplate.value.zoom;
  return unitMode.value === 0 ? px2mm(workHeight) : workHeight;
});

// const canvasWidth = ref<number>(px2mm(currentTemplate.value.width / currentTemplate.value.zoom))
const canvasWidth = ref<number>(templateWidth.value);
const canvasHeight = ref<number>(templateHeight.value);

// Fixed width/height
const isFixed = ref(false);

// Corner radius toggle (rounded / right-angle)
const isRound = ref(false);

// Grid predefined parameters
const RECENT_GRIDS = "RECENT_GRIDS";
const gridColorRecent = ref<[string[]]>([[]]);

// Get canvas size
const getCanvasSize = () => {
  let width =
    unitMode.value === 0 ? mm2px(canvasWidth.value) : canvasWidth.value;
  let height =
    unitMode.value === 0 ? mm2px(canvasHeight.value) : canvasHeight.value;
  width = width * zoom.value;
  height = height * zoom.value;
  return { width, height };
};

// Modify canvas width
const changeTemplateWidth = () => {
  const [canvas] = useCanvas();
  const workSpaceDraw = canvas
    .getObjects()
    .filter((item) => item.id === WorkSpaceDrawType)[0];
  if (!workSpaceDraw) return;
  const ratio = currentTemplate.value.height / currentTemplate.value.width;
  let { width, height } = getCanvasSize();
  if (width / zoom.value < mm2px(MinSize)) {
    toast({
      title: 'Warning',
      description: `The Minimum size limit is ${MinSize}mm`,
      variant: 'destructive'
    });
    width = mm2px(MinSize) * zoom.value;
  }
  if (width / zoom.value > mm2px(MaxSize)) {
    toast({
      title: 'Warning',
      description: `The Maximum size limit is ${MaxSize}mm`,
      variant: 'destructive'
    });
    width = mm2px(MaxSize) * zoom.value;
  }
  height = isFixed.value ? width * ratio : height;
  workSpaceDraw.set({ width: width / zoom.value, height: height / zoom.value });
  templatesStore.setSize(width, height, zoom.value);
  sizeMode.value = 2;
  canvas.renderAll();
  // resetCanvas()
  addHistorySnapshot();
};

// Modify canvas height
const changeTemplateHeight = () => {
  const [canvas] = useCanvas();
  const workSpaceDraw = canvas
    .getObjects()
    .filter((item) => item.id === WorkSpaceDrawType)[0];
  if (!workSpaceDraw) return;
  const ratio = currentTemplate.value.height / currentTemplate.value.width;
  let { width, height } = getCanvasSize();
  if (height / zoom.value < mm2px(MinSize)) {
    toast({
      title: 'Warning',
      description: `The Minimum size limit is ${MinSize}mm`,
      variant: 'destructive'
    });
    height = mm2px(MinSize) * zoom.value;
  }
  if (height / zoom.value > mm2px(MaxSize)) {
    toast({
      title: 'Warning',
      description: `The Maximum size limit is ${MaxSize}mm`,
      variant: 'destructive'
    });
    height = mm2px(MaxSize) * zoom.value;
  }
  width = isFixed.value ? height / ratio : width;
  workSpaceDraw.set({ width: width / zoom.value, height: height / zoom.value });
  templatesStore.setSize(width, height, zoom.value);
  sizeMode.value = 2;
  canvas.renderAll();
  // resetCanvas()
  addHistorySnapshot();
};

// Modify bleed size
const changeTemplateClip = async () => {
  templatesStore.setClip(clip.value);
  const { initCommon } = useCommon();
  initCommon();
  const [canvas] = useCanvas();
  canvas?.renderAll();
};

// Modify safe margin
const changeTemplateSafe = async () => {
  safe.value = Number(safe.value);
  const { initCommon } = useCommon();
  initCommon();
  const [canvas] = useCanvas();
  canvas?.renderAll();
};

// Toggle fixed aspect ratio
const changeFixedRatio = (fixedStatus: boolean) => {
  isFixed.value = fixedStatus;
};

// Toggle corner radius
const changeWorkRound = (roundStatus: boolean) => {
  const [canvas] = useCanvas();
  const workSpaceclip = canvas
    .getObjects()
    .filter(
      (item) => WorkSpaceClipType === item.id && item.isType("Rect")
    )[0] as Rect;
  let rx = 0,
    ry = 0;
  isRound.value = roundStatus;
  if (isRound.value) rx = ry = 10;
  workSpaceclip.set({ rx, ry });
  canvas.renderAll();
};

// Modify dimension unit
const changeUnitMode = async () => {
  const width = currentTemplate.value.width / currentTemplate.value.zoom;
  const heigth = currentTemplate.value.height / currentTemplate.value.zoom;
  if (unitMode.value === 0) {
    canvasWidth.value = px2mm(width);
    canvasHeight.value = px2mm(heigth);
    clip.value = 2;
    safe.value = 3;
  } else {
    canvasWidth.value = width;
    canvasHeight.value = heigth;
    clip.value = safe.value = 0;
  }
  await changeTemplateClip();
  await changeTemplateSafe();
};

// React to unit changes from anywhere (settings modal, sidebar select, etc.)
watch(unitMode, changeUnitMode);



// Load recently added grids from cache
onMounted(() => {
  const recentGridCache = localStorage.getItem(RECENT_GRIDS);
  if (recentGridCache) gridColorRecent.value = JSON.parse(recentGridCache);
});

// Save recently added grids to cache
watch(
  gridColorRecent,
  () => {
    const recentGridCache = JSON.stringify(gridColorRecent.value);
    localStorage.setItem(RECENT_GRIDS, recentGridCache);
  },
  { deep: true }
);

const changeMaskOpacity = () => {
  const [canvas] = useCanvas();
  const workMask = canvas
    .getObjects()
    .filter((ele) => ele.id === WorkSpaceMaskType)[0];
  if (!workMask) return;
  workMask.set("opacity", opacity.value);
  canvas.renderAll();
};
</script>