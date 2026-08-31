<template>
  <div />
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useOnboardingStore } from '@/store'

const props = withDefaults(defineProps<{
  /** Unique key for this tour section (e.g. 'projects', 'editor') */
  tourKey: string
  /** Ordered list of steps in Driver.js DriveStep format */
  steps: any[]
  /** Called when all steps are completed */
  onComplete?: () => void
  /** Called when the user closes the tour early */
  onSkip?: () => void
}>(), {
  onComplete: () => {},
  onSkip: () => {},
})

const emit = defineEmits<{
  complete: []
  skip: []
}>()

const onboardingStore = useOnboardingStore()
const driverInstance = ref<ReturnType<typeof driver> | null>(null)
const isDestroyed = ref(false)
let wasSkipped = false

function buildSteps() {
  return props.steps.map((step) => {
    const s: any = { ...step }

    // Ensure every step has required popover defaults
    if (!s.popover) s.popover = {}
    if (!s.popover.popoverClass) s.popover.popoverClass = 'euclid-onboarding-popover'
    if (!s.popover.showButtons) s.popover.showButtons = ['next', 'close']
    if (!s.popover.doneBtnText) s.popover.doneBtnText = 'Finish'
    if (!s.popover.nextBtnText) s.popover.nextBtnText = 'Next'
    if (!s.popover.prevBtnText) s.popover.prevBtnText = 'Back'

    return s
  })
}

function startTour() {
  if (isDestroyed.value) return

  // Destroy any existing instance
  if (driverInstance.value) {
    driverInstance.value.destroy()
  }

  const steps = buildSteps()

  driverInstance.value = driver({
    steps,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayClickBehavior: 'nextStep',
    stagePadding: 6,
    stageRadius: 8,
    popoverClass: 'euclid-onboarding-popover',
    showProgress: true,
    progressText: 'Step {{current}} of {{total}}',
    doneBtnText: 'Finish',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    onDestroyed: () => {
      if (!wasSkipped) {
        onboardingStore.completeOnboarding()
        emit('complete')
        props.onComplete?.()
      } else {
        onboardingStore.skipOnboarding()
      }
    },
    onCloseClick: () => {
      wasSkipped = true
      onboardingStore.skipOnboarding()
      emit('skip')
      props.onSkip?.()
      driverInstance.value?.destroy()
    },
    onPopoverRender: (popover, opts) => {
      // Customize the popover to match app design
      const { config } = opts
      const index = opts.index ?? 0
      const totalSteps = (config.steps?.length ?? 1)

      // Style the progress text
      const progressEl = popover.progress
      if (progressEl) {
        progressEl.style.cssText = `
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
        `
      }

      // Style the title
      const titleEl = popover.title
      if (titleEl) {
        titleEl.style.cssText = `
          font-family: 'Editorial New', serif;
          font-size: 18px;
          font-weight: 300;
          color: hsl(var(--foreground));
          line-height: 1.3;
          margin-bottom: 4px;
        `
      }

      // Style the description
      const descEl = popover.description
      if (descEl) {
        descEl.style.cssText = `
          font-size: 13px;
          font-weight: 400;
          color: hsl(var(--muted-foreground));
          line-height: 1.5;
        `
      }

      // Style the footer
      const footerEl = popover.footer
      if (footerEl) {
        footerEl.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid hsl(var(--border));
        `
      }

      // Style the prev button (hidden by default)
      const prevBtn = popover.previousButton
      if (prevBtn) {
        prevBtn.style.cssText = `
          display: ${index > 0 ? 'inline-flex' : 'none'};
          align-items: center;
          justify-content: center;
          height: 28px;
          padding: 0 12px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid hsl(var(--border));
          border-radius: calc(var(--radius) - 2px);
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          cursor: pointer;
          transition: all 0.15s ease;
        `
        prevBtn.onmouseenter = () => {
          prevBtn.style.background = 'hsl(var(--accent))'
        }
        prevBtn.onmouseleave = () => {
          prevBtn.style.background = 'hsl(var(--background))'
        }
      }

      // Style the next/done button
      const isLastStep = index >= totalSteps - 1
      const nextBtn = isLastStep
        ? (popover.footerButtons?.querySelector('.driver-popover-done-btn') as HTMLElement | null)
        : popover.nextButton
      if (nextBtn) {
        nextBtn.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          padding: 0 14px;
          font-size: 11px;
          font-weight: 600;
          border: none;
          border-radius: calc(var(--radius) - 2px);
          background: #dc2626;
          color: white;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-left: auto;
        `
        nextBtn.onmouseenter = () => {
          nextBtn.style.background = '#b91c1c'
        }
        nextBtn.onmouseleave = () => {
          nextBtn.style.background = '#dc2626'
        }
      }

      // Style the close (X) button — BIGGER top-right cross
      const closeBtn = popover.closeButton
      if (closeBtn) {
        closeBtn.style.cssText = `
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          font-size: 22px;
          font-weight: 700;
          line-height: 1;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          transition: all 0.15s ease;
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 10;
        `
        // Make inner SVG / text bigger if present
        const closeIcon = closeBtn.querySelector('svg') as HTMLElement | null
        if (closeIcon) {
          closeIcon.style.width = '20px'
          closeIcon.style.height = '20px'
        }
        closeBtn.setAttribute('aria-label', 'Close tour')
        closeBtn.setAttribute('title', 'Close tour')
        closeBtn.onmouseenter = () => {
          closeBtn.style.background = 'hsl(var(--accent))'
          closeBtn.style.color = 'hsl(var(--foreground))'
        }
        closeBtn.onmouseleave = () => {
          closeBtn.style.background = 'transparent'
          closeBtn.style.color = 'hsl(var(--muted-foreground))'
        }
      }
    },
  })

  driverInstance.value.drive()
}

onMounted(() => {
  // Ensure DOM is ready
  nextTick(() => {
    startTour()
  })
})

onUnmounted(() => {
  isDestroyed.value = true
  if (driverInstance.value) {
    driverInstance.value.destroy()
  }
})

// Expose for parent control
defineExpose({
  destroy: () => {
    if (driverInstance.value) {
      driverInstance.value.destroy()
    }
  },
})
</script>

<style>
/* ========== Driver.js Overrides ========== */

/* Overlay styling */
.driver-overlay {
  --driver-overlay-color: hsl(var(--background));
  opacity: 0.6 !important;
}

/* Highlighted stage */
.driver-active-element {
  --driver-stage-border-color: #dc2626;
  --driver-stage-border-width: 2px;
  --driver-stage-border-radius: 8px;
}

/* Bigger X close button — top-right */
.driver-popover.euclid-onboarding-popover .driver-popover-close-btn {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  min-height: 36px !important;
  font-size: 22px !important;
  line-height: 1 !important;
  padding: 0 !important;
  position: absolute !important;
  top: 8px !important;
  right: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 6px !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.driver-popover.euclid-onboarding-popover .driver-popover-close-btn svg {
  width: 20px !important;
  height: 20px !important;
}

/* Popover base */
.driver-popover.euclid-onboarding-popover {
  --driver-popover-bg-color: hsl(var(--popover));
  --driver-popover-border-color: hsl(var(--border));
  --driver-popover-border-width: 1px;
  --driver-popover-border-radius: calc(var(--radius) + 2px);
  --driver-popover-padding: 20px;
  --driver-popover-box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px hsl(var(--border));
  --driver-popover-arrow-color: hsl(var(--popover));
  --driver-popover-arrow-border-color: hsl(var(--border));

  max-width: 340px;
  font-family: inherit;
  background: hsl(var(--popover));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) + 2px);
  padding: 20px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px hsl(var(--border));
}

/* Popover arrow */
.driver-popover.euclid-onboarding-popover .driver-popover-arrow {
  border-color: hsl(var(--border));
}

.driver-popover.euclid-onboarding-popover .driver-popover-arrow::after {
  content: '';
  position: absolute;
  background: hsl(var(--popover));
}

/* Arrow for each side */
.driver-popover.euclid-onboarding-popover[data-popper-placement^='top'] .driver-popover-arrow::after {
  top: 1px;
  left: 0;
  right: 0;
  height: 100%;
}

.driver-popover.euclid-onboarding-popover[data-popper-placement^='bottom'] .driver-popover-arrow::after {
  bottom: 1px;
  left: 0;
  right: 0;
  height: 100%;
}

.driver-popover.euclid-onboarding-popover[data-popper-placement^='left'] .driver-popover-arrow::after {
  left: 1px;
  top: 0;
  bottom: 0;
  width: 100%;
}

.driver-popover.euclid-onboarding-popover[data-popper-placement^='right'] .driver-popover-arrow::after {
  right: 1px;
  top: 0;
  bottom: 0;
  width: 100%;
}

/* Footer buttons container */
.driver-popover.euclid-onboarding-popover .driver-popover-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid hsl(var(--border));
}

/* Progress text */
.driver-popover.euclid-onboarding-popover .driver-popover-progress-text {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}

/* Navigation buttons */
.driver-popover-prev-btn,
.driver-popover-next-btn,
.driver-done-btn {
  transition: all 0.15s ease;
}

/* Ensure close button is visible */
.driver-popover-close-btn {
  transition: all 0.15s ease !important;
}

/* Dark mode support for overlay */
.dark .driver-overlay {
  --driver-overlay-color: #000;
  opacity: 0.7 !important;
}

/* Non-interactive areas when tour is active */
.driver-disabled-interaction {
  pointer-events: none;
}
</style>
