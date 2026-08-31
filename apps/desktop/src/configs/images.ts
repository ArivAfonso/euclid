export const ratioClipOptions = [
  {
    label: 'Aspect Ratio (Square)',
    children: [
      { key: '1:1', ratio: 1 / 1 },
    ],
  },
  {
    label: 'Aspect Ratio (Portrait)',
    children: [
      { key: '2:3', ratio: 3 / 2 },
      { key: '3:4', ratio: 4 / 3 },
      { key: '3:5', ratio: 5 / 3 },
      { key: '4:5', ratio: 5 / 4 },
    ],
  },
  {
    label: 'Aspect Ratio (Landscape)',
    children: [
      { key: '3:2', ratio: 2 / 3 },
      { key: '4:3', ratio: 3 / 4 },
      { key: '5:3', ratio: 3 / 5 },
      { key: '5:4', ratio: 4 / 5 },
    ],
  },
  {
    children: [
      { key: '16:9', ratio: 9 / 16 },
      { key: '16:10', ratio: 10 / 16 },
    ],
  },
]

export const enum ClipPathTypes {
  RECT = 'rect',
  ELLIPSE = 'ellipse',
  POLYGON = 'polygon',
}

export const enum ClipPaths {
  RECT = 'rect',
  ROUNDRECT = 'roundRect',
  ELLIPSE = 'ellipse',
  TRIANGLE = 'triangle',
  PENTAGON = 'pentagon',
  RHOMBUS = 'rhombus',
  STAR = 'star',
}

export const CLIPPATHS = {
  rect: {
    name: 'Rectangle',
    type: ClipPathTypes.RECT,
    radius: '0',
    style: '',
    createPath: (width: number, height: number) => {
      return `M ${-width/2} ${-height/2} L ${width/2} ${-height/2} L ${width/2} ${height/2} L ${width/2} ${height/2} L ${-width/2} ${height/2} Z`
    },
  },
  rect2: {
    name: 'Rectangle 2',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(0% 0%, 80% 0%, 100% 20%, 100% 100%, 0 100%)',
    createPath: (width: number, height: number) => {
      return `M ${-width/2} ${-height/2} L ${width*0.3} ${-height/2} L ${width/2} ${-height*0.3} L ${width/2} ${height/2} L ${-width/2} ${height/2} Z`
    },
  },
  rect3: {
    name: 'Rectangle 3',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(0% 0%, 80% 0%, 100% 20%, 100% 100%, 20% 100%, 0% 80%)',
    createPath: (width: number, height: number) => {
      return `M ${-width/2} ${-height/2} L ${width*0.3} ${-height/2} L ${width/2} ${-height*0.3} L ${width/2} ${height/2} L ${-width*0.3} ${height/2} L ${-width/2} ${height * 0.3} Z`
    },
  },
  roundRect: {
    name: 'Rounded Rectangle',
    type: ClipPathTypes.RECT,
    radius: '10px',
    style: 'inset(0 0 0 0 round 10px 10px 10px 10px)',
    createPath: (width: number, height: number, radius=50) => {
      return `M ${-width/2 + radius} ${-height/2}
              Q ${-width/2} ${-height/2} ${-width/2} ${-height/2 + radius}
              L ${-width/2} ${height/2 - radius}
              Q ${-width/2} ${height/2} ${-width/2 + radius} ${height/2}
              L ${width/2 - radius} ${height/2}
              Q ${width/2} ${height/2} ${width/2} ${height/2 - radius}
              L ${width/2} ${-height/2 + radius}
              Q ${width/2} ${-height/2} ${width/2 - radius} ${-height/2}
              L ${-width/2 + radius} ${-height/2}
              Z`
    },
  },
  ellipse: {
    name: 'Circle',
    type: ClipPathTypes.ELLIPSE,
    style: 'ellipse(50% 50% at 50% 50%)',
    createPath: (width: number, height: number, radius=100) => {
      const size = Math.min(width, height)
      return `M ${size/2} 0
      A ${size/2} ${size/2} 0 1 0 ${-size/2} 0
      A ${size/2} ${size/2} 0 1 0 ${size/2} 0
      Z`
    },
  },
  triangle: {
    name: 'Triangle',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    createPath: (width: number, height: number) => {
      return `M 0 ${-height/2} L ${-width/2} ${height/2} L ${width/2} ${height/2} Z`
    },
  },
  triangle2: {
    name: 'Triangle 2',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(50% 100%, 0% 0%, 100% 0%)',
    createPath: (width: number, height: number) => {
      return `M 0 ${height/2} L ${-width/2} ${-height/2} L ${width/2} ${-height/2} Z`
    },
  },
  triangle3: {
    name: 'Triangle 3',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(0% 0%, 0% 100%, 100% 100%)',
    createPath: (width: number, height: number) => {
      return `M ${-width/2} ${-height/2} L ${-width/2} ${height/2} L ${width/2} ${height/2} Z`
    },
  },
  rhombus: {
    name: 'Diamond',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    createPath: (width: number, height: number) => {
      return `M 0 ${-height/2} L ${width/2} 0 L 0 ${height/2} L ${-width/2} 0 Z`
    },
  },
  pentagon: {
    name: 'Pentagon',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    createPath: (width: number, height: number) => {
      return `M 0 ${-height/2} L ${width/2} ${-0.12*height} L ${0.32*width} ${height/2} L ${-0.32*width} ${height/2} L ${-width/2} ${-0.12*height} Z`
    },
  },
  hexagon: {
    name: 'Hexagon',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
    createPath: (width: number, height: number) => {
      return `M ${-width * 0.3} ${-height/2} L ${width * 0.3} ${-height/2} L ${width/2} 0 L ${width * 0.3} ${height/2} L ${-width * 0.3} ${height/2} L ${-width/2} 0 Z`
    },
  },
  heptagon: {
    name: 'Heptagon',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)',
    createPath: (width: number, height: number) => {
      return `M 0 ${-height/2} L ${width * 0.4} ${-height * 0.3} L ${width/2} ${height * 0.1} L ${width * 0.25} ${height/2} L ${-width * 0.25} ${height/2} L ${-width * 0.5} ${height * 0.1} L ${-width * 0.4} ${-height * 0.3} Z`
    },
  },
  octagon: {
    name: 'Octagon',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    createPath: (width: number, height: number) => {
      return `M ${-width * 0.2} ${-height * 0.5} L ${width * 0.2} ${-height * 0.5} L ${width * 0.5} ${-height * 0.2} L ${width * 0.5} ${height * 0.2} L ${width * 0.2} ${height * 0.5} L ${-width * 0.2} ${height * 0.5} L ${-width * 0.5} ${height * 0.2} L ${-width * 0.5} ${-height * 0.2} Z`
    },
  },
  chevron: {
    name: 'Chevron',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)',
    createPath: (width: number, height: number) => {
      return `M ${width * 0.25} ${-height * 0.5} L ${width * 0.5} 0 L ${width * 0.25} ${height * 0.5} L ${-width * 0.5} ${height * 0.5} L ${-width * 0.25} 0 L ${-width * 0.5} ${-height * 0.5} Z`
    },
  },
  point: {
    name: 'Pointer',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)',
    createPath: (width: number, height: number) => {
      return `M ${-width * 0.5} ${-height * 0.5} L ${width * 0.25} ${-height * 0.5} L ${width * 0.5} 0 L ${width * 0.25} ${height * 0.5} L ${-width * 0.5} ${height * 0.5} Z`
    },
  },
  arrow: {
    name: 'Arrow',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
    createPath: (width: number, height: number) => {
      return `M ${-width * 0.5} ${-height * 0.3} L ${width * 0.1} ${-height * 0.3} L ${width * 0.1} ${-height * 0.5} L ${width * 0.5} 0 L ${width * 0.1} ${height * 0.5} L ${width * 0.1} ${height * 0.3} L ${-width * 0.5} ${height * 0.3} Z`
    },
  },
  parallelogram: {
    name: 'Parallelogram',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(30% 0%, 100% 0%, 70% 100%, 0% 100%)',
    createPath: (width: number, height: number) => {
      return `M ${-width * 0.2} ${-height * 0.5} L ${width * 0.5} ${-height * 0.5} L ${width * 0.2} ${height * 0.5} L ${-width * 0.5} ${height * 0.5} Z`
    },
  },
  parallelogram2: {
    name: 'Parallelogram 2',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(30% 100%, 100% 100%, 70% 0%, 0% 0%)',
    createPath: (width: number, height: number) => {
      return `M ${-width * 0.2} ${height * 0.5} L ${width * 0.5} ${height * 0.5} L ${width * 0.2} ${-height * 0.5} L ${-width * 0.5} ${-height * 0.5} Z`
    },
  },
  trapezoid: {
    name: 'Trapezoid',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
    createPath: (width: number, height: number) => {
      return `M ${-width * 0.25} ${-height * 0.5} L ${width * 0.25} ${-height * 0.5} L ${width * 0.5} ${height * 0.5} L ${-width * 0.5} ${height * 0.5} Z`
    },
  },
  trapezoid2: {
    name: 'Trapezoid 2',
    type: ClipPathTypes.POLYGON,
    style: 'polygon(0% 0%, 100% 0%, 75% 100%, 25% 100%)',
    createPath: (width: number, height: number) => {
      return `M ${-width * 0.5} ${-height * 0.5} L ${width * 0.5} ${-height * 0.5} L ${width * 0.25} ${height * 0.5} L ${-width * 0.25} ${height * 0.5} Z`
    },
  },
}

export type ClipPathType = 'rect' 
| 'rect2' 
| 'rect3' 
| 'roundRect' 
| 'ellipse' 
| 'triangle' 
| 'triangle2' 
| 'triangle3' 
| 'rhombus' 
| 'pentagon'
| 'hexagon'
| 'heptagon'
| 'octagon'
| 'chevron'
| 'point'
| 'arrow'
| 'parallelogram'
| 'parallelogram2'
| 'trapezoid'
| 'trapezoid2'

export const PatternImages = [
  { name: 'escheresque', url: new URL(`/src/assets/images/escheresque.png`, import.meta.url).href },
  { name: 'greyfloral', url: new URL(`/src/assets/images/greyfloral.png`, import.meta.url).href },
  { name: 'honey_im_subtle', url: new URL(`/src/assets/images/honey_im_subtle.png`, import.meta.url).href },
  { name: 'nasty_fabric', url: new URL(`/src/assets/images/nasty_fabric.png`, import.meta.url).href },
  { name: 'retina_wood', url: new URL(`/src/assets/images/retina_wood.png`, import.meta.url).href },
]

export const GrayscaleType = 'Grayscale'
export const SharpenMatrix = [ 0, -1, 0, -1,   5, -1,  0,  -1,  0 ]
export const EmbossMatrix =  [ 1,  1, 1,  1, 0.7, -1, -1,  -1, -1 ]

// backgrounds, fashion, nature, science, education, feelings, health, people, religion, 
// places, animals, industry, computer, food, sports, transportation, travel, buildings, business, music
export const ImageCategoryInfo = [
  {id: 0, name: 'Backgrounds', type: 'backgrounds', category: [], total: []},
  {id: 1, name: 'Nature', type: 'nature', category: [], total: []},
  {id: 2, name: 'Science', type: 'science', category: [], total: []},
  {id: 3, name: 'Education', type: 'education', category: [], total: []},
  {id: 4, name: 'Feelings', type: 'feelings', category: [], total: []},
  {id: 5, name: 'Health', type: 'health', category: [], total: []},
  {id: 6, name: 'Places', type: 'places', category: [], total: []},
  {id: 7, name: 'Animals', type: 'animals', category: [], total: []},
  {id: 8, name: 'Industry', type: 'industry', category: [], total: []},
  {id: 9, name: 'Computers', type: 'computer', category: [], total: []},
  {id: 10, name: 'Food', type: 'food', category: [], total: []},
  {id: 11, name: 'Sports', type: 'sports', category: [], total: []},
  {id: 12, name: 'Transportation', type: 'transportation', category: [], total: []},
  {id: 13, name: 'Travel', type: 'travel', category: [], total: []},
  {id: 14, name: 'Architecture', type: 'buildings', category: [], total: []},
  {id: 15, name: 'Business', type: 'business', category: [], total: []},
  {id: 16, name: 'Fashion', type: 'fashion', category: [], total: []},
  {id: 17, name: 'People', type: 'people', category: [], total: []},
]

export const MattingModel = [
  {id: 'universal', key: 'universal', name: 'General'},
  {id: 'people', key: 'people', name: 'Portrait'},
]

export const BlendModes = [
  {id: 'source-over', key: 'source-over', name: 'Normal'},
  // {id: 'source-in', key: 'source-in', name: 'Portrait'},
  // {id: 'source-out', key: 'source-out', name: 'Portrait'},
  // {id: 'source-atop', key: 'source-atop', name: 'Portrait'},
  // {id: 'destination-in', key: 'destination-in', name: 'Portrait'},
  // {id: 'destination-out', key: 'destination-out', name: 'Portrait'},
  // {id: 'destination-atop', key: 'destination-atop', name: 'Portrait'},
  // {id: 'lighter', key: 'lighter', name: 'Portrait'},
  {id: 'screen', key: 'screen', name: 'Screen'},
  // {id: 'copy', key: 'copy', name: 'Portrait'},
  // {id: 'xor', key: 'xor', name: 'Portrait'},
  {id: 'multiply', key: 'multiply', name: 'Multiply'},
  {id: 'darken', key: 'darken', name: 'Darken'},
  {id: 'lighten', key: 'lighten', name: 'Lighten'},
  {id: 'color-dodge', key: 'color-dodge', name: 'Color Dodge'},
  {id: 'color-burn', key: 'color-burn', name: 'Color Burn'},
  {id: 'hard-light', key: 'hard-light', name: 'Hard Light'},
  {id: 'soft-light', key: 'soft-light', name: 'Soft Light'},
  {id: 'difference', key: 'difference', name: 'Difference'},
  {id: 'exclusion', key: 'exclusion', name: 'Exclusion'},
  {id: 'hue', key: 'hue', name: 'Hue'},
  {id: 'saturation', key: 'saturation', name: 'Saturation'},
  {id: 'color', key: 'color', name: 'Color'},
  {id: 'luminosity', key: 'luminosity', name: 'Luminosity'},
]