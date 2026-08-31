<template>
  <div class="w-full overflow-y-auto rounded-lg select-none
              [&::-webkit-scrollbar]:w-1.5 
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:hover:bg-gray-400/70 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/70">
    <div class="w-full pb-[45%] relative overflow-hidden rounded-t-lg">
      <Saturation :value="color" :hue="hue" @colorChange="value => changeColor(value)" />
    </div>
    <div class="flex p-2.5 gap-2.5">
      <div class="w-6 h-6 relative flex-shrink-0 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="absolute inset-0 z-10 rounded" :style="{ background: currentColor }"></div>
        <Checkboard />
      </div>
      <div class="flex-1 space-y-1.5">
        <div class="h-3 relative">
          <Hue :value="color" :hue="hue" @colorChange="value => changeColor(value)" />
        </div>
        <div class="h-3 relative overflow-hidden rounded">
          <Alpha :value="color" @colorChange="value => changeColor(value)" />
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 px-2.5 pb-2">
      <EditableInput class="flex-1" :value="color" @colorChange="value => changeColor(value)" />
    </div>

    <div class="flex items-center justify-between px-2.5 pb-2.5">
      <div class="flex items-center gap-1.5">
        <div class="flex items-center gap-1">
          <Label class="text-[10px] font-medium text-muted-foreground px-1">R</Label>
          <Input
            type="number"
            :model-value="color.r"
            @update:model-value="(v) => v !== undefined && (color = { ...color, r: Math.min(255, Math.max(0, Number(v))) })"
            min="0" max="255"
            class="w-8 h-5 text-[10px] font-mono px-0.5 text-center border-input [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance:textfield]"
          />
        </div>
        <div class="flex items-center gap-1">
          <Label class="text-[10px] font-medium text-muted-foreground px-1">G</Label>
          <Input
            type="number"
            :model-value="color.g"
            @update:model-value="(v) => v !== undefined && (color = { ...color, g: Math.min(255, Math.max(0, Number(v))) })"
            min="0" max="255"
            class="w-8 h-5 text-[10px] font-mono px-0.5 text-center border-input [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance:textfield]"
          />
        </div>
        <div class="flex items-center gap-1">
          <Label class="text-[10px] font-medium text-muted-foreground px-1">B</Label>
          <Input
            type="number"
            :model-value="color.b"
            @update:model-value="(v) => v !== undefined && (color = { ...color, b: Math.min(255, Math.max(0, Number(v))) })"
            min="0" max="255"
            class="w-8 h-5 text-[10px] font-mono px-0.5 text-center border-input [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance:textfield]"
          />
        </div>
      </div>
      <button 
        @click="openEyeDropper()"
        class="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
      >
        <Pipette class="w-4 h-4" />
      </button>
    </div>

    <div v-if="recentColors.length" class="px-2.5 pb-1 text-[11px] text-gray-600 dark:text-gray-400 font-medium">
      Recent:
    </div>
    <div v-if="recentColors.length" class="flex items-center gap-1.5 px-2.5 pb-2.5">
      <div
        v-for="c in recentColors.slice(0, 8)"
        :key="c"
        class="w-5 h-5 rounded cursor-pointer hover:scale-110 transition-transform relative bg-[length:8px_8px] bg-[image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADBJREFUOE9jfPbs2X8GPEBSUhKfNAPjqAHDIgz+//+PNx08f/4cfzoYNYCBceiHAQC5flV5JzgrxQAAAABJRU5ErkJggg==)]"
        @click="selectPresetColor(c)"
      >
        <div class="absolute inset-0 rounded" :style="{ background: c }"></div>
      </div>
    </div>

    <div v-if="canvasColors.length" class="px-2.5 pb-1 text-[11px] text-gray-600 dark:text-gray-400 font-medium">
      Used on Canvas:
    </div>
    <div v-if="canvasColors.length" class="flex items-center gap-1.5 px-2.5 pb-2.5">
      <div
        v-for="c in canvasColors"
        :key="c"
        class="w-5 h-5 rounded cursor-pointer hover:scale-110 transition-transform relative bg-[length:8px_8px] bg-[image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADBJREFUOE9jfPbs2X8GPEBSUhKfNAPjqAHDIgz+//+PNx08f/4cfzoYNYCBceiHAQC5flV5JzgrxQAAAABJRU5ErkJggg==)]"
        @click="selectPresetColor(c)"
      >
        <div class="absolute inset-0 rounded" :style="{ background: c }"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import tinycolor, { ColorFormats } from 'tinycolor2'
import { debounce } from 'lodash-es'
import { toCanvas } from 'html-to-image'
import useCanvas from '@/views/Canvas/useCanvas'
import { WorkSpaceThumbType } from '@/configs/canvas'
import { FabricObject } from 'fabric'

import Alpha from './Alpha.vue'
import Checkboard from './Checkboard.vue'
import Hue from './Hue.vue'
import Saturation from './Saturation.vue'
import EditableInput from './EditableInput.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pipette } from 'lucide-vue-next'

import { toast } from '@/components/ui/toast/use-toast'

const props = defineProps({
  modelValue: {
    type: String,
    default: '#e86b99',
  },
})

const emit = defineEmits<{
  (event: 'update:modelValue', payload: string): void
}>()

const RECENT_COLORS = 'RECENT_COLORS'

const presetColorConfig = [
  ['#7f7f7f', '#f2f2f2'],
  ['#0d0d0d', '#808080'],
  ['#1c1a10', '#ddd8c3'],
  ['#0e243d', '#c6d9f0'],
  ['#233f5e', '#dae5f0'],
  ['#632623', '#f2dbdb'],
  ['#4d602c', '#eaf1de'],
  ['#3f3150', '#e6e0ec'],
  ['#1e5867', '#d9eef3'],
  ['#99490f', '#fee9da'],
]

const gradient = (startColor: string, endColor: string, step: number) => {
  const _startColor = tinycolor(startColor).toRgb()
  const _endColor = tinycolor(endColor).toRgb()

  const rStep = (_endColor.r - _startColor.r) / step
  const gStep = (_endColor.g - _startColor.g) / step
  const bStep = (_endColor.b - _startColor.b) / step
  const gradientColorArr = []

  for (let i = 0; i < step; i++) {
    const gradientColor = tinycolor({
      r: _startColor.r + rStep * i,
      g: _startColor.g + gStep * i,
      b: _startColor.b + bStep * i,
    }).toRgbString()
    gradientColorArr.push(gradientColor)
  }
  return gradientColorArr
}

const getPresetColors = () => {
  const presetColors = []
  for (const color of presetColorConfig) {
    presetColors.push(gradient(color[1], color[0], 5))
  }
  return presetColors
}

const themeColors = ['#000000', '#ffffff', '#eeece1', '#1e497b', '#4e81bb', '#e2534d', '#9aba60', '#8165a0', '#47acc5', '#f9974c']
const standardColors = ['#c21401', '#ff1e02', '#ffc12a', '#ffff3a', '#90cf5b', '#00af57', '#00afee', '#0071be', '#00215f', '#72349d']

const hue = ref(-1)
const recentColors = ref<string[]>([])

const color = computed({
  get() {
    return tinycolor(props.modelValue).toRgb()
  },
  set(rgba: ColorFormats.RGBA) {
    const rgbaString = `rgba(${[rgba.r, rgba.g, rgba.b, rgba.a].join(',')})`
    emit('update:modelValue', rgbaString)
  },
})

const presetColors = getPresetColors()

const currentColor = computed(() => {
  return `rgba(${[color.value.r, color.value.g, color.value.b, color.value.a].join(',')})`
})

const selectPresetColor = (colorString: string) => {
  hue.value = tinycolor(colorString).toHsl().h
  emit('update:modelValue', colorString)
}

// When selecting a non-preset color, add it to the recent colors list
const updateRecentColorsCache = debounce(function() {
  const _color = tinycolor(color.value).toRgbString()
  if (!recentColors.value.includes(_color)) {
    recentColors.value = [_color, ...recentColors.value]

    const maxLength = 10
    if (recentColors.value.length > maxLength) {
      recentColors.value = recentColors.value.slice(0, maxLength)
    }
  }
}, 300, { trailing: true })

// Collect unique fill/stroke colors from all objects on the canvas
const [canvasInstance] = useCanvas()
const canvasVersion = ref(0)
let canvasCleanup: (() => void) | null = null

onMounted(() => {
  const recentColorsCache = localStorage.getItem(RECENT_COLORS)
  if (recentColorsCache) recentColors.value = JSON.parse(recentColorsCache)

  // Listen to canvas events to update canvas colors
  if (canvasInstance) {
    const updateCanvasColors = () => { canvasVersion.value++ }
    canvasInstance.on('object:added', updateCanvasColors)
    canvasInstance.on('object:removed', updateCanvasColors)
    canvasInstance.on('object:modified', updateCanvasColors)
    canvasCleanup = () => {
      canvasInstance.off('object:added', updateCanvasColors)
      canvasInstance.off('object:removed', updateCanvasColors)
      canvasInstance.off('object:modified', updateCanvasColors)
    }
  }
})

onUnmounted(() => {
  canvasCleanup?.()
})

watch(recentColors, () => {
  const recentColorsCache = JSON.stringify(recentColors.value)
  localStorage.setItem(RECENT_COLORS, recentColorsCache)
})

const canvasColors = computed(() => {
  // Depend on canvasVersion to recompute when objects change
  canvasVersion.value

  if (!canvasInstance) return []

  const objects = canvasInstance.getObjects() as FabricObject[]
  const colorSet = new Set<string>()

  const collectColor = (colorValue: unknown) => {
    if (!colorValue || typeof colorValue !== 'string') return
    // Skip gradients, patterns, or transparent
    if (colorValue.startsWith('url') || colorValue === 'transparent' || colorValue === '') return
    try {
      const tc = tinycolor(colorValue)
      if (tc.isValid() && tc.getAlpha() > 0) {
        const rgb = tc.toRgbString()
        colorSet.add(rgb)
      }
    } catch {
      // skip invalid
    }
  }

  const traverseObjects = (objs: FabricObject[]) => {
    for (const obj of objs) {
      // Skip workspace thumb / draw area objects
      if (WorkSpaceThumbType.includes(obj.id)) continue

      // Collect fill color
      collectColor(obj.fill)

      // Collect stroke color
      collectColor(obj.stroke)

      // Traverse group children
      if ((obj as any)._objects && (obj as any)._objects.length) {
        traverseObjects((obj as any)._objects)
      }
    }
  }

  traverseObjects(objects)

  // Convert to array, limit to 16
  return Array.from(colorSet).slice(0, 16)
})

const changeColor = (value: ColorFormats.RGBA | ColorFormats.HSLA | ColorFormats.HSVA) => {
  if ('h' in value) {
    hue.value = value.h
    color.value = tinycolor(value).toRgb()
  }
  else {
    hue.value = tinycolor(value).toHsl().h
    color.value = value
  }

  updateRecentColorsCache()
}

// Open eyedropper
// Check if the environment supports native eyedropper, use native if available, otherwise use custom one
const openEyeDropper = () => {
  const isSupportedEyeDropper = 'EyeDropper' in window

  if (isSupportedEyeDropper) browserEyeDropper()
  else customEyeDropper()
}

// Native eyedropper
const browserEyeDropper = () => {
  toast({
    title: 'Eyedropper Active',
    description: 'Press ESC to close the eyedropper',
  })

  // eslint-disable-next-line
  const eyeDropper = new (window as any).EyeDropper()
  eyeDropper.open().then((result: { sRGBHex: string }) => {
    const tColor = tinycolor(result.sRGBHex)
    hue.value = tColor.toHsl().h
    color.value = tColor.toRgb()

    updateRecentColorsCache()
  }).catch(() => {
    toast({
      title: 'Eyedropper Closed',
      description: 'Eyedropper has been closed',
    })
  })
}

// Canvas-based custom eyedropper
const customEyeDropper = () => {
  const targetRef: HTMLElement | null = document.querySelector('.canvas')
  if (!targetRef) return

  const maskRef = document.createElement('div')
  maskRef.style.cssText = 'position: fixed; top: 0; left: 0; bottom: 0; right: 0; z-index: 9999; cursor: wait;'
  document.body.appendChild(maskRef)

  const colorBlockRef = document.createElement('div')
  colorBlockRef.style.cssText = 'position: absolute; top: -100px; left: -100px; width: 16px; height: 16px; border: 1px solid #000; z-index: 999'
  maskRef.appendChild(colorBlockRef)

  const { left, top, width, height } = targetRef.getBoundingClientRect()

  const filter = (node: HTMLElement) => {
    if (node.tagName && node.tagName.toUpperCase() === 'FOREIGNOBJECT') return false
    if (node.classList && node.classList.contains('operate')) return false
    return true
  }

  toCanvas(targetRef, { filter, fontEmbedCSS: '', width, height, canvasWidth: width, canvasHeight: height, pixelRatio: 1 }).then(canvasRef => {
    canvasRef.style.cssText = `position: absolute; top: ${top}px; left: ${left}px; cursor: crosshair;`
    maskRef.style.cursor = 'default'
    maskRef.appendChild(canvasRef)

    const ctx = canvasRef.getContext('2d')
    if (!ctx) return

    let currentColor = ''
    const handleMousemove = (e: MouseEvent) => {
      const x = e.x
      const y = e.y

      const mouseX = x - left
      const mouseY = y - top

      const [r, g, b, a] = ctx.getImageData(mouseX, mouseY, 1, 1).data
      currentColor = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`

      colorBlockRef.style.left = x + 10 + 'px'
      colorBlockRef.style.top = y + 10 + 'px'
      colorBlockRef.style.backgroundColor = currentColor
    }
    const handleMouseleave = () => {
      currentColor = ''
      colorBlockRef.style.left = '-100px'
      colorBlockRef.style.top = '-100px'
      colorBlockRef.style.backgroundColor = ''
    }
    const handleMousedown = (e: MouseEvent) => {
      if (currentColor && e.button === 0) {
        const tColor = tinycolor(currentColor)
        hue.value = tColor.toHsl().h
        color.value = tColor.toRgb()

        updateRecentColorsCache()
      }
      document.body.removeChild(maskRef)
      
      canvasRef.removeEventListener('mousemove', handleMousemove)
      canvasRef.removeEventListener('mouseleave', handleMouseleave)
      window.removeEventListener('mousedown', handleMousedown)
    }

    canvasRef.addEventListener('mousemove', handleMousemove)
    canvasRef.addEventListener('mouseleave', handleMouseleave)
    window.addEventListener('mousedown', handleMousedown)
  }).catch(() => {
    toast({
      title: 'Error',
      description: 'Failed to initialize eyedropper',
      variant: 'destructive'
    })
    document.body.removeChild(maskRef)
  })
}
</script>

<style lang="scss" scoped>
</style>