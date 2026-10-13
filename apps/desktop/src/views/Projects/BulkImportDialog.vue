<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="border-border/50 bg-background max-w-lg">
      <DialogHeader class="space-y-1">
        <DialogTitle class="text-2xl text-foreground font-light flex items-center gap-2" style="font-family: 'Editorial New', serif;">
          <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
          Bulk Import
        </DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground">
          Select one or more Euclid JSON files. Each valid file becomes a new
          project in {{ destinationLabel }}.
        </DialogDescription>
      </DialogHeader>

      <Separator class="my-2" />

      <!-- File picker / drop zone -->
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <input
          type="file"
          accept=".json,application/json"
          multiple
          class="hidden"
          @change="handleFileInput"
        />
        <Upload class="h-5 w-5 text-muted-foreground" />
        <span class="text-xs font-medium text-foreground">Choose JSON files</span>
        <span class="text-[10px] text-muted-foreground">or drag and drop them here</span>
      </label>

      <!-- Selected files -->
      <div v-if="entries.length" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <Label class="text-[10px] font-bold uppercase tracking-wide">
            Files ({{ entries.length }})
          </Label>
          <button
            type="button"
            class="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            @click="clearEntries"
          >
            Clear
          </button>
        </div>
        <div class="max-h-44 space-y-1 overflow-y-auto pr-1">
          <div
            v-for="entry in entries"
            :key="entry.key"
            class="flex items-start gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5"
          >
            <CircleCheck v-if="entry.draft" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <CircleAlert v-else class="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-medium text-foreground">
                {{ entry.draft ? entry.draft.name : entry.fileName }}
              </p>
              <p class="truncate text-[10px] text-muted-foreground">
                {{ entry.fileName }}
                <template v-if="entry.draft"> · {{ entry.draft.width }}×{{ entry.draft.height }}</template>
                <template v-else> · {{ entry.error }}</template>
              </p>
            </div>
            <button
              type="button"
              class="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              :aria-label="`Remove ${entry.fileName}`"
              @click="removeEntry(entry.key)"
            >
              <X class="h-3 w-3" />
            </button>
          </div>
        </div>
        <p v-if="invalidCount" class="text-[10px] text-muted-foreground">
          {{ validCount }} ready · {{ invalidCount }} skipped (invalid)
        </p>
      </div>

      <Separator class="my-2" />

      <DialogFooter class="flex gap-2 justify-end">
        <Button
          variant="outline"
          class="h-7 text-xs border-border/50"
          @click="close"
        >
          Cancel
        </Button>
        <Button
          :disabled="validCount === 0 || isImporting"
          class="bg-red-600 hover:bg-red-700 text-white hover:text-white border-red-600 hover:border-red-700 h-7 text-xs font-medium"
          @click="handleImport"
        >
          {{ isImporting ? 'Importing...' : importLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Upload, CircleCheck, CircleAlert, X } from 'lucide-vue-next'
import useProjects, { type SavedProject } from '@/hooks/useProjects'
import { parseTemplateJson, type ImportedProjectDraft } from '@/utils/projectImport'

interface BulkImportEntry {
  key: string
  fileName: string
  draft?: ImportedProjectDraft
  error?: string
}

const props = withDefaults(
  defineProps<{
    open: boolean
    folderId?: string | null
    destinationLabel?: string
  }>(),
  {
    folderId: null,
    destinationLabel: 'Root',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  imported: [payload: { projects: SavedProject[]; skipped: number }]
}>()

const { importProjectsFromTemplates } = useProjects()

const entries = ref<BulkImportEntry[]>([])
const isImporting = ref(false)

const validEntries = computed(() => entries.value.filter((entry) => entry.draft))
const validCount = computed(() => validEntries.value.length)
const invalidCount = computed(() => entries.value.length - validCount.value)
const importLabel = computed(() =>
  validCount.value > 0
    ? `Import ${validCount.value} Project${validCount.value === 1 ? '' : 's'}`
    : 'Import Projects',
)

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

const close = () => {
  emit('update:open', false)
}

const readFileText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'))
    reader.readAsText(file)
  })

const ingestFiles = async (files: File[]) => {
  if (!files.length) return

  const parsed = await Promise.all(
    files.map(async (file): Promise<BulkImportEntry> => {
      const key = `${file.name}:${file.size}:${file.lastModified}`
      try {
        const text = await readFileText(file)
        const result = parseTemplateJson(file.name, text)
        return result.ok
          ? { key, fileName: file.name, draft: result.draft }
          : { key, fileName: file.name, error: result.error }
      } catch {
        return { key, fileName: file.name, error: 'Could not read file' }
      }
    }),
  )

  // Keep previously selected files; ignore exact re-selections
  const known = new Set(entries.value.map((entry) => entry.key))
  entries.value = [...entries.value, ...parsed.filter((entry) => !known.has(entry.key))]
}

const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  void ingestFiles(Array.from(input.files ?? []))
  // Reset so picking the same files again still fires a change event
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  void ingestFiles(Array.from(event.dataTransfer?.files ?? []))
}

const removeEntry = (key: string) => {
  entries.value = entries.value.filter((entry) => entry.key !== key)
}

const clearEntries = () => {
  entries.value = []
}

const handleImport = () => {
  const drafts = validEntries.value.map((entry) => entry.draft!)
  if (!drafts.length) return

  isImporting.value = true
  const created = importProjectsFromTemplates(drafts, props.folderId ?? null)
  isImporting.value = false

  const skipped = invalidCount.value
  entries.value = []

  emit('imported', { projects: created, skipped })
  emit('update:open', false)
}

// Fresh state every time the dialog opens
watch(
  () => props.open,
  (open) => {
    if (open) {
      entries.value = []
      isImporting.value = false
    }
  },
)
</script>
