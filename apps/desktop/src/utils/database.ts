import Dexie from "dexie"
import { LocalStorageDiscardedKey } from "@/configs/canvas"
import { databaseId } from '@/store'
import { Snapshot } from "@/types/history"


export interface WritingBoardImg {
  id: string
  dataURL: string
}

// export interface Snapshot {
//   index: number
//   templates: Template[]
// }

const DatabaseNamePrefix = 'EUCLID'
// Delete invalid/expired databases
// When the app closes (close or refresh browser), the database ID is recorded in localStorage, marking it as invalid
// When the app initializes, check all current databases and delete those marked as invalid
// Additionally, databases older than 12 hours from initialization time will also be deleted (to prevent accidental leftover databases)
export const deleteDiscardedDB = async () => {
  const now = new Date().getTime()

  const localStorageDiscardedDB = localStorage.getItem(LocalStorageDiscardedKey)
  const localStorageDiscardedDBList: string[] = localStorageDiscardedDB ? JSON.parse(localStorageDiscardedDB) : []

  const databaseNames = await Dexie.getDatabaseNames()
  const discardedDBNames = databaseNames.filter(name => {
    if (name.indexOf(DatabaseNamePrefix) === -1) return false
    
    const [prefix, id, time] = name.split('_')
    if (prefix !== DatabaseNamePrefix || !id || !time) return true
    if (localStorageDiscardedDBList.includes(id)) return true
    if (now - (+time) >= 1000 * 60 * 60 * 12) return true

    return false
  })

  for (const name of discardedDBNames) Dexie.delete(name)
  localStorage.removeItem(LocalStorageDiscardedKey)
}

class DrawDB extends Dexie {
  public snapshots: Dexie.Table<Snapshot, number>
  public writingBoardImgs: Dexie.Table<WritingBoardImg, number>

  public constructor() {
    super(`${DatabaseNamePrefix}_${databaseId}_${new Date().getTime()}`)
    this.version(1).stores({
      snapshots: '++id',
      writingBoardImgs: '++id',
    })
    this.snapshots = this.table('snapshots')
    this.writingBoardImgs = this.table('writingBoardImgs')
  }
}

export const db = new DrawDB()