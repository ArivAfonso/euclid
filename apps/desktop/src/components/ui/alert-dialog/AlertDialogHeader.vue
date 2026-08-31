<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

interface Props {
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('flex flex-col space-y-2 sm:space-y-0', props.class)">
    <slot />
  </div>
</template>
