import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEmojiStore } from '@/store/modules/emoji'
import { EMOJI_DATABASE } from '@/lib/emoji/emojiData'

const RECENT_KEY = 'euclid-emoji-recent'
const SKIN_TONE_KEY = 'euclid-emoji-skintone'

/** Pick real emojis that exist in the database so recent-list lookups resolve. */
const sampleEmojis = Array.from(new Set(EMOJI_DATABASE.map((entry) => entry.emoji))).slice(0, 35)

describe('store/emoji', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('panel state', () => {
    it('starts closed with an empty search', () => {
      const store = useEmojiStore()
      expect(store.isEmojiPanelOpen).toBe(false)
      expect(store.searchQuery).toBe('')
      expect(store.activeCategory).toBe('smileys')
    })

    it('opens, closes and toggles the panel', () => {
      const store = useEmojiStore()

      store.openPanel()
      expect(store.isEmojiPanelOpen).toBe(true)

      store.closePanel()
      expect(store.isEmojiPanelOpen).toBe(false)

      store.togglePanel()
      expect(store.isEmojiPanelOpen).toBe(true)
      store.togglePanel()
      expect(store.isEmojiPanelOpen).toBe(false)
    })

    it('closing the panel clears the search query', () => {
      const store = useEmojiStore()
      store.searchQuery = 'grinning'
      store.openPanel()

      store.closePanel()

      expect(store.searchQuery).toBe('')
    })
  })

  describe('recents', () => {
    it('starts empty', () => {
      const store = useEmojiStore()
      expect(store.recentEmojis).toEqual([])
    })

    it('records selections at the top of the recent list', () => {
      const store = useEmojiStore()
      const [first, second] = sampleEmojis

      store.onEmojiSelect(first)
      store.onEmojiSelect(second)

      expect(store.recentEmojis.map((e) => e.emoji)).toEqual([second, first])
      expect(JSON.parse(localStorage.getItem(RECENT_KEY)!)).toEqual([second, first])
    })

    it('deduplicates repeated selections', () => {
      const store = useEmojiStore()
      const emoji = sampleEmojis[0]

      store.onEmojiSelect(emoji)
      store.onEmojiSelect(emoji)

      expect(store.recentEmojis).toHaveLength(1)
      expect(JSON.parse(localStorage.getItem(RECENT_KEY)!)).toEqual([emoji])
    })

    it('caps the recent list at 30 entries', () => {
      const store = useEmojiStore()

      for (const emoji of sampleEmojis) store.onEmojiSelect(emoji)

      const stored = JSON.parse(localStorage.getItem(RECENT_KEY)!)
      expect(stored).toHaveLength(30)
      expect(store.recentEmojis).toHaveLength(30)
    })

    it('clears recents from state and storage', () => {
      const store = useEmojiStore()
      store.onEmojiSelect(sampleEmojis[0])

      store.clearRecents()

      expect(store.recentEmojis).toEqual([])
      expect(localStorage.getItem(RECENT_KEY)).toBeNull()
    })

    it('hydrates recents from localStorage on creation', () => {
      localStorage.setItem(RECENT_KEY, JSON.stringify([sampleEmojis[1]]))
      const store = useEmojiStore()
      expect(store.recentEmojis.map((e) => e.emoji)).toEqual([sampleEmojis[1]])
    })
  })

  describe('skin tone', () => {
    it('defaults to an empty preference', () => {
      const store = useEmojiStore()
      expect(store.skinTonePreference).toBe('')
      expect(store.currentSkinTone).toBe('')
    })

    it('persists a selected skin tone', () => {
      const store = useEmojiStore()

      store.setSkinTone('medium-dark')

      expect(store.skinTonePreference).toBe('medium-dark')
      expect(store.currentSkinTone).toBe('medium-dark')
      expect(localStorage.getItem(SKIN_TONE_KEY)).toBe('medium-dark')
    })

    it('clears the stored tone when set to an empty string', () => {
      const store = useEmojiStore()
      store.setSkinTone('light')

      store.setSkinTone('')

      expect(localStorage.getItem(SKIN_TONE_KEY)).toBeNull()
      expect(store.currentSkinTone).toBe('')
    })

    it('hydrates the preference from localStorage on creation', () => {
      localStorage.setItem(SKIN_TONE_KEY, 'dark')
      const store = useEmojiStore()
      expect(store.skinTonePreference).toBe('dark')
    })
  })
})
