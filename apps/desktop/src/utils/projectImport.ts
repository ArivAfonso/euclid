import { nanoid } from 'nanoid'
import { Template } from '@/types/canvas'

/**
 * Helpers for bulk-importing serialized Euclid templates (JSON files) as new
 * projects straight from the Projects page.
 */

export interface ImportedProjectDraft {
  name: string
  description: string
  width: number
  height: number
  template: Template
}

export type TemplateJsonParseResult =
  | { ok: true; draft: ImportedProjectDraft }
  | { ok: false; error: string }

export const DEFAULT_TEMPLATE_WIDTH = 1920
export const DEFAULT_TEMPLATE_HEIGHT = 1080
export const DEFAULT_TEMPLATE_BACKGROUND = 'rgba(255,255,255,0)'

export interface ArtboardSize {
  width: number
  height: number
}

/**
 * The real artboard size of a serialized template, in px.
 *
 * `template.width/height` are stored multiplied by the editor zoom they were
 * saved at (see `templatesStore.setSize`), so a 1080×2440 design saved at 0.327
 * zoom reads 353×798. The workspace rect holds the true size; without one the
 * zoom is divided back out, exactly like the editor's canvas panel does.
 */
export const getTemplateArtboardSize = (template: Partial<Template>): ArtboardSize => {
  const workspace = ((template.objects ?? []) as any[]).find((obj) => obj?.id === 'WorkSpaceDrawType')
  if (workspace) {
    const width = (Number(workspace.width) || 0) * (Number(workspace.scaleX) || 1)
    const height = (Number(workspace.height) || 0) * (Number(workspace.scaleY) || 1)
    if (width > 0 && height > 0) return { width, height }
  }

  const zoom = Number(template.zoom) > 0 ? Number(template.zoom) : 1
  return {
    width: (Number(template.width) || DEFAULT_TEMPLATE_WIDTH * zoom) / zoom,
    height: (Number(template.height) || DEFAULT_TEMPLATE_HEIGHT * zoom) / zoom,
  }
}

/** Derives a project name from a file name (`poster.json` → `poster`). */
export const projectNameFromFileName = (fileName: string): string => {
  const base = fileName.split(/[\\/]/).pop() || ''
  return base.replace(/\.json$/i, '').trim() || 'Untitled Project'
}

/**
 * Recursively marks remote images in a serialized template as
 * `crossOrigin: 'anonymous'` so fabric.js can load (and export) them without
 * tainting the canvas. Mirrors the local fallback of the single-file import
 * flow in `views/Projects/index.vue`.
 */
export const ensureCrossOriginImages = (value: unknown): void => {
  if (!value || typeof value !== 'object') return

  if (Array.isArray(value)) {
    value.forEach(ensureCrossOriginImages)
    return
  }

  const record = value as Record<string, unknown>
  if (
    (record.type === 'image' || record.type === 'Image') &&
    typeof record.src === 'string' &&
    record.src.startsWith('http')
  ) {
    record.crossOrigin = 'anonymous'
  }

  Object.keys(record).forEach((key) => {
    if (typeof record[key] === 'object') ensureCrossOriginImages(record[key])
  })
}

/**
 * Normalizes a serialized template so it can be handed to the editor.
 * Shared by project loading and bulk import: fills in default fields and
 * re-injects the interactive workspace rect when an export lost it.
 */
export const normalizeProjectTemplate = (template: Partial<Template>): Template => {
  const sourceObjects = (template.objects ?? []) as any[]
  const hasWorkspace = sourceObjects.some((obj) => obj.id === 'WorkSpaceDrawType')

  let objects = sourceObjects
  if (!hasWorkspace && template.workSpace) {
    const workspaceObj = {
      id: 'WorkSpaceDrawType',
      type: 'Rect',
      name: 'rect',
      width: template.width,
      height: template.height,
      fill: template.workSpace.fill || '#ffffff',
      selectable: false,
      evented: false,
      ...template.workSpace
    }
    objects = [workspaceObj, ...sourceObjects]
  }

  return {
    ...template,
    id: template.id || nanoid(10),
    version: template.version || '6.7.1',
    objects,
    background: template.background || DEFAULT_TEMPLATE_BACKGROUND,
    workSpace: template.workSpace || {
      fillType: 0,
      left: 0,
      top: 0,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#ffffff'
    },
    zoom: template.zoom || 1,
    width: template.width || DEFAULT_TEMPLATE_WIDTH,
    height: template.height || DEFAULT_TEMPLATE_HEIGHT
  } as Template
}

const stripBom = (text: string): string => text.replace(/^\uFEFF/, '')

/**
 * Parses one uploaded JSON file into a project draft.
 * Invalid files (bad JSON, wrong shape) return a human-readable error instead
 * of throwing, so the dialog can list them and skip them on import.
 */
export const parseTemplateJson = (fileName: string, text: string): TemplateJsonParseResult => {
  let json: unknown
  try {
    json = JSON.parse(stripBom(text))
  } catch {
    return { ok: false, error: 'File is not valid JSON' }
  }

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, error: 'Expected a JSON object with a template' }
  }

  const record = json as Record<string, any>
  if (!Array.isArray(record.objects)) {
    return { ok: false, error: 'Missing "objects" array — not an Euclid template' }
  }

  // Remote images must opt into CORS or fabric will refuse to render them
  ensureCrossOriginImages(json)

  const template = normalizeProjectTemplate(record)
  // Measure the source: normalization may inject a workspace rect that is
  // sized from the (zoomed) template width when the export lost its own.
  const size = getTemplateArtboardSize(record as Partial<Template>)
  const name =
    typeof record.name === 'string' && record.name.trim()
      ? record.name.trim()
      : projectNameFromFileName(fileName)

  return {
    ok: true,
    draft: {
      name,
      description: typeof record.description === 'string' ? record.description : '',
      width: size.width,
      height: size.height,
      template
    }
  }
}
