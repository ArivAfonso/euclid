<template>
  <div class="flex h-full flex-col  bg-white dark:bg-[hsl(0,0%,9%)]">
    <div class="flex items-center gap-2 border-b border-border px-3 py-2.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <FileInput @change="drawMaterial">
              <Button variant="secondary" size="icon" class="h-8 w-8">
                <Upload class="size-3.5" />
              </Button>
            </FileInput>
          </TooltipTrigger>
          <TooltipContent side="right" class="text-xs">
            <p>Upload SVG</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchTerm"
          placeholder="Search materials"
          class="h-8 pl-9 text-xs"
        />
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-3 py-3">
      <section v-if="hasVisibleMaterials" class="space-y-3">
        <div v-if="filteredLineGroups.length" class="space-y-2.5 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Lines
            </h3>
          </div>
          <LineSection :groups="filteredLineGroups" @select="drawLine" />
        </div>

        <Separator v-if="filteredLineGroups.length && filteredShapeGroups.length" />

        <div v-if="filteredShapeGroups.length" class="space-y-2.5 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Paths
            </h3>
          </div>
          <PathSection :categories="filteredShapeGroups" @select="drawPath" />
        </div>
      </section>

      <div v-else class="flex min-h-[140px] items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-center text-xs text-muted-foreground select-none">
        No materials found.
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Search, Upload } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import FileInput from '@/components/FileInput.vue'
import { PathPoolItem, LinePoolItem } from '@/types/elements'
import { Object as FabricObject, loadSVGFromString } from 'fabric'
import { getImageText } from '@/utils/image'
import useCanvas from '@/views/Canvas/useCanvas'
import LineSection from './MaterialComponents/LineSection.vue'
import PathSection from './MaterialComponents/PathSection.vue'
import useHandleCreate from '@/hooks/useHandleCreate'
import { PathShapeLibs } from '@/configs/shape'
import { PathLineLibs } from '@/configs/lines'



const { createLineElement, createPathElement } = useHandleCreate()
const searchTerm = ref('')

const normalizeSearchText = (value: string) => value.trim().toLowerCase()

const shapeFormulaLabels: Record<string, string> = {
  roundRect: 'rounded rectangle',
  roundRectDiagonal: 'rounded rectangle diagonal',
  roundRectSingle: 'rounded rectangle single',
  roundRectSameSide: 'rounded rectangle same side',
  cutRectDiagonal: 'cut rectangle diagonal',
  cutRectSingle: 'cut rectangle single',
  cutRectSameSide: 'cut rectangle same side',
  message: 'message bubble',
  roundMessage: 'rounded message bubble',
  L: 'l shape',
  ringRect: 'ring rectangle',
  plus: 'plus',
  triangle: 'triangle',
  parallelogramLeft: 'left parallelogram',
  parallelogramRight: 'right parallelogram',
  trapezoid: 'trapezoid',
  bullet: 'bullet',
  indicator: 'indicator',
}

const matchesSearch = (haystack: string) => {
  const term = normalizeSearchText(searchTerm.value)
  if (!term) return true
  return normalizeSearchText(haystack).includes(term)
}

const filteredShapeGroups = computed(() => {
  const term = normalizeSearchText(searchTerm.value)
  if (!term) return PathShapeLibs

  return PathShapeLibs
    .map((category) => {
      const categoryMatches = matchesSearch(category.type)
      if (categoryMatches) return category

      const children = category.children.filter((item, index) => {
        const itemLabels = [
          category.type,
          `shape ${index + 1}`,
          item.pathFormula ? shapeFormulaLabels[item.pathFormula] || item.pathFormula : '',
          item.pathFormula || '',
          item.special ? 'special' : '',
          item.outlined ? 'outlined' : '',
        ].filter(Boolean).join(' ')

        return matchesSearch(itemLabels)
      })

      return {
        ...category,
        children,
      }
    })
    .filter((category) => category.children.length > 0)
})

const filteredLineGroups = computed(() => {
  const term = normalizeSearchText(searchTerm.value)
  if (!term) return PathLineLibs

  return PathLineLibs
    .map((group) => {
      const groupMatches = matchesSearch(group.type)
      if (groupMatches) return group

      const children = group.children.filter((line) => {
        const itemLabels = [
          group.type,
          line.style,
          line.points.join(' '),
          line.isBroken ? 'broken' : '',
          line.isCurve ? 'curve' : '',
          line.isCubic ? 'cubic' : '',
        ].filter(Boolean).join(' ')

        return matchesSearch(itemLabels)
      })

      return {
        ...group,
        children,
      }
    })
    .filter((group) => group.children.length > 0)
})

const hasVisibleMaterials = computed(() => filteredLineGroups.value.length > 0 || filteredShapeGroups.value.length > 0)

const drawLine = (line: LinePoolItem) => {
  const strokeDashArray: [number, number] | undefined =
    line.style === 'dashed' ? [6, 6] : undefined
  createLineElement(line.data, line.points[0], line.points[1], strokeDashArray)
}

const drawPath = (shape: PathPoolItem) => {
  createPathElement(shape.path)
}

const svgCallback = (_element: Element, fabricObject: FabricObject) => {
  const [canvas] = useCanvas()
  canvas.add(fabricObject)
}

const drawMaterial = async (files: FileList | File[]) => {
  const fileArray = Array.isArray(files) ? files : Array.from(files)
  const materialFile = fileArray[0]
  const [canvas] = useCanvas()
  if (!materialFile) return
  const dataText = await getImageText(materialFile)
  await loadSVGFromString(dataText, svgCallback)
  canvas.renderAll()
}
</script>
