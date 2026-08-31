<template>
  <div class="flex h-full flex-col  bg-white dark:bg-[hsl(0,0%,9%)]">
    <div class="border-b border-border px-3 py-2.5">
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchTerm"
          placeholder="Search text styles"
          class="h-8 pl-9 text-xs"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3 py-3">
      <div class="space-y-2.5">
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Quick Add
            </h3>
          </div>
          
          <div class="space-y-1.5">
            <Button
              variant="outline"
              class="h-auto w-full justify-start px-3 py-2 hover:bg-primary/10"
              @click="drawText(80)"
            >
              <span class="text-left text-lg font-semibold leading-tight text-foreground">
                Title Text
              </span>
            </Button>
            <Button
              variant="outline"
              class="h-auto w-full justify-start px-3 py-2 hover:bg-primary/10"
              @click="drawText(60)"
            >
              <span class="text-left text-base font-semibold leading-snug text-foreground">
                Subtitle Text
              </span>
            </Button>
            <Button
              variant="outline"
              class="h-auto w-full justify-start px-3 py-2 hover:bg-primary/10"
              @click="drawText(36)"
            >
              <span class="text-left text-sm leading-snug text-foreground">
                Body Text
              </span>
            </Button>
          </div>
        </div>

        <Separator />

        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Text Styles
            </h3>
            <Badge variant="secondary" class="text-[10px] px-1.5 py-0 select-none">{{ textPresets.length }}</Badge>
          </div>
          
          <div class="grid grid-cols-2 gap-1.5 max-h-[400px] overflow-y-auto pr-1
                      [&::-webkit-scrollbar]:w-1 
                      [&::-webkit-scrollbar-track]:bg-transparent
                      [&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50
                      [&::-webkit-scrollbar-thumb]:rounded-full">
            <Button
              v-for="preset in textPresets"
              :key="preset.id"
              variant="outline"
              class="h-auto w-full justify-center px-2 py-2.5 hover:bg-primary/10 flex flex-col items-center"
              @click="applyTextPreset(preset)"
            >
              <span 
                :class="preset.className"
                :style="{ fontFamily: preset.fontFamily }"
                class="leading-tight text-foreground select-none text-xs"
              >
                {{ preset.label }}
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
              <Label class="text-xs font-medium text-muted-foreground">Direction</Label>
              <ToggleGroup
                v-model="textStyle"
                type="single"
                variant="outline"
                class="grid grid-cols-2 gap-1.5"
              >
                <ToggleGroupItem value="transverse" class="flex h-8 items-center justify-center gap-1.5 text-xs">
                  <IconTextRotationNone class="size-3.5" />
                  <span class="font-medium">Horizontal</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="direction" class="flex h-8 items-center justify-center gap-1.5 text-xs">
                  <IconTextRotationDown class="size-3.5" />
                  <span class="font-medium">Vertical</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <div class="flex items-center gap-2 rounded-md border border-border/50 bg-background px-2.5 py-2">
              <Checkbox id="text-hollow" v-model:checked="textHollow" />
              <Label class="flex items-center gap-1.5 text-xs font-medium cursor-pointer" for="text-hollow">
                <IconText class="size-3.5" />
                Hollow Text
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { Search } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import useHandleCreate from '@/hooks/useHandleCreate'
import { useMainStore } from '@/store/modules/main'

interface TextPreset {
  id: string
  label: string
  className: string
  fontSize: number
  fontWeight: string
  fontFamily: string
  textTransform?: string
  letterSpacing?: string
}

const textPresets: TextPreset[] = [
  {
    id: 'bold-title',
    label: 'Bold',
    className: 'font-black',
    fontSize: 72,
    fontWeight: '900',
    fontFamily: 'Bebas Neue',
    letterSpacing: '0'
  },
  {
    id: 'elegant',
    label: 'Elegant',
    className: 'font-light',
    fontSize: 48,
    fontWeight: '300',
    fontFamily: 'Playfair Display',
    letterSpacing: '1'
  },
  {
    id: 'modern',
    label: 'Modern',
    className: 'font-semibold tracking-wide',
    fontSize: 40,
    fontWeight: '600',
    fontFamily: 'Inter',
    letterSpacing: '4'
  },
  {
    id: 'classic',
    label: 'Classic',
    className: 'font-medium',
    fontSize: 44,
    fontWeight: '500',
    fontFamily: 'Garamond',
    letterSpacing: '0'
  },
  {
    id: 'display',
    label: 'Display',
    className: 'font-extrabold',
    fontSize: 80,
    fontWeight: '800',
    fontFamily: 'Oswald',
    letterSpacing: '0'
  },
  {
    id: 'minimal',
    label: 'Minimal',
    className: 'font-normal uppercase tracking-widest',
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'Montserrat',
    textTransform: 'uppercase',
    letterSpacing: '8'
  },
  {
    id: 'headline',
    label: 'Headline',
    className: 'font-bold',
    fontSize: 64,
    fontWeight: '700',
    fontFamily: 'Merriweather',
    letterSpacing: '-1'
  },
  {
    id: 'subheading',
    label: 'Subhead',
    className: 'font-semibold',
    fontSize: 36,
    fontWeight: '600',
    fontFamily: 'Lato',
    letterSpacing: '1'
  },
  {
    id: 'impact',
    label: 'Impact',
    className: 'font-black uppercase tracking-tight',
    fontSize: 88,
    fontWeight: '900',
    fontFamily: 'Impact',
    textTransform: 'uppercase',
    letterSpacing: '-2'
  },
  {
    id: 'refined',
    label: 'Refined',
    className: 'font-normal',
    fontSize: 40,
    fontWeight: '400',
    fontFamily: 'Raleway',
    letterSpacing: '2'
  },
  {
    id: 'emphasis',
    label: 'Emphasis',
    className: 'font-bold italic',
    fontSize: 42,
    fontWeight: '700',
    fontFamily: 'Georgia',
    letterSpacing: '0'
  },
  {
    id: 'compact',
    label: 'Compact',
    className: 'font-semibold uppercase',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Ubuntu',
    textTransform: 'uppercase',
    letterSpacing: '6'
  },
  {
    id: 'statement',
    label: 'Statement',
    className: 'font-black tracking-tight',
    fontSize: 96,
    fontWeight: '900',
    fontFamily: 'Poppins',
    letterSpacing: '-3'
  },
  {
    id: 'casual',
    label: 'Casual',
    className: 'font-medium',
    fontSize: 38,
    fontWeight: '500',
    fontFamily: 'Comic Sans MS',
    letterSpacing: '1'
  },
  {
    id: 'fancy',
    label: 'Fancy',
    className: 'font-light tracking-wide',
    fontSize: 52,
    fontWeight: '300',
    fontFamily: 'Dancing Script',
    letterSpacing: '5'
  },
  {
    id: 'punchy',
    label: 'Punchy',
    className: 'font-extrabold uppercase',
    fontSize: 56,
    fontWeight: '800',
    fontFamily: 'Abril Fatface',
    textTransform: 'uppercase',
    letterSpacing: '1'
  },
]

const { createTextElement, createTextWithStyle } = useHandleCreate()
const mainStore = useMainStore()

const searchTerm = ref('')
const textStyle = ref<'transverse' | 'direction'>('transverse')
const textHollow = ref(false)

const drawText = async (fontSize: number) => {
  await createTextElement(fontSize, textStyle.value, textHollow.value)
}

const applyTextPreset = async (preset: TextPreset) => {
  // Pre-load the font before creating the text
  await mainStore.ensureFontLoaded(preset.fontFamily)
  
  await createTextWithStyle({
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
    fontFamily: preset.fontFamily,
    textTransform: preset.textTransform,
    charSpacing: preset.letterSpacing ? parseInt(preset.letterSpacing) : 0,
    textStyle: textStyle.value,
    hollow: textHollow.value
  })
}

// Pre-load all fonts when component mounts
onMounted(async () => {
  const uniqueFonts = [...new Set(textPresets.map(p => p.fontFamily))]
  for (const font of uniqueFonts) {
    mainStore.ensureFontLoaded(font)
  }
})
</script>
