<template>
  <div class="space-y-2.5">
    <template v-if="effectsView === 'main'">
    
    <ElementPosition />
    <Separator class="my-3" />

    <div
      class="h-24 bg-gray-100 dark:bg-gray-800 rounded-md bg-cover bg-no-repeat bg-center mb-3 border border-gray-200 dark:border-gray-700"
      :style="{
        backgroundImage: `url(${
          handleElement.originSrc
            ? handleElement.originSrc
            : handleElement.getSrc()
        })`,
      }"
    ></div>

    <CornersEditor
      :model-value="cornerState"
      :max-radius="maxCornerRadius"
      @update:model-value="onCornerStateChange"
    />

    <div class="flex mt-2">
      <div class="flex-1">
        <div class="flex gap-1">
          <Button variant="outline" class="flex-[2] h-7 text-[10px]" @click="clipImage">
            <IconTailoring class="w-3 h-3 mr-1" /> Crop
          </Button>
          <Popover v-model:open="showCropPopover">
            <PopoverTrigger as-child>
              <Button variant="outline" class="flex-1 h-7 w-7 p-0">
                <IconDown class="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-64 p-2.5" align="start">
              <div class="space-y-2">
                <div class="text-[10px] font-medium text-muted-foreground">By Shape:</div>
                <div class="grid grid-cols-6 gap-1">
                  <button
                    v-for="(item, key) in CLIPPATHS" 
                    :key="key" 
                    @click="presetImageClip(key)"
                    class="group flex aspect-square items-center justify-center rounded-md border border-border/50 bg-muted/30 transition-all hover:border-primary hover:bg-primary/10 hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="-10 -10 20 20"
                      class="text-muted-foreground transition-colors group-hover:text-primary"
                    >
                      <path
                        vector-effect="non-scaling-stroke"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-miterlimit="8"
                        fill="transparent"
                        stroke="currentColor"
                        stroke-width="1.5"
                        :d="item.createPath(20, 20)"
                      />
                    </svg>
                  </button>
                </div>

                <template v-for="type in ratioClipOptions" :key="type.label">
                  <div class="text-[10px] font-medium text-muted-foreground" v-if="type.label">By {{ type.label }}:</div>
                  <div class="grid grid-cols-4 gap-1">
                    <button
                      v-for="item in type.children" 
                      :key="item.key" 
                      @click="presetImageClip('rect', item.ratio)"
                      class="group flex items-center justify-center rounded-md border border-border/50 bg-muted/30 transition-all hover:border-primary hover:bg-primary/10 hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-7 text-[10px] font-medium text-muted-foreground hover:text-primary"
                    >
                      {{ item.key }}
                    </button>
                  </div>
                </template>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>

    <ElementBlend />
    <Separator class="my-3" />
    <ElementEffects />
    <Separator class="my-3" />
    <ElementMask />
    <Separator class="my-3" />
    <UnifiedEffects mode="compact" @open="openUnifiedEffects" />
    <Separator class="my-3" />
    <ElementOutline />
    <Separator class="my-3" />
    <ElementShadow :hasShadow="hasShadow" />
    <Separator class="my-3" />
    <ElementOpacity />
    <Separator class="my-3" />
    <ImageColorPalette />
    <Separator class="my-3" />

    <div class="flex gap-1.5">
      <FileInput class="flex-1" @change="(files: FileList) => replaceImage(files)">
        <Button variant="outline" class="w-full h-7 text-[10px]">
          <IconTransform class="w-3 h-3 mr-1" />Replace Image
        </Button>
      </FileInput>
      
      <Button variant="outline" class="flex-1 h-7 text-[10px]" @click="resetImage()">
        <IconUndo class="w-3 h-3 mr-1" /> Reset Style
      </Button>
    </div>


    </template>

    <template v-else>
      <Button
        variant="outline"
        class="w-full h-8 text-xs font-bold justify-start gap-2 hover:bg-primary/10"
        @click="closeUnifiedEffects"
      >
        <IconLeft class="h-3.5 w-3.5" />
        Back
      </Button>
      <Separator class="my-2" />
      <UnifiedEffects mode="panel" :section="effectsView" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { storeToRefs } from "pinia";
import { useMainStore, useTemplatesStore } from "@/store";
import { CLIPPATHS, ClipPathType } from "@/configs/images";
import { ImageElement } from "@/types/canvas";
import { ratioClipOptions } from "@/configs/images";
import { getImageDataURL } from "@/utils/image";
import { propertiesToInclude } from "@/configs/canvas";
import { Image } from "fabric";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Undo2, Redo2, AlignLeft, AlignCenterVertical, AlignRight, MoveUp, MoveDown } from "lucide-vue-next";
import useHandleTool from "@/hooks/useHandleTool";
import useHistorySnapshot from "@/hooks/useHistorySnapshot";
import { AlignCommand, LayerCommand } from "@/types/elements";
import ElementPosition from "../Components/ElementPosition.vue";
import ElementOutline from "../Components/ElementOutline.vue";
import ElementShadow from "../Components/ElementShadow.vue";
import ElementMask from "../Components/ElementMask.vue";
import ElementBlend from "../Components/ElementBlend.vue";
import ElementEffects from "../Components/ElementEffects.vue";
import ElementOpacity from "../Components/ElementOpacity.vue";
import ImageColorPalette from "../Components/ImageColorPalette.vue";
import UnifiedEffects from "../Components/UnifiedEffects.vue";
import CornersEditor, { type CornerValues } from "../Components/CornersEditor.vue";
import { hasIndividualCorners, setIndividualCorners, clearIndividualCorners } from "@/extension/util/cornerClip";
import useCanvas from "@/views/Canvas/useCanvas";

const mainStore = useMainStore();
const templatesStore = useTemplatesStore();
const [canvas] = useCanvas();
const { canvasObject } = storeToRefs(mainStore);
type ExtendedImage = Image & {
  __isCropping?: boolean;
  _cropKey?: ClipPathType;
  cropKey?: ClipPathType;
  cropPath?: string;
  setCropCoords?: (width: number, height: number) => void;
  resetCropModeAnchors?: () => void;
  rx?: number;
  ry?: number;
};

const handleElement = computed(() => canvasObject.value as ExtendedImage);
const hasShadow = computed(() => (handleElement.value.shadow ? true : false));
const showCropPopover = ref(false);

type UnifiedEffectsSection = "filters" | "effects" | "adjust";
const effectsView = ref<"main" | UnifiedEffectsSection>("main");

const openUnifiedEffects = (section: UnifiedEffectsSection) => {
  effectsView.value = section;
};

const closeUnifiedEffects = () => {
  effectsView.value = "main";
};

const cornerRadius = ref(0)
const cornerIndividual = ref(false)
const cornerValues = ref<CornerValues>({ tl: 0, tr: 0, bl: 0, br: 0 })

const cornerState = computed(() => ({
  uniform: cornerRadius.value,
  corners: cornerValues.value,
  individual: cornerIndividual.value,
}))

const maxCornerRadius = computed(() => {
  const element = handleElement.value;
  if (!element) return 0;
  const width = element.width ?? getOriginalDimension(element, "width");
  const height = element.height ?? getOriginalDimension(element, "height");
  if (!width || !height) return 0;
  return Math.round(Math.min(width, height) / 2);
});

const { alignElement, layerElement } = useHandleTool();
const { undo, redo } = useHistorySnapshot();

const getOriginalDimension = (element: ExtendedImage, dimension: "width" | "height") => {
  const fnName = dimension === "width" ? "getOriginalElementWidth" : "getOriginalElementHeight";
  const fn = (element as any)[fnName];
  if (typeof fn === "function") {
    const value = fn.call(element);
    return typeof value === "number" && !Number.isNaN(value) ? value : 0;
  }
  const fallback = (element as any)[dimension];
  return typeof fallback === "number" && !Number.isNaN(fallback) ? fallback : 0;
};

const updateCornerRadiusState = (element?: ExtendedImage) => {
  if (!element) {
    cornerRadius.value = 0
    cornerIndividual.value = false
    cornerValues.value = { tl: 0, tr: 0, bl: 0, br: 0 }
    return
  }
  if (hasIndividualCorners(element)) {
    cornerIndividual.value = true
    const el = element as any
    cornerValues.value = {
      tl: typeof el.tlRx === 'number' ? el.tlRx : 0,
      tr: typeof el.trRx === 'number' ? el.trRx : 0,
      bl: typeof el.blRx === 'number' ? el.blRx : 0,
      br: typeof el.brRx === 'number' ? el.brRx : 0,
    }
    cornerRadius.value = Math.max(el.tlRx ?? 0, el.trRx ?? 0, el.blRx ?? 0, el.brRx ?? 0)
  } else {
    cornerIndividual.value = false
    const current = typeof element.rx === 'number' ? element.rx : typeof element.ry === 'number' ? element.ry : 0
    cornerRadius.value = Math.round(current || 0)
    cornerValues.value = { tl: cornerRadius.value, tr: cornerRadius.value, bl: cornerRadius.value, br: cornerRadius.value }
  }
}

const onCornerStateChange = (state: { uniform: number; corners: CornerValues; individual: boolean }) => {
  const element = handleElement.value
  if (!element || !canvas) return

  const max = maxCornerRadius.value
  const cap = (v: number) => Math.max(0, Math.min(Math.round(v), max))

  cornerRadius.value = cap(state.uniform)
  cornerIndividual.value = state.individual
  cornerValues.value = { tl: cap(state.corners.tl), tr: cap(state.corners.tr), bl: cap(state.corners.bl), br: cap(state.corners.br) }

  const props: Record<string, any> = { dirty: true }

  if (state.individual) {
    // Individual mode: store per-corner radii, clear uniform rx/ry
    props.tlRx = cornerValues.value.tl
    props.trRx = cornerValues.value.tr
    props.blRx = cornerValues.value.bl
    props.brRx = cornerValues.value.br
    if (cornersAllZero()) {
      // All zeros → revert to uniform with 0
      props.rx = 0
      props.ry = 0
    } else {
      props.rx = 0
      props.ry = 0
    }
  } else {
    // Uniform mode: clear individual props, set rx/ry
    props.rx = cornerRadius.value
    props.ry = cornerRadius.value
    props.tlRx = undefined
    props.trRx = undefined
    props.blRx = undefined
    props.brRx = undefined
  }

  element.set(props)
  element.setCoords()
  canvas.renderAll()
  templatesStore.modifedElement(element, props)
}

const cornersAllZero = () =>
  cornerValues.value.tl === 0 && cornerValues.value.tr === 0 && cornerValues.value.bl === 0 && cornerValues.value.br === 0

const applyAspectRatio = (ratio: number) => {
  const element = handleElement.value;
  if (!element || ratio <= 0 || !canvas) return;

  const originalWidth = getOriginalDimension(element, "width");
  const originalHeight = getOriginalDimension(element, "height");
  if (!originalWidth || !originalHeight) return;

  const currentWidth = Math.min(element.width ?? originalWidth, originalWidth);
  const currentHeight = Math.min(element.height ?? originalHeight, originalHeight);

  let targetWidth = currentWidth;
  let targetHeight = targetWidth * ratio;

  if (targetHeight > originalHeight) {
    targetHeight = Math.min(originalHeight, currentHeight);
    targetWidth = targetHeight / ratio;
  }

  targetWidth = Math.max(1, Math.min(targetWidth, originalWidth));
  targetHeight = Math.max(1, Math.min(targetHeight, originalHeight));

  if (!element.__isCropping) {
    element.__isCropping = true;
  }

  element.cropKey = undefined;
  element.cropPath = undefined;
  element.clipPath = undefined;
  element.setCropCoords?.(targetWidth, targetHeight);
  element.set({ width: targetWidth, height: targetHeight });
  element.resetCropModeAnchors?.();
  element.setCoords();
};

// Open free cropping
const clipImage = () => {
  if (!handleElement.value) return;
  handleElement.value.set({
    __isCropping: true,
    clipPath: undefined,
    cropPath: undefined,
  });
  canvas.renderAll();
  showCropPopover.value = false;
};

// Preset cropping
const presetImageClip = (key: ClipPathType, ratio = 0) => {
  if (!handleElement.value) return;
  
  // Aspect ratio crop (shape fixed as rectangle)
  if (ratio) {
    applyAspectRatio(ratio);
  }
  // Shape crop (keep current crop range)
  else {
    handleElement.value.set({ __isCropping: true, _cropKey: key });
    canvas.renderAll();
  }
  showCropPopover.value = false;
};

// Replace image (keep current style)
const replaceImage = (files: FileList) => {
  const imageFile = files[0];
  if (!imageFile) return;
  getImageDataURL(imageFile).then((dataURL) => {
    const props = { src: dataURL };
    handleElement.value.setSrc(dataURL);
    templatesStore.updateElement({ id: handleElement.value.id, props });
  });
};

// Reset image: clear all styles
const resetImage = () => {
  handleElement.value.filters = [];
  handleElement.value.applyFilters();
  // @ts-ignore
  const props = handleElement.value.toObject(propertiesToInclude) as ImageElement;
  templatesStore.updateElement({ id: props.id, props });
};

// Set image as background
const setBackgroundImage = () => {
  // Future implementation
};

const handleSelectionChange = () => {
  const element = canvas?._activeObject as ExtendedImage | undefined;
  updateCornerRadiusState(element);
};

const handleObjectModified = (event: any) => {
  if (event?.action !== "cropImage") return;
  updateCornerRadiusState(event.target as ExtendedImage | undefined);
};

const handleCanvasDoubleClick = () => {
  requestAnimationFrame(() => {
    handleSelectionChange();
  });
};

watch(
  () => canvasObject.value,
  (element) => {
    updateCornerRadiusState(element as ExtendedImage | undefined);
  },
  { immediate: true }
);

watch(
  () => [handleElement.value?.rx, handleElement.value?.ry],
  () => {
    updateCornerRadiusState(handleElement.value);
  }
);

onMounted(() => {
  canvas?.on("selection:created", handleSelectionChange);
  canvas?.on("selection:updated", handleSelectionChange);
  canvas?.on("selection:cleared", handleSelectionChange);
  canvas?.on("mouse:dblclick", handleCanvasDoubleClick);
  canvas?.on("object:modified", handleObjectModified);
  updateCornerRadiusState(canvasObject.value as ExtendedImage | undefined);
});

onBeforeUnmount(() => {
  canvas?.off("selection:created", handleSelectionChange);
  canvas?.off("selection:updated", handleSelectionChange);
  canvas?.off("selection:cleared", handleSelectionChange);
  canvas?.off("mouse:dblclick", handleCanvasDoubleClick);
  canvas?.off("object:modified", handleObjectModified);
});
</script>