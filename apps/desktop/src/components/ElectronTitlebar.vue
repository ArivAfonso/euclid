<template>
  <div 
    class="electron-titlebar"
    :class="{ 'is-maximized': isMaximized, 'dark-mode': isDarkMode }"
    style="-webkit-app-region: drag"
  >
    <!-- Documentation Modal -->
    <DocumentationModal v-model:open="showDocModal" />

    <!-- System Info Modal -->
    <SystemInfoModal v-model:open="showSystemInfoModal" />

    <!-- Font Manager Modal -->
    <CustomFontManager v-model:open="showFontManager" />

    <!-- Settings Modal -->
    <SettingsModal v-model:open="showSettingsModal" />

    <!-- Left: Menu Bar -->
    <div class="titlebar-left">
      <div class="titlebar-menu" style="-webkit-app-region: no-drag">
        <!-- File Menu -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="menu-button">File</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-44">
            <template v-if="isEditor">
              <DropdownMenuItem @click="handleSaveAs" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Save As...</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+Shift+S</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleAutoSave" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Auto Save</span>
                <span class="ml-auto text-[10px] text-muted-foreground">{{ autoSaveEnabled ? 'On' : 'Off' }}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="my-0.5" />
              <DropdownMenuItem @click="handleImportPowerPoint" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Import PowerPoint...</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="my-0.5" />
              <DropdownMenuItem @click="handleExport" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Export</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+E</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handlePrint" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Print</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+P</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="my-0.5" />
            </template>
            <template v-else>
              <DropdownMenuItem @click="handleNewFile" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>New Project</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+N</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="my-0.5" />
            </template>
            <DropdownMenuItem @click="openSettings" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Settings</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+,</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="closeWindow" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Exit</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Alt+F4</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Edit Menu (editor only) -->
        <DropdownMenu v-if="isEditor">
          <DropdownMenuTrigger as-child>
            <button class="menu-button">Edit</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-44">
            <DropdownMenuItem @click="handleUndo" :disabled="!canUndo" class="text-xs h-6 cursor-pointer my-1" :class="{ 'opacity-40 cursor-not-allowed': !canUndo, 'text-muted-foreground': true }">
              <span>Undo</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+Z</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleRedo" :disabled="!canRedo" class="text-xs h-6 cursor-pointer my-1" :class="{ 'opacity-40 cursor-not-allowed': !canRedo, 'text-muted-foreground': true }">
              <span>Redo</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+Y</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="handleCut" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Cut</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+X</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleCopy" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Copy</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+C</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handlePaste" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Paste</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+V</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleDuplicate" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Duplicate</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+D</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="handleDelete" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Delete</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Del</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="handleLock" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Lock</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+L</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleUnlock" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Unlock</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="handleGroup" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Group</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+G</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleUngroup" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Ungroup</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+Shift+G</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- View Menu -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="menu-button">View</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-44">
            <DropdownMenuItem @click="toggleFullscreen" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Toggle Fullscreen</span>
              <span class="ml-auto text-[10px] text-muted-foreground">F11</span>
            </DropdownMenuItem>
            <DropdownMenuItem v-if="isEditor" @click="handlePresentationMode" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Presentation Mode</span>
              <span class="ml-auto text-[10px] text-muted-foreground">F5</span>
            </DropdownMenuItem>
            <template v-if="isEditor">
              <DropdownMenuSeparator class="my-0.5" />
              <DropdownMenuItem @click="handleZoomIn" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Zoom In</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl++</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleZoomOut" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Zoom Out</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+-</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleResetZoom" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Reset Zoom</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+0</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleFitToScreen" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Fit to Screen</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+1</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="my-0.5" />
              <DropdownMenuItem @click="handleToggleRulers" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>{{ showRulers ? 'Hide Rulers' : 'Show Rulers' }}</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+R</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleToggleGrid" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>{{ showGrid ? 'Hide Grid' : 'Show Grid' }}</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+'</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleToggleGuides" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>{{ showGuides ? 'Hide Guides' : 'Show Guides' }}</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+;</span>
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleToggleSnap" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>{{ snapToGrid ? 'Disable Snap' : 'Snap to Grid' }}</span>
                <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+Shift+;</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator class="my-0.5" />
              <DropdownMenuItem @click="handleRefreshView" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
                <span>Refresh View</span>
                <span class="ml-auto text-[10px] text-muted-foreground">F5</span>
              </DropdownMenuItem>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Tools Menu (editor only) -->
        <DropdownMenu v-if="isEditor">
          <DropdownMenuTrigger as-child>
            <button class="menu-button">Tools</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-44">
            <DropdownMenuItem @click="handleSelectTool('editor')" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Selection Tool</span>
              <span class="ml-auto text-[10px] text-muted-foreground">V</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleSelectTool('text')" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Text Tool</span>
              <span class="ml-auto text-[10px] text-muted-foreground">T</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="openFontManager" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Manage Fonts</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="handleCreateShape('rect')" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Rectangle Tool</span>
              <span class="ml-auto text-[10px] text-muted-foreground">M</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleCreateShape('ellipse')" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Ellipse Tool</span>
              <span class="ml-auto text-[10px] text-muted-foreground">L</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleCreateShape('line')" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Line Tool</span>
              <span class="ml-auto text-[10px] text-muted-foreground">\</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleCreateShape('triangle')" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Triangle Tool</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="handleOpenAlignPanel" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Align Panel</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Shift+F7</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Window Menu -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="menu-button">Window</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-44">
            <DropdownMenuItem @click="minimizeWindow" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Minimize</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+M</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="toggleMaximize" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>{{ isMaximized ? 'Restore' : 'Maximize' }}</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+Shift+M</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="closeWindow" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Close Window</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+W</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Help Menu -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="menu-button">Help</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-44">
            <DropdownMenuItem @click="showDocumentation" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Documentation</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleStartTour" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Show Tour</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Get Started</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleKeyboardShortcuts" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Keyboard Shortcuts</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+Shift+?</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="handleReportBug" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Report Bug</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="openDevTools" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>Developer Tools</span>
              <span class="ml-auto text-[10px] text-muted-foreground">Ctrl+Shift+I</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-0.5" />
            <DropdownMenuItem @click="handleAbout" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>About Euclid</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="showSystemInfo" class="text-xs h-6 cursor-pointer my-1 text-muted-foreground">
              <span>System Info</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Center: Title -->
    <div class="titlebar-center">
      <template v-if="currentProjectName">
        <span class="titlebar-project">{{ currentProjectName }}</span>
      </template>
      <span class="titlebar-separator">·</span>
      <span class="titlebar-title">{{ title }}</span>
    </div>

    <!-- Right: Window Controls -->
    <div class="titlebar-right" style="-webkit-app-region: no-drag">
      <ThemeToggle />
      
      <button class="window-control" @click="minimizeWindow" title="Minimize">
        <MinusIcon class="h-4 w-4" />
      </button>
      
      <button class="window-control" @click="toggleMaximize" title="Maximize">
        <component :is="isMaximized ? MinimizeIcon : MaximizeIcon" class="h-3.5 w-3.5" />
      </button>
      
      <button class="window-control close-button" @click="closeWindow" title="Close">
        <XIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useProjects from '@/hooks/useProjects'
import { useMainStore, useTemplatesStore, useSnapshotStore, useOnboardingStore } from '@/store'
import { storeToRefs } from 'pinia'
import ThemeToggle from './ThemeToggle.vue'
import DocumentationModal from './DocumentationModal.vue'
import SystemInfoModal from './SystemInfoModal.vue'
import CustomFontManager from './CustomFontManager.vue'
import SettingsModal from './SettingsModal.vue'
import { importFromPPTX } from '@/utils/pptImport'
import { toast } from '@/components/ui/toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  X as XIcon,
  Minimize2 as MinimizeIcon,
  Maximize2 as MaximizeIcon,
  Minus as MinusIcon,
} from 'lucide-vue-next'
import useCanvas from '@/views/Canvas/useCanvas'
import useCanvasScale from '@/hooks/useCanvasScale'
import useHandleElement from '@/hooks/useHandleElement'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { ElementNames } from '@/types/elements'
import { FabricObject, Rect, Ellipse, Line, Triangle } from 'fabric'
import { nanoid } from 'nanoid'
import { WorkSpaceCommonType } from '@/configs/canvas'

const props = defineProps<{
  title?: string
  /** Which page the titlebar is rendered on — controls which menus/items are shown */
  context?: 'editor' | 'projects' | 'home'
}>()

const isEditor = props.context === 'editor'

const router = useRouter()
const mainStore = useMainStore()
const onboardingStore = useOnboardingStore()
const snapshotStore = useSnapshotStore()
const { isDarkMode } = storeToRefs(mainStore)
const { canvasObject } = storeToRefs(mainStore)
const { canUndo, canRedo } = storeToRefs(snapshotStore)

const isMaximized = ref(false)
const showDocModal = ref(false)
const showSystemInfoModal = ref(false)
const showFontManager = ref(false)
const showSettingsModal = ref(false)

// View toggle states (mirrors SettingsModal's localStorage keys)
const autoSaveEnabled = ref(localStorage.getItem('autoSave') === 'true')
const showGrid = ref(localStorage.getItem('showGrid') !== 'false')
const showRulers = ref(localStorage.getItem('showRulers') !== 'false')
const showGuides = ref(localStorage.getItem('showGuides') !== 'false')
const snapToGrid = ref(localStorage.getItem('snapToGrid') === 'true')

// Lazy-initialized composables — only call when canvas is active
let _handleElement: ReturnType<typeof useHandleElement> | null = null
let _historySnapshot: ReturnType<typeof useHistorySnapshot> | null = null
let _canvasScale: ReturnType<typeof useCanvasScale> | null = null
let _projects: ReturnType<typeof useProjects> | null = null

const getHandleElement = () => {
  if (!_handleElement) _handleElement = useHandleElement()
  return _handleElement
}
const getHistorySnapshot = () => {
  if (!_historySnapshot) _historySnapshot = useHistorySnapshot()
  return _historySnapshot
}
const getCanvasScale = () => {
  if (!_canvasScale) _canvasScale = useCanvasScale()
  return _canvasScale
}
const getProjects = () => {
  if (!_projects) _projects = useProjects()
  return _projects
}

// Current project name — derived from the route (?project=id) so the
// titlebar shows which project is being edited alongside the app name.
const currentProjectName = computed(() => {
  const projectId = router.currentRoute.value.query.project
  if (typeof projectId !== 'string') return ''
  const project = getProjects().getProject(projectId)
  return project?.name || ''
})

// ─── Helpers ────────────────────────────────────────────────

const isElectron = () => window.electron !== undefined

const hasCanvas = (): boolean => {
  const [canvas] = useCanvas()
  return !!canvas
}

// ─── Window controls ────────────────────────────────────────

const minimizeWindow = () => {
  if (isElectron()) window.postMessage({ type: 'window-minimize' }, '*')
}

const toggleMaximize = () => {
  if (isElectron()) {
    window.postMessage({ type: 'window-maximize' }, '*')
    isMaximized.value = !isMaximized.value
  }
}

const closeWindow = () => {
  if (!isElectron()) return
  const forceClose = setTimeout(() => {
    window.postMessage({ type: 'window-close' }, '*')
  }, 3000)

  if ((window as any).__euclidSave) {
    mainStore.setSavingProject(true)
    ;(window as any).__euclidSave().finally(() => {
      clearTimeout(forceClose)
      mainStore.setSavingProject(false)
      window.postMessage({ type: 'window-close' }, '*')
    })
  } else {
    clearTimeout(forceClose)
    window.postMessage({ type: 'window-close' }, '*')
  }
}

const toggleFullscreen = () => {
  if (isElectron()) window.postMessage({ type: 'window-fullscreen' }, '*')
}

const openDevTools = () => {
  if (isElectron()) window.postMessage({ type: 'window-devtools' }, '*')
}

// ─── File menu ──────────────────────────────────────────────

const handleNewFile = async () => {
  const router = (window as any).__vueRouter
  if (router) {
    if ((window as any).__euclidSave) {
      mainStore.setSavingProject(true)
      try {
        await (window as any).__euclidSave()
      } finally {
        mainStore.setSavingProject(false)
      }
    }
    await router.push('/projects')
  }
}

const handleSave = async () => {
  if ((window as any).__euclidSave) {
    try {
      await (window as any).__euclidSave()
      toast({ title: 'Saved', description: 'Project saved successfully.' })
    } catch {
      toast({ title: 'Save Failed', description: 'Could not save the project.', variant: 'destructive' })
    }
  } else {
    toast({ title: 'Nothing to Save', description: 'Open a project first to save.' })
  }
}

const handleSaveAs = () => {
  if (!hasCanvas()) {
    toast({ title: 'No Canvas', description: 'Open a project first.', variant: 'destructive' })
    return
  }
  const [canvas] = useCanvas()
  if (!canvas) return
  const jsonData = canvas.toJSON()
  const jsonString = JSON.stringify(jsonData, null, 2)
  if (window.electron?.fs?.saveJsonFileDialog) {
    window.electron.fs.saveJsonFileDialog('euclid-project.json', jsonString)
  } else {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'euclid-project.json'
    a.click()
    URL.revokeObjectURL(url)
  }
}

const handleAutoSave = () => {
  autoSaveEnabled.value = !autoSaveEnabled.value
  localStorage.setItem('autoSave', String(autoSaveEnabled.value))
  toast({
    title: autoSaveEnabled.value ? 'Auto Save Enabled' : 'Auto Save Disabled',
    description: autoSaveEnabled.value ? 'Changes will be saved automatically.' : 'Manual save only.',
  })
}

const handleImportPowerPoint = async () => {
  if (window.electron?.fs?.openPptxDialog) {
    try {
      const result = await window.electron.fs.openPptxDialog()
      if (!result.success || !result.data) return

      const binaryStr = atob(result.data)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      toast({ title: 'Importing', description: 'Converting PowerPoint file...' })

      const templates = await importFromPPTX(bytes.buffer)

      if (!templates || templates.length === 0) {
        toast({ title: 'Error', description: 'No slides could be imported.', variant: 'destructive' })
        return
      }

      const templatesStore = useTemplatesStore()
      await templatesStore.changeTemplate(templates)

      toast({
        title: 'Success',
        description: `Imported ${templates.length} slide(s) from PowerPoint.`,
      })
    } catch (err) {
      console.error('PPT import failed:', err)
      toast({ title: 'Import Failed', description: String(err), variant: 'destructive' })
    }
  } else {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pptx'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        toast({ title: 'Importing', description: 'Converting PowerPoint file...' })

        const buffer = await file.arrayBuffer()
        const templates = await importFromPPTX(buffer)

        if (!templates || templates.length === 0) {
          toast({ title: 'Error', description: 'No slides could be imported.', variant: 'destructive' })
          return
        }

        const templatesStore = useTemplatesStore()
        await templatesStore.changeTemplate(templates)

        toast({
          title: 'Success',
          description: `Imported ${templates.length} slide(s) from PowerPoint.`,
        })
      } catch (err) {
        console.error('PPT import failed:', err)
        toast({ title: 'Import Failed', description: String(err), variant: 'destructive' })
      }
    }
    input.click()
  }
}

const handleExport = () => {
  if (!hasCanvas()) {
    toast({ title: 'No Canvas', description: 'Open a project first.', variant: 'destructive' })
    return
  }
  // Open the export panel via the right sidebar
  mainStore.setPoolType('editor')
}

const handlePrint = () => {
  if (!hasCanvas()) {
    toast({ title: 'No Canvas', description: 'Open a project first.', variant: 'destructive' })
    return
  }
  window.print()
}

// ─── Edit menu ──────────────────────────────────────────────

const handleUndo = () => {
  if (!canUndo.value) return
  getHistorySnapshot().undo()
}

const handleRedo = () => {
  if (!canRedo.value) return
  getHistorySnapshot().redo()
}

const handleCut = () => {
  if (!canvasObject.value) return
  getHandleElement().cutElement()
}

const handleCopy = () => {
  if (!canvasObject.value) return
  getHandleElement().copyElement()
}

const handlePaste = () => {
  if (!hasCanvas()) return
  getHandleElement().pasteElement()
}

const handleDuplicate = () => {
  if (!canvasObject.value) return
  getHandleElement().duplicateElement()
}

const handleSelectAll = () => {
  if (!hasCanvas()) return
  const [canvas] = useCanvas()
  if (!canvas) return
  const objects = canvas.getObjects().filter(
    (obj: any) => !WorkSpaceCommonType.includes(obj.id) && (obj as any).type !== ElementNames.REFERENCELINE
  )
  if (objects.length === 0) return
  canvas.discardActiveObject()
  if (objects.length === 1) {
    canvas.setActiveObject(objects[0] as FabricObject)
  } else {
    // Use ActiveSelection if available
    const fabricModule = (window as any).fabric
    const ActiveSelection = fabricModule?.ActiveSelection
    if (ActiveSelection) {
      const sel = new ActiveSelection(objects, { canvas })
      canvas.setActiveObject(sel)
    } else {
      // Fallback: select first object only
      canvas.setActiveObject(objects[0] as FabricObject)
    }
  }
  canvas.renderAll()
}

const handleDeselect = () => {
  if (!hasCanvas()) return
  const [canvas] = useCanvas()
  if (!canvas) return
  // discardActiveObject fires selection:cleared which updates the store + renders.
  // No need to call setCanvasObject(undefined) or renderAll() — those cause a reactive loop.
  canvas.discardActiveObject()
}

const handleDelete = () => {
  if (!canvasObject.value) return
  const { deleteElement } = getHandleElement()
  const obj = canvasObject.value as any
  if (obj.type === ElementNames.ACTIVE && typeof obj.forEachObject === 'function') {
    obj.forEachObject((item: any) => deleteElement(item.id))
    return
  }
  deleteElement(obj.id)
}

const handleLock = () => {
  if (!canvasObject.value) return
  getHandleElement().lockElement(canvasObject.value.id, true)
}

const handleUnlock = () => {
  if (!canvasObject.value) return
  getHandleElement().lockElement(canvasObject.value.id, false)
}

const handleGroup = () => {
  if (!canvasObject.value) return
  getHandleElement().combineElements()
}

const handleUngroup = () => {
  if (!canvasObject.value) return
  getHandleElement().uncombineElements()
}

// ─── View menu ──────────────────────────────────────────────

const handleZoomIn = () => getCanvasScale().scaleCanvas('+')
const handleZoomOut = () => getCanvasScale().scaleCanvas('-')
const handleResetZoom = () => getCanvasScale().resetCanvas()
const handleFitToScreen = () => getCanvasScale().resetCanvas()

const handlePresentationMode = () => {
  if (!hasCanvas()) return
  window.dispatchEvent(new CustomEvent('start-presentation'))
}

const handleToggleRulers = () => {
  showRulers.value = !showRulers.value
  localStorage.setItem('showRulers', String(showRulers.value))
  const [canvas] = useCanvas()
  if (canvas && (canvas as any).rulerInstance) {
    (canvas as any).rulerInstance.enabled = showRulers.value
    canvas.renderAll()
  }
}

const handleToggleGrid = () => {
  showGrid.value = !showGrid.value
  localStorage.setItem('showGrid', String(showGrid.value))
  const [canvas] = useCanvas()
  if (canvas) canvas.renderAll()
}

const handleToggleGuides = () => {
  showGuides.value = !showGuides.value
  localStorage.setItem('showGuides', String(showGuides.value))
}

const handleToggleSnap = () => {
  snapToGrid.value = !snapToGrid.value
  localStorage.setItem('snapToGrid', String(snapToGrid.value))
}

const handleRefreshView = () => {
  const [canvas] = useCanvas()
  if (canvas) canvas.renderAll()
}

// ─── Tools menu ─────────────────────────────────────────────

const handleSelectTool = (tool: string) => {
  mainStore.setPoolType(tool as any)
}

const handleCreateShape = (shapeType: string) => {
  if (!hasCanvas()) {
    toast({ title: 'No Canvas', description: 'Open a project first.', variant: 'destructive' })
    return
  }
  const [canvas] = useCanvas()
  if (!canvas) return

  const center = canvas.getCenterPoint()
  const templatesStore = useTemplatesStore()

  let shape: FabricObject | null = null
  switch (shapeType) {
    case 'rect':
      shape = new Rect({
        width: 200, height: 150,
        fill: 'rgb(59, 130, 246)',
        left: center.x - 100, top: center.y - 75,
        id: nanoid(10),
      })
      break
    case 'ellipse':
      shape = new Ellipse({
        rx: 100, ry: 75,
        fill: 'rgb(59, 130, 246)',
        left: center.x, top: center.y,
        id: nanoid(10),
      })
      break
    case 'line':
      shape = new Line([50, 100, 250, 100], {
        stroke: 'rgb(59, 130, 246)',
        strokeWidth: 2,
        left: center.x - 100, top: center.y,
        id: nanoid(10),
      })
      break
    case 'triangle':
      shape = new Triangle({
        width: 150, height: 150,
        fill: 'rgb(59, 130, 246)',
        left: center.x - 75, top: center.y - 75,
        id: nanoid(10),
      })
      break
  }

  if (shape) {
    canvas.add(shape)
    canvas.setActiveObject(shape)
    templatesStore.addElement(shape)
    canvas.renderAll()
  }
}

const handleOpenAlignPanel = () => {
  mainStore.setPoolType('editor')
}

// ─── Help menu ──────────────────────────────────────────────

const showDocumentation = () => { showDocModal.value = true }
const showSystemInfo = () => { showSystemInfoModal.value = true }
const openFontManager = () => { showFontManager.value = true }
const openSettings = () => { showSettingsModal.value = true }

const handleKeyboardShortcuts = () => {
  showDocModal.value = true
}

const handleReportBug = () => {
  window.open('https://github.com/your-org/euclid/issues/new', '_blank')
}

const handleAbout = () => {
  const versions = window.electron?.versions
  toast({
    title: 'About Euclid',
    description: `Euclid Canvas Editor v0.1.0\nElectron: ${versions?.electron || 'N/A'}\nChrome: ${versions?.chrome || 'N/A'}\nNode: ${versions?.node || 'N/A'}`,
  })
}

const handleStartTour = () => {
  onboardingStore.resetOnboarding()
  onboardingStore.startOnboarding()
  router.push('/projects')
  toast({
    title: 'Tour Started',
    description: 'Follow the guide to explore Euclid.',
  })
}

// ─── Lifecycle ──────────────────────────────────────────────

onMounted(() => {
  window.addEventListener('message', (event) => {
    if (event.data.type === 'window-maximized') {
      isMaximized.value = event.data.maximized
    }
  })

  if (window.electron?.onPrepareClose) {
    window.electron.onPrepareClose(() => {
      mainStore.setSavingProject(true)
      const savePromise = (window as any).__euclidSave
        ? (window as any).__euclidSave()
        : Promise.resolve()
      savePromise.finally(() => {
        mainStore.setSavingProject(false)
        window.electron?.confirmClose()
      })
    })
  }

  autoSaveEnabled.value = localStorage.getItem('autoSave') === 'true'
  showGrid.value = localStorage.getItem('showGrid') !== 'false'
  showRulers.value = localStorage.getItem('showRulers') !== 'false'
  showGuides.value = localStorage.getItem('showGuides') !== 'false'
  snapToGrid.value = localStorage.getItem('snapToGrid') === 'true'
})
</script>

<style scoped>
.electron-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  background-color: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  user-select: none;
  font-size: 12px;
  position: relative;
  z-index: 1000;
}

.electron-titlebar.dark-mode {
  color: hsl(0, 0%, 65%);
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 8px;
  flex: 1;
  min-width: 0;
}

.titlebar-menu {
  display: flex;
  align-items: center;
  gap: 2px;
}

.menu-button {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  height: 28px;
  background: transparent;
  border: none;
  color: hsl(var(--primary));
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.electron-titlebar.dark-mode .menu-button {
  color: hsl(0, 0%, 65%);
}

.menu-button:hover {
  background-color: hsl(var(--accent));
}

.titlebar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.titlebar-title {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  font-weight: 400;
}

.electron-titlebar.dark-mode .titlebar-title {
  color: hsl(0, 0%, 60%);
}

.titlebar-separator {
  margin: 0 6px;
  color: hsl(var(--muted-foreground));
  opacity: 0.6;
}

.titlebar-project {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--foreground));
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: bottom;
}

.electron-titlebar.dark-mode .titlebar-project {
  color: hsl(0, 0%, 85%);
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: 0;
  height: 100%;
}

.window-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 32px;
  background: transparent;
  border: none;
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.electron-titlebar.dark-mode .window-control {
  color: hsl(0, 0%, 65%);
}

.window-control:hover {
  background-color: hsl(var(--accent));
}

.window-control.close-button:hover {
  background-color: hsl(0, 100%, 50%);
  color: white;
}

/* Windows-specific styling */
@media (prefers-contrast: more) {
  .electron-titlebar {
    border-bottom-width: 2px;
  }
}
</style>
