<template>
  <div>
    <Popover v-model:open="hasReference">
      <PopoverTrigger as-child>
        <div ref="localTriggerRef"></div>
      </PopoverTrigger>
      <PopoverContent side="right" class="w-60 p-0">
        <div class="space-y-3 p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Direction:</span>
            <RadioGroup v-model="direction" class="flex gap-2">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="vertical" id="vertical" />
                <Label for="vertical" class="text-sm">X Axis</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="horizontal" id="horizontal" />
                <Label for="horizontal" class="text-sm">Y Axis</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Position:</span>
            <div class="flex items-center gap-2">
              <Input v-model="distance" class="w-20" type="number" />
              <span class="text-sm text-muted-foreground">px</span>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" @click="setReference(false)">Cancel</Button>
            <Button size="sm" @click="addReference">OK</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
<script lang="ts" setup>

import { ref } from 'vue'
import { ReferenceLine } from '@/extension/object/ReferenceLine'
import { useMainStore, useTemplatesStore } from '@/store'
import useCanvas from '@/views/Canvas/useCanvas'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
const hasReference = ref(false)
const direction = ref<'horizontal' | 'vertical'>('horizontal')
const distance = ref(0)
const localTriggerRef = ref()
const props = defineProps({
  referenceRef: {
    type: null,
  },
  referencePopoverRef: {
    type: null
  }
})

const emit = defineEmits<{
  (event: 'add', payload: { direction: string, distance: number }): void
}>()

const setReference = (val: boolean) => {
  hasReference.value = val
}

const addReference = () => {
  const [ canvas ] = useCanvas()
  const ruler = canvas.ruler
  if (!ruler) return
  const tempReferenceLine = new ReferenceLine(
    Number(distance.value),
    {
      type: 'ReferenceLine',
      axis: direction.value,
      visible: true,
      name: 'ReferenceLine',
      selectable: true,
      hasControls: false,
      hasBorders: false,
      stroke: 'pink',
      fill: 'pink',
      originX: 'center',
      originY: 'center',
      padding: 4,
      globalCompositeOperation: 'difference',
    }
  );
  canvas.add(tempReferenceLine)
  canvas.renderAll()
  const templatesStore = useTemplatesStore()
  templatesStore.addElement(tempReferenceLine)
}

</script>
