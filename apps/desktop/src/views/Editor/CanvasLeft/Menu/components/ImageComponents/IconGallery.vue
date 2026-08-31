<template>
  <div class="h-full flex flex-col">
    <!-- Search Section -->
    <div class="border-b border-border/50 px-3 py-2.5">
      <!-- Search input -->
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search icons..."
          class="h-8 pl-9 text-xs"
          @keyup.enter="performSearch"
        />
      </div>
    </div>

    <!-- Icon grid with infinite scroll -->
    <div class="flex-1 overflow-y-auto px-3 py-3" ref="scrollContainer" @scroll="handleScroll">
      <div class="icon-grid">
        <div v-if="loading && icons.length === 0" class="flex items-center justify-center py-12">
          <svg class="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        </div>
        <div 
          class="icon-item" 
          v-for="icon in icons" 
          :key="icon.id"
          @click="createIcon(icon)"
        >
          <div class="icon-wrapper">
            <img 
              :src="icon.thumbnail" 
              :alt="icon.title || 'Icon'" 
              loading="lazy"
              class="icon-image"
            />
          </div>
          <div class="icon-title">
            {{ icon.title }}
          </div>
        </div>
      </div>

      <!-- Loading indicator for infinite scroll -->
      <div v-if="loading && icons.length > 0" class="flex justify-center py-4">
        <div class="text-xs text-muted-foreground">Loading more...</div>
      </div>

      <!-- Empty state -->
      <div v-if="icons.length === 0 && !loading" class="text-center py-8 text-muted-foreground text-sm">
        <p>No icons found. Try searching for something!</p>
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

const searchQuery = ref('')
const loading = ref(false)
const icons = ref<any[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const scrollContainer = ref<HTMLDivElement>()

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  loading.value = true
  currentPage.value = 1

  try {
    const params = new URLSearchParams({
      query: searchQuery.value.trim(),
      page: String(currentPage.value),
      per_page: '30',
    })

    const response = await fetch(`${CF_WORKERS_API}/api/icons/search?${params}`)
    const data = await response.json()

    if (data.success && data.result) {
      icons.value = data.result.icons || []
      totalPages.value = Math.ceil((data.result.total || 0) / 30)
    }
  } catch (error) {
    console.error('Icon search failed:', error)
    icons.value = []
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
    const params = new URLSearchParams({
      query: searchQuery.value.trim(),
      page: String(currentPage.value),
      per_page: '30',
    })

    const response = await fetch(`${CF_WORKERS_API}/api/icons/search?${params}`)
    const data = await response.json()

    if (data.success && data.result) {
      icons.value = [...icons.value, ...(data.result.icons || [])]
    }
  } catch (error) {
    console.error('Icon load more failed:', error)
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

const createIcon = async (icon: any) => {
  if (icon?.url) {
    createImageElement(icon.url)
  }
}
</script>

<style scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s;
  min-width: 0;
}

.icon-item:hover {
  transform: translateY(-2px);
}

.icon-wrapper {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  padding: 12px;
  background: hsl(var(--muted) / 0.2);
  transition: all 0.2s;
}

.icon-item:hover .icon-wrapper {
  background: hsl(var(--muted) / 0.4);
  border-color: hsl(var(--primary) / 0.5);
}

.icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(0);
}

.dark .icon-image {
  filter: brightness(0) saturate(100%) invert(1);
}

.icon-title {
  font-size: 10px;
  text-align: center;
  color: hsl(var(--muted-foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  font-weight: 500;
  line-height: 1;
}
</style>
