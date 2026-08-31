<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <div ref="triggerRef" style="display: none;"></div>
    </PopoverTrigger>
    <PopoverContent side="right" align="start" class="w-56 p-1">
      <div class="space-y-0.5">
        <button
          @click="openBeginnerGuide"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
        >
          <IconGuideBoard class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span class="text-gray-900 dark:text-gray-100">Beginner Guide</span>
        </button>
        <button
          @click="openUserGuide"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
        >
          <IconVideoTwo class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span class="text-gray-900 dark:text-gray-100">User Guide</span>
        </button>
        <button
          @click="openShortcuts"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
        >
          <IconKeyboardOne class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span class="text-gray-900 dark:text-gray-100">Shortcuts</span>
        </button>
        <button
          @click="openSuggestions"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
        >
          <IconEdit class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span class="text-gray-900 dark:text-gray-100">Suggestions</span>
        </button>
        <button
          @click="openOnlineSupport"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
        >
          <IconHeadsetOne class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span class="text-gray-900 dark:text-gray-100">Online Support</span>
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/ui/toast/use-toast'

const props = defineProps({
  helpRef: {
    type: Object,
    default: null,
  },
  helpPopoverRef: {
    type: Object,
    default: null,
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'openShortcuts'): void
}>()

const isOpen = ref(false)
const triggerRef = ref()

// Watch for external trigger
watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
})

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

const openBeginnerGuide = () => {
  isOpen.value = false
  toast({
    title: 'Beginner Guide',
    description: 'Opening beginner guide...',
  })
  // Add actual guide logic here
}

const openUserGuide = () => {
  isOpen.value = false
  toast({
    title: 'User Guide',
    description: 'Opening user guide...',
  })
  // Add actual guide logic here
}

const openShortcuts = () => {
  isOpen.value = false
  emit('openShortcuts')
}

const openSuggestions = () => {
  isOpen.value = false
  toast({
    title: 'Suggestions',
    description: 'We\'d love to hear your feedback!',
  })
  // Add actual feedback form logic here
}

const openOnlineSupport = () => {
  isOpen.value = false
  toast({
    title: 'Online Support',
    description: 'Connecting to support...',
  })
  // Add actual support logic here
}
</script>