<script setup lang="ts">
import { DialogClose } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Props {
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
</script>

<template>
  <DialogClose as-child>
    <Button :variant="'outline'" :class="cn('mt-2 sm:mt-0', props.class)">
      <slot>Cancel</slot>
    </Button>
  </DialogClose>
</template>
