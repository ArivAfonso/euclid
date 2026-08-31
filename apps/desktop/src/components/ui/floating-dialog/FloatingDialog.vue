<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="floating-dialog"
      :style="{ left: `${x}px`, top: `${y}px`, width }"
    >
      <div class="floating-dialog__header" @mousedown="$emit('drag-start', $event)">
        <span class="text-xs font-semibold uppercase tracking-wide">{{ title }}</span>
        <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" @click.stop="$emit('close')">Close</Button>
      </div>

      <div class="floating-dialog__body">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";

withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    x: number;
    y: number;
    width?: string;
  }>(),
  {
    title: "Dialog",
    width: "300px",
  }
);

defineEmits<{
  (event: "close"): void;
  (event: "drag-start", e: MouseEvent): void;
}>();
</script>

<style lang="scss" scoped>
.floating-dialog {
  position: fixed;
  z-index: 1200;
  border-radius: 10px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.floating-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted));
  cursor: move;
  user-select: none;
}

.floating-dialog__body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
