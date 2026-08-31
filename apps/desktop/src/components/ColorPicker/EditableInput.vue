<template>
  <div class="relative group" :class="props.class">
    <Input
      :model-value="val"
      class="pl-5 pr-2 text-xs h-7 font-mono border-input"
      @update:model-value="handleInput"
    />
    <div class="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground group-hover:text-foreground pointer-events-none select-none">#</div>
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'
import tinycolor, { ColorFormats } from 'tinycolor2'
import { Input } from '@/components/ui/input'

const props = defineProps({
  value: {
    type: Object as PropType<ColorFormats.RGBA>,
    required: true,
  },
  class: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (event: 'colorChange', payload: ColorFormats.RGBA): void
}>()

const val = computed(() => {
  let _hex = ''
  if (props.value.a < 1) _hex = tinycolor(props.value).toHex8String().toUpperCase()
  else _hex = tinycolor(props.value).toHexString().toUpperCase()
  return _hex.replace('#', '')
})

const handleInput = (value: string | number) => {
  const str = String(value)
  if (str.length >= 6) emit('colorChange', tinycolor(str).toRgb())
}
</script>
