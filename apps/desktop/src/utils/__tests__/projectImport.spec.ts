import { describe, expect, it } from 'vitest'
import {
  ensureCrossOriginImages,
  getTemplateArtboardSize,
  normalizeProjectTemplate,
  parseTemplateJson,
  projectNameFromFileName,
} from '@/utils/projectImport'

const makeTemplateRecord = (overrides: Record<string, unknown> = {}) => ({
  version: '6.7.1',
  id: 'template-1',
  background: 'rgba(255,255,255,0)',
  objects: [
    {
      id: 'WorkSpaceDrawType',
      type: 'Rect',
      name: 'rect',
      width: 1080,
      height: 1080,
      fill: '#ffffff',
      selectable: false,
      evented: false,
    },
  ],
  workSpace: {
    fillType: 0,
    left: 0,
    top: 0,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    fill: '#ffffff',
  },
  zoom: 1,
  width: 1080,
  height: 1080,
  ...overrides,
})

describe('utils/projectImport', () => {
  describe('projectNameFromFileName', () => {
    it('strips the .json extension', () => {
      expect(projectNameFromFileName('poster.json')).toBe('poster')
    })

    it('handles paths and uppercase extensions', () => {
      expect(projectNameFromFileName('C:\\designs\\poster.JSON')).toBe('poster')
      expect(projectNameFromFileName('/home/user/a.b.json')).toBe('a.b')
    })

    it('falls back to "Untitled Project" when no usable name remains', () => {
      expect(projectNameFromFileName('.json')).toBe('Untitled Project')
      expect(projectNameFromFileName('   ')).toBe('Untitled Project')
    })
  })

  describe('ensureCrossOriginImages', () => {
    it('marks nested remote images as anonymous', () => {
      const json: any = {
        objects: [
          {
            type: 'image',
            src: 'https://cdn.example.com/a.png',
            objects: [{ type: 'Image', src: 'http://example.com/b.png' }],
          },
        ],
      }

      ensureCrossOriginImages(json)

      expect(json.objects[0].crossOrigin).toBe('anonymous')
      expect(json.objects[0].objects[0].crossOrigin).toBe('anonymous')
    })

    it('leaves local and data sources untouched', () => {
      const json: any = {
        objects: [
          { type: 'image', src: 'data:image/png;base64,AAAA' },
          { type: 'image', src: './assets/local.png' },
        ],
      }

      ensureCrossOriginImages(json)

      expect(json.objects[0].crossOrigin).toBeUndefined()
      expect(json.objects[1].crossOrigin).toBeUndefined()
    })
  })

  describe('normalizeProjectTemplate', () => {
    it('fills defaults for missing fields', () => {
      const template = normalizeProjectTemplate({ objects: [] } as any)

      expect(template.id).toBeTruthy()
      expect(template.version).toBe('6.7.1')
      expect(template.background).toBe('rgba(255,255,255,0)')
      expect(template.zoom).toBe(1)
      expect(template.width).toBe(1920)
      expect(template.height).toBe(1080)
      expect(template.workSpace).toBeTruthy()
    })

    it('injects the workspace rect when the export lost it', () => {
      const template = normalizeProjectTemplate({
        objects: [],
        workSpace: {
          fillType: 0,
          left: 0,
          top: 0,
          angle: 0,
          scaleX: 1,
          scaleY: 1,
          fill: '#123456',
        },
        width: 800,
        height: 600,
      } as any)

      const workspace = template.objects.find((obj: any) => obj.id === 'WorkSpaceDrawType') as any
      expect(workspace).toBeTruthy()
      expect(workspace.width).toBe(800)
      expect(workspace.height).toBe(600)
      expect(workspace.fill).toBe('#123456')
    })

    it('keeps an existing workspace rect untouched', () => {
      const template = normalizeProjectTemplate(makeTemplateRecord() as any)

      expect(template.objects.filter((obj: any) => obj.id === 'WorkSpaceDrawType')).toHaveLength(1)
      expect(template.width).toBe(1080)
    })
  })

  describe('getTemplateArtboardSize', () => {
    it('reads the workspace rect, not the zoomed template size', () => {
      // A 1080×2440 design saved at 0.5 zoom is stored as 540×1220
      const size = getTemplateArtboardSize({
        width: 540,
        height: 1220,
        zoom: 0.5,
        objects: [{ id: 'WorkSpaceDrawType', type: 'Rect', width: 1080, height: 2440 }],
      } as any)

      expect(size).toEqual({ width: 1080, height: 2440 })
    })

    it('divides the zoom back out when there is no workspace rect', () => {
      const size = getTemplateArtboardSize({ width: 540, height: 1220, zoom: 0.5, objects: [] } as any)

      expect(size.width).toBeCloseTo(1080)
      expect(size.height).toBeCloseTo(2440)
    })

    it('treats a missing zoom as 1 and applies the default size to empty templates', () => {
      expect(getTemplateArtboardSize({ width: 800, height: 600 } as any)).toEqual({ width: 800, height: 600 })
      expect(getTemplateArtboardSize({} as any)).toEqual({ width: 1920, height: 1080 })
    })
  })

  describe('parseTemplateJson', () => {
    it('lists the real artboard size of a zoomed export', () => {
      const result = parseTemplateJson(
        'zoomed.json',
        JSON.stringify(
          makeTemplateRecord({
            width: 353.16,
            height: 797.88,
            zoom: 0.327,
            objects: [{ id: 'WorkSpaceDrawType', type: 'Rect', left: 0, top: 0, width: 1080, height: 2440 }],
          }),
        ),
      )

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.draft.width).toBe(1080)
      expect(result.draft.height).toBe(2440)
    })

    it('parses a valid template and prefers the embedded name', () => {
      const result = parseTemplateJson(
        'fallback.json',
        JSON.stringify(makeTemplateRecord({ name: 'Poster Title' })),
      )

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.draft.name).toBe('Poster Title')
      expect(result.draft.width).toBe(1080)
      expect(result.draft.height).toBe(1080)
      expect(result.draft.template.objects).toHaveLength(1)
    })

    it('falls back to the file name when the template has no name', () => {
      const result = parseTemplateJson('my-poster.json', JSON.stringify(makeTemplateRecord({ name: '   ' })))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.draft.name).toBe('my-poster')
    })

    it('keeps a description when present', () => {
      const result = parseTemplateJson(
        'x.json',
        JSON.stringify(makeTemplateRecord({ description: 'Launch poster' })),
      )

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.draft.description).toBe('Launch poster')
    })

    it('tolerates a UTF-8 BOM', () => {
      const result = parseTemplateJson('x.json', '\uFEFF' + JSON.stringify(makeTemplateRecord()))

      expect(result.ok).toBe(true)
    })

    it('normalizes templates before returning the draft', () => {
      const result = parseTemplateJson(
        'x.json',
        JSON.stringify({
          objects: [],
          workSpace: { fillType: 0, left: 0, top: 0, angle: 0, scaleX: 1, scaleY: 1, fill: '#fff' },
        }),
      )

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.draft.width).toBe(1920)
      expect(result.draft.height).toBe(1080)
      expect(
        result.draft.template.objects.find((obj: any) => obj.id === 'WorkSpaceDrawType'),
      ).toBeTruthy()
    })

    it('marks remote images as anonymous before returning the draft', () => {
      const record = makeTemplateRecord({
        objects: [
          { id: 'WorkSpaceDrawType', type: 'Rect', name: 'rect' },
          { id: 'img-1', type: 'image', src: 'https://cdn.example.com/a.png' },
        ],
      })

      const result = parseTemplateJson('x.json', JSON.stringify(record))

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect((result.draft.template.objects[1] as any).crossOrigin).toBe('anonymous')
    })

    it('rejects files that are not valid JSON', () => {
      const result = parseTemplateJson('x.json', '{not json')
      expect(result).toEqual({ ok: false, error: 'File is not valid JSON' })
    })

    it('rejects top-level arrays', () => {
      const result = parseTemplateJson('x.json', '[]')
      expect(result.ok).toBe(false)
    })

    it('rejects objects without an objects array', () => {
      const result = parseTemplateJson('x.json', JSON.stringify({ width: 100, height: 100 }))

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toContain('objects')
    })
  })
})
