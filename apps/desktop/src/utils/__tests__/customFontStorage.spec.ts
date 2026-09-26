import { beforeEach, describe, expect, it } from 'vitest'
import {
  bulkUpsertFontRecords,
  clearStoredFonts,
  deleteStoredFonts,
  getAllStoredFonts,
  getStoredFontsByFamily,
  upsertFontRecord,
} from '@/utils/customFontStorage'
import type { StoredCustomFont } from '@/utils/customFontStorage'

type FontInput = Omit<StoredCustomFont, 'id' | 'createdAt' | 'updatedAt'>

const makeRecord = (overrides: Partial<FontInput> = {}): FontInput => ({
  family: 'Test Font',
  weight: 400,
  style: 'normal',
  format: 'truetype',
  data: new Uint8Array([1, 2, 3]).buffer,
  fileName: 'test-font.ttf',
  ...overrides,
})

const bytesOf = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer))

describe('utils/customFontStorage', () => {
  beforeEach(async () => {
    await clearStoredFonts()
  })

  describe('upsertFontRecord', () => {
    it('inserts a new record and returns its generated id', async () => {
      const stored = await upsertFontRecord(makeRecord())

      expect(stored.id).toBeTypeOf('number')
      expect(stored.createdAt).toBe(stored.updatedAt)
      expect(await getAllStoredFonts()).toHaveLength(1)
    })

    it('updates the existing record for the same family + weight + style', async () => {
      const first = await upsertFontRecord(makeRecord())

      const second = await upsertFontRecord(
        makeRecord({ data: new Uint8Array([9, 9]).buffer, fileName: 'updated.ttf' }),
      )

      expect(second.id).toBe(first.id)
      expect(second.createdAt).toBe(first.createdAt)
      expect(second.updatedAt).toBeGreaterThanOrEqual(first.updatedAt)
      expect(second.fileName).toBe('updated.ttf')

      const all = await getAllStoredFonts()
      expect(all).toHaveLength(1)
      expect(bytesOf(all[0].data)).toEqual([9, 9])
    })

    it('keeps separate rows for different weights and styles', async () => {
      await upsertFontRecord(makeRecord({ weight: 400, style: 'normal' }))
      await upsertFontRecord(makeRecord({ weight: 700, style: 'normal' }))
      await upsertFontRecord(makeRecord({ weight: 400, style: 'italic' }))

      expect(await getAllStoredFonts()).toHaveLength(3)
    })
  })

  describe('bulkUpsertFontRecords', () => {
    it('stores every record and returns them with ids', async () => {
      const results = await bulkUpsertFontRecords([
        makeRecord({ family: 'Alpha', weight: 400 }),
        makeRecord({ family: 'Beta', weight: 700 }),
      ])

      expect(results).toHaveLength(2)
      expect(results.every((r) => typeof r.id === 'number')).toBe(true)
      expect(await getAllStoredFonts()).toHaveLength(2)
    })
  })

  describe('queries', () => {
    it('returns all fonts ordered by family name', async () => {
      await upsertFontRecord(makeRecord({ family: 'Zeta' }))
      await upsertFontRecord(makeRecord({ family: 'Alpha' }))

      const all = await getAllStoredFonts()
      expect(all.map((f) => f.family)).toEqual(['Alpha', 'Zeta'])
    })

    it('filters fonts by family', async () => {
      await upsertFontRecord(makeRecord({ family: 'Alpha', weight: 400 }))
      await upsertFontRecord(makeRecord({ family: 'Alpha', weight: 700 }))
      await upsertFontRecord(makeRecord({ family: 'Beta' }))

      const alpha = await getStoredFontsByFamily('Alpha')

      expect(alpha).toHaveLength(2)
      expect(alpha.every((f) => f.family === 'Alpha')).toBe(true)
    })

    it('returns an empty list for unknown families', async () => {
      expect(await getStoredFontsByFamily('Nope')).toEqual([])
    })
  })

  describe('deletion', () => {
    it('deletes records by id', async () => {
      const a = await upsertFontRecord(makeRecord({ family: 'A' }))
      const b = await upsertFontRecord(makeRecord({ family: 'B' }))

      await deleteStoredFonts([a.id!])

      const remaining = await getAllStoredFonts()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe(b.id)
    })

    it('clears all stored fonts', async () => {
      await upsertFontRecord(makeRecord())
      await clearStoredFonts()

      expect(await getAllStoredFonts()).toEqual([])
    })
  })
})
