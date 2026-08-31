<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-lg shadow-none select-none">
      <DialogHeader>
        <DialogTitle class="text-xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
          <div class="w-2 h-2 bg-amber-500 rounded-sm"></div>
          Before You Update
        </DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground">
          Euclid is not code-signed — here's what to expect on Windows.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- What's happening -->
        <div class="space-y-2 border border-amber-500/20 rounded-md p-3 bg-amber-500/5">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <div class="w-1.5 h-1.5 bg-amber-500 rounded-sm"></div>
            What's going to happen
          </h3>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            When the installer launches, Windows SmartScreen will show a warning because Euclid is
            <strong class="text-foreground">not code-signed</strong> (signed certificates cost ~$300+/year).
            This is <strong class="text-foreground">completely normal</strong> for open-source projects — the app is safe, Windows just doesn't recognize the publisher.
          </p>
        </div>

        <!-- Steps -->
        <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
            How to bypass (2 clicks)
          </h3>

          <!-- Step 1 -->
          <div class="flex gap-3 items-start">
            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
              <span class="text-[11px] font-bold text-primary">1</span>
            </div>
            <div class="space-y-1 flex-1">
              <p class="text-xs font-medium text-foreground">Click <span class="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">More info</span></p>
              <p class="text-[11px] text-muted-foreground">When the blue SmartScreen popup appears: "Windows protected your PC" — don't worry, just click the "More info" link at the bottom.</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex gap-3 items-start">
            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
              <span class="text-[11px] font-bold text-primary">2</span>
            </div>
            <div class="space-y-1 flex-1">
              <p class="text-xs font-medium text-foreground">Click <span class="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] font-mono">Run anyway</span></p>
              <p class="text-[11px] text-muted-foreground">A new button will appear at the bottom. Click "Run anyway" and the installer will proceed normally.</p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex gap-3 items-start">
            <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
              <span class="text-[11px] font-bold text-primary">3</span>
            </div>
            <div class="space-y-1 flex-1">
              <p class="text-xs font-medium text-foreground">That's it — you're done!</p>
              <p class="text-[11px] text-muted-foreground">The Euclid installer will run, install the update, and restart the app. All your files and settings are preserved.</p>
            </div>
          </div>
        </div>

        <!-- Mac / Linux users -->
        <div class="space-y-2 border border-border/50 rounded-md p-3 bg-muted/20">
          <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <div class="w-1.5 h-1.5 bg-green-500 rounded-sm"></div>
            macOS &amp; Linux users
          </h3>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            This warning <strong class="text-foreground">only applies to Windows</strong>.
            On macOS you may need to right-click → Open the first time (Gatekeeper), and Linux AppImage has no warnings at all.
          </p>
        </div>

        <!-- Don't show again -->
        <div class="flex items-center gap-2.5 px-1">
          <Checkbox
            id="dont-show-again"
            :model-value="dontShowAgain"
            @update:model-value="dontShowAgain = $event"
          />
          <Label for="dont-show-again" class="text-xs text-muted-foreground cursor-pointer select-none">
            Don't show this again — I understand
          </Label>
        </div>
      </div>

      <DialogFooter class="flex items-center justify-between">
        <Button
          variant="ghost"
          class="h-7 text-xs text-muted-foreground"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button
          class="h-7 text-xs px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
          @click="handleConfirm"
        >
          I understand, Download
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const STORAGE_KEY = 'euclid:skip-smartscreen-warning'

const props = defineProps<{
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const isOpen = ref(props.open ?? false)
const dontShowAgain = ref(false)

watch(() => props.open, (val) => {
  isOpen.value = val ?? false
})

watch(isOpen, (val) => {
  emit('update:open', val)
})

function handleConfirm() {
  if (dontShowAgain.value) {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // localStorage may be unavailable — ignore
    }
  }
  isOpen.value = false
  emit('confirm')
}

function handleCancel() {
  isOpen.value = false
  emit('cancel')
}
</script>
