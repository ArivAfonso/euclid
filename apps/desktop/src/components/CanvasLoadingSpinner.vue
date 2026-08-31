<template>
  <div v-if="show" class="canvas-loading-overlay">
    <div class="canvas-loading-content">
      <div class="canvas-loading-spinner"></div>
      <p class="canvas-loading-text">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  message?: string
}>()
</script>

<style scoped>
.canvas-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: hsl(var(--background) / 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in-out;
}

.canvas-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px;
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow: 0 8px 32px hsl(var(--foreground) / 0.08);
}

.canvas-loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid hsl(var(--muted));
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.canvas-loading-text {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
