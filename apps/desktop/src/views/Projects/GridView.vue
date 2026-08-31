<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
    <!-- New Project Card -->
    <button 
      v-if="subfolders.length > 0 || projects.length > 0"
      @click="$emit('new-project')"
      class="group relative aspect-[4/3] rounded border border-dashed border-border/60 hover:border-primary/50 bg-background/40 hover:bg-background/70 transition-all flex flex-col items-center justify-center gap-2 p-3"
    >
      <div class="w-10 h-10 rounded border border-dashed border-border/60 group-hover:border-primary/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
        <Plus class="w-5 h-5" />
      </div>
      <span class="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">New</span>
    </button>

    <!-- Folder Cards -->
    <ContextMenu v-for="folder in subfolders" :key="folder.id">
      <ContextMenuTrigger>
        <div 
          class="group relative aspect-[4/3] rounded border border-border/50 hover:border-primary/50 bg-background/60 hover:bg-background transition-all cursor-pointer overflow-hidden flex flex-col"
          @click="$emit('navigate-folder', folder.id)"
          @dragover.prevent
          @drop="$emit('drop-on-folder', { folderId: folder.id, event: $event })"
        >
          <!-- Folder Icon -->
          <div class="flex-1 flex items-center justify-center bg-muted/30 rounded-t overflow-hidden">
            <Folder 
              class="w-16 h-16 transition-colors" 
              :style="{ color: folder.color || 'hsl(var(--muted-foreground))' }"
            />
          </div>
          
          <div class="p-2 space-y-1 bg-background">
            <h3 class="text-xs font-semibold text-foreground dark:text-[hsl(0_0%_90%)] truncate flex items-center gap-1">
              <FolderIcon class="w-3 h-3" :style="{ color: folder.color || 'currentColor' }" />
              {{ folder.name }}
            </h3>
            <div class="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{{ getFolderItemCount(folder.id) }} items</span>
              <span>{{ formatDate(folder.modified) }}</span>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent class="min-w-[7.25rem] w-auto">
        <ContextMenuItem class="py-1 text-xs text-muted-foreground" @click="$emit('navigate-folder', folder.id)">
          <FolderOpen class="mr-2 h-3.5 w-3.5" />
          Open
        </ContextMenuItem>
        <ContextMenuItem class="py-1 text-xs text-muted-foreground" @click="$emit('rename-folder', { id: folder.id, name: folder.name })">
          <Pencil class="mr-2 h-3.5 w-3.5" />
          Rename
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger class="py-1 text-xs text-muted-foreground">
            <Palette class="mr-2 h-3.5 w-3.5" />
            Color
          </ContextMenuSubTrigger>
          <ContextMenuSubContent class="min-w-[8.25rem] w-auto">
            <ContextMenuItem 
              v-for="color in folderColors" 
              :key="color.value"
              class="py-1 text-xs text-muted-foreground"
              @click="$emit('change-folder-color', { folderId: folder.id, color: color.value })"
            >
              <div 
                class="w-3.5 h-3.5 rounded-full mr-2" 
                :style="{ backgroundColor: color.value }"
              ></div>
              {{ color.name }}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator class="my-0.5" />
        <ContextMenuItem 
          class="py-1 text-xs text-destructive focus:text-destructive"
          @click="$emit('delete-folder', { id: folder.id, name: folder.name })"
        >
          <Trash2 class="mr-2 h-3.5 w-3.5" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>

    <!-- Project Cards -->
    <ContextMenu v-for="project in projects" :key="project.id">
      <ContextMenuTrigger>
        <div 
          class="group relative aspect-[4/3] rounded border border-border/50 hover:border-primary/50 bg-background/60 hover:bg-background transition-all cursor-pointer overflow-hidden flex flex-col"
          draggable="true"
          @dragstart="$emit('drag-start', { projectId: project.id, event: $event })"
          @click="$emit('open-project', project.id)"
        >
          <!-- Thumbnail -->
          <div class="flex-1 flex items-center justify-center bg-muted/30 rounded-t overflow-hidden">
            <img 
              v-if="project.thumbnail" 
              :src="project.thumbnail" 
              :alt="project.name"
              class="w-full h-full object-contain"
            />
            <div v-else class="text-3xl font-bold text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
              {{ project.name.charAt(0).toUpperCase() }}
            </div>
          </div>
          
          <div class="p-2 space-y-1 bg-background">
            <h3 class="text-xs font-semibold text-foreground project-card-name truncate">{{ project.name }}</h3>
            <div class="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{{ Math.round(project.width) }}×{{ Math.round(project.height) }}</span>
              <span>{{ formatDate(project.modified) }}</span>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent class="min-w-[7.25rem] w-auto">
        <ContextMenuItem class="py-1 text-xs text-muted-foreground" @click="$emit('open-project', project.id)">
          <FileText class="mr-2 h-3.5 w-3.5" />
          Open
        </ContextMenuItem>
        <ContextMenuItem class="py-1 text-xs text-muted-foreground" @click="$emit('rename-project', { id: project.id, name: project.name })">
          <Pencil class="mr-2 h-3.5 w-3.5" />
          Rename
        </ContextMenuItem>
        <ContextMenuSeparator class="my-0.5" />
        <ContextMenuItem 
          class="py-1 text-xs text-destructive focus:text-destructive"
          @click="$emit('delete-project', { id: project.id, name: project.name })"
        >
          <Trash2 class="mr-2 h-3.5 w-3.5" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  </div>
</template>

<script lang="ts" setup>
import type { SavedProject, ProjectFolder } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import {
  Plus, Folder, FolderOpen, FolderPlus,
  Pencil, Trash2, Palette, FileText, Home, Folder as FolderIcon
} from 'lucide-vue-next'

const props = defineProps<{
  subfolders: ProjectFolder[]
  projects: SavedProject[]
  allFolders: ProjectFolder[]
  currentFolderId: string | null
  folderColors: { name: string; value: string }[]
}>()

const emit = defineEmits<{
  'navigate-folder': [id: string | null]
  'open-project': [id: string]
  'new-project': []
  'rename-project': [payload: { id: string; name: string }]
  'delete-project': [payload: { id: string; name: string }]
  'rename-folder': [payload: { id: string; name: string }]
  'delete-folder': [payload: { id: string; name: string }]
  'move-project': [payload: { projectId: string; folderId: string | null }]
  'change-folder-color': [payload: { folderId: string; color: string }]
  'drop-on-folder': [payload: { folderId: string; event: DragEvent }]
  'drag-start': [payload: { projectId: string; event: DragEvent }]
}>()

function getFolderItemCount(folderId: string): number {
  const projectCount = props.projects.filter(p => p.folderId === folderId).length
  const subfolderCount = props.allFolders.filter(f => f.parentId === folderId).length
  return projectCount + subfolderCount
}

function formatDate(timestamp: number) {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 7) {
    return new Date(timestamp).toLocaleDateString()
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}
</script>
