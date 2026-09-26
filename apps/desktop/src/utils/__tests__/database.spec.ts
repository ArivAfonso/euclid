import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dexie from 'dexie'
import { deleteDiscardedDB } from '@/utils/database'
import { LocalStorageDiscardedKey } from '@/configs/canvas'

const HOUR = 1000 * 60 * 60

/** Create (and close) an empty IndexedDB database so Dexie can enumerate it. */
const createDatabase = async (name: string) => {
  const database = new Dexie(name)
  database.version(1).stores({ rows: '++id' })
  await database.open()
  database.close()
}

const databaseExists = async (name: string) => {
  const names = await Dexie.getDatabaseNames()
  return names.includes(name)
}

describe('utils/database', () => {
  const now = Date.now()
  const keepName = `EUCLID_KEEP000000_${now}`
  const discardedName = `EUCLID_GONE000000_${now}`
  const expiredName = `EUCLID_OLD0000000_${now - 13 * HOUR}`
  const malformedName = 'EUCLID_MALFORMED'
  const foreignName = 'next_custom_fonts'

  beforeEach(async () => {
    await createDatabase(keepName)
    await createDatabase(discardedName)
    await createDatabase(expiredName)
    await createDatabase(malformedName)
    await createDatabase(foreignName)
  })

  it('deletes discarded, expired and malformed Euclid databases only', async () => {
    localStorage.setItem(LocalStorageDiscardedKey, JSON.stringify(['GONE000000']))

    await deleteDiscardedDB()

    // Deletions are fired without awaiting — poll until the fake indexedDB reflects them
    await vi.waitFor(
      async () => {
        const names = await Dexie.getDatabaseNames()

        expect(names).not.toContain(discardedName)
        expect(names).not.toContain(expiredName)
        expect(names).not.toContain(malformedName)

        expect(names).toContain(keepName)
        expect(names).toContain(foreignName)
      },
      { timeout: 5000, interval: 50 },
    )
  })

  it('clears the discarded-database marker after cleanup', async () => {
    localStorage.setItem(LocalStorageDiscardedKey, JSON.stringify(['GONE000000']))

    await deleteDiscardedDB()

    expect(localStorage.getItem(LocalStorageDiscardedKey)).toBeNull()
  })

  it('keeps everything when there is nothing to discard', async () => {
    await deleteDiscardedDB()

    expect(await databaseExists(keepName)).toBe(true)
    expect(await databaseExists(discardedName)).toBe(true)
    expect(await databaseExists(foreignName)).toBe(true)
  })

  it('treats a missing discard list as empty', async () => {
    // No marker stored at all -> recent, correctly named DBs must survive
    await deleteDiscardedDB()

    expect(await databaseExists(keepName)).toBe(true)

    // Expired DBs are still purged even without a discard marker
    await vi.waitFor(
      async () => {
        expect(await databaseExists(expiredName)).toBe(false)
      },
      { timeout: 5000, interval: 50 },
    )
  })
})
