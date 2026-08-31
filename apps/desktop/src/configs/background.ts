export const TransparentFill = 'rgba(0,0,0,0)'
export const MinSize = 30
export const MaxSize = 800
export const Padding = 50000

export const DesignUnitMode = [
  {id: 0, name: 'mm'}, 
  {id: 1, name: 'px'}, 
  {id: 2, name: 'inch'}, 
]

export const DesignSizeMode = [
  {id: 0, name: 'Business Card', disabled: false}, 
  {id: 1, name: 'Single Page', disabled: false}, 
  {id: 2, name: 'Custom', disabled: true}
]

export const BackgroundFillMode = [
  {id: 0, name: 'Solid Color Fill'}, 
  {id: 1, name: 'Image Fill'}, 
  {id: 2, name: 'Gradient Fill'},
  {id: 3, name: 'Grid Fill'},
]

// Upload image
export const BackgroundFillImageMode = [
  {id: 'contain', name: 'Scale'}, 
  {id: 'repeat', name: 'Tile'}, 
  {id: 'cover', name: 'Cover'},
]

// Gradient colors
export const BackgroundFillGradientMode = [
  {id: 0, name: 'Linear Gradient', value: 'linear'}, 
  {id: 1, name: 'Radial Gradient', value: 'radial'}, 
]

// Grid images
export const BackgroundFillGridMode = [
  {id: 0, name: 'Gradient', value: 'interpolateLinear'}, 
  {id: 1, name: 'Sparkle', value: 'sparkle'}, 
  {id: 2, name: 'Shadows', value: 'shadows'},
]