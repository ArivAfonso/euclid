<template>
  <div>
    <div class="flex items-center justify-center gap-4">
      <Button variant="ghost">Change Template</Button>
      <Button variant="ghost">Change Text</Button>
      <Button variant="ghost">Change Image</Button>
      <Button variant="ghost">Add</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import useCanvas from "@/views/Canvas/useCanvas"
import useHandleElement  from '@/hooks/useHandleElement'
import { Button } from '@/components/ui/button'

import { storeToRefs } from 'pinia'
import { useFabricStore, useTemplatesStore } from '@/store'

const fabricStore = useFabricStore()
const { isChecked } = storeToRefs(fabricStore)

const exportFileDialog = ref(false)


const exportFileHide = () => {
  exportFileDialog.value = false
}

const exportFileHandle = () => {
  exportFileDialog.value = false
}

const exportFile = () => {
  exportFileDialog.value = true
}

const loadFile = (files: FileList) => {
  const jsonFile = files[0]
  if (!jsonFile) return
  const reader = new FileReader()
  const [ canvas ] = useCanvas()
  reader.onload = event => {
    const jsonContent = event.target?.result?.toString()
    if (!jsonContent) return
    const jsonData = JSON.parse(jsonContent)
    canvas.setViewportTransform(jsonData.viewportTransform)
    canvas.setZoom(jsonData.zoom)
  }
  reader.readAsText(jsonFile)
}

</script>
