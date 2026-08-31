<template>
  <div data-onboarding="left-sidebar" class="h-full flex flex-col bg-white dark:bg-[hsl(0,0%,9%)] border-r border-gray-200/50 dark:border-gray-800/50">
    <!-- Settings Modal -->
    <SettingsModal v-model:open="showSettingsModal" />

    <!-- Modern Top Section with Home Button -->
    <div id="left-top-tabs" class="flex-shrink-0">
      <div class="w-full h-12 flex justify-center items-center border-b border-gray-100/80 dark:border-gray-800/80 bg-white/90 dark:bg-[hsl(0,0%,9%)]/90 backdrop-blur-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="group relative p-2 rounded-lg cursor-pointer
                             text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800/20
                             transition-all duration-200 hover:scale-105 active:scale-95
                             focus:outline-none focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 focus:ring-offset-1
                             " 
                  @click="goProjects"
              >
                <Home class="w-4 h-4" />
                <div class="absolute inset-0 rounded-lg bg-gray-500/0 group-hover:bg-gray-500/5 dark:group-hover:bg-gray-500/10 transition-colors duration-200"></div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Projects
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
    
    <!-- Main Navigation Tabs -->
    <div class="flex-1 flex flex-col relative">
      <!-- Scrollable Center Tabs -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-2
                  [&::-webkit-scrollbar]:w-1.5 
                  [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-thumb]:hover:bg-gray-400/70 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/70
                  [&::-webkit-scrollbar-thumb]:transition-colors">
        <div 
          v-for="tab in topTabs" 
          :key="tab.key"
          @click="setPoolType(tab.key)"
          :class="{
            'relative w-full h-10 mb-1.5 flex flex-col justify-center items-center cursor-pointer rounded-lg transition-all duration-200 group select-none': true,
            'bg-gradient-to-br from-gray-100 to-gray-200/50 dark:from-gray-800/50 dark:to-gray-700/30 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-gray-300/50 dark:ring-gray-600/50': tab.key === poolType,
            'text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-800 dark:hover:text-gray-200': tab.key !== poolType
          }"
        >
          <div class="flex justify-center items-center flex-col z-10" :id="`left-tabs-${tab.key}`">
            <component 
              :is="tab.icon" 
              :class="{
                'w-[18px] h-[18px] transition-transform duration-200': true,
                'scale-105': tab.key === poolType
              }"
            />
          </div>
        </div>
      </div>
      
      <!-- Fixed Bottom Tabs with Modern Glass Effect -->
      <div class="w-full bg-white/90 dark:bg-[hsl(0,0%,9%)]/90 backdrop-blur-sm border-t border-gray-100/80 dark:border-gray-800/80 shadow-sm">
        <!-- Settings -->
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="group relative w-full h-10 mb-1.5 flex flex-col justify-center items-center cursor-pointer rounded-lg transition-all duration-200 select-none
                       text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-800 dark:hover:text-gray-200"
                @click="openSettings"
              >
                <div class="flex justify-center items-center z-10">
                  <Settings class="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-105" />
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Settings
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMainStore } from "@/store";
import { PoolType } from "@/types/common";
import { storeToRefs } from "pinia";
import { useRouter } from 'vue-router'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import SettingsModal from '@/components/SettingsModal.vue'

// Import Lucide icons
import { Home, Layers, Pencil, LayoutTemplate, Shapes, Type, Image, GalleryVerticalEnd, FolderUp, UserCircle, Settings } from 'lucide-vue-next';

const router = useRouter()
const mainStore = useMainStore();
const { poolType, poolShow } = storeToRefs(mainStore);

const hasHotkey = ref(false);
const showSettingsModal = ref(false);

interface TabItem {
  key: PoolType;
  icon: any;
  index: number;
}

const topTabs: TabItem[] = [
  { key: "editor", icon: Pencil, index: 0 },
  { key: "layer", icon: Layers, index: 7 },
  { key: "pages", icon: GalleryVerticalEnd, index: 6 },
  { key: "template", icon: LayoutTemplate, index: 1 },
  { key: "material", icon: Shapes, index: 2 },
  { key: "text", icon: Type, index: 3 },
  { key: "image", icon: Image, index: 4 },
  { key: "uploads", icon: FolderUp, index: 5 },
];

const setPoolType = (tab: PoolType) => {
  if (poolShow.value && tab === poolType.value) {
    poolShow.value = false;
  } else {
    poolShow.value = true;
  }
  mainStore.setPoolType(tab);
};

const openSettings = () => {
  showSettingsModal.value = true;
};



const goProjects = async () => {
    // Trigger save before navigating to projects list.
    // The "Saving project..." overlay stays up through navigation — the Projects
    // page's onMounted will dismiss it once data is loaded, so there's zero lag.
    const query = router.currentRoute.value.query
    const projectId = typeof query.project === 'string' ? query.project : null
    if (projectId) {
      mainStore.setSavingProject(true)
      try {
        if ((window as any).__euclidSave) {
          await (window as any).__euclidSave()
        }
      } catch (e) {
        console.error('Save before navigate failed:', e)
      }
      // Don't clear overlay here — Projects/index.vue onMounted does it
    }
    await router.push('/projects')
}

const goHome = () => {
  window.open(router.resolve({path: `/home`}).href, '_blank');
}
</script>
