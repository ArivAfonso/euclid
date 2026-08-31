<template>
  <button
    class="emoji-btn relative w-8 h-8 flex items-center justify-center rounded-md text-xl hover:bg-muted/80 transition-all cursor-pointer select-none"
    :class="{ 'hover:scale-125': true }"
    :title="displayName"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    {{ displayEmoji }}
    <!-- Skin tone indicator dot -->
    <span
      v-if="entry.skinTones.length > 0 && skinTone"
      class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary/60"
    ></span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EmojiEntry } from '@/lib/emoji/emojiData'

const props = defineProps<{
  entry: EmojiEntry
  skinTone: string
}>()

const emit = defineEmits<{
  (e: 'select', entry: EmojiEntry): void
}>()

const isHovered = ref(false)

const displayEmoji = computed(() => {
  if (props.entry.skinTones.length > 0 && props.skinTone && !isHovered.value) {
    return props.entry.emoji + props.skinTone
  }
  return props.entry.emoji
})

const displayName = computed(() => {
  return props.entry.names[0] || ''
})

function handleClick() {
  emit('select', props.entry)
}
</script>
