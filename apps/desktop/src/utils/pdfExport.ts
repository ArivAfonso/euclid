/**
 * PDF Export Engine
 *
 * Converts Euclid canvas templates (from Pinia store) into a
 * PDF document using jspdf. Each slide is rendered as a
 * full-page rasterized image ("flat" mode).
 */

import { jsPDF } from 'jspdf'
import { StaticCanvas } from 'fabric'
import type { Template, SerializedObjectProps } from '@/types/canvas'

// ─── Unit Conversion ──────────────────────────────────────────

/** Pixels per inch (screen standard) */
const PX_PER_INCH = 96

/** Millimeters per inch */
const MM_PER_INCH = 25.4

/**
 * Convert pixels to millimeters at 96 DPI.
 * 1 px = 25.4 / 96 mm ≈ 0.264583 mm
 */
function pxToMm(px: number): number {
  return (px / PX_PER_INCH) * MM_PER_INCH
}

// ─── Types ────────────────────────────────────────────────────

export interface PDFOptions {
  /** Output filename (without extension) */
  fileName?: string
  /** DPI for rasterized images */
  rasterizeDPI?: number
  /** Callback for progress updates (0-100) */
  onProgress?: (percent: number) => void
}

const DEFAULT_OPTIONS: PDFOptions = {
  fileName: 'euclid-document',
  rasterizeDPI: 150,
}

/**
 * Determine if an element should be skipped entirely.
 */
function shouldSkipElement(obj: SerializedObjectProps): boolean {
  const id = ((obj as any).id || '').toLowerCase()
  const type = ((obj as any).type || '').toLowerCase()
  const name = ((obj as any).name || '').toLowerCase()

  // Skip workspace overlay objects
  if (
    id.startsWith('workspace') ||
    name === 'referenceline' ||
    type === 'referenceline'
  ) {
    return true
  }

  // Skip hidden objects
  if ((obj as any).visible === false) return true

  // Skip objects marked as not for export
  if ((obj as any).showInExport === false) return true

  return false
}

/**
 * Rasterize an entire slide (all objects) to a single PNG data URL.
 */
async function rasterizeSlide(
  template: Template,
  dpi: number
): Promise<string | null> {
  try {
    const zoom = template.zoom || 1
    const canvasWidthPx = template.width / zoom
    const canvasHeightPx = template.height / zoom
    const scale = dpi / 96

    const canvasW = Math.ceil(canvasWidthPx * scale)
    const canvasH = Math.ceil(canvasHeightPx * scale)

    const canvas = new StaticCanvas(undefined, {
      width: canvasW,
      height: canvasH,
      backgroundColor: 'transparent',
    })

    // Filter out workspace objects and hidden objects
    const exportObjects = (template.objects || []).filter(
      (obj) => !shouldSkipElement(obj)
    )

    // Scale and position all objects
    const scaledObjects = exportObjects.map((obj) => ({
      ...obj,
      scaleX: ((obj as any).scaleX ?? 1) * scale,
      scaleY: ((obj as any).scaleY ?? 1) * scale,
      left: (obj.left ?? 0) * scale,
      top: (obj.top ?? 0) * scale,
    }))

    await canvas.loadFromJSON({
      version: '5.3.0',
      objects: scaledObjects,
    })

    // Draw background if present
    if (template.background || template.workSpace?.fill) {
      const bgColor = typeof template.background === 'string'
        ? template.background
        : typeof template.workSpace?.fill === 'string'
          ? template.workSpace.fill
          : '#ffffff'

      canvas.backgroundColor = bgColor
    } else {
      canvas.backgroundColor = '#ffffff'
    }

    canvas.renderAll()

    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 1,
    })

    canvas.dispose()
    return dataUrl
  } catch (err) {
    console.warn('Failed to rasterize slide for PDF:', err)
    return null
  }
}

// ─── PDF Page Management ─────────────────────────────────────

interface SlideDimensions {
  widthMm: number
  heightMm: number
}

/**
 * Calculate slide dimensions in mm from a template.
 */
function getSlideDimensions(template: Template): SlideDimensions {
  const zoom = template.zoom || 1
  const canvasWidthPx = template.width / zoom
  const canvasHeightPx = template.height / zoom
  return {
    widthMm: pxToMm(canvasWidthPx),
    heightMm: pxToMm(canvasHeightPx),
  }
}

// ─── Flat Mode Export ─────────────────────────────────────────

/**
 * Export templates in flat mode: each slide is a full-page rasterized image.
 */
async function exportFlat(
  doc: jsPDF,
  templates: Template[],
  dpi: number,
  onProgress?: (percent: number) => void
): Promise<void> {
  const totalSlides = templates.length

  for (let i = 0; i < totalSlides; i++) {
    const template = templates[i]

    if (i > 0) {
      doc.addPage()
    }

    const dims = getSlideDimensions(template)
    const slideImage = await rasterizeSlide(template, dpi)

    if (slideImage) {
      // Add the image filling the full page
      doc.addImage(
        slideImage,
        'PNG',
        0,
        0,
        dims.widthMm,
        dims.heightMm
      )
    } else {
      // Fallback: draw a placeholder
      doc.setFillColor(240, 240, 240)
      doc.rect(0, 0, dims.widthMm, dims.heightMm, 'F')
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(12)
      doc.text('Failed to render slide', dims.widthMm / 2, dims.heightMm / 2, {
        align: 'center',
        baseline: 'middle',
      })
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalSlides) * 100))
    }
  }
}

// ─── Main Export Function ─────────────────────────────────────

/**
 * Convert Euclid templates to a PDF Blob.
 *
 * @param templates - Array of Euclid templates (each becomes a page)
 * @param options   - Export options (mode, DPI, progress callback)
 * @returns The generated PDF file as a Blob
 */
export async function exportToPDF(
  templates: Template[],
  options: PDFOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (!templates || templates.length === 0) {
    throw new Error('No templates to export')
  }

  const dpi = opts.rasterizeDPI || 150

  // Determine page dimensions from the first template
  const firstDims = getSlideDimensions(templates[0])

  // Create the PDF document
  const doc = new jsPDF({
    unit: 'mm',
    format: [firstDims.widthMm, firstDims.heightMm],
    orientation: firstDims.widthMm >= firstDims.heightMm ? 'landscape' : 'portrait',
    compress: true,
  })

  await exportFlat(doc, templates, dpi, opts.onProgress)

  // Generate the PDF blob
  const arrayBuffer = doc.output('arraybuffer')
  return new Blob([arrayBuffer], { type: 'application/pdf' })
}

/**
 * Generate a PDF and return it as a Blob suitable for file-saving.
 * Convenience wrapper around exportToPDF.
 */
export async function exportToPDFBlob(
  templates: Template[],
  options: PDFOptions = {}
): Promise<Blob> {
  return exportToPDF(templates, options)
}

/** PDF MIME type for download/file handling */
export const PDF_MIME_TYPE = 'application/pdf'

/**
 * Resolve the slide background color as a hex string.
 */
function resolveBackgroundColor(template: Template): string {
  if (template.background && typeof template.background === 'string') {
    return template.background
  }
  if (template.workSpace?.fill && typeof template.workSpace.fill === 'string') {
    return template.workSpace.fill
  }
  return '#ffffff'
}
