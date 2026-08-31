<template>
  <Button
    variant="ghost"
    size="icon"
    @click="toggleTheme"
    class="relative h-8 w-8"
  >
    <Sun
      class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
    />
    <Moon
      class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
    />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>

<script setup lang="ts">
import { useMainStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-vue-next'

const mainStore = useMainStore()

const toggleTheme = () => {
  mainStore.toggleDarkMode()
}
</script>
