<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Special Effects
      </h3>
    </div>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="outline"
            class="w-full h-8 text-xs transition-all hover:bg-primary/10 hover:text-primary"
            @click="changeElementEffect"
          >
            <IconTransferData class="h-3.5 w-3.5 mr-2" />
            Configure Effects
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">
          <p>Open special effects panel</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { RightStates } from "@/types/elements";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const { rightState } = storeToRefs(useMainStore())

const changeElementEffect = () => {
  rightState.value = RightStates.ELEMENT_EFFECT
}
</script>

<style lang="scss" scoped>
</style>