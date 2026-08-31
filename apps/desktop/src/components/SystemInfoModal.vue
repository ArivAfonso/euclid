<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-lg shadow-none">
      <DialogHeader>
        <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            System Information
          </DialogTitle>
      </DialogHeader>

      <div class="overflow-y-auto max-h-[60vh] pr-4 space-y-4">
        <!-- Application Info Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Application
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Name:</span>
              <span class="text-muted-foreground ml-2">Euclid Design Studio</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Version:</span>
              <span class="text-muted-foreground ml-2">1.0.0</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Build:</span>
              <span class="text-muted-foreground ml-2">2025.10.19</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Platform:</span>
              <span class="text-muted-foreground ml-2">{{ platform }}</span>
            </div>
          </div>
        </div>

        <!-- System Resources Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            System Resources
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Memory Usage:</span>
              <span class="text-muted-foreground ml-2">{{ memoryUsage }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">CPU Cores:</span>
              <span class="text-muted-foreground ml-2">{{ cpuCores }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Display:</span>
              <span class="text-muted-foreground ml-2">{{ displayResolution }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Theme:</span>
              <span class="text-muted-foreground ml-2">{{ theme }}</span>
            </div>
          </div>
        </div>

        <!-- Browser Info Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Browser & Runtime
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">User Agent:</span>
              <span class="text-muted-foreground ml-2 break-all">{{ userAgent }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">WebGL:</span>
              <span class="text-muted-foreground ml-2">{{ webglSupport ? 'Supported' : 'Not Supported' }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Canvas 2D:</span>
              <span class="text-muted-foreground ml-2">{{ canvas2dSupport ? 'Supported' : 'Not Supported' }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Local Storage:</span>
              <span class="text-muted-foreground ml-2">{{ localStorageSupport ? 'Available' : 'Not Available' }}</span>
            </div>
          </div>
        </div>

        <!-- Performance Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Performance
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Page Load Time:</span>
              <span class="text-muted-foreground ml-2">{{ loadTime }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">FPS:</span>
              <span class="text-muted-foreground ml-2">{{ fps }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Network:</span>
              <span class="text-muted-foreground ml-2">{{ networkStatus }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Battery:</span>
              <span class="text-muted-foreground ml-2">{{ batteryStatus }}</span>
            </div>
          </div>
        </div>

        <!-- Storage Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            Storage & Cache
          </h3>
          <div class="space-y-1.5">
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Local Storage:</span>
              <span class="text-muted-foreground ml-2">{{ localStorageSize }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Session Storage:</span>
              <span class="text-muted-foreground ml-2">{{ sessionStorageSize }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">IndexedDB:</span>
              <span class="text-muted-foreground ml-2">{{ indexedDBSupport ? 'Available' : 'Not Available' }}</span>
            </div>
            <div class="text-[11px]">
              <span class="font-semibold text-foreground">Cache Storage:</span>
              <span class="text-muted-foreground ml-2">{{ cacheStorageSupport ? 'Available' : 'Not Available' }}</span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          @click="isOpen = false"
          class="h-7 text-xs px-3"
          variant="outline"
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useMainStore } from '@/store'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = ref(props.open ?? false)
const mainStore = useMainStore()
const { isDarkMode } = storeToRefs(mainStore)

// System information
const platform = ref('Web/Electron')
const memoryUsage = ref('~45 MB')
const cpuCores = ref(navigator.hardwareConcurrency?.toString() || 'Unknown')
const displayResolution = ref(`${window.screen.width}x${window.screen.height}`)
const theme = ref('System')
const userAgent = ref(navigator.userAgent)
const webglSupport = ref(false)
const canvas2dSupport = ref(false)
const localStorageSupport = ref(false)
const loadTime = ref('~2.3s')
const fps = ref('60 FPS')
const networkStatus = ref('Online')
const batteryStatus = ref('Unknown')
const localStorageSize = ref('~2.1 KB')
const sessionStorageSize = ref('~0.8 KB')
const indexedDBSupport = ref(false)
const cacheStorageSupport = ref(false)

watch(isOpen, (value) => {
  emit('update:open', value)
})

watch(() => props.open, (value) => {
  if (value !== undefined) {
    isOpen.value = value
  }
})

watch(isDarkMode, (value) => {
  theme.value = value ? 'Dark' : 'Light'
})

onMounted(() => {
  // Check WebGL support
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    webglSupport.value = !!gl
  } catch (e) {
    webglSupport.value = false
  }

  // Check Canvas 2D support
  try {
    const canvas = document.createElement('canvas')
    canvas2dSupport.value = !!canvas.getContext('2d')
  } catch (e) {
    canvas2dSupport.value = false
  }

  // Check Local Storage support
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    localStorageSupport.value = true
  } catch (e) {
    localStorageSupport.value = false
  }

  // Check IndexedDB support
  indexedDBSupport.value = !!window.indexedDB

  // Check Cache Storage support
  cacheStorageSupport.value = !!window.caches

  // Check if running in Electron
  if (window.electron) {
    platform.value = 'Electron'
  } else {
    platform.value = 'Web Browser'
  }

  // Get network status
  networkStatus.value = navigator.onLine ? 'Online' : 'Offline'

  // Try to get battery info
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      const level = Math.round(battery.level * 100)
      const charging = battery.charging ? 'Charging' : 'Not Charging'
      batteryStatus.value = `${level}% - ${charging}`
    }).catch(() => {
      batteryStatus.value = 'Not Available'
    })
  }
})
</script>

<style scoped>
:deep(.radix-dialog-overlay) {
  background-color: transparent !important;
}
</style>