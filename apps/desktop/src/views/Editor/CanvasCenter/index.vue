<template>
  <div data-onboarding="canvas-area"
    ref="wrapperRef" 
    @mousedown="addDrawAreaFocus"
    v-contextmenu="contextMenus" 
    v-click-outside="remDrawAreaFocus"
    class="relative w-full h-full bg-[#efefee] dark:bg-[hsl(0,0%,8%)]"
  >
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
    <transition name="fade">
      <div
        v-if="isImageLoading"
        class="absolute bottom-3 right-3 flex items-center gap-2 rounded-md bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-slate-200/90 dark:text-slate-900"
      >
        <Loader2 class="h-3.5 w-3.5 animate-spin" />
        <span>Loading image...</span>
      </div>
    </transition>

  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useFabricStore, useMainStore, useTemplatesStore } from '@/store'
import { useRouter } from 'vue-router'
import { unzip } from "@/utils/crypto"
import { loadTemplateData } from '@/utils/templateLoader'
import { contextMenus } from '@/configs/contextMenu'
import { disposeEditor, initEditor } from '@/views/Canvas/useCanvas'
import { toast } from '@/components/ui/toast/use-toast'
import useCanvasHotkey from '@/hooks/useCanvasHotkey'
import useProjects from '@/hooks/useProjects'
import { Loader2 } from 'lucide-vue-next'

const fabricStore = useFabricStore()
const mainStore = useMainStore()
const router = useRouter()
const templatesStore = useTemplatesStore()
const { loadProject, saveProject } = useProjects()
const { wrapperRef, canvasRef } = storeToRefs(fabricStore)
const { drawAreaFocus, imageLoadingTasks } = storeToRefs(mainStore)
const { keydownListener, keyupListener, pasteListener } = useCanvasHotkey()

const isImageLoading = computed(() => imageLoadingTasks.value > 0)
const loadedProjectId = ref<string | undefined>(undefined)


const addDrawAreaFocus = () => {
  if (!drawAreaFocus.value) mainStore.setDrawAreaFocus(true)
}

const remDrawAreaFocus = () => {
  if (drawAreaFocus.value) mainStore.setDrawAreaFocus(false)
}

const getTemplateDetail = async (pk: number) => {
  const template = await loadTemplateData(pk)
  if (template) {
    try {
      router.push({
        path: router.currentRoute.value.path,
        query: { ...router.currentRoute.value.query, template: String(pk) },
      })
      console.log('template.id:', template.id)
      const data = unzip(template.data)
      await templatesStore.changeTemplate(data)
    } 
    catch (error) {
      toast({
        title: 'Error',
        description: 'A bug has occurred while loading the template.',
        variant: 'destructive'
      })
    }
  }
}

const initRouter = async (templateId?: number, projectId?: string) => {
  if (projectId) {
    // Load saved project
    try {
      const success = await loadProject(projectId)
      if (!success) {
        toast({
          title: 'Error',
          description: 'Failed to load project. It may have been deleted.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading project:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while loading the project.',
        variant: 'destructive'
      })
    }
  } else if (templateId) {
    // Load template from API
    templatesStore.setTemplateId(String(templateId))
    await getTemplateDetail(templateId)
  }
}

onMounted(async () => {
  const query = router.currentRoute.value.query
  const projectId = typeof query.project === 'string' ? query.project : undefined
  const templateId = query.template ? Number(query.template) : undefined
  
  // Initialize editor first — this creates the canvas
  // Existing projects must not render the template state left in Pinia before
  // their saved data has been loaded.
  await initEditor(templateId, !projectId)
  
  // Then load router content (template or project)
  await initRouter(templateId, projectId)
  loadedProjectId.value = projectId
  
  // If this is a NEW project (no projectId in URL), save it now that
  // the canvas is fully initialized — this avoids the race condition
  // where CanvasHeader.onMounted tried to save before the canvas existed
  if (!projectId) {
    const projectName = typeof query.name === 'string' ? query.name : 'Untitled Project'
    const project = await saveProject(projectName, '')
    if (project) {
      loadedProjectId.value = project.id
      router.replace({ query: { ...query, project: project.id } })
    }
  }
  
  document.addEventListener('keydown', keydownListener)
  document.addEventListener('keyup', keyupListener)
  window.addEventListener('blur', keyupListener)
  window.addEventListener('paste', pasteListener as any)
})

// Vue reuses the editor route when only ?project changes. Reload the new
// project's data explicitly instead of leaving the previous canvas mounted.
watch(
  () => router.currentRoute.value.query.project,
  async (projectId, previousProjectId) => {
    if (
      typeof projectId !== 'string' ||
      projectId === previousProjectId ||
      projectId === loadedProjectId.value
    ) return
    const success = await loadProject(projectId)
    if (success) loadedProjectId.value = projectId
  },
)

onBeforeUnmount(() => {
  void disposeEditor()
})

onUnmounted(() => {
  document.removeEventListener('keydown', keydownListener)
  document.removeEventListener('keyup', keyupListener)
  window.removeEventListener('blur', keyupListener)
  window.removeEventListener('paste', pasteListener as any)
})

</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 120ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
