<script setup lang="ts">
import type { RadioGroupItemProps } from "reka-ui"
import { RadioGroupIndicator, RadioGroupItem as RadioGroupItemPrimitive } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { cn } from "@/lib/utils"

interface Props extends RadioGroupItemProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()

const mergedClass = computed(() =>
  cn(
    "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
    props.class,
  ),
)
</script>

<template>
  <RadioGroupItemPrimitive v-bind="props" :class="mergedClass">
    <RadioGroupIndicator class="flex items-center justify-center text-current">
      <span class="h-2 w-2 rounded-full bg-current" />
    </RadioGroupIndicator>
  </RadioGroupItemPrimitive>
</template>
