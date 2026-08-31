import { XY } from "fabric"
import { ImageElement } from "./canvas"

// Minimal local type for stock image data (replaces former @/api/static/types dependency)
export interface ImageHit {
  id: number
  pageURL: string
  largeImageURL: string
  previewURL: string
  previewWidth: number
  previewHeight: number
  webformatURL: string
  width: number
  height: number
  tags: string
  user: string
  userImageURL: string
  views: number
  downloads: number
  likes: number
  comments: number
  type: ImageType
}

export enum ImageType {
  photo,
  illustration,
  vector,
}

export const enum ElementNames {
  TEXTBOX = 'textbox',
  TEXT = 'text',
  ITEXT = 'i-text',
  INPUTTEXT = 'itext',
  ARCTEXT = 'arctext',
  VERTICALTEXT = 'verticaltext',
  IMAGE = 'image',
  GIFIMAGE = 'gifimage',
  SVGIMAGE = 'svgimage',
  CROPIMAGE = 'cropimage',
  MASK = 'mask',
  PATH = 'path',
  RECT = 'rect',
  LINE = 'line',
  ARROW = 'arrow',
  POLYLINE = 'polyline',
  ELLIPSE = 'ellipse',
  QRCODE = 'qrcode',
  BARCODE = 'barcode',
  MATH = 'math',
  GROUP = 'group',
  ACTIVE = 'activeselection',
  CIRCLE = 'circle',
  REFERENCELINE = 'referenceline',
  DOT = 'dot',
}

export const SupportEffects = [
  'group',
  'activeselection',
  'itext',
  'text',
  'textbox',
  'image',
]

export interface ColorStop {
  color: string
  offset: number
  opacity?: number
}

/**
 * Shape gradient
 * 
 * type: Gradient type (radial, linear)
 * 
 * color: Gradient color
 * 
 * rotate: Gradient angle (linear gradient)
 */
 export interface PathGradient {
  type: 'linear' | 'radial'
  name: string
  color: string[]
  rotate: number
}


export type LinePoint = '' | 'arrow' | 'dot' 

export interface Mask extends ImageElement {
  src: string
  defaultColor: number
}

export interface LinePoolItem {
  path: string
  style: 'solid' | 'dashed'
  points: [LinePoint, LinePoint]
  data: XY[]
  isBroken?: boolean
  isCurve?: boolean
  isCubic?: boolean
}

export const enum ShapePathFormulasKeys {
  ROUND_RECT = 'roundRect',
  ROUND_RECT_DIAGONAL = 'roundRectDiagonal',
  ROUND_RECT_SINGLE = 'roundRectSingle',
  ROUND_RECT_SAMESIDE = 'roundRectSameSide',
  CUT_RECT_DIAGONAL = 'cutRectDiagonal',
  CUT_RECT_SINGLE = 'cutRectSingle',
  CUT_RECT_SAMESIDE = 'cutRectSameSide',
  MESSAGE = 'message',
  ROUND_MESSAGE = 'roundMessage',
  L = 'L',
  RING_RECT = 'ringRect',
  PLUS = 'plus',
  TRIANGLE = 'triangle',
  PARALLELOGRAM_LEFT = 'parallelogramLeft',
  PARALLELOGRAM_RIGHT = 'parallelogramRight',
  TRAPEZOID = 'trapezoid',
  BULLET = 'bullet',
  INDICATOR = 'indicator',
}

export interface PathPoolItem {
  viewBox: [number, number]
  path: string
  special?: boolean
  pathFormula?: ShapePathFormulasKeys
  outlined?: boolean
}

export interface PathListItem {
  type: string
  children: PathPoolItem[]
}

export interface verticalLine {
  x: number
  y1: number
  y2: number
}
export interface horizontalLine {
  y: number
  x1: number
  x2: number
}

// Border rectangle
export interface StrokeRect {
  x: number,
  y: number,
  w: number,
  h: number
}

export interface AngleRect {
  x: number
  y: number
  w: number
  h: number
}

export interface ElementStrokeRect {
  id: string
  strokeRect: StrokeRect
}

// Gradient background fill coordinates
export interface GradientCoords {
  x1: number
  y1: number
  x2: number
  y2: number,
  r1?: number,
  r2?: number
}

export interface PointElement {
  x: number,
  y: number
}

export const enum RightStates {
  ELEMENT_CANVAS = 'design',
  ELEMENT_TEXT = 'text',
  ELEMENT_SVG = 'path',
  ELEMENT_IMAGE = 'image',
  ELEMENT_CODE = 'code',
  ELEMENT_STYLE = 'style',
  ELEMENT_POSITION = 'position',
  ELEMENT_LAYER = 'layer',
  ELEMENT_EFFECT = 'effect',
}

// Shading background element
export interface ShadingColorLib {
  title: string
  slug: string
  mode: string
  colors: number
  maxStroke: number
  maxScale: number
  maxSpacing: number[]
  width: number
  height: number
  vHeight: number
  tags?: string[]
  path: string
}

// Shading background fill
export interface ShadingBackground {
  id: number
  colors: string[]
  colorCounts: number
  stroke: number
  scale: number
  spacing: number[]
  angle: number
  join: number
  moveLeft: number
  moveTop: number
}

// Font type
export interface FontOption {
  label: string
  value: string
}

// Font group
export interface FontGroupOption {
  label: string
  options: FontOption[]
}

// Barcode parameters
export interface BarCodeOption {
  format: string
  width?: number
  height?: number
  displayValue?: boolean   // Whether to display text on barcode
  fontOptions?: string     // Set barcode text bold/italic style: bold / italic / bold italic
  font?: string            // Set font for barcode display text
  fontSize?: number        // Set font size for barcode text
  textAlign?: string       // Horizontal alignment of barcode text, similar to CSS: left / center / right
  textPosition?: string    // Position of barcode text: bottom / top
  textMargin?: string      // Margin between barcode text and barcode
  background?: string      // Background color of the entire barcode container
  lineColor?: string       // Color of barcode and text
  margin?: number          // Margin of the entire barcode
  marginTop?: number       
  marginBottom?: number    
  marginLeft?: number      
  marginRight?: number    
}

export const enum AlignCommand {
  LEFT = 'left',
  RIGHT = 'right',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  CENTER = 'center',
  TOP = 'top',
  BOTTOM = 'bottom',
}

export const enum LayerCommand {
  UP = 'left',
  DOWN = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
}

export interface ImageCategoryData {
  id: number
  type: string
  name: string
  category: ImageHit[]
  total: ImageHit[]
}