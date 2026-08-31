<template>
  <div class="space-y-2.5">
    <!-- Category Tabs -->
    <div class="flex gap-1 p-1 rounded-md border border-border/50 bg-muted/20">
      <button
        v-for="category in categories"
        :key="category"
        @click="activeCategory = category"
        :class="[
          'flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-all',
          activeCategory === category
            ? 'bg-primary text-primary-foreground border-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <component :is="categoryIcons[category]" class="h-3 w-3" />
        <span class="hidden sm:inline">{{ categoryLabels[category] }}</span>
      </button>
    </div>

    <!-- Canvas Size Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 rounded-md border border-border/50 bg-muted/20">
      <button
        v-for="size in sizesInCategory"
        :key="size.id"
        @click="$emit('size-select', size)"
        :class="[
          'group relative flex flex-col items-center gap-1.5 rounded border p-2 transition-all',
          isSelected(size)
            ? 'border-primary bg-primary/10'
            : 'border-border/50 hover:border-primary/50 hover:bg-background'
        ]"
      >
        <!-- Selection Indicator -->
        <div v-if="isSelected(size)" class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
          <Check class="h-2.5 w-2.5" />
        </div>

        <!-- Canvas Preview -->
        <div class="flex items-center justify-center h-12 w-12 overflow-hidden">
          <div
            :class="[
              'rounded border transition-colors',
              isSelected(size)
                ? 'border-primary/60 bg-primary/20'
                : 'border-border/60 bg-muted/40 group-hover:border-primary/40 group-hover:bg-muted/60'
            ]"
            :style="{
              width: `${getPreviewWidth(size)}px`,
              height: `${getPreviewHeight(size)}px`,
              minWidth: '8px',
              minHeight: '8px',
              maxWidth: '100%',
              maxHeight: '100%'
            }"
          />
        </div>

        <!-- Size Info -->
        <div class="text-center">
          <h3 class="text-[10px] font-semibold text-foreground truncate">
            {{ size.name }}
          </h3>
          <p class="text-[9px] text-muted-foreground">
            {{ size.description }}
          </p>
          <Badge
            v-if="size.aspectRatio"
            variant="secondary"
            class="mt-0.5 text-[8px] px-1 py-0"
          >
            {{ size.aspectRatio }}
          </Badge>
        </div>
      </button>

      <!-- Custom Size Option -->
      <button
        v-if="activeCategory === 'custom'"
        @click="showCustom = true"
        class="group flex flex-col items-center justify-center gap-1.5 rounded border border-dashed border-border/60 p-2 transition-all hover:border-primary/50 hover:bg-background"
      >
        <div class="flex items-center justify-center h-12 w-12 overflow-hidden">
          <div class="flex h-8 w-8 items-center justify-center rounded border border-dashed border-border/60 group-hover:border-primary/50">
            <Plus class="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        <div class="text-center">
          <h3 class="text-[10px] font-semibold text-foreground">
            Custom
          </h3>
          <p class="text-[9px] text-muted-foreground">
            Your size
          </p>
        </div>
      </button>
    </div>

    <!-- Custom Size Input -->
    <div v-if="showCustom" class="rounded-md border border-border/50 p-2 bg-muted/20 space-y-2">
      <h4 class="text-[10px] font-bold uppercase tracking-wide text-foreground">
        Custom Dimensions
      </h4>
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <label class="block text-[9px] font-medium text-muted-foreground mb-1">
            Width
          </label>
          <Input
            type="number"
            placeholder="800"
            v-model="customWidth"
            class="h-6 text-xs border-border/50"
            min="1"
            max="10000"
          />
        </div>
        <div class="flex items-center pt-3 text-muted-foreground text-xs">
          ×
        </div>
        <div class="flex-1">
          <label class="block text-[9px] font-medium text-muted-foreground mb-1">
            Height
          </label>
          <Input
            type="number"
            placeholder="600"
            v-model="customHeight"
            class="h-6 text-xs border-border/50"
            min="1"
            max="10000"
          />
        </div>
      </div>
      <div class="flex justify-end gap-1 pt-1">
        <Button
          variant="outline"
          size="sm"
          @click="showCustom = false"
          class="h-6 text-xs border-border/50"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          @click="handleCustomSizeCreate"
          :disabled="!customWidth || !customHeight"
          class="bg-red-600 hover:bg-red-700 text-white h-6 text-xs font-medium"
        >
          Create
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Monitor, Smartphone, FileImage, Plus, Check } from 'lucide-vue-next'

interface CanvasSize {
  id: string
  name: string
  description: string
  width: number
  height: number
  category: 'social' | 'web' | 'custom'
  aspectRatio?: string
}

interface Props {
  selectedSize: CanvasSize
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'size-select', size: CanvasSize): void
}>()

const activeCategory = ref<'social' | 'web' | 'custom'>('social')
const customWidth = ref('')
const customHeight = ref('')
const showCustom = ref(false)

const categoryIcons = {
  social: Smartphone,
  web: Monitor,
  custom: FileImage,
}

const categoryLabels = {
  social: 'Social Media',
  web: 'Web & Digital',
  custom: 'Custom',
}

const categories: ('social' | 'web' | 'custom')[] = ['social', 'web', 'custom']

const predefinedSizes: CanvasSize[] = [
  // Social Media
  { id: 'instagram-post', name: 'Instagram Post', description: '1080 × 1080 px', width: 1080, height: 1080, category: 'social', aspectRatio: '1:1' },
  { id: 'instagram-story', name: 'Instagram Story', description: '1080 × 1920 px', width: 1080, height: 1920, category: 'social', aspectRatio: '9:16' },
  { id: 'facebook-post', name: 'Facebook Post', description: '1200 × 630 px', width: 1200, height: 630, category: 'social', aspectRatio: '1.91:1' },
  { id: 'twitter-post', name: 'Twitter Post', description: '1200 × 675 px', width: 1200, height: 675, category: 'social', aspectRatio: '16:9' },
  { id: 'linkedin-post', name: 'LinkedIn Post', description: '1200 × 627 px', width: 1200, height: 627, category: 'social', aspectRatio: '1.91:1' },
  { id: 'youtube-thumb', name: 'YouTube Thumbnail', description: '1280 × 720 px', width: 1280, height: 720, category: 'social', aspectRatio: '16:9' },
  
  // Web & Digital
  { id: 'desktop-hd', name: 'Desktop HD', description: '1920 × 1080 px', width: 1920, height: 1080, category: 'web', aspectRatio: '16:9' },
  { id: 'desktop-4k', name: 'Desktop 4K', description: '3840 × 2160 px', width: 3840, height: 2160, category: 'web', aspectRatio: '16:9' },
  { id: 'tablet', name: 'Tablet', description: '768 × 1024 px', width: 768, height: 1024, category: 'web', aspectRatio: '3:4' },
  { id: 'mobile', name: 'Mobile', description: '375 × 812 px', width: 375, height: 812, category: 'web', aspectRatio: '9:19.5' },
  { id: 'banner', name: 'Web Banner', description: '728 × 90 px', width: 728, height: 90, category: 'web', aspectRatio: '8.09:1' },
  { id: 'square', name: 'Square', description: '1000 × 1000 px', width: 1000, height: 1000, category: 'web', aspectRatio: '1:1' },
]

const sizesInCategory = computed(() => {
  return predefinedSizes.filter(size => size.category === activeCategory.value)
})

const isSelected = (size: CanvasSize) => {
  return props.selectedSize.id === size.id
}

const getPreviewScale = (size: CanvasSize) => {
  const maxDimension = Math.max(size.width, size.height)
  const baseScale = 80
  return Math.min(baseScale / maxDimension, 0.5)
}

const getPreviewWidth = (size: CanvasSize) => {
  return size.width * getPreviewScale(size)
}

const getPreviewHeight = (size: CanvasSize) => {
  return size.height * getPreviewScale(size)
}

const handleCustomSizeCreate = () => {
  const width = parseInt(customWidth.value)
  const height = parseInt(customHeight.value)

  if (width > 0 && height > 0) {
    const customSize: CanvasSize = {
      id: `custom-${width}x${height}`,
      name: `Custom ${width}×${height}`,
      description: `${width} × ${height} px`,
      width,
      height,
      category: 'custom',
      aspectRatio: `${width}:${height}`,
    }
    emit('size-select', customSize)
    customWidth.value = ''
    customHeight.value = ''
    showCustom.value = false
  }
}
</script>
