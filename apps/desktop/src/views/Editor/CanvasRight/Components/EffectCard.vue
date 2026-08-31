<template>
  <div 
    class="relative group cursor-pointer rounded-md overflow-hidden border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    :class="[
      isActive 
        ? 'border-primary ring-1 ring-primary/50 bg-primary/10' 
        : 'border-border/50 bg-background/50 hover:border-border hover:bg-muted/30 hover:-translate-y-0.5 hover:shadow-md'
    ]"
    role="button"
    tabindex="0"
    @click="$emit('toggle')"
    @keydown.enter.prevent="$emit('toggle')"
    @keydown.space.prevent="$emit('toggle')"
  >
    <!-- Effect Preview -->
    <div class="relative h-16 overflow-hidden">
      <img
        v-if="effect.preview"
        :src="effect.preview"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        draggable="false"
      />
      <div
        v-else
        class="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center"
      >
        <div 
          class="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
          :class="isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'"
        >
          <component :is="getIconComponent(effect.icon)" class="h-5 w-5" />
        </div>
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
      <div class="absolute inset-x-0 bottom-0 p-1">
        <span class="text-[9px] font-semibold text-white drop-shadow-sm truncate block">{{ effect.name }}</span>
      </div>
      <div v-if="isActive" class="absolute top-1 left-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white/70"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ImageEffectConfig } from '@/types/imageEffects'
import { icons } from '@/plugins/icon'

defineProps<{
  effect: ImageEffectConfig
  isActive: boolean
}>()

defineEmits<{
  toggle: []
}>()

// Map effect icon names to available Lucide icons
const iconMap: Record<string, any> = {
  IconGridFour: icons.IconAllApplication,
  IconRadar: icons.IconAllApplication,
  IconCut: icons.IconTailoring,
  IconDroplet: icons.IconEffects,
  IconBorderStyle: icons.IconSquare,
  IconDotGrid: icons.IconAllApplication,
  IconColorFilter: icons.IconColorFilter,
  IconTv: icons.IconVideoTwo,
  IconBlendted: icons.IconRound,
  IconFlipHorizontal: icons.IconFlipHorizontally,
  IconCircle: icons.IconRound,
  IconPalette: icons.IconColorFilter,
  IconColorSwatch: icons.IconPlatte,
  IconAdjustmentsHorizontal: icons.IconMore,
}

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || icons.IconEffects
}
</script>

<style scoped>
</style>
