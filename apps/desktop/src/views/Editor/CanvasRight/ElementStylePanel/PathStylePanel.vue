<template>
  <div class="shape-style-panel space-y-2.5 ">
    <ElementPosition/>
    
    <Separator class="my-2" />
    <ElementFill />
    
    <ElementBorder :hasStroke="hasStroke" />
    
    <Separator class="my-2" />
    <ElementShadow :hasShadow="hasShadow" />
    
    <Separator class="my-2" />
    <ElementOpacity />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import ElementPosition from '../Components/ElementPosition.vue'
import ElementOpacity from '../Components/ElementOpacity.vue'
import ElementShadow from '../Components/ElementShadow.vue'
import ElementBorder from '../Components/ElementBorder.vue'
import ElementFill from '../Backgrounds/ElementFill.vue'
import { Separator } from '@/components/ui/separator'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'

const mainStore = useMainStore()
const { canvasObject } = storeToRefs(mainStore)
const handleElement = computed(() => canvasObject.value as any)
const hasShadow = computed(() => handleElement.value?.shadow ? true : false)
const hasStroke = computed(() => handleElement.value?.stroke ? true : false)
</script>

<style lang="scss" scoped>
.shape-style-panel {
  user-select: none;
  height: 100%;
  overflow-y: auto;
}
</style>