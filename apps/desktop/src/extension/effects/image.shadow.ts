import { Image as FabricImage } from 'fabric'
import { EffectItem } from '@/types/common'

// Bake a drop-shadow effect into the image source.
export const shadowImage = async (item: EffectItem, fabricImage: FabricImage) => {
  const offsetX = item.offsetX || 0
  const offsetY = item.offsetY || 0
  const blur = item.blur || 0
  const shadowColor = item.shadowColor || 'rgba(0, 0, 0, 0.5)'

  if (blur === 0 && offsetX === 0 && offsetY === 0) return

  const w = fabricImage.width, h = fabricImage.height, src = fabricImage.getSrc()
  const canvas: HTMLCanvasElement | null = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const pad = Math.ceil(blur * 2 + Math.max(Math.abs(offsetX), Math.abs(offsetY)))
  canvas.width = w + pad * 2
  canvas.height = h + pad * 2

  const img = await addImage(src)
  if (!img) return

  // Draw the image with canvas shadow props; the shadow is painted behind it.
  ctx.save()
  ctx.shadowColor = shadowColor
  ctx.shadowBlur = blur
  ctx.shadowOffsetX = offsetX
  ctx.shadowOffsetY = offsetY
  ctx.drawImage(img, pad, pad, w, h)
  ctx.restore()

  const res = canvas.toDataURL()
  await fabricImage.setSrc(res)
  fabricImage.canvas?.renderAll()
}

const addImage = async (src: string): Promise<HTMLImageElement | undefined> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject()
    img.src = src
  })
}
