import { getGoogleFont, getGoogleFontFile, resolveGoogleFontVariant } from '@/configs/fonts'

const STYLE_ELEMENT_ID = 'google-fonts-dynamic-face'
const loadedFontFaces = new Set<string>()
const loadingPromises = new Map<string, Promise<void>>()
const fontLoadQueue: Array<{ family: string; variant: string }> = []
let isProcessingQueue = false

const parseFontWeight = (variant: string) => {
  const numeric = variant.replace('italic', '')
  if (!numeric || numeric === 'regular') return 400
  const weight = Number.parseInt(numeric, 10)
  return Number.isNaN(weight) ? 400 : weight
}

const createFontStyle = (family: string, variant: string, url: string) => {
  const fontStyle = variant.includes('italic') ? 'italic' : 'normal'
  const fontWeight = parseFontWeight(variant)
  return `@font-face { font-family: '${family}'; font-style: ${fontStyle}; font-weight: ${fontWeight}; font-display: swap; src: url('${url}') format('truetype'); }`
}

const getStyleElement = () => {
  if (typeof document === 'undefined') return undefined
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ELEMENT_ID
    style.type = 'text/css'
    document.head.appendChild(style)
  }
  return style
}

const processQueue = async () => {
  if (isProcessingQueue || fontLoadQueue.length === 0) return
  isProcessingQueue = true

  const batch = fontLoadQueue.splice(0, 5) // Process 5 at a time
  const style = getStyleElement()
  if (!style) {
    isProcessingQueue = false
    return
  }

  for (const { family, variant } of batch) {
    const key = `${family}:${variant}`
    if (loadedFontFaces.has(key)) continue

    const url = getGoogleFontFile(family, variant)
    if (!url) continue

    style.appendChild(document.createTextNode(createFontStyle(family, variant, url)))
    loadedFontFaces.add(key)
  }

  isProcessingQueue = false
  if (fontLoadQueue.length > 0) {
    requestAnimationFrame(() => processQueue())
  }
}

export const ensureGoogleFontFace = (family: string, variant = 'regular') => {
  const font = getGoogleFont(family)
  if (!font) return
  const resolvedVariant = resolveGoogleFontVariant(family, variant)
  if (!resolvedVariant) return

  const key = `${family}:${resolvedVariant}`
  if (loadedFontFaces.has(key) || loadingPromises.has(key)) return

  const url = getGoogleFontFile(family, resolvedVariant)
  if (!url) return

  // Create a promise for this font load
  const loadPromise = new Promise<void>((resolve) => {
    fontLoadQueue.push({ family, variant: resolvedVariant })
    
    // Start processing immediately if not already running
    if (!isProcessingQueue) {
      processQueue().then(() => resolve())
    } else {
      resolve()
    }
  })
  
  loadingPromises.set(key, loadPromise)
}

// Synchronous version for immediate font application
export const ensureGoogleFontFaceSync = (family: string, variant = 'regular') => {
  const font = getGoogleFont(family)
  if (!font) return
  const resolvedVariant = resolveGoogleFontVariant(family, variant)
  if (!resolvedVariant) return

  const key = `${family}:${resolvedVariant}`
  if (loadedFontFaces.has(key)) return

  const url = getGoogleFontFile(family, resolvedVariant)
  if (!url) return

  const style = getStyleElement()
  if (!style) return

  // Inject immediately, synchronously
  style.appendChild(document.createTextNode(createFontStyle(family, resolvedVariant, url)))
  loadedFontFaces.add(key)
}

export const waitForGoogleFont = async (family: string, variant = 'regular') => {
  const font = getGoogleFont(family)
  if (!font || typeof document === 'undefined' || !document.fonts) return

  const resolvedVariant = resolveGoogleFontVariant(family, variant)
  if (!resolvedVariant) return

  const fontWeight = parseFontWeight(resolvedVariant)
  try {
    await document.fonts.load(`${fontWeight} 16px "${family}"`)
  } catch (error) {
    console.warn(`Failed to load Google font ${family}`, error)
  }
}

export const fetchGoogleFontBinary = async (family: string, variant = 'regular') => {
  const url = getGoogleFontFile(family, variant)
  if (!url) return undefined
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load font ${family} (${variant}): ${response.status}`)
  }
  return response.arrayBuffer()
}
