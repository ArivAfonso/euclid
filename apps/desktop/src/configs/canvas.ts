export const WorkSpaceDrawType = 'WorkSpaceDrawType'
export const WorkSpaceClipType = 'WorkSpaceClipType'
export const WorkSpaceSafeType = 'WorkSpaceSafeType'
export const WorkSpaceMaskType = 'WorkSpaceMaskType'
export const WorkSpaceLineType = 'WorkSpaceLineType'

export const WorkSpaceCommonType = [
  WorkSpaceDrawType, WorkSpaceClipType, WorkSpaceSafeType, WorkSpaceMaskType, WorkSpaceLineType
]

export const WorkSpaceThumbType = [
  WorkSpaceClipType, WorkSpaceSafeType, WorkSpaceMaskType, WorkSpaceLineType
]

// Separator
export const Separator = '.'

// Fixed elements
export const WorkSpaceName = 'EUCLID-DRAW'

// 
export const CropLinesColor = '#f6f7fa'

// Database ID
export const LocalStorageDiscardedKey = 'EUCLID_DISCARD_DB'

// Canvas edit color
export const WorkSpaceEditColor = 'rgba(255,255,255,1)'

// Canvas mask color
export const WorkSpaceMaskColor = '#f3f3f3'

// Canvas background color
export const CanvasBackground = 'rgba(255,255,255,0)'

// Canvas crop color
export const WorkSpaceClipColor = 'red'

// Canvas safe color
export const WorkSpaceSafeColor = 'yellow'

// Canvas common properties
export const WorkSpaceCommonOption = {
  selectable: false,
  transparentCorners: false,
  evented: false,
  excludeFromExport: true,
  hasControls: false,
  hasBorders: false,
  perPixelTargetFind: false,
  // absolutePositioned: true,
  lockMovementX: true,
  lockMovementY: true,
  lockRotation: true,
  lockScalingX: true,
  lockScalingY: true,
  lockUniScaling: true,
  hoverCursor: 'default',
  name: WorkSpaceName,
}

export const propertiesToInclude = [
  'id', 
  'name', 
  'layer',
  'isShow',
  'editable',
  'color', 
  'axis',
  'mask',
  'padding',
  'cropKey', 
  'cropPath', 
  'cropSize', 
  'fill',
  'selectable',
  'evented',
  'fillType', 
  'fillURL', 
  'fillRepeat', 
  'lockMovementX', 
  'lockMovementY', 
  'objectCaching',
  'transparentCorners',
  'gifAutoplay',
  'playbackSpeed',
  'codeOption',
  'codeContent',
  'background',
  'backgroundColor',
  'textBackgroundColor',
  'hasBorders',
  'originSrc',
  'radius',
  'curvature',
  'effect',
  'reverse',
  'startStyle',
  'endStyle',
  'effects',
  'imageEffects',
  'imageEffectsOriginalSrc',
  'mask',
  'originSrc',
  'originWidth',
  'originHeight',
  'globalCompositeOperation',
  'rx',
  'ry',
  'tlRx',
  'trRx',
  'blRx',
  'brRx',
  'showInExport',
]

export const WorkSpaceDrawData = {
  "rx": 0,
  "ry": 0,
  "id": "WorkSpaceDrawType",
  "name": "rect",
  "fill": "#fff",
  "selectable": false,
  "evented": false,
  "lockMovementX": false,
  "lockMovementY": false,
  "objectCaching": true,
  "transparentCorners": false,
  "hasBorders": true,
  "type": "Rect",
  "version": "6.0.0-beta9",
  "originX": "left",
  "originY": "top",
  "left": 0,
  "top": 0,
  "width": 1070.5512,
  "height": 645.3543,
  "stroke": "rgba(255,255,255,1)",
  "strokeWidth": 1,
  "strokeDashArray": null,
  "strokeLineCap": "butt",
  "strokeDashOffset": 0,
  "strokeLineJoin": "miter",
  "strokeUniform": false,
  "strokeMiterLimit": 4,
  "scaleX": 1,
  "scaleY": 1,
  "angle": 0,
  "flipX": false,
  "flipY": false,
  "opacity": 1,
  "shadow": null,
  "visible": true,
  "backgroundColor": "",
  "fillRule": "nonzero",
  "paintFirst": "fill",
  "globalCompositeOperation": "source-over",
  "skewX": 0,
  "skewY": 0
}