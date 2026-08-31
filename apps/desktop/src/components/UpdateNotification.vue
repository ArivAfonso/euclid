<template>
  <Teleport to="body">
    <!-- SmartScreen warning modal — shown before first download on Windows -->
    <SmartScreenWarningModal
      v-model:open="showSmartScreenWarning"
      @confirm="onSmartScreenConfirmed"
      @cancel="onSmartScreenCancelled"
    />

    <Transition name="update-slide">



      <div
        v-if="visible"
        class="update-notification"
        :class="{ 'is-downloading': status.state === 'downloading', 'is-downloaded': status.state === 'downloaded' }"
      >
        <!-- Progress bar background -->
        <div v-if="status.state === 'downloading' && status.progress !== undefined" class="update-progress-bar">
          <div class="update-progress-fill" :style="{ width: status.progress + '%' }" />
        </div>

        <div class="update-content">
          <!-- Icon -->
          <div class="update-icon">
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
          <div class="update-text">
            <span class="update-title">
              <template v-if="status.state === 'checking'">Checking for updates…</template>
              <template v-else-if="status.state === 'available'">
                Euclid <strong>v{{ status.version }}</strong> is available
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
            <span v-if="status.releaseDate" class="update-date">
              Released {{ formatDate(status.releaseDate) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="update-actions">
            <button
              v-if="status.state === 'available'"
              class="update-btn update-btn-primary"
              @click="handleDownload"
            >
              Download
            </button>
            <button
              v-if="status.state === 'downloaded'"
              class="update-btn update-btn-primary"
              @click="handleInstall"
            >
              Restart Now
            </button>
            <button
              v-if="status.state === 'error'"
              class="update-btn update-btn-primary"
              @click="handleRetry"
            >
              Retry
            </button>
            <button
              v-if="status.state !== 'downloading'"
              class="update-btn update-btn-ghost"
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

// ─── Helpers ────────────────────────────────────────────

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

// ─── Handlers ───────────────────────────────────────────

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

<style lang="scss" scoped>
.update-notification {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 99999;
  max-width: 420px;
  width: calc(100vw - 32px);
  background: var(--color-surface-elevated, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  backdrop-filter: blur(12px);

  // Dark mode support
  :root.dark &,
  .dark & {
    background: var(--color-surface-elevated, #1e1e2e);
    border-color: var(--color-border, #313244);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06);
  }
}

.update-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-border, #e5e7eb);

  :root.dark &,
  .dark & {
    background: var(--color-border, #313244);
  }
}

.update-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.3s ease;
  border-radius: 0 2px 2px 0;
}

.update-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
}

.update-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  color: var(--color-text-secondary, #6b7280);

  :root.dark &,
  .dark & {
    color: var(--color-text-secondary, #a6adc8);
  }
}

.update-text {
  flex: 1;
  min-width: 0;
}

.update-title {
  display: block;
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-text, #1f2937);

  strong {
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  :root.dark &,
  .dark & {
    color: var(--color-text, #cdd6f4);
    strong {
      color: var(--color-text, #ffffff);
    }
  }
}

.update-date {
  display: block;
  font-size: 11px;
  color: var(--color-text-tertiary, #9ca3af);
  margin-top: 2px;

  :root.dark &,
  .dark & {
    color: var(--color-text-tertiary, #6c7086);
  }
}

.update-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-top: -1px;
}

.update-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }
}

.update-btn-primary {
  padding: 5px 12px;
  background: #6366f1;
  color: #ffffff;

  &:hover {
    background: #4f46e5;
  }
  &:active {
    background: #4338ca;
  }
}

.update-btn-ghost {
  padding: 4px;
  background: transparent;
  color: var(--color-text-tertiary, #9ca3af);
  border-radius: 4px;

  &:hover {
    background: var(--color-hover, #f3f4f6);
    color: var(--color-text, #1f2937);
  }

  :root.dark &,
  .dark & {
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-text, #cdd6f4);
    }
  }
}

// ─── Transition ─────────────────────────────────────

.update-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.update-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}
.update-slide-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
.update-slide-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

// ─── Spinner animation ──────────────────────────────

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
</style>
