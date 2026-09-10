<template>
  <div class="flex h-full flex-col  bg-white dark:bg-[hsl(0,0%,9%)]">
    <div class="border-b border-border px-3 py-2.5">
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchTerm"
          placeholder="Search templates"
          class="h-8 pl-9 text-xs"
        />
      </div>
    </div>

    <div
      ref="templateRef"
      class="flex-1 overflow-y-auto px-3 py-3"
    >
      <div class="space-y-4">
        <p v-if="isLoading" class="text-center text-[10px] text-muted-foreground py-2">
          Loading templates…
        </p>
        <p v-else-if="!filteredTemplates.length" class="text-center text-[10px] text-muted-foreground py-2">
          No templates match your search.
        </p>

        <!-- Landscape Templates (16:9) -->
        <div v-if="landscapeTemplates.length" class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Landscape
            </h3>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ landscapeTemplates.length }}</Badge>
          </div>
          
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="item in landscapeTemplates"
              :key="item.id"
              type="button"
              class="group relative overflow-hidden rounded-md border border-border bg-muted/30 transition-all hover:border-primary hover:bg-background hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              :style="{ aspectRatio: `${item.width} / ${item.height}` }"
              @click="requestTemplateChange(item)"
            >
              <img
                :src="item.preview"
                :alt="item.title"
                class="h-full w-full object-contain"
                loading="lazy"
                @error="(event) => handleImageError(event)">
            </button>
          </div>
        </div>

        <!-- Square Templates (1:1) -->
        <div v-if="squareTemplates.length" class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Square
            </h3>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ squareTemplates.length }}</Badge>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in squareTemplates"
              :key="item.id"
              type="button"
              class="group relative overflow-hidden rounded-md border border-border bg-muted/30 transition-all hover:border-primary hover:bg-background hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              :style="{ aspectRatio: `${item.width} / ${item.height}` }"
              @click="requestTemplateChange(item)"
            >
              <img
                :src="item.preview"
                :alt="item.title"
                class="h-full w-full object-contain"
                loading="lazy"
                @error="(event) => handleImageError(event)">
            </button>
          </div>
        </div>

        <!-- Portrait Templates (vertical) -->
        <div v-if="portraitTemplates.length" class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Portrait
            </h3>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ portraitTemplates.length }}</Badge>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in portraitTemplates"
              :key="item.id"
              type="button"
              class="group relative overflow-hidden rounded-md border border-border bg-muted/30 transition-all hover:border-primary hover:bg-background hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              :style="{ aspectRatio: `${item.width} / ${item.height}` }"
              @click="requestTemplateChange(item)"
            >
              <img
                :src="item.preview"
                :alt="item.title"
                class="h-full w-full object-contain"
                loading="lazy"
                @error="(event) => handleImageError(event)">
            </button>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model:open="confirmOpen">
      <DialogContent class="border-border/50 bg-background max-w-md">
        <DialogHeader class="space-y-1">
          <DialogTitle class="text-xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Switch Template
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Applying a new template will replace the current design. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex gap-2 justify-end">
          <DialogClose as-child>
            <Button variant="outline" class="h-7 text-xs border-border/50">Cancel</Button>
          </DialogClose>
          <Button :disabled="isApplying" @click="applyTemplate" class="h-7 text-xs">
            <Loader2 v-if="isApplying" class="mr-2 size-3.5 animate-spin" />
            <span>{{ isApplying ? 'Applying…' : 'Confirm' }}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { Search, Loader2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { useTemplatesStore } from '@/store'

interface LocalTemplateItem {
  id: string
  title: string
  preview: string
  jsonPath: string
  width: number
  height: number
}

// List of available local templates with their dimensions
// NOTE: previewExt defaults to 'jpeg' — set to 'png' for templates whose preview is a .png file
const LOCAL_TEMPLATES: { name: string; width: number; height: number; previewExt?: string }[] = [
  { name: 'architecture', width: 940, height: 788 },
  { name: 'bbq', width: 1600, height: 900 },
  { name: 'book-3', width: 1600, height: 2560, previewExt: 'png' },
  { name: 'buritto', width: 1080, height: 1080 },
  { name: 'business-book-2', width: 1600, height: 2560 },
  { name: 'business-book', width: 1600, height: 2560 },
  { name: 'car-insurance', width: 1080, height: 1080 },
  { name: 'energy-drink', width: 1080, height: 1080 },
  { name: 'ferrari', width: 1600, height: 900 },
  { name: 'fried-chicken', width: 1080, height: 1080, previewExt: 'png' },
  { name: 'furniture-2', width: 1080, height: 1080 },
  { name: 'furniture', width: 1080, height: 1080 },
  { name: 'handbag', width: 940, height: 788 },
  { name: 'headphones', width: 1080, height: 1080 },
  { name: 'insurance', width: 1080, height: 1080 },
  { name: 'jordans', width: 1080, height: 1080, previewExt: 'png' },
  { name: 'lincoln', width: 1600, height: 2560 },
  { name: 'mongol-empire', width: 1600, height: 2560 },
  { name: 'nike-shoes-1', width: 1080, height: 1080 },
  { name: 'nike', width: 2000, height: 2000 },
  { name: 'peace-book', width: 1600, height: 2560 },
  { name: 'pizza', width: 1080, height: 1080 },
  { name: 'sale', width: 1080, height: 1080 },
  { name: 'save-the-date', width: 940, height: 788 },
  { name: 'shapes-book', width: 1600, height: 2560 },
  { name: 'smoothie', width: 940, height: 788 },
  { name: 'starbucks', width: 940, height: 788 },
  { name: 'startup-summit', width: 1080, height: 1080 },
  { name: 'toys', width: 1080, height: 1080 },
  { name: 'turntable', width: 940, height: 788, previewExt: 'png' },
  { name: 'water-can', width: 1080, height: 1080, previewExt: 'png' },
  { name: 'wedding', width: 1600, height: 900 },
  { name: 'yoga-book', width: 1600, height: 2560 },
  { name: 'yoga', width: 940, height: 788 },
]

const formatTitle = (name: string): string => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const router = useRouter()
const templatesStore = useTemplatesStore()

const templateItems = ref<LocalTemplateItem[]>([])
const searchTerm = ref('')
const isLoading = ref(false)
const isApplying = ref(false)
const confirmOpen = ref(false)
const selectedTemplate = ref<LocalTemplateItem | null>(null)
const templateRef = ref<HTMLElement | null>(null)

const filteredTemplates = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term)
    return templateItems.value
  return templateItems.value.filter((item) =>
    item.title.toLowerCase().includes(term),
  )
})

// Landscape templates (width > height)
const landscapeTemplates = computed(() => {
  return filteredTemplates.value.filter((item) => item.width > item.height)
})

// Square templates (width === height)
const squareTemplates = computed(() => {
  return filteredTemplates.value.filter((item) => item.width === item.height)
})

// Portrait templates (height > width)
const portraitTemplates = computed(() => {
  return filteredTemplates.value.filter((item) => item.height > item.width)
})

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = new URL('/src/assets/images/loading.gif', import.meta.url).href
}

const loadLocalTemplates = () => {
  isLoading.value = true
  try {
    templateItems.value = LOCAL_TEMPLATES.map((template) => ({
      id: template.name,
      title: formatTitle(template.name),
      // Use relative paths — in the built Electron app loaded via file://,
      // absolute /euclid-templates/ would resolve to C:/euclid-templates/ (wrong).
      // Relative ./euclid-templates/ resolves correctly against dist/index.html.
      preview: `./euclid-templates/${template.name}.${template.previewExt ?? 'jpeg'}`,
      jsonPath: `./euclid-templates/${template.name}.json`,
      width: template.width,
      height: template.height,
    }))
  }
  catch (error) {
    const description = error instanceof Error ? error.message : 'Unknown error'
    toast({
      variant: 'destructive',
      title: 'Failed to load templates',
      description,
    })
  }
  finally {
    isLoading.value = false
  }
}

const requestTemplateChange = (item: LocalTemplateItem) => {
  selectedTemplate.value = item
  confirmOpen.value = true
}

const applyTemplate = async () => {
  if (!selectedTemplate.value)
    return
  isApplying.value = true
  try {
    const response = await fetch(selectedTemplate.value.jsonPath)
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`)
    }
    const data = await response.json()
    router.push({
      path: router.currentRoute.value.path,
      query: {
        ...router.currentRoute.value.query,
        template: String(selectedTemplate.value.id),
      },
    })
    await templatesStore.changeTemplate(data)
    toast({ title: 'Template switched successfully' })
    confirmOpen.value = false
  }
  catch (error) {
    const description = error instanceof Error ? error.message : 'Unknown error'
    toast({
      variant: 'destructive',
      title: 'Template loading failed',
      description,
    })
  }
  finally {
    isApplying.value = false
  }
}

onMounted(() => {
  loadLocalTemplates()
})
</script>
