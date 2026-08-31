<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  SwitchRoot,

  SwitchThumb,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "@/lib/utils"
import { computed } from "vue"

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes["class"]; checked?: boolean | null }>()
const emits = defineEmits<SwitchRootEmits & { 'update:checked': [value: boolean] }>()

const delegatedProps = reactiveOmit(props, "class", "checked", "modelValue")
const forwarded = useForwardPropsEmits(delegatedProps, emits as SwitchRootEmits)

// reka-ui v2 uses modelValue; legacy shadcn API uses checked. Support both.
const modelValueProxy = computed<SwitchRootProps["modelValue"]>(() => {
  if (props.checked !== undefined) return props.checked
  return props.modelValue
})

const handleUpdate = (value: boolean) => {
  emits('update:modelValue', value)
  emits('update:checked', value)
}
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :model-value="modelValueProxy"
    @update:model-value="handleUpdate"
    :class="cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      props.class,
    )"
  >
    <SwitchThumb
      :class="cn('pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5')"
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>