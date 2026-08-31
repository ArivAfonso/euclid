<template>
  <div class="virtualized-font-select">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="isOpen"
          class="h-7 w-full justify-between text-xs border-input"
        >
          <span class="truncate" :style="{ fontFamily: modelValue }">
            {{ displayLabel }}
          </span>
          <ChevronsUpDown class="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[280px] p-0" align="start">
        <div class="p-2 border-b flex gap-2">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm" class="h-7 text-xs flex-1">
                <Filter class="w-3 h-3 mr-1" />
                Filters
                <span v-if="activeFilterCount > 0" class="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                  {{ activeFilterCount }}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[240px] p-3" align="start">
              <div class="space-y-3">
                <div class="space-y-1">
                  <Label class="text-xs font-medium">Category</Label>
                  <Select v-model="selectedCategory">
                    <SelectTrigger class="h-7 text-xs border border-input">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="sans-serif">Sans Serif</SelectItem>
                      <SelectItem value="display">Display</SelectItem>
                      <SelectItem value="handwriting">Handwriting</SelectItem>
                      <SelectItem value="monospace">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1">
                  <Label class="text-xs font-medium">Subset</Label>
                  <Select v-model="selectedSubset">
                    <SelectTrigger class="h-7 text-xs border border-input">
                      <SelectValue placeholder="All Subsets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subsets</SelectItem>
                      <SelectItem value="latin">Latin</SelectItem>
                      <SelectItem value="latin-ext">Latin Extended</SelectItem>
                      <SelectItem value="cyrillic">Cyrillic</SelectItem>
                      <SelectItem value="cyrillic-ext">Cyrillic Extended</SelectItem>
                      <SelectItem value="greek">Greek</SelectItem>
                      <SelectItem value="greek-ext">Greek Extended</SelectItem>
                      <SelectItem value="vietnamese">Vietnamese</SelectItem>
                      <SelectItem value="korean">Korean</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                      <SelectItem value="chinese-simplified">Chinese Simplified</SelectItem>
                      <SelectItem value="chinese-traditional">Chinese Traditional</SelectItem>
                      <SelectItem value="thai">Thai</SelectItem>
                      <SelectItem value="devanagari">Devanagari</SelectItem>
                      <SelectItem value="arabic">Arabic</SelectItem>
                      <SelectItem value="hebrew">Hebrew</SelectItem>
                      <SelectItem value="bengali">Bengali</SelectItem>
                      <SelectItem value="tamil">Tamil</SelectItem>
                      <SelectItem value="telugu">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1">
                  <div class="flex justify-between">
                    <Label class="text-xs font-medium">Min Variants</Label>
                    <span class="text-xs text-muted-foreground">{{ minVariants }}</span>
                  </div>
                  <Slider
                    v-model="minVariantsArray"
                    :min="1"
                    :max="18"
                    :step="1"
                    class="py-1"
                  />
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  class="w-full h-7 text-xs"
                  @click="resetFilters"
                  v-if="activeFilterCount > 0"
                >
                  Reset Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Command v-model:search-term="searchTerm" :filter-function="filterFunction">
          <CommandInput
            placeholder="Search fonts..."
            class="h-8"
            @keydown="handleSearchKeydown"
          />
          <CommandEmpty>No font found.</CommandEmpty>
          <CommandList class="max-h-[300px] font-select-list">
            <CommandGroup
              v-for="group in visibleGroups"
              :key="group.label"
              :heading="group.label"
            >
              <VirtualizedFontOptionItem
                v-for="item in group.options"
                :key="item.value"
                :font="item"
                :is-selected="modelValue === item.value"
                :ensure-font="ensureFont"
                :on-select="handleSelect"
                :is-google-font="isGoogleFont(item.value)"
              />
            </CommandGroup>
            <div ref="loadMoreTrigger" class="h-1 w-full"></div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { ChevronsUpDown, Filter } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useMainStore } from '@/store'
import type { FontGroupOption } from '@/types/elements'
import VirtualizedFontOptionItem from '@/components/VirtualizedFontOptionItem.vue'

const mainStore = useMainStore()

const props = defineProps<{
  modelValue: string
  fontGroups: FontGroupOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const searchTerm = ref('')
const loadedItemsCount = ref(20)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Filter states
const selectedCategory = ref('all')
const selectedSubset = ref('all')
const minVariantsArray = ref([1])
const minVariants = computed(() => minVariantsArray.value[0])

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedCategory.value !== 'all') count++
  if (selectedSubset.value !== 'all') count++
  if (minVariants.value > 1) count++
  return count
})

const resetFilters = () => {
  selectedCategory.value = 'all'
  selectedSubset.value = 'all'
  minVariantsArray.value = [1]
}

const googleFontFamilies = computed(() => new Set(mainStore.googleFonts.map(font => font.family)))
const googleFontsMap = computed(() => {
  const map = new Map()
  mainStore.googleFonts.forEach(font => {
    map.set(font.family, font)
  })
  return map
})
const loadedFonts = new Set<string>()

const displayLabel = computed(() => {
  for (const group of props.fontGroups) {
    const font = group.options.find(f => f.value === props.modelValue)
    if (font) return font.label
  }
  return props.modelValue
})

useIntersectionObserver(
  loadMoreTrigger,
  ([entry]) => {
    if (entry.isIntersecting) {
      loadedItemsCount.value += 20
    }
  },
  {
    root: null,
    threshold: 0.1,
  }
)

watch([selectedCategory, selectedSubset, minVariants], () => {
  loadedItemsCount.value = 20
})

watch(isOpen, (open) => {
  if (!open) {
    searchTerm.value = ''
    loadedItemsCount.value = 20
  }
})

const filteredGroups = computed(() => {
  let groups = props.fontGroups

  // Apply filters
  if (activeFilterCount.value > 0) {
    groups = groups.map(group => {
      const filteredOptions = group.options.filter(opt => {
        const fontData = googleFontsMap.value.get(opt.value)
        if (!fontData) return true // Keep non-google fonts (like custom fonts)

        // Filter by category
        if (selectedCategory.value !== 'all' && fontData.category !== selectedCategory.value) {
          return false
        }

        // Filter by subset
        if (selectedSubset.value !== 'all' && !fontData.subsets.includes(selectedSubset.value)) {
          return false
        }

        // Filter by variants count
        if (minVariants.value > 1 && fontData.variants.length < minVariants.value) {
          return false
        }

        return true
      })
      
      return {
        ...group,
        options: filteredOptions
      }
    }).filter(group => group.options.length > 0)
  }

  if (!searchTerm.value) return groups
  
  const lowerTerm = searchTerm.value.toLowerCase()
  return groups.map(group => ({
    label: group.label,
    options: group.options.filter(opt => opt.label.toLowerCase().includes(lowerTerm))
  })).filter(group => group.options.length > 0)
})

const visibleGroups = computed(() => {
  const groups: FontGroupOption[] = []
  let count = 0
  const limit = loadedItemsCount.value
  
  for (const group of filteredGroups.value) {
    if (count >= limit) break
    
    const remaining = limit - count
    if (group.options.length <= remaining) {
      groups.push(group)
      count += group.options.length
    } else {
      groups.push({
        ...group,
        options: group.options.slice(0, remaining)
      })
      count += remaining
    }
  }
  return groups
})


const filterFunction = (value: string, search: string) => {
  if (!search) return 1
  const searchLower = search.toLowerCase()
  const valueLower = value.toLowerCase()
  if (valueLower.includes(searchLower)) return 1
  return 0
}

const isGoogleFont = (family: string) => googleFontFamilies.value.has(family)

const ensureFont = (family: string) => {
  if (loadedFonts.has(family)) return
  if (!isGoogleFont(family)) {
    loadedFonts.add(family)
    return
  }
  mainStore.ensureFontLoaded(family)
  loadedFonts.add(family)
}

const handleSelect = (value: string) => {
  ensureFont(value)
  emit('update:modelValue', value)
  isOpen.value = false
  searchTerm.value = ''
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Backspace' || event.key === 'Delete') {
    event.stopPropagation()
  }
}

// Preload the current font immediately
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    ensureFont(newValue)
  }
}, { immediate: true })
</script>

<style scoped>
.virtualized-font-select {
  width: 100%;
}

:deep(.font-select-list) {
  scrollbar-width: none;
}

:deep(.font-select-list::-webkit-scrollbar) {
  display: none;
}
</style>
