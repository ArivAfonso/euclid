import { nanoid } from 'nanoid'
import type { Template, WorkSpaceElement } from '@/types/canvas'

/**
 * Pixelied API response structure
 */
export interface PixeliedTemplate {
  _id: string
  template_name: string
  template_desc: string
  canvas_doc_json: {
    doc_width: number
    doc_height: number
    doc_units: string
  }
  pages: PixeliedPage[]
  thumbnail_url?: string
}

export interface PixeliedPage {
  page_id: string
  page_name: string
  page_editor_json: {
    version: string
    objects: PixeliedObject[]
    background: string
  }
}

export interface PixeliedObject {
  type: string
  version: string
  id: number | string
  left: number
  top: number
  width: number
  height: number
  fill?: string
  stroke?: string | null
  strokeWidth?: number
  scaleX?: number
  scaleY?: number
  angle?: number
  flipX?: boolean
  flipY?: boolean
  opacity?: number
  visible?: boolean
  text?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  fontStyle?: string
  lineHeight?: number
  textAlign?: string
  underline?: boolean
  overline?: boolean
  linethrough?: boolean
  charSpacing?: number
  src?: string
  path?: any[]
  shadow?: any
  clipTo?: any
  transformMatrix?: any
  noScaleCache?: boolean
  objectCaching?: boolean
  [key: string]: any
}

/**
 * Convert Pixelied object type to Euclid type
 */
function convertType(type: string): string {
  const typeMap: Record<string, string> = {
    'rect': 'Rect',
    'circle': 'Circle',
    'ellipse': 'Ellipse',
    'triangle': 'Triangle',
    'polygon': 'Polygon',
    'path': 'Path',
    'line': 'Line',
    'polyline': 'Polyline',
    'textbox': 'Textbox',
    'text': 'IText',
    'i-text': 'IText',
    'image': 'Image',
    'group': 'Group',
  }
  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Get element name based on type
 */
function getElementName(type: string): string {
  const nameMap: Record<string, string> = {
    'Rect': 'rect',
    'Circle': 'circle',
    'Ellipse': 'ellipse',
    'Triangle': 'triangle',
    'Polygon': 'polygon',
    'Path': 'path',
    'Line': 'line',
    'Polyline': 'polyline',
    'Textbox': 'textbox',
    'IText': 'i-text',
    'Image': 'image',
    'Group': 'group',
  }
  return nameMap[type] || type.toLowerCase()
}

/**
 * Convert a single Pixelied object to Euclid format
 */
function convertObject(obj: PixeliedObject): any {
  const convertedType = convertType(obj.type)
  
  // Base converted object with common properties
  const converted: any = {
    ...obj,
    type: convertedType,
    id: nanoid(10),
    name: getElementName(convertedType),
    version: '5.3.0',
    fillType: 0,
    objectCaching: true,
    transparentCorners: false,
    hasBorders: true,
  }

  // Remove deprecated/old Fabric.js properties
  delete converted.clipTo
  delete converted.transformMatrix
  delete converted.noScaleCache
  delete converted.perPixelTargetFind
  delete converted.originalLeft
  delete converted.originalTop
  delete converted.lockUniScaling
  delete converted.fontFamilyCommandName

  // Handle clipPath if present (convert recursively)
  if (obj.clipPath) {
    converted.clipPath = convertObject(obj.clipPath)
  }

  // Handle shadow (ensure proper format)
  if (obj.shadow && typeof obj.shadow === 'object') {
    if (obj.shadow.color === null) {
      converted.shadow = null
    } else {
      converted.shadow = {
        color: obj.shadow.color || 'rgba(0,0,0,0.3)',
        blur: obj.shadow.blur || 0,
        offsetX: obj.shadow.offsetX || 0,
        offsetY: obj.shadow.offsetY || 0,
        affectStroke: obj.shadow.affectStroke || false,
      }
    }
  }

  // Handle text-specific properties
  if (convertedType === 'Textbox' || convertedType === 'IText') {
    converted.editable = true
    converted.color = obj.fill || '#000000'
    converted.fillRepeat = 'no-repeat'
    converted.fillURL = ''
    if (obj.minWidth === undefined) {
      converted.minWidth = 20
    }
    if (obj.splitByGrapheme === undefined) {
      converted.splitByGrapheme = false
    }
  }

  // Handle image properties
  if (convertedType === 'Image') {
    converted.crossOrigin = 'anonymous'
    if (obj.filters && obj.filters.length > 0) {
      // Convert filters to new format
      converted.filters = obj.filters.map((filter: any) => ({
        ...filter,
        type: filter.type || 'BaseFilter',
      }))
    }
  }

  // Handle path data
  if (obj.path && Array.isArray(obj.path)) {
    converted.path = obj.path
  }

  // Handle group objects
  if (convertedType === 'Group' && obj.objects && Array.isArray(obj.objects)) {
    converted.objects = obj.objects.map(convertObject)
  }

  return converted
}

/**
 * Create workspace element for the canvas
 */
function createWorkSpaceElement(width: number, height: number, background: string): any {
  return {
    rx: 0,
    ry: 0,
    id: 'WorkSpaceDrawType',
    name: 'rect',
    color: background || '#ffffff',
    padding: 0,
    fill: background || '#ffffff',
    selectable: false,
    evented: false,
    fillType: 0,
    lockMovementX: false,
    lockMovementY: false,
    objectCaching: true,
    transparentCorners: false,
    hasBorders: true,
    globalCompositeOperation: 'source-over',
    type: 'Rect',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width,
    height,
    stroke: '',
    strokeWidth: 0,
    strokeDashArray: null,
    strokeLineCap: 'butt',
    strokeDashOffset: 0,
    strokeLineJoin: 'miter',
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: null,
    visible: true,
    backgroundColor: '',
    fillRule: 'nonzero',
    paintFirst: 'fill',
    skewX: 0,
    skewY: 0,
  }
}

/**
 * Convert Pixelied template response to Euclid Template format
 */
export function convertPixeliedToEuclid(pixeliedData: PixeliedTemplate): Template[] {
  const templates: Template[] = []
  
  const { canvas_doc_json, pages } = pixeliedData
  const width = canvas_doc_json.doc_width
  const height = canvas_doc_json.doc_height

  for (const page of pages) {
    const editorJson = page.page_editor_json
    const background = editorJson.background || '#ffffff'
    
    // Convert all objects
    const convertedObjects = editorJson.objects.map(convertObject)
    
    // Create workspace element (must be first)
    const workSpaceElement = createWorkSpaceElement(width, height, background)
    
    // Create workspace config
    const workSpace: WorkSpaceElement = {
      fillType: 0,
      left: 0,
      top: 0,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      color: background,
      fill: background,
      backgroundColor: background,
    }

    // Create the template
    const template: Template = {
      id: nanoid(10),
      version: '5.3.0',
      background: 'rgba(255,255,255,0)',
      objects: [workSpaceElement, ...convertedObjects],
      workSpace,
      zoom: 1,
      width,
      height,
      clip: 0,
    }

    templates.push(template)
  }

  return templates
}

/**
 * Fetch template from Pixelied API via Server Proxy
 */
export async function fetchPixeliedTemplate(templateId: string): Promise<PixeliedTemplate> {
  // Use the server proxy to avoid CORS and handle image conversion
  const baseUrl = import.meta.env.VITE_CF_WORKERS_API || 'http://localhost:8787'
  const url = `${baseUrl}/api/utils/pixelied-import?templateId=${templateId}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  return data as PixeliedTemplate
}

/**
 * Fetch and convert Pixelied template to Euclid format
 */
export async function importPixeliedTemplate(templateId: string): Promise<Template[]> {
  const pixeliedData = await fetchPixeliedTemplate(templateId)
  return convertPixeliedToEuclid(pixeliedData)
}
