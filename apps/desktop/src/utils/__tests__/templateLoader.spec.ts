import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadTemplateData, loadTemplatesList, paginateTemplates } from '@/utils/templateLoader'
import type { TemplateItem } from '@/utils/templateLoader'

const makeItem = (id: number): TemplateItem => ({
  id,
  preview: `preview-${id}`,
  width: 1920,
  height: 1080,
  data: '',
  title: `Template ${id}`,
  text: `Description ${id}`,
})

/** Minimal fetch Response stub */
const jsonResponse = (body: unknown, ok = true) => ({
  ok,
  statusText: ok ? 'OK' : 'Not Found',
  json: async () => body,
})

describe('utils/templateLoader', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  describe('paginateTemplates', () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(i + 1))

    it('returns the requested slice with pagination metadata', () => {
      expect(paginateTemplates(items, 1, 4)).toEqual({
        items: items.slice(0, 4),
        total: 10,
        pages: 3,
        page: 1,
      })

      expect(paginateTemplates(items, 3, 4)).toEqual({
        items: items.slice(8, 12),
        total: 10,
        pages: 3,
        page: 3,
      })
    })

    it('returns an empty slice for pages beyond the range', () => {
      expect(paginateTemplates(items, 99, 4)).toEqual({
        items: [],
        total: 10,
        pages: 3,
        page: 99,
      })
    })

    it('handles an empty template list', () => {
      expect(paginateTemplates([], 1, 20)).toEqual({
        items: [],
        total: 0,
        pages: 0,
        page: 1,
      })
    })

    it('computes partial last pages correctly', () => {
      expect(paginateTemplates(items, 2, 6).items).toHaveLength(4)
    })
  })

  describe('loadTemplatesList', () => {
    it('maps index metadata into gallery items', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          templates: [
            { id: 1, title: 'A', text: 'a', preview: 'p1', width: 1920, height: 1080, filename: 'a.json' },
            { id: 2, title: 'B', text: 'b', preview: 'p2', width: 1080, height: 1080, filename: 'b.json' },
          ],
        }),
      )

      const result = await loadTemplatesList()

      expect(fetchMock).toHaveBeenCalledWith('./templates/index.json')
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ id: 1, title: 'A', preview: 'p1', data: '', images: 'p1' })
      expect(result[1]).toMatchObject({ id: 2, title: 'B', preview: 'p2', width: 1080, height: 1080 })
    })

    it('returns an empty list when the index and all fallback templates fail', async () => {
      fetchMock.mockRejectedValue(new Error('offline'))
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await loadTemplatesList()

      expect(result).toEqual([])
      // index + 3 known fallback files were attempted
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(4)
      consoleError.mockRestore()
      consoleWarn.mockRestore()
    })

    it('falls back to scanning known template files when the index is missing', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === './templates/index.json') return jsonResponse({}, false)
        if (url === './templates/blank.json') {
          return jsonResponse({
            id: 10,
            title: 'Blank',
            text: 'blank',
            preview: 'blank-preview',
            width: 1920,
            height: 1080,
            data: {},
          })
        }
        return jsonResponse({}, false)
      })

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = await loadTemplatesList()
      consoleWarn.mockRestore()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ id: 10, title: 'Blank', width: 1920, height: 1080 })
    })
  })

  describe('loadTemplateData', () => {
    it('returns compressed template data for a known id', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === './templates/index.json') {
          return jsonResponse({
            templates: [{ id: 7, title: 'Seven', text: 't', preview: 'p', width: 800, height: 600, filename: 'seven.json' }],
          })
        }
        if (url === './templates/seven.json') {
          return jsonResponse({
            id: 7,
            title: 'Seven',
            text: 't',
            preview: 'p',
            width: 800,
            height: 600,
            data: { objects: [] },
          })
        }
        return jsonResponse({}, false)
      })

      const result = await loadTemplateData(7)

      expect(result).not.toBeNull()
      expect(result!.id).toBe(7)
      expect(result!.width).toBe(800)
      expect(typeof result!.data).toBe('string')
      expect(result!.data.length).toBeGreaterThan(0)
    })

    it('returns null for an unknown template id', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ templates: [] }))
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await loadTemplateData(999)

      expect(result).toBeNull()
      consoleError.mockRestore()
    })

    it('returns null when the template file cannot be fetched', async () => {
      fetchMock.mockImplementation(async (url: string) => {
        if (url === './templates/index.json') {
          return jsonResponse({
            templates: [{ id: 3, title: 'Three', text: 't', preview: 'p', width: 100, height: 100, filename: 'three.json' }],
          })
        }
        return jsonResponse({}, false)
      })
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await loadTemplateData(3)

      expect(result).toBeNull()
      consoleError.mockRestore()
    })
  })
})
