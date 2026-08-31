<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Clip
      </h3>
      <Switch :checked="hasClippath" @update:checked="toggleStroke" />
    </div>
    
    <template v-if="hasClippath">
      <div class="max-h-[200px] overflow-y-auto rounded-md border border-border/50 p-2">
        <div v-for="item in PathShapeLibs" :key="item.type" class="mb-3 last:mb-0">
          <div class="grid grid-cols-6 gap-1">
            <TooltipProvider v-for="(shape, index) in item.children" :key="index">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    size="icon"
                    class="h-10 w-10 p-0 transition-all hover:bg-primary/10"
                    @click="selectShape(shape)"
                  >
                    <svg overflow="visible" width="20" height="20">
                      <g :transform="`scale(${20 / shape.viewBox[0]}, ${20 / shape.viewBox[1]}) translate(0,0) matrix(1,0,0,1,0,0)`">
                        <path 
                          class="shape-path transition-colors"
                          :class="{ 'outlined': shape.outlined }"
                          vector-effect="non-scaling-stroke" 
                          stroke-linecap="butt" 
                          stroke-miterlimit="8"
                          :fill="shape.outlined ? 'currentColor' : 'transparent'"
                          :stroke="shape.outlined ? 'transparent' : 'currentColor'"
                          stroke-width="2" 
                          :d="shape.path"
                        ></path>
                      </g>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Clip Shape</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { PathShapeLibs } from '@/configs/shape'
import { PathPoolItem } from '@/types/elements'
import { useMainStore } from '@/store'
import { storeToRefs } from 'pinia'
import { Path } from 'fabric'
import { PathElement } from '@/types/canvas'
import useCanvas from '@/views/Canvas/useCanvas'
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const mainStore = useMainStore()
const { canvasObject } = storeToRefs(mainStore)

const handleElement = computed(() => canvasObject.value as PathElement)
const fontColor = ref('#000')
const hasClippath = ref(true)

const toggleStroke = () => {
  
}

const selectShape = (shape: PathPoolItem) => {
  const [ canvas ] = useCanvas()
  const clipPath = new Path(shape.path, {
    left: -handleElement.value.width / 2,
    top: -handleElement.value.height / 2,
  })
  handleElement.value.set({clipPath})
  canvas.renderAll()
}
</script>

<style lang="scss" scoped>
</style>
