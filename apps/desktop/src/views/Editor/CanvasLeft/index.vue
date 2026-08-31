<template>
  <div class="relative flex h-full">
    <Label class="w-[50px] h-full z-10 bg-white dark:bg-[hsl(0,0%,9%)]" />
    <Menu class="h-full" />
  </div>
</template>

<script lang="ts" setup>
import Label from "./Label/index.vue";
import Menu from "./Menu/index.vue";
</script>