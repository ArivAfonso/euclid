import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Page404 from '@/views/Error/404.vue'

const push = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

describe('views/Error/404', () => {
  it('renders the not-found messaging', () => {
    const wrapper = mount(Page404)

    expect(wrapper.text()).toContain('404')
    expect(wrapper.text()).toContain("This artboard doesn't exist")
    expect(wrapper.text()).toContain('HTTP 404 · Not Found')
  })

  it('renders the fallback web titlebar when not running in Electron', () => {
    const wrapper = mount(Page404)

    expect(wrapper.text()).toContain('Euclid')
    // ElectronTitlebar is skipped in web/test mode
    expect(wrapper.findComponent({ name: 'ElectronTitlebar' }).exists()).toBe(false)
  })

  it('navigates back to the projects list', async () => {
    const wrapper = mount(Page404)
    push.mockClear()

    await wrapper.findAll('button')[0].trigger('click')

    expect(push).toHaveBeenCalledWith('/projects')
  })

  it('navigates to the home route', async () => {
    const wrapper = mount(Page404)
    push.mockClear()

    await wrapper.findAll('button')[1].trigger('click')

    expect(push).toHaveBeenCalledWith('/')
  })
})
