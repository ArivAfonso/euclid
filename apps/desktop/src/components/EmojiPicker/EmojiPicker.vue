<template>
  <div class="emoji-picker flex flex-col w-full" @click.stop>
    <!-- Search Bar -->
    <div class="px-2.5 pt-2.5 pb-1.5">
      <div class="relative">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search emojis..."
          class="w-full h-8 pl-7 pr-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          @keydown.stop
        />
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="flex items-center gap-0.5 px-2 py-1 border-b border-border/50 overflow-x-auto scrollbar-none">
      <!-- Recently Used tab -->
      <button
        v-if="recentEmojis.length > 0 && !searchQuery"
        class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-primary/10 text-primary': activeSection === 'recent' }"
        @click="activeSection = 'recent'"
        title="Recently Used"
      >
        🕐
      </button>
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-sm hover:bg-muted transition-colors"
        :class="{ 'bg-primary/10 text-primary': activeSection === cat.key }"
        @click="activeSection = cat.key"
        :title="cat.label"
      >
        {{ cat.icon }}
      </button>
    </div>

    <!-- Emoji Grid -->
    <div ref="gridContainer" class="flex-1 overflow-y-auto px-2 py-1.5" style="max-height: 280px;">
      <!-- Search Results -->
      <template v-if="searchQuery">
        <div v-if="searchResults.length === 0" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <span class="text-3xl mb-2">🔍</span>
          <p class="text-xs">No emojis found</p>
        </div>
        <div v-else class="grid grid-cols-8 gap-0.5">
          <EmojiButton
            v-for="entry in searchResults"
            :key="entry.emoji"
            :entry="entry"
            :skin-tone="skinTonePreference"
            @select="onSelect"
          />
        </div>
      </template>

      <!-- Recent Emojis -->
      <template v-else-if="activeSection === 'recent'">
        <div v-if="recentEmojis.length === 0" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <span class="text-3xl mb-2">🕐</span>
          <p class="text-xs">No recently used emojis</p>
        </div>
        <div v-else class="grid grid-cols-8 gap-0.5">
          <EmojiButton
            v-for="entry in recentEmojis"
            :key="entry.emoji"
            :entry="entry"
            :skin-tone="skinTonePreference"
            @select="onSelect"
          />
        </div>
      </template>

      <!-- Category Grid -->
      <template v-else>
        <div class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5 py-1 sticky top-0 bg-white/80 dark:bg-[hsl(0,0%,9%)]/80 backdrop-blur-sm">
          {{ currentCategoryLabel }}
        </div>
        <div class="grid grid-cols-8 gap-0.5">
          <EmojiButton
            v-for="entry in categoryEmojis"
            :key="entry.emoji"
            :entry="entry"
            :skin-tone="skinTonePreference"
            @select="onSelect"
          />
        </div>
      </template>
    </div>

    <!-- Footer: Skin Tone Picker -->
    <div class="flex items-center justify-between px-2.5 py-1.5 border-t border-border/50">
      <div class="flex items-center gap-1">
        <span class="text-[10px] text-muted-foreground mr-1">Skin:</span>
        <button
          v-for="tone in skinTones"
          :key="tone.value"
          class="w-5 h-5 flex items-center justify-center rounded text-sm hover:bg-muted transition-colors"
          :class="{ 'ring-1 ring-primary ring-offset-1': skinTonePreference === tone.value }"
          @click="onSkinToneChange(tone.value)"
          :title="tone.label"
        >
          <span class="text-xs">{{ tone.value || '✋' }}</span>
        </button>
      </div>
      <button
        v-if="recentEmojis.length > 0 && activeSection === 'recent'"
        class="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
        @click="clearRecents"
      >
        Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Search } from 'lucide-vue-next'
import { searchEmoji, getRecentEmojis, clearRecentEmojis } from '@/lib/emoji/emojiSearch'
import {
  EMOJI_CATEGORIES,
  getEmojisByCategory,
  type EmojiCategory,
  type EmojiEntry,
} from '@/lib/emoji/emojiData'
import { useEmojiStore } from '@/store/modules/emoji'
import EmojiButton from './EmojiButton.vue'

const emit = defineEmits<{
  (e: 'select', emoji: string): void
}>()

const emojiStore = useEmojiStore()

const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const activeSection = ref<string>(emojiStore.activeCategory || 'smileys')
const gridContainer = ref<HTMLElement>()

const categories = EMOJI_CATEGORIES

const skinTones = [
  { value: '', label: 'Default' },
  { value: '🏻', label: 'Light' },
  { value: '🏼', label: 'Medium-Light' },
  { value: '🏽', label: 'Medium' },
  { value: '🏾', label: 'Medium-Dark' },
  { value: '🏿', label: 'Dark' },
]

const skinTonePreference = computed(() => emojiStore.currentSkinTone)

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  return searchEmoji(searchQuery.value)
})

const recentEmojis = computed(() => emojiStore.recentEmojis)

const categoryEmojis = computed(() => {
  const key = activeSection.value as EmojiCategory
  return getEmojisByCategory(key)
})

const currentCategoryLabel = computed(() => {
  const cat = categories.find((c) => c.key === activeSection.value)
  return cat?.label || ''
})

function onSelect(entry: EmojiEntry) {
  let emoji = entry.emoji
  // Apply skin tone if available and preferred
  if (entry.skinTones.length > 0 && skinTonePreference.value) {
    emoji = emoji + skinTonePreference.value
  }
  emit('select', emoji)
}

function onSkinToneChange(tone: string) {
  emojiStore.setSkinTone(tone)
}

function clearRecents() {
  emojiStore.clearRecents()
}

watch(searchQuery, (val) => {
  if (val) {
    // When searching, ensure we're in a "search" visual state
    activeSection.value = 'smileys'
  }
})

// Auto-focus search on mount
onMounted(() => {
  nextTick(() => {
    searchInput.value?.focus()
  })
})
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
