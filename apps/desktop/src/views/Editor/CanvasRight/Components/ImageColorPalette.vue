<template>
  <div class="space-y-3 rounded-lg border border-border/40 bg-card/60 p-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex -space-x-0.5">
          <div class="size-2 rounded-full bg-rose-400 ring-1 ring-background" />
          <div class="size-2 rounded-full bg-amber-400 ring-1 ring-background" />
          <div class="size-2 rounded-full bg-emerald-400 ring-1 ring-background" />
          <div class="size-2 rounded-full bg-sky-400 ring-1 ring-background" />
        </div>
        <h3 class="text-[11px] font-semibold text-foreground uppercase tracking-wider">
          Palette
        </h3>
      </div>
      <Button
        variant="ghost"
        size="sm"
        class="h-6 w-6 p-0"
        @click="refreshPalette"
        :disabled="isLoading"
        title="Refresh palette"
      >
        <RefreshCw class="size-3" :class="{ 'animate-spin': isLoading }" />
      </Button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-2.5">
      <div class="h-10 rounded-md bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 animate-pulse" />
      <div class="flex gap-2">
        <div v-for="i in 5" :key="i" class="flex-1 aspect-square rounded-lg bg-muted/50 animate-pulse" />
      </div>
    </div>

    <!-- Palette content -->
    <template v-else-if="colors.length > 0">
      <!-- Gradient strip: all colors blended into a seamless bar -->
      <div
        class="relative h-10 rounded-lg overflow-hidden border border-border/30 shadow-sm cursor-pointer group/gradient"
        @click="copyPaletteCSS"
        title="Click to copy gradient CSS"
      >
        <div
          class="absolute inset-0"
          :style="{ backgroundImage: `linear-gradient(to right, ${colors.join(', ')})` }"
        />
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/gradient:opacity-100 transition-opacity bg-black/20">
          <div class="flex items-center gap-1.5 text-white text-[10px] font-medium">
            <component :is="copiedPalette ? Check : Pipette" class="size-3" />
            {{ copiedPalette ? 'Gradient copied!' : 'Copy CSS gradient' }}
          </div>
        </div>
      </div>

      <!-- Color circles grid -->
      <TooltipProvider :delayDuration="200">
        <div class="grid grid-cols-5 gap-1.5">
          <Tooltip
            v-for="color in colors"
            :key="color"
          >
            <TooltipTrigger as-child>
              <button
                class="relative aspect-square rounded-full border border-white/10 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md hover:z-10 focus:outline-none"
                :style="{ backgroundColor: color }"
                @click="copyToClipboard(color)"
              >
                <div class="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
                <span class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <component
                    :is="copiedColor === color ? Check : Copy"
                    class="size-3.5 text-white drop-shadow-md pointer-events-none"
                  />
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent class="text-xs px-2 py-1">
              <span class="font-mono font-semibold">{{ color }}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </template>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-6 text-center">
      <div class="size-10 rounded-full bg-muted/40 flex items-center justify-center mb-2">
        <Palette class="size-5 text-muted-foreground" />
      </div>
      <p class="text-[11px] text-muted-foreground">Select an image to extract its palette</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw, Copy, Check, Palette, Pipette } from 'lucide-vue-next'
import { extractColorsFromImage } from '@/utils/colorExtraction'
import type { Image as FabricImage } from 'fabric'

const mainStore = useMainStore()
const { canvasObject } = storeToRefs(mainStore)

const colors = ref<string[]>([])
const isLoading = ref(false)
const copiedColor = ref<string | null>(null)
const copiedPalette = ref(false)

const handleElement = computed(() => canvasObject.value as FabricImage)

const extractColors = async () => {
  if (!handleElement.value) return
  isLoading.value = true
  try {
    const imageSrc = handleElement.value.originSrc
      ? handleElement.value.originSrc
      : handleElement.value.getSrc()
    const result = await extractColorsFromImage(imageSrc, 8)
    colors.value = result
  } catch (error) {
    console.error('Error extracting colors:', error)
    colors.value = []
  } finally {
    isLoading.value = false
  }
}

const refreshPalette = () => extractColors()

const copyToClipboard = async (color: string) => {
  try {
    await navigator.clipboard.writeText(color)
    copiedColor.value = color
    setTimeout(() => (copiedColor.value = null), 1800)
  } catch { /* clipboard unavailable */ }
}

const copyPaletteCSS = async () => {
  const gradient = `background: linear-gradient(to right, ${colors.value.join(', ')});`
  try {
    await navigator.clipboard.writeText(gradient)
    copiedPalette.value = true
    setTimeout(() => (copiedPalette.value = false), 1800)
  } catch { /* clipboard unavailable */ }
}

onMounted(() => extractColors())

watch(() => handleElement.value?.id, () => {
  colors.value = []
  extractColors()
})
</script>

