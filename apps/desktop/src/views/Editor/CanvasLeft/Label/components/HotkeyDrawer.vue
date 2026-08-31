<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="left" class="w-80">
      <SheetHeader>
        <SheetTitle>Keyboard Shortcuts</SheetTitle>
        <SheetDescription>Quick reference for all available shortcuts</SheetDescription>
      </SheetHeader>
      <div class="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] pr-2">
        <template v-for="item in HOTKEY_DOC" :key="item.type">
          <div class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-200 dark:border-gray-800">
              {{ item.type }}
            </h3>
            <div class="space-y-1">
              <div 
                v-for="hotkey in item.children" 
                :key="hotkey.label"
                class="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <span class="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[160px]">{{ hotkey.label }}</span>
                <kbd class="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded shadow-sm">
                  {{ hotkey.value }}
                </kbd>
              </div>
            </div>
          </div>
        </template>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { HOTKEY_DOC } from '@/configs/hotkey'

const props = defineProps({
  hasHotkey: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (event: 'update:hasHotkey', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.hasHotkey,
  set: (value) => emit('update:hasHotkey', value)
})
</script>