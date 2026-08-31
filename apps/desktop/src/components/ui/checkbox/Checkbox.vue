<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Check } from "lucide-vue-next"
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"
import { computed } from "vue"

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes["class"]; checked?: boolean | "indeterminate" | null }>()
const emits = defineEmits<CheckboxRootEmits & { 'update:checked': [value: boolean | "indeterminate"] }>()

const delegatedProps = reactiveOmit(props, "class", "checked", "modelValue")
const forwarded = useForwardPropsEmits(delegatedProps, emits as CheckboxRootEmits)

// reka-ui v2 uses modelValue; legacy shadcn API uses checked. Support both.
const modelValueProxy = computed<CheckboxRootProps["modelValue"]>(() => {
  if (props.checked !== undefined) return props.checked
  return props.modelValue
})

const handleUpdate = (value: boolean | "indeterminate") => {
  emits('update:modelValue', value)
  emits('update:checked', value)
}
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :model-value="modelValueProxy"
    @update:model-value="handleUpdate"
    :class="
      cn('peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
         props.class)"
  >
    <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current">
      <slot>
        <Check class="h-4 w-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
