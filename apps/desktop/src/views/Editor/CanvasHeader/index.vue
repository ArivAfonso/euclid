<template>
  <div data-onboarding="canvas-header" class="flex items-center justify-between w-full px-3 py-1.5 bg-white dark:bg-[hsl(0,0%,9%)] border-b border-gray-200 dark:border-gray-800 [&_button_svg]:text-gray-500 dark:[&_button_svg]:text-gray-400">
    <!-- Left handler -->
    <div class="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :class="{ 'opacity-50 cursor-not-allowed': !canUndo }"
              :disabled="!canUndo"
              @click="undo()"
            >
              <RotateCcw class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Undo</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :class="{ 'opacity-50 cursor-not-allowed': !canRedo }"
              :disabled="!canRedo"
              @click="redo()"
            >
              <RotateCw class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Redo</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" class="h-6 mx-1" />

      <TooltipProvider v-if="canGroup">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :class="{ 'opacity-50 cursor-not-allowed': !canGroup }"
              :disabled="!canGroup"
              @click="group()"
            >
              <Square class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Group</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider v-if="canUnGroup">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :class="{ 'opacity-50 cursor-not-allowed': !canUnGroup }"
              :disabled="!canUnGroup"
              @click="ungroup()"
            >
              <Ungroup class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Ungroup</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              @click="changeRuler()"
            >
              <Ruler class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Toggle Ruler</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              @click="triggerImport"
            >
              <Upload class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Import JSON</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <input
        type="file"
        ref="fileInput"
        accept=".json"
        class="hidden"
        @change="handleImportJson"
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              @click="enterPresentationMode()"
            >
              <Maximize class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Fullscreen Presentation (F5)</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" class="h-6 mx-1" />

      <!-- Alignment Tools -->
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :disabled="!hasSelection"
              @click="alignLeft()"
            >
              <AlignStartVertical class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Align Left</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :disabled="!hasSelection"
              @click="alignCenter()"
            >
              <AlignCenterVertical class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Align Center</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :disabled="!hasSelection"
              @click="alignRight()"
            >
              <AlignEndVertical class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Align Right</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" class="h-6 mx-1" />

      <!-- Layer Controls -->
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :disabled="!hasSelection"
              @click="bringToFront()"
            >
              <ArrowUp class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Bring to Front</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              :disabled="!hasSelection"
              @click="sendToBack()"
            >
              <ArrowDown class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            <span>Send to Back</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- Center handler -->
    <div class="flex items-center gap-2" v-if="canIntersection">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 px-2 gap-1">
            <Combine class="w-4 h-4" />
            <span class="text-xs">Boolean</span>
            <ChevronDown class="w-3 h-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="intersection(0)">
            <Copy class="w-4 h-4 mr-2" />
            Union
          </DropdownMenuItem>
          <DropdownMenuItem @click="intersection(1)">
            <Minus class="w-4 h-4 mr-2" />
            Difference
          </DropdownMenuItem>
          <DropdownMenuItem @click="intersection(2)">
            <Shapes class="w-4 h-4 mr-2" />
            Intersection
          </DropdownMenuItem>
          <DropdownMenuItem @click="intersection(3)">
            <Scissors class="w-4 h-4 mr-2" />
            Xor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Right handler -->
    <div class="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="scaleCanvas('-')">
              <Minus class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Zoom Out</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Popover>
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 min-w-[56px] text-xs px-2 font-mono hover:bg-gray-100 dark:hover:bg-gray-800">
            {{ canvasZoom }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-36 p-1">
          <div class="grid grid-cols-2 gap-0.5">
            <Button
              v-for="item in canvasZoomPresets"
              :key="item"
              variant="ghost"
              size="sm"
              class="h-6 justify-center text-[10px] px-1"
              @click="applyCanvasPresetScale(item)"
            >
              {{ item }}%
            </Button>
          </div>
          <Separator class="my-1" />
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-full justify-center text-[10px] px-1"
            @click="resetCanvas()"
          >
            <Maximize class="w-3 h-3 mr-1" />
            Fit
          </Button>
        </PopoverContent>
      </Popover>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="scaleCanvas('+')">
              <Plus class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Zoom In</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" class="h-6 ml-1 -mr-1" />
    </div>

    <!-- Presentation Mode Component -->
    <PresentationMode 
      v-model="isPresentationActive" 
      :start-index="templateIndex"
      @slide-change="handlePresentationSlideChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from 'vue-router'
import { ElementNames, AlignCommand, LayerCommand } from "@/types/elements";
import { storeToRefs } from "pinia";
import { Object as FabricObject, Group } from "fabric";
import { useFabricStore, useMainStore, useSnapshotStore, useTemplatesStore } from "@/store";
import useCanvas from '@/views/Canvas/useCanvas'
import { toast } from '@/components/ui/toast/use-toast'
import useProjects from '@/hooks/useProjects'
import useHandleTool from '@/hooks/useHandleTool'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useCanvasScale from '@/hooks/useCanvasScale'
import useHandleElement from '@/hooks/useHandleElement'
import axios from 'axios'

const CF_WORKERS_API = import.meta.env.VITE_CF_WORKERS_API || 'https://stock-image-api.your-domain.workers.dev'

// components
import PresentationMode from '@/components/PresentationMode.vue'
// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

// Lucide icons
import { 
  RotateCcw, 
  RotateCw, 
  Square, 
  Ungroup, 
  Ruler, 
  Maximize,
  Copy,
  ChevronDown,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowUp,
  ArrowDown,
  Shapes,
  Scissors,
  Combine,
  Plus, 
  Minus,
  Upload,
} from 'lucide-vue-next';

const router = useRouter()
const fabricStore = useFabricStore();
const mainStore = useMainStore();
const templatesStore = useTemplatesStore();
const { updateProject, getProject, generateAndSaveThumbnail } = useProjects()

const { alignElement, layerElement } = useHandleTool();
const { setCanvasScalePercentage, scaleCanvas, resetCanvas } = useCanvasScale();
const { combineElements, uncombineElements, intersectElements } = useHandleElement();
const { zoom } = storeToRefs(fabricStore);
const { canvasObject } = storeToRefs(mainStore);
const { templateIndex, templates } = storeToRefs(templatesStore);

const scaleRef = ref();
const canvasZoom = computed(() => Math.round(zoom.value * 100) + "%");
const canvasZoomPresets = [400, 300, 200, 150, 100, 80, 75, 66, 50, 33, 25];
const isPresentationActive = ref(false);

// Auto-save state — canvas stays unsaved until the user explicitly leaves or saves manually
const saveStatus = ref<'saved' | 'unsaved' | 'saving'>('saved')
const currentProjectId = ref<string | null>(null)
const currentProjectName = ref<string>('Untitled Project')
const isSaving = ref(false)

const { canUndo, canRedo } = storeToRefs(useSnapshotStore());

const { redo, undo } = useHistorySnapshot();

// Manual save — called from ElectronTitlebar (Save button / File → Save) or when
// the user navigates back to the Projects list via the sidebar Home button
const triggerManualSave = async () => {
  if (isSaving.value || !currentProjectId.value) return
  isSaving.value = true
  saveStatus.value = 'saving'
  try {
    const success = await updateProject(currentProjectId.value, {
      name: currentProjectName.value
    })
    if (success) {
      // Generate thumbnail now that canvas data is persisted
      // Await this before navigation so the Projects page cannot read the
      // previous thumbnail while the canvas is being unmounted.
      await generateAndSaveThumbnail(currentProjectId.value!)
      saveStatus.value = 'saved'
    }
  } catch (error) {
    console.error('Manual save failed:', error)
  } finally {
    isSaving.value = false
  }
}

// Expose so sibling components can call it
(window as any).__euclidSave = triggerManualSave

// Check if we're editing an existing project on mount
onMounted(() => {
  const query = router.currentRoute.value.query
  if (typeof query.project === 'string') {
    currentProjectId.value = query.project
    const project = getProject(query.project)
    if (project) {
      currentProjectName.value = project.name
      saveStatus.value = 'saved'
    }
  }
  // NOTE: New project creation (saveProject) has been moved to
  // CanvasCenter/index.vue onMounted, which runs AFTER the canvas is
  // initialized — avoiding the race condition that caused ALL new projects
  // to fail saving (CanvasHeader.onMounted fired when canvas was still null)
  
  // Setup canvas event listeners — just mark as unsaved when user edits,
  // no auto-save. Saving only happens on manual trigger or navigate-away.
  const [canvas] = useCanvas()
  if (canvas) {
    const markUnsaved = () => {
      if (currentProjectId.value) {
        saveStatus.value = 'unsaved'
      }
    }
    
    canvas.on('object:modified', markUnsaved)
    canvas.on('object:added', markUnsaved)
    canvas.on('object:removed', markUnsaved)
  }
})

// Watch for project ID changes from CanvasCenter (which saves the new
// project after canvas init and updates the URL with the project ID)
watch(() => router.currentRoute.value.query.project, (newProjectId) => {
  if (typeof newProjectId === 'string' && newProjectId !== currentProjectId.value) {
    currentProjectId.value = newProjectId
    const project = getProject(newProjectId)
    currentProjectName.value = project?.name || 'Untitled Project'
    saveStatus.value = project ? 'saved' : 'unsaved'
  }
})

onUnmounted(() => {
  // Cleanup canvas event listeners
  const [canvas] = useCanvas()
  if (canvas) {
    canvas.off('object:modified')
    canvas.off('object:added')
    canvas.off('object:removed')
  }
  // Clean up the global save handle
  delete (window as any).__euclidSave
})

const handleElement = computed(() => canvasObject.value as FabricObject);

const canGroup = computed(() => {
  if (!handleElement.value) return false;
  return handleElement.value.type === ElementNames.ACTIVE;
});
const canUnGroup = computed(() => {
  if (!handleElement.value) return false;
  return handleElement.value.type === ElementNames.GROUP;
});

const canIntersection = computed(() => {
  const [canvas] = useCanvas();
  if (!handleElement.value) return false;
  if (handleElement.value.type === ElementNames.GROUP) {
    const groupObject = handleElement.value as Group;
    const sonObjects = groupObject._objects.filter((ele) => ele.type === ElementNames.PATH);
    if (groupObject._objects.length === 2 && sonObjects && sonObjects.length === 2) return true;
    return false;
  }
  if (handleElement.value.type !== ElementNames.ACTIVE) return false;

  const activeObjects = canvas.getActiveObjects();
  return activeObjects.length === 2 && activeObjects.filter((ele) => ele.type === ElementNames.PATH).length === 2;
});

const hasSelection = computed(() => {
  return !!handleElement.value;
});

// Combine
const group = () => {
  if (!handleElement.value || handleElement.value.type !== ElementNames.ACTIVE) return;
  combineElements();
};

// Uncombine
const ungroup = () => {
  if (!handleElement.value || handleElement.value.type !== ElementNames.GROUP) return;
  uncombineElements();
};

// Toggle ruler visibility
const changeRuler = () => {
  const [ canvas ] = useCanvas();
  if (!canvas) return
  const ruler = (canvas as any).rulerInstance
  if (!ruler) return
  ruler.enabled = !ruler.enabled
};

const fileInput = ref<HTMLInputElement | null>(null)

const triggerImport = () => {
  fileInput.value?.click()
}

const handleImportJson = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target?.result as string)
      const [canvas] = useCanvas()
      if (canvas) {
        // Process via server to fix CORS issues
        toast({ title: 'Processing', description: 'Converting resources to Base64...' })
        let processedJson = json
        try {
          const response = await axios.post(`${CF_WORKERS_API}/api/utils/import-json`, json)
          processedJson = response.data
          toast({ title: 'Success', description: 'JSON processed successfully' })
        } catch (serverError) {
          console.error('Server processing failed, falling back to local', serverError)
          toast({ title: 'Warning', description: 'Server processing failed. Some images might not load due to CORS.', variant: 'destructive' })
          
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
          ensureCrossOrigin(processedJson)
        }

        await canvas.loadFromJSON(processedJson)
        canvas.renderAll()
        toast({ title: 'Success', description: 'JSON imported successfully' })
      }
    } catch (error) {
      console.error('Invalid JSON', error)
      toast({ title: 'Error', description: 'Invalid JSON file', variant: 'destructive' })
    }
    // Reset input
    if (fileInput.value) fileInput.value.value = ''
  }
  reader.readAsText(file)
}

const intersection = (val: number) => {
  if (!handleElement.value) return;
  intersectElements(val);
};

const applyCanvasPresetScale = (value: number) => {
  setCanvasScalePercentage(value);
};

// Alignment functions
const alignLeft = () => {
  if (!handleElement.value) return;
  alignElement(AlignCommand.LEFT);
};

const alignCenter = () => {
  if (!handleElement.value) return;
  alignElement(AlignCommand.HORIZONTAL);
};

const alignRight = () => {
  if (!handleElement.value) return;
  alignElement(AlignCommand.RIGHT);
};

// Layer functions
const bringToFront = () => {
  if (!handleElement.value) return;
  layerElement(LayerCommand.TOP);
};

const sendToBack = () => {
  if (!handleElement.value) return;
  layerElement(LayerCommand.BOTTOM);
};

// Enter presentation mode
const enterPresentationMode = () => {
  templatesStore.syncCanvasToTemplate()
  isPresentationActive.value = true
};

// Handle slide change in presentation
const handlePresentationSlideChange = (index: number) => {
  templatesStore.setTemplateIndex(index)
};
</script>

<style scoped>
/* Additional styling if needed */
</style>
