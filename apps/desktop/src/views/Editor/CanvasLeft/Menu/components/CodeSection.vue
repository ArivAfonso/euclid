<template>
  <div class="flex h-full flex-col  bg-white dark:bg-[hsl(0,0%,9%)]">
    <div class="flex-1 overflow-y-auto px-3 py-3">
      <div class="space-y-2.5">
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Content
            </h3>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">QR Code</Badge>
          </div>
          <Input v-model="codeContent" placeholder="Enter content" class="h-8 text-xs" />
        </div>

        <Separator />

        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Style
            </h3>
            <Badge variant="secondary" class="text-[10px] px-1.5 py-0 select-none">{{ qrPreviews.length }}</Badge>
          </div>
          
          <div class="grid grid-cols-3 gap-1.5">
            <Button
              v-for="style in qrPreviews"
              :key="style.name"
              type="button"
              variant="outline"
              class="h-auto flex-col gap-1.5 py-2 hover:bg-primary/10"
              @click="createElement(style.name as QRCodeType)"
            >
              <img :src="style.preview" :alt="style.name" class="h-16 w-full rounded border object-contain" />
              <span class="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                {{ style.name }}
              </span>
            </Button>
          </div>
        </div>

        <Separator />

        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Options
            </h3>
          </div>
          
          <div class="space-y-2.5">
            <div class="space-y-1.5">
              <Label class="text-xs font-medium text-muted-foreground">Margin</Label>
              <ToggleGroup
                v-model="codeSpaceChoice"
                type="single"
                variant="outline"
                class="grid grid-cols-2 gap-1.5"
              >
                <ToggleGroupItem value="tight" class="flex h-8 items-center justify-center text-xs">
                  None
                </ToggleGroupItem>
                <ToggleGroupItem value="standard" class="flex h-8 items-center justify-center text-xs">
                  Standard
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div class="space-y-1.5">
              <Label class="text-xs font-medium text-muted-foreground">Error Rate</Label>
              <ToggleGroup
                v-model="codeErrorChoice"
                type="single"
                variant="outline"
                class="grid grid-cols-4 gap-1.5"
              >
                <ToggleGroupItem value="0" class="flex h-8 items-center justify-center text-xs">7%</ToggleGroupItem>
                <ToggleGroupItem value="1" class="flex h-8 items-center justify-center text-xs">15%</ToggleGroupItem>
                <ToggleGroupItem value="2" class="flex h-8 items-center justify-center text-xs">25%</ToggleGroupItem>
                <ToggleGroupItem value="3" class="flex h-8 items-center justify-center text-xs">30%</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { QRCodeStyleLibs } from '@/configs/codeStyles'
import type { QRCodeType } from '@/types/canvas'
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
  CodeOption,
} from 'beautify-qrcode'
import useHandleCreate from '@/hooks/useHandleCreate'



const { createQRCodeElement } = useHandleCreate()

const codeContent = ref<string>(window.location.href)
const codeSpaceChoice = ref<'tight' | 'standard'>('tight')
const codeErrorChoice = ref<'0' | '1' | '2' | '3'>('0')

const codeSpace = computed(() => codeSpaceChoice.value === 'tight')
const codeError = computed(() => Number(codeErrorChoice.value))

const generateQRCodeMap: Record<QRCodeType, (option: CodeOption) => string> = {
  A1: rendererRect,
  A2: rendererRound,
  A3: rendererRandRound,
  SP1: rendererDSJ,
  SP2: rendererRandRect,
  SP3: rendererCircle,
  B1: renderer25D,
  C1: rendererImage,
  A_a1: rendererLine,
  A_a2: rendererLine2,
  A_b1: rendererFuncA,
  A_b2: rendererFuncB,
}

const getCodeOption = (width = 135, height = 135): CodeOption => {
  return {
    text: codeContent.value,
    width,
    height,
    correctLevel: codeError.value,
    isSpace: codeSpace.value,
  }
}

const getEncodeData = (width = 135, height = 135) => {
  const codeOption = getCodeOption(width, height)
  return encodeData(codeOption)
}

const qrPreviews = computed(() =>
  QRCodeStyleLibs.map((style) => ({
    name: style.name,
    preview: `data:image/svg+xml;base64,${btoa(generateQRCodeMap[style.name as QRCodeType](getCodeOption()))}`,
  })),
)

const createElement = (style: QRCodeType) => {
  const codeOption = getCodeOption(88, 88)
  const svgString = generateQRCodeMap[style](codeOption)
  const src = `data:image/svg+xml;base64,${btoa(svgString)}`
  const qrOption = {
    codeStyle: style,
    codeSpace: codeSpace.value,
    codeError: codeError.value,
  }
  createQRCodeElement(src, qrOption, codeContent.value)
}
</script>
