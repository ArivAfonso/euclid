<template>
  <div class="flex h-full flex-col bg-white dark:bg-[hsl(0,0%,9%)]">  
    <div class="flex-1 overflow-y-auto px-3 py-3">
      <div v-if="filteredUploadedImages.length === 0" class="flex flex-col items-center justify-center h-full text-center px-4">
        <ImageIcon class="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p class="text-sm font-medium text-foreground mb-1">No uploads yet</p>
        <p class="text-xs text-muted-foreground mb-4">Upload images to see them here across all slides</p>
        <FileInput @change="(files: FileList) => drawImage(files)">
          <Button variant="outline" size="sm">
            <Upload class="size-3.5 mr-2" />
            Upload Image
          </Button>
        </FileInput>
      </div>

      <div v-else class="space-y-2.5">
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Uploaded Images
            </h3>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ filteredUploadedImages.length }}</Badge>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="image in filteredUploadedImages"
              :key="image"
              class="group relative aspect-square rounded-md overflow-hidden border border-border/50 bg-muted/30 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
              @click="addImageToCanvas(image)"
            >
              <img
                :src="image"
                alt="Uploaded image"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                <Plus class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <Button
                variant="destructive"
                size="icon"
                class="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                @click.stop="removeImage(image)"
              >
                <X class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center text-xs text-muted-foreground px-1">
          <span>Click to add to canvas</span>
          <Button 
            variant="ghost" 
            size="sm" 
            class="h-7 text-xs"
            @click="clearAllImages"
            v-if="uploadedImages.length > 0"
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Search, Upload, Plus, X, ImageIcon } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import FileInput from '@/components/FileInput.vue'
import { getImageDataURL } from '@/utils/image'
import useHandleCreate from '@/hooks/useHandleCreate'
import useCanvas from '@/views/Canvas/useCanvas'
import { useTemplatesStore } from '@/store'

const { createImageElement } = useHandleCreate()
const [canvas] = useCanvas()
const templatesStore = useTemplatesStore()

const STORAGE_KEY = 'uploaded_images'
const MAX_STORED_IMAGES = 300
const searchTerm = ref('')
const uploadedImages = ref<string[]>([])

const normalizeImageUrl = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const mergeImageList = (incoming: string[], prepend = false) => {
  if (!incoming.length) return

  const current = uploadedImages.value
  const combined = prepend ? [...incoming, ...current] : [...current, ...incoming]
  const deduped = Array.from(new Set(combined))

  uploadedImages.value = deduped.slice(0, MAX_STORED_IMAGES)
}

const extractImageUrlsFromObjects = (objects: any[]): string[] => {
  const urls: string[] = []

  const visit = (obj: any) => {
    if (!obj || typeof obj !== 'object') return

    const type = String(obj.type || '').toLowerCase()
    if (type === 'image' || type === 'gifimage') {
      const src = normalizeImageUrl(obj.imageEffectsOriginalSrc || obj.originSrc || obj.src)
      if (src) urls.push(src)
    }

    if (Array.isArray(obj.objects)) {
      obj.objects.forEach(visit)
    }
  }

  objects.forEach(visit)
  return urls
}

const syncImagesFromTemplates = () => {
  const urls = templatesStore.templates.flatMap(template =>
    extractImageUrlsFromObjects(template.objects as any[])
  )
  mergeImageList(urls)
}

const syncImageFromCanvasTarget = (target: any) => {
  if (!target) return

  const type = String(target.type || '').toLowerCase()
  if (type === 'image' || type === 'gifimage') {
    const src = normalizeImageUrl(
      target.imageEffectsOriginalSrc ||
      target.originSrc ||
      (typeof target.getSrc === 'function' ? target.getSrc() : target.src)
    )
    if (src) mergeImageList([src], true)
  }

  if (Array.isArray(target._objects)) {
    const groupedUrls = extractImageUrlsFromObjects(target._objects)
    mergeImageList(groupedUrls, true)
  }
}

const handleCanvasObjectAdded = (event: any) => {
  syncImageFromCanvasTarget(event?.target)
}

// Load uploaded images from localStorage on mount
onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      uploadedImages.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to load uploaded images:', e)
      uploadedImages.value = []
    }
  }

  syncImagesFromTemplates()

  if (canvas) {
    canvas.on('object:added', handleCanvasObjectAdded)
  }
})

onBeforeUnmount(() => {
  if (canvas) {
    canvas.off('object:added', handleCanvasObjectAdded)
  }
})

watch(
  () => templatesStore.templates,
  () => {
    syncImagesFromTemplates()
  },
  { deep: true }
)

// Save to localStorage whenever uploadedImages changes
watch(uploadedImages, (newValue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
}, { deep: true })

const filteredUploadedImages = computed(() => {
  if (!searchTerm.value) return uploadedImages.value
  
  return uploadedImages.value.filter((_, index) => 
    `image ${index + 1}`.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const drawImage = (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  
  getImageDataURL(imageFile).then((dataURL) => {
    // Add to canvas
    createImageElement(dataURL)

    mergeImageList([dataURL], true)
  })
}

const addImageToCanvas = (imageUrl: string) => {
  createImageElement(imageUrl)
}

const removeImage = (imageUrl: string) => {
  uploadedImages.value = uploadedImages.value.filter(image => image !== imageUrl)
}

const clearAllImages = () => {
  if (confirm('Are you sure you want to clear all uploaded images? This cannot be undone.')) {
    uploadedImages.value = []
  }
}
</script>
