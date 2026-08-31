<template>
  <div class="element-position space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <!-- Header -->
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Position
      </h3>
    </div>

    <!-- Alignment Controls -->
    <div class="grid grid-cols-6 gap-0.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="alignElement(AlignCommand.LEFT)"
            >
              <IconAlignLeft class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Left Align</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="alignElement(AlignCommand.VERTICAL)"
            >
              <IconAlignHorizontally class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Vertical Center</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="alignElement(AlignCommand.RIGHT)"
            >
              <IconAlignRight class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Right Align</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="alignElement(AlignCommand.TOP)"
            >
              <IconAlignTop class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Top Align</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="alignElement(AlignCommand.HORIZONTAL)"
            >
              <IconAlignVertically class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Center Horizontally</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="alignElement(AlignCommand.BOTTOM)"
            >
              <IconAlignBottom class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Bottom Align</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- Position X & Y -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-center">
      <div class="relative group">
        <Input
          :model-value="left.modelValue as string | number | undefined"
          type="text"
          inputmode="decimal"
          placeholder="X"
          class="pl-7 pr-2 text-xs h-7 font-mono border-input"
          @update:model-value="(value) => commitPositionValue(left.onChange, value)"
        />
        <div class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/70 group-hover:text-primary">X</div>
      </div>
      
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

      <div class="relative group">
        <Input
          :model-value="top.modelValue as string | number | undefined"
          type="text"
          inputmode="decimal"
          placeholder="Y"
          class="pl-7 pr-2 text-xs h-7 font-mono border-input"
          @update:model-value="(value) => commitPositionValue(top.onChange, value)"
        />
        <div class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/70 group-hover:text-primary">Y</div>
      </div>
    </div>

    <!-- Width & Height -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-center">
      <div class="relative group">
        <Input
          :model-value="width.modelValue as string | number | undefined"
          type="text"
          inputmode="decimal"
          placeholder="W"
          class="pl-7 pr-2 text-xs h-7 font-mono border-input"
          @update:model-value="(value) => commitPositionValue(width.onChange, value)"
        />
        <div class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/70 group-hover:text-primary">W</div>
      </div>
      
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

      <div class="relative group">
        <Input
          :model-value="height.modelValue as string | number | undefined"
          type="text"
          inputmode="decimal"
          placeholder="H"
          class="pl-7 pr-2 text-xs h-7 font-mono border-input"
          @update:model-value="(value) => commitPositionValue(height.onChange, value)"
        />
        <div class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/70 group-hover:text-primary">H</div>
      </div>
    </div>

    <!-- Rotation -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
            <RotateCw class="h-2.5 w-2.5" />
            Rotation</Label>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">{{ Math.round(angle.modelValue as number) }}°</Badge>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="h-7 text-[11px] font-semibold transition-all hover:bg-primary/10 hover:text-primary"
                @click="changeRotate45('-')"
              >
                <IconRotate class="h-3.5 w-3.5 mr-1.5" /> -45°
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Rotate -45°</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="h-7 text-[11px] font-semibold transition-all hover:bg-primary/10 hover:text-primary"
                @click="changeRotate45('+')"
              >
                <IconRotate class="h-3.5 w-3.5 mr-1.5" :style="{ transform: 'rotateY(180deg)' }" /> +45°
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Rotate +45°</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Flip -->
    <div v-if="!isTextElement" class="space-y-1.5">
      <div class="flex items-center justify-between">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
          <FlipVertical class="h-2.5 w-2.5" />
          Flip</Label>
      </div>
      <div class="grid grid-cols-2 gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                :class="[
                  'h-7 px-2 transition-all',
                  handleFlip.includes('flipY') ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                ]"
                @click="toggleFlip('flipY')"
              >
                <IconFlipVertically class="h-3.5 w-3.5 mr-1" />Vertical
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Flip Vertically</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="outline"
                :class="[
                  'h-7 px-2 transition-all',
                  handleFlip.includes('flipX') ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                ]"
                @click="toggleFlip('flipX')"
              >
                <IconFlipHorizontally class="h-3.5 w-3.5 mr-1" />Horizontal
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Flip Horizontally</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Layer Controls -->
    <div class="grid grid-cols-4 gap-0.5 pt-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="layerElement(LayerCommand.TOP)"
            >
              <IconSendToBack class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Send to Top</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="layerElement(LayerCommand.BOTTOM)"
            >
              <IconBringToFrontOne class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Send to Bottom</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="layerElement(LayerCommand.DOWN)"
            >
              <IconSendBackward class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Move Down</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              class="h-7 p-0 transition-all hover:bg-primary/10 hover:text-primary"
              @click="layerElement(LayerCommand.UP)"
            >
              <IconBringForward class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" class="text-xs">
            <p>Move Up</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- Show in Export -->
    <div class="flex items-center gap-2 pt-1">
      <Checkbox
        :id="`show-in-export`"
        :checked="showInExportValue"
        class="h-4 w-4"
        @update:checked="toggleShowInExport"
      />
      <Label for="show-in-export" class="text-[11px] cursor-pointer select-none">Show in Export</Label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { AlignCommand, LayerCommand, ElementNames } from "@/types/elements";
import { useMainStore, useTemplatesStore } from "@/store";
import useCanvas from "@/views/Canvas/useCanvas";
import useHandleTool from "@/hooks/useHandleTool";
import useHandleActive from "@/hooks/useHandleActive";

// shadcn/ui components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RotateCw, FlipVertical } from 'lucide-vue-next';
import { SnapshotType } from '@/types/history'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { propertiesToInclude } from "@/configs/canvas"

const templatesStore = useTemplatesStore();
const { alignElement, layerElement } = useHandleTool();
const [canvas] = useCanvas();
const { canvasObject } = storeToRefs(useMainStore());
const { handleActive } = useHandleActive();
const left = handleActive("left");
const top = handleActive("top");
const height = handleActive("height");
const width = handleActive("width");
const angle = handleActive("angle");
const isFixed = ref(false);

const commitPositionValue = (
  handler: (value: number) => void,
  value: string | number
) => {
  const nextValue = Number.parseFloat(String(value));
  if (Number.isNaN(nextValue)) return;
  handler(nextValue);
};

const changeFixedRatio = (status: boolean) => {
  isFixed.value = status;
};

// Check if current element is a text type
const textTypes = ['textbox', 'text', 'i-text', 'itext', 'ArcText', 'VerticalText'];
const isTextElement = computed(() => {
  return canvasObject.value && textTypes.includes(canvasObject.value.type as string);
});

// Show in export toggle
const showInExportValue = computed(() => {
  return (canvasObject.value as any)?.showInExport !== false;
});

const toggleShowInExport = (value: boolean) => {
  const [canvas] = useCanvas();
  if (!canvasObject.value || !canvas) return;
  templatesStore.modifedElement(canvasObject.value, {showInExport: value});
  canvas.renderAll();
};

// Rotate 45 degrees (clockwise or counterclockwise)
const changeRotate45 = (command: "+" | "-") => {
  const [canvas] = useCanvas();
  if (!canvasObject.value || !canvas) return;
  let _rotate = Math.floor(canvasObject.value.angle / 45) * 45;
  if (command === "+") _rotate = _rotate + 45;
  else if (command === "-") _rotate = _rotate - 45;
  if (_rotate < -180) _rotate = -180;
  if (_rotate > 180) _rotate = 180;
  templatesStore.modifedElement(canvasObject.value, {angle: _rotate});
};

const { addHistorySnapshot } = useHistorySnapshot()
const { templateId } = storeToRefs(templatesStore)

const handleFlip = ref<string[]>([]);

// Watch for element changes to update flip state
watch(() => canvasObject.value, (newVal) => {
  if (!newVal) { handleFlip.value = []; return; }
  const flips: string[] = [];
  const handleType = newVal.type;
  if (handleType === ElementNames.IMAGE || handleType === ElementNames.PATH) {
    if (newVal.flipX) flips.push("flipX");
    if (newVal.flipY) flips.push("flipY");
  }
  handleFlip.value = flips;
}, { immediate: true });

const toggleFlip = (flipType: string) => {
  const [canvas] = useCanvas();
  if (!canvasObject.value) return;
  const handleType = canvasObject.value.type;

  const original = {
    flipX: canvasObject.value.flipX,
    flipY: canvasObject.value.flipY
  }

  if (handleType === ElementNames.IMAGE || handleType === ElementNames.PATH) {
    if (handleFlip.value.includes(flipType)) {
      handleFlip.value = handleFlip.value.filter(f => f !== flipType);
    } else {
      handleFlip.value.push(flipType);
    }
    canvasObject.value.flipX = handleFlip.value.includes("flipX");
    canvasObject.value.flipY = handleFlip.value.includes("flipY");
  }
  canvas.renderAll();

  const target = canvasObject.value.toObject(propertiesToInclude)
  const index = canvas._objects.findIndex((item: any) => item.id === target.id)
  if (index === -1) return

  addHistorySnapshot({
    type: SnapshotType.MODIFY,
    index,
    target,
    transform: { original } as any,
    tid: templateId.value
  })
};
</script>