<template>
  <div :class="embedded ? 'space-y-2' : 'space-y-2.5'">
    <!-- Fill Type Section -->
    <div :class="embedded ? 'space-y-2' : 'space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20'">
      <div v-if="!embedded" class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Fill
        </h3>
      </div>

      <div class="grid grid-cols-2 gap-2">
  <Select v-model="background.fillType" @update:model-value="(v) => changeBackgroundType(Number(v))">
          <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
            <SelectValue placeholder="Fill type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in BackgroundFillMode" :key="item.id" :value="item.id" class="text-xs py-1">
              {{ item.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Solid Color -->
        <Popover v-if="background.fillType === 0">
          <PopoverTrigger as-child>
                  <Button variant="outline" class="h-7 text-xs justify-start px-2 transition-all border-border/60 bg-background hover:bg-accent hover:text-accent-foreground">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: solidFill }"></div>
                <span class="text-xs font-mono">{{ toHex(solidFill) }}</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[256px]" align="end">
            <ColorPicker :modelValue="String(background.fill)" @update:modelValue="(color: string) => updateBackground({color: color, fill: color})" />
          </PopoverContent>
        </Popover>

        <!-- Image Size -->
  <Select v-else-if="background.fillType === 1" v-model="background.imageSize" @update:model-value="() => changeImageSize()">
          <SelectTrigger class="h-7 text-[11px] border border-border/60 shadow-none hover:bg-accent">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in BackgroundFillImageMode" :key="item.id" :value="item.id" class="text-xs py-1">
              {{ item.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Gradient Type -->
  <Select v-else-if="background.fillType === 2" v-model="background.gradientType" @update:model-value="() => changeGradientType()">
          <SelectTrigger class="h-7 text-[11px] border border-border/60 bg-background shadow-none hover:bg-accent">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in BackgroundFillGradientMode" :key="item.id" :value="item.value" class="text-xs py-1">
              {{ item.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Grid Mode -->
  <Select v-else-if="background.fillType === 3" v-model="gridColorMode" @update:model-value="(v) => changeGridColorMode(String(v) as any)">
          <SelectTrigger class="h-7 text-[11px] border border-border/60 bg-background shadow-none hover:bg-accent">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in BackgroundFillGridMode" :key="item.id" :value="item.value" class="text-xs py-1">
              {{ item.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Image Upload -->
    <div v-if="background.fillType === 1" :class="embedded ? 'space-y-2' : 'space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20'">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Image
        </h3>
      </div>
      
      <FileInput @change="(files: FileList) => uploadBackgroundImage(files)">
        <div class="relative group rounded-md border-2 border-dashed border-border hover:border-primary transition-all overflow-hidden bg-muted/30" style="padding-bottom: 56.25%;">
          <div class="absolute inset-0 flex items-center justify-center" :style="background.imageURL ? { backgroundImage: `url(${background.imageURL})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}">
            <div v-if="!background.imageURL" class="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <ImagePlus class="h-8 w-8" />
              <span class="text-xs font-medium">Click to upload</span>
            </div>
          </div>
        </div>
      </FileInput>
    </div>

    <!-- Gradient Fill -->
    <div v-if="background.fillType === 2" :class="embedded ? 'space-y-2' : 'space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20'">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Gradient
        </h3>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">{{ background.gradientType }}</Badge>
      </div>

      <div class="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
        <div v-for="(item, nameIndex) in GradientColorLibs" :key="nameIndex">
          <button 
            class="h-7 rounded-md border-2 transition-all hover:scale-105 hover:border-primary dark:border-gray-600/50 "
            :class="background.gradientName === item.name ? 'border-primary ring-2 ring-primary/20' : 'border-border'"
            @click.stop="changeGradientName(item.name)"
          >
            <GradientFill :name="item.name" :type="background.gradientType" :colors="item.colors" />
          </button>
        </div>
      </div>

      <Separator class="my-2" />

      <!-- Opacity Slider -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center justify-between">
          <span class="flex items-center gap-1"><Blend class="h-2.5 w-2.5" />Opacity</span>
          <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-mono">{{ gradientOpacity }}</Badge>
        </Label>
        <SliderWithTicks 
          :min="0" 
          :max="1" 
          :step="0.01" 
          :model-value="[gradientOpacity]" 
          @update:model-value="handleGradientOpacityUpdate"
          class="py-1"
        />
      </div>

      <!-- Angle Slider (Linear only) -->
      <div v-if="background.gradientType === 'linear'" class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center justify-between">
          <span class="flex items-center gap-1"><RotateCw class="h-2.5 w-2.5" />Angle</span>
          <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-mono">{{ gradientRotate }}°</Badge>
        </Label>
        <SliderWithTicks 
          :min="0" 
          :max="360" 
          :step="1" 
          :model-value="[gradientRotate]" 
          @update:model-value="handleGradientRotateUpdate"
          class="py-1"
        />
      </div>

      <!-- Offset X Slider -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center justify-between">
          <span class="flex items-center gap-1"><MoveHorizontal class="h-2.5 w-2.5" />Offset X</span>
          <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-mono">{{ gradientOffsetX.toFixed(2) }}</Badge>
        </Label>
        <SliderWithTicks 
          :min="0" 
          :max="1" 
          :step="0.01" 
          :model-value="[gradientOffsetX]" 
          @update:model-value="handleGradientOffsetXUpdate"
          class="py-1"
        />
      </div>

      <!-- Offset Y Slider -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center justify-between">
          <span class="flex items-center gap-1"><MoveVertical class="h-2.5 w-2.5" />Offset Y</span>
          <Badge variant="secondary" class="text-[10px] px-1.5 py-0 font-mono">{{ gradientOffsetY.toFixed(2) }}</Badge>
        </Label>
        <SliderWithTicks 
          :min="0" 
          :max="1" 
          :step="0.01" 
          :model-value="[gradientOffsetY]" 
          @update:model-value="handleGradientOffsetYUpdate"
          class="py-1"
        />
      </div>

      <Separator class="my-2" />

      <!-- Color Stops -->
      <div class="flex gap-1.5">
        <div v-for="(item, index) in background.gradientColor" :key="index" class="flex-1">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="h-8 w-full px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: item.color || '#fff' }"></div>
                  <span class="text-[10px] font-mono">{{ toHex(item.color || '#fff') }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker :modelValue="item.color" @update:modelValue="(color: string) => updateGradientBackground(index, color)" />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>

  <!-- Grid Fill -->
    <div v-if="background.fillType === 3" :class="embedded ? 'space-y-2' : 'space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20'">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Grid Fill
        </h3>
      </div>

      <!-- Strength Slider -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center justify-between">
          <span class="flex items-center gap-1"><GripHorizontal class="h-2.5 w-2.5" />Strength</span>
          <span class="text-muted-foreground font-mono">{{ gridStrengthRef.toFixed(2) }}</span>
        </Label>
        <SliderWithTicks 
          :model-value="[gridStrengthRef]"
          @update:model-value="(v) => changeGridStrength(v)"
          :min="0"
          :max="1"
          :step="0.01"
          class="py-1"
        />
      </div>

      <!-- Variance Slider -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center justify-between">
          <span class="flex items-center gap-1"><GitCompare class="h-2.5 w-2.5" />Variance</span>
          <span class="text-muted-foreground font-mono">{{ gridVarianceRef.toFixed(2) }}</span>
        </Label>
        <SliderWithTicks 
          :model-value="[gridVarianceRef]"
          @update:model-value="(v) => changeGridVariance(v)"
          :min="0"
          :max="1"
          :step="0.01"
          class="py-1"
        />
      </div>

      <!-- Size Slider -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center justify-between">
          <span class="flex items-center gap-1"><Maximize class="h-2.5 w-2.5" />Size</span>
          <span class="text-muted-foreground font-mono">{{ gridSizeRef.toFixed(2) }}</span>
        </Label>
        <SliderWithTicks 
          :model-value="[gridSizeRef]"
          @update:model-value="(v) => changeGridSize(v)"
          :min="0.1"
          :max="0.25"
          :step="0.01"
          class="py-1"
        />
      </div>

      <Separator class="my-2" />

      <!-- Random Button -->
      <Button variant="outline" class="w-full h-7 text-[10px]" @click="generateGridBackgroundRandom">
        <Shuffle class="w-3 h-3 mr-1" />
        Random
      </Button>

      <!-- Color Select / Customize Toggle -->
      <div class="flex gap-1">
        <Button 
          :variant="isGridLibData ? 'default' : 'outline'" 
          class="flex-1 text-[10px] h-6 px-2"
          @click="isGridLibData = true"
        >
          Color Select
        </Button>
        <Button 
          :variant="!isGridLibData ? 'default' : 'outline'" 
          class="flex-1 text-[10px] h-6 px-2"
          @click="isGridLibData = false"
        >
          Customize
        </Button>
        <Button 
          v-if="isGridLibData" 
          variant="outline" 
          class="h-6 w-6 p-0 flex-shrink-0" 
          @click="generateGridBackgroundRandColor"
          title="Random Colors"
        >
          <Shuffle class="w-3 h-3" />
        </Button>
        <Button 
          v-else 
          variant="outline" 
          class="h-6 w-6 p-0 flex-shrink-0" 
          @click="showGridColorSelf"
          title="Add Custom Colors"
        >
          <ImagePlus class="w-3 h-3" />
        </Button>
      </div>

      <!-- Color Library -->
      <div v-if="isGridLibData" class="space-y-1.5 max-h-[150px] overflow-y-auto">
        <div 
          v-for="(item, index) in GridColorLibs" 
          :key="index"
          class="flex gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          @click="changeGridColor(item.color)"
        >
          <div 
            v-for="color in item.color" 
            :key="color" 
            class="flex-1 h-6 rounded border border-border/50 hover:border-primary transition-colors"
            :style="{ backgroundColor: color }"
          ></div>
        </div>
      </div>

      <!-- Recent Custom Colors -->
      <div v-else class="space-y-1.5 max-h-[150px] overflow-y-auto">
        <div 
          v-for="(item, index) in gridColorRecent" 
          :key="index"
          v-if="item.length > 0"
          class="flex gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          @click="changeGridColor(item)"
        >
          <div 
            v-for="color in item" 
            :key="color" 
            class="flex-1 h-6 rounded border border-border/50 hover:border-primary transition-colors"
            :style="{ backgroundColor: color }"
          ></div>
        </div>
      </div>
    </div>


    <GridFill v-model:visible="gridColorDialog" @close="hideGridColorSelf" @save="saveGridColorSelf"></GridFill>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onActivated } from "vue";
import { useMainStore, useTemplatesStore } from "@/store";
import { storeToRefs } from "pinia";
import { debounce } from "lodash-es";
import { Gradient, Pattern, util } from "fabric";
import { TransparentFill, BackgroundFillMode, BackgroundFillImageMode, BackgroundFillGridMode, BackgroundFillGradientMode } from "@/configs/background";
import { GridColorLibs } from "@/configs/colorGrid";
import { GradientColorLibs } from "@/configs/colorGradient";

import { GradientCoords } from "@/types/elements";

import { BackgroundElement, CanvasElement, TextboxElement } from "@/types/canvas";
import { getRandomNum } from "@/utils/common";
import { getImageDataURL } from "@/utils/image";
import trianglify from "@/plugins/trianglify/trianglify";
import useCanvas from "@/views/Canvas/useCanvas";
import GridFill from "./GridFill.vue";
import GradientFill from "./GradientFill.vue";
import ColorPicker from "@/components/ColorPicker/index.vue";
import { toHex } from "@/utils/color";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import SliderWithTicks from "@/components/ui/slider/SliderWithTicks.vue";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Paintbrush, ImagePlus, Shuffle, RotateCw, MoveHorizontal, MoveVertical, GripHorizontal, GitCompare, Maximize, Blend } from "lucide-vue-next";

defineProps<{
  embedded?: boolean
}>()

const mainStore = useMainStore();
const templatesStore = useTemplatesStore();
const { canvasObject } = storeToRefs(mainStore);

// Gradient offsets
const gradientOpacity = ref(1);
const gradientRotate = ref(0);
const gradientOffsetX = ref(0);
const gradientOffsetY = ref(0);

// Grid predefined parameters
const RECENT_GRIDS = "RECENT_GRIDS";
const gridColorRecent = ref<[string[]]>([[]]);
const isGridLibData = ref(true);
const gridColorMode = ref<"interpolateLinear" | "sparkle" | "shadows">("sparkle");
const gridSizeRef = ref(0.15);
const gridColorsRef = ref<string[]>(GridColorLibs[0].color);
const gridStrengthRef = ref(0.5);
const gridVarianceRef = ref(0.5);
const gridColorDialog = ref(false);



// Load recently added grid cache
onMounted(() => {
  const recentGridCache = localStorage.getItem(RECENT_GRIDS);
  if (recentGridCache) gridColorRecent.value = JSON.parse(recentGridCache);
});

// Save recently added grid cache
watch(gridColorRecent, () => {
  const recentGridCache = JSON.stringify(gridColorRecent.value);
  localStorage.setItem(RECENT_GRIDS, recentGridCache);
}, 
{ deep: true }
);

const handleElement = computed(() => {
  gradientOpacity.value = canvasObject.value?.opacity ?? 1
  // canvasObject.value.fill can be string | Pattern | Gradient - narrow before accessing props
  const fill = (canvasObject.value as any)?.fill
  if (fill && typeof fill !== 'string') {
    gradientRotate.value = fill.gradientRotate ?? 0
    const w = (canvasObject.value as any)?.width ?? 1
    const h = (canvasObject.value as any)?.height ?? 1
    gradientOffsetX.value = (fill.offsetX ?? 0) / w
    gradientOffsetY.value = (fill.offsetY ?? 0) / h
  } else {
    gradientRotate.value = 0
    gradientOffsetX.value = 0
    gradientOffsetY.value = 0
  }
  return canvasObject.value as CanvasElement;
});

const background = computed(() => {
  if (!handleElement.value) {
    return {
      fillType: 0,
      fill: "#fff",
    } as BackgroundElement;
  }
  if (!handleElement.value.background) {
    return {
      fillType: 0,
      fill: handleElement.value.fill,
      color: (handleElement.value as TextboxElement).color,
    } as BackgroundElement;
  }
  return handleElement.value.background;
});

// derived string color for components that expect a string
const solidFill = computed(() => {
  const f = (background.value as any).fill
  if (typeof f === 'string') return f
  return (background.value as any).color || '#ffffff'
})

// Hide background image element
const removeBackgroundElement = () => {
  const [canvas] = useCanvas();
  canvas.set("backgroundImage", null);
  canvas.renderAll();
};

// Set background type: solid, image, gradient, grid
const changeBackgroundType = (type: number) => {
  // Solid color
  if (type === 0) {
    const elementBackground: BackgroundElement = {
      ...background.value,
      fillType: type,
      fill: background.value.color || "#fff",
    };
    updateBackground(elementBackground);
  }
  // Image
  else if (type === 1) {
    const elementBackground: BackgroundElement = {
      ...background.value,
      fillType: type,
      fill: background.value.fill,
      imageURL: background.value.imageURL || "",
      imageSize: background.value.imageSize || "cover",
    };
    updateBackground(elementBackground);
    generateImageBackground();
  }
  // Grid
  else if (type === 3) {
    const elementBackground: BackgroundElement = {
      ...background.value,
      fillType: type,
      fill: background.value.fill,
      gaidImageURL: background.value.gaidImageURL || "",
    };
    updateBackground(elementBackground);
    generateGridBackground();
  }
  // Gradient
  else {
    const elementBackground: BackgroundElement = {
      ...background.value,
      fillType: 2,
      gradientType: background.value.gradientType || "linear",
      gradientColor: background.value.gradientColor || GradientColorLibs[0].colors,
      gradientName: background.value.gradientName || GradientColorLibs[0].name,
    };
    updateBackground(elementBackground);
    generateGradientBackground();
  }
};

// Set background
const updateBackground = (props: Partial<BackgroundElement>) => {
  const [canvas] = useCanvas();
  if (!canvasObject.value) return;
  const color = props.color ? props.color : (handleElement.value as TextboxElement).color;
  const opacity = props.opacity !== undefined ? props.opacity : 1
  // canvasObject.value.set({ fill: props.fill, color, fillType: background.value.fillType, background: { ...background.value, ...props }, opacity });
  canvas.renderAll();
  templatesStore.modifedElement(canvasObject.value, { fill: props.fill, color, fillType: background.value.fillType, background: { ...background.value, ...props }, opacity: opacity ? opacity : 1 });
};

// Update uploaded background
const generateImageBackground = async () => {
  const imageURL = background.value.imageURL;
  if (!imageURL) return;
  if (background.value.imageSize === "repeat") {
    const source = await util.loadImage(imageURL);
    const elementPattern = new Pattern({ source, repeat: "repeat" });
    updateBackground({ fill: elementPattern, imageURL });
  } else {
    const source = await util.loadImage(imageURL);
    // const { width, height } = await getImageSize(imageURL)
    if (!handleElement.value) return;
    // source.width = handleElement.value.width
    // source.height = handleElement.value.height
    // source.style.width = handleElement.value.width + 'px'
    // source.style.height = handleElement.value.height + 'px'
    // source.style.transform = 'scale(0.1)'
    const elementPattern = new Pattern({ source, repeat: "no-repeat" });
    updateBackground({ fill: elementPattern, imageURL });
  }
};

// Upload background image
const uploadBackgroundImage = async (files: FileList) => {
  const imageFile = files[0];
  if (!imageFile) return;
  background.value.imageURL = await getImageDataURL(imageFile);
  generateImageBackground();
};

// Change image size
const changeImageSize = () => {
  generateImageBackground();
};

// Change gradient name
const changeGradientName = (gradientName: string) => {
  const gradientColorLib = GradientColorLibs.filter((item) => item.name === gradientName)[0];
  if (gradientColorLib) {
    background.value.gradientName = gradientName;
    updateBackground({ gradientColor: gradientColorLib.colors });
    generateGradientBackground();
  }
};

// Change gradient type
const changeGradientType = () => {
  updateBackground({ gradientType: background.value.gradientType });
  generateGradientBackground();
};

// Update gradient color
const updateGradientBackground = (index: number, color: string) => {
  const gradientBackgroundColor = background.value.gradientColor;
  if (gradientBackgroundColor) {
    gradientBackgroundColor[index].color = color;
    updateBackground({ gradientColor: gradientBackgroundColor });
    generateGradientBackground();
  }
};

// Calculate rotated gradient coordinates
const rotateRectangle = (width: number, height: number, gradientRotate: number) => {
  const proportion = (gradientRotate % 180) / 180;
  let x1 = width * proportion;
  let x2 = width - x1;
  const y1 = gradientRotate <= 180 ? 0 : height;
  const y2 = height - y1;
  if (gradientRotate >= 180) {
    [x2, x1] = [x1, x2];
  }
  // Return rotated coordinates
  return { x1, y1, x2, y2 };
};

// Generate gradient background
const generateGradientBackground = () => {
  if (!handleElement.value) return;
  const width = handleElement.value.width;
  const height = handleElement.value.height;
  let coords: GradientCoords = { x1: 0, y1: 0, x2: width, y2: 0 };
  if (background.value.gradientType !== "linear") {
    coords = { r1: 0, r2: height / 2, x1: width / 2, y1: height / 2, x2: width / 2, y2: height / 2 };
  } else {
    coords = rotateRectangle(width, height, gradientRotate.value);
  }
  const rotateCos = Math.cos((gradientRotate.value * Math.PI) / 180.0);
  const rotateSin = Math.sin((gradientRotate.value * Math.PI) / 180.0);
  const gradient = new Gradient({
    type: background.value.gradientType,
    colorStops: background.value.gradientColor || GradientColorLibs[0].colors,
    coords: coords,
    offsetX: gradientOffsetX.value * width,
    offsetY: gradientOffsetY.value * height,
    gradientUnits: "pixels",
    gradientTransform: [rotateCos, rotateSin, -1 * rotateSin, rotateCos, 0, 0],
  });
  ;(gradient as any).gradientRotate = gradientRotate.value;

  updateBackground({ fill: gradient, opacity: gradientOpacity.value });
};

// Slider handlers (accept Arrayable<number>)
const handleGradientOpacityUpdate = (val: number | number[] | undefined) => {
  if (!val) return
  const v = Array.isArray(val) ? val[0] : val
  gradientOpacity.value = v as number
  generateGradientBackground()
}

const handleGradientRotateUpdate = (val: number | number[] | undefined) => {
  if (!val) return
  const v = Array.isArray(val) ? val[0] : val
  gradientRotate.value = v as number
  generateGradientBackground()
}

const handleGradientOffsetXUpdate = (val: number | number[] | undefined) => {
  if (!val) return
  const v = Array.isArray(val) ? val[0] : val
  gradientOffsetX.value = v as number
  generateGradientBackground()
}

const handleGradientOffsetYUpdate = (val: number | number[] | undefined) => {
  if (!val) return
  const v = Array.isArray(val) ? val[0] : val
  gradientOffsetY.value = v as number
  generateGradientBackground()
}

// Update recent grid cache (keep max length)
const updateGridColorRecentCache = debounce(
  function () {
    const maxLength = 10;
    if (gridColorRecent.value.length > maxLength) {
      gridColorRecent.value = gridColorRecent.value.slice(0, maxLength) as [string[]];
    }
  },
  300,
  { trailing: true }
);

// Change grid image strength
const changeGridStrength = (value: number | number[]) => {
  const v = Array.isArray(value) ? value[0] : value;
  gridStrengthRef.value = v as number;
  generateGridBackground();
};
// Change grid variance
const changeGridVariance = (value: number | number[]) => {
  const v = Array.isArray(value) ? value[0] : value;
  gridVarianceRef.value = v as number;
  generateGridBackground();
};
// Change grid size
const changeGridSize = (value: number | number[]) => {
  const v = Array.isArray(value) ? value[0] : value;
  gridSizeRef.value = v as number;
  generateGridBackground();
};

// Generate random grid values
const generateGridBackgroundRandom = () => {
  gridStrengthRef.value = Math.floor(getRandomNum(0, 1) * 100) / 100;
  gridVarianceRef.value = Math.floor(getRandomNum(0, 1) * 100) / 100;
  gridSizeRef.value = Math.floor(getRandomNum(0, 0.25) * 100) / 100;
  generateGridBackground();
};

// Generate grid with random colors
const generateGridBackgroundRandColor = () => {
  generateGridBackground("random");
};

// Show custom grid color dialog
const showGridColorSelf = () => {
  gridColorDialog.value = true;
};
// Hide custom grid color dialog
const hideGridColorSelf = () => {
  gridColorDialog.value = false;
};

// Save custom grid colors
const saveGridColorSelf = (colors: string[]) => {
  gridColorRecent.value.unshift(colors);
  updateGridColorRecentCache();
};

// Select grid colors
const changeGridColor = (colors: string[]) => {
  gridColorsRef.value = colors;
  generateGridBackground();
};

// Select grid color mode
const changeGridColorMode = (mode: "interpolateLinear" | "sparkle" | "shadows") => {
  gridColorMode.value = mode;
  generateGridBackground();
};

// Get grid color function
const getGridColorFunction = () => {
  if (gridColorMode.value === "interpolateLinear") {
    return trianglify.colorFunctions.interpolateLinear(gridStrengthRef.value);
  } else if (gridColorMode.value === "sparkle") {
    return trianglify.colorFunctions.sparkle(gridStrengthRef.value);
  } else if (gridColorMode.value === "shadows") {
    return trianglify.colorFunctions.shadows(gridStrengthRef.value);
  }
  return trianglify.colorFunctions.sparkle(gridStrengthRef.value);
};

// Generate grid image
const generateGridBackground = async (status?: string) => {
  if (!handleElement.value) return;
  const width = handleElement.value.width,
    height = handleElement.value.height;
  const gridColors = gridColorsRef.value && gridColorsRef.value.length > 0 && status !== "random" ? gridColorsRef.value : "random";

  const defaultOptions = {
    width,
    height,
    cellSize: gridSizeRef.value * width,
    variance: gridVarianceRef.value,
    seed: null,
    xColors: gridColors,
    yColors: "match",
    fill: true,
    palette: trianglify.utils.colorbrewer,
    colorSpace: "lab",
    colorFunction: getGridColorFunction(),
    strokeWidth: 0,
    points: null,
  };
  const trianglifier = trianglify(defaultOptions);
  const canvas = document.createElement('canvas')
  const canvasBackground = trianglifier.toCanvas(canvas, {});
  const dataURL = canvasBackground.toDataURL("image/svg");
  const source = await util.loadImage(dataURL);
  const elementPattern = new Pattern({ source, repeat: "repeat" });
  updateBackground({ fill: elementPattern, gaidImageURL: dataURL });
};
</script>

<style lang="scss" scoped>
// Minimal styles - using Tailwind/shadcn for most styling
</style>



