<template>
  <div class="border border-border/50 rounded-md p-2.5 bg-muted/20 space-y-2">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Crop
      </h3>
      <Badge variant="outline" class="text-[10px] px-1.5 py-0 font-mono">
        {{ width }} × {{ height }} px
      </Badge>
    </div>

    <div class="grid grid-cols-3 gap-1.5">
      <button
        v-for="preset in presets"
        :key="preset.key"
        type="button"
        @click="emit('select', preset.key)"
        class="flex flex-col items-center gap-1 rounded-md border px-2 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="[
          activeKey === preset.key
            ? 'border-primary bg-primary/10 text-primary shadow-sm'
            : 'border-border/60 bg-background/40 hover:border-primary/50 hover:text-primary'
        ]"
      >
        <div class="relative flex w-full flex-1 items-center justify-center">
          <div class="relative flex h-12 w-full items-center justify-center">
            <div
              class="rounded-sm border border-dashed border-muted-foreground/60 bg-muted/60"
              :style="previewBoxStyle(preset.ratio)"
            ></div>
          </div>
        </div>
        <span class="text-[11px] font-medium">{{ preset.label }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toRefs } from "vue";
import { Badge } from "@/components/ui/badge";

interface CropPresetOption {
  key: string;
  label: string;
  ratio: number;
}

const props = defineProps<{
  presets: CropPresetOption[];
  activeKey: string;
  width: number;
  height: number;
}>();

const emit = defineEmits<{ (e: "select", key: string): void }>();

const { presets, activeKey, width, height } = toRefs(props);

const previewBoxStyle = (ratio: number) => {
  if (!ratio) {
    return {
      width: "70%",
      height: "70%",
    };
  }

  const maxSize = 70;
  if (ratio > 1) {
    const height = maxSize;
    const width = Math.max(28, height / ratio);
    return {
      width: `${width}%`,
      height: `${height}%`,
    };
  }

  const width = maxSize;
  const height = Math.max(28, width * ratio);
  return {
    width: `${width}%`,
    height: `${height}%`,
  };
};
</script>
