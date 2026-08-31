<template>
  <Teleport to="body">
    <div 
      v-if="isActive" 
      class="fixed inset-0 z-[9999] bg-black"
      @keydown="handleKeydown"
      @mousemove="handleMouseMove"
      tabindex="0"
      ref="presentationContainer"
    >
      <!-- Slide Content -->
      <div class="relative w-full h-full flex items-center justify-center p-8">
        <!-- Current Slide -->
        <div class="relative max-w-full max-h-full flex items-center justify-center">
          <canvas 
            ref="slideCanvas" 
            class="max-w-full max-h-full shadow-2xl"
            :style="{
              backgroundColor: currentSlideBackground,
            }"
          />
        </div>

        <!-- Slide Counter -->
        <transition name="fade-controls">
          <div v-show="controlsVisible" class="absolute bottom-8 right-8 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
            {{ currentSlideIndex + 1 }} / {{ totalSlides }}
          </div>
        </transition>

        <!-- Navigation Controls -->
        <transition name="fade-controls">
          <div v-show="controlsVisible" class="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0 text-white hover:bg-white/20"
                  @click="previousSlide"
                  :disabled="currentSlideIndex === 0"
                >
                  <ChevronLeft class="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Previous (← or PageUp)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-3 text-white hover:bg-white/20 text-xs"
            @click="exitPresentation"
          >
            Exit (ESC)
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0 text-white hover:bg-white/20"
                  @click="nextSlide"
                  :disabled="currentSlideIndex === totalSlides - 1"
                >
                  <ChevronRight class="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Next (→ or PageDown)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        </transition>

        <!-- Exit Button -->
        <transition name="fade-controls">
          <Button
            v-show="controlsVisible"
            variant="ghost"
            size="sm"
            class="absolute top-8 right-8 h-10 w-10 p-0 text-white hover:bg-white/20 rounded-full"
            @click="exitPresentation"
          >
            <X class="w-5 h-5" />
          </Button>
        </transition>
      </div>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/80">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p class="text-white text-sm">Loading presentation...</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTemplatesStore } from '@/store'
import { WorkSpaceCommonType } from '@/configs/canvas'
import { StaticCanvas } from 'fabric'
import type { Template } from '@/types/canvas'

const props = defineProps<{
  modelValue: boolean
  startIndex?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'slideChange': [index: number]
}>()

const templatesStore = useTemplatesStore()
const { templates } = storeToRefs(templatesStore)

const isActive = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const presentationContainer = ref<HTMLDivElement>()
const slideCanvas = ref<HTMLCanvasElement>()
const currentSlideIndex = ref(props.startIndex || 0)
const isLoading = ref(false)
const staticCanvas = ref<StaticCanvas | null>(null)
const controlsVisible = ref(true)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

const HIDE_DELAY = 2000 // ms before controls fade out

const handleMouseMove = () => {
  controlsVisible.value = true
  if (hideTimeout) clearTimeout(hideTimeout)
  hideTimeout = setTimeout(() => {
    controlsVisible.value = false
  }, HIDE_DELAY)
}

const totalSlides = computed(() => templates.value.length)
const currentTemplate = computed(() => templates.value[currentSlideIndex.value])
const resolveSlideBackground = (template?: Template) => {
  const workspaceFill = template?.workSpace?.fill
  if (typeof workspaceFill === 'string') return workspaceFill

  return typeof template?.background === 'string' ? template.background : '#ffffff'
}

const currentSlideBackground = computed(() => {
  return resolveSlideBackground(currentTemplate.value)
})

// Initialize presentation
const initPresentation = async () => {
  await nextTick()
  
  if (!slideCanvas.value) return
  
  // Create static canvas for rendering
  staticCanvas.value = new StaticCanvas(slideCanvas.value, {
    backgroundColor: '#ffffff',
    renderOnAddRemove: false,
    skipOffscreen: true,
  })
  
  // Focus the container for keyboard events
  presentationContainer.value?.focus()
  
  // Render first slide
  await renderSlide(currentSlideIndex.value)
}

// Render a specific slide
const renderSlide = async (index: number) => {
  if (!staticCanvas.value || !templates.value[index]) return
  
  isLoading.value = true
  
  try {
    const template = templates.value[index]
    
    // Set canvas size based on template
    const zoom = template.zoom || 1
    const width = template.width / zoom
    const height = template.height / zoom
    
    // Calculate scale to fit screen while maintaining aspect ratio
    const containerWidth = window.innerWidth - 64 // padding
    const containerHeight = window.innerHeight - 64
    const scale = Math.min(
      containerWidth / width,
      containerHeight / height,
      1 // Don't scale up
    )
    
    staticCanvas.value.setDimensions({
      width: width * scale,
      height: height * scale
    })
    
    staticCanvas.value.setZoom(scale)
    
    // Clear existing objects
    staticCanvas.value.clear()
    
    // Keep presentation mode in sync with the editor workspace background.
    staticCanvas.value.backgroundColor = resolveSlideBackground(template) as any
    
    // Load and render user objects (filter out workspace UI elements)
    const userObjects = template.objects.filter(
      (obj: any) => !WorkSpaceCommonType.includes(obj.id)
    )
    if (userObjects.length > 0) {
      await staticCanvas.value.loadFromJSON({
        version: '6.0.0',
        objects: userObjects
      })
    }
    
    staticCanvas.value.renderAll()
  } catch (error) {
    console.error('Error rendering slide:', error)
  } finally {
    isLoading.value = false
  }
}

// Navigation functions
const nextSlide = async () => {
  if (currentSlideIndex.value < totalSlides.value - 1) {
    currentSlideIndex.value++
    emit('slideChange', currentSlideIndex.value)
    await renderSlide(currentSlideIndex.value)
  }
}

const previousSlide = async () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--
    emit('slideChange', currentSlideIndex.value)
    await renderSlide(currentSlideIndex.value)
  }
}

const goToSlide = async (index: number) => {
  if (index >= 0 && index < totalSlides.value) {
    currentSlideIndex.value = index
    emit('slideChange', currentSlideIndex.value)
    await renderSlide(currentSlideIndex.value)
  }
}

const exitPresentation = () => {
  isActive.value = false
  if (staticCanvas.value) {
    staticCanvas.value.dispose()
    staticCanvas.value = null
  }
  
  // Exit fullscreen if active
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowRight':
    case 'PageDown':
    case ' ': // Space
      event.preventDefault()
      nextSlide()
      break
    case 'ArrowLeft':
    case 'PageUp':
      event.preventDefault()
      previousSlide()
      break
    case 'Home':
      event.preventDefault()
      goToSlide(0)
      break
    case 'End':
      event.preventDefault()
      goToSlide(totalSlides.value - 1)
      break
    case 'Escape':
      event.preventDefault()
      exitPresentation()
      break
    default:
      // Number keys for direct slide access
      const num = parseInt(event.key)
      if (!isNaN(num) && num > 0 && num <= totalSlides.value) {
        event.preventDefault()
        goToSlide(num - 1)
      }
  }
}

// Watch for presentation activation
watch(isActive, async (active) => {
  if (active) {
    // Request fullscreen
    if (presentationContainer.value && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch (error) {
        console.warn('Fullscreen request failed:', error)
      }
    }
    await initPresentation()
  } else {
    // Cleanup
    if (staticCanvas.value) {
      staticCanvas.value.dispose()
      staticCanvas.value = null
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (staticCanvas.value) {
    staticCanvas.value.dispose()
    staticCanvas.value = null
  }
  if (hideTimeout) clearTimeout(hideTimeout)
})

// Handle fullscreen change
const handleFullscreenChange = () => {
  if (!document.fullscreenElement && isActive.value) {
    exitPresentation()
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.fade-controls-enter-active,
.fade-controls-leave-active {
  transition: opacity 0.35s ease;
}
.fade-controls-enter-from,
.fade-controls-leave-to {
  opacity: 0;
}
</style>
