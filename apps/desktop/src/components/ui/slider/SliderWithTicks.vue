<script setup lang="ts">
import { computed } from 'vue'
import Slider from './Slider.vue'

const props = withDefaults(defineProps<{
  modelValue?: number[]
  min?: number
  max?: number
  step?: number
  tickStep?: number
  labelInterval?: number
  integerLabels?: boolean
  labelMultiplier?: number
  showTicks?: boolean
  disabled?: boolean
  inverted?: boolean
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  thumbAlignment?: 'contain' | 'overflow'
}>(), {
  min: 0,
  max: 100,
  step: 1,
  showTicks: true,
  orientation: 'horizontal',
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  'value-commit': [value: number[]]
}>()

const computedTickStep = computed(() => {
  if (props.tickStep) return props.tickStep
  const range = props.max - props.min
  const automaticStep = range <= 1
    ? 0.1
    : range <= 2
      ? 0.2
      : range <= 5
        ? 0.5
        : range <= 20
          ? 2
          : range <= 50
            ? 5
            : range <= 200
              ? 20
              : range <= 400
                ? 40
                : Math.ceil(range / 10)

  // Keep enough ticks to make the scale useful without overcrowding it.
  return Math.max(automaticStep, range / 8)
})

const computedLabelInterval = computed(() => {
  if (props.labelInterval) return props.labelInterval
  const range = props.max - props.min
  if (range <= 2) return 5
  if (range <= 5) return 5
  return 2
})

const ticks = computed(() => {
  const step = computedTickStep.value
  const result: { value: number; index: number }[] = []
  const start = Math.ceil(props.min / step) * step
  let idx = 0
  for (let i = start; i <= props.max + step * 0.001; i += step) {
    result.push({ value: Math.round(i * 1000) / 1000, index: idx })
    idx++
  }
  return result
})
</script>

<template>
  <div class="space-y-1">
    <Slider
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :inverted="inverted"
      :orientation="orientation"
      :dir="dir"
      :thumbAlignment="thumbAlignment"
      @update:modelValue="(val: number[]) => emit('update:modelValue', val)"
      @value-commit="(val: number[]) => emit('value-commit', val)"
    />
    <span
      v-if="showTicks && ticks.length > 0"
      aria-hidden="true"
      class="text-muted-foreground flex w-full items-center justify-between gap-1 px-[8px] text-[9px] font-medium leading-none"
    >
      <span
        v-for="tick in ticks"
        :key="tick.value"
        class="flex w-0 flex-col items-center justify-center gap-1"
      >
        <span class="bg-muted-foreground/70 w-px h-1" />
        <span
          class="select-none"
        >{{ integerLabels ? Math.round(tick.value * (labelMultiplier ?? 1)) : tick.value * (labelMultiplier ?? 1) }}</span>
      </span>
    </span>
  </div>
</template>
