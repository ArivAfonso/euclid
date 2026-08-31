<template>
  <div class="effect-style-panel space-y-2.5 ">
    <!-- Back Button -->
    <Button 
      variant="outline" 
      class="w-full h-8 text-xs font-bold justify-start gap-2 hover:bg-primary/10"
      @click="handleReturn"
    >
      <IconLeft class="h-3.5 w-3.5" />
      Back
    </Button>

    <Separator class="my-2" />

    <!-- Fill & Stroke Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Fill · Stroke
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 hover:bg-primary/10"
                @click="addStroke"
              >
                <IconPlus class="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Add Stroke Layer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <!-- Stroke Effects -->
      <div 
        v-for="(item, index) in handleElement.effects?.filter(ele => ele.type === 0)" 
        :key="item.id"
        class="space-y-2 border border-border/30 rounded-md p-2 bg-background/50"
      >
        <!-- Layer Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <IconHamburgerButton class="h-3 w-3 text-muted-foreground cursor-move" />
            <Badge variant="secondary" class="text-[10px] px-1.5 py-0 select-none">Layer {{ index + 1 }}</Badge>
          </div>
          <div class="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-6 w-6">
                    <IconCopy class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Duplicate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop="toggleVisible(item.id)">
                    <IconPreviewOpen v-if="item.visible" class="h-3 w-3" />
                    <IconPreviewClose v-else class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>{{ item.visible ? 'Hide' : 'Show' }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    @click.stop="subEffect(item.id)"
                  >
                    <IconMinus class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Remove Layer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <!-- Fill Option -->
        <div class="flex items-center gap-2">
          <Checkbox 
            :id="`fill-${item.id}`"
            v-model:checked="item.isFill"
            class="h-4 w-4"
          />
          <Label :for="`fill-${item.id}`" class="text-xs flex-1 cursor-pointer">Fill</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-7 w-16 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
                @click.stop
              >
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: handleElement.fill || '#fff' }"></div>
                  <span class="text-[10px] font-mono">{{ toHex(handleElement.fill || '#fff') }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker 
                :modelValue="handleElement.fill" 
                @update:modelValue="(color: string) => updateFill(color)" 
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Stroke Option -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Checkbox 
              :id="`stroke-${item.id}`"
              v-model:checked="item.isStroke"
              class="h-4 w-4"
            />
            <Label :for="`stroke-${item.id}`" class="text-xs flex-1 cursor-pointer">Stroke</Label>
          </div>
          
          <div class="grid grid-cols-3 gap-1.5">
            <div class="space-y-1">
              <Label class="text-[10px] text-muted-foreground">Width</Label>
              <Input
                type="number"
                v-model.number="item.strokeWidth"
                @change="updateStrokeWidth"
                class="h-7 text-xs"
              />
            </div>
            
            <div class="space-y-1">
              <Label class="text-[10px] text-muted-foreground">Join</Label>
              <Select v-model="item.strokeLineJoin" @update:model-value="updateElement">
              <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bevel" class="text-xs py-1">Bevel</SelectItem>
                  <SelectItem value="round" class="text-xs py-1">Round</SelectItem>
                  <SelectItem value="miter" class="text-xs py-1">Miter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div class="space-y-1">
              <Label class="text-[10px] text-muted-foreground">Color</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-7 w-full px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
                    @click.stop
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: item.stroke || '#fff' }"></div>
                      <span class="text-[10px] font-mono">{{ toHex(item.stroke || '#fff') }}</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[256px]" align="end">
                  <ColorPicker 
                    :modelValue="item.stroke" 
                    @update:modelValue="(color: string) => updateStroke(color, item.id)" 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <!-- Offset Option -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Checkbox 
              :id="`offset-${item.id}`"
              v-model:checked="item.isSkew"
              class="h-4 w-4"
            />
            <Label :for="`offset-${item.id}`" class="text-xs flex-1 cursor-pointer">Offset</Label>
          </div>
          
          <div class="grid grid-cols-2 gap-1.5">
            <Input type="number" v-model.number="item.offsetX" @change="updateElement" placeholder="X" class="h-7 text-xs" />
            <Input type="number" v-model.number="item.offsetY" @change="updateElement" placeholder="Y" class="h-7 text-xs" />
          </div>
        </div>
      </div>
    </div>

    <Separator class="my-2" />

    <!-- Shadow Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Shadow
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 hover:bg-primary/10"
                @click="addShadow"
              >
                <IconPlus class="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" class="text-xs">
              <p>Add Shadow Layer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <!-- Shadow Effects -->
      <div 
        v-for="(item, index) in handleElement.effects?.filter(ele => ele.type === 1)" 
        :key="item.id"
        class="space-y-2 border border-border/30 rounded-md p-2 bg-background/50"
      >
        <!-- Layer Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <IconHamburgerButton class="h-3 w-3 text-muted-foreground cursor-move" />
            <IconContrastViewCircle class="h-3.5 w-3.5 text-muted-foreground" />
            <span class="text-xs font-medium">Base Shadow</span>
          </div>
          <div class="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-6 w-6">
                    <IconCopy class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Duplicate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop="toggleVisible(item.id)">
                    <IconPreviewOpen v-if="item.visible" class="h-3 w-3" />
                    <IconPreviewClose v-else class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>{{ item.visible ? 'Hide' : 'Show' }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    @click.stop="subEffect(item.id)"
                  >
                    <IconMinus class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Remove Layer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <!-- Shadow Controls -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Label class="text-[10px] text-muted-foreground">Color</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-7 w-16 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
                  @click.stop
                >
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: item.shadowColor || 'rgba(0,0,0,0.5)' }"></div>
                    <span class="text-[10px] font-mono">{{ toHex(item.shadowColor || '#000000') }}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[256px]" align="end">
                <ColorPicker 
                  :modelValue="item.shadowColor" 
                  @update:modelValue="(color: string) => updateShadowColor(color, item.id)" 
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div class="grid grid-cols-3 gap-1.5">
            <div class="space-y-1">
              <Label class="text-[10px] text-muted-foreground">Blur</Label>
              <Input type="number" v-model.number="item.blur" @change="updateElement" class="h-7 text-xs" />
            </div>
            <div class="space-y-1">
              <Label class="text-[10px] text-muted-foreground">X</Label>
              <Input type="number" v-model.number="item.offsetX" @change="updateElement" class="h-7 text-xs" />
            </div>
            <div class="space-y-1">
              <Label class="text-[10px] text-muted-foreground">Y</Label>
              <Input type="number" v-model.number="item.offsetY" @change="updateElement" class="h-7 text-xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Image, Rect, Textbox, IText, Object as FabricObject, Group } from "fabric";
import { storeToRefs } from "pinia";
import { ref, watch, onMounted, computed } from "vue";
import { mm2px, px2mm } from "@/utils/image";
import { ElementNames, RightStates, SupportEffects } from '@/types/elements'

import { useFabricStore, useMainStore, useTemplatesStore } from "@/store";

import useCanvas from "@/views/Canvas/useCanvas";
import Backgrounds from "../Backgrounds/index.vue";
import useHistorySnapshot from "@/hooks/useHistorySnapshot";
import useCanvasScale from '@/hooks/useCanvasScale'
import { EffectItem } from "@/types/common";
import { nanoid } from "nanoid";

import ColorPicker from '@/components/ColorPicker/index.vue'
import { toHex } from '@/utils/color'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const mainStore = useMainStore();
const templatesStore = useTemplatesStore();
const fabricStore = useFabricStore();
const { addHistorySnapshot } = useHistorySnapshot();
const { canvasObject, rightState } = storeToRefs(mainStore);
const { currentTemplate } = storeToRefs(templatesStore);
const { clip, safe, zoom, opacity } = storeToRefs(fabricStore);
const { setCanvasSize, resetCanvas } = useCanvasScale();
const handleElement = computed(() => canvasObject.value as Image | IText | Group);

const handleReturn = () => {
  rightState.value = RightStates.ELEMENT_STYLE
}

const addStroke = () => {
  const strokeItem = {
    type: 0,
    id: nanoid(8),
    isFill: false,
    isStroke: false,
    isSkew: false,
    stroke: '#fff',
    strokeWidth: 1,
    strokeLineJoin: 'round' as CanvasLineJoin,
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    shadowColor: 'rgba(0, 0, 0, 0.5)'
  }
  if (!handleElement.value.effects) {
    handleElement.value.effects = [strokeItem]
  }
  else {
    handleElement.value.effects?.push(strokeItem)
  }
  updateElement()
}

const subEffect = (key: string) => {
  handleElement.value.effects = handleElement.value.effects?.filter(item => item.id !== key)
  updateElement()
}

const addShadow = () => {
  const shadowItem = {
    type: 1,
    id: nanoid(8),
    isFill: false,
    isStroke: false,
    isSkew: false,
    stroke: '#fff',
    strokeWidth: 1,
    strokeLineJoin: 'round' as CanvasLineJoin,
    offsetX: 4,
    offsetY: 4,
    blur: 4,
    shadowColor: 'rgba(0, 0, 0, 0.5)'
  }
  if (!handleElement.value.effects) {
    handleElement.value.effects = [shadowItem]
  }
  else {
    handleElement.value.effects?.push(shadowItem)
  }
  updateElement()
}

const toggleVisible = (key: string) => {
  const item = handleElement.value.effects?.find(ele => ele.id === key)
  if (!item) return
  item.visible = item.visible === false ? true : false
  updateElement()
}

const updateFill = (color: string) => {
  handleElement.value.fill = color
}

const updateStroke = (color: string, key: string) => {
  handleElement.value.effects?.filter(item => item.id === key).map(ele => ele.stroke = color)
  updateElement()
}

const updateShadowColor = (color: string, key: string) => {
  handleElement.value.effects?.filter(item => item.id === key).map(ele => ele.shadowColor = color)
  updateElement()
}

const updateStrokeWidth = () => {
  updateElement()
}

const updateElement = () => {
  if (!handleElement.value || !handleElement.value.effects) return
  const elementType = handleElement.value.type.toLowerCase()
  if (!SupportEffects.includes(elementType)) return
  if (elementType === ElementNames.GROUP || elementType === ElementNames.ACTIVE) {
    const groupObject = handleElement.value as Group
    groupObject._objects.forEach(item => {
      if (SupportEffects.includes(item.type.toLowerCase())) {
        const element = item as IText
        element.set({effects: handleElement.value.effects})
        element.renderEffects()
      }
    })
  } 
  else {
    (handleElement.value as IText | Image).renderEffects()
  }
}

</script>

<style lang="scss" scoped>
.effect-style-panel {
  @apply bg-background text-foreground;
}
</style>
