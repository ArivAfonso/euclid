<template>
  <div class="flex flex-col h-screen bg-background select-none">
    <!-- Electron Titlebar -->
    <ElectronTitlebar v-if="isElectronMode" title="Euclid - Projects" context="projects" />
    
    <!-- Alternative simple titlebar if not Electron -->
    <div v-else class="h-10 bg-background border-b border-border/50 flex items-center justify-between px-4">
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-foreground">Projects</span>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-auto bg-background">
      <div class="space-y-4">
        <HeroBanner />

        <ProjectsToolbar 
          :folderPath="folderPath"
          :currentFolderId="currentFolderId"
          :searchQuery="searchQuery"
          :viewMode="viewMode"
          @navigate-folder="navigateToFolder"
          @update:searchQuery="searchQuery = $event"
          @update:viewMode="viewMode = $event"
          @new-folder="showNewFolderDialog = true"
          @new-project="showNewProjectDialog = true"
        />

        <!-- Projects Container -->
        <div class="border border-border/50 rounded-md bg-muted/20 overflow-hidden flex flex-col">
          <div v-if="viewMode === 'grid'" class="overflow-y-auto flex-1 p-3">
            <GridView 
              :subfolders="currentSubfolders"
              :projects="filteredProjects"
              :allFolders="allFolders"
              :currentFolderId="currentFolderId"
              :folderColors="folderColors"
              @navigate-folder="navigateToFolder"
              @open-project="openProject"
              @new-project="showNewProjectDialog = true"
              @rename-project="confirmRename($event.id, $event.name)"
              @delete-project="confirmDelete($event.id, $event.name)"
              @rename-folder="confirmRenameFolder($event.id, $event.name)"
              @delete-folder="confirmDeleteFolder($event.id, $event.name)"
              @move-project="handleMoveProject($event.projectId, $event.folderId)"
              @change-folder-color="handleFolderColorChange($event.folderId, $event.color)"
              @drop-on-folder="handleDropOnFolder($event.event, $event.folderId)"
              @drag-start="handleDragStart($event.event, $event.projectId)"
            />
          </div>
          <div v-else class="overflow-y-auto flex-1">
            <ListView 
              :subfolders="currentSubfolders"
              :projects="filteredProjects"
              :allFolders="allFolders"
              @navigate-folder="navigateToFolder"
              @open-project="openProject"
              @rename-project="confirmRename($event.id, $event.name)"
              @delete-project="confirmDelete($event.id, $event.name)"
              @rename-folder="confirmRenameFolder($event.id, $event.name)"
              @delete-folder="confirmDeleteFolder($event.id, $event.name)"
              @drop-on-folder="handleDropOnFolder($event.event, $event.folderId)"
              @drag-start="handleDragStart($event.event, $event.projectId)"
            />
          </div>
          
          <EmptyState 
            v-if="filteredProjects.length === 0 && currentSubfolders.length === 0"
            :currentFolderId="currentFolderId"
            @new-folder="showNewFolderDialog = true"
            @new-project="showNewProjectDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- New Project Modal -->
    <Dialog v-model:open="showNewProjectDialog">
      <DialogContent class="flex max-h-[90vh] flex-col overflow-hidden border-border/50 bg-background max-w-4xl">
        <DialogHeader class="flex-shrink-0 space-y-1">
          <DialogTitle class="text-2xl text-foreground font-light flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            New Project
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Create a new design project with your custom settings
          </DialogDescription>
        </DialogHeader>

        <Separator class="my-2" />

        <div class="flex-1 space-y-3 overflow-y-auto pr-4">
          <!-- Project Name -->
          <div class="space-y-1.5 border border-border/50 rounded-md p-2.5 bg-muted/20">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Type class="h-2.5 w-2.5" />
              Project Name
            </Label>
            <Input
              placeholder="My Project"
              v-model="newProjectName"
              class="h-7 text-xs border-border/50"
            />
          </div>

          <!-- Description -->
          <div class="space-y-1.5 border border-border/50 rounded-md p-2.5 bg-muted/20">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <FileText class="h-2.5 w-2.5" />
              Description
            </Label>
            <Textarea
              placeholder="Add a description..."
              v-model="newProjectDescription"
              :rows="3"
              class="resize-none text-xs border-border/50"
            />
          </div>

          <!-- Import JSON -->
          <div class="space-y-1.5 border border-border/50 rounded-md p-2.5 bg-muted/20">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Upload class="h-2.5 w-2.5" />
              Import JSON (Optional)
            </Label>
            <Input
              type="file"
              accept=".json"
              @change="handleFileImport"
              class="h-7 text-xs border-border/50 file:text-xs file:mr-2"
            />
          </div>

          <!-- Canvas Size Selection -->
          <div class="space-y-1.5 border border-border/50 rounded-md p-2.5 bg-muted/20">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Palette class="h-2.5 w-2.5" />
              Canvas Size
            </Label>
            <CanvasSizeSelector
              :selected-size="newProjectCanvasSize"
              @size-select="handleSizeSelect"
            />
          </div>
        </div>

        <Separator class="my-2" />

        <DialogFooter class="flex-shrink-0 flex gap-2 justify-end">
          <Button
            variant="outline"
            @click="showNewProjectDialog = false"
            class="h-7 text-xs border-border/50"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            @click="handleCreateProject"
            :disabled="!newProjectName.trim() || isLoading"
            class="bg-red-600 hover:bg-red-700 text-white hover:text-white border-red-600 hover:border-red-700 h-7 text-xs font-medium"
          >
            {{ isLoading ? "Creating..." : "Create" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Rename Project Dialog -->
    <Dialog v-model:open="showRenameDialog">
      <DialogContent class="border-border/50 bg-background max-w-md">
        <DialogHeader class="space-y-1">
          <DialogTitle class="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Rename Project
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Enter a new name for your project
          </DialogDescription>
        </DialogHeader>

        <Separator class="my-2" />

        <div class="space-y-2">
          <Label class="text-[10px] font-bold uppercase tracking-wide">Project Name</Label>
          <Input
            v-model="renameProjectName"
            placeholder="Enter project name"
            class="h-8 text-xs border-border/50"
            @keyup.enter="handleRename"
          />
        </div>

        <Separator class="my-2" />

        <DialogFooter class="flex gap-2 justify-end">
          <Button
            variant="outline"
            @click="showRenameDialog = false"
            class="h-7 text-xs border-border/50"
          >
            Cancel
          </Button>
          <Button
            @click="handleRename"
            :disabled="!renameProjectName.trim()"
            class="bg-red-600 hover:bg-red-700 text-white h-7 text-xs font-medium"
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="border-border/50 bg-background max-w-md">
        <DialogHeader>
          <DialogTitle class="text-2xl text-foreground font-light flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Delete Project
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Are you sure you want to delete <strong>{{ deleteProjectName }}</strong>? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex gap-2 justify-end">
          <Button
            variant="outline"
            @click="showDeleteDialog = false"
            class="h-7 text-xs border-border/50"
          >
            Cancel
          </Button>
          <Button 
            @click="handleDelete"
            class="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-7 text-xs"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- New Folder Dialog -->
    <Dialog v-model:open="showNewFolderDialog">
      <DialogContent class="border-border/50 bg-background max-w-md">
        <DialogHeader class="space-y-1">
          <DialogTitle class="text-2xl text-foreground font-light flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            New Folder
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Create a new folder to organize your projects
          </DialogDescription>
        </DialogHeader>

        <Separator class="my-2" />

        <div class="space-y-3">
          <div class="space-y-1.5">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Folder Name</Label>
            <Input
              v-model="newFolderName"
              placeholder="Enter folder name"
              class="h-8 text-xs border-border/50"
              @keyup.enter="handleCreateFolder"
            />
          </div>
          <div class="space-y-1.5">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Color (Optional)</Label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="color in folderColors"
                :key="color.value"
                @click="newFolderColor = color.value"
                class="w-6 h-6 rounded-full border-2 transition-all"
                :class="newFolderColor === color.value ? 'border-foreground scale-110' : 'border-transparent'"
                :style="{ backgroundColor: color.value }"
                :title="color.name"
              />
            </div>
          </div>
        </div>

        <Separator class="my-2" />

        <DialogFooter class="flex gap-2 justify-end">
          <Button
            variant="outline"
            @click="showNewFolderDialog = false"
            class="h-7 text-xs border-border/50"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            @click="handleCreateFolder"
            :disabled="!newFolderName.trim()"
            class="bg-red-600 hover:bg-red-700 text-white hover:text-white border-red-600 hover:border-red-700 h-7 text-xs font-medium"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Onboarding Tour -->
    <OnboardingTour
      v-if="showProjectsTour"
      tour-key="projects"
      :steps="projectsTourSteps"
      @complete="onTourComplete"
      @skip="onTourSkip"
    />

    <!-- Rename Folder Dialog -->
    <Dialog v-model:open="showRenameFolderDialog">
      <DialogContent class="border-border/50 bg-background max-w-md">
        <DialogHeader class="space-y-1">
          <DialogTitle class="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Rename Folder
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Enter a new name for your folder
          </DialogDescription>
        </DialogHeader>

        <Separator class="my-2" />

        <div class="space-y-2">
          <Label class="text-[10px] font-bold uppercase tracking-wide">Folder Name</Label>
          <Input
            v-model="renameFolderName"
            placeholder="Enter folder name"
            class="h-8 text-xs border-border/50"
            @keyup.enter="handleRenameFolder"
          />
        </div>

        <Separator class="my-2" />

        <DialogFooter class="flex gap-2 justify-end">
          <Button
            variant="outline"
            @click="showRenameFolderDialog = false"
            class="h-7 text-xs border-border/50"
          >
            Cancel
          </Button>
          <Button
            @click="handleRenameFolder"
            :disabled="!renameFolderName.trim()"
            class="bg-red-600 hover:bg-red-700 text-white h-7 text-xs font-medium"
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Folder Confirmation Dialog -->
    <Dialog v-model:open="showDeleteFolderDialog">
      <DialogContent class="border-border/50 bg-background max-w-md">
        <DialogHeader>
          <DialogTitle class="text-2xl text-foreground font-light flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Delete Folder
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            Are you sure you want to delete <strong>{{ deleteFolderName }}</strong>?
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-2 py-2">
          <Label class="text-xs text-muted-foreground">What should happen to the contents?</Label>
          <div class="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              @click="deleteFolderContents = false"
              :class="!deleteFolderContents ? 'border-primary bg-primary/10' : ''"
              class="flex-1 h-8 text-xs"
            >
              Move to Root
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              @click="deleteFolderContents = true"
              :class="deleteFolderContents ? 'border-destructive bg-destructive/10' : ''"
              class="flex-1 h-8 text-xs"
            >
              Delete All
            </Button>
          </div>
        </div>

        <DialogFooter class="flex gap-2 justify-end">
          <Button
            variant="outline"
            @click="showDeleteFolderDialog = false"
            class="h-7 text-xs border-border/50"
          >
            Cancel
          </Button>
          <Button 
            @click="handleDeleteFolder"
            class="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-7 text-xs"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import ElectronTitlebar from '@/components/ElectronTitlebar.vue'
import CanvasSizeSelector from '@/components/CanvasSizeSelector.vue'
import HeroBanner from './HeroBanner.vue'
import ProjectsToolbar from './ProjectsToolbar.vue'
import GridView from './GridView.vue'
import ListView from './ListView.vue'
import EmptyState from './EmptyState.vue'
import useProjects, { SavedProject, ProjectFolder } from '@/hooks/useProjects'
import { useMainStore, useTemplatesStore, useOnboardingStore } from '@/store'
import { toast } from '@/components/ui/toast/use-toast'
import OnboardingTour from '@/components/OnboardingTour.vue'
import axios from 'axios'

const CF_WORKERS_API = import.meta.env.VITE_CF_WORKERS_API || 'https://stock-image-api.your-domain.workers.dev'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// icons
import { Type, FileText, Upload, Palette } from 'lucide-vue-next'

const router = useRouter()
const mainStore = useMainStore()
const {
  getSavedProjects, 
  loadProject, 
  deleteProject, 
  renameProject,
  moveProjectToFolder,
  getProjectsInFolder,
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  getSubfolders,
  getFolderPath,
  updateFolderColor,
  invalidateProjectsCache
} = useProjects()
const templatesStore = useTemplatesStore()
const onboardingStore = useOnboardingStore()

// Onboarding tour state
const showProjectsTour = ref(false)
const projectsTourSteps = [
  {
    popover: {
      title: 'Welcome to Euclid!',
      description: 'This is where all your design projects live. Let\'s take a quick tour to get you started creating amazing designs.',
      side: 'bottom',
      align: 'center',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Let\'s go!',
    },
  },
  {
    element: '[data-onboarding="new-project-btn"]',
    popover: {
      title: 'Create a New Project',
      description: 'Click the "New" button here to create your first design project. You can choose from various canvas sizes and templates.',
      side: 'bottom',
      align: 'end',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Got it!',
    },
  },
  {
    element: '[data-onboarding="projects-hero"]',
    popover: {
      title: 'Your Project Hub',
      description: 'All your saved projects will appear here in a clean grid. You can organize them into folders, search, and switch between grid and list views.',
      side: 'bottom',
      align: 'start',
      popoverClass: 'euclid-onboarding-popover',
      showButtons: ['next', 'close'],
      doneBtnText: 'Finish',
      nextBtnText: 'Create a Project!',
    },
    advanceOnClick: true,
  },
]

function onTourComplete() {
  showProjectsTour.value = false
}

function onTourSkip() {
  showProjectsTour.value = false
}

const isElectronMode = computed(() => {
  return import.meta.env.MODE === 'electron' || window.electron !== undefined
})

// Folder colors
const folderColors = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
]

// Current folder navigation
const currentFolderId = ref<string | null>(null)

const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const showNewProjectDialog = ref(false)
const newProjectName = ref('')
const newProjectDescription = ref('')
const importedJson = ref<any>(null)
const isLoading = ref(false)
const newProjectCanvasSize = ref({
  id: 'instagram-post',
  name: 'Instagram Post',
  description: '1080 × 1080 px',
  width: 1080,
  height: 1080,
  category: 'social' as const,
  aspectRatio: '1:1'
})

// Rename dialog
const showRenameDialog = ref(false)
const renameProjectId = ref('')
const renameProjectName = ref('')

// Delete confirmation
const showDeleteDialog = ref(false)
const deleteProjectId = ref('')
const deleteProjectName = ref('')

// Folder dialogs
const showNewFolderDialog = ref(false)
const newFolderName = ref('')
const newFolderColor = ref('')

const showRenameFolderDialog = ref(false)
const renameFolderId = ref('')
const renameFolderName = ref('')

const showDeleteFolderDialog = ref(false)
const deleteFolderId = ref('')
const deleteFolderName = ref('')
const deleteFolderContents = ref(false)

// Load saved projects and folders
const projects = ref<SavedProject[]>([])
const allFolders = ref<ProjectFolder[]>([])

const loadProjects = () => {
  projects.value = getSavedProjects()
  allFolders.value = getFolders()
}

// Get current folder's subfolders
const currentSubfolders = computed(() => {
  return allFolders.value.filter(f => f.parentId === currentFolderId.value)
})

// Get folder path for breadcrumb
const folderPath = computed(() => {
  if (!currentFolderId.value) return []
  const path: ProjectFolder[] = []
  let currentId: string | null = currentFolderId.value
  while (currentId) {
    const folder = allFolders.value.find(f => f.id === currentId)
    if (folder) {
      path.unshift(folder)
      currentId = folder.parentId
    } else {
      break
    }
  }
  return path
})

// Filter projects in current folder
const filteredProjects = computed(() => {
  // First filter by current folder
  let folderProjects = projects.value.filter(p => (p.folderId || null) === currentFolderId.value)
  
  // Then filter by search query
  if (searchQuery.value) {
    folderProjects = folderProjects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return folderProjects
})

// Get item count for a folder (projects + subfolders)
const getFolderItemCount = (folderId: string): number => {
  const projectCount = projects.value.filter(p => p.folderId === folderId).length
  const subfolderCount = allFolders.value.filter(f => f.parentId === folderId).length
  return projectCount + subfolderCount
}

// Navigate to folder
const navigateToFolder = (folderId: string | null) => {
  currentFolderId.value = folderId
}

const formatDate = (timestamp: number) => {
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

const openProject = async (id: string) => {
  // Simply navigate to the editor with the project ID
  // The editor will handle loading the project once the canvas is ready
  router.push('/editor?project=' + id)
}

const handleSizeSelect = (size: any) => {
  newProjectCanvasSize.value = size
}

const handleFileImport = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target?.result as string)
      
      // Process via server to fix CORS issues
      toast({ title: 'Processing', description: 'Converting resources to Base64...' })
      try {
        const response = await axios.post(`${CF_WORKERS_API}/api/utils/import-json`, json)
        importedJson.value = response.data
        toast({ title: 'Success', description: 'JSON file imported and processed successfully' })
      } catch (serverError) {
        console.error('Server processing failed, falling back to local', serverError)
        importedJson.value = json
        
        // Fallback: Ensure crossOrigin is set to anonymous for all images in local JSON
        const ensureCrossOrigin = (obj: any) => {
          if (!obj || typeof obj !== 'object') return
          if (Array.isArray(obj)) {
            obj.forEach(ensureCrossOrigin)
            return
          }
          // Handle both lowercase 'image' and capitalized 'Image'
          if ((obj.type === 'image' || obj.type === 'Image') && obj.src && typeof obj.src === 'string' && obj.src.startsWith('http')) {
            obj.crossOrigin = 'anonymous'
          }
          Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object') ensureCrossOrigin(obj[key])
          })
        }
        ensureCrossOrigin(importedJson.value)
        
        toast({ title: 'Warning', description: 'Server processing failed. Some images might not load due to CORS.', variant: 'destructive' })
      }
      
      // Auto-fill name if available
      if (json.name && !newProjectName.value) {
        newProjectName.value = json.name
      }
    } catch (error) {
      console.error('Invalid JSON', error)
      toast({ title: 'Error', description: 'Invalid JSON file', variant: 'destructive' })
      importedJson.value = null
    }
  }
  reader.readAsText(file)
}

const handleCreateProject = async () => {
  if (!newProjectName.value.trim()) return
  
  isLoading.value = true
  
  try {
    // Create a new blank template with the selected size
    let template: any = {
      id: 'blank_' + Date.now(),
      version: '6.7.1',
      background: 'rgba(255,255,255,0)',
      objects: [
        {
          id: 'WorkSpaceDrawType',
          type: 'Rect',
          name: 'rect',
          left: 0,
          top: 0,
          width: newProjectCanvasSize.value.width,
          height: newProjectCanvasSize.value.height,
          fill: '#ffffff',
          selectable: false,
          evented: false,
          fillType: 0,
          color: '#ffffff',
          padding: 0,
          lockMovementX: false,
          lockMovementY: false,
          objectCaching: true,
          transparentCorners: false,
          hasBorders: true,
          globalCompositeOperation: 'source-over',
        }
      ],
      workSpace: {
        fillType: 0,
        left: 0,
        top: 0,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        fill: '#ffffff',
        color: '#ffffff',
        backgroundColor: '#ffffff'
      },
      zoom: 1,
      width: newProjectCanvasSize.value.width,
      height: newProjectCanvasSize.value.height,
      clip: 0,
      safe: 0,
      ruler: false
    }

    if (importedJson.value) {
      template = {
        ...importedJson.value,
        id: 'imported_' + Date.now(),
        // Ensure critical fields are present if missing in JSON
        width: importedJson.value.width || newProjectCanvasSize.value.width,
        height: importedJson.value.height || newProjectCanvasSize.value.height,
      }
    }
    
    // Set this as the current template
    templatesStore.replaceProjectTemplates([template])
    
    showNewProjectDialog.value = false
    isLoading.value = false
    const projectName = newProjectName.value
    newProjectName.value = ''
    newProjectDescription.value = ''
    importedJson.value = null
    
    router.push('/editor?name=' + encodeURIComponent(projectName))
  } catch (error) {
    console.error('Error creating project:', error)
    toast({
      title: 'Error',
      description: 'Failed to create project. Please try again.',
      variant: 'destructive'
    })
    isLoading.value = false
  }
}

const confirmRename = (projectId: string, currentName: string) => {
  renameProjectId.value = projectId
  renameProjectName.value = currentName
  showRenameDialog.value = true
}

const handleRename = () => {
  if (!renameProjectName.value.trim()) return
  
  const success = renameProject(renameProjectId.value, renameProjectName.value)
  if (success) {
    toast({
      title: 'Project renamed',
      description: 'Project name has been updated.'
    })
    loadProjects()
  } else {
    toast({
      title: 'Error',
      description: 'Failed to rename project.',
      variant: 'destructive'
    })
  }
  
  showRenameDialog.value = false
  renameProjectId.value = ''
  renameProjectName.value = ''
}

const confirmDelete = (projectId: string, projectName: string) => {
  deleteProjectId.value = projectId
  deleteProjectName.value = projectName
  showDeleteDialog.value = true
}

const handleDelete = () => {
  const success = deleteProject(deleteProjectId.value)
  if (success) {
    toast({
      title: 'Project deleted',
      description: 'The project has been permanently deleted.'
    })
    loadProjects()
  } else {
    toast({
      title: 'Error',
      description: 'Failed to delete project.',
      variant: 'destructive'
    })
  }
  
  showDeleteDialog.value = false
  deleteProjectId.value = ''
  deleteProjectName.value = ''
}

// ==================== FOLDER HANDLERS ====================

const handleCreateFolder = () => {
  if (!newFolderName.value.trim()) return
  
  const folder = createFolder(newFolderName.value, currentFolderId.value, newFolderColor.value || undefined)
  if (folder) {
    toast({
      title: 'Folder created',
      description: `Folder "${folder.name}" has been created.`
    })
    loadProjects()
  } else {
    toast({
      title: 'Error',
      description: 'Failed to create folder.',
      variant: 'destructive'
    })
  }
  
  showNewFolderDialog.value = false
  newFolderName.value = ''
  newFolderColor.value = ''
}

const confirmRenameFolder = (folderId: string, currentName: string) => {
  renameFolderId.value = folderId
  renameFolderName.value = currentName
  showRenameFolderDialog.value = true
}

const handleRenameFolder = () => {
  if (!renameFolderName.value.trim()) return
  
  const success = renameFolder(renameFolderId.value, renameFolderName.value)
  if (success) {
    toast({
      title: 'Folder renamed',
      description: 'Folder name has been updated.'
    })
    loadProjects()
  } else {
    toast({
      title: 'Error',
      description: 'Failed to rename folder.',
      variant: 'destructive'
    })
  }
  
  showRenameFolderDialog.value = false
  renameFolderId.value = ''
  renameFolderName.value = ''
}

const confirmDeleteFolder = (folderId: string, folderName: string) => {
  deleteFolderId.value = folderId
  deleteFolderName.value = folderName
  deleteFolderContents.value = false
  showDeleteFolderDialog.value = true
}

const handleDeleteFolder = () => {
  const success = deleteFolder(deleteFolderId.value, deleteFolderContents.value)
  if (success) {
    toast({
      title: 'Folder deleted',
      description: deleteFolderContents.value 
        ? 'The folder and its contents have been deleted.' 
        : 'The folder has been deleted and its contents moved to root.'
    })
    // If we're inside the deleted folder, go back to root
    if (currentFolderId.value === deleteFolderId.value) {
      currentFolderId.value = null
    }
    loadProjects()
  } else {
    toast({
      title: 'Error',
      description: 'Failed to delete folder.',
      variant: 'destructive'
    })
  }
  
  showDeleteFolderDialog.value = false
  deleteFolderId.value = ''
  deleteFolderName.value = ''
}

const handleFolderColorChange = (folderId: string, color: string) => {
  const success = updateFolderColor(folderId, color)
  if (success) {
    loadProjects()
  }
}

const handleMoveProject = (projectId: string, folderId: string | null) => {
  const success = moveProjectToFolder(projectId, folderId)
  if (success) {
    toast({
      title: 'Project moved',
      description: folderId ? 'Project has been moved to the folder.' : 'Project has been moved to root.'
    })
    loadProjects()
  } else {
    toast({
      title: 'Error',
      description: 'Failed to move project.',
      variant: 'destructive'
    })
  }
}

// Drag and drop handlers
const handleDragStart = (event: DragEvent, projectId: string) => {
  event.dataTransfer?.setData('projectId', projectId)
}

const handleDropOnFolder = (event: DragEvent, folderId: string) => {
  const projectId = event.dataTransfer?.getData('projectId')
  if (projectId) {
    handleMoveProject(projectId, folderId)
  }
}

onMounted(() => {
  // Invalidate the module-level project cache so we read fresh data from localStorage.
  // This prevents stale data from appearing when navigating back from the editor.
  // Also ensures the "projects got copied" scenario doesn't happen.
  invalidateProjectsCache()
  loadProjects()
  // If the user navigated here from the editor, dismiss the "Saving project..." overlay
  // now that all data is loaded and the grid is about to render
  mainStore.setSavingProject(false)

  // Start onboarding tour if not yet completed (or manually re-triggered)
  if (!onboardingStore.hasCompletedOnboarding) {
    if (!onboardingStore.isOnboardingActive) {
      onboardingStore.startOnboarding()
    }
    nextTick(() => {
      showProjectsTour.value = true
    })
  }
})

// Watch for tour re-trigger via Help → Show Tour (when already on this page)
watch(
  () => onboardingStore.isOnboardingActive,
  (active) => {
    if (active && !showProjectsTour.value && !onboardingStore.hasCompletedOnboarding) {
      nextTick(() => {
        showProjectsTour.value = true
      })
    }
  },
)
</script>
