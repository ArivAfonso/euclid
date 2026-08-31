<template>
  <div class="h-full flex flex-col">
    <!-- Search Section -->
    <div class="border-b border-border/50 px-3 py-2.5 space-y-2">
      <!-- Color Theme Toggle -->
      <div class="flex gap-2 items-center">
        <span class="text-xs text-muted-foreground font-medium">Color:</span>
        <div class="flex gap-1">
          <button
            v-for="theme in ['brand', 'black', 'white']"
            :key="theme"
            :class="[
              'px-2 py-1 text-xs rounded border transition-colors',
              colorTheme === theme
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground'
            ]"
            @click="colorTheme = theme as any"
          >
            {{ theme.charAt(0).toUpperCase() + theme.slice(1) }}
          </button>
        </div>
      </div>

      <!-- Search input -->
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search company logos..."
          class="h-8 pl-9 text-xs"
        />
      </div>
    </div>

    <!-- Logo grid -->
    <div class="flex-1 overflow-y-auto px-3 py-3" ref="scrollContainer">
      <div class="logo-grid">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <svg class="animate-spin h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        </div>
        <div 
          class="logo-item" 
          v-for="logo in filteredLogos" 
          :key="logo.slug"
          @click="createLogo(logo)"
          :title="logo.title"
        >
          <div class="logo-wrapper">
            <div 
              class="logo-svg" 
              :style="getSvgStyle(logo)"
              v-html="logo.svg"
            ></div>
          </div>
          <div class="logo-title">
            {{ logo.title }}
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredLogos.length === 0 && !loading" class="text-center py-8 text-muted-foreground text-sm">
        <p v-if="searchQuery">No logos found matching "{{ searchQuery }}"</p>
        <p v-else>Start typing to search for company logos</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import * as simpleIcons from 'simple-icons'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-vue-next'
import useCanvas from '@/views/Canvas/useCanvas'
import { loadSVGFromString, Group } from 'fabric'

const scrollContainer = ref<HTMLDivElement>()
const loading = ref(false)
const searchQuery = ref('')
const colorTheme = ref<'brand' | 'black' | 'white'>('brand')

interface SimpleIcon {
  title: string
  slug: string
  hex: string
  svg: string
  path: string
  source?: string
  guidelines?: string
  license?: {
    type: string
    url: string
  }
}

interface LogoItem {
  title: string
  slug: string
  hex: string
  svg: string
  path: string
}

// Get all simple icons
const allLogos = computed<LogoItem[]>(() => {
  const logos: LogoItem[] = []
  
  for (const key in simpleIcons) {
    if (key.startsWith('si')) {
      const icon = (simpleIcons as any)[key] as SimpleIcon
      logos.push({
        title: icon.title,
        slug: icon.slug,
        hex: icon.hex,
        svg: icon.svg,
        path: icon.path
      })
    }
  }
  
  return logos.sort((a, b) => a.title.localeCompare(b.title))
})

// Filter logos based on search query
const filteredLogos = computed(() => {
  if (!searchQuery.value.trim()) {
    // Return first 100 logos when no search query
    return allLogos.value.slice(0, 100)
  }
  
  const query = searchQuery.value.toLowerCase()
  return allLogos.value.filter(logo => 
    logo.title.toLowerCase().includes(query) ||
    logo.slug.toLowerCase().includes(query)
  ).slice(0, 100) // Limit to 100 results for performance
})

const getSvgStyle = (logo: LogoItem) => {
  let filter = ''
  
  if (colorTheme.value === 'brand') {
    // Use the brand color for stroke
    filter = `invert(0)`
    return {
      color: `#${logo.hex}`,
      filter: `drop-shadow(0 0 0 #${logo.hex})`,
      strokeWidth: '0.5',
    } as any
  } else if (colorTheme.value === 'black') {
    filter = `invert(0) brightness(0)`
  } else if (colorTheme.value === 'white') {
    filter = `invert(1)`
  }
  
  return {
    filter,
    strokeWidth: '0.5',
  }
}

const createLogo = async (logo: LogoItem) => {
  const [canvas] = useCanvas()
  if (!canvas) return

  try {
    loading.value = true
    
    // Load SVG from string
    const { objects, options } = await loadSVGFromString(logo.svg)
    
    if (objects && objects.length > 0) {
      // Filter out null objects
      const validObjects = objects.filter(obj => obj !== null)
      
      if (validObjects.length === 0) return
      
      // Apply color theme to all objects
      validObjects.forEach(obj => {
        if (obj) {
          if (colorTheme.value === 'brand') {
            obj.set({
              fill: `#${logo.hex}`,
              stroke: `#${logo.hex}`,
              strokeWidth: 0,
            })
          } else if (colorTheme.value === 'black') {
            obj.set({
              fill: '#000000',
              stroke: '#000000',
              strokeWidth: 0,
            })
          } else if (colorTheme.value === 'white') {
            obj.set({
              fill: '#ffffff',
              stroke: '#ffffff',
              strokeWidth: 0,
            })
          }
        }
      })
      
      // Create a group from all objects
      const group = new Group(validObjects)
      
      // Scale to reasonable size (max 200px)
      const maxSize = 200
      const scale = Math.min(
        maxSize / (group.width || 1),
        maxSize / (group.height || 1)
      )
      group.scale(scale)
      
      // Center on canvas
      canvas.add(group)
      canvas.centerObject(group)
      canvas.setActiveObject(group)
      canvas.renderAll()
    }
  } catch (error) {
    console.error('Error creating logo:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.logo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.logo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}

.logo-item:hover {
  transform: scale(1.05);
}

.logo-wrapper {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--muted));
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.logo-item:hover .logo-wrapper {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.logo-svg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-svg :deep(svg) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-svg :deep(svg *) {
  stroke: currentColor !important;
  fill: currentColor !important;
  stroke-width: 0.5px !important;
}

.logo-title {
  font-size: 10px;
  text-align: center;
  color: hsl(var(--muted-foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
}

.logo-item:hover .logo-title {
  color: hsl(var(--foreground));
}
</style>
