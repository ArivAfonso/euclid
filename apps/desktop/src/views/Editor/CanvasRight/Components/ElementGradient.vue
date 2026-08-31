<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Gradient
      </h3>
      <Switch :checked="hasGradient" @update:checked="toggleColorMask" />
    </div>
    
    <template v-if="hasGradient">
      <div class="space-y-2">
        <!-- Mask Color -->
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide">Mask Color</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="w-4 h-4 rounded border border-border" 
                    :style="{ backgroundColor: maskColor }"
                  ></div>
                  <span class="text-xs font-mono">{{ toHex(maskColor) }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker
                :modelValue="maskColor"
                @update:modelValue="(color: string) => updateMaskColor(color)"
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Opacity -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Opacity</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ maskAlpha.toFixed(2) }}</span>
          </div>
          <SliderWithTicks 
            :model-value="[maskAlpha]"
            @update:model-value="(val) => val && (maskAlpha = val[0])"
            @value-commit="updateMaskAlpha"
            :min="0"
            :max="1"
            :step="0.01"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { ImageElement } from '@/types/canvas'
import { filters, Image } from 'fabric'
import useCanvas from '@/views/Canvas/useCanvas'
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toHex } from '@/utils/color';

const BlendColorFilter = 'BlendColor'
const maskColor = ref('')
const maskAlpha = ref(0.3)

const { canvasObject } = storeToRefs(useMainStore())

const hasGradient = ref(false)
const handleElement = computed(() => canvasObject.value as Image)

const updateMaskColor = (color: string) => {
  maskColor.value = color
  changeImageFilter()
}

const updateMaskAlpha = () => {
  changeImageFilter()
}

const changeImageFilter = () => {
  const blendFilter = new filters.BlendColor({
    color: maskColor.value,
    mode: 'add',
    alpha: maskAlpha.value
  })
  handleElement.value.filters = handleElement.value.filters?.filter(obj => obj.type !== BlendColorFilter)
  // @ts-ignore
  handleElement.value.filters?.push(blendFilter)
  handleElement.value.applyFilters()
}

const toggleColorMask = (status: boolean) => {
  if (!handleElement.value) return
  const [ canvas ] = useCanvas()
  hasGradient.value = status
}
</script>

<style lang="scss" scoped>
</style>

