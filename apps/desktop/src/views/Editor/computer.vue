<template>
  <div class="h-full flex flex-col" v-drop-image="{ url: 'UploadUrl', highlightStyle: { outline: '2px dashed #2563eb', outlineOffset: '-4px', backgroundColor: 'transparent' } }">
    <!-- Electron Titlebar -->
    <ElectronTitlebar v-if="isElectronMode" title="Euclid - Canvas Editor" context="editor" />
    
    <!-- Loading Spinner -->
    <CanvasLoadingSpinner :show="isLoading" message="Loading canvas editor..." />
    
    <!-- Save overlay -->
    <CanvasLoadingSpinner :show="mainStore.savingProject" message="Saving project..." />
    
    <div class="layout-content flex" :class="{ 'has-titlebar': isElectronMode }">
      <CanvasLeft />
      <div class="layout-content-center bg-gray-100 dark:bg-[hsl(0,0%,8%)]">
        <CanvasHeader class="center-header relative flex py-[10px] text-[14px] select-none h-[39px]" />
        <CanvasCenter class="center-body" />
        <CanvasAffix  class="center-affix"/>
      </div>
      <CanvasRight class="layout-content-right h-full w-[260px] bg-white dark:bg-[hsl(0,0%,9%)] flex flex-col" />
      <CanvasDom class="absolute -z-[200] -left-[300px]" />
    </div>
    <BottomBar />

    <!-- Onboarding Tour -->
    <OnboardingTour
      v-if="showEditorTour"
      tour-key="editor"
      :steps="editorTourSteps"
      @complete="onTourComplete"
      @skip="onTourSkip"
    />
    
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import CanvasLeft from "./CanvasLeft/index.vue";
import CanvasHeader from "./CanvasHeader/index.vue";
import CanvasCenter from "./CanvasCenter/index.vue";
import CanvasRight from "./CanvasRight/index.vue";
import CanvasFooter from "./CanvasFooter/index.vue";
import CanvasAffix from "./CanvasAffix/index.vue";
import CanvasDom from "./CanvasDom/index.vue";
import BottomBar from "./BottomBar.vue";
import ElectronTitlebar from "@/components/ElectronTitlebar.vue";
import CanvasLoadingSpinner from "@/components/CanvasLoadingSpinner.vue";
import OnboardingTour from '@/components/OnboardingTour.vue'
import { useMainStore, useOnboardingStore } from '@/store'
import useCanvas from '@/views/Canvas/useCanvas'

const mainStore = useMainStore()
const onboardingStore = useOnboardingStore()
const router = useRouter()
const [canvas] = useCanvas()
const isLoading = ref(true)

// Onboarding tour state
const showEditorTour = ref(false)
const editorTourSteps = [
  {
    element: '[data-onboarding="left-sidebar"]',
    popover: {
      title: 'Tool Panel',
      description: 'This sidebar contains all the essential tools — select elements, add text, images, shapes, templates, and more. Click any icon to open its panel.',
      side: 'right',
      align: 'center',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
    },
  },
  {
    element: '[data-onboarding="canvas-header"]',
    popover: {
      title: 'Editing Toolbar',
      description: 'Here you\'ll find undo/redo, alignment tools, ruler toggles, zoom controls, import options, and presentation mode. Everything you need to edit your canvas.',
      side: 'bottom',
      align: 'center',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
    },
  },
  {
    element: '[data-onboarding="canvas-area"]',
    popover: {
      title: 'The Canvas',
      description: 'This is your design workspace. Click to select objects, drag to move them, resize handles to adjust, and double-click text to edit. Right-click for more options.',
      side: 'top',
      align: 'center',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
    },
  },
  {
    element: '[data-onboarding="right-panel"]',
    popover: {
      title: 'Properties Panel',
      description: 'When you select an object on the canvas, its properties appear here. Adjust size, position, colors, effects, and more. The panel adapts to whatever you select.',
      side: 'left',
      align: 'center',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
    },
  },
  {
    element: '[data-onboarding="bottom-bar"]',
    popover: {
      title: 'Status Bar',
      description: 'Keep an eye on your cursor position, selected object info, zoom level, and canvas dimensions. All your project stats at a glance.',
      side: 'top',
      align: 'center',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
    },
  },
  {
    element: '[data-onboarding="canvas-affix"]',
    popover: {
      title: 'Canvas Controls',
      description: 'Quick toggles for clip/crop lines, drag-to-pan mode, and safe area guides. These help you design with precision.',
      side: 'top',
      align: 'center',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
      closeBtnText: 'Skip',
    },
  },
  {
    popover: {
      title: 'You\'re All Set! 🎉',
      description: 'You now know the essentials! Start designing by adding elements from the left panel, editing them on the canvas, and adjusting properties on the right. Happy creating!',
      side: 'bottom',
      align: 'center',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Start Designing!',
    },
  },
]

function onTourComplete() {
  showEditorTour.value = false
}

function onTourSkip() {
  showEditorTour.value = false
}

// Check if running in Electron mode
const isElectronMode = computed(() => {
  return import.meta.env.MODE === 'electron' || window.electron !== undefined
})

// Simulate loading - hide after canvas is ready
onMounted(() => {
  // Set a minimum loading time and wait for canvas to be ready
  const minLoadTime = 800;
  const startTime = Date.now();
  
  const checkCanvasReady = () => {
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadTime - elapsed);
    
    setTimeout(() => {
      isLoading.value = false;
    }, remainingTime);
  };
  
  // Check if canvas is ready
  if (canvas) {
    checkCanvasReady();
  } else {
    // If canvas isn't ready yet, wait a bit longer
    setTimeout(checkCanvasReady, 200);
  }

  // Start editor onboarding tour if first-time user
  if (!onboardingStore.hasCompletedOnboarding) {
    nextTick(() => {
      // Wait for the canvas to fully initialize and the loading spinner to hide
      const startTourTimeout = setTimeout(() => {
        showEditorTour.value = true
      }, 1200)

      // Clean up timeout if component unmounts
      onUnmounted(() => clearTimeout(startTourTimeout))
    })
  }
})

// Watch for tour re-trigger via Help → Show Tour (when already on this page)
watch(
  () => onboardingStore.isOnboardingActive,
  (active) => {
    if (active && !showEditorTour.value && !onboardingStore.hasCompletedOnboarding) {
      // Wait for canvas to be ready before showing the tour
      const startTourTimeout = setTimeout(() => {
        showEditorTour.value = true
      }, 1200)
      onUnmounted(() => clearTimeout(startTourTimeout))
    }
  },
)

</script>

<style lang="scss" scoped>
.layout-content {
  height: calc(100% - 20px - 0.5px);
  
  &.has-titlebar {
    height: calc(100% - 20px - 32px - 0.5px);
  }
}

.layout-content-center {
  width: calc(100% - 50px - 260px);
  display: flex;
  flex-direction: column;

  .center-body {
    flex: 1;
    min-height: 0;
  }
  .center-footer {
    border-top: 1px solid $borderColor;
    background-color: $lightGray;
  }
}
</style>
