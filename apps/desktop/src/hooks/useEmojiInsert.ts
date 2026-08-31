/**
 * useEmojiInsert Composable
 * Handles inserting emojis into the active Fabric.js textbox on the canvas.
 *
 * During editing, text MUST go through the hidden textarea so Fabric.js can
 * maintain its internal character tracking, cursor positions, and undo history.
 * Directly setting `textbox.text` bypasses the input pipeline and causes corruption.
 */

import { nextTick } from 'vue'
import useCanvas from '@/views/Canvas/useCanvas'
import { useEmojiStore } from '@/store/modules/emoji'
import type { Textbox } from 'fabric'

export default function useEmojiInsert() {
  const [canvas] = useCanvas()
  const emojiStore = useEmojiStore()

  /**
   * Insert an emoji character into the active text element on the canvas.
   *
   * Behavior:
   * - If a textbox is in inline editing mode: insert via hidden textarea
   * - If a textbox is selected but not editing: enter edit mode, then insert
   * - If no text element active: create a new standalone text element with the emoji
   */
  function insertEmoji(emoji: string) {
    if (!canvas) return

    // Record for recent emojis
    emojiStore.onEmojiSelect(emoji)

    const activeObj = canvas.getActiveObject() as Textbox | null

    // CASE 1: Textbox is in inline editing mode — insert via textarea pipeline
    if (activeObj?.isEditing && (activeObj.type === 'textbox' || activeObj.type === 'i-text')) {
      insertViaTextarea(activeObj, emoji)
      return
    }

    // CASE 2: Textbox selected but NOT editing — enter edit mode, then insert
    if (activeObj && (activeObj.type === 'textbox' || activeObj.type === 'i-text')) {
      activeObj.enterEditing()
      // Wait for Fabric.js to fully initialize the hidden textarea
      nextTick(() => {
        nextTick(() => {
          insertViaTextarea(activeObj, emoji)
        })
      })
      return
    }

    // CASE 3: No text element active — create a new text element with just the emoji
    createEmojiTextElement(emoji)
  }

  /**
   * Insert emoji through Fabric.js's hidden textarea.
   * This preserves Fabric's internal state: character bounds, cursor tracking,
   * undo history, and grapheme splitting all work correctly.
   */
  function insertViaTextarea(textbox: Textbox, emoji: string) {
    // Get the actual DOM textarea from Fabric's hidden textarea wrapper
    // Fabric.js v6 wraps it — the DOM element is at .nativeEl or is the element itself
    const hiddenTextarea = textbox.hiddenTextarea as any
    const textareaEl: HTMLTextAreaElement | null = hiddenTextarea?.nativeEl || hiddenTextarea

    if (!textareaEl || !textareaEl.focus) {
      // Fallback: enter editing and retry once
      textbox.enterEditing()
      nextTick(() => {
        nextTick(() => {
          const retryHidden = textbox.hiddenTextarea as any
          const retryEl: HTMLTextAreaElement | null = retryHidden?.nativeEl || retryHidden
          if (retryEl?.focus) {
            doInsert(retryEl, textbox, emoji)
          }
        })
      })
      return
    }

    doInsert(textareaEl, textbox, emoji)
  }

  /**
   * Core insertion: focus textarea, sync selection, insert text, let Fabric.js handle the rest.
   */
  function doInsert(textareaEl: HTMLTextAreaElement, textbox: Textbox, emoji: string) {
    // 1. Focus the hidden textarea
    textareaEl.focus()

    // 2. Sync the textarea's selection to match the Fabric textbox cursor position
    const start = textbox.selectionStart ?? 0
    const end = textbox.selectionEnd ?? 0
    textareaEl.setSelectionRange(start, end)

    // 3. Insert via execCommand — this fires the native 'input' event
    //    that Fabric.js listens to, keeping all internal state in sync
    const inserted = document.execCommand('insertText', false, emoji)

    if (!inserted) {
      // Fallback for browsers that don't support execCommand 'insertText'
      insertViaSetRangeText(textareaEl, textbox, emoji)
    }

    // 4. Request render so the canvas updates
    canvas.requestRenderAll()
  }

  /**
   * Fallback insertion using setRangeText + manual input event dispatch.
   * Used when execCommand returns false (some browser contexts).
   */
  function insertViaSetRangeText(textareaEl: HTMLTextAreaElement, textbox: Textbox, emoji: string) {
    const start = textareaEl.selectionStart
    const end = textareaEl.selectionEnd
    const currentValue = textareaEl.value

    // Insert into the textarea value
    textareaEl.value = currentValue.slice(0, start) + emoji + currentValue.slice(end)

    // Move textarea cursor after the emoji
    const newPos = start + emoji.length
    textareaEl.setSelectionRange(newPos, newPos)

    // Dispatch input event so Fabric.js picks up the change
    textareaEl.dispatchEvent(new InputEvent('input', {
      inputType: 'insertText',
      data: emoji,
      bubbles: true,
      cancelable: true,
    }))
  }

  /**
   * Create a new standalone text element containing just an emoji.
   */
  function createEmojiTextElement(emoji: string) {
    // Import dynamically to avoid circular deps
    import('@/hooks/useHandleCreate').then(({ default: useHandleCreate }) => {
      const { createTextElement } = useHandleCreate()
      createTextElement(72, 'transverse', false, emoji)
    })
  }

  return {
    insertEmoji,
  }
}
