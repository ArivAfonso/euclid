<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl shadow-none select-none">
      <DialogHeader>
        <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Custom Fonts
          </DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground">
          Upload font files or folders to make them available across your projects. Supported formats: TTF, OTF, WOFF, WOFF2, ZIP archives.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 lg:grid-cols-[1fr,1.3fr]">
        <div class="space-y-3">
          <div
            class="border border-dashed border-border/60 rounded-md p-4 bg-muted/30 transition-colors"
            :class="{ 'border-primary bg-primary/5': isDragging }"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <div class="flex flex-col items-center justify-center gap-3 text-center">
              <UploadCloud class="h-8 w-8 text-primary" />
              <div class="space-y-1">
                <p class="text-xs font-semibold uppercase tracking-wide">Drag and Drop</p>
                <p class="text-[11px] text-muted-foreground">
                  Drop font files, folders, or zip archives here to import them instantly.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-2 w-full">
                <Button
                  variant="outline"
                  class="h-8 text-xs"
                  :disabled="isProcessing"
                  @click="triggerFilePicker"
                >
                  Select Font Files
                </Button>
                <Button
                  variant="outline"
                  class="h-8 text-xs"
                  :disabled="isProcessing"
                  @click="triggerDirectoryPicker"
                >
                  Select Font Folder
                </Button>
              </div>
              <p class="text-[11px] text-muted-foreground/80">
                Files remain on this device. Existing entries will be updated if you upload newer versions.
              </p>
            </div>
            <input
              ref="fileInputRef"
              class="hidden"
              type="file"
              multiple
              accept=".ttf,.otf,.woff,.woff2,.zip"
              @change="handleFileSelection"
            />
            <input
              ref="directoryInputRef"
              class="hidden"
              type="file"
              webkitdirectory
              multiple
              accept=".ttf,.otf,.woff,.woff2,.zip"
              @change="handleFileSelection"
            />
          </div>
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Preview Text</Label>
            <Input
              v-model="previewText"
              class="h-8 text-xs"
              maxlength="120"
              placeholder="The quick brown fox jumps over the lazy dog"
            />
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <Label class="text-[10px] font-bold uppercase tracking-wide">Preview Size</Label>
              <span class="text-[10px] font-mono text-muted-foreground">{{ previewFontSize }}px</span>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-7 px-2 text-xs"
                @click="previewFontSize = Math.max(12, previewFontSize - 2)"
              >
                <Minus class="h-3 w-3" />
              </Button>
              <Slider
                :model-value="[previewFontSize]"
                @update:model-value="(val) => { if (Array.isArray(val) && val.length) previewFontSize = val[0] }"
                :min="12"
                :max="72"
                :step="2"
                class="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                class="h-7 px-2 text-xs"
                @click="previewFontSize = Math.min(72, previewFontSize + 2)"
              >
                <Plus class="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div class="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Info class="h-3.5 w-3.5" />
            <span>
              Imported fonts are stored locally using IndexedDB. Clearing browser data will remove them.
            </span>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Library
            </h3>
            <Badge variant="secondary" class="text-[10px] px-1.5 py-0 select-none">
              {{ customFonts.length }} font {{ customFonts.length === 1 ? 'family' : 'families' }}
            </Badge>
          </div>

          <div v-if="isProcessing" class="border border-border/50 rounded-md p-4 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            Importing fonts… this may take a moment for large files.
          </div>

          <div v-if="!customFonts.length && !isProcessing" class="border border-border/60 rounded-md p-6 bg-muted/20 text-center text-[11px] text-muted-foreground space-y-2">
            <FolderOpen class="h-6 w-6 mx-auto text-muted-foreground/70" />
            <p>No custom fonts yet. Upload a folder or zip file to get started.</p>
          </div>

          <div v-else class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            <div
              v-for="family in customFonts"
              :key="family.family"
              class="border border-border/60 rounded-md p-3 bg-muted/10 space-y-2"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-foreground">{{ family.family }}</p>
                  <p class="text-[11px] text-muted-foreground">
                    {{ family.variants.length }} {{ family.variants.length === 1 ? 'variant' : 'variants' }} · Updated {{ formatRelativeTime(family.updatedAt) }}
                  </p>
                </div>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-destructive"
                    :disabled="isProcessing"
                    @click="removeFamily(family.family)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="variant in family.variants"
                    :key="variant.id"
                    class="flex items-center gap-1"
                  >
                    <Badge
                      variant="outline"
                      class="text-[10px] px-1.5 py-0 select-none"
                    >
                      {{ variant.weight }}
                      <span v-if="variant.style === 'italic'" class="italic ml-0.5">italic</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-5 w-5 text-muted-foreground hover:text-destructive"
                      :disabled="isProcessing"
                      @click.stop="removeVariant(variant.id)"
                    >
                      <X class="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div class="space-y-1">
                  <div
                    v-for="variant in family.variants"
                    :key="`${variant.id}-preview`"
                    class="border border-border/40 rounded-sm px-2 py-2 bg-background"
                  >
                    <div class="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{{ variant.weight }}{{ variant.style === 'italic' ? ' italic' : '' }}</span>
                      <span class="truncate max-w-[40%]">{{ variant.fileName }}</span>
                    </div>
                    <p
                      class="text-sm leading-snug"
                      :style="{
                        fontFamily: family.family,
                        fontWeight: variant.weight,
                        fontStyle: variant.style,
                        fontSize: previewFontSize + 'px',
                      }"
                    >
                      {{ previewText }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          class="h-8 text-xs"
          :disabled="isProcessing"
          @click="isOpen = false"
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/toast'
import { UploadCloud, Info, FolderOpen, Loader2, Trash2, X, Plus, Minus } from 'lucide-vue-next'
import { useMainStore } from '@/store'
import { bulkUpsertFontRecords } from '@/utils/customFontStorage'
import { createParsedFontSourcesFromFiles } from '@/utils/customFonts'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = ref(props.open ?? false)
const isDragging = ref(false)
const isProcessing = ref(false)
const previewText = ref('The quick brown fox jumps over the lazy dog.')
const previewFontSize = ref(18)
const fileInputRef = ref<HTMLInputElement | null>(null)
const directoryInputRef = ref<HTMLInputElement | null>(null)

const mainStore = useMainStore()
const { customFonts } = storeToRefs(mainStore)

const ensurePreviewFonts = (fonts = customFonts.value) => {
  if (typeof document === 'undefined') return
  fonts.forEach((family) => {
    family.variants.forEach((variant) => {
      const descriptor = variant.style === 'italic'
        ? (variant.weight === 400 ? 'italic' : `${variant.weight}italic`)
        : String(variant.weight)
      mainStore.ensureFontLoaded(family.family, descriptor)
    })
  })
}

watch(() => props.open, (value) => {
  if (value === undefined) return
  isOpen.value = value
})

watch(isOpen, (value) => {
  emit('update:open', value)
  if (value) {
    mainStore.refreshCustomFonts().then(() => {
      ensurePreviewFonts()
    })
  }
})

watch(customFonts, (fonts) => {
  if (!isOpen.value) return
  ensurePreviewFonts(fonts)
}, { immediate: true })

const triggerFilePicker = () => {
  fileInputRef.value?.click()
}

const triggerDirectoryPicker = () => {
  directoryInputRef.value?.click()
}

const resetInputs = () => {
  if (fileInputRef.value) fileInputRef.value.value = ''
  if (directoryInputRef.value) directoryInputRef.value.value = ''
}

const handleFileSelection = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) {
    resetInputs()
    return
  }
  await processFiles(Array.from(target.files))
  resetInputs()
}

const handleDragOver = () => {
  if (isProcessing.value) return
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = async (event: DragEvent) => {
  if (isProcessing.value) return
  const files = event.dataTransfer?.files
  isDragging.value = false
  if (!files?.length) return
  await processFiles(Array.from(files))
}

const processFiles = async (files: File[]) => {
  if (!files.length) return
  isProcessing.value = true

  try {
    const parsedSources = await createParsedFontSourcesFromFiles(files)
    if (!parsedSources.length) {
      toast({
        title: 'No fonts detected',
        description: 'Please ensure the archive or folder contains supported font files.',
      })
      return
    }

    await bulkUpsertFontRecords(parsedSources.map((item) => ({
      family: item.family,
      fullName: item.fullName,
      weight: item.weight,
      style: item.style,
      format: item.format,
      data: item.buffer,
      fileName: item.fileName,
    })))

    await mainStore.refreshCustomFonts()

    toast({
      title: 'Fonts imported',
      description: `Added ${parsedSources.length} font file${parsedSources.length > 1 ? 's' : ''} to your library.`,
    })
  } catch (error) {
    console.error(error)
    toast({
      title: 'Import failed',
      description: 'We could not process one or more font files. Please try again.',
      variant: 'destructive',
    })
  } finally {
    isProcessing.value = false
  }
}

const removeFamily = async (family: string) => {
  if (isProcessing.value) return
  await mainStore.removeCustomFontFamily(family)
  toast({
    title: 'Font family removed',
    description: `${family} has been removed from your custom fonts.`,
  })
}

const removeVariant = async (id: number) => {
  if (isProcessing.value) return
  await mainStore.removeCustomFontVariant(id)
  toast({
    title: 'Variant removed',
    description: 'The selected font variant has been removed.',
  })
}

const formatRelativeTime = (timestamp: number) => {
  const difference = Date.now() - timestamp
  const minutes = Math.floor(difference / (1000 * 60))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}
</script>
