<template>
  <div
    class="z-50 min-w-[7.25rem] max-h-[70vh] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80
           data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
           [&::-webkit-scrollbar]:w-1 
           [&::-webkit-scrollbar-track]:bg-transparent
           [&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50
           [&::-webkit-scrollbar-thumb]:rounded-full"
  >
    <template v-for="(menu, index) in menus" :key="menu.text || index">
      <div
        v-if="!menu.hide && menu.divider"
        class="-mx-0.5 my-0.5 h-px bg-border"
      />

      <div
        v-else-if="!menu.hide"
        :class="[
          'grid grid-cols-[1.25rem_1fr_auto] gap-x-2 items-center rounded-sm px-2 py-1 text-xs outline-none transition-colors text-muted-foreground cursor-default select-none',
          menu.disable
            ? 'pointer-events-none opacity-50'
            : 'hover:bg-accent hover:text-accent-foreground',
          activeSubmenuIndex === index ? 'bg-accent text-accent-foreground' : '',
        ]"
        @mouseenter="handleMouseEnter(menu, index, $event)"
        @mouseleave="scheduleHide"
        @click.stop="handleItemClick(menu)"
      >
        <div class="flex items-center justify-center w-4 h-4">
          <component v-if="menu.icon" :is="iconMap[menu.icon]" class="h-3.5 w-3.5 shrink-0" />
        </div>
        <span class="truncate">{{ menu.text }}</span>

        <span
          v-if="menu.subText && !menu.children"
          class="ml-3 text-[9px] text-muted-foreground"
        >
          {{ menu.subText }}
        </span>

        <svg
          v-if="menu.children && menu.children.length"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="pl-0.5 w-3.5 h-3.5"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </template>
  </div>

  <Teleport to="body">
    <div
      v-if="activeSubmenu"
      :style="submenuStyle"
      class="fixed z-[10000] min-w-[8.25rem] max-h-[70vh] overflow-y-auto rounded-md bg-popover text-popover-foreground shadow-md
             data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
             [&::-webkit-scrollbar]:w-1
             [&::-webkit-scrollbar-track]:bg-transparent
             [&::-webkit-scrollbar-thumb]:bg-gray-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600/50
             [&::-webkit-scrollbar-thumb]:rounded-full"
      @mouseenter="cancelHide"
      @mouseleave="scheduleHide"
    >
      <menu-content
        :menus="activeSubmenu.children"
        :handleClickMenuItem="handleClickMenuItem"
      />
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onUnmounted, PropType } from 'vue'
import { ContextMenu } from './types'
import {
  Scissors,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Download,
  Sparkles,
  AlignCenterHorizontal,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Layers,
  BringToFront,
  MoveUp,
  MoveDown,
  SendToBack,
  Group,
  Ungroup,
  MousePointer2,
  Lock,
  Trash2,
  Unlock,
  Ruler,
  Grid3x3,
  RotateCcw,
  FileImage,
  FilePlus,
  Play,
  Globe,
  GlobeLock,
} from "lucide-vue-next"

const iconMap: Record<string, any> = {
  Scissors,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Download,
  Sparkles,
  AlignCenterHorizontal,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Layers,
  BringToFront,
  MoveUp,
  MoveDown,
  SendToBack,
  Group,
  Ungroup,
  MousePointer2,
  Lock,
  Trash2,
  Unlock,
  Ruler,
  Grid3x3,
  RotateCcw,
  FileImage,
  FilePlus,
  Play,
  Globe,
  GlobeLock,
}

const SUBMENU_WIDTH = 140
const HIDE_DELAY = 150

const props = defineProps({
  menus: {
    type: Array as PropType<ContextMenu[]>,
    required: true,
  },
  handleClickMenuItem: {
    type: Function,
    required: true,
  },
})

const activeSubmenuIndex = ref(-1)
const hideTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const submenuStyle = ref<Record<string, string>>({})

const activeSubmenu = computed(() => {
  if (activeSubmenuIndex.value < 0) return null
  const menu = props.menus[activeSubmenuIndex.value]
  if (!menu || !menu.children || !menu.children.length) return null
  return menu
})

const handleMouseEnter = (menu: ContextMenu, index: number, event: MouseEvent) => {
  cancelHide()
  if (menu.children && menu.children.length) {
    activeSubmenuIndex.value = index
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const roomOnRight = rect.right + SUBMENU_WIDTH + 4 < window.innerWidth
    submenuStyle.value = roomOnRight
      ? { left: (rect.right + 4) + 'px', top: rect.top + 'px' }
      : { right: (window.innerWidth - rect.left + 4) + 'px', top: rect.top + 'px' }
  } else {
    activeSubmenuIndex.value = -1
  }
}

const scheduleHide = () => {
  hideTimeout.value = setTimeout(() => {
    activeSubmenuIndex.value = -1
  }, HIDE_DELAY)
}

const cancelHide = () => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
    hideTimeout.value = null
  }
}

const handleItemClick = (menu: ContextMenu) => {
  if (menu.disable) return
  if (menu.children && menu.children.length) return
  props.handleClickMenuItem(menu)
}

onUnmounted(() => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
  }
})
</script>