import Dexie, { Table } from 'dexie'
import type { CustomFontFormat } from '@/types/fonts'

export interface StoredCustomFont {
  id?: number
  family: string
  fullName?: string
  weight: number
  style: 'normal' | 'italic'
  format: CustomFontFormat
  data: ArrayBuffer
  fileName: string
  createdAt: number
  updatedAt: number
}

class CustomFontDB extends Dexie {
  public fonts!: Table<StoredCustomFont, number>

  public constructor() {
    super('next_custom_fonts')
    this.version(1).stores({
      fonts: '++id, family, weight, style, [family+weight+style]'
    })
    this.fonts = this.table('fonts')
  }
}

const customFontDB = new CustomFontDB()

export const upsertFontRecord = async (record: Omit<StoredCustomFont, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredCustomFont> => {
  const key = [record.family, record.weight, record.style] as [string, number, string]
  const existing = await customFontDB.fonts.where('[family+weight+style]').equals(key).first()
  const timestamp = Date.now()

  if (existing?.id) {
    const payload = { ...existing, ...record, id: existing.id, updatedAt: timestamp }
    await customFontDB.fonts.update(existing.id, {
      ...record,
      fullName: record.fullName,
      format: record.format,
      data: record.data,
      fileName: record.fileName,
      updatedAt: timestamp,
    })
    return { ...payload, createdAt: existing.createdAt }
  }

  const insertedId = await customFontDB.fonts.add({
    ...record,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  return {
    ...record,
    id: insertedId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const bulkUpsertFontRecords = async (records: Array<Omit<StoredCustomFont, 'id' | 'createdAt' | 'updatedAt'>>): Promise<StoredCustomFont[]> => {
  const results: StoredCustomFont[] = []
  for (const record of records) {
    const stored = await upsertFontRecord(record)
    results.push(stored)
  }
  return results
}

export const getAllStoredFonts = async (): Promise<StoredCustomFont[]> => {
  return customFontDB.fonts.orderBy('family').toArray()
}

export const getStoredFontsByFamily = async (family: string): Promise<StoredCustomFont[]> => {
  return customFontDB.fonts.where('family').equals(family).toArray()
}

export const deleteStoredFonts = async (ids: number[]): Promise<void> => {
  await customFontDB.fonts.bulkDelete(ids)
}

export const clearStoredFonts = async (): Promise<void> => {
  await customFontDB.fonts.clear()
}
