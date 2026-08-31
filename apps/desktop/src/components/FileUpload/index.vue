<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent class="sm:max-w-[35%]">
      <DialogHeader>
        <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Import files
          </DialogTitle>
      </DialogHeader>
      
      <div class="upload-demo relative">
        <div v-if="uploading" class="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>Uploading...</span>
          </div>
        </div>
        <div 
          class="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary transition-colors"
          @click="triggerFileInput"
          @drop.prevent="handleDrop"
          @dragover.prevent
        >
          <UploadCloud :size="50" class="mb-4 text-muted-foreground" />
          <div class="text-center">
            <p class="text-sm text-muted-foreground">
              Drag files here or <span class="text-primary cursor-pointer">select files to upload</span>
            </p>
            <p class="text-xs text-muted-foreground mt-2">
              Supports PSD / PDF / SVG / CDR and image formats
            </p>
          </div>
          <input 
            ref="fileInputRef" 
            type="file" 
            :accept="fileAccept" 
            class="hidden" 
            @change="handleFileSelect"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { propertiesToInclude, WorkSpaceDrawData } from '@/configs/canvas'
import useCanvasScale from '@/hooks/useCanvasScale'
import useHandleCreate from '@/hooks/useHandleCreate'
import useHandleTemplate from '@/hooks/useHandleTemplate'
import { useTemplatesStore } from '@/store'
import { Template } from "@/types/canvas"
import { getImageDataURL, getImageText } from '@/utils/image'
import useCanvas from '@/views/Canvas/useCanvas'
import { UploadCloud } from 'lucide-vue-next'
import { Object as FabricObject, Image, loadSVGFromString } from 'fabric'
import { nanoid } from 'nanoid'
import { ref, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'


const templatesStore = useTemplatesStore()
const { setCanvasTransform } = useCanvasScale()
const { createImageElement, createVideoElement } = useHandleCreate()
const { addTemplate } = useHandleTemplate()
const dialogVisible = ref(false)
const uploading = ref(false)
const fileAccept = ref('.pdf,.psd,.cdr,.ai,.svg,.jpg,.jpeg,.png,.webp,.gif,.json,.mp4')
const fileInputRef = ref<HTMLInputElement>()
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  (event: 'close'): void
}>()

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val && fileInputRef.value) {
    fileInputRef.value.value = ''
  }
})

const closeUpload = () => {
  emit('close')
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await uploadHandle(target.files[0])
  }
}

const handleDrop = async (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    await uploadHandle(event.dataTransfer.files[0])
  }
}

const generateSVGTemplate = async (dataText: string) => {
  const content = await loadSVGFromString(dataText)
  const options = content.options
  const svgData: any[] = []
  content.objects.slice(0, 1000).forEach(ele => svgData.push((ele as FabricObject).toObject(propertiesToInclude)))
  WorkSpaceDrawData.width = options.width
  WorkSpaceDrawData.height = options.height
  const emptyTemplate: Template = {
    id: nanoid(10),
    version: '6.12',
    zoom: 1,
    width: options.width,
    height: options.height,
    clip: 2,
    objects: [WorkSpaceDrawData, ...svgData],
    workSpace: {
      fillType: 0,
      left: 0,
      top: 0,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
    }
  }
  return emptyTemplate
}

const uploadHandle = async (file: File) => {
  const [ canvas ] = useCanvas()
  const filename = file.name
  const fileSuffix = filename.split('.').pop() ?? ''
  if (!fileAccept.value.split(',').includes(`.${fileSuffix}`)) return
  if (fileSuffix === 'svg') {
    const dataText = await getImageText(file)
    const emptyTemplate = await generateSVGTemplate(dataText)
    await templatesStore.addTemplate(emptyTemplate)
    setCanvasTransform()
    emit('close')
    return
  }
  if (fileSuffix === 'json') {
    const dataText = await getImageText(file)
    const template = JSON.parse(dataText)
    addTemplate(template)
    emit('close')
    return
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileSuffix)) {
    const dataURL = await getImageDataURL(file)
    createImageElement(dataURL)
    emit('close')
    return
  }
  if (['mp4'].includes(fileSuffix)) {
    const dataURL = URL.createObjectURL(file)
    createVideoElement(dataURL)
    emit('close')
    return
  }
  uploading.value = false
}

const setImageMask = (image: Image) => {
  if (!image.mask) return
  // const [ pixi ] = usePixi()
  // pixi.postMessage({
  //   id: image.id,
  //   type: "mask", 
  //   src: image.getSrc(),
  //   mask: JSON.stringify(image.mask), 
  //   width: image.width, 
  //   height: image.height
  // });
}

</script>
