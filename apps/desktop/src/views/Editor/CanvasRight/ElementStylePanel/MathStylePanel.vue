<template>
  <div class="space-y-3">
    <ElementPosition />
    
    <Separator class="my-2" />
    
    <!-- Math Formula Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Math Formula
        </h3>
      </div>
      
      <!-- Expression Display -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><FunctionSquare class="h-2.5 w-2.5" />Expression</Label>
        <div class="relative">
          <Input
            :model-value="mathExpression"
            readonly
            class="text-xs pr-16 font-mono"
            placeholder="No expression"
          />
          <Button
            variant="outline"
            size="sm"
            class="absolute right-1 top-1/2 -translate-y-1/2 h-6 px-2 text-[10px]"
            @click="openEditDialog"
          >
            Edit
          </Button>
        </div>
      </div>
    </div>

    <Separator class="my-2" />
    
    <!-- Appearance Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Appearance
        </h3>
      </div>
      
      <div class="space-y-2">
        <!-- Font Size -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] text-muted-foreground flex items-center gap-1"><Type class="h-2.5 w-2.5" />Font Size</Label>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ mathFontSize }}px</Badge>
          </div>
          <div class="flex items-center gap-2">
            <SliderWithTicks
              :model-value="[mathFontSize]"
              @update:model-value="updateFontSize"
              :min="12"
              :max="120"
              :step="1"
              class="flex-1"
            />
          </div>
        </div>
        
        <!-- Text Color + Background Color in one row -->
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[10px] text-muted-foreground flex items-center gap-1"><Palette class="h-2.5 w-2.5" />Text</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-7 w-full justify-start text-xs font-normal px-2 hover:bg-accent hover:text-accent-foreground"
                >
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-4 h-4 rounded border border-border"
                      :style="{ backgroundColor: mathColor }"
                    ></div>
                    <span class="text-xs font-mono">{{ toHex(mathColor) }}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[256px]" align="end">
                <ColorPicker
                  :model-value="mathColor"
                  @update:model-value="updateColor"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div class="space-y-1">
            <Label class="text-[10px] text-muted-foreground flex items-center gap-1"><Square class="h-2.5 w-2.5" />Background</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-7 w-full justify-start text-xs font-normal px-2 hover:bg-accent hover:text-accent-foreground"
                >
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-4 h-4 rounded border border-border"
                      :style="{ backgroundColor: mathBackgroundColor }"
                    ></div>
                    <span class="text-xs font-mono">{{ toHex(mathBackgroundColor) }}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[256px]" align="end">
                <ColorPicker
                  :model-value="mathBackgroundColor"
                  @update:model-value="updateBackgroundColor"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>

    <ElementBorder :hasStroke="true" />
    
    <Separator class="my-2" />
    
    <ElementShadow :hasShadow="true" />
    
    <Separator class="my-2" />
    
    <ElementOpacity />
    
    <!-- Math Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader class="border-b pb-2">
          <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Edit Math Expression
          </DialogTitle>
          <DialogDescription class="text-xs">
            Update LaTeX expression · Live preview · Quick insert templates
          </DialogDescription>
        </DialogHeader>
        
        <div class="flex-1 overflow-y-auto space-y-3 py-3">
          <!-- Expression Input & Preview in Grid -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Left: Expression Input -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground flex items-center gap-1"><FunctionSquare class="h-2.5 w-2.5" />Expression</Label>
              </div>
              <Textarea
                v-model="tempExpression"
                placeholder="e.g., E = mc^2"
                class="font-mono text-[11px] min-h-[120px] resize-none"
              />
            </div>
            
            <!-- Right: Preview -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground flex items-center gap-1"><Eye class="h-2.5 w-2.5" />Preview</Label>
                <Badge 
                  :variant="tempExpression.trim() ? 'default' : 'outline'" 
                  class="text-[9px] px-1 py-0"
                >
                  {{ tempExpression.trim() ? 'Valid' : 'Empty' }}
                </Badge>
              </div>
              <div 
                class="border border-border/50 rounded-md p-3 min-h-[120px] bg-muted/20 flex items-center justify-center text-sm"
                v-html="previewHtml"
              ></div>
            </div>
          </div>
          
          <!-- Quick Insert Section -->
          <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-1 h-1 bg-orange-500 rounded-sm"></div>
              <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><ListPlus class="h-2.5 w-2.5" />Quick Insert</Label>
            </div>
            
            <div class="grid grid-cols-6 gap-1.5 text-[10px]">
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\frac{a}{b}')"
              >
                frac
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\sqrt{x}')"
              >
                sqrt
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\sum_{i}^{n}')"
              >
                sum
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\int_{a}^{b}')"
              >
                int
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('x^{2}')"
              >
                power
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('x_{i}')"
              >
                sub
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\alpha')"
              >
                greek
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\lim')"
              >
                lim
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\frac{\\partial}{\\partial x}')"
              >
                deriv
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\begin{pmatrix}\\end{pmatrix}')"
              >
                matrix
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\pm')"
              >
                ±
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertSyntax('\\infty')"
              >
                ∞
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter class="border-t pt-2">
          <Button variant="outline" size="sm" @click="isEditDialogOpen = false">Cancel</Button>
          <Button 
            size="sm" 
            @click="saveExpression"
            :disabled="!tempExpression.trim()"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { MathElement } from '@/types/canvas'
import useCanvas from '@/views/Canvas/useCanvas'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import ElementPosition from '../Components/ElementPosition.vue'
import ElementOpacity from '../Components/ElementOpacity.vue'
import ElementBorder from '../Components/ElementBorder.vue'
import ElementShadow from '../Components/ElementShadow.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import { toHex } from '@/utils/color'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FunctionSquare, Type, Palette, Square, Eye, ListPlus } from 'lucide-vue-next'

const mainStore = useMainStore()
const { canvasObject } = storeToRefs(mainStore)
const { addHistorySnapshot } = useHistorySnapshot()
const [canvas] = useCanvas()

const handleElement = computed(() => canvasObject.value as MathElement)
const mathExpression = computed(() => handleElement.value?.mathExpression || '')
const mathColor = computed(() => handleElement.value?.mathColor || '#000000')
const mathBackgroundColor = computed(() => handleElement.value?.mathBackgroundColor || '#ffffff')
const mathFontSize = computed(() => handleElement.value?.mathFontSize || 48)

const isEditDialogOpen = ref(false)
const tempExpression = ref('')
const previewHtml = ref('')

watch(tempExpression, async (newVal) => {
  try {
    const katex = await import('katex')
    previewHtml.value = katex.default.renderToString(newVal || 'x = y', {
      throwOnError: false,
      displayMode: true,
      output: 'html'
    })
  } catch (error) {
    previewHtml.value = '<span style="color: red;">Invalid expression</span>'
  }
})

const openEditDialog = () => {
  tempExpression.value = mathExpression.value
  isEditDialogOpen.value = true
}

const insertSyntax = (syntax: string) => {
  tempExpression.value += syntax
}

const updateFontSize = async (value: number[] | undefined) => {
  if (!handleElement.value || !value || value.length === 0) return
  
  const newFontSize = value[0]
  await regenerateMathImage(mathExpression.value, mathColor.value, newFontSize, mathBackgroundColor.value)
  handleElement.value.mathFontSize = newFontSize
  canvas.renderAll()
  addHistorySnapshot()
}

const updateColor = async (color: string) => {
  if (!handleElement.value) return
  
  await regenerateMathImage(mathExpression.value, color, mathFontSize.value, mathBackgroundColor.value)
  handleElement.value.mathColor = color
  canvas.renderAll()
  addHistorySnapshot()
}

const updateBackgroundColor = async (color: string) => {
  if (!handleElement.value) return
  
  await regenerateMathImage(mathExpression.value, mathColor.value, mathFontSize.value, color)
  handleElement.value.mathBackgroundColor = color
  canvas.renderAll()
  addHistorySnapshot()
}

const saveExpression = async () => {
  if (!handleElement.value || !tempExpression.value) return
  
  await regenerateMathImage(tempExpression.value, mathColor.value, mathFontSize.value, mathBackgroundColor.value)
  handleElement.value.mathExpression = tempExpression.value
  isEditDialogOpen.value = false
  canvas.renderAll()
  addHistorySnapshot()
}

const regenerateMathImage = async (expression: string, color: string, fontSize: number, bgColor: string) => {
  try {
    const katex = await import('katex')
    const html2canvas = (await import('html2canvas')).default
    
    // Render to HTML
    const htmlString = katex.default.renderToString(expression, {
      throwOnError: false,
      displayMode: true,
      output: 'html'
    })
    
    // Create temp div
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    tempDiv.style.fontSize = `${fontSize}px`
    tempDiv.style.color = color
    tempDiv.style.backgroundColor = bgColor
    tempDiv.style.display = 'inline-block'
    tempDiv.style.padding = '10px'
    tempDiv.innerHTML = htmlString
    document.body.appendChild(tempDiv)
    
    // Wait for fonts
    await document.fonts.ready
    
    // Use html2canvas to convert
    const canvas2d = await html2canvas(tempDiv, {
      backgroundColor: bgColor,
      scale: 3,
      logging: false,
      allowTaint: false,
      useCORS: true,
    })
    
    const dataURL = canvas2d.toDataURL('image/png')
    
    document.body.removeChild(tempDiv)
    
    // Update the fabric image source
    const element = handleElement.value
    if (element) {
      await element.setSrc(dataURL, {
        crossOrigin: 'anonymous'
      })
      canvas.renderAll()
    }
  } catch (error) {
    console.error('Failed to regenerate math image:', error)
    throw error
  }
}
</script>

<style lang="scss" scoped>
:deep(.katex) {
  font-size: inherit;
}
</style>
