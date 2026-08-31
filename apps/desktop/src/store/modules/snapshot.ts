import { defineStore, storeToRefs } from "pinia"
import { IndexableTypeArray } from 'dexie'
import { useTemplatesStore } from "@/store"
import { classRegistry, FabricObject, SerializedObjectProps } from "fabric"
import { db } from '@/utils/database'
import { Snapshot, SnapshotType } from '@/types/history'
import useCanvas from "@/views/Canvas/useCanvas"

const FabricInstance = async (object: SerializedObjectProps) => {
  return await (classRegistry.getClass(object.type) as typeof FabricObject).fromObject(object) as FabricObject
}

export interface ScreenState {
  snapshotCursor: number
  snapshotLength: number
  processing: boolean
  layering: boolean 
}

export const useSnapshotStore = defineStore('snapshot', {
  state: (): ScreenState => ({
    snapshotCursor: -1, // History snapshot cursor
    snapshotLength: 0, // History snapshot length
    processing: false,
    layering: false
  }),

  getters: {
    canUndo(state) {
      return state.snapshotCursor >= 0
    },
    canRedo(state) {
      return state.snapshotCursor < state.snapshotLength - 1
    },
  },

  actions: {
    setSnapshotCursor(cursor: number) {
      this.snapshotCursor = cursor
    },
    setSnapshotLength(length: number) {
      this.snapshotLength = length
    },
    setProcessing(status: boolean) {
      this.processing = status
    },
    async addSnapshot(data: Snapshot) {
      // const templatesStore = useTemplatesStore()
      // const { templateIndex, templates } = storeToRefs(templatesStore)
      // // Get all snapshot IDs from indexeddb
      if (!data) return
      const allKeys = await db.snapshots.orderBy('id').keys()
  
      const needDeleteKeys: IndexableTypeArray = []
  
      // Record snapshot IDs to delete
      // If the current snapshot cursor is not at the last position, when adding a new snapshot,
      // all snapshots after the current cursor position should be deleted. The actual scenario is:
      // After the user undoes multiple times and then performs an operation (adds a snapshot),
      // the previously undone snapshots should all be deleted
      if (this.snapshotCursor >= 0 && this.snapshotCursor < allKeys.length - 1) {
        needDeleteKeys.push(...allKeys.slice(this.snapshotCursor + 1))
      }
      
      await db.snapshots.add(JSON.parse(JSON.stringify(data)))
      // // Calculate current snapshot length for setting cursor position (should be at last position: length - 1)
      let snapshotLength = allKeys.length - needDeleteKeys.length + 1
  
      // // When snapshot count exceeds limit, delete excess snapshots from the head
      const snapshotLengthLimit = 20
      if (snapshotLength > snapshotLengthLimit) {
        needDeleteKeys.push(allKeys[0])
        snapshotLength--
      }
      // When snapshots > 1, ensure undo maintains page focus: set the second-to-last snapshot's index as current page index
      
      if (snapshotLength >= 2) {
        // db.snapshots.update(allKeys[snapshotLength - 2] as number, { index: templatesStore.templateIndex })
      }
      await db.snapshots.bulkDelete(needDeleteKeys as number[]) 
      this.setSnapshotCursor(snapshotLength - 1)
      this.setSnapshotLength(snapshotLength)
    },
    async unDo() {
      const [ canvas ] = useCanvas()
      const templatesStore = useTemplatesStore()
      const { templateId } = storeToRefs(templatesStore)
      const snapshotCursor = this.snapshotCursor
      const snapshots: Snapshot[] = await db.snapshots.orderBy('id').toArray()
      const snapshot = snapshots[snapshotCursor]
      if (!snapshot) return
      const { type, index, transform, action, target, objects, tid } = snapshot
      console.log('templateId.value:', templateId.value, 'tid:', tid)
      
      const findIndex = canvas._objects.findIndex(item => item.id === target.id)
      console.log('type:', type, findIndex)
      switch (type) {
        case SnapshotType.ADD:
          canvas.remove(canvas._objects[findIndex]);
          break
        case SnapshotType.DELETE:
          this.addTarget(target, findIndex)
          break
        case SnapshotType.GROUP:
          const group = canvas._objects[index]
          if (!objects) return
          objects.forEach(async (item) => {
            item.left += group.left + group.width / 2
            item.top += group.top + group.height / 2
            const element = await FabricInstance(item)
            canvas.add(element)
          })
          canvas.remove(group)
          break
        case SnapshotType.MODIFY:
          this.layering = true
          const obj = {
            ...target,
            ...transform,
            ...transform?.original,
            originX: target.originX,
            originY: target.originY
          };
            
          const _obj = await FabricInstance(obj);
          canvas.remove(canvas._objects[findIndex]);
          canvas.insertAt(findIndex, _obj);
          this.layering = false
          break
      }

      canvas.requestRenderAll();
      this.setSnapshotCursor(snapshotCursor - 1)
    },
  
    async reDo() {
      const [ canvas ] = useCanvas()
      if (this.snapshotCursor >= this.snapshotLength - 1) return
      const snapshotCursor = this.snapshotCursor + 1
      const snapshots: Snapshot[] = await db.snapshots.orderBy('id').toArray()
      const snapshot = snapshots[snapshotCursor]
      const { type, index, transform, action, target, objects, tid } = snapshot
      const findIndex = canvas._objects.findIndex(item => item.id === target.id)
      switch (type) {
        case SnapshotType.ADD:
          this.addTarget(target, findIndex)
          break
        case SnapshotType.DELETE:
          canvas.remove(canvas._objects[findIndex]);
          break
        case SnapshotType.MODIFY:
          this.layering = true
          const obj = {
            ...target,
            ...transform,
            originX: target.originX,
            originY: target.originY
          };
            
          const _obj = await FabricInstance(obj);
          canvas.remove(canvas._objects[findIndex]);
          canvas.insertAt(findIndex, _obj);
          this.layering = false
      }
      this.setSnapshotCursor(snapshotCursor)
    },

    async clear () {
      const allKeys = await db.snapshots.orderBy('id').keys()
      await db.snapshots.bulkDelete(allKeys as number[])
      this.setSnapshotCursor(-1)
      this.setSnapshotLength(0)
    },

    async addTarget(target: SerializedObjectProps, findIndex: number) {
      const [ canvas ] = useCanvas()
      const element = await FabricInstance(target);
      canvas.insertAt(findIndex, element);
    }
  }
})