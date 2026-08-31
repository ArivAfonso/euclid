<template>
  <div class="h-full flex flex-col">
    <!-- Filter Section -->
    <div class="border-b border-border/50 px-3 py-2.5 space-y-2">
      <!-- Source filters dropdown -->
      <div class="flex gap-2 items-center">
        <span class="text-xs text-muted-foreground font-medium">Source:</span>
        <Select :model-value="selectedSource" @update:model-value="handleSourceChange">
          <SelectTrigger class="h-8 w-auto min-w-28 text-xs text-muted-foreground border border-input">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent class="min-w-28 p-0.5 text-muted-foreground">
            <SelectItem value="all" class="text-xs py-1 text-muted-foreground">All Sources</SelectItem>
            <SelectItem value="unsplash" class="text-xs py-1 text-muted-foreground">Unsplash</SelectItem>
            <SelectItem value="pixabay" class="text-xs py-1 text-muted-foreground">Pixabay</SelectItem>
            <SelectItem value="flickr" class="text-xs py-1 text-muted-foreground">Flickr</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Search input -->
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search stock images..."
          class="h-8 pl-9 text-xs"
          @keyup.enter="performSearch"
        />
      </div>
    </div>

    <!-- Image grid with infinite scroll -->
    <div class="flex-1 overflow-y-auto px-3 py-3" ref="scrollContainer" @scroll="handleScroll">
      <div class="image-grid">
        <div v-if="loading && images.length === 0" class="flex items-center justify-center py-12">
          <svg class="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        </div>
        <div 
          class="image-item" 
          v-for="(image, index) in images" 
          :key="image.id"
          @click="createImage(image)"
        >
          <div class="image-wrapper">
            <img 
              :src="image.thumbnail" 
              :alt="image.title || 'Stock image'" 
              class="image-thumbnail" 
              loading="lazy"
            />
            <div class="image-overlay">
              <div class="image-source">
                {{ image.source }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading indicator for infinite scroll -->
      <div v-if="loading && images.length > 0" class="flex justify-center py-4">
        <div class="text-xs text-muted-foreground">Loading more...</div>
      </div>

      <!-- Empty state -->
      <div v-if="images.length === 0 && !loading" class="text-center py-8 text-muted-foreground text-sm">
        <p>No images found. Try searching for something!</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-vue-next'
import useHandleCreate from '@/hooks/useHandleCreate'

const CF_WORKERS_API = import.meta.env.VITE_CF_WORKERS_API || 'http://localhost:8787'

const { createImageElement } = useHandleCreate()

const loading = ref(false)
const searchQuery = ref('')
const images = ref<any[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const selectedSource = ref<string>('all')
const scrollContainer = ref<HTMLDivElement>()

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  loading.value = true
  currentPage.value = 1

  try {
    const sources = selectedSource.value === 'all'
      ? ['unsplash', 'pixabay', 'flickr']
      : [selectedSource.value]

    const params = new URLSearchParams({
      query: searchQuery.value.trim(),
      page: String(currentPage.value),
      per_page: '20',
      sources: sources.join(','),
    })

    const response = await fetch(`${CF_WORKERS_API}/api/images/search?${params}`)
    const data = await response.json()

    if (data.success && data.result) {
      images.value = data.result.images || []
      totalPages.value = Math.ceil((data.result.total || 0) / 20)
    }
  } catch (error) {
    console.error('Stock image search failed:', error)
    images.value = []
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loading.value || currentPage.value >= totalPages.value) return
  if (!searchQuery.value.trim()) return

  loading.value = true
  currentPage.value++

  try {
    const sources = selectedSource.value === 'all'
      ? ['unsplash', 'pixabay', 'flickr']
      : [selectedSource.value]

    const params = new URLSearchParams({
      query: searchQuery.value.trim(),
      page: String(currentPage.value),
      per_page: '20',
      sources: sources.join(','),
    })

    const response = await fetch(`${CF_WORKERS_API}/api/images/search?${params}`)
    const data = await response.json()

    if (data.success && data.result) {
      images.value = [...images.value, ...(data.result.images || [])]
    }
  } catch (error) {
    console.error('Stock image load more failed:', error)
  } finally {
    loading.value = false
  }
}

const handleScroll = () => {
  const el = scrollContainer.value
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    loadMore()
  }
}

const handleSourceChange = (value: string) => {
  selectedSource.value = value
  if (searchQuery.value.trim()) {
    performSearch()
  }
}

const createImage = async (image: any) => {
  if (image?.url) {
    createImageElement(image.url)
  }
}
</script>

<style scoped>
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  width: 100%;
}

.image-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.image-item:hover {
  transform: translateY(-2px);
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* 1:1 Aspect Ratio */
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.3);
}

.image-thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:hover .image-thumbnail {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.image-source {
  color: white;
  font-size: 9px;
  font-weight: 500;
  text-transform: capitalize;
  letter-spacing: 0.5px;
}
</style>
