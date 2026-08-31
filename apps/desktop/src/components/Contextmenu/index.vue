<template>
  <div 
    class="fixed inset-0 z-[9998] bg-transparent"
    @contextmenu.prevent="removeContextmenu()"
    @mousedown="removeContextmenu()"
  ></div>

  <div 
    class="fixed z-[9999] select-none"
    :style="{
      left: menuPosition.left + 'px',
      top: menuPosition.top + 'px',
    }"
    @contextmenu.prevent
  >
    <MenuContent 
      :menus="menus"
      :handleClickMenuItem="handleClickMenuItem"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { ContextMenu, Axis } from './types'

import MenuContent from './MenuContent.vue'

const props = defineProps({
  axis: {
    type: Object as PropType<Axis>,
    required: true,
  },
  el: {
    type: Object as PropType<HTMLElement>,
    required: true,
  },
  menus: {
    type: Array as PropType<ContextMenu[]>,
    required: true,
  },
  removeContextmenu: {
    type: Function,
    required: true,
  },
})

const menuPosition = computed(() => {
  const MENU_WIDTH = 160
  const MENU_HEIGHT = 26
  const DIVIDER_HEIGHT = 9
  const PADDING = 4

  const { x, y } = props.axis
  const menuCount = props.menus.filter(menu => !(menu.divider || menu.hide)).length
  const dividerCount = props.menus.filter(menu => menu.divider).length

  const menuWidth = MENU_WIDTH
  const menuHeight = menuCount * MENU_HEIGHT + dividerCount * DIVIDER_HEIGHT + PADDING * 2
  const maxHeight = window.innerHeight * 0.7

  const screenWidth = document.body.clientWidth
  const screenHeight = document.body.clientHeight

  return {
    left: screenWidth <= x + menuWidth ? x - menuWidth : x,
    top: screenHeight <= y + Math.min(menuHeight, maxHeight) ? y - Math.min(menuHeight, maxHeight) : y,
  }
})

const handleClickMenuItem = (item: ContextMenu) => {
  if (item.disable) return
  if (item.children && !item.handler) return
  if (item.handler) item.handler(props.el)
  props.removeContextmenu()
}
</script>
