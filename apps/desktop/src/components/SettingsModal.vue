<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-xl shadow-none select-none">
      <DialogHeader>
        <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Settings
          </DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground">
          Configure application preferences and defaults.
        </DialogDescription>
      </DialogHeader>

      <Tabs default-value="general" class="w-full flex flex-col">
        <TabsList class="grid grid-cols-4 mb-4 shrink-0">
          <TabsTrigger value="general" class="text-xs">General</TabsTrigger>
          <TabsTrigger value="canvas" class="text-xs">Canvas</TabsTrigger>
          <TabsTrigger value="editor" class="text-xs">Editor</TabsTrigger>
          <TabsTrigger value="export" class="text-xs">Export</TabsTrigger>
        </TabsList>

        <div class="overflow-y-auto max-h-[420px] min-h-[360px] -mx-1 px-1">
        <!-- General Tab -->
        <TabsContent value="general" class="space-y-4">
          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Appearance
            </h3>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-xs font-medium">Dark Mode</Label>
                <p class="text-[11px] text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch
                :checked="isDarkMode"
                @update:checked="handleToggleDarkMode"
              />
            </div>
          </div>

          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              File Management
            </h3>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-xs font-medium">Auto Save</Label>
                <p class="text-[11px] text-muted-foreground">Automatically save changes periodically</p>
              </div>
              <Switch
                :checked="autoSaveEnabled"
                @update:checked="handleToggleAutoSave"
              />
            </div>
          </div>

          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Interface
            </h3>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-xs font-medium">Language</Label>
                <p class="text-[11px] text-muted-foreground">Application interface language</p>
              </div>
              <div class="w-32">
                <Select v-model="language">
                  <SelectTrigger class="h-7 text-xs border border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="en" class="text-xs">English</SelectItem>
                      <SelectItem value="zh" class="text-xs">中文</SelectItem>
                      <SelectItem value="ja" class="text-xs">日本語</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Canvas Tab -->
        <TabsContent value="canvas" class="space-y-4">
          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Display
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label class="text-xs font-medium">Show Grid</Label>
                  <p class="text-[11px] text-muted-foreground">Display grid lines on the canvas</p>
                </div>
                <Switch
                  :checked="showGrid"
                  @update:checked="handleToggleGrid"
                />
              </div>
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label class="text-xs font-medium">Show Rulers</Label>
                  <p class="text-[11px] text-muted-foreground">Display rulers along the edges</p>
                </div>
                <Switch
                  :checked="showRulers"
                  @update:checked="handleToggleRulers"
                />
              </div>
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label class="text-xs font-medium">Show Guides</Label>
                  <p class="text-[11px] text-muted-foreground">Display alignment guides</p>
                </div>
                <Switch
                  :checked="showGuides"
                  @update:checked="handleToggleGuides"
                />
              </div>
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label class="text-xs font-medium">Show Dimensions</Label>
                  <p class="text-[11px] text-muted-foreground">Display the selected object's size label</p>
                </div>
                <Switch
                  :checked="showDimensionLabel"
                  @update:checked="handleToggleDimensionLabel"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Snapping
            </h3>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-xs font-medium">Snap to Grid</Label>
                <p class="text-[11px] text-muted-foreground">Snap elements to grid lines</p>
              </div>
                <Switch
                  :checked="snapToGrid"
                  @update:checked="handleToggleSnap"
                />
            </div>
          </div>

          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Units
            </h3>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-xs font-medium">Measurement Unit</Label>
                <p class="text-[11px] text-muted-foreground">Unit for canvas measurements</p>
              </div>
              <div class="w-28">
                <Select v-model="unitMode">
                  <SelectTrigger class="h-7 text-xs border border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem
                        v-for="item in DesignUnitMode"
                        :key="item.id"
                        :value="item.id"
                        class="text-xs"
                      >
                        {{ item.name }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Editor Tab -->
        <TabsContent value="editor" class="space-y-4">
          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Input
            </h3>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-xs font-medium">Keyboard Shortcuts</Label>
                <p class="text-[11px] text-muted-foreground">Enable keyboard shortcuts and hotkeys</p>
              </div>
              <Switch
                :checked="!disableHotkeys"
                @update:checked="handleToggleHotkeys"
              />
            </div>
          </div>

          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Default Behavior
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label class="text-xs font-medium">Left Sidebar</Label>
                  <p class="text-[11px] text-muted-foreground">Default panel shown in the left sidebar</p>
                </div>
                <div class="w-32">
                  <Select v-model="defaultSidebarPanel">
                    <SelectTrigger class="h-7 text-xs border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="editor" class="text-xs">Editor</SelectItem>
                        <SelectItem value="layers" class="text-xs">Layers</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Export Tab -->
        <TabsContent value="export" class="space-y-4">
          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Default Export Format
            </h3>
            <div class="space-y-1.5">
              <p class="text-[11px] text-muted-foreground">Choose the default format when exporting projects</p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="fmt in exportFormats"
                  :key="fmt.value"
                  class="flex flex-col items-center gap-1 rounded-md border p-2.5 transition-colors"
                  :class="exportType === fmt.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border/60 bg-muted/10 text-muted-foreground hover:border-border hover:text-foreground'"
                  @click="handleExportTypeChange(fmt.value)"
                >
                  <component :is="fmt.icon" class="h-5 w-5" />
                  <span class="text-[10px] font-medium uppercase">{{ fmt.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Export Quality
            </h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium">Quality</span>
                <span class="text-[10px] font-mono text-muted-foreground">{{ exportQuality }}%</span>
              </div>
              <Slider
                :model-value="[exportQuality]"
                @update:model-value="(val) => { if (Array.isArray(val) && val.length) exportQuality = val[0] }"
                :min="10"
                :max="100"
                :step="5"
              />
              <div class="flex justify-between text-[10px] text-muted-foreground">
                <span>Draft</span>
                <span>Maximum</span>
              </div>
            </div>
          </div>

          <!-- PowerPoint Export Settings -->
          <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              PowerPoint Export
            </h3>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label class="text-xs font-medium">Rasterize Uncommon Fonts</Label>
                <p class="text-[11px] text-muted-foreground">
                  Render custom fonts as images to guarantee correct appearance in PowerPoint. Disable to keep editable text (may use a fallback font).
                </p>
              </div>
              <Switch
                :checked="pptRasterizeFonts"
                @update:checked="pptRasterizeFonts = $event"
              />
            </div>
          </div>
        </TabsContent>
        </div>
      </Tabs>

      <DialogFooter class="flex items-center justify-between">
        <Button
          variant="ghost"
          class="h-7 text-xs text-muted-foreground"
          @click="resetToDefaults"
        >
          Reset to Defaults
        </Button>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            class="h-7 text-xs px-3"
            @click="isOpen = false"
          >
            Cancel
          </Button>
          <Button
            class="h-7 text-xs px-3 bg-red-600 hover:bg-red-700 text-white"
            @click="saveAndClose"
          >
            Save
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Image,
  FileJson,
  FileType,
  FileDown,
} from 'lucide-vue-next'
import type { ExportTypes } from '@/types/common'
import { DesignUnitMode } from '@/configs/background'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = ref(props.open ?? false)
const mainStore = useMainStore()
const { isDarkMode, disableHotkeys, sizeMode, unitMode, exportType } = storeToRefs(mainStore)

// Local state for settings
const autoSaveEnabled = ref(localStorage.getItem('autoSave') === 'true')
const showGrid = ref(localStorage.getItem('showGrid') !== 'false')
const showRulers = ref(localStorage.getItem('showRulers') !== 'false')
const showGuides = ref(localStorage.getItem('showGuides') !== 'false')
const showDimensionLabel = ref(localStorage.getItem('showDimensionLabel') !== 'false')
const snapToGrid = ref(localStorage.getItem('snapToGrid') === 'true')
const language = ref(localStorage.getItem('language') || 'en')
const defaultSidebarPanel = ref(localStorage.getItem('defaultSidebarPanel') || 'editor')
const exportQuality = ref(Number(localStorage.getItem('exportQuality') || 90))
const pptRasterizeFonts = ref(localStorage.getItem('pptRasterizeFonts') !== 'false')

const exportFormats = [
  { value: 'image' as ExportTypes, label: 'Image', icon: Image },
  { value: 'pdf' as ExportTypes, label: 'PDF', icon: FileDown },
  { value: 'svg' as ExportTypes, label: 'SVG', icon: FileType },
  { value: 'json' as ExportTypes, label: 'JSON', icon: FileJson },
]

watch(isOpen, (value) => {
  emit('update:open', value)
})

watch(() => props.open, (value) => {
  if (value !== undefined) {
    isOpen.value = value
    if (value) {
      // Reload persisted state when opening
      autoSaveEnabled.value = localStorage.getItem('autoSave') === 'true'
      showGrid.value = localStorage.getItem('showGrid') !== 'false'
      showRulers.value = localStorage.getItem('showRulers') !== 'false'
      showGuides.value = localStorage.getItem('showGuides') !== 'false'
      showDimensionLabel.value = localStorage.getItem('showDimensionLabel') !== 'false'
      snapToGrid.value = localStorage.getItem('snapToGrid') === 'true'
      language.value = localStorage.getItem('language') || 'en'
      defaultSidebarPanel.value = localStorage.getItem('defaultSidebarPanel') || 'editor'
      exportQuality.value = Number(localStorage.getItem('exportQuality') || 90)
      pptRasterizeFonts.value = localStorage.getItem('pptRasterizeFonts') !== 'false'
    }
  }
})

const handleToggleDarkMode = (value: boolean) => {
  if (value) {
    mainStore.setDarkMode(true)
  } else {
    mainStore.setDarkMode(false)
  }
}

const handleToggleAutoSave = (value: boolean) => {
  autoSaveEnabled.value = value
  localStorage.setItem('autoSave', String(value))
}

const handleToggleGrid = (value: boolean) => {
  showGrid.value = value
  localStorage.setItem('showGrid', String(value))
}

const handleToggleRulers = (value: boolean) => {
  showRulers.value = value
  localStorage.setItem('showRulers', String(value))
}

const handleToggleGuides = (value: boolean) => {
  showGuides.value = value
  localStorage.setItem('showGuides', String(value))
}

const handleToggleDimensionLabel = (value: boolean) => {
  showDimensionLabel.value = value
  localStorage.setItem('showDimensionLabel', String(value))
  window.dispatchEvent(new Event('dimension-label-setting-changed'))
}

const handleToggleSnap = (value: boolean) => {
  snapToGrid.value = value
  localStorage.setItem('snapToGrid', String(value))
}

const handleToggleHotkeys = (value: boolean) => {
  mainStore.disableHotkeys = !value
}

const handleExportTypeChange = (type: ExportTypes) => {
  mainStore.setExportType(type)
}

const resetToDefaults = () => {
  autoSaveEnabled.value = false
  showGrid.value = true
  showRulers.value = true
  showGuides.value = true
  showDimensionLabel.value = true
  snapToGrid.value = false
  language.value = 'en'
  defaultSidebarPanel.value = 'editor'
  exportQuality.value = 90
  pptRasterizeFonts.value = true
  unitMode.value = 0
  handleToggleDarkMode(false)
  mainStore.disableHotkeys = false
  mainStore.setExportType('image')
}

const saveAndClose = () => {
  localStorage.setItem('autoSave', String(autoSaveEnabled.value))
  localStorage.setItem('showGrid', String(showGrid.value))
  localStorage.setItem('showRulers', String(showRulers.value))
  localStorage.setItem('showGuides', String(showGuides.value))
  localStorage.setItem('showDimensionLabel', String(showDimensionLabel.value))
  localStorage.setItem('snapToGrid', String(snapToGrid.value))
  localStorage.setItem('language', language.value)
  localStorage.setItem('defaultSidebarPanel', defaultSidebarPanel.value)
  localStorage.setItem('exportQuality', String(exportQuality.value))
  localStorage.setItem('pptRasterizeFonts', String(pptRasterizeFonts.value))
  localStorage.setItem('unitMode', String(unitMode.value))
  isOpen.value = false
}
</script>

<style scoped>
:deep(.radix-dialog-overlay) {
  background-color: transparent !important;
}
</style>
