<template>
  <Teleport to="body">
    <!-- SmartScreen warning modal — shown before first download on Windows -->
    <SmartScreenWarningModal
      v-model:open="showSmartScreenWarning"
      @confirm="onSmartScreenConfirmed"
      @cancel="onSmartScreenCancelled"
    />

    <Transition
      enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="translate-y-3 scale-[0.97] opacity-0"
      leave-active-class="transition-all duration-200 ease-[cubic-bezier(0.4,0,1,1)]"
      leave-to-class="translate-y-2 scale-[0.98] opacity-0"
    >
      <div
        v-if="visible"
        class="fixed bottom-4 right-4 z-[99999] w-[calc(100vw_-_32px)] max-w-[420px] overflow-hidden rounded-[10px] border border-border bg-card font-sans shadow-[0_4px_24px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] backdrop-blur-md dark:bg-[hsl(0,0%,11%)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        <!-- Progress bar background -->
        <div v-if="status.state === 'downloading' && status.progress !== undefined" class="absolute inset-x-0 top-0 h-[3px] bg-border">
          <div class="h-full rounded-r-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-300 ease-out" :style="{ width: status.progress + '%' }" />
        </div>

        <div class="flex items-start gap-3 px-4 py-3.5">
          <!-- Icon -->
          <div class="mt-px h-[18px] w-[18px] shrink-0 text-muted-foreground">
            <!-- Idle / checking: refresh icon -->
            <svg v-if="status.state === 'checking'" class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <!-- Available: download icon -->
            <svg v-else-if="status.state === 'available'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <!-- Downloading: download with progress -->
            <svg v-else-if="status.state === 'downloading'" class="animate-pulse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <!-- Downloaded: checkmark -->
            <svg v-else-if="status.state === 'downloaded'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <!-- Error: alert -->
            <svg v-else-if="status.state === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <!-- Text -->
          <div class="min-w-0 flex-1">
            <span class="block text-[13px] leading-[1.4] text-foreground">
              <template v-if="status.state === 'checking'">Checking for updates…</template>
              <template v-else-if="status.state === 'available'">
                Euclid <strong class="font-semibold text-foreground">v{{ status.version }}</strong> is available
              </template>
              <template v-else-if="status.state === 'downloading'">
                Downloading update… {{ status.progress }}%
              </template>
              <template v-else-if="status.state === 'downloaded'">
                Update ready — restart to install
              </template>
              <template v-else-if="status.state === 'error'">
                Update failed: {{ status.error }}
              </template>
            </span>
            <span v-if="status.releaseDate" class="mt-0.5 block text-[11px] text-muted-foreground">
              Released {{ formatDate(status.releaseDate) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="-mt-px flex shrink-0 items-center gap-1.5">
            <button
              v-if="status.state === 'available'"
              class="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-indigo-500 px-3 py-[5px] text-xs font-medium text-white transition-all duration-150 hover:bg-indigo-600 active:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              @click="handleDownload"
            >
              Download
            </button>
            <button
              v-if="status.state === 'downloaded'"
              class="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-indigo-500 px-3 py-[5px] text-xs font-medium text-white transition-all duration-150 hover:bg-indigo-600 active:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              @click="handleInstall"
            >
              Restart Now
            </button>
            <button
              v-if="status.state === 'error'"
              class="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-indigo-500 px-3 py-[5px] text-xs font-medium text-white transition-all duration-150 hover:bg-indigo-600 active:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              @click="handleRetry"
            >
              Retry
            </button>
            <button
              v-if="status.state !== 'downloading'"
              class="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm bg-transparent p-1 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:hover:bg-white/[0.08]"
              @click="handleDismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SmartScreenWarningModal from '@/components/SmartScreenWarningModal.vue'

// ─── Types ──────────────────────────────────────────────

interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  releaseDate?: string
  releaseNotes?: string
  progress?: number
  error?: string
}

// ─── State ──────────────────────────────────────────────

const status = ref<UpdateStatus>({ state: 'idle' })
const visible = ref(false)
const dismissed = ref(false)
const showSmartScreenWarning = ref(false)
let unsubscribe: (() => void) | null = null

const SMARTScreen_STORAGE_KEY = 'euclid:skip-smartscreen-warning'

// ─── Helpers ────

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ─── Handlers ────

/** Intercept Download click — show SmartScreen warning first unless user opted out */
function handleDownload() {
  const win = (window as any).electron
  if (!win?.updater) return

  // Check if user previously chose "Don't show again"
  let skipWarning = false
  try {
    skipWarning = localStorage.getItem(SMARTScreen_STORAGE_KEY) === 'true'
  } catch {
    // localStorage may be unavailable — show warning to be safe
  }

  if (skipWarning) {
    doDownload()
  } else {
    showSmartScreenWarning.value = true
  }
}

/** User confirmed the SmartScreen warning — proceed with download */
function onSmartScreenConfirmed() {
  doDownload()
}

/** User cancelled the SmartScreen warning — do nothing */
function onSmartScreenCancelled() {
  // Modal closed, stay on the "available" state
}

async function doDownload() {
  const win = (window as any).electron
  if (!win?.updater) return
  await win.updater.download()
}

async function handleInstall() {
  const win = (window as any).electron
  if (!win?.updater) return
  await win.updater.install()
}

async function handleRetry() {
  dismissed.value = false
  const win = (window as any).electron
  if (!win?.updater) return
  await win.updater.check()
}

function handleDismiss() {
  dismissed.value = true
  visible.value = false
}

// ─── Lifecycle ──────────────────────────────────────────

onMounted(async () => {
  const win = (window as any).electron
  if (!win?.updater) {
    // Not running in Electron — silently skip
    return
  }

  // Subscribe to status changes pushed from the main process
  unsubscribe = win.updater.onStatus((newStatus: UpdateStatus) => {
    status.value = newStatus

    // Show the notification for meaningful states, hide for idle
    if (newStatus.state === 'idle') {
      if (!dismissed.value) {
        // Initial background check completed, stay hidden
      }
      visible.value = false
    } else {
      dismissed.value = false
      visible.value = true
    }
  })

  // Get the current status (in case the check already completed before mount)
  const current = await win.updater.getStatus()
  if (current && current.state !== 'idle') {
    status.value = current
    visible.value = true
  }
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>
