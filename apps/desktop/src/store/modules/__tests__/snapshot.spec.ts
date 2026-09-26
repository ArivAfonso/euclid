import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSnapshotStore } from '@/store/modules/snapshot'
import { db } from '@/utils/database'
import { SnapshotType } from '@/types/history'
import type { Snapshot } from '@/types/history'

const makeSnapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  index: 0,
  target: { id: 'target-id', type: 'rect' } as Snapshot['target'],
  type: SnapshotType.ADD,
  ...overrides,
})

describe('store/snapshot', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.snapshots.clear()
  })

  describe('canUndo / canRedo getters', () => {
    it('starts with nothing to undo or redo', () => {
      const store = useSnapshotStore()
      expect(store.canUndo).toBe(false)
      expect(store.canRedo).toBe(false)
    })

    it('canUndo once the cursor is on a snapshot', () => {
      const store = useSnapshotStore()
      store.setSnapshotLength(1)
      store.setSnapshotCursor(0)

      expect(store.canUndo).toBe(true)
      expect(store.canRedo).toBe(false)
    })

    it('canRedo while the cursor is not at the newest snapshot', () => {
      const store = useSnapshotStore()
      store.setSnapshotLength(3)

      store.setSnapshotCursor(0)
      expect(store.canRedo).toBe(true)

      store.setSnapshotCursor(2)
      expect(store.canRedo).toBe(false)
    })
  })

  describe('addSnapshot', () => {
    it('ignores empty payloads', async () => {
      const store = useSnapshotStore()
      await store.addSnapshot(undefined as unknown as Snapshot)

      expect(store.snapshotLength).toBe(0)
      expect(store.snapshotCursor).toBe(-1)
      expect(await db.snapshots.count()).toBe(0)
    })

    it('advances cursor and length for each snapshot', async () => {
      const store = useSnapshotStore()

      await store.addSnapshot(makeSnapshot())
      expect(store.snapshotLength).toBe(1)
      expect(store.snapshotCursor).toBe(0)

      await store.addSnapshot(makeSnapshot({ type: SnapshotType.DELETE }))
      expect(store.snapshotLength).toBe(2)
      expect(store.snapshotCursor).toBe(1)

      await store.addSnapshot(makeSnapshot({ type: SnapshotType.MODIFY }))
      expect(store.snapshotLength).toBe(3)
      expect(store.snapshotCursor).toBe(2)
      expect(await db.snapshots.count()).toBe(3)
    })

    it('persists a deep copy of the snapshot payload', async () => {
      const store = useSnapshotStore()
      const payload = makeSnapshot({ action: 'add-element', move: 1 })

      await store.addSnapshot(payload)
      payload.action = 'mutated-after-add'

      const stored = await db.snapshots.toArray()
      expect(stored[0].action).toBe('add-element')
      expect((stored[0] as any).move).toBe(1)
    })

    it('caps history at 20 snapshots, dropping the oldest', async () => {
      const store = useSnapshotStore()

      for (let i = 0; i < 21; i++) {
        await store.addSnapshot(makeSnapshot({ index: i }))
      }

      expect(store.snapshotLength).toBe(20)
      expect(store.snapshotCursor).toBe(19)
      expect(await db.snapshots.count()).toBe(20)

      // The first snapshot (index 0) must have been discarded
      const stored = await db.snapshots.orderBy('id').toArray()
      expect(stored.at(0)?.index).toBe(1)
    })

    it('discards snapshots after the cursor when a new branch is added', async () => {
      const store = useSnapshotStore()
      await store.addSnapshot(makeSnapshot({ index: 0 }))
      await store.addSnapshot(makeSnapshot({ index: 1 }))
      await store.addSnapshot(makeSnapshot({ index: 2 }))

      // Simulate "undo twice backwards, then perform a new action"
      store.setSnapshotCursor(0)
      await store.addSnapshot(makeSnapshot({ index: 99 }))

      expect(store.snapshotLength).toBe(2)
      expect(store.snapshotCursor).toBe(1)
      expect(await db.snapshots.count()).toBe(2)

      const stored = await db.snapshots.orderBy('id').toArray()
      expect(stored.map((s) => s.index)).toEqual([0, 99])
    })
  })
})
