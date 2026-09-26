import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Pinia } from 'pinia'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useMainStore } from '@/store'

describe('components/ThemeToggle', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    document.documentElement.classList.remove('dark')
  })

  it('renders an accessible toggle button', () => {
    const wrapper = mount(ThemeToggle, { global: { plugins: [pinia] } })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(wrapper.text()).toContain('Toggle theme')
  })

  it('flips dark mode on click via the main store', async () => {
    const store = useMainStore()
    const wrapper = mount(ThemeToggle, { global: { plugins: [pinia] } })

    await wrapper.find('button').trigger('click')
    expect(store.isDarkMode).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')

    await wrapper.find('button').trigger('click')
    expect(store.isDarkMode).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('reflects a dark mode toggled elsewhere', async () => {
    const store = useMainStore()
    store.setDarkMode(true)

    const wrapper = mount(ThemeToggle, { global: { plugins: [pinia] } })
    await wrapper.find('button').trigger('click')

    expect(store.isDarkMode).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
