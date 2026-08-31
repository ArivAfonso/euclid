import { Object as FabricObject } from 'fabric'
import { customAlphabet } from 'nanoid'
import { defineStore } from 'pinia'
import { GOOGLE_FONT_OPTIONS, GOOGLE_FONT_CATEGORY_MAP, GOOGLE_FONTS, GoogleFontDefinition } from '@/configs/fonts'
import { ImageCategoryInfo } from '@/configs/images'
import { CanvasElement } from '@/types/canvas'
import { RightStates, PointElement, ImageCategoryData, FontGroupOption } from '@/types/elements'
import { ExportTypes, PoolType, SystemFont } from '@/types/common'
import { ensureGoogleFontFaceSync, waitForGoogleFont } from '@/utils/googleFonts'
import useCanvas from '@/views/Canvas/useCanvas'
import type { CustomFontFamily, CustomFontVariantMeta } from '@/types/fonts'
import type { StoredCustomFont } from '@/utils/customFontStorage'
import { getAllStoredFonts, getStoredFontsByFamily, deleteStoredFonts } from '@/utils/customFontStorage'
import { recordsToFamilies, revokeFontObjectUrls, normalizeVariantDescriptor } from '@/utils/customFonts'

export interface MainState {
  canvasObject: FabricObject | undefined
  hoveredObject: FabricObject | undefined 
  leavedObject: FabricObject | undefined 
  clonedObject: FabricObject | undefined
  currentPoint: PointElement | null
  rightState: RightStates
  imageCategoryType: string[]
  imageCategoryData: ImageCategoryData[]
  illustrationCategoryType: string[]
  illustrationCategoryData: ImageCategoryData[]
  handleElementId: string
  sizeMode: number
  unitMode: number
  gridColorSelf: [string[]]
  databaseId: string
  selectedTemplatesIndex: number[]
  thumbnailsFocus: boolean
  drawAreaFocus: boolean
  fontOptions: SystemFont[]
  fontGroups: FontGroupOption[]
  customFonts: CustomFontFamily[]
  googleFonts: GoogleFontDefinition[]
  disableHotkeys: boolean
  exportType: ExportTypes
  lastEdit: PoolType
  poolType: PoolType
  poolShow: boolean
  isDarkMode: boolean
  imageLoadingTasks: number
  savingProject: boolean
}

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
export const databaseId = nanoid(10)

const formatCategoryLabel = (label: string) =>
  label
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

// Popular fonts that should load first
const POPULAR_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'PT Sans',
  'Ubuntu',
  'Playfair Display',
  'Merriweather',
  'Poppins',
  'Source Sans Pro',
  'Nunito',
  'Roboto Condensed',
  'Roboto Slab',
  'Noto Sans',
  'Noto Serif',
  'Inter',
  'Fira Sans',
  'Fira Sans Condensed',
  'Mukta',
  'Rubik',
  'Work Sans',
  'Karla',
  'Josefin Sans',
  'Quicksand',
  'Bebas Neue',
  'Libre Baskerville',
  'Lora',
  'Barlow',
  'Barlow Condensed',
  'Heebo',
  'Cabin',
  'Titillium Web',
  'Cormorant Garamond',
  'Inconsolata',
  'PT Serif',
  'Manrope',
  'IBM Plex Sans',
  'IBM Plex Serif',
]

const popularFontOptions = POPULAR_FONTS
  .map((family) => GOOGLE_FONT_OPTIONS.find((option) => option.value === family))
  .filter((option): option is SystemFont => Boolean(option))

const DEFAULT_FONT_GROUPS: FontGroupOption[] = [
  {
    label: 'Popular',
    options: popularFontOptions,
  },
  ...Object.entries(GOOGLE_FONT_CATEGORY_MAP)
    .map(([label, options]) => ({
      label: formatCategoryLabel(label),
      options: options.map((option) => ({ ...option })),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
]

const cloneDefaultFontGroups = (): FontGroupOption[] =>
  DEFAULT_FONT_GROUPS.map((group) => ({
    label: group.label,
    options: group.options.map((option) => ({ ...option })),
  }))

const loadedCustomFontFaces = new Set<string>()
const loadingCustomFontFaces = new Map<string, Promise<void>>()

const getCustomFontKey = (family: string, variant: CustomFontVariantMeta) =>
  `${family}:${variant.weight}:${variant.style}`

const ensureCustomFontFace = (family: string, variant: CustomFontVariantMeta): Promise<void> => {
  if (typeof document === 'undefined') return Promise.resolve()

  const key = getCustomFontKey(family, variant)
  if (loadedCustomFontFaces.has(key)) return Promise.resolve()
  const existingPromise = loadingCustomFontFaces.get(key)
  if (existingPromise) return existingPromise

  try {
    const descriptors: FontFaceDescriptors = {
      weight: String(variant.weight),
      style: variant.style,
      display: 'swap',
    }
    const fontFace = new FontFace(family, `url(${variant.source})`, descriptors)
    const loadPromise = fontFace
      .load()
      .then(() => {
        document.fonts.add(fontFace)
        loadedCustomFontFaces.add(key)
        loadingCustomFontFaces.delete(key)
      })
      .catch((error) => {
        console.warn(`Failed to load custom font ${family} (${variant.weight}/${variant.style})`, error)
        loadingCustomFontFaces.delete(key)
      })

    loadingCustomFontFaces.set(key, loadPromise)
    return loadPromise
  } catch (error) {
    console.warn(`Unable to register custom font ${family}`, error)
    return Promise.resolve()
  }
}

export const useMainStore = defineStore('main', {
  state: (): MainState => ({
    canvasObject: undefined,
    clonedObject: undefined,
    hoveredObject: undefined,
    leavedObject: undefined,
    currentPoint: null,
    rightState: RightStates.ELEMENT_CANVAS,
    imageCategoryType: [],
    imageCategoryData: ImageCategoryInfo,
    illustrationCategoryType: [],
    illustrationCategoryData: ImageCategoryInfo,
    handleElementId: '', // element being operated on
    sizeMode: 0,  // template style
    unitMode: typeof window !== 'undefined'
      ? Number(localStorage.getItem('unitMode')) || 0  // unit (0=mm, 1=px, 2=inch)
      : 0,
    gridColorSelf: [[]], // custom color
    databaseId, // identifier for the current application's indexedDB database ID
    selectedTemplatesIndex: [],
    thumbnailsFocus: false, // left navigation thumbnail area focused
    drawAreaFocus: false, // editing area focused
    fontOptions: [...GOOGLE_FONT_OPTIONS],
    fontGroups: cloneDefaultFontGroups(),
    customFonts: [],
    googleFonts: GOOGLE_FONTS,
    disableHotkeys: false, // disable shortcuts
    exportType: 'image', // export panel
    lastEdit: 'editor', // left sidebar
    poolType: 'editor', // left sidebar
    poolShow: false, // show left sidebar
    isDarkMode: typeof window !== 'undefined' 
      ? localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : false,
    imageLoadingTasks: 0,
    savingProject: false,
  }),

  getters: {
    activeElementList() {
    //   const slidesStore = useSlidesStore()
    //   const currentSlide = slidesStore.currentSlide
    //   if (!currentSlide || !currentSlide.elements) return []
    },
  
    handleElement() {
    //   const slidesStore = useSlidesStore()
    //   const currentSlide = slidesStore.currentSlide
    //   if (!currentSlide || !currentSlide.elements) return null
    //   return currentSlide.elements.find(element => state.handleElementId === element.id) || null
    },

    customFontByFamily: (state) => (family: string) =>
      state.customFonts.find((font) => font.family === family),
  },

  actions: {
    rebuildFontCollections() {
      const customOptions: SystemFont[] = this.customFonts.map((font) => ({
        label: font.family,
        value: font.family,
      }))

      customOptions.sort((a, b) => a.label.localeCompare(b.label))

      const customGroups: FontGroupOption[] = customOptions.length
        ? [{ label: 'Custom Fonts', options: customOptions }]
        : []

      const baseGroups = cloneDefaultFontGroups()

      this.fontOptions = [...customOptions, ...GOOGLE_FONT_OPTIONS]
      this.fontGroups = [...customGroups, ...baseGroups]
    },

    updateCustomFonts(records: StoredCustomFont[]) {
      const families = recordsToFamilies(records)
      this.customFonts = families
      this.rebuildFontCollections()
    },

    async initializeCustomFonts() {
      try {
        const records = await getAllStoredFonts()
        this.updateCustomFonts(records)
      } catch (error) {
        console.warn('Failed to initialize custom fonts', error)
      }
    },

    async refreshCustomFonts() {
      try {
        const records = await getAllStoredFonts()
        this.updateCustomFonts(records)
      } catch (error) {
        console.warn('Failed to refresh custom fonts', error)
      }
    },

    async removeCustomFontFamily(family: string) {
      try {
        const records = await getStoredFontsByFamily(family)
        const recordsWithId = records.filter((item): item is StoredCustomFont & { id: number } => typeof item.id === 'number')
        if (!recordsWithId.length) return

        const ids = recordsWithId.map((item) => item.id)
        await deleteStoredFonts(ids)
        revokeFontObjectUrls(ids)

        for (const record of recordsWithId) {
          const key = `${record.family}:${record.weight}:${record.style}`
          loadedCustomFontFaces.delete(key)
          loadingCustomFontFaces.delete(key)
        }

        await this.refreshCustomFonts()
      } catch (error) {
        console.warn(`Failed to remove custom font family ${family}`, error)
      }
    },

    async removeCustomFontVariant(id: number) {
      try {
        const match = this.customFonts
          .flatMap((family) => family.variants.map((variant) => ({ family: family.family, variant })))
          .find((item) => item.variant.id === id)

        if (match) {
          const key = getCustomFontKey(match.family, match.variant)
          loadedCustomFontFaces.delete(key)
          loadingCustomFontFaces.delete(key)
        }

        await deleteStoredFonts([id])
        revokeFontObjectUrls([id])
        await this.refreshCustomFonts()
      } catch (error) {
        console.warn(`Failed to remove custom font variant ${id}`, error)
      }
    },

    
    setCanvasObject(canvasObject: FabricObject | undefined) {
      this.canvasObject = canvasObject as any
      // this.getFonts()
    },

    setHoveredObject(hoveredObject: FabricObject | undefined) {
      this.hoveredObject = hoveredObject as any
    },

    setLeaveddObject(leavedObject: FabricObject | undefined) {
      this.leavedObject = leavedObject as any
    },

    setActiveObject() {
      const [ canvas ] = useCanvas()
      if (!canvas) return
      const activeObject = canvas._activeObject as CanvasElement | null
    },
    // setHandleElementId(handleElementId: string) {
    //   this.handleElementId = handleElementId
    // },
    
    // setActiveGroupElementId(activeGroupElementId: string) {
    //   this.activeGroupElementId = activeGroupElementId
    // },
    
    // setHiddenElementIdList(hiddenElementIdList: string[]) {
    //   this.hiddenElementIdList = hiddenElementIdList
    // },
  
    // setCanvasDragged(isDragged: boolean) {
    //   this.canvasDragged = isDragged
    // },
    setPoolType(poolType: PoolType) {
      // if (poolType === 'editor') this.lastEdit = this.poolType
      this.poolType = poolType
    },

    setRightState(rightState: RightStates) {
      this.rightState = rightState
    },
  
    setThumbnailsFocus(isFocus: boolean) {
      this.thumbnailsFocus = isFocus
    },

    async ensureFontLoaded(family: string, variant = 'regular') {
      const customFont = this.customFonts.find((item) => item.family === family)
      if (customFont && customFont.variants.length) {
        const { weight, style } = normalizeVariantDescriptor(variant)

        const exact = customFont.variants.find(
          (item) => item.weight === weight && item.style === style,
        )
        const fallbackStyle = style === 'italic'
          ? customFont.variants.find((item) => item.weight === weight && item.style === 'normal')
          : undefined
        const fallbackWeight = customFont.variants.find((item) => item.style === style)
        const selected = exact || fallbackStyle || fallbackWeight || customFont.variants[0]

        if (selected) {
          await ensureCustomFontFace(family, selected)
          return
        }
      }

      ensureGoogleFontFaceSync(family, variant)
      await waitForGoogleFont(family, variant)
    },
    
    setExportType(type: ExportTypes) {
      this.exportType = type
    },

    setDrawAreaFocus(status: boolean) {
      this.drawAreaFocus = status
    },
  
    // setDisableHotkeysState(disable: boolean) {
    //   this.disableHotkeys = disable
    // },
  
    // setGridLineSize(size: number) {
    //   this.gridLineSize = size
    // },
  
    // setRulerState(show: boolean) {
    //   this.showRuler = show
    // },

    // setClipingImageElementId(elId: string) {
    //   this.clipingImageElementId = elId
    // },
  
    // setSelectedTableCells(cells: string[]) {
    //   this.selectedTableCells = cells
    // },
  
    // setScalingState(isScaling: boolean) {
    //   this.isScaling = isScaling
    // },
    
    updateSelectedTemplatesIndex(selectedTemplatesIndex: number[]) {
      this.selectedTemplatesIndex = selectedTemplatesIndex
    },

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      if (typeof window !== 'undefined') {
        if (this.isDarkMode) {
          document.documentElement.classList.add('dark')
          localStorage.setItem('theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('theme', 'light')
        }
        window.dispatchEvent(new Event('theme-changed'))
      }
    },

    setDarkMode(isDark: boolean) {
      this.isDarkMode = isDark
      if (typeof window !== 'undefined') {
        if (isDark) {
          document.documentElement.classList.add('dark')
          localStorage.setItem('theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('theme', 'light')
        }
        window.dispatchEvent(new Event('theme-changed'))
      }
    },

    startImageLoading() {
      this.imageLoadingTasks += 1
    },

    finishImageLoading() {
      this.imageLoadingTasks = Math.max(0, this.imageLoadingTasks - 1)
    },

    setSavingProject(value: boolean) {
      this.savingProject = value
    },

    // saveDialogForColor(colors: string[]) {
    //   this.dialogForColor = false
    //   this.colorSelfStore.push(colors)
    // },

    // setDialogForTemplate(show: boolean) {
    //   this.dialogForTemplate = show
    // },

    // setSelectPanelState(show: boolean) {
    //   this.showSelectPanel = show
    // },
  },
})