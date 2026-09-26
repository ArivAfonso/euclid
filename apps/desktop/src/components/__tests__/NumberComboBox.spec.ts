import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import NumberComboBox from '@/components/NumberComboBox.vue'

const mountCombo = (props: Record<string, unknown> = {}) =>
  mount(NumberComboBox, {
    props: { modelValue: '10', options: [8, 10, 12, 16], ...props },
    attachTo: document.body,
  })

const input = (wrapper: VueWrapper<any>) => wrapper.find('input')

const emissions = (wrapper: VueWrapper<any>) =>
  (wrapper.emitted('update:modelValue') ?? []).map((args) => args[0] as string)

describe('components/NumberComboBox', () => {
  describe('display', () => {
    it('renders the current value', () => {
      const wrapper = mountCombo()
      expect(input(wrapper).element.value).toBe('10')
    })

    it('reacts to modelValue changes from the outside', async () => {
      const wrapper = mountCombo()

      await wrapper.setProps({ modelValue: 25 })

      expect(input(wrapper).element.value).toBe('25')
    })

    it('renders the placeholder', () => {
      const wrapper = mountCombo({ modelValue: '', placeholder: 'Width' })
      expect(input(wrapper).attributes('placeholder')).toBe('Width')
    })
  })

  describe('typing', () => {
    it('emits raw string values while typing', async () => {
      const wrapper = mountCombo()

      await input(wrapper).setValue('1')
      await input(wrapper).setValue('15')

      expect(emissions(wrapper)).toEqual(['1', '15'])
    })
  })

  describe('blur normalization', () => {
    it('reverts empty input to the current model value without emitting', async () => {
      const wrapper = mountCombo()

      await input(wrapper).setValue('')
      const beforeBlur = emissions(wrapper).length

      await input(wrapper).trigger('blur')

      expect(input(wrapper).element.value).toBe('10')
      expect(emissions(wrapper).length).toBe(beforeBlur)
    })

    it('reverts lone "-" and "." placeholders', async () => {
      const wrapper = mountCombo()

      await input(wrapper).setValue('-')
      await input(wrapper).trigger('blur')
      expect(input(wrapper).element.value).toBe('10')

      await input(wrapper).setValue('.')
      await input(wrapper).trigger('blur')
      expect(input(wrapper).element.value).toBe('10')
    })

    it('truncates decimal input when the integer flag is set', async () => {
      const wrapper = mountCombo({ integer: true })

      // NOTE: the component uses parseInt (which stops at the decimal point)
      // before Math.round, so "3.7" truncates to "3" rather than rounding to "4".
      await input(wrapper).setValue('3.7')
      await input(wrapper).trigger('blur')

      expect(input(wrapper).element.value).toBe('3')
      expect(emissions(wrapper).at(-1)).toBe('3')
    })

    it('keeps decimal values when not integer-constrained', async () => {
      const wrapper = mountCombo({ integer: false })

      await input(wrapper).setValue('3.70')
      await input(wrapper).trigger('blur')

      expect(input(wrapper).element.value).toBe('3.7')
      expect(emissions(wrapper).at(-1)).toBe('3.7')
    })

    it('accepts negative values', async () => {
      const wrapper = mountCombo({ integer: true })

      await input(wrapper).setValue('-12.4')
      await input(wrapper).trigger('blur')

      expect(input(wrapper).element.value).toBe('-12')
      expect(emissions(wrapper).at(-1)).toBe('-12')
    })

    it('does not emit when a non-numeric value cannot be parsed', async () => {
      const wrapper = mountCombo()

      await input(wrapper).setValue('abc')
      const beforeBlur = emissions(wrapper).length

      await input(wrapper).trigger('blur')

      expect(emissions(wrapper).length).toBe(beforeBlur)
      expect(input(wrapper).element.value).toBe('abc')
    })

    it('does not re-emit when the value is already normalized', async () => {
      const wrapper = mountCombo()

      await input(wrapper).setValue('42')
      await input(wrapper).trigger('blur')

      // '42' emitted once while typing, and no duplicate emission on blur
      expect(emissions(wrapper)).toEqual(['42'])
    })
  })

  describe('preset dropdown', () => {
    it('selects an option and closes the popover', async () => {
      const wrapper = mountCombo()

      const chevron = wrapper.find('button[tabindex="-1"]')
      expect(chevron.exists()).toBe(true)

      await chevron.trigger('click')
      await nextTick()

      const optionLabels = Array.from(document.querySelectorAll('button')).map((b) => b.textContent?.trim())
      expect(optionLabels).toContain('16')

      const option = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === '16',
      )!
      option.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()

      expect(input(wrapper).element.value).toBe('16')
      expect(emissions(wrapper).at(-1)).toBe('16')
      // NOTE: reka-ui keeps the closed popover node mounted during its exit
      // transition, which never completes under jsdom — so only assert the
      // selection side effects, not node removal.
    })
  })
})
