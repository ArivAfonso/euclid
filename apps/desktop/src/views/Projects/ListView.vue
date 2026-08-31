<template>
  <table class="w-full text-xs">
    <thead class="sticky top-0 bg-muted/40 border-b border-border/50">
      <tr>
        <th class="px-3 py-2 text-left font-semibold text-foreground">Name</th>
        <th class="px-3 py-2 text-left font-semibold text-foreground">Type</th>
        <th class="px-3 py-2 text-left font-semibold text-foreground">Size</th>
        <th class="px-3 py-2 text-left font-semibold text-foreground">Modified</th>
        <th class="px-3 py-2 text-right font-semibold text-foreground">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-border/30">
      <!-- Folder Rows -->
      <ContextMenu v-for="folder in subfolders" :key="folder.id">
        <ContextMenuTrigger as-child>
          <tr 
            class="hover:bg-muted/40 cursor-pointer transition-colors"
            @click="$emit('navigate-folder', folder.id)"
            @dragover.prevent
            @drop="$emit('drop-on-folder', { folderId: folder.id, event: $event })"
          >
            <td class="px-3 py-2 font-medium text-foreground flex items-center gap-2">
              <Folder class="w-4 h-4" :style="{ color: folder.color || 'currentColor' }" />
              {{ folder.name }}
            </td>
            <td class="px-3 py-2 text-muted-foreground">Folder</td>
            <td class="px-3 py-2 text-muted-foreground">{{ getFolderItemCount(folder.id) }} items</td>
            <td class="px-3 py-2 text-muted-foreground">{{ formatDate(folder.modified) }}</td>
            <td class="px-3 py-2 text-right">
              <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click.stop>
                <MoreVertical class="w-3.5 h-3.5" />
              </Button>
            </td>
          </tr>
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

      <!-- Project Rows -->
      <ContextMenu v-for="project in projects" :key="project.id">
        <ContextMenuTrigger as-child>
          <tr 
            class="hover:bg-muted/40 cursor-pointer transition-colors"
            draggable="true"
            @dragstart="$emit('drag-start', { projectId: project.id, event: $event })"
            @click="$emit('open-project', project.id)"
          >
            <td class="px-3 py-2 font-medium text-foreground flex items-center gap-2">
              <FileText class="w-4 h-4" />
              {{ project.name }}
            </td>
            <td class="px-3 py-2 text-muted-foreground">Project</td>
            <td class="px-3 py-2 text-muted-foreground">{{ project.width }}×{{ project.height }}</td>
            <td class="px-3 py-2 text-muted-foreground">{{ formatDate(project.modified) }}</td>
            <td class="px-3 py-2 text-right">
              <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click.stop>
                <MoreVertical class="w-3.5 h-3.5" />
              </Button>
            </td>
          </tr>
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
          <ContextMenuItem 
            class="py-1 text-xs text-destructive focus:text-destructive"
            @click="$emit('delete-project', { id: project.id, name: project.name })"
          >
            <Trash2 class="mr-2 h-3.5 w-3.5" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import type { SavedProject, ProjectFolder } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import {
  Folder, FolderOpen, Pencil, Trash2, FileText, MoreVertical
} from 'lucide-vue-next'

const props = defineProps<{
  subfolders: ProjectFolder[]
  projects: SavedProject[]
  allFolders: ProjectFolder[]
}>()

const emit = defineEmits<{
  'navigate-folder': [id: string | null]
  'open-project': [id: string]
  'rename-project': [payload: { id: string; name: string }]
  'delete-project': [payload: { id: string; name: string }]
  'rename-folder': [payload: { id: string; name: string }]
  'delete-folder': [payload: { id: string; name: string }]
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
