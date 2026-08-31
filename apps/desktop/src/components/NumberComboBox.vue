<template>
  <div class="relative flex items-center">
    <div class="relative flex-1">
      <Input
        :model-value="displayValue"
        @update:model-value="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        type="text"
        inputmode="decimal"
        class="h-7 text-[11px] pr-6 border-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        :placeholder="placeholder"
      />
      <Popover v-model:open="isOpen">
        <PopoverTrigger as-child>
          <button
            class="absolute right-0 top-0 h-full w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-l border-input/50 bg-muted/20 hover:bg-muted/40 rounded-r-md"
            type="button"
            tabindex="-1"
          >
            <ChevronDown class="h-3 w-3" :class="{ 'rotate-180': isOpen }" />
          </button>
        </PopoverTrigger>
        <PopoverContent class="w-[100px] p-1" align="end" side="bottom" :side-offset="2">
          <div class="max-h-[200px] overflow-y-auto space-y-0.5">
            <button
              v-for="item in options"
              :key="item"
              class="w-full text-left text-xs py-1 px-2 rounded hover:bg-accent aria-selected:bg-accent cursor-pointer transition-colors"
              @click="handleSelect(String(item))"
            >
              {{ formatOption(item) }}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const props = defineProps<{
  modelValue: string | number
  options: (string | number)[]
  placeholder?: string
  label?: string
  integer?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const inputValue = ref(String(props.modelValue ?? ''))

watch(() => props.modelValue, (val) => {
  inputValue.value = String(val ?? '')
})

const displayValue = computed(() => inputValue.value)

const handleInput = (val: string) => {
  inputValue.value = val
  emit('update:modelValue', val)
}

const handleFocus = () => {
  setTimeout(() => {
    const input = document.activeElement as HTMLInputElement
    if (input?.select) input.select()
  }, 0)
}

const handleBlur = () => {
  const cleaned = inputValue.value.trim()
  if (cleaned === '' || cleaned === '-' || cleaned === '.') {
    inputValue.value = String(props.modelValue ?? '')
    return
  }
  const num = props.integer ? parseInt(cleaned) : parseFloat(cleaned)
  if (!isNaN(num)) {
    const formatted = props.integer ? String(Math.round(num)) : String(num)
    if (formatted !== inputValue.value) {
      inputValue.value = formatted
      emit('update:modelValue', formatted)
    }
  }
}

const handleSelect = (val: string) => {
  inputValue.value = val
  emit('update:modelValue', val)
  isOpen.value = false
}

const formatOption = (item: string | number): string => {
  return String(item)
}
</script>
