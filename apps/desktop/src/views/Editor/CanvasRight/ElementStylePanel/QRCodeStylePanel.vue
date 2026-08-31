<template>
  <div class="space-y-3">
    <ElementPosition/>
    
    <!-- QR Code Style -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          QR Code Style
        </h3>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">{{ handleElement.codeOption.codeStyle }}</Badge>
      </div>
      
      <div class="overflow-x-auto pb-2">
        <div class="flex gap-2 min-w-max">
          <button
            v-for="item in QRCodeStyleLibs"
            :key="item.index"
            @click="generateQRCode(item.name as QRCodeType)"
            :class="[
              'relative flex items-center justify-center rounded-md border-2 transition-all',
              'hover:border-indigo-500/50 hover:shadow-sm',
              handleElement.codeOption.codeStyle === item.name 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-border bg-background'
            ]"
            :style="{ width: QRSize + 'px', height: QRSize + 'px' }"
          >
            <img 
              v-if="item.name !== 'C2'" 
              :src="`data:image/svg+xml;base64,` + getC2QRcode(item.name)" 
              :alt="item.name"
              class="w-full h-full object-contain p-2"
            >
            <span class="absolute bottom-1 right-1 text-[9px] font-mono bg-background/80 px-1 rounded border border-border">
              {{ item.name }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- QR Code Content -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Content
        </h3>
      </div>
      
      <Input 
        v-model="handleElement.codeContent" 
        @change="updateCodeContent"
        @keydown.stop
        placeholder="Enter QR code content"
        class="h-8 text-xs"
      />
    </div>

    <!-- QR Code Padding -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Padding
        </h3>
      </div>
      
      <div class="flex gap-1.5">
        <Button
          v-for="option in paddingOptions"
          :key="option.value"
          @click="handleElement.codeOption.codeSpace = option.value; updateCodeSpace()"
          :variant="handleElement.codeOption.codeSpace === option.value ? 'default' : 'outline'"
          size="sm"
          class="flex-1 h-7 text-xs"
        >
          {{ option.label }}
        </Button>
      </div>
    </div>

    <!-- Error Correction Level -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Error Correction
        </h3>
        <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">
          {{ errorLevelOptions.find(opt => opt.value === handleElement.codeOption.codeError)?.label }}
        </Badge>
      </div>
      
      <div class="grid grid-cols-4 gap-1.5">
        <Button
          v-for="option in errorLevelOptions"
          :key="option.value"
          @click="handleElement.codeOption.codeError = option.value; updateCodeError()"
          :variant="handleElement.codeOption.codeError === option.value ? 'default' : 'outline'"
          size="sm"
          class="h-7 text-xs"
        >
          {{ option.label }}
        </Button>
      </div>
    </div>

    <ElementOutline />
    <ElementShadow :hasShadow="hasShadow" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useTemplatesStore } from '@/store'
import { QRCodeStyleLibs } from '@/configs/codeStyles'
import { 
  encodeData,
  renderer25D,
  rendererRect,
  rendererRound,
  rendererRandRound,
  rendererDSJ,
  rendererRandRect,
  rendererImage,
  rendererCircle,
  rendererLine,
  rendererLine2,
  rendererFuncA,
  rendererFuncB,
  CodeOption
} from 'beautify-qrcode'
import { QRCodeElement, QRCodeType } from '@/types/canvas'
import useCanvas from '@/views/Canvas/useCanvas'
import ElementPosition from '../Components/ElementPosition.vue'
import ElementOutline from '../Components/ElementOutline.vue'
import ElementShadow from '../Components/ElementShadow.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const QRSize = ref(100)
const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const [ canvas ] = useCanvas()
const { canvasObject } = storeToRefs(mainStore)

const paddingOptions = [
  { value: true, label: 'No Padding' },
  { value: false, label: 'Standard' }
]

const errorLevelOptions = [
  { value: '0', label: '7%' },
  { value: '1', label: '15%' },
  { value: '2', label: '25%' },
  { value: '3', label: '30%' }
]

const generateQRCodeMap = {
  'A1': rendererRect,
  'A2': rendererRound,
  'A3': rendererRandRound,
  'SP1': rendererDSJ,
  'SP2': rendererRandRect,
  'SP3': rendererCircle,
  'B1': renderer25D,
  'C1': rendererImage,
  'A_a1': rendererLine,
  'A_a2': rendererLine2,
  'A_b1': rendererFuncA,
  'A_b2': rendererFuncB,
}

const handleElement = computed(() => canvasObject.value as QRCodeElement)
const hasShadow = computed(() => handleElement.value.shadow ? true : false)

// Update QR code content
const updateCodeContent = () => {
  generateQRCode()
}

// Update code padding
const updateCodeSpace = () => {
  generateQRCode()
}

// Update error correction level
const updateCodeError = () => {
  generateQRCode()
}

// Get encode data for QR code
const getEncodeData = (width = QRSize.value, height = QRSize.value) => {
  const codeOption: CodeOption = {
    text: handleElement.value.codeContent,
    width,
    height,
    correctLevel: Number(handleElement.value.codeOption.codeError),
    isSpace: handleElement.value.codeOption.codeSpace
  }
  return encodeData(codeOption)
}

const getC2QRcode = (name: string) => {
  return btoa(generateQRCodeMap[name as QRCodeType](getEncodeData()))
}

const generateQRCode = async (style?: QRCodeType) => {
  const encodeData = getEncodeData()
  if (style) handleElement.value.codeOption.codeStyle = style
  if (!encodeData) return
  const codeStyle = handleElement.value.codeOption.codeStyle as QRCodeType
  const src = `data:image/svg+xml;base64,` + btoa(generateQRCodeMap[codeStyle](encodeData))
  const qrcodeElement = canvasObject.value as QRCodeElement
  await qrcodeElement.setSrc(src)
  templatesStore.modifedElement(qrcodeElement, { src })
  canvas.renderAll()
}
</script>

<style lang="scss" scoped>
// Compact shadcn styling - minimal custom styles needed
</style>