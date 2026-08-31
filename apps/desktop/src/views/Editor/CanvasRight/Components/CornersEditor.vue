<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Corners
      </h3>
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 text-[10px] font-bold"
          :class="{ 'text-primary bg-primary/10': !useIndividual, 'text-muted-foreground': useIndividual }"
          @click="setUniform"
          title="Uniform corners"
        >
          R
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-6 w-6 text-[10px] font-bold"
          :class="{ 'text-primary bg-primary/10': useIndividual, 'text-muted-foreground': !useIndividual }"
          @click="setIndividual"
          title="Individual corners"
        >
          ⤢
        </Button>
      </div>
    </div>

    <!-- Uniform mode -->
    <template v-if="!useIndividual">
      <div class="space-y-1">
        <div class="flex items-center justify-between text-[10px]">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Radius class="h-2.5 w-2.5" />Radius</Label>
          <span class="text-[10px] font-mono text-muted-foreground">{{ uniformValue }}px</span>
        </div>
        <SliderWithTicks
          :model-value="[uniformValue]"
          @update:model-value="(val) => onUniformSlide(val)"
          @value-commit="(val) => onUniformCommit(val)"
          :min="0"
          :max="maxRadius || 200"
          :step="1"
          :disabled="maxRadius === 0"
        />
      </div>
    </template>

    <!-- Individual mode -->
    <template v-else>
      <div class="space-y-3">
        <!-- Top-Left -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[10px]">
            <Label class="text-[10px] text-muted-foreground">Top Left</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ corners.tl }}px</span>
          </div>
          <SliderWithTicks
            :model-value="[corners.tl]"
            @update:model-value="(val) => onCornerSlide('tl', val)"
            @value-commit="onCornerCommit"
            :min="0"
            :max="maxRadius || 200"
            :step="1"
            :disabled="maxRadius === 0"
          />
        </div>

        <!-- Top-Right -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[10px]">
            <Label class="text-[10px] text-muted-foreground">Top Right</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ corners.tr }}px</span>
          </div>
          <SliderWithTicks
            :model-value="[corners.tr]"
            @update:model-value="(val) => onCornerSlide('tr', val)"
            @value-commit="onCornerCommit"
            :min="0"
            :max="maxRadius || 200"
            :step="1"
            :disabled="maxRadius === 0"
          />
        </div>

        <!-- Bottom-Left -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[10px]">
            <Label class="text-[10px] text-muted-foreground">Bottom Left</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ corners.bl }}px</span>
          </div>
          <SliderWithTicks
            :model-value="[corners.bl]"
            @update:model-value="(val) => onCornerSlide('bl', val)"
            @value-commit="onCornerCommit"
            :min="0"
            :max="maxRadius || 200"
            :step="1"
            :disabled="maxRadius === 0"
          />
        </div>

        <!-- Bottom-Right -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-[10px]">
            <Label class="text-[10px] text-muted-foreground">Bottom Right</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ corners.br }}px</span>
          </div>
          <SliderWithTicks
            :model-value="[corners.br]"
            @update:model-value="(val) => onCornerSlide('br', val)"
            @value-commit="onCornerCommit"
            :min="0"
            :max="maxRadius || 200"
            :step="1"
            :disabled="maxRadius === 0"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue'
import { Label } from '@/components/ui/label'
import { Radius } from 'lucide-vue-next'

export interface CornerValues {
  tl: number
  tr: number
  bl: number
  br: number
}

const props = defineProps<{
  maxRadius: number
  modelValue: { uniform: number; corners: CornerValues; individual: boolean }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { uniform: number; corners: CornerValues; individual: boolean }): void
}>()

const useIndividual = ref(props.modelValue.individual)
const uniformValue = ref(props.modelValue.uniform)
const corners = ref<CornerValues>({ ...props.modelValue.corners })

watch(() => props.modelValue, (val) => {
  useIndividual.value = val.individual
  uniformValue.value = val.uniform
  corners.value = { ...val.corners }
}, { deep: true })

const setUniform = () => {
  useIndividual.value = false
  emitUpdate()
}

const setIndividual = () => {
  // When switching to individual, pre-fill all corners with the uniform value
  corners.value = { tl: uniformValue.value, tr: uniformValue.value, bl: uniformValue.value, br: uniformValue.value }
  useIndividual.value = true
  emitUpdate()
}

const clamp = (v: number) => Math.max(0, Math.min(Math.round(v), props.maxRadius || 200))

const onUniformSlide = (val?: number[]) => {
  if (!val || val.length === 0) return
  uniformValue.value = clamp(val[0])
  emitUpdate()
}

const onUniformCommit = (val?: number[]) => {
  if (!val || val.length === 0) return
  uniformValue.value = clamp(val[0])
  emitUpdate()
}

const onCornerSlide = (key: keyof CornerValues, val?: number[]) => {
  if (!val || val.length === 0) return
  corners.value[key] = clamp(val[0])
  emitUpdate()
}

const onCornerCommit = () => {
  emitUpdate()
}

const emitUpdate = () => {
  emit('update:modelValue', {
    uniform: uniformValue.value,
    corners: { ...corners.value },
    individual: useIndividual.value,
  })
}
</script>

