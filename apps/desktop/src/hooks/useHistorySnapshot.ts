import { debounce, throttle } from 'lodash-es'
import { useSnapshotStore } from '@/store'
import { Snapshot } from '@/types/history'

export default () => {
  const snapshotStore = useSnapshotStore()

  // Add history snapshot
  const addHistorySnapshot = debounce(function(data?: Snapshot) {
    if (!data) return
    snapshotStore.addSnapshot(data)
  }, 10, { trailing: true })

  // Redo
  const redo = throttle(function() {
    snapshotStore.reDo()
  }, 100, { leading: true, trailing: false })

  // Undo
  const undo = throttle(function() {
    snapshotStore.unDo()
  }, 100, { leading: true, trailing: false })

  // Clear
  const clearHistorySnapshot = throttle(function() {
    snapshotStore.clear()
  }, 100, { leading: true, trailing: false })

  return {
    addHistorySnapshot,
    redo,
    undo,
    clearHistorySnapshot,
  }
}