<template>
  <CommandItem
    ref="itemRef"
    :value="font.value"
    class="flex cursor-pointer items-center justify-between px-2 py-2 text-xs"
    @select="handleSelect"
    @mouseenter="handleHover"
  >
    <Check :class="cn('mr-2 h-3 w-3 transition-opacity', isSelected ? 'opacity-100' : 'opacity-0')" />
    <span :style="textStyle" class="flex-1 truncate transition-opacity duration-200">
      {{ font.label }}
    </span>
  </CommandItem>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { Check } from 'lucide-vue-next'
import { CommandItem } from '@/components/ui/command'
import { cn } from '@/lib/utils'

type FontOption = {
  label: string
  value: string
}

const props = defineProps<{
  font: FontOption
  isSelected: boolean
  ensureFont: (family: string) => void
  onSelect: (family: string) => void
  isGoogleFont: boolean
}>()

const itemRef = ref<HTMLElement | null>(null)
const hasBeenInView = ref(false)

const ensurePreviewFont = () => {
  if (!hasBeenInView.value) {
    hasBeenInView.value = true
  }
  if (props.isGoogleFont) {
    props.ensureFont(props.font.value)
  }
}

useIntersectionObserver(
  itemRef,
  ([entry]) => {
    if (entry.isIntersecting) {
      ensurePreviewFont()
    }
  },
  {
    root: null,
    rootMargin: '120px 0px',
    threshold: 0.1,
  },
)

watch(
  () => props.isSelected,
  (selected) => {
    if (selected) {
      ensurePreviewFont()
    }
  },
  { immediate: false },
)

const textStyle = computed(() => {
  if (!props.isGoogleFont) {
    return { fontFamily: props.font.value, opacity: 1 }
  }
  if (hasBeenInView.value) {
    return { fontFamily: props.font.value, opacity: 1 }
  }
  return { opacity: 0.7 }
})

const handleSelect = () => {
  ensurePreviewFont()
  props.onSelect(props.font.value)
}

const handleHover = () => {
  ensurePreviewFont()
}
</script>
