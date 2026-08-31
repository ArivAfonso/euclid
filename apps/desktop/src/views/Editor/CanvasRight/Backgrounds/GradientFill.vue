<template>
  <svg 
    :width="width"
    :height="height"
    viewBox="0 0 200 30"
    preserveAspectRatio="none"
    class="block overflow-hidden rounded-md"
  >
    <defs>
      <linearGradient v-if="type === 'linear'" :id="name" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop v-for="(item, index) in colors" :key="index" :offset="`${item.offset * 100}%`" :stop-color="item.color" />
      </linearGradient>

      <radialGradient v-else :id="name" cx="50%" cy="50%" r="75%">
        <stop v-for="(item, index) in colors" :key="index" :offset="`${item.offset * 100}%`" :stop-color="item.color" />
      </radialGradient>
    </defs>

    <rect x="0.5" y="0.5" width="199" height="29" rx="4" :fill="`url(#${name})`" class="[shape-rendering:geometricPrecision]" />
    <rect x="0.5" y="0.5" width="199" height="29" rx="4" class="fill-none stroke-1 stroke-[hsl(var(--border))] [vector-effect:non-scaling-stroke]" />
    <rect x="1.5" y="1.5" width="197" height="27" rx="3" class="fill-transparent stroke-1 stroke-[rgba(255,255,255,0.08)] [vector-effect:non-scaling-stroke]" />
  </svg>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { ColorStop } from '@/types/elements'

defineProps({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String as PropType<'linear' | 'radial'>,
  },
  colors: {
    type: Object as PropType<ColorStop[]>,
    required: true,
  },
  rotate: {
    type: Number,
    default: 0,
  },
  width: {
    type: [String, Number],
    default: '100%',
  },
  height: {
    type: [String, Number],
    default: '100%',
  },
})
</script>
