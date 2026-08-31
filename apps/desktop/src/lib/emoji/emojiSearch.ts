/**
 * Emoji Search Utility
 * Fuzzy search across emoji names with debounced filtering.
 */

import {
  EMOJI_DATABASE,
  type EmojiEntry,
  type EmojiCategory,
  EMOJI_CATEGORIES,
} from './emojiData'

/** Maximum recent emojis to store */
const MAX_RECENT = 30
const RECENT_KEY = 'euclid-emoji-recent'

/**
 * Search emojis by query string.
 * Matches against all names/aliases for each emoji.
 * Results are scored: exact name match > prefix > substring.
 */
export function searchEmoji(query: string): EmojiEntry[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const scored: Array<{ entry: EmojiEntry; score: number }> = []

  for (const entry of EMOJI_DATABASE) {
    let bestScore = 0
    for (const name of entry.names) {
      const nl = name.toLowerCase()
      if (nl === q) {
        bestScore = Math.max(bestScore, 3) // exact
      } else if (nl.startsWith(q)) {
        bestScore = Math.max(bestScore, 2) // prefix
      } else if (nl.includes(q)) {
        bestScore = Math.max(bestScore, 1) // substring
      }
    }
    if (bestScore > 0) {
      scored.push({ entry, score: bestScore })
    }
  }

  // Sort by score descending, then by original order
  scored.sort((a, b) => b.score - a.score)
  return scored.map((s) => s.entry)
}

/**
 * Get emojis for the "frequently used" section.
 * Reads from localStorage.
 */
export function getRecentEmojis(): EmojiEntry[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY)
    if (!stored) return []
    const codes: string[] = JSON.parse(stored)
    const map = new Map(EMOJI_DATABASE.map((e) => [e.emoji, e]))
    return codes.map((c) => map.get(c)).filter(Boolean) as EmojiEntry[]
  } catch {
    return []
  }
}

/**
 * Add an emoji to the recent list (at the top).
 */
export function addRecentEmoji(emoji: string): void {
  try {
    let recent: string[] = []
    const stored = localStorage.getItem(RECENT_KEY)
    if (stored) {
      recent = JSON.parse(stored)
    }
    // Remove if already present, then prepend
    recent = recent.filter((e) => e !== emoji)
    recent.unshift(emoji)
    recent = recent.slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch {
    // Silently fail if localStorage unavailable
  }
}

/**
 * Clear the recent emojis list.
 */
export function clearRecentEmojis(): void {
  try {
    localStorage.removeItem(RECENT_KEY)
  } catch {
    // no-op
  }
}

/**
 * Get the skin tone preference for the user.
 */
export function getSkinTonePreference(): string {
  try {
    return localStorage.getItem('euclid-emoji-skintone') || ''
  } catch {
    return ''
  }
}

/**
 * Set the skin tone preference.
 */
export function setSkinTonePreference(tone: string): void {
  try {
    if (tone) {
      localStorage.setItem('euclid-emoji-skintone', tone)
    } else {
      localStorage.removeItem('euclid-emoji-skintone')
    }
  } catch {
    // no-op
  }
}
