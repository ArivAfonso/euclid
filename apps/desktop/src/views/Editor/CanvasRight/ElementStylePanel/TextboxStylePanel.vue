<template>
  <div class="text-style-panel space-y-3">
    <ElementPosition/>
    
    <Separator class="my-2" />
    
    <!-- Font Selection Section -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Font
        </h3>
        
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
            <Type class="h-2.5 w-2.5" />
            Family
          </Label>
          <VirtualizedFontSelect
            v-model="elementFontFamily"
            :font-groups="fontOptionGroups"
            @update:model-value="(val) => val && handleElementFontFamily(val)"
          />
        </div>
        
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
            <Palette class="h-2.5 w-2.5" />
            Size
          </Label>
          <NumberComboBox
            :model-value="String(handleElement.fontSize)"
            @update:model-value="(val) => val && handleElementFontSize(val)"
            :options="FontSizeLibs"
            placeholder="Size"
          />
        </div>
      </div>

      <div class="space-y-1" v-if="availableFontWeights.length > 1">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
          <Weight class="h-2.5 w-2.5" />
          Weight
        </Label>
        <Select 
          :model-value="getCurrentFontWeight()" 
          @update:model-value="(val) => val && handleElementFontWeight(val as string)"
        >
          <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
            <SelectValue placeholder="Select weight" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="item in availableFontWeights" 
              :key="item.value" 
              :value="item.value"
              class="text-xs py-1"
            >
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <Separator /> 
    
    <!-- Color & Size Controls -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Colors
        </h3>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground select-none flex items-center gap-1">
            <Type class="h-2.5 w-2.5" />
            Text</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-7 w-full px-2 justify-start transition-all border-border/60 bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: handleElement.color || '#000000' }"></div>
                  <span class="text-xs font-mono">{{ toHex(handleElement.color || '#000000') }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker :modelValue="handleElement.color" @update:modelValue="(color: string) => updateFontColor(color)"/>
            </PopoverContent>
          </Popover>
        </div>

        <div class="space-y-1">
          <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground select-none flex items-center gap-1">
            <Square class="h-2.5 w-2.5" />
            Background</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-7 w-full px-2 justify-start transition-all border-border/60 bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: elementBackgrounColor }"></div>
                  <span class="text-xs font-mono">{{ toHex(elementBackgrounColor) }}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[256px]" align="end">
              <ColorPicker :modelValue="elementBackgrounColor" @update:modelValue="(color: string) => updateBackgroundColor(color)"/>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>

    <Separator />

    <!-- Text Style -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          TEXT STYLE
        </h3>
      </div>

      <div class="space-y-3">
        <!-- Style -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground select-none flex items-center gap-1">
              <Paintbrush class="h-2.5 w-2.5" />
              Style</Label>
          </div>

          <div class="grid grid-cols-5 gap-1">
            <!-- Emoji Button -->
            <Popover v-model:open="isEmojiPickerOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="h-7 px-2 transition-all hover:bg-primary/10 hover:text-primary"
                  title="Insert Emoji"
                >
                  <Smile class="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[340px] p-0" align="end" side="left">
                <EmojiPicker @select="onEmojiSelect" />
              </PopoverContent>
            </Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    :class="[
                      'h-7 px-2 transition-all',
                      hasFontWeight ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    ]"
                    @click="handleElementBlod()"
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

        <!-- Layout -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Layout class="h-2.5 w-2.5" />
              Layout</Label>
          </div>

          <div class="grid grid-cols-4 gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    :class="[
                      'h-7 px-2 transition-all',
                      elementGrapheme ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    ]"
                    @click="handleElementArrange(false)"
                  >
                    <MoveHorizontal class="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Horizontal</p>
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
                      !elementGrapheme ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    ]"
                    @click="handleElementArrange(true)"
                  >
                    <MoveVertical class="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Vertical</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-7 px-2 transition-all hover:bg-destructive/10 hover:text-destructive"
                    @click="handleElementCharSpacing('-')"
                  >
                    <IndentDecrease class="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Decrease Indent</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-7 px-2 transition-all hover:bg-primary/10 hover:text-primary"
                    @click="handleElementCharSpacing('+')"
                  >
                    <IndentIncrease class="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Increase Indent</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <!-- Align -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground select-none flex items-center gap-1">
              <AlignLeft class="h-2.5 w-2.5" />
              Align</Label>
          </div>

          <div class="grid grid-cols-4 gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    :class="[
                      'h-7 px-2 transition-all',
                      textAlign === 'justify-left' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    ]"
                    @click="handleTextAlign('justify-left')"
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
                    :class="[
                      'h-7 px-2 transition-all',
                      textAlign === 'justify-center' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    ]"
                    @click="handleTextAlign('justify-center')"
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
                    :class="[
                      'h-7 px-2 transition-all',
                      textAlign === 'justify-right' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    ]"
                    @click="handleTextAlign('justify-right')"
                  >
                    <AlignRight class="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Align Right</p>
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
                      textAlign === 'justify' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    ]"
                    @click="handleTextAlign('justify')"
                  >
                    <AlignJustify class="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Justify</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <!-- Advanced -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground select-none flex items-center gap-1">
              <Settings class="h-2.5 w-2.5" />
              Advanced</Label>
          </div>

          <div class="grid grid-cols-2 gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-7 text-[11px] font-semibold transition-all hover:bg-primary/10 hover:text-primary"
                    @click="handleElementVector"
                  >
                    <Spline class="h-3.5 w-3.5 mr-1.5" />
                    To Vector
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Convert to Vector</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    :class="[
                      'h-7 text-[11px] font-semibold transition-all',
                      handleElement.type.toLowerCase() === ElementNames.ARCTEXT ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                    ]"
                    @click="handleElementDeformation"
                  >
                    <WavesLadder class="h-3.5 w-3.5 mr-1.5" />
                    Arc Text
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Transform to Arc</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div v-show="handleElement.type.toLowerCase() === ElementNames.ARCTEXT" class="space-y-2 pt-2 border-t border-border/50">
            <div class="flex items-center gap-1.5">
              <SliderWithTicks
                :min="-1000"
                :max="1000"
                :step="1"
                :model-value="[(handleElement as ArcText).radius]"
                @update:model-value="(val) => {
                  if (!val) return;
                  let r = val[0];
                  // Avoid the zero deadzone where curvature becomes infinite
                  if (Math.abs(r) < 66) r = r >= 0 ? 66 : -66;
                  (handleElement as ArcText).radius = r;
                  changeArcTextRadius(r);
                }"
                class="flex-1"
              />
            </div>
          </div>
        </div>

        <!-- Spacing -->
        <div class="space-y-1.5">

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <ArrowUpDown class="h-2.5 w-2.5" />
                Line Height</Label>
              <NumberComboBox
                :model-value="handleElement.lineHeight?.toString() ?? ''"
                @update:model-value="(val) => { if (val) { const num = parseFloat(val); handleElement.lineHeight = num; changeLineHeight(num); } }"
                :options="LineHeightLibs"
                placeholder="Line height"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <IndentIncrease class="h-2.5 w-2.5" />
                Char Spacing</Label>
              <NumberComboBox
                :model-value="handleElement.charSpacing?.toString() ?? ''"
                @update:model-value="(val) => { if (val) { const num = parseInt(val); handleElement.charSpacing = num; changeCharSpacing(num); } }"
                :options="CharSpaceLibs"
                placeholder="Char spacing"
                integer
              />
            </div>
          </div>
        </div>

        <!-- Fill -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground select-none flex items-center gap-1">
              <PaintBucket class="h-2.5 w-2.5" />
              Fill</Label>
          </div>

          <ElementFill embedded />
        </div>
      </div>
    </div>
    
    <Separator class="my-2" />
    
    <ElementEffects />
    
    <Separator class="my-2" />
    
    <ElementBorder :hasStroke="hasStroke" />
    
    <Separator class="my-2" />
    
    <ElementShadow :hasShadow="hasShadow" />
    
    <Separator class="my-2" />
    
    <ElementOpacity />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useMainStore, useTemplatesStore } from '@/store'
import { storeToRefs } from 'pinia'
import { FabricObject, IText, Textbox } from 'fabric'
import { FontSizeLibs, LineHeightLibs, CharSpaceLibs } from '@/configs/texts'
import { propertiesToInclude } from '@/configs/canvas'
import { TextboxElement } from '@/types/canvas'
import { ElementNames, FontGroupOption } from '@/types/elements'
import { loadFont } from '@/utils/fonts'
import { fetchGoogleFontBinary } from '@/utils/googleFonts'
import { getAvailableFontWeights, getWeightName } from '@/configs/fonts'
import { nanoid } from 'nanoid'
import { ArcText } from '@/extension/object/ArcText'
import { CurvedText } from '@/extension/object/CurvedText'
import { VerticalText } from '@/extension/object/VerticalText'
import opentype from "opentype.js"
import ElementPosition from '../Components/ElementPosition.vue'
import ElementBorder from '../Components/ElementBorder.vue'
import ElementShadow from '../Components/ElementShadow.vue'
import ElementOpacity from '../Components/ElementOpacity.vue'
import ElementEffects from '../Components/ElementEffects.vue'
import ElementFill from '../Backgrounds/ElementFill.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import EmojiPicker from '@/components/EmojiPicker/EmojiPicker.vue'
import useEmojiInsert from '@/hooks/useEmojiInsert'
import { toHex } from '@/utils/color'
import VirtualizedFontSelect from '@/components/VirtualizedFontSelect.vue'
import { throttledRender } from '@/utils/canvasRender'
import useHandleCreate from "@/hooks/useHandleCreate"
import useCanvas from '@/views/Canvas/useCanvas'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'

// lucide-vue-next icons
import { 
  Type,
  Palette,
  Plus,
  Minus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MoveHorizontal,
  MoveVertical,
  IndentDecrease,
  IndentIncrease,
  Spline,
  WavesLadder,
  Weight,
  Smile,
  PaintBucket,
  Layout,
  Settings,
  ArrowUpDown,
  Paintbrush,
  Square
} from 'lucide-vue-next'



const mainStore = useMainStore()
const templatesStore = useTemplatesStore()
const { canvasObject, fontGroups } = storeToRefs(mainStore)
const { templateId } = storeToRefs(templatesStore)
const { createPathElement } = useHandleCreate()
const [ canvas ] = useCanvas()

// Emoji picker
const { insertEmoji } = useEmojiInsert()
const isEmojiPickerOpen = ref(false)
const onEmojiSelect = (emoji: string) => {
  insertEmoji(emoji)
  isEmojiPickerOpen.value = false
}

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

const handleElement = computed(() => canvasObject.value as Textbox | ArcText)
const elementGrapheme = computed(() => handleElement.value.type.toLowerCase() !== ElementNames.VERTICALTEXT)
const elementBackgrounColor = computed(() => {
  const element = handleElement.value
  if (element.type.toLowerCase() === ElementNames.ARCTEXT) {
    return element.textBackgroundColor
  }
  return (element as Textbox).textBackgroundColor || element.backgroundColor
})
const hasFontFamily = computed(() => handleElement.value.fontFamily)
const hasFontWeight = computed(() => {
  const weight = handleElement.value.fontWeight
  return weight !== 'normal' && weight !== '400'
})
const hasFontStyle = computed(() => handleElement.value.fontStyle !== 'normal')
const hasUnderline = computed(() => handleElement.value.underline)
const hasLinethrough = computed(() => handleElement.value.linethrough)
const textAlign = computed(() => handleElement.value.textAlign)
const hasStroke = computed(() => handleElement.value.stroke ? true : false)
const hasShadow = computed(() => handleElement.value.shadow ? true : false)
const elementFontFamily = ref<string>(hasFontFamily.value)
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
const currentCustomFont = computed(() => mainStore.customFontByFamily(handleElement.value.fontFamily))
const customFontWeightOptions = computed(() => {
  const font = currentCustomFont.value
  if (!font) return []

  const weightFlags = new Map<number, { hasNormal: boolean; hasItalic: boolean }>()
  font.variants.forEach((variant) => {
    const existing = weightFlags.get(variant.weight) || { hasNormal: false, hasItalic: false }
    if (variant.style === 'italic') {
      existing.hasItalic = true
    } else {
      existing.hasNormal = true
    }
    weightFlags.set(variant.weight, existing)
  })

  return Array.from(weightFlags.entries())
    .sort(([a], [b]) => a - b)
    .map(([weight, flags]) => {
      let label = getWeightName(String(weight))
      if (!flags.hasNormal && flags.hasItalic) {
        label += ' (italic only)'
      }
      return {
        label,
        value: String(weight),
      }
    })
})
const availableFontWeights = computed(() => {
  if (currentCustomFont.value) return customFontWeightOptions.value
  return getAvailableFontWeights(handleElement.value.fontFamily)
})

watch(hasFontFamily, (font) => {
  if (!font) return
  mainStore.ensureFontLoaded(font)
  elementFontFamily.value = font
}, { immediate: true })

// Modify font family
const handleElementFontFamily = (fontFamily: string) => {
  // Preload font before applying
  mainStore.ensureFontLoaded(fontFamily)
  
  // Add to recent fonts
  const currentRecent = recentFonts.value.filter(f => f !== fontFamily)
  currentRecent.unshift(fontFamily)
  recentFonts.value = currentRecent.slice(0, 10)
  
  // Apply changes without blocking
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({fontFamily})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {fontFamily})
  }
  
  // Use throttled render to prevent stuttering
  throttledRender(canvas)
}

// Modify input font size
const handleElementInputSize = (val: string) => {
  val = val.replace(/[^\d]/g, '')
  if (val) {
    templatesStore.modifedElement(handleElement.value, {fontSize: val})
  }
}

// Modify font size
const handleElementFontSize = (fontSize: string) => {
  fontSize = fontSize.replace(/[^\d]/g, '')
  if (!fontSize) return
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({fontSize})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {fontSize})
  }
  throttledRender(canvas)
}

// Modify font color
const updateFontColor = (fill: string) => {
  
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({fill})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {fill, color: fill})
  }
}

// Modify background color
const updateBackgroundColor = (backgroundColor: string) => {
  const element = handleElement.value
  const changeData: Record<string, any> = {}

  if (element.type.toLowerCase() === ElementNames.ARCTEXT) {
    changeData.textBackgroundColor = backgroundColor
  }
  else {
    changeData.textBackgroundColor = backgroundColor
    changeData.backgroundColor = ''
  }

  if (element.isEditing) {
    element.setSelectionStyles(changeData)
  }
  else {
    templatesStore.modifedElement(element, changeData)
  }

  element.set({ dirty: true })
  canvas.requestRenderAll()
}

// Modify font size
const handleElementFontsize = (mode: string) => {
  if (handleElement.value.fontSize <= 6) return
  const fontSize = mode === '+' ? handleElement.value.fontSize + 1 : handleElement.value.fontSize - 1
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({fontSize})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {fontSize})
  }
  canvas.renderAll()
}

// Update font bold
const handleElementBlod = async () => {
  const element = handleElement.value
  const fontBold = '700'
  const fontNormal = '400'

  if (element.isEditing) {
    const selectionStyles = element.getSelectionStyles()
    const hasSelection = selectionStyles.length > 0
    const selectionIsBold = hasSelection && !selectionStyles.some((style) => {
      const weight = style.fontWeight
      return weight !== fontBold && weight !== 'bold'
    })
    const elementIsBold = element.fontWeight === fontBold || element.fontWeight === 'bold'
    const shouldReset = hasSelection ? selectionIsBold : elementIsBold
    await handleElementFontWeight(shouldReset ? fontNormal : fontBold)
    return
  }

  const elementIsBold = element.fontWeight === fontBold || element.fontWeight === 'bold'
  await handleElementFontWeight(elementIsBold ? fontNormal : fontBold)
}

// Update italic
const handleElementItalic = () => {
  const fontStyle = handleElement.value.fontStyle === 'italic' ? 'normal' : 'italic'
  const currentWeight = getCurrentFontWeight()
  const variantKey = fontStyle === 'italic'
    ? (currentWeight === '400' ? 'italic' : `${currentWeight}italic`)
    : currentWeight

  mainStore.ensureFontLoaded(handleElement.value.fontFamily, variantKey as string)

  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({fontStyle})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {fontStyle})
  }
  
}

// Get current font weight for display
const getCurrentFontWeight = () => {
  const weight = handleElement.value.fontWeight
  // Return current weight, defaulting to '400' for normal
  if (weight === 'normal') return '400'
  return weight || '400'
}

// Update font weight
const handleElementFontWeight = async (weight: string) => {
  const element = handleElement.value
  if (!element) return

  const fontFamily = element.fontFamily
  const baseVariant = weight === '400' ? 'regular' : weight
  const fontVariantToLoad = element.fontStyle === 'italic'
    ? (baseVariant === 'regular' ? 'italic' : `${baseVariant}italic`)
    : baseVariant

  // Ensure the font variant CSS is injected before waiting on the browser font loader
  mainStore.ensureFontLoaded(fontFamily, fontVariantToLoad)

  // Wait for the specific font face to finish loading to avoid fallback flashes
  if (typeof document !== 'undefined' && document.fonts?.load) {
    const fontStyle = element.fontStyle === 'italic' ? 'italic' : 'normal'
    const fontDescriptor = `${fontStyle} ${weight} 16px "${fontFamily}"`
    try {
      await document.fonts.load(fontDescriptor)
    } catch (error) {
      console.warn(`Failed to load font weight ${fontDescriptor}`, error)
    }
  }

  // Guard in case the active element changed while awaiting
  if (element !== handleElement.value) {
    canvas.requestRenderAll()
    return
  }

  if (element.isEditing) {
    element.setSelectionStyles({ fontWeight: weight })
  }
  else {
    templatesStore.modifedElement(element, { fontWeight: weight })
    const elementStyle = element.styles
    for (const line in elementStyle) {
      for (const char in elementStyle[line]) {
        (elementStyle[line][char] as TextboxElement).set({ fontWeight: weight })
      }
    }
  }

  element.set({ dirty: true })
  if (typeof element.initDimensions === 'function') {
    element.initDimensions()
  }
  element.setCoords()
  canvas.requestRenderAll()
}

// Modify strikethrough
const handleElementLinethrough = () => {
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({linethrough: !handleElement.value.linethrough})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {linethrough: !handleElement.value.linethrough})
  }
}

// Modify underline
const handleElementUnderline = () => {
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({underline: !handleElement.value.underline})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {underline: !handleElement.value.underline})
  }
}

// Modify text align
const handleTextAlign = (textAlign: string) => {
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({textAlign})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {textAlign})
  }
}

// Modify char spacing
const handleElementCharSpacing = (mode: '+' | '-') => {
  const handleCharSpacing = handleElement.value.charSpacing
  const charSpacing = mode === '+' ? handleCharSpacing + 10 : handleCharSpacing - 10
  templatesStore.modifedElement(handleElement.value, { charSpacing })
}

const changeLineHeight = (lineHeight: number) => {
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({lineHeight})
  }
  else {
    templatesStore.modifedElement(handleElement.value, { lineHeight })
  }
}

const changeCharSpacing = (charSpacing: number) => {
  if (handleElement.value.isEditing) {
    handleElement.value.setSelectionStyles({charSpacing})
  }
  else {
    templatesStore.modifedElement(handleElement.value, {charSpacing})
  }
  
  canvas.renderAll()
}

const handleElementArrange = (status: boolean) => {
  const options = (handleElement.value as any).toObject(propertiesToInclude as any[])
  options.lineHeight = 12
  delete options.type
  options.id = nanoid(10)
  let textElement: FabricObject = new Textbox(handleElement.value.text, options)
  if (status) {
    textElement = new VerticalText(handleElement.value.text, options)
  }
  const activeObject = canvas.getActiveObject()
  if (activeObject) canvas.remove(activeObject)
  canvas.discardActiveObject()
  canvas.add(textElement)
  templatesStore.addElement(textElement)
  canvas.setActiveObject(textElement)
  mainStore.setCanvasObject(textElement)
  canvas.renderAll()
}

const handleElementVector = async () => {
  let fontBuffer: ArrayBuffer | undefined

  try {
    fontBuffer = await fetchGoogleFontBinary(hasFontFamily.value)
  } catch (error) {
    console.warn(`Failed to fetch Google font ${hasFontFamily.value}:`, error)
  }

  if (!fontBuffer) {
    const fontData = await loadFont(hasFontFamily.value)
    if (fontData) {
      const fontBlob = await fontData.blob()
      fontBuffer = await fontBlob.arrayBuffer()
    }
  }

  if (!fontBuffer) return

  const fontElement = opentype.parse(fontBuffer)
  const path = fontElement.getPath(handleElement.value.text, 0, 0, handleElement.value.fontSize);
  createPathElement(path.toPathData(2), handleElement.value.left, handleElement.value.top)
  canvas.remove(handleElement.value)
  canvas.renderAll()
}

const handleElementDeformation = () => {
  const options = (handleElement.value as any).toObject(propertiesToInclude as any[]) as any
  options.originType = options.type
  delete options.type
  options.id = nanoid(10)
  let text
  if (handleElement.value.type.toLowerCase() === ElementNames.ARCTEXT) {
    text = new IText(options.text, options)
  } else {
    text = new ArcText(options.text, options)
  }
  canvas.add(text)
  handleElement.value.set({visible: false})
  templatesStore.addElement(text)
  canvas.setActiveObject(text)
  canvas.renderAll()
}

const changeArcTextRadius = (val: number) => {
  (handleElement.value as ArcText).setRadius(val)
  templatesStore.modifedElement(handleElement.value, { radius: val })
}


</script>

<style scoped>
.text-style-panel {
  user-select: none;
}
</style>
