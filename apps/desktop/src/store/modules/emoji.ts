/**
 * Emoji Store (Pinia)
 * Manages emoji panel state, recent usage, and skin tone preference.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getRecentEmojis,
  addRecentEmoji,
  clearRecentEmojis,
  getSkinTonePreference,
  setSkinTonePreference,
} from '@/lib/emoji/emojiSearch'
import type { EmojiCategory } from '@/lib/emoji/emojiData'

export const useEmojiStore = defineStore('emoji', () => {
  const isEmojiPanelOpen = ref(false)
  const searchQuery = ref('')
  const activeCategory = ref<EmojiCategory>('smileys')
  const recentEmojis = ref(getRecentEmojis())
  const skinTonePreference = ref(getSkinTonePreference())

  /** Current skin tone modifier string */
  const currentSkinTone = computed(() => skinTonePreference.value)

  /** Refresh recent emojis from localStorage */
  function refreshRecent() {
    recentEmojis.value = getRecentEmojis()
  }

  /** Record an emoji usage */
  function onEmojiSelect(emoji: string) {
    addRecentEmoji(emoji)
    refreshRecent()
  }

  /** Update skin tone preference */
  function setSkinTone(tone: string) {
    skinTonePreference.value = tone
    setSkinTonePreference(tone)
  }

  /** Toggle the panel open/close */
  function togglePanel() {
    isEmojiPanelOpen.value = !isEmojiPanelOpen.value
  }

  function openPanel() {
    isEmojiPanelOpen.value = true
  }

  function closePanel() {
    isEmojiPanelOpen.value = false
    searchQuery.value = ''
  }

  /** Clear recent emojis */
  function clearRecents() {
    clearRecentEmojis()
    refreshRecent()
  }

  return {
    isEmojiPanelOpen,
    searchQuery,
    activeCategory,
    recentEmojis,
    skinTonePreference,
    currentSkinTone,
    refreshRecent,
    onEmojiSelect,
    setSkinTone,
    togglePanel,
    openPanel,
    closePanel,
    clearRecents,
  }
})
