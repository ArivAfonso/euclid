<template>
  <Computer v-if="!isMobile()" />
  <Mobile v-else />
</template>

<script lang="ts" setup>

import Computer from '@/views/Editor/computer.vue'
import Mobile from '@/views/Editor/mobile.vue'

import { useMainStore, useSnapshotStore } from '@/store'
import { storeToRefs } from 'pinia'
import { isMobile } from '@/utils/common'
import { LocalStorageDiscardedKey } from '@/configs/canvas'
import { deleteDiscardedDB } from '@/utils/database'


const { databaseId } = storeToRefs(useMainStore())

const snapshotStore = useSnapshotStore()
// const mainStore = useMainStore()

onMounted(async () => {
  await deleteDiscardedDB()
  // await snapshotStore.initSnapshotDatabase()
  // mainStore.getFonts()
})

// When unloading, record the indexedDB database ID to localStorage for later cleanup
window.addEventListener('unload', () => {
  const discardedDB = localStorage.getItem(LocalStorageDiscardedKey)
  const discardedDBList: string[] = discardedDB ? JSON.parse(discardedDB) : []
  discardedDBList.push(databaseId.value)
  const newDiscardedDB = JSON.stringify(discardedDBList)
  localStorage.setItem(LocalStorageDiscardedKey, newDiscardedDB)
})
</script>
