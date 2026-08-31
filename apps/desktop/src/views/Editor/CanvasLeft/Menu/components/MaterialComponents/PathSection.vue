<template>
  <section class="space-y-2">
    <div v-for="category in categories" :key="category.type" class="space-y-1.5">
      <h3 class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground select-none">
        {{ category.type }}
      </h3>
      <div class="grid grid-cols-6 gap-1">
        <button
          v-for="(shape, index) in category.children"
          :key="index"
          type="button"
          class="group flex aspect-square items-center justify-center rounded-md border border-border/50 bg-muted/30 transition-all hover:border-primary hover:bg-primary/10 hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          @click="selectShape(shape)"
        >
          <svg
            overflow="visible"
            width="20"
            height="20"
            class="text-muted-foreground transition-colors group-hover:text-primary"
          >
            <g :transform="`scale(${20 / shape.viewBox[0]}, ${20 / shape.viewBox[1]})`">
              <path
                vector-effect="non-scaling-stroke"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-miterlimit="8"
                :fill="shape.outlined ? 'currentColor' : 'transparent'"
                :stroke="shape.outlined ? 'transparent' : 'currentColor'"
                stroke-width="1.5"
                :d="shape.path"
              />
            </g>
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { PathShapeLibs } from '@/configs/shape'
import type { PathPoolItem } from '@/types/elements'

const props = defineProps({
  categories: {
    type: Array as PropType<typeof PathShapeLibs>,
    default: () => PathShapeLibs,
  },
})

const emit = defineEmits<{
  (event: 'select', payload: PathPoolItem): void
}>()

const selectShape = (shape: PathPoolItem) => {
  emit('select', shape)
}
</script>
