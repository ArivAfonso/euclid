<template>
  <div>
    <Popover v-model:open="hasHelp">
      <PopoverTrigger as-child>
        <div ref="triggerRef"></div>
      </PopoverTrigger>
      <PopoverContent side="right" class="w-[200px] p-1">
        <div class="space-y-0.5">
          <button 
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent"
            @click="createTemplate()"
          >
            <IconPlus class="h-4 w-4 text-blue-500"/>
            <span class="font-medium">Add Template</span>
          </button>
          
          <button 
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent"
          >
            <IconNewlybuild class="h-4 w-4 text-green-500"/>
            <span class="font-medium">Create Design</span>
          </button>
          
          <button 
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent"
            @click="openUpload"
          >
            <IconUpload class="h-4 w-4 text-purple-500"/>
            <span class="font-medium">Upload</span>
          </button>
          
          <Separator class="my-1" />
          
          <button 
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent"
          >
            <IconDividingLine class="h-4 w-4 text-orange-500"/>
            <span class="font-medium">Reference Line</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
    <FileUpload :visible="dialogVisible" @close="closeUpload"/>
    <ReferencePopover />
  </div>
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue'

import useHandleTemplate from '@/hooks/useHandleTemplate'
import ReferencePopover from '@/components/ReferencePopover.vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
const { createTemplate } = useHandleTemplate()


const hasHelp = ref(false)
const popoverVisible = ref(false)
const dialogVisible = ref(false)
const triggerRef = ref()
const props = defineProps({
  menuRef: {
    type: null,
  },
  menuPopoverRef: {
    type: null
  },
  menuVisibleRef: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (event: 'hide'): void
}>()

const setHome = (val: boolean) => {
  hasHelp.value = val
}

const openUpload = () => {
  dialogVisible.value = true
}

const closeUpload = () => {
  dialogVisible.value = false
}

</script>