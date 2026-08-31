<template>
  <div class="space-y-2">
    <!-- Fill Type Selection -->
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Background
        </h3>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <!-- Color picker on left for popover overflow -->
        <div class="space-y-1" v-if="background.fillType === 0">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Palette class="h-2.5 w-2.5" />Color</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="h-7 px-2 w-full justify-start transition-all">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: background.color || '#fff' }"></div>
                  <span class="text-xs font-mono">{{ toHex(background.color || '#fff') }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker
                :modelValue="background.color"
                @update:modelValue="(color: string) => updateBackground({color: color, fill: color})"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div class="space-y-1" v-else-if="background.fillType === 1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Maximize class="h-2.5 w-2.5" />Size</Label>
          <Select v-model="background.imageSize" @update:model-value="changeImageSize">
            <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="item in BackgroundFillImageMode" 
                :key="item.id" 
                :value="item.id"
                class="text-xs py-1"
              >
                {{ item.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1" v-else-if="background.fillType === 2">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Paintbrush class="h-2.5 w-2.5" />Type</Label>
          <Select v-model="background.gradientType" @update:model-value="changeGradientType">
            <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="item in BackgroundFillGradientMode" 
                :key="item.id" 
                :value="item.value"
                class="text-xs py-1"
              >
                {{ item.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1" v-else-if="background.fillType === 3">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><SlidersHorizontal class="h-2.5 w-2.5" />Mode</Label>
          <Select v-model="gridColorMode" @update:model-value="(val) => val && changeGridColorMode(val as 'interpolateLinear' | 'sparkle' | 'shadows')">
            <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="item in BackgroundFillGridMode" 
                :key="item.id" 
                :value="item.value"
                class="text-xs py-1"
              >
                {{ item.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Fallback empty left cell when no match -->
        <div v-else></div>

        <!-- Mode always on right -->
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><SlidersHorizontal class="h-2.5 w-2.5" />Mode</Label>
          <Select v-model="background.fillType" @update:model-value="(val) => val !== undefined && changeBackgroundType(val as number)">
            <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="item in BackgroundFillMode" 
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

    <Separator />

    <!-- Image Fill -->
    <div v-if="background.fillType === 1">
      <FileInput @change="(files: FileList) => uploadBackgroundImage(files)">
        <div class="background-image">
          <div
            class="content"
            :style="{ backgroundImage: `url(${background.imageURL})` }"
          >
            <IconPlus />
          </div>
        </div>
      </FileInput>
    </div>

    <!-- Gradient Fill -->
    <div v-if="background.fillType === 2" class="space-y-2">
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
      
      <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Blend class="h-2.5 w-2.5" />Opacity</Label>
            <span class="text-[10px] text-muted-foreground font-mono">{{ gradientOpacity.toFixed(2) }}</span>
          </div>
          <Slider
            :min="0"
            :max="1"
            :step="0.01"
            :model-value="[gradientOpacity]"
            @update:model-value="(val) => { if(val?.[0] !== undefined) { gradientOpacity = val[0]; generateGradientBackground(); } }"
          />
        </div>
      </div>

      <div v-if="background.gradientType === 'linear'" class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><RotateCw class="h-2.5 w-2.5" />Angle</Label>
            <span class="text-[10px] text-muted-foreground font-mono">{{ gradientRotate }}°</span>
          </div>
          <Slider
            :min="0"
            :max="360"
            :step="1"
            :model-value="[gradientRotate]"
            @update:model-value="(val) => { if(val?.[0] !== undefined) { gradientRotate = val[0]; generateGradientBackground(); } }"
          />
        </div>
      </div>

      <div v-if="background.gradientType === 'linear'" class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><MoveHorizontal class="h-2.5 w-2.5" />Offset X</Label>
            <span class="text-[10px] text-muted-foreground font-mono">{{ gradientOffsetX.toFixed(2) }}</span>
          </div>
          <Slider
            :min="0"
            :max="1"
            :step="0.01"
            :model-value="[gradientOffsetX]"
            @update:model-value="(val) => { if(val?.[0] !== undefined) { gradientOffsetX = val[0]; generateGradientBackground(); } }"
          />
        </div>
      </div>

      <div v-else class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><MoveHorizontal class="h-2.5 w-2.5" />Offset X</Label>
            <span class="text-[10px] text-muted-foreground font-mono">{{ gradientOffsetX.toFixed(2) }}</span>
          </div>
          <Slider
            :min="0"
            :max="1"
            :step="0.01"
            :model-value="[gradientOffsetX]"
            @update:model-value="(val) => { if(val?.[0] !== undefined) { gradientOffsetX = val[0]; generateGradientBackground(); } }"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><MoveVertical class="h-2.5 w-2.5" />Offset Y</Label>
            <span class="text-[10px] text-muted-foreground font-mono">{{ gradientOffsetY.toFixed(2) }}</span>
          </div>
          <Slider
            :min="0"
            :max="1"
            :step="0.01"
            :model-value="[gradientOffsetY]"
            @update:model-value="(val) => { if(val?.[0] !== undefined) { gradientOffsetY = val[0]; generateGradientBackground(); } }"
          />
        </div>
      </div>

      <div class="flex gap-1">
        <div
          v-for="(item, index) in background.gradientColor"
          :key="index"
          class="flex-1"
        >
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="h-7 w-full px-2 justify-start transition-all">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: item.color || '#fff' }"></div>
                  <span class="text-[10px] font-mono">{{ toHex(item.color || '#fff') }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker
                :modelValue="item.color"
                @update:modelValue="(color: string) => updateGradientBackground(index, color)"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>

    <!-- Grid Fill --><div v-if="background.fillType === 3" class="space-y-2">
      <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Strength</Label>
            <span class="text-[10px] text-muted-foreground font-mono">{{ gridStrengthRef.toFixed(2) }}</span>
          </div>
          <Slider
            :min="0"
            :max="1"
            :step="0.01"
            :model-value="[gridStrengthRef]"
            @update:model-value="(val) => val?.[0] !== undefined && changeGridStrength(val[0])"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Variance</Label>
            <span class="text-[10px] text-muted-foreground font-mono">{{ gridVarianceRef.toFixed(2) }}</span>
          </div>
          <Slider
            :min="0"
            :max="1"
            :step="0.01"
            :model-value="[gridVarianceRef]"
            @update:model-value="(val) => val?.[0] !== undefined && changeGridVariance(val[0])"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Size</Label>
            <span class="text-[10px] text-muted-foreground font-mono">{{ gridSizeRef.toFixed(2) }}</span>
          </div>
          <Slider
            :min="0.1"
            :max="0.25"
            :step="0.01"
            :model-value="[gridSizeRef]"
            @update:model-value="(val) => val?.[0] !== undefined && changeGridSize(val[0])"
          />
        </div>
      </div>

      <Button variant="outline" class="w-full h-7 text-[10px]" @click="generateGridBackgroundRandom">
        <IconShuffleOne class="w-3 h-3 mr-1" />
        Random
      </Button>

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
          variant="outline"
          class="h-6 w-6 p-0 flex-shrink-0"
          v-if="isGridLibData"
          @click="generateGridBackgroundRandColor"
          title="Random Colors"
        >
          <IconShuffleOne class="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          class="h-6 w-6 p-0 flex-shrink-0"
          v-else
          @click="showGridColorSelf"
          title="Add Custom Colors"
        >
          <IconPlus class="w-3 h-3" />
        </Button>
      </div>
      <div class="mt-10" v-if="isGridLibData">
        <div
          class="row color-contianer"
          v-for="(item, index) in GridColorLibs"
          :key="index"
        >
          <div
            v-for="color in item.color"
            :key="color"
            class="color-box"
            :style="{ backgroundColor: color }"
            @click="changeGridColor(item.color)"
          ></div>
        </div>
      </div>
      <div class="mt-10" v-else>
        <div
          :class="[item.length > 0 ? 'row' : '', 'color-contianer']"
          v-for="(item, index) in gridColorRecent"
          :key="index"
        >
          <div
            v-for="color in item"
            :key="color"
            class="color-box"
            :style="{ backgroundColor: color }"
            @click="changeGridColor(item)"
          ></div>
        </div>
      </div>
    </div>

    <GridFill
      v-model:visible="gridColorDialog"
      @close="hideGridColorSelf"
      @save="saveGridColorSelf"
    ></GridFill>

    <Button 
      @click="changeAllBackgroud" 
      class="w-full h-7 text-[11px] font-semibold"
      variant="outline"
    >
      <span class="flex items-center gap-1.5">
        <Layers class="h-3.5 w-3.5" />
        Apply To All Pages
      </span>
    </Button>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from "vue";
import { useMainStore, useTemplatesStore } from "@/store";
import { storeToRefs } from "pinia";
import { debounce } from "lodash-es";
import { Gradient, Pattern, Image, util } from "fabric";
import {
  TransparentFill,
  BackgroundFillMode,
  BackgroundFillImageMode,
  BackgroundFillGridMode,
  BackgroundFillGradientMode,
} from "@/configs/background";
import { GridColorLibs } from "@/configs/colorGrid";
import { GradientColorLibs } from "@/configs/colorGradient";
import { GradientCoords } from "@/types/elements";
import { WorkSpaceDrawType, propertiesToInclude } from "@/configs/canvas";
import { ImageElement, WorkSpaceElement } from "@/types/canvas";
import { getImageDataURL } from "@/utils/image";
import trianglify from "@/plugins/trianglify/trianglify";
import useCanvas from "@/views/Canvas/useCanvas";
import GridFill from "./GridFill.vue";
import GradientFill from "./GradientFill.vue";
import useHandleBackground from "@/hooks/useHandleBackground";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import SliderWithTicks from "@/components/ui/slider/SliderWithTicks.vue";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ColorPicker from "@/components/ColorPicker/index.vue";
import { toHex } from "@/utils/color";
import { Palette, Paintbrush, Maximize, SlidersHorizontal, Blend, RotateCw, MoveHorizontal, MoveVertical, Layers } from 'lucide-vue-next';

const templatesStore = useTemplatesStore();
const { setBackgroudImage } = useHandleBackground();
const { currentTemplate } = storeToRefs(templatesStore);

// Gradient offset parameters
const gradientOpacity = ref(1);
const gradientRotate = ref(0);
const gradientOffsetX = ref(0);
const gradientOffsetY = ref(0);

// Grid predefined parameters
const RECENT_GRIDS = "RECENT_GRIDS";
const gridColorRecent = ref<[string[]]>([[]]);
const isGridLibData = ref(true);
const gridColorMode = ref<"interpolateLinear" | "sparkle" | "shadows">(
  "sparkle"
);
const gridSizeRef = ref(0.15);
const gridColorsRef = ref<string[]>(GridColorLibs[0].color);
const gridStrengthRef = ref(0.5);
const gridVarianceRef = ref(0.5);
const gridColorDialog = ref(false);



// Load cached recent grids
onMounted(() => {
  const recentGridCache = localStorage.getItem(RECENT_GRIDS);
  if (recentGridCache) gridColorRecent.value = JSON.parse(recentGridCache);
});

const background = computed(() => {
  if (!currentTemplate.value) {
    return {
      fillType: 0,
      fill: TransparentFill,
      backgroundColor: "#fff",
    } as WorkSpaceElement;
  }
  if (!currentTemplate.value.workSpace) {
    return {
      fillType: 0,
      fill: TransparentFill,
      backgroundColor: "#fff",
    } as WorkSpaceElement;
  }
  return currentTemplate.value.workSpace;
});

// Hide background image
const removeBackgroundElement = () => {
  const [canvas] = useCanvas();
  canvas.set("backgroundImage", null);
  canvas.renderAll();
};

// Set background mode: solid, image, gradient, grid
const changeBackgroundType = (type: number) => {
  // Solid color
  if (type === 0) {
    const templateBackground: WorkSpaceElement = {
      ...background.value,
      fillType: type,
      fill: background.value.color || "#fff",
    };
    removeBackgroundElement();
    updateBackground(templateBackground);
  }
  // Image
  else if (type === 1) {
    const templateBackground: WorkSpaceElement = {
      ...background.value,
      fillType: type,
      fill: "#fff",
      imageURL: background.value.imageURL || "",
      imageSize: background.value.imageSize || "cover",
    };
    removeBackgroundElement();
    updateBackground(templateBackground);
    if (background.value.imageURL) {
      changeBackgroundImage(background.value.imageURL);
    }
  }
  // Grid
  else if (type === 3) {
    const templateBackground: WorkSpaceElement = {
      ...background.value,
      fillType: type,
      backgroundColor: TransparentFill,
      gaidImageURL: background.value.gaidImageURL || "",
    };
    updateBackground(templateBackground);
    generateGridBackground();
  }
  // Gradient
  else {
    const templateBackground: WorkSpaceElement = {
      ...background.value,
      fillType: 2,
      gradientType: background.value.gradientType || "linear",
      gradientColor:
        background.value.gradientColor || GradientColorLibs[0].colors,
      gradientName: background.value.gradientName || GradientColorLibs[0].name,
    };
    updateBackground(templateBackground);
    generateGradientBackground();
  }
};

// Update background
const updateBackground = (props: Partial<WorkSpaceElement>) => {
  const [canvas] = useCanvas();
  const workSpaceDraw = canvas.getObjects().filter((item) => item.id === WorkSpaceDrawType)[0];
  if (!workSpaceDraw) return;
  workSpaceDraw.set({ ...props });
  if (props.fill instanceof Pattern) {
    props.fill = props.fill.toObject() as Pattern
  }
  templatesStore.updateWorkSpace({ workSpace: { ...background.value, ...props }});
  const workProps = workSpaceDraw.toObject(propertiesToInclude as any[]);
  templatesStore.updateElement({ id: workSpaceDraw.id, props: { ...workProps, ...props }});
  canvas.renderAll();
};

// Update uploaded background
const changeBackgroundImage = async (imageURL: string) => {
  if (background.value.imageSize === "repeat") {
    const backgroundImage = await util.loadImage(imageURL);
    const workSpacePattern = new Pattern({
      source: backgroundImage,
      repeat: "repeat",
    });
    updateBackground({ fill: workSpacePattern, imageURL });
  } else {
    setBackgroudImage(imageURL);
    updateBackground({ fill: TransparentFill, imageURL });
  }
};

// Upload background image
const uploadBackgroundImage = (files: FileList) => {
  const imageFile = files[0];
  if (!imageFile) return;
  getImageDataURL(imageFile).then((imageURL) => {
    changeBackgroundImage(imageURL);
  });
};

// Update background image
const changeImageSize = () => {
  if (!background.value.imageURL) return;
  changeBackgroundImage(background.value.imageURL);
};

// Update gradient name
const changeGradientName = (gradientName: string) => {
  const gradientColorLib = GradientColorLibs.filter(
    (item) => item.name === gradientName
  )[0];
  if (gradientColorLib) {
    background.value.gradientName = gradientName;
    updateBackground({ gradientColor: gradientColorLib.colors });
    generateGradientBackground();
  }
};

// Update gradient type
const changeGradientType = () => {
  updateBackground({ gradientType: background.value.gradientType });
  generateGradientBackground();
};

// Update gradient colors
const updateGradientBackground = (index: number, color: string) => {
  const gradientBackgroundColor = background.value.gradientColor;
  if (gradientBackgroundColor) {
    gradientBackgroundColor[index].color = color;
    updateBackground({ gradientColor: gradientBackgroundColor });
    generateGradientBackground();
  }
};

// Generate gradient background
const generateGradientBackground = () => {
  const [canvas] = useCanvas();
  const workSpaceDraw = canvas
    .getObjects()
    .filter((item) => item.id === WorkSpaceDrawType)[0];
  if (!workSpaceDraw) return;
  const width = workSpaceDraw.width;
  const height = workSpaceDraw.height;
  if (!width || !height) return;
  let coords: GradientCoords = { x1: 0, y1: 0, x2: width, y2: 0 };
  if (background.value.gradientType !== "linear") {
    coords = {
      r1: 0,
      r2: height / 2,
      x1: width / 2,
      y1: height / 2,
      x2: width / 2,
      y2: height / 2,
    };
  }
  const rotateCos = Math.cos((gradientRotate.value * Math.PI) / 180.0);
  const rotateSin = Math.sin((gradientRotate.value * Math.PI) / 180.0);
  const gradient = new Gradient({
    type: background.value.gradientType,
    colorStops: background.value.gradientColor || GradientColorLibs[0].colors,
    coords: coords,
    offsetX: gradientOffsetX.value * width,
    offsetY: gradientOffsetY.value * height,
    gradientTransform: [rotateCos, rotateSin, -1 * rotateSin, rotateCos, 0, 0],
  });
  updateBackground({ fill: gradient, opacity: gradientOpacity.value });
};

// Update recent grid cache (keep max length)
const updateGridColorRecentCache = debounce(
  function () {
    const maxLength = 10;
    if (gridColorRecent.value.length > maxLength) {
      gridColorRecent.value = gridColorRecent.value.slice(0, maxLength) as [
        string[]
      ];
    }
  },
  300,
  { trailing: true }
);

// Save recently added grid cache
watch(
  gridColorRecent,
  () => {
    const recentGridCache = JSON.stringify(gridColorRecent.value);
    localStorage.setItem(RECENT_GRIDS, recentGridCache);
  },
  { deep: true }
);

// Change grid image strength
const changeGridStrength = (value: number) => {
  gridStrengthRef.value = value;
  generateGridBackground();
};
// Change grid image variance
const changeGridVariance = (value: number) => {
  gridVarianceRef.value = value;
  generateGridBackground();
};
// Change grid image size
const changeGridSize = (value: number) => {
  gridSizeRef.value = value;
  generateGridBackground();
};

// Generate grid with random numeric parameters
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

// Select grid image colors
const changeGridColor = (colors: string[]) => {
  gridColorsRef.value = colors;
  generateGridBackground();
};

const changeGridColorMode = (
  mode: "interpolateLinear" | "sparkle" | "shadows"
) => {
  gridColorMode.value = mode;
  generateGridBackground();
};

// Get grid image color function/mode
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
  const [canvas] = useCanvas();
  const workSpaceDraw = canvas
    .getObjects()
    .filter((item) => item.id === WorkSpaceDrawType)[0];
  if (!workSpaceDraw || !workSpaceDraw.width) return;
  const gridColors =
    gridColorsRef.value && gridColorsRef.value.length > 0 && status !== "random"
      ? gridColorsRef.value
      : "random";
  const defaultOptions = {
    width: workSpaceDraw.width,
    height: workSpaceDraw.height,
    cellSize: gridSizeRef.value * workSpaceDraw.width,
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
  const canvasBackground = trianglifier.toSVG(undefined, undefined);
  const serialize = new XMLSerializer();
  const imageURL = `data:image/svg+xml;base64,${btoa(serialize.serializeToString(canvasBackground))}`;
  const backgroundImage = await Image.fromURL(imageURL, {crossOrigin: "anonymous"}, {
    left: workSpaceDraw.left,
    top: workSpaceDraw.top,
    angle: workSpaceDraw.angle,
    scaleX: workSpaceDraw.scaleX,
    scaleY: workSpaceDraw.scaleY,
    width: workSpaceDraw.width,
    height: workSpaceDraw.height,
  });
  canvas.set("backgroundImage", backgroundImage);
  templatesStore.setBackgroundImage(backgroundImage.toObject());
  updateBackground({ fill: TransparentFill, gaidImageURL: imageURL });
};

// Apply background to all pages
const changeAllBackgroud = () => {
  templatesStore.templates.forEach((item) => {
    item.workSpace = currentTemplate.value.workSpace;
    const currentWorkSpace = currentTemplate.value.objects.filter(
      (ele) => ele.id === WorkSpaceDrawType
    )[0];
    item.objects = item.objects.map((ele) =>
      ele.id === WorkSpaceDrawType ? currentWorkSpace : ele
    ) as any;
  });
};
</script>

<style lang="scss" scoped>
.icon-btn {
  cursor: pointer;
}
.canvas-design-panel {
  user-select: none;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.title {
  margin-bottom: 10px;
}

.fixed-ratio {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.slider-name {
  display: flex;
  align-items: center;
}
.slider-num {
  display: flex;
  align-items: center;
  justify-content: center;
}
.mb-10 {
  margin-bottom: 10px;
}
.full-row {
  flex: 1;
  width: 100%;
}

.full-group {
  display: flex;
  flex: 1;
}

.full-ratio {
  display: flex;
  flex: 1;
}

.background-image {
  height: 0;
  padding-bottom: 56.25%;
  border: 1px dashed var(--el-border-color);
  border-radius: $borderRadius;
  position: relative;
  transition: all $transitionDelay;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }

  .content {
    @include absolute-0();

    display: flex;
    justify-content: center;
    align-items: center;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    cursor: pointer;
  }
}

.theme-list {
  @include flex-grid-layout();
}
.theme-item {
  @include flex-grid-layout-children(2, 48%);

  padding-bottom: 30%;
  border-radius: $borderRadius;
  position: relative;
  cursor: pointer;

  .theme-item-content {
    @include absolute-0();

    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 8px;
    border: 1px solid $borderColor;
  }

  .text {
    font-size: 16px;
  }
  .colors {
    display: flex;
  }
  .color-block {
    margin-top: 8px;
    width: 12px;
    height: 12px;
    margin-right: 2px;
  }
  &:hover .btns {
    display: flex;
  }

  .btns {
    @include absolute-0();

    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: none;
    background-color: rgba($color: #000, $alpha: 0.25);
  }
  .btn {
    width: 72px;
    padding: 5px 0;
    text-align: center;
    background-color: $themeColor;
    color: #fff;
    font-size: 12px;
    border-radius: $borderRadius;

    &:hover {
      background-color: #c42f19;
    }

    & + .btn {
      margin-top: 5px;
    }
  }
}
.slider {
  flex: 3;
}
.mt-10 {
  margin-top: 10px;
}
.color-group {
  display: flex;
  flex: 1 1;
}
.color-box {
  flex: 1 1;
  height: 25px;
}
.color-contianer:hover {
  box-shadow: 0 0 20px 2px rgb(0 0 0 / 40%);
  width: calc(100% - 5px) !important;
  cursor: pointer;
}

.config-strength {
  flex: 10;
}

.config-variance {
  flex: 10;
}
.config-size {
  flex: 10;
}
.gradient-box {
  display: flex;
  flex: 1;
}

.color-item {
  height: 42px;
  border: 1px solid transparent;
  border-color: #d9d9d9;
  border-radius: 5px;
  flex: 1;
  display: inline-block;
  cursor: pointer;
  margin: 0 2px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.color-item:hover {
  border-color: $themeColor;
}

.color-non {
  display: none;
}
.color-select {
  width: 100%;
  height: 100%;
}

.common-slider {
  width: 90%;
  margin: 0 auto;
}
</style>


