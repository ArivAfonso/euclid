<template>
  <div class="line-style-panel space-y-2.5 ">
    <ElementPosition/>
    
    <Separator class="my-2" />

    <!-- Line Style Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Line Style
        </h3>
      </div>
      
      <div class="space-y-2">
        <!-- Style + Color in one row -->
        <div class="grid grid-cols-2 gap-2">
          <!-- Color (LEFT) -->
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
                      :style="{ backgroundColor: strokeColor }"
                    ></div>
                    <span class="text-xs font-mono">{{ toHex(strokeColor) }}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[256px]" align="end">
                <ColorPicker
                  :modelValue="strokeColor"
                  @update:modelValue="(color: string) => updateStrokeColor(color)"
                />
              </PopoverContent>
            </Popover>
          </div>
          <!-- Line Style (RIGHT) -->
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Paintbrush class="h-2.5 w-2.5" />
              Style</Label>
            <Select 
              :model-value="String(lineStyle)" 
              @update:model-value="(val) => { lineStyle = Number(val); changeLineStyle(); }"
            >
              <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" class="text-xs py-1">Solid Line</SelectItem>
                <SelectItem value="1" class="text-xs py-1">Dashed Line</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Dash Length (only visible for dashed lines) -->
        <div v-if="lineStyle === 1" class="space-y-1">
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

        <!-- Line Width -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Minus class="h-2.5 w-2.5" />
              Width</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ handleElement.strokeWidth }}px</span>
          </div>
          <SliderWithTicks 
            :model-value="[handleElement.strokeWidth]"
            @update:model-value="(val) => val && (handleElement.strokeWidth = val[0])"
            @value-commit="updateTemplateElement({strokeWidth: handleElement.strokeWidth})"
            :min="1"
            :max="40"
            :step="1"
          />
        </div>
      </div>
    </div>

    <Separator class="my-2" />

    <!-- Line Endpoints Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Endpoints
        </h3>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <!-- Start Point Style -->
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <ArrowRightFromLine class="h-2.5 w-2.5" />
              Start</Label>
          <Select 
            :model-value="handleElement.startStyle || 'none'" 
            @update:model-value="(val) => changeLineMode(val as LinePoint, 'start')"
          >
            <SelectTrigger class="h-7 text-[11px] border border-input">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" class="text-xs py-1">None</SelectItem>
              <SelectItem value="arrow" class="text-xs py-1">Arrow</SelectItem>
              <SelectItem value="dot" class="text-xs py-1">Dot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- End Point Style -->
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <ArrowRightToLine class="h-2.5 w-2.5" />
              End</Label>
          <Select 
            :model-value="handleElement.endStyle || 'none'" 
            @update:model-value="(val) => changeLineMode(val as LinePoint, 'end')"
          >
            <SelectTrigger class="h-7 text-[11px] border border-input">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" class="text-xs py-1">None</SelectItem>
              <SelectItem value="arrow" class="text-xs py-1">Arrow</SelectItem>
              <SelectItem value="dot" class="text-xs py-1">Dot</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <Separator class="my-2" />
    <ElementShadow :hasShadow="hasShadow"/>
  </div>
</template>

<script lang="ts" setup>
import { useMainStore, useTemplatesStore } from '@/store'
import useCanvas from '@/views/Canvas/useCanvas'
import { Polyline } from '@/extension/object/Polyline'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import ElementPosition from '../Components/ElementPosition.vue'
import ElementShadow from '../Components/ElementShadow.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import { toHex } from '@/utils/color'
import { LinePoint } from '@/types/elements'
import { Button } from '@/components/ui/button'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Paintbrush, Palette, Minus, SeparatorHorizontal, ArrowRightFromLine, ArrowRightToLine } from 'lucide-vue-next'

const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const { canvasObject } = storeToRefs(mainStore)
const [ canvas ] = useCanvas()
const handleElement = computed(() => canvasObject.value as Polyline)
const hasShadow = computed(() => handleElement.value?.shadow ? true : false)
const strokeColor = computed(() => String(handleElement.value?.stroke ?? ''))
const lineStyle = ref<number>(handleElement.value?.strokeDashArray ? 1 : 0)
const dashLength = ref<number>((handleElement.value?.strokeDashArray?.[0] as number) || 6)

const updateStrokeColor = (color: string) => {
  if (!handleElement.value) return
  handleElement.value.stroke = color
  updateTemplateElement({stroke: color})
}

const changeLineStyle = () => {
  if (!handleElement.value) return
  const strokeDashArray = lineStyle.value === 1 ? [dashLength.value, dashLength.value] : null
  handleElement.value.set({strokeDashArray})
  updateTemplateElement({strokeDashArray})
}

const changeDashLength = () => {
  if (!handleElement.value || lineStyle.value !== 1) return
  const strokeDashArray: [number, number] = [dashLength.value, dashLength.value]
  handleElement.value.set({strokeDashArray})
  updateTemplateElement({strokeDashArray})
}

const changeLineMode = (value: LinePoint | 'none', mode: 'start' | 'end') => {
  if (!handleElement.value) return
  const actualValue = value === 'none' ? '' : value
  handleElement.value.setLineMode(actualValue, mode)
  let options: Record<string, any> = { 'startStyle': actualValue }
  if (mode === 'end') {
    options = {'endStyle': actualValue }
  }
  updateTemplateElement(options)
}

const updateTemplateElement = (options: Record<string, any>) => {
  canvas.renderAll()
  templatesStore.modifedElement(handleElement.value, options)
}

</script>

<style lang="scss" scoped>
.line-style-panel {
  user-select: none;
  height: 100%;
  overflow-y: auto;
}
</style>