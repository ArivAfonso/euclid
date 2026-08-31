<template>
  <div class="flex items-center justify-center py-12 text-center">
    <div class="space-y-2">
      <div class="text-2xl font-light text-muted-foreground" style="font-family: 'Editorial New', serif;">
        {{ currentFolderId ? 'This folder is empty' : 'No projects found' }}
      </div>
      <div class="flex gap-2 justify-center">
        <Button @click="$emit('new-folder')" variant="outline" size="sm" class="h-6 text-xs">
          <FolderPlus class="w-3 h-3 mr-1" />
          New Folder
        </Button>
        <Button data-onboarding="new-project-btn" @click="$emit('new-project')" variant="outline" size="sm" class="h-6 text-xs">
          <Plus class="w-3 h-3 mr-1" />
          New Project
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { FolderPlus, Plus } from 'lucide-vue-next'

defineProps<{
  currentFolderId: string | null
}>()

defineEmits<{
  'new-folder': []
  'new-project': []
}>()
</script>
