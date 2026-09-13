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
  // The pre-boot theme classes from index.html exist only to paint the loading
  // screen before Vue mounts. They must not outlive it, otherwise their body
  // color / color-scheme rules keep overriding the app theme after the user
  // switches modes (washed-out text, stale native controls).
  document.documentElement.classList.remove('dark-boot', 'light-boot')
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
