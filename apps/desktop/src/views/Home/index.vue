<template>
  <div class="flex flex-col h-screen bg-background dark:bg-[hsl(0,0%,7%)]">
    <!-- Electron Titlebar -->
    <ElectronTitlebar v-if="isElectronMode" title="Euclid - Home" context="home" />
    
    <!-- Header -->
    <header class="h-16 border-b border-border/50 flex items-center bg-card dark:bg-[hsl(0,0%,9%)]">
      <div class="flex justify-between items-center w-full px-6">
        <div class="flex items-center gap-2">
          <!-- Window Controls for Electron -->
          <div v-if="isElectronMode" class="flex items-center gap-0 ml-2" style="-webkit-app-region: no-drag">
            <button class="flex items-center justify-center w-[46px] h-8 bg-transparent border-0 text-foreground cursor-pointer transition-colors duration-150 hover:bg-accent" @click="minimizeWindow" title="Minimize">
              <MinusIcon class="h-4 w-4" />
            </button>
            
            <button class="flex items-center justify-center w-[46px] h-8 bg-transparent border-0 text-foreground cursor-pointer transition-colors duration-150 hover:bg-accent" @click="toggleMaximize" title="Maximize">
              <component :is="isMaximized ? Minimize2Icon : Maximize2Icon" class="h-3.5 w-3.5" />
            </button>
            
            <button class="flex items-center justify-center w-[46px] h-8 bg-transparent border-0 text-foreground cursor-pointer transition-colors duration-150 hover:bg-[red] hover:text-white" @click="closeWindow" title="Close">
              <XIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main container with sidebar and content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-[216px] border-r border-border/50 bg-card dark:bg-[hsl(0,0%,9%)]">
        <nav class="pt-5 h-full">
          <div 
            class="h-10 px-4 mx-3 mb-1 flex items-center rounded-lg cursor-pointer transition-all duration-200
                   text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-muted/50 bg-accent dark:bg-muted/50"
          >
            <span class="flex w-[30px] justify-center mr-3">
              <IconNavigation/>
            </span>
            <span>Recommended</span>
          </div>
          <div 
            class="h-10 px-4 mx-3 mb-1 flex items-center rounded-lg cursor-pointer transition-all duration-200
                   text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-muted/50"
          >
            <span class="flex w-[30px] justify-center mr-3">
              <IconViewList/>
            </span>
            <span>Template Space</span>
          </div>
        </nav>
      </aside>
      
      <!-- Main content -->
      <main @scroll="handleScroll" class="flex-1 overflow-y-auto h-full" id="main">
        <div class="p-6">
          <MainSearch />
          <!-- <MainScene />
          <MainTools /> -->
          <div class="mt-10">
            <h2 class="text-xl font-bold text-foreground dark:text-gray-100">Today's Picks</h2>
          </div>
          <TransitionGroup tag="div" class="grid gap-x-5 py-5 items-end" id="homeWaterfall" style="grid-template-columns: repeat(var(--column), 1fr)" :enter-active-class="resultReactive.move ? 'transition-all duration-700' : ''" :leave-active-class="resultReactive.move ? 'transition-all duration-700 absolute' : ''" :enter-from-class="resultReactive.move ? 'opacity-0 translate-y-[30px]' : ''" :leave-to-class="resultReactive.move ? 'opacity-0 translate-y-[30px]' : ''" :move-class="resultReactive.move ? 'transition-all duration-700' : ''">
            <div class="bg-card mb-5 rounded-[10px] overflow-hidden shadow-[0px_0px_12px_rgba(0,0,0,.12)] p-2.5 transition-shadow duration-200 dark:bg-[hsl(0,0%,11%)] dark:shadow-[0px_0px_12px_rgba(0,0,0,.4)]" v-for="(item, index) in resultReactive.items" :key="item.id">
              <img class="block w-full rounded-[10px] overflow-hidden mb-3.5 outline outline-1 outline-border cursor-pointer hover:outline-primary" :src="item.preview" alt="" :ref="(e: any) => setItemStyle(e, index)" @click="changeTemplate(item.id)">
              <div class="text-xl font-bold mb-2 text-foreground">{{ item.title }}</div>
              <div class="text-sm text-muted-foreground leading-5 h-10 line-clamp-2">{{ item.text }}</div>
            </div>
          </TransitionGroup>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import ElectronTitlebar from '@/components/ElectronTitlebar.vue'
import MainSearch from './components/MainSearch.vue';
import MainScene from './components/MainScene.vue';
import MainTools from './components/MainTools.vue';
import { loadTemplatesList, paginateTemplates } from '@/utils/templateLoader'
import type { TemplateItem } from '@/utils/templateLoader'
import { throttle } from 'lodash-es'
import { PageSize } from "@/configs/size"
import { useRouter } from 'vue-router'
import { Minus as MinusIcon, Maximize2 as Maximize2Icon, Minimize2 as Minimize2Icon, X as XIcon } from 'lucide-vue-next'

const router = useRouter()
const isMaximized = ref(false)

// Check if running in Electron mode
const isElectronMode = computed(() => {
  return import.meta.env.MODE === 'electron' || window.electron !== undefined
})

// Window control functions
const minimizeWindow = () => {
  if (isElectronMode.value && window.electron) {
    window.postMessage({ type: 'window-minimize' }, '*')
  }
}

const toggleMaximize = () => {
  if (isElectronMode.value && window.electron) {
    window.postMessage({ type: 'window-maximize' }, '*')
    isMaximized.value = !isMaximized.value
  }
}

const closeWindow = () => {
  if (isElectronMode.value && window.electron) {
    window.postMessage({ type: 'window-close' }, '*')
  }
}

const resultReactive = reactive({
  loading: false,
  page: 1,
  totalPage: 1,
  column: 6,
  move: true,
  items: [] as TemplateItem[],
});

const handleScroll = throttle(async () => {
  const mainElement = document.getElementById('main') as HTMLElement
  const scrollHeight = mainElement.scrollHeight, scrollTop = mainElement.scrollTop, clientHeight = mainElement.clientHeight
  if (scrollHeight - (scrollTop + clientHeight) <= 200) {
    if (resultReactive.page < resultReactive.totalPage) {
      resultReactive.page += 1
      await getTemplateItems()
    }
  }
}, 300)

const itemStyleSet = new Set<number>()

const setItemStyle = (img: HTMLImageElement, index: number) => {
  if (!img) return
  
  // Only set style once per item to prevent exponential height growth
  if (itemStyleSet.has(index)) return
  
  const update = () => {
    const item = img.parentElement
    if (!item) return
    
    // Mark as processed before calculating to prevent multiple calls
    itemStyleSet.add(index)
    
    const gapRows = index >= resultReactive.column ? 8 : 0
    const rows = Math.ceil(img.naturalHeight / 2) + gapRows
    item.style.gridRowEnd = `span ${rows}`
  }
  
  // If image already loaded, update immediately
  if (img.complete && img.naturalHeight > 0) {
    update()
  } else {
    // Otherwise wait for load
    img.onload = update
    img.onerror = function() {
      img.src = new URL(`/src/assets/images/loading.gif`, import.meta.url).href
      itemStyleSet.delete(index) // Allow retry on error
    }
  }
}

const loadTemplateImage = async () => {
  resultReactive.items.forEach(item => {
    const itemImages = item.images
    if (itemImages && JSON.parse(itemImages)) {
      const images = JSON.parse(itemImages) as string[]
      images.forEach(ele => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = ele
      })
    }
  })
}

const getTemplateItems = async () => {
  const allTemplates = await loadTemplatesList()
  const paginated = paginateTemplates(allTemplates, resultReactive.page, PageSize)
  resultReactive.totalPage = paginated.pages
  resultReactive.items = resultReactive.items.concat(paginated.items)
  // await loadTemplateImage()
}

const changeTemplate = (pk: number) => {
  const { href } = router.resolve({
    path: '/',
    query: {
      template: pk
    }
  })
  window.open(href, '_blank')
}

let observer: ResizeObserver;

onMounted(() => {
  // getData(true);
  getTemplateItems()
  const el = document.getElementById('homeWaterfall') as HTMLElement;
  observer = new ResizeObserver((entries) => {
    const rect = entries[0].contentRect;
    if (rect.width > 1200) {
      resultReactive.column = 6;
    } 
    else if (rect.width > 900) {
      resultReactive.column = 5;
    } 
    else if (rect.width > 600) {
      resultReactive.column = 4;
    }
    else if (rect.width > 300) {
      resultReactive.column = 3;
    }
    else if (rect.width > 200) {
      resultReactive.column = 2;
    }
    el.style.setProperty("--column", resultReactive.column.toString());
  });
  observer.observe(el);
});

onUnmounted(() => {
  observer.disconnect();
})

</script>
