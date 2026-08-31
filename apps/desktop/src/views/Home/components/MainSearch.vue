<template>
  <div class="h-[100px] flex items-center justify-center">
    <div class="w-2/3 max-w-2xl">
      <div class="flex items-center gap-0 bg-card dark:bg-[hsl(0,0%,11%)] rounded-lg border border-border/50 dark:border-border/30 shadow-sm overflow-hidden">
        <!-- Search input -->
        <div class="flex-1 flex items-center px-3">
          <Search class="w-4 h-4 text-muted-foreground mr-2" />
          <input 
            type="text" 
            placeholder="May Day Holiday"
            class="flex-1 h-10 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        <!-- Separator -->
        <div class="h-6 w-px bg-border/50"></div>
        
        <!-- Select dropdown -->
        <select 
          v-model="searchSelect"
          class="h-10 px-3 bg-transparent border-0 outline-none text-sm text-foreground cursor-pointer
                 focus:bg-accent/50 dark:focus:bg-muted/30 transition-colors"
        >
          <option value="1">Selected Templates</option>
          <option value="2">My Space</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from "lucide-vue-next";

const searchSelect = ref<string>('1')
</script>