<template>
  <div class="space-y-3">
    <ElementPosition />

    <!-- Animation -->
    <div class="space-y-2.5 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Animation
        </h3>
        <Badge
          variant="outline"
          class="text-[10px] px-1.5 py-0 font-mono text-muted-foreground"
        >
          {{ isPlaying ? 'Playing' : 'Paused' }}
        </Badge>
      </div>

      <!-- Live preview -->
      <div class="h-28 rounded-md overflow-hidden border border-border/50 bg-background/60 flex items-center justify-center">
        <img
          v-if="previewSrc"
          :src="previewSrc"
          alt="GIF preview"
          class="max-h-full max-w-full object-contain"
        />
        <ImageIcon v-else class="w-8 h-8 text-muted-foreground/40" />
      </div>

      <!-- Playback controls -->
      <div class="grid grid-cols-2 gap-1.5">
        <Button v-if="isPlaying" variant="outline" size="sm" class="h-8 text-xs" @click="togglePlayback">
          <Pause class="w-3.5 h-3.5 mr-1.5" />
          Pause
        </Button>
        <Button v-else variant="outline" size="sm" class="h-8 text-xs" @click="togglePlayback">
          <Play class="w-3.5 h-3.5 mr-1.5" />
          Play
        </Button>
        <Button variant="outline" size="sm" class="h-8 text-xs" @click="restartAnimation">
          <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
          Restart
        </Button>
      </div>

      <!-- Autoplay -->
      <div class="flex items-center justify-between pt-1">
        <Label
          class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground cursor-pointer select-none"
          @click="autoplay = !autoplay; setAutoplay(autoplay)"
        >
          Autoplay when added
        </Label>
        <Switch :checked="autoplay" @update:checked="setAutoplay" />
      </div>

      <!-- Playback Speed -->
      <div class="space-y-1 pt-2 border-t border-border/50">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <Gauge class="h-2.5 w-2.5" /> Speed
          </Label>
          <span class="text-[10px] font-mono text-muted-foreground">{{ playbackSpeed }}×</span>
        </div>
        <SliderWithTicks
          :model-value="[playbackSpeed]"
          @update:model-value="(val) => playbackSpeed = val[0]"
          @value-commit="commitPlaybackSpeed"
          :min="0.25"
          :max="4"
          :step="0.25"
          :tick-step="0.75"
        />
      </div>
    </div>

    <!-- Rounded Corners -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Rounded Corners
        </h3>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">{{ cornerRadius }}px</Badge>
      </div>
      <div class="flex items-center gap-2">
        <SliderWithTicks
          :model-value="[cornerRadius]"
          @update:model-value="(val) => cornerRadius = val[0]"
          @value-commit="commitCornerRadius"
          :min="0"
          :max="maxCornerRadius"
          :step="1"
          :disabled="maxCornerRadius <= 0"
          class="flex-1"
        />
        <span class="text-xs font-mono text-muted-foreground min-w-[3rem] text-right">{{ cornerRadius }}px</span>
      </div>
    </div>

    <ElementOpacity />
    <ElementBlend />
    <ElementOutline />
    <ElementShadow :hasShadow="hasShadow" />

    <!-- Replace GIF -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Replace GIF
        </h3>
      </div>
      <FileInput class="flex-1" @change="(files: FileList) => replaceGif(files)">
        <Button variant="outline" class="w-full h-8 text-xs">
          <Upload class="w-3.5 h-3.5 mr-1.5" /> Choose GIF
        </Button>
      </FileInput>
    </div>

    <!-- Reset -->
    <Button variant="outline" class="w-full h-8 text-xs" @click="resetGif">
      <Undo2 class="w-3.5 h-3.5 mr-1.5" /> Reset
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useTemplatesStore } from '@/store'
import { Image as FabricImage } from 'fabric'
import { Play, Pause, RotateCcw, Upload, Undo2, ImageIcon, Gauge } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import FileInput from '@/components/FileInput.vue'
import { getImageDataURL } from '@/utils/image'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue'
import useCanvas from '@/views/Canvas/useCanvas'
import ElementPosition from '../Components/ElementPosition.vue'
import ElementOpacity from '../Components/ElementOpacity.vue'
import ElementBlend from '../Components/ElementBlend.vue'
import ElementOutline from '../Components/ElementOutline.vue'
import ElementShadow from '../Components/ElementShadow.vue'

type ExtendedGif = FabricImage & {
  isPlaying?: boolean
  gifAutoplay?: boolean
  playbackSpeed?: number
  pause?: () => void
  resume?: () => void
  restart?: () => void
  togglePlay?: () => void
  setPlaybackSpeed?: (speed: number) => void
  replaceGif?: (src: string) => Promise<void>
  getSrc?: () => string
}

const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const [canvas] = useCanvas()
const { canvasObject } = storeToRefs(mainStore)

const handleElement = computed(() => canvasObject.value as ExtendedGif | undefined)

const isPlaying = ref(true)
const autoplay = ref(true)
const previewSrc = ref<string | undefined>()
const cornerRadius = ref(0)
const playbackSpeed = ref(1)

const hasShadow = computed(() => !!(handleElement.value as any)?.shadow)

const syncState = () => {
  const el = handleElement.value
  isPlaying.value = el?.isPlaying ?? true
  autoplay.value = el?.gifAutoplay ?? true
  previewSrc.value = typeof el?.getSrc === 'function' ? el.getSrc() : (el as any)?.src
}

const syncCorners = () => {
  cornerRadius.value = Math.round((handleElement.value as any)?.rx ?? 0)
}

const syncPlaybackSpeed = () => {
  playbackSpeed.value = (handleElement.value as any)?.playbackSpeed ?? 1
}

const maxCornerRadius = computed(() => {
  const el = handleElement.value
  if (!el) return 0
  const width = (el as any).width ?? 0
  const height = (el as any).height ?? 0
  if (!width || !height) return 0
  return Math.round(Math.min(width, height) / 2)
})

watch(handleElement, () => {
  syncState()
  syncCorners()
  syncPlaybackSpeed()
}, { immediate: true })

const commitCornerRadius = () => {
  const el = handleElement.value
  if (!el || !canvas) return
  const r = Math.max(0, Math.min(Math.round(cornerRadius.value), maxCornerRadius.value))
  cornerRadius.value = r
  templatesStore.modifedElement(el, { rx: r, ry: r, dirty: true })
}

const commitPlaybackSpeed = () => {
  const el = handleElement.value as ExtendedGif | undefined
  if (!el) return
  const s = Math.max(0.25, Math.min(4, playbackSpeed.value))
  playbackSpeed.value = s
  el.setPlaybackSpeed?.(s)
  templatesStore.modifedElement(el, { playbackSpeed: s })
}

const togglePlayback = () => {
  const el = handleElement.value
  if (!el) return
  if (isPlaying.value) {
    el.pause?.()
    isPlaying.value = false
  } else {
    el.resume?.()
    isPlaying.value = true
  }
}

const restartAnimation = () => {
  const el = handleElement.value
  if (!el) return
  el.restart?.()
  isPlaying.value = true
}

const setAutoplay = (value: boolean) => {
  const el = handleElement.value
  if (!el || !canvas) return
  autoplay.value = value
  templatesStore.modifedElement(el, { gifAutoplay: value })
  if (!value && isPlaying.value) {
    el.pause?.()
    isPlaying.value = false
  }
}

const replaceGif = (files: FileList) => {
  const file = files[0]
  const el = handleElement.value
  if (!file || !el) return
  getImageDataURL(file).then(async (dataURL) => {
    await el.replaceGif?.(dataURL)
    templatesStore.updateElement({ id: (el as any).id, props: { src: dataURL } })
    syncState()
  })
}

const resetGif = () => {
  const el = handleElement.value
  if (!el || !canvas) return
  const props = {
    flipX: false,
    flipY: false,
    angle: 0,
    opacity: 1,
    rx: 0,
    ry: 0,
    playbackSpeed: 1,
    dirty: true,
  }
  el.set(props)
  el.setCoords()
  canvas.renderAll()
  templatesStore.modifedElement(el, props)
  ;(el as ExtendedGif).setPlaybackSpeed?.(1)
  cornerRadius.value = 0
  playbackSpeed.value = 1
}
</script>

<style lang="scss" scoped>
</style>
