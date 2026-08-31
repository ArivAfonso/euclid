<template>
  <div data-onboarding="right-panel" class="h-full flex flex-col justify-end">
    <div class="flex items-center justify-between w-full pr-3 py-[3.2px] bg-white dark:bg-[hsl(0,0%,9%)] border-b border-gray-200 dark:border-gray-800 [&_button_svg]:text-gray-500 dark:[&_button_svg]:text-gray-400">
      <!-- Left: Quick actions -->
      <div class="flex items-center gap-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                :class="{ 'opacity-50 cursor-not-allowed': !hasSelection }"
                :disabled="!hasSelection"
                @click="handleExportElement"
              >
                <Download class="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">Export Element</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                :class="{ 'opacity-50 cursor-not-allowed': !hasSelection }"
                :disabled="!hasSelection"
                @click="handleDuplicate"
              >
                <Copy class="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">Duplicate</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0"
                :class="{ 'opacity-50 cursor-not-allowed': !hasSelection }"
                :disabled="!hasSelection"
                @click="handleDelete"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Separator orientation="vertical" class="h-6 ml-2 mr-1" />

      <!-- Right: Share / Download -->
      <div class="flex gap-1.5 px-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="sm" class="select-none h-6 px-2 py-0 text-xs opacity-50 cursor-not-allowed" disabled>Share</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">COMING SOON</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Popover v-model:open="exportPopoverOpen">
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="select-none h-6 px-2 py-0 text-xs">Download</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" :side-offset="6" class="w-auto border-none p-0 shadow-lg">
            <FileExport @close="exportPopoverOpen = false" />
          </PopoverContent>
        </Popover>
      </div>
    </div>
    <div class="flex-1 h-[calc(100%-40px)]">
      <div class="p-[10px_5px_10px_10px] text-[13px] overflow-y-auto overflow-x-hidden h-full">
        <KeepAlive>
          <component :is="currentPanelComponent"></component>
        </KeepAlive>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { RightStates, ElementNames } from "@/types/elements";
import { storeToRefs } from "pinia";
import { useMainStore } from "@/store/modules/main";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import CanvasStylePanel from "./CanvasStylePanel/index.vue";
import ElemnetStylePanel from "./ElementStylePanel/index.vue";
import EffectStylePanel from "./EffectStylePanel/index.vue";
import LayerStylePanel from "./LayerStylePanel/index.vue";
import FileExport from "@/components/FileExport/index.vue";
import useHandleElement from "@/hooks/useHandleElement";
import useCanvasScale from "@/hooks/useCanvasScale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Download,
  Copy,
  Trash2
} from "lucide-vue-next";
import { saveAs } from 'file-saver'

const mainStore = useMainStore();
const { canvasObject, rightState } = storeToRefs(mainStore);
const exportPopoverOpen = ref(false)

const { duplicateElement, deleteElement } = useHandleElement();
const { resetCanvas } = useCanvasScale();

const hasSelection = computed(() => !!canvasObject.value);

const handleExportElement = async () => {
  const [canvas] = useCanvas()
  const activeObject = canvas.getActiveObject()
  if (!activeObject) return

  try {
    // Clone the object so we don't modify the original
    const cloned = await activeObject.clone()
    // Create an offscreen canvas sized to the object's bounding box
    const bounds = activeObject.getBoundingRect()
    const offscreenCanvas = document.createElement('canvas')
    const dpr = window.devicePixelRatio || 1
    offscreenCanvas.width = bounds.width * dpr
    offscreenCanvas.height = bounds.height * dpr

    // Use a StaticCanvas to render just this object
    const { StaticCanvas } = await import('fabric')
    const staticCanvas = new StaticCanvas(offscreenCanvas, {
      width: bounds.width,
      height: bounds.height,
      renderOnAddRemove: false,
    })
    staticCanvas.setZoom(dpr)

    // Position the cloned object at (0,0) relative to the static canvas
    cloned.set({
      left: bounds.width / 2,
      top: bounds.height / 2,
      originX: 'center',
      originY: 'center',
    })
    staticCanvas.add(cloned)
    staticCanvas.renderAll()

    const dataURL = staticCanvas.toDataURL({ format: 'png', multiplier: 1 })
    saveAs(dataURL, `element-${Date.now()}.png`)

    staticCanvas.dispose()
  } catch (err) {
    console.error('Export element failed:', err)
  }
};
const handleCopy = () => { copyElement(); };
const handleCut = () => { cutElement(); };
const handlePaste = () => { pasteElement(); };
const handleDuplicate = () => { duplicateElement(); };
const handleDelete = () => {
  if (canvasObject.value) {
    deleteElement(canvasObject.value.id);
  }
};
const handleFitToScreen = () => { resetCanvas(); };

const canvasTabs = [
  { label: 'Canvas', value: RightStates.ELEMENT_CANVAS },
];
const styleTabs = [
  { label: 'Style', value: RightStates.ELEMENT_STYLE },
];

const setRightState = (value: RightStates) => {
  mainStore.setRightState(value);
};

const currentTabs = computed(() => {
  if (!canvasObject.value) return canvasTabs;
  if (canvasObject.value.type.toLowerCase() === ElementNames.REFERENCELINE) return canvasTabs;
  return styleTabs;
});

watch(currentTabs, () => {
  const currentTabsValue: RightStates[] = currentTabs.value.map(
    (tab) => tab.value
  );
  if (!currentTabsValue.includes(rightState.value)) {
    mainStore.setRightState(currentTabsValue[0]);
  }
});

const currentPanelComponent = computed(() => {
  const panelMap = {
    [RightStates.ELEMENT_CANVAS]: CanvasStylePanel,
    [RightStates.ELEMENT_STYLE]: ElemnetStylePanel,
    [RightStates.ELEMENT_EFFECT]: EffectStylePanel,
    [RightStates.ELEMENT_LAYER]: LayerStylePanel,
  };
  return panelMap[rightState.value as RightStates.ELEMENT_STYLE];
});
</script>