<template>
  <div class="flex h-full flex-col bg-white dark:bg-[hsl(0,0%,9%)]">
    <div class="border-b border-border px-3 py-2.5">
      <div class="flex items-center gap-2">
        <Shield class="size-4 text-orange-500" />
        <h2 class="text-sm font-semibold text-foreground">Admin Tools</h2>
        <Badge variant="destructive" class="text-[10px] px-1.5 py-0 select-none">DEV ONLY</Badge>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3 py-3">
      <div class="space-y-4">
        <div class="space-y-3 border border-orange-200 dark:border-orange-900/50 rounded-md p-3 bg-orange-50/50 dark:bg-orange-950/20">
          <div class="flex items-center gap-2 mb-2">
            <Download class="size-4 text-orange-600" />
            <h3 class="text-xs font-bold text-foreground uppercase tracking-wide">
              Pixelied Template Importer
            </h3>
          </div>
          
          <p class="text-[11px] text-muted-foreground">
            Import templates from Pixelied by entering a template ID. The template will be converted to Euclid format automatically.
          </p>

          <div class="space-y-2">
            <Label for="template-id" class="text-xs">Template ID</Label>
            <div class="flex gap-2">
              <Input
                id="template-id"
                v-model="templateId"
                placeholder="e.g. 608a96bff5b15259e6385a77"
                class="h-8 text-xs font-mono"
                :disabled="isLoading"
              />
              <Button 
                size="sm" 
                class="h-8 px-3"
                :disabled="!templateId.trim() || isLoading"
                @click="fetchAndPreview"
              >
                <Search v-if="!isLoading" class="size-3.5" />
                <Loader2 v-else class="size-3.5 animate-spin" />
              </Button>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="full-url" class="text-xs">Or paste full URL</Label>
            <Input
              id="full-url"
              v-model="fullUrl"
              placeholder="https://pixelied.com/api/templates/..."
              class="h-8 text-xs"
              :disabled="isLoading"
              @input="parseUrl"
            />
          </div>

          <div v-if="errorMessage" class="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle class="size-4 text-destructive shrink-0 mt-0.5" />
            <p class="text-xs text-destructive">{{ errorMessage }}</p>
          </div>

          <div v-if="previewData" class="space-y-3 pt-2 border-t border-orange-200 dark:border-orange-900/50">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold">Preview</h4>
              <Badge variant="outline" class="text-[10px]">{{ previewData.pages.length }} page(s)</Badge>
            </div>

            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Name:</span>
                <span class="font-medium">{{ previewData.template_name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Size:</span>
                <span class="font-medium">{{ previewData.canvas_doc_json.doc_width }} x {{ previewData.canvas_doc_json.doc_height }}px</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Objects:</span>
                <span class="font-medium">{{ totalObjects }}</span>
              </div>
            </div>

            <div v-if="previewData.thumbnail_url" class="relative rounded-md overflow-hidden border border-border aspect-video bg-muted/30">
              <img 
                :src="previewData.thumbnail_url" 
                :alt="previewData.template_name"
                class="w-full h-full object-contain"
                @error="handleImageError"
              />
            </div>

            <Button 
              class="w-full h-9" 
              :disabled="isApplying"
              @click="applyTemplate"
            >
              <Loader2 v-if="isApplying" class="mr-2 size-4 animate-spin" />
              <Check v-else class="mr-2 size-4" />
              {{ isApplying ? 'Applying...' : 'Apply Template to Canvas' }}
            </Button>
          </div>
        </div>

        <div class="space-y-3 border border-border/50 rounded-md p-3 bg-muted/20">
          <div class="flex items-center gap-2 mb-2">
            <FileJson class="size-4 text-blue-600" />
            <h3 class="text-xs font-bold text-foreground uppercase tracking-wide">
              Debug Tools
            </h3>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            class="w-full h-8 text-xs"
            @click="exportCurrentTemplate"
          >
            <Copy class="mr-2 size-3.5" />
            Copy Current Template JSON
          </Button>
        </div>

        <div class="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
          <AlertTriangle class="size-4 text-amber-600 shrink-0 mt-0.5" />
          <p class="text-[11px] text-amber-800 dark:text-amber-200">
            This admin section is for development purposes only. Remove before production deployment.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { 
  Shield, 
  Download, 
  Search, 
  Loader2, 
  AlertCircle, 
  Check, 
  FileJson, 
  Copy, 
  Terminal,
  AlertTriangle 
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { useTemplatesStore } from '@/store'
import { storeToRefs } from 'pinia'
import { 
  fetchPixeliedTemplate, 
  convertPixeliedToEuclid,
  type PixeliedTemplate 
} from '@/utils/pixeliedConverter'

const templatesStore = useTemplatesStore()
const { currentTemplate } = storeToRefs(templatesStore)

const templateId = ref('')
const fullUrl = ref('')
const isLoading = ref(false)
const isApplying = ref(false)
const errorMessage = ref('')
const previewData = ref<PixeliedTemplate | null>(null)

const totalObjects = computed(() => {
  if (!previewData.value) return 0
  return previewData.value.pages.reduce((sum, page) => {
    return sum + (page.page_editor_json?.objects?.length || 0)
  }, 0)
})

const parseUrl = () => {
  const url = fullUrl.value.trim()
  if (!url) return
  
  const match = url.match(/templates\/([a-f0-9]{24})/i)
  if (match) {
    templateId.value = match[1]
  }
}

const fetchAndPreview = async () => {
  const id = templateId.value.trim()
  if (!id) return

  isLoading.value = true
  errorMessage.value = ''
  previewData.value = null

  try {
    const data = await fetchPixeliedTemplate(id)
    previewData.value = data
    toast({ title: 'Template fetched successfully' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch template'
    errorMessage.value = message
    toast({ 
      variant: 'destructive', 
      title: 'Error', 
      description: message 
    })
  } finally {
    isLoading.value = false
  }
}

const applyTemplate = async () => {
  if (!previewData.value) return

  isApplying.value = true

  try {
    const templates = convertPixeliedToEuclid(previewData.value)
    
    if (templates.length === 0) {
      throw new Error('No pages found in template')
    }

    if (templates.length === 1) {
      await templatesStore.changeTemplate(templates[0])
    } else {
      await templatesStore.changeTemplate(templates)
    }

    toast({ 
      title: 'Template applied successfully',
      description: `Imported ${templates.length} page(s) with ${totalObjects.value} objects`
    })

    templateId.value = ''
    fullUrl.value = ''
    previewData.value = null
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply template'
    errorMessage.value = message
    toast({ 
      variant: 'destructive', 
      title: 'Error', 
      description: message 
    })
  } finally {
    isApplying.value = false
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const exportCurrentTemplate = async () => {
  try {
    const json = JSON.stringify(currentTemplate.value, null, 2)
    await navigator.clipboard.writeText(json)
    toast({ title: 'Template JSON copied to clipboard' })
  } catch (error) {
    toast({ 
      variant: 'destructive', 
      title: 'Error', 
      description: 'Failed to copy to clipboard' 
    })
  }
}
</script>
