<template>
  <router-view />
  <Toaster />
  <UpdateNotification />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useMainStore } from '@/store'
import { Toaster } from '@/components/ui/toast'
import UpdateNotification from '@/components/UpdateNotification.vue'

const mainStore = useMainStore()

// Initialize dark mode on mount
onMounted(() => {
  if (mainStore.isDarkMode) {
    document.documentElement.classList.add('dark')
  }
  mainStore.initializeCustomFonts()
})

// Listen for PWA registration events at the main entry
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
})


</script>

<style lang="scss">
#app {
  height: 100%;
}
</style>
