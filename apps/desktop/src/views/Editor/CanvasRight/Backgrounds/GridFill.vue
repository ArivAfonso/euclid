
<template>
  <Dialog :open="dialogVisible" @update:open="(val) => !val && closeColor()">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Custom Grid Colors
          </DialogTitle>
        <DialogDescription>
          Click on blocks to modify colors
        </DialogDescription>
      </DialogHeader>
      
      <div class="p-[30px] bg-[hsl(var(--muted))] rounded-lg">
        <div class="mx-auto w-[300px]">
          <canvas ref="gridBackground" class="max-w-full w-[300px] max-h-full h-[200px] object-contain [filter:drop-shadow(2px_2px_8px_rgba(0,0,0,.2))] rounded"></canvas>
        </div>
      </div>
      
      <div class="p-0 mx-auto text-center space-y-4">
        <div class="m-0">
          <div class="inline-flex justify-center items-center max-w-full">
            <div v-for="item in gridColorSelf" :key="item.index" class="h-8 w-8 flex-[0_1_32px] inline-block cursor-pointer mx-[2px] transition-all duration-200 rounded border border-[hsl(var(--border))] hover:scale-110 hover:shadow-[0_2px_8px_rgba(0,0,0,.2)]">
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: item.color }"></div>
                      <span class="text-[10px] font-mono">{{ toHex(item.color) }}</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[256px]" align="end">
                  <ColorPicker :modelValue="item.color" @update:modelValue="(value: string) => updateColor(value, item.index)"/>
                </PopoverContent>
              </Popover>
            </div>
            <Button size="icon" variant="outline" class="ml-2 h-8 w-8" @click="addColor" v-if="gridColorSelf.length < 11">
              <IconPlus class="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" class="ml-2 h-8 w-8" @click="subColor" v-if="gridColorSelf.length > 2">
              <IconMinus class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button @click="saveColor()">Save Colors</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue'
import trianglify from '@/plugins/trianglify/trianglify'
import { GridColorSelf } from '@/configs/colorGrid'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ColorPicker from '@/components/ColorPicker/index.vue'
import { toHex } from '@/utils/color'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
})

const gridBackground = ref<null | HTMLCanvasElement>(null)

const dialogVisible = ref(false)
const gridColorSelf = ref(GridColorSelf)

const emit = defineEmits<{
  (event: 'save', payload: string[]): void
  (event: 'close'): void
}>()

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    nextTick(() => {
      generateBackground()
    })
  }
})

// const openedDialog = () => {
//   generateBackground()
// }

// Add custom color
const addColor = () => {
  const gridColor = gridColorSelf.value[gridColorSelf.value.length - 1]
  gridColorSelf.value.push({index: gridColor.index + 1, color: gridColor.color})
  generateBackground()
}

// Remove custom color
const subColor = () => {
  gridColorSelf.value.pop()
  generateBackground()
}

const getGridColor = () => {
  const gridColors: string[] = []
  gridColorSelf.value.forEach(item => {
    gridColors.push(item.color)
  })
  return gridColors
}

const generateBackground = () => {
  const defaultOptions = {
    width: 1200,
    height: 600,
    cellSize: 75,
    variance: 0.75,
    seed: null,
    xColors: getGridColor(),
    yColors: 'match',
    fill: true,
    palette: trianglify.utils.colorbrewer,
    colorSpace: 'lab',
    colorFunction: trianglify.colorFunctions.interpolateLinear(0.5),
    strokeWidth: 0,
    points: null
  }
  const trianglifier = trianglify(defaultOptions)
  trianglifier.toCanvas(gridBackground.value)
}

const updateColor = (color: string, index: number) => {
  gridColorSelf.value[index].color = color
  generateBackground()
}

const saveColor = () => {
  emit('save', getGridColor())
}

const closeColor = () => {
  emit('close')
}

</script>

