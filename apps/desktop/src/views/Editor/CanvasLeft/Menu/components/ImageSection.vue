<template>
  <div class="flex h-full flex-col  bg-white dark:bg-[hsl(0,0%,9%)]">
        <!-- Tabs -->
    <div class="border-b border-border px-3">
      <div class="flex gap-0">
        <button
          :class="[
            'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
            activeTab === 'stock'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
          @click="activeTab = 'stock'"
        >
          Images
        </button>
        <button
          :class="[
            'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
            activeTab === 'icons'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
          @click="activeTab = 'icons'"
        >
          Icons
        </button>
        <button
          :class="[
            'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
            activeTab === 'logos'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
          @click="activeTab = 'logos'"
        >
          Logos
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-hidden">
      <StockImageGallery v-if="activeTab === 'stock'" />
      <IconGallery v-else-if="activeTab === 'icons'" />
      <LogoGallery v-else-if="activeTab === 'logos'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Search, Upload } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import FileInput from '@/components/FileInput.vue'
import { getImageDataURL } from '@/utils/image'
import useHandleCreate from '@/hooks/useHandleCreate'

import StockImageGallery from './ImageComponents/StockImageGallery.vue'
import IconGallery from './ImageComponents/IconGallery.vue'
import LogoGallery from './ImageComponents/LogoGallery.vue'

const { createImageElement } = useHandleCreate()
const activeTab = ref<'stock' | 'icons' | 'logos'>('stock')
const searchTerm = ref('')

const drawImage = (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  getImageDataURL(imageFile).then((dataURL) => createImageElement(dataURL))
}
</script>
