<template>
  <div class="px-5">
    <Separator class="my-2" />

    <!-- Breadcrumb Navigation -->
    <div class="flex items-center gap-1 text-xs">
      <button 
        @click="$emit('navigate-folder', null)"
        class="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 py-2"
        :class="{ 'text-foreground font-medium': !currentFolderId }"
      >
        <Home class="w-3.5 h-3.5" />
        <span>Root</span>
      </button>
      <template v-for="folder in folderPath" :key="folder.id">
        <ChevronRight class="w-3.5 h-3.5 text-muted-foreground" />
        <button 
          @click="$emit('navigate-folder', folder.id)"
          class="text-muted-foreground hover:text-foreground transition-colors"
          :class="{ 'text-foreground font-medium': currentFolderId === folder.id }"
        >
          {{ folder.name }}
        </button>
      </template>
    </div>

    <!-- Search and Actions Bar -->
    <div class="flex items-center justify-between gap-2">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input 
          :modelValue="searchQuery"
          @update:modelValue="$emit('update:searchQuery', String($event))"
          placeholder="Search..." 
          class="pl-8 h-7 text-xs border-border/50"
        />
      </div>
      <div class="flex items-center gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          @click="$emit('update:viewMode', 'grid')" 
          :class="{ 'bg-primary text-primary-foreground border-primary': viewMode === 'grid' }"
          class="h-7 px-2"
        >
          <LayoutGrid class="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          @click="$emit('update:viewMode', 'list')" 
          :class="{ 'bg-primary text-primary-foreground border-primary': viewMode === 'list' }"
          class="h-7 px-2"
        >
          <List class="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="outline"
          size="sm"
          @click="$emit('new-folder')" 
          class="h-7 px-3 text-xs font-medium"
        >
          <FolderPlus class="w-3.5 h-3.5 mr-1" />
          Folder
        </Button>
        <Button 
          data-onboarding="new-project-btn"
          @click="$emit('new-project')" 
          class="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs font-medium"
        >
          <Plus class="w-3.5 h-3.5 mr-1" />
          New
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Search, LayoutGrid, List, FolderPlus, Plus, Home, ChevronRight } from 'lucide-vue-next'

defineProps<{
  folderPath: { id: string; name: string }[]
  currentFolderId: string | null
  searchQuery: string
  viewMode: 'grid' | 'list'
}>()

defineEmits<{
  'navigate-folder': [id: string | null]
  'update:searchQuery': [value: string]
  'update:viewMode': [mode: 'grid' | 'list']
  'new-folder': []
  'new-project': []
}>()
</script>
