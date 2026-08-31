<!-- setup cannot set component name, component name keepAlive required -->
<script lang="ts">
export default {
  name: "Page404",
};
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Compass, Home } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ElectronTitlebar from '@/components/ElectronTitlebar.vue'

const router = useRouter()

// Canvas-transformer style handles, expressed purely with Tailwind utilities
const HANDLE = 'absolute h-2.5 w-2.5 rounded-full border-2 border-[#3b82f6] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.15)]'
const PILL = 'absolute rounded-full border-2 border-[#3b82f6] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.15)]'

const isElectronMode = computed(() => {
  return import.meta.env.MODE === 'electron' || window.electron !== undefined
})

const goBack = () => router.push('/projects')
const goHome = () => router.push('/')
</script>

<template>
  <div class="relative flex flex-col h-screen overflow-hidden bg-background text-foreground select-none">
    <!-- Canvas grid backdrop -->
    <div
      class="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.45)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.45)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black_25%,transparent_78%)]"
      aria-hidden="true"
    />
    <!-- Soft red glow behind the artboard -->
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-[28rem] rounded-full bg-red-600/5 blur-3xl" aria-hidden="true" />

    <!-- Electron Titlebar -->
    <ElectronTitlebar v-if="isElectronMode" title="Euclid" context="projects" />

    <!-- Fallback titlebar (web mode) -->
    <div v-else class="relative h-10 bg-background border-b border-border/50 flex items-center justify-between px-4">
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-foreground">Euclid</span>
      </div>
    </div>

    <!-- Main content -->
    <main class="relative flex-1 flex flex-col items-center justify-center gap-7 px-6">
      <!-- Eyebrow label -->
      <div class="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div class="w-2 h-2 bg-red-600 rounded-sm" />
        <span class="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Error 404 — Page not found
        </span>
      </div>

      <!-- The missing "artboard", framed like a selected canvas object -->
      <div class="animate-in fade-in zoom-in-95 duration-700">
        <div class="relative animate-artboard-float">
          <div class="relative border border-dashed border-blue-500/60 rounded-sm px-14 py-8 sm:px-20 sm:py-10">
            <span class="block font-serif font-extralight text-7xl sm:text-8xl md:text-[9rem] leading-none tracking-tight text-foreground">
              404
            </span>

            <!-- Corner scale handles (canvas transformer style) -->
            <span :class="HANDLE" class="-top-[5px] -left-[5px]" aria-hidden="true" />
            <span :class="HANDLE" class="-top-[5px] -right-[5px]" aria-hidden="true" />
            <span :class="HANDLE" class="-bottom-[5px] -left-[5px]" aria-hidden="true" />
            <span :class="HANDLE" class="-bottom-[5px] -right-[5px]" aria-hidden="true" />

            <!-- Mid-edge pill handles -->
            <span :class="PILL" class="left-[-3px] top-1/2 h-1.5 w-[18px] -translate-y-1/2" aria-hidden="true" />
            <span :class="PILL" class="right-[-3px] top-1/2 h-1.5 w-[18px] -translate-y-1/2" aria-hidden="true" />
            <span :class="PILL" class="top-[-3px] left-1/2 w-1.5 h-[18px] -translate-x-1/2" aria-hidden="true" />
            <span :class="PILL" class="bottom-[-3px] left-1/2 w-1.5 h-[18px] -translate-x-1/2" aria-hidden="true" />
          </div>

          <!-- Dimension badge, like the canvas size label -->
          <div class="absolute left-1/2 -translate-x-1/2 -bottom-9 whitespace-nowrap rounded border border-border/50 bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground shadow-sm">
            404 × 404 px
          </div>
        </div>
      </div>

      <!-- Copy -->
      <div class="max-w-md text-center space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
        <h1 class="font-serif font-light text-2xl text-foreground">
          This artboard doesn't exist
        </h1>
        <p class="text-xs text-muted-foreground leading-relaxed">
          The page you're looking for may have been moved, deleted, or never existed in this document.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
        <Button
          class="h-8 text-xs px-4 bg-red-600 hover:bg-red-700 text-white"
          @click="goBack"
        >
          <ArrowLeft class="w-3.5 h-3.5 mr-1.5" />
          Back to Projects
        </Button>
        <Button variant="outline" class="h-8 text-xs px-4" @click="goHome">
          <Home class="w-3.5 h-3.5 mr-1.5" />
          Go Home
        </Button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative pb-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground animate-in fade-in duration-700 delay-300">
      <Compass class="h-3 w-3" />
      <span>HTTP 404 · Not Found</span>
      <span class="text-border">|</span>
      <span>Euclid</span>
    </footer>
  </div>
</template>
