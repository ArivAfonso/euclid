<template>
  <div @click.stop="cancelElement">
    <div class="layout-search">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="keywords"
          placeholder="Search For Layer"
          class="pl-10"
        />
      </div>
    </div>
    <LayerDraggableSelf :elements="layerObjects" :index="0" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, unref } from "vue";
import { Search } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { useTemplatesStore } from "@/store";
import { ElementNames } from "@/types/elements";
import { WorkSpaceCommonType } from "@/configs/canvas";
import LayerDraggableSelf from "./components/LayerDraggableSelf.vue";
import useHandleElement from "@/hooks/useHandleElement";
import { Input } from "@/components/ui/input";
import useCanvas from "@/views/Canvas/useCanvas";
import { FabricObject } from "fabric";

// Search keywords
const keywords = ref('')

const templatesStore = useTemplatesStore();
const { currentTemplate } = storeToRefs(templatesStore);
const { cancelElement } = useHandleElement();
const [ canvas ] = useCanvas()

// Track canvas object changes to force reactivity
const canvasVersion = ref(0)

// Listen to canvas events to trigger updates
if (canvas) {
  const updateLayers = () => {
    canvasVersion.value++
  }
  
  canvas.on('object:added', updateLayers)
  canvas.on('object:removed', updateLayers)
  canvas.on('object:modified', updateLayers)
}

const layerObjects = computed(() => {
  // Access canvasVersion to trigger reactivity
  canvasVersion.value
  
  if (!canvas) return []
  
  // Get objects directly from canvas
  const canvasObjects = canvas.getObjects() as FabricObject[]
  
  const _keywords = unref(keywords).trim().toLowerCase()
  
  return canvasObjects.filter((item) => {
    const shouldShow = !WorkSpaceCommonType.includes(item.id) && 
                      item.type.toLowerCase() !== ElementNames.REFERENCELINE
    if (!shouldShow) return false
    
    if (!_keywords) return true
    
    return item.type.toLowerCase().includes(_keywords) ||
           (item.layer && item.layer.toLowerCase().includes(_keywords))
  }).reverse()
});
</script>

<style lang="scss" scoped>
.layout-search {
  margin: 0 auto;
  width: 68%;
  padding: 20px 10px 10px;
}
</style>