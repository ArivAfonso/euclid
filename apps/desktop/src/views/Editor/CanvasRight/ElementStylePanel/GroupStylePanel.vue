<template>
  <div class="group-style-panel space-y-2.5 ">
    <ElementPosition/>
    
    <Separator class="my-2" />

    <!-- Fill Color Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Fill
        </h3>
      </div>
      
      <div class="space-y-1">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
          <PaintBucket class="h-2.5 w-2.5" />
          Color</Label>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="w-full h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
            >
              <div class="flex items-center gap-2">
                <div 
                  class="w-4 h-4 rounded border border-border" 
                  :style="{ backgroundColor: fillColor }"
                ></div>
                <span class="text-xs font-mono">{{ toHex(fillColor) }}</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[256px]" align="end">
            <ColorPicker
              :modelValue="fillColor"
              @update:modelValue="(color: string) => updateFillColor(color)"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <Separator class="my-2" />

    <!-- Stroke/Outline Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Border
        </h3>
        <Badge
          v-if="outlineWidth"
          variant="outline"
          class="text-[10px] px-1.5 py-0 font-mono"
        >
          {{ outlineWidth }}px
        </Badge>
      </div>
      
      <div class="space-y-2">
        <!-- Stroke Style -->
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Paintbrush class="h-2.5 w-2.5" />
              Style</Label>
          <Select 
            :model-value="String(outlineStyle)" 
            @update:model-value="(val) => val && changeOutlineStyle(Number(val))"
          >
            <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0" class="text-xs py-1">Solid Border</SelectItem>
              <SelectItem value="1" class="text-xs py-1">Dashed Border</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Stroke Color -->
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Palette class="h-2.5 w-2.5" />
              Color</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="w-4 h-4 rounded border border-border" 
                    :style="{ backgroundColor: outlineColor || '#000' }"
                  ></div>
                  <span class="text-xs font-mono">{{ toHex(outlineColor || '#000') }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker
                :modelValue="outlineColor"
                @update:modelValue="(color: string) => updateOutlineColor(color)"
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Stroke Width -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Minus class="h-2.5 w-2.5" />Width</Label>
            <span class="text-[10px] font-mono text-muted-foreground">{{ outlineWidth }}px</span>
          </div>
          <SliderWithTicks 
            :model-value="[outlineWidth]"
            @update:model-value="(val) => val && (outlineWidth = val[0])"
            @value-commit="changeOutlineWidth"
            :min="0"
            :max="40"
            :step="1"
          />
        </div>
      </div>
    </div>

    <Separator class="my-2" />
    <ElementEffects />

    <Separator class="my-2" />

    <!-- Font Section (only if textbox exists) -->
    <div v-if="hasTextbox && handleTextboxElement" class="space-y-2">
      <!-- Font Selection -->
      <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Font
          </h3>
          <div class="flex items-center gap-1">
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">
              {{ Math.round(handleTextboxElement.fontSize) }}px
            </Badge>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Type class="h-2.5 w-2.5" />Family</Label>
            <VirtualizedFontSelect
              v-model="handleTextboxElement.fontFamily"
              :font-groups="fontOptionGroups"
              @update:model-value="changeFontFamily"
            />
          </div>
          
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Palette class="h-2.5 w-2.5" />Size</Label>
            <NumberComboBox
              :model-value="String(handleTextboxElement.fontSize)"
              @update:model-value="(val) => val && changeFontSize(Number(val))"
              :options="FontSizeLibs"
              placeholder="Size"
            />
          </div>
        </div>
      </div>

      <!-- Text Colors -->
      <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Text Colors
          </h3>
        </div>
        
        <div class="grid grid-cols-4 gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
                    >
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: fontColor }"></div>
                        <span class="text-xs font-mono">{{ toHex(fontColor) }}</span>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-[256px]" align="end">
                    <ColorPicker
                      :modelValue="fontColor"
                      @update:modelValue="(color: string) => updateFontColor(color)"
                    />
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Text Color</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
                    >
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: backgroundColor }"></div>
                        <span class="text-xs font-mono">{{ toHex(backgroundColor) }}</span>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-[256px]" align="end">
                    <ColorPicker
                      :modelValue="backgroundColor"
                      @update:modelValue="(color: string) => updateBackgroundColor(color)"
                    />
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Background Color</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  class="h-7 px-2 transition-all hover:bg-primary/10 hover:text-primary"
                  @click="handleElementFontsize('+')"
                >
                  <Plus class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Increase Size</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  class="h-7 px-2 transition-all hover:bg-destructive/10 hover:text-destructive"
                  @click="handleElementFontsize('-')"
                >
                  <Minus class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Decrease Size</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <!-- Text Formatting -->
      <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Style
          </h3>
        </div>
        
        <div class="grid grid-cols-4 gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  :class="[
                    'h-7 px-2 transition-all',
                    hasFontWeight ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                  ]"
                  @click="handleElementBold()"
                >
                  <Bold class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Bold</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  :class="[
                    'h-7 px-2 transition-all',
                    hasFontStyle ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                  ]"
                  @click="handleElementItalic()"
                >
                  <Italic class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Italic</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  :class="[
                    'h-7 px-2 transition-all',
                    hasUnderline ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                  ]"
                  @click="handleElementUnderline()"
                >
                  <Underline class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Underline</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  :class="[
                    'h-7 px-2 transition-all',
                    hasLinethrough ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                  ]"
                  @click="handleElementLinethrough()"
                >
                  <Strikethrough class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Strikethrough</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <!-- Text Orientation & Spacing -->
      <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Layout
          </h3>
        </div>
        
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><ArrowUpDown class="h-2.5 w-2.5" />Line Height</Label>
            <NumberComboBox
              :model-value="handleTextboxElement.lineHeight?.toString() ?? ''"
              @update:model-value="(val) => { if (val) { const num = parseFloat(val); changeLineHeight(num); } }"
              :options="LineHeightLibs"
              placeholder="Line height"
            />
          </div>
          
          <div class="space-y-1">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><IndentIncrease class="h-2.5 w-2.5" />Char Spacing</Label>
            <NumberComboBox
              :model-value="handleTextboxElement.charSpacing?.toString() ?? ''"
              @update:model-value="(val) => { if (val) { const num = parseInt(val); changeCharSpacing(num); } }"
              :options="CharSpaceLibs"
              placeholder="Char spacing"
              integer
            />
          </div>
        </div>
      </div>

      <!-- Text Alignment -->
      <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Alignment
          </h3>
        </div>
        
        <div class="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  class="flex-1 h-7 px-2"
                  @click="updateTextAlign('left')"
                >
                  <AlignLeft class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Align Left</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  class="flex-1 h-7 px-2"
                  @click="updateTextAlign('center')"
                >
                  <AlignCenter class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Align Center</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="outline"
                  class="flex-1 h-7 px-2"
                  @click="updateTextAlign('right')"
                >
                  <AlignRight class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                <p>Align Right</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { FontSizeLibs, LineHeightLibs, CharSpaceLibs } from '@/configs/texts'
import { ElementNames, FontGroupOption } from '@/types/elements'
import { CanvasElement, GroupElement, ImageElement, PathElement, TextboxElement } from '@/types/canvas'
import type { ActiveSelection } from 'fabric'
import ElementPosition from '../Components/ElementPosition.vue'
import ElementEffects from '../Components/ElementEffects.vue'
import VirtualizedFontSelect from '@/components/VirtualizedFontSelect.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import { toHex } from '@/utils/color'
import useCanvas from '@/views/Canvas/useCanvas'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Type, Highlighter, Plus, Minus, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Strikethrough, Palette, ArrowUpDown, IndentIncrease } from 'lucide-vue-next'
import { SnapshotType } from '@/types/history'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { propertiesToInclude } from "@/configs/canvas"
import { useTemplatesStore } from '@/store'

const mainStore = useMainStore()
const { canvasObject, fontGroups } = storeToRefs(mainStore)
const [ canvas ] = useCanvas()
const { addHistorySnapshot } = useHistorySnapshot()
const templatesStore = useTemplatesStore()
const { templateId } = storeToRefs(templatesStore)

const recentFontsKey = computed(() => `euclid-recent-fonts-${templateId.value || 'default'}`)
const recentFontsVersion = ref(0)
const recentFonts = computed({
  get: () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _trigger = recentFontsVersion.value
    const stored = localStorage.getItem(recentFontsKey.value)
    if (stored) {
      try {
        return JSON.parse(stored) as string[]
      } catch {
        return []
      }
    }
    return []
  },
  set: (value: string[]) => {
    localStorage.setItem(recentFontsKey.value, JSON.stringify(value))
    recentFontsVersion.value++
  }
})

const documentFonts = computed(() => {
  if (!canvas) return []
  const fonts = new Set<string>()
  
  const traverse = (objects: any[]) => {
    objects.forEach(obj => {
      if ((obj.type === ElementNames.TEXTBOX || obj.type === ElementNames.TEXT || obj.type === ElementNames.ITEXT) && obj.fontFamily) {
        fonts.add(obj.fontFamily)
      }
      if (obj._objects) {
        traverse(obj._objects)
      }
    })
  }
  
  traverse(canvas.getObjects())
  return Array.from(fonts)
})

const fontOptionGroups = computed<FontGroupOption[]>(() => {
  const baseGroups = fontGroups.value.map(g => ({ ...g, options: [...g.options] }))
  
  const uniqueRecent = new Set([...recentFonts.value, ...documentFonts.value])
  const recentOptions = Array.from(uniqueRecent).slice(0, 10).map(family => ({
      label: family,
      value: family
  }))
  
  if (recentOptions.length > 0) {
      return [{
          label: 'Recently Used',
          options: recentOptions
      }, ...baseGroups]
  }
  
  return baseGroups
})

type GroupLikeElement = GroupElement | ActiveSelection

const handleGroupElement = computed<GroupLikeElement | undefined>(() => {
  const element = canvasObject.value
  if (!element) return undefined
  const normalizedType = ((element.name ?? element.type) ?? '').toString().toLowerCase()
  if (normalizedType !== ElementNames.GROUP && normalizedType !== ElementNames.ACTIVE) return undefined
  return element as GroupLikeElement
})
const handleTextboxElement = computed(() => {
  if (!handleGroupElement.value) return
  if (!handleGroupElement.value._objects) return
  const textboxElements = handleGroupElement.value._objects.filter(obj => obj.type === ElementNames.TEXTBOX)
  return textboxElements[0] as TextboxElement
})
const handleOutlineElement = computed(() => {
  if (!handleGroupElement.value) return
  if (!handleGroupElement.value._objects) return
  const outlineElements = handleGroupElement.value._objects.filter(obj => obj.type === ElementNames.IMAGE || obj.type === ElementNames.PATH)
  return outlineElements[0] as ImageElement | PathElement
})
const hasTextbox = computed(() => handleTextboxElement.value ? true : false)

const fillColor = ref('#fff')
const outlineColor = ref('#fff')
const fontColor = ref('#fff')
const backgroundColor = ref('#fff')

const outlineStyle = ref(0)
const outlineWidth = ref(0)

// Initialize values when element changes
watch(
  () => handleGroupElement.value,
  (element) => {
    if (!element) return
    
    // Initialize fill color from first element
    if (element._objects && element._objects.length > 0) {
      const firstObj = element._objects[0] as CanvasElement
      fillColor.value = (firstObj.fill as string) || '#fff'
    }
    
    // Initialize outline values
    if (handleOutlineElement.value) {
      outlineColor.value = (handleOutlineElement.value.stroke as string) || '#000'
      outlineWidth.value = handleOutlineElement.value.strokeWidth || 0
    }
    
    // Initialize text colors
    if (handleTextboxElement.value) {
      fontColor.value = (handleTextboxElement.value.fill as string) || '#000'
      backgroundColor.value = handleTextboxElement.value.backgroundColor || 'transparent'
    }
  },
  { immediate: true }
)


// Modify font size
const handleElementFontsize = (mode: string) => {
  if (!handleGroupElement.value) return
  if (mode === '+') {
    handleGroupElement.value._objects.forEach(obj => {
      if (obj.type === ElementNames.TEXTBOX) {
        const textbox = obj as TextboxElement
        const fontSize = textbox.fontSize ? textbox.fontSize : 36
        textbox.set({fontSize: fontSize + 1})
      }
    })
  }
  else {
    handleGroupElement.value._objects.forEach(obj => {
      if (obj.type === ElementNames.TEXTBOX) {
        const textbox = obj as TextboxElement
        const fontSize = textbox.fontSize ? textbox.fontSize : 36
        textbox.set({fontSize: fontSize - 1})
      }
    })
  }
  canvas.renderAll()
}

// Update fill color
const updateFillColor = (color: string) => {
  fillColor.value = color
  if (!handleGroupElement.value) return

  const originalObjects = handleGroupElement.value.toObject(propertiesToInclude).objects

  const setFill = (groupElement: GroupLikeElement) => {
    groupElement._objects.forEach(obj => {
      const normalizedType = obj.type ? obj.type.toLowerCase() : ''
      if (normalizedType === ElementNames.GROUP || normalizedType === ElementNames.ACTIVE) {
        setFill(obj as GroupLikeElement)
        return
      }
      const canvasElement = obj as CanvasElement
      canvasElement.fill = color
    })
  }
  setFill(handleGroupElement.value)
  canvas.renderAll()

  const target = handleGroupElement.value.toObject(propertiesToInclude)
  const index = canvas._objects.findIndex(item => item.id === target.id)
  
  addHistorySnapshot({
    type: SnapshotType.MODIFY,
    index,
    target,
    transform: { original: { objects: originalObjects } } as any,
    tid: templateId.value
  })
}

// Update font color
const updateFontColor = (color: string) => {
  fontColor.value = color
  if (!handleGroupElement.value) return

  const originalObjects = handleGroupElement.value.toObject(propertiesToInclude).objects

  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({fill: color})
    }
  })
  canvas.renderAll()

  const target = handleGroupElement.value.toObject(propertiesToInclude)
  const index = canvas._objects.findIndex(item => item.id === target.id)
  
  addHistorySnapshot({
    type: SnapshotType.MODIFY,
    index,
    target,
    transform: { original: { objects: originalObjects } } as any,
    tid: templateId.value
  })
}

// Update background color
const updateBackgroundColor = (color: string) => {
  backgroundColor.value = color
  if (!handleGroupElement.value) return

  const originalObjects = handleGroupElement.value.toObject(propertiesToInclude).objects

  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({backgroundColor: color})
    }
  })
  canvas.renderAll()

  const target = handleGroupElement.value.toObject(propertiesToInclude)
  const index = canvas._objects.findIndex(item => item.id === target.id)
  
  addHistorySnapshot({
    type: SnapshotType.MODIFY,
    index,
    target,
    transform: { original: { objects: originalObjects } } as any,
    tid: templateId.value
  })
}

// Update font size
const changeFontSize = (fontSize: number) => {
  if (!handleTextboxElement.value || !handleGroupElement.value) return
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({fontSize})
    }
  })
  canvas.renderAll()
}

// Update font family
const changeFontFamily = (fontFamily?: string) => {
  if (!handleTextboxElement.value || !handleGroupElement.value) return
  
  // If called from event, it might pass the value. If not, use the model value.
  // The VirtualizedFontSelect emits update:modelValue which calls this function.
  // But the template says: @update:model-value="changeFontFamily"
  // VirtualizedFontSelect emits the new value.
  // So changeFontFamily should accept the value.
  
  const newFont = fontFamily || handleTextboxElement.value.fontFamily
  
  if (newFont) {
    mainStore.ensureFontLoaded(newFont)
    
    // Add to recent fonts
    const currentRecent = recentFonts.value.filter(f => f !== newFont)
    currentRecent.unshift(newFont)
    recentFonts.value = currentRecent.slice(0, 10)
  }
  
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({fontFamily: newFont})
    }
  })
  canvas.renderAll()
}

// Update outline color
const updateOutlineColor = (color: string) => {
  outlineColor.value = color
  if (!handleGroupElement.value) return

  const originalObjects = handleGroupElement.value.toObject(propertiesToInclude).objects

  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.IMAGE || obj.type === ElementNames.PATH) {
      const element = obj as ImageElement | PathElement
      element.set({stroke: color})
    }
  })
  canvas.renderAll()

  const target = handleGroupElement.value.toObject(propertiesToInclude)
  const index = canvas._objects.findIndex(item => item.id === target.id)
  
  addHistorySnapshot({
    type: SnapshotType.MODIFY,
    index,
    target,
    transform: { original: { objects: originalObjects } } as any,
    tid: templateId.value
  })
}

// Update outline width
const changeOutlineWidth = () => {
  if (!handleGroupElement.value) return
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.IMAGE || obj.type === ElementNames.PATH) {
      const element = obj as PathElement | ImageElement
      element.strokeWidth = outlineWidth.value
    }
  })
  canvas.renderAll()
}

// Update outline style
const changeOutlineStyle = (style: number) => {
  outlineStyle.value = style
  if (!handleGroupElement.value) return
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.IMAGE || obj.type === ElementNames.PATH) {
      const element = obj as PathElement | ImageElement
      if (style === 1) {
        element.strokeDashArray = [5, 5]
      } else {
        element.strokeDashArray = null
      }
    }
  })
  canvas.renderAll()
}

const hasFontWeight = computed(() => {
  if (!handleTextboxElement.value) return false
  const weight = handleTextboxElement.value.fontWeight
  return weight !== 'normal' && weight !== '400'
})
const hasFontStyle = computed(() => handleTextboxElement.value?.fontStyle !== 'normal')
const hasUnderline = computed(() => handleTextboxElement.value?.underline)
const hasLinethrough = computed(() => handleTextboxElement.value?.linethrough)

const handleElementBold = () => {
  if (!handleGroupElement.value) return
  const isBold = hasFontWeight.value
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({fontWeight: isBold ? 'normal' : 'bold'})
    }
  })
  canvas.renderAll()
}

const handleElementItalic = () => {
  if (!handleGroupElement.value) return
  const isItalic = hasFontStyle.value
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({fontStyle: isItalic ? 'normal' : 'italic'})
    }
  })
  canvas.renderAll()
}

const handleElementUnderline = () => {
  if (!handleGroupElement.value) return
  const isUnderline = hasUnderline.value
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({underline: !isUnderline})
    }
  })
  canvas.renderAll()
}

const handleElementLinethrough = () => {
  if (!handleGroupElement.value) return
  const isLinethrough = hasLinethrough.value
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({linethrough: !isLinethrough})
    }
  })
  canvas.renderAll()
}

const changeLineHeight = (lineHeight: number) => {
  if (!handleGroupElement.value) return
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({lineHeight})
    }
  })
  canvas.renderAll()
}

const changeCharSpacing = (charSpacing: number) => {
  if (!handleGroupElement.value) return
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({charSpacing})
    }
  })
  canvas.renderAll()
}

// Update text alignment
const updateTextAlign = (align: string) => {
  if (!handleGroupElement.value) return
  handleGroupElement.value._objects.forEach(obj => {
    if (obj.type === ElementNames.TEXTBOX) {
      const textbox = obj as TextboxElement
      textbox.set({textAlign: align})
    }
  })
  canvas.renderAll()
}
</script>

<style lang="scss" scoped>
.group-style-panel {
  height: 100%;
  overflow-y: auto;
}
</style>