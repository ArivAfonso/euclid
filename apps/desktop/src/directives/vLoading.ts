import { DirectiveBinding, VNode } from 'vue'
import { h, render } from 'vue'

interface LoadingBinding extends DirectiveBinding {
  value: boolean
}

let loadingElement: HTMLElement | null = null

const createLoadingSpinner = (): HTMLElement => {
  const div = document.createElement('div')
  div.className = 'loading-spinner-overlay'
  div.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    z-index: 999;
  `

  const spinner = document.createElement('div')
  spinner.className = 'spinner'
  spinner.style.cssText = `
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  `

  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)

  div.appendChild(spinner)
  return div
}

export const vLoading = {
  mounted(el: HTMLElement, binding: LoadingBinding) {
    if (!el.style.position || el.style.position === 'static') {
      el.style.position = 'relative'
    }

    if (binding.value) {
      loadingElement = createLoadingSpinner()
      el.appendChild(loadingElement)
    }
  },
  updated(el: HTMLElement, binding: LoadingBinding) {
    if (!el.style.position || el.style.position === 'static') {
      el.style.position = 'relative'
    }

    const existing = el.querySelector('.loading-spinner-overlay')

    if (binding.value && !existing) {
      loadingElement = createLoadingSpinner()
      el.appendChild(loadingElement)
    } else if (!binding.value && existing) {
      existing.remove()
    }
  },
  unmounted(el: HTMLElement) {
    const existing = el.querySelector('.loading-spinner-overlay')
    if (existing) {
      existing.remove()
    }
  },
}

export default vLoading
