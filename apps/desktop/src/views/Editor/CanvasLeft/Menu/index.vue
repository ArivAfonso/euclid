<template>
  <div>
    <div 
      class="absolute w-[300px] top-10 bottom-0 z-[1] bg-transparent dark:bg-[hsl(0,0%,9%)] dark:border-[hsl(0,0%,18%)]"
      :class="poolShow !== true ? 'left-[-251px] cursor-default' : 'left-[50px]'"
      :style="{ transition: 'left 0.5s linear' }"
    >
      <component 
        :is="currentComponent" 
        class="w-[300px] h-full border-b border-gray-200 dark:border-[hsl(0,0%,18%)]"
        :style="{ transition: 'left 0.3s linear' }"
      ></component>
      <button 
        class="group absolute -right-[14px] top-1/2 -translate-y-1/2 z-[1] h-16 w-[14px] flex items-center justify-center rounded-r-xl border border-l-0 border-gray-200 dark:border-[hsl(0,0%,20%)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[hsl(0,0%,14%)] dark:to-[hsl(0,0%,11%)] shadow-sm hover:shadow-md hover:-right-[15px] active:scale-95 transition-all duration-200 ease-in-out cursor-pointer"
        @click="leftToggle" 
        v-show="currentComponent"
      >
        <IconLeft  class="text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200" v-if="poolShow"/>
        <IconRight class="text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200" v-else/>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMainStore } from '@/store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import EditorSection from './components/EditorSection.vue'
import TemplateSection from './components/TemplateSection.vue'
import MaterialSection from './components/MaterialSection.vue'
import TextboxSection from './components/TextboxSection.vue'
import ImageSection from './components/ImageSection.vue'
import LayerSection from './components/LayerSection.vue'
import CodeSection from './components/CodeSection.vue'
import PagesSection from './components/PagesSection.vue'
import UploadsSection from './components/UploadsSection.vue'
import AdminSection from './components/AdminSection.vue'

const mainStore = useMainStore()
const { poolType, poolShow } = storeToRefs(mainStore)

const leftMap: Record<string, any> = {
  'editor': EditorSection,
  'template': TemplateSection,
  'material': MaterialSection,
  'text': TextboxSection,
  'image': ImageSection,
  'illustration': ImageSection,
  'code': CodeSection,
  'layer': LayerSection,
  'pages': PagesSection,
  'uploads': UploadsSection,
  'admin': AdminSection,
}
const currentComponent = computed(() => {
  return leftMap[poolType.value] || null
})



const leftToggle = () => {
  poolShow.value = !poolShow.value
}

</script>