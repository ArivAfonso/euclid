<template>
  <section class="space-y-2">
    <div v-for="(group, groupIndex) in groups" :key="group.type" class="space-y-1.5">
      <h3 class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground select-none">
        {{ group.type }}
      </h3>
      <div class="grid grid-cols-6 gap-1">
        <button
          v-for="(line, lineIndex) in group.children"
          :key="lineIndex"
          type="button"
          class="group flex aspect-square items-center justify-center rounded-md border border-border/50 bg-muted/30 text-foreground transition-all hover:border-primary hover:bg-primary/10 hover:scale-105 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          @click="selectLine(line)"
        >
          <svg
            overflow="visible"
            width="20"
            height="20"
            class="text-muted-foreground transition-colors group-hover:text-primary"
          >
            <defs>
              <LinePointMarker
                v-if="line.points[0]"
                :id="`preset-line-${groupIndex}-${lineIndex}`"
                :type="line.points[0]"
                position="start"
                color="currentColor"
                :baseSize="1.5"
              />
              <LinePointMarker
                v-if="line.points[1]"
                :id="`preset-line-${groupIndex}-${lineIndex}`"
                :type="line.points[1]"
                position="end"
                color="currentColor"
                :baseSize="1.5"
              />
            </defs>
            <path
              :d="line.path"
              stroke="currentColor"
              fill="none"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              :stroke-dasharray="line.style === 'solid' ? '0,0' : '3,2'"
              :marker-start="line.points[0] ? `url(#${`preset-line-${groupIndex}-${lineIndex}`}-${line.points[0]}-start)` : ''"
              :marker-end="line.points[1] ? `url(#${`preset-line-${groupIndex}-${lineIndex}`}-${line.points[1]}-end)` : ''"
            />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import type { LinePoolItem } from '@/types/elements'
import { PathLineLibs, type PresetLine } from '@/configs/lines'

const props = defineProps({
  groups: {
    type: Array as PropType<PresetLine[]>,
    default: () => PathLineLibs,
  },
})

const emit = defineEmits<{
  (event: 'select', payload: LinePoolItem): void
}>()

const selectLine = (line: LinePoolItem) => {
  emit('select', line)
}
</script>
